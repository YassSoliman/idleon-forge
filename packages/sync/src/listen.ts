// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Live sync: an onSnapshot listener on the save, Firestore `_data/{uid}`, plus the side reads the
// parsers need, mirroring Toolbox's firebase/index.js subscribe(). Read-only: nothing here writes.
//
// Failure rules (M1 FR-5, FR-11, FR-12, TR-8):
// - Every read returns ok, absent or error. Only names that were read and came back empty mean
//   "wrong Google account"; a read that errored is retried, never mistaken for an empty account.
// - Firestore reconnects a listener on its own after network loss and doesn't say so; when its error
//   callback fires, the listener is dead. So every listener error and every failed start-up read ends
//   that listener, and a new one starts after 2 s, 10 s, 30 s, then every 2 min. `permission-denied`
//   and `unauthenticated` are the exception: the sign-in has expired, and retrying can't help.
import type { RawSaveEnvelope, SideReadName } from '@idleon-forge/toolbox-parsers';
import { child, get, goOnline, ref } from 'firebase/database';
import { type DocumentSnapshot, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { assembleEnvelope } from './envelope';
import type { Session } from './session';

export type ReadResult<T> =
  | { status: 'ok'; value: T }
  | { status: 'absent' }
  | { status: 'error'; error: Error };

export interface SaveSnapshot {
  data: Record<string, unknown>;
  /** When the save document was created (epoch ms), if the SDK exposed it. */
  createTime: number | null;
}

/** The reads the listener makes. `firebaseSaveSource` is the real one; tests pass a fake. */
export interface SaveSource {
  readRtdb(path: string): Promise<ReadResult<unknown>>;
  readDoc(collection: string, id: string): Promise<ReadResult<Record<string, unknown>>>;
  /** Starts a listener on `_data/{uid}`; `onNext(null)` when the document doesn't exist. */
  subscribeSave(
    uid: string,
    onNext: (snap: SaveSnapshot | null) => void,
    onError: (error: Error) => void,
  ): () => void;
}

export type ListenerStatus =
  | { kind: 'connecting' }
  /** The listener is attached and has delivered at least once since it (re)started. */
  | { kind: 'live' }
  | { kind: 'reconnecting'; attempt: number; retryInMs: number; reason: string }
  /** The names read succeeded and was empty: this Google account has no IdleOn characters. */
  | { kind: 'wrong-account' }
  /** `permission-denied` or `unauthenticated`: sign in again. */
  | { kind: 'auth-expired' };

export interface SaveListener {
  /** Called on every cloud save (every ~4 min of play, or on switching character). */
  onEnvelope: (envelope: RawSaveEnvelope) => void;
  onStatus: (status: ListenerStatus) => void;
}

/** Re-subscribe delays after a dead listener or a failed start-up read (FR-12). */
export const BACKOFF_MS = [2_000, 10_000, 30_000, 120_000] as const;
/** `_vars/_vars` is re-read at most this often, and whenever the save's `CSver` changes (TR-8). */
export const SERVER_VARS_MAX_AGE_MS = 30 * 60_000;

export interface ListenDeps {
  now?: () => number;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
}

const AUTH_CODES = new Set(['permission-denied', 'unauthenticated', 'auth/user-token-expired']);

/** Whether an error means the sign-in no longer works (as opposed to the network or a server hiccup). */
export function isAuthError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === 'string' && AUTH_CODES.has(code.replace(/^firestore\//, ''))) return true;
  // The Realtime Database reports "permission_denied at /_uid/...: Client doesn't have permission".
  return error instanceof Error && /permission[_ ]denied/i.test(error.message);
}

const toError = (err: unknown): Error => (err instanceof Error ? err : new Error(String(err)));

/** RTDB returns arrays as arrays, or as `{0: .., 1: ..}` objects when there are gaps. */
const nameCount = (v: unknown): number =>
  Array.isArray(v) ? v.length : typeof v === 'object' && v !== null ? Object.keys(v).length : 0;

/** Character slots in a save: one `Lv0_<i>` key each. */
export const slotsInSave = (save: Record<string, unknown>): number =>
  Object.keys(save).filter((k) => /^Lv0_\d+$/.test(k)).length;

/**
 * Starts listening to the save and keeps it alive across listener deaths. Returns a stop function
 * that ends the listener and any pending retry at once.
 */
export function watchSave(
  source: SaveSource,
  uid: string,
  listener: SaveListener,
  deps: ListenDeps = {},
): () => void {
  const now = deps.now ?? Date.now;
  const schedule = deps.setTimeout ?? ((fn, ms) => globalThis.setTimeout(fn, ms));
  const cancel = deps.clearTimeout ?? ((h) => globalThis.clearTimeout(h as ReturnType<typeof setTimeout>));

  let stopped = false;
  let attempt = 0;
  let timer: unknown = null;
  let unsubscribe: (() => void) | null = null;
  let generation = 0;
  let latest = 0;
  let live = false;

  let charNames: unknown = null;
  let serverVars: Record<string, unknown> | null = null;
  let serverVarsReadAt = 0;
  let lastSaveVersion: unknown;

  const status = (s: ListenerStatus) => {
    if (!stopped) listener.onStatus(s);
  };

  const end = () => {
    generation++;
    live = false;
    unsubscribe?.();
    unsubscribe = null;
  };

  const fail = (error: Error) => {
    end();
    if (stopped) return;
    if (isAuthError(error)) return status({ kind: 'auth-expired' });
    const retryInMs = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)] ?? 120_000;
    attempt++;
    status({ kind: 'reconnecting', attempt, retryInMs, reason: error.message });
    timer = schedule(() => {
      timer = null;
      void start();
    }, retryInMs);
  };

  const onSnapshotNext = async (gen: number, snap: SaveSnapshot | null) => {
    if (stopped || gen !== generation) return;
    attempt = 0;
    if (!live) {
      live = true;
      status({ kind: 'live' });
    }
    if (!snap) return;
    const seq = ++latest;
    const capturedAt = now();
    const cloudsave = snap.data;
    const failed = new Set<SideReadName>();
    const note = (name: SideReadName, r: ReadResult<unknown>) => {
      if (r.status === 'error') failed.add(name);
      return r.status === 'ok' ? r.value : null;
    };

    // FR-11: a character created mid-session has no name yet.
    const namesRead = slotsInSave(cloudsave) > nameCount(charNames) ? source.readRtdb(`_uid/${uid}`) : null;
    // TR-8: the server's build changes with patches; re-read now and then, and on a new save format.
    const formatChanged = lastSaveVersion !== undefined && cloudsave.CSver !== lastSaveVersion;
    if (lastSaveVersion === undefined) lastSaveVersion = cloudsave.CSver;
    const varsStale = now() - serverVarsReadAt >= SERVER_VARS_MAX_AGE_MS || formatChanged;
    const varsRead = varsStale ? source.readDoc('_vars', '_vars') : null;

    const [companion, guildId, tournamentUser, tournamentMatch, tournamentGlobal, names, vars] =
      await Promise.all([
        source.readRtdb(`_comp/${uid}`),
        source.readRtdb(`_usgu/${uid}/g`),
        source.readRtdb(`_tournament/${uid}`),
        source.readDoc('_T_RES_UID', uid),
        source.readDoc('_TOURNAMENT', '_TOURNAMENT'),
        namesRead,
        varsRead,
      ]);
    const guildIdValue = note('guild', guildId);
    const guild = guildIdValue ? await source.readRtdb(`_guild/${String(guildIdValue)}`) : null;
    if (stopped || gen !== generation || seq !== latest) return; // a newer save arrived; it wins

    if (names?.status === 'ok') charNames = names.value;
    else if (names?.status === 'error') failed.add('charNames');
    if (vars?.status === 'ok') {
      serverVars = vars.value;
      serverVarsReadAt = now();
      lastSaveVersion = cloudsave.CSver;
    } else if (vars?.status === 'absent') {
      serverVarsReadAt = now();
      lastSaveVersion = cloudsave.CSver;
    } else if (vars?.status === 'error' && serverVars === null) failed.add('serverVars');

    const envelope = assembleEnvelope({
      cloudsave,
      charNames,
      serverVars,
      companion: note('companion', companion),
      guildId: guildIdValue,
      guild: guild ? note('guild', guild) : null,
      tournamentUser: note('tournament', tournamentUser),
      tournamentMatch: note('tournament', tournamentMatch),
      tournamentGlobal: note('tournament', tournamentGlobal),
      accountCreateTime: snap.createTime,
      capturedAt,
      failedSideReads: [...failed],
    });
    listener.onEnvelope(envelope);
  };

  const start = async () => {
    if (stopped) return;
    const gen = ++generation;
    // Bootstrap reads. The save itself is not fetched here: onSnapshot delivers it straight away.
    const [names, vars] = await Promise.all([
      source.readRtdb(`_uid/${uid}`),
      source.readDoc('_vars', '_vars'),
    ]);
    if (stopped || gen !== generation) return;
    for (const r of [names, vars]) if (r.status === 'error') return fail(r.error);
    if (names.status !== 'ok' || nameCount(names.value) === 0) {
      end();
      return status({ kind: 'wrong-account' });
    }
    charNames = names.value;
    serverVars = vars.status === 'ok' ? vars.value : null;
    serverVarsReadAt = now();
    lastSaveVersion = undefined;
    try {
      unsubscribe = source.subscribeSave(
        uid,
        (snap) => {
          onSnapshotNext(gen, snap).catch((err) => {
            if (gen === generation) fail(toError(err));
          });
        },
        (err) => {
          if (gen === generation) fail(toError(err));
        },
      );
    } catch (err) {
      fail(toError(err));
    }
  };

  status({ kind: 'connecting' });
  void start();

  return () => {
    stopped = true;
    if (timer !== null) cancel(timer);
    timer = null;
    end();
  };
}

/**
 * Firestore's web SDK does not expose a document's create time publicly; Toolbox reads the same
 * internal field. Best effort only: the parsers merely pass it through.
 */
const createTimeOf = (snap: DocumentSnapshot): number | null => {
  try {
    const internal = (snap as unknown as { _document?: { createTime?: { toTimestamp?: () => unknown } } })
      ._document;
    const ts = internal?.createTime?.toTimestamp?.() as { toMillis?: () => number } | undefined;
    const ms = ts?.toMillis?.();
    return typeof ms === 'number' && Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
};

/** The game's Firebase, read-only. */
export function firebaseSaveSource(session: Session): SaveSource {
  return {
    async readRtdb(path) {
      try {
        const snap = await get(child(ref(session.database), path));
        return snap.exists() ? { status: 'ok', value: snap.val() } : { status: 'absent' };
      } catch (err) {
        return { status: 'error', error: toError(err) };
      }
    },
    async readDoc(collection, id) {
      try {
        const snap = await getDoc(doc(session.firestore, collection, id));
        return snap.exists()
          ? { status: 'ok', value: snap.data() as Record<string, unknown> }
          : { status: 'absent' };
      } catch (err) {
        return { status: 'error', error: toError(err) };
      }
    },
    subscribeSave(uid, onNext, onError) {
      return onSnapshot(
        doc(session.firestore, '_data', uid),
        (snap) =>
          onNext(
            snap.exists()
              ? { data: snap.data() as Record<string, unknown>, createTime: createTimeOf(snap) }
              : null,
          ),
        (err) => onError(err),
      );
    },
  };
}

/** Listens to the signed-in player's save on the game's Firebase. Returns a stop function. */
export function listenToSave(session: Session, uid: string, listener: SaveListener): () => void {
  goOnline(session.database);
  return watchSave(firebaseSaveSource(session), uid, listener);
}
