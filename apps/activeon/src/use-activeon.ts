// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The app's state: sign-in, the live save listener, and parsing (in the worker), plus the paste
// fallback. Nothing here writes to the game; nothing leaves the browser except the reads themselves.
import type { AccountState } from '@idleon-forge/account-state';
import {
  type BuildMark,
  buildOf,
  cloudSaveTimeOf,
  createSession,
  type DeviceCode,
  DeviceFlowError,
  type ListenerStatus,
  listenToSave,
  onUserChanged,
  openSaveHistory,
  type PatchStatus,
  patchStatus,
  readSyncConfig,
  type SaveHistory,
  type Session,
  type SignedInUser,
  saveOutcome,
  signInWithGoogleDevice,
  signOut,
} from '@idleon-forge/sync';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { forgetSession, hadSession, rememberSession, requestPersistentStorage } from './storage';
import { createParserClient, type ParserClient } from './worker/parser-client';
import type { ParseFailureKind, ParseInput } from './worker/protocol';

export type AuthState =
  | { status: 'unconfigured'; missing: string[] }
  | { status: 'restoring' }
  | { status: 'signed-out'; error: string | null }
  | { status: 'requesting-code' }
  | { status: 'device-code'; code: DeviceCode }
  | { status: 'signed-in'; user: SignedInUser };

export type SaveSource = 'live' | 'paste';

export type SaveState =
  | { status: 'none' }
  | { status: 'waiting' }
  | { status: 'parsing'; source: SaveSource }
  | { status: 'ready'; state: AccountState; source: SaveSource }
  | {
      status: 'broken';
      kind: ParseFailureKind;
      message: string;
      source: SaveSource;
      /** The failed save's build, when the raw save had one (for the patch banner). */
      build?: BuildMark | null;
    };

/** The live listener, as the screen shows it. A sync problem never hides a roster already showing. */
export type SyncState =
  | { status: 'off' }
  | { status: 'connecting' }
  | { status: 'live' }
  | { status: 'reconnecting'; attempt: number; retryInMs: number }
  | { status: 'wrong-account' };

export interface SignOutOptions {
  /** Also clear this browser's ActiveOn data (FR-6, D4). Off by default. */
  clearData: boolean;
}

export interface ClearOptions {
  /** Also sign out after clearing (FR-23). */
  alsoSignOut: boolean;
}

/** The patch signal (FR-29, D3): the build the screen reflects, and whether to warn about it. */
export interface PatchSignal extends PatchStatus {
  build: BuildMark | null;
}

export interface ActiveOn {
  auth: AuthState;
  save: SaveState;
  sync: SyncState;
  /** The browser's own online flag (FR-28). */
  online: boolean;
  /** When the last live snapshot arrived (epoch ms, local clock), for the stale hint (FR-26). */
  lastSnapshotAt: number | null;
  /** The last save that parsed cleanly, kept while a newer one is broken. */
  lastGood: { state: AccountState; source: SaveSource } | null;
  /** A failed paste while a roster is showing: reported in the paste form, the roster stays (FR-20). */
  pasteError: string | null;
  /** This account's save history while signed in (null otherwise). Re-query when `historyVersion` moves. */
  history: SaveHistory | null;
  /** Bumped after every stored save and every clear. */
  historyVersion: number;
  /** "History can't be saved in this browser window", once, when IndexedDB is unavailable (FR-25). */
  historyNote: string | null;
  /** Whether the game patched past the parser, for the banner and the footer (FR-29, D3). */
  patch: PatchSignal | null;
  signIn(): void;
  cancelSignIn(): void;
  signOut(options: SignOutOptions): void;
  /** Clear my data (FR-23): this account's history and preferences on this browser. */
  clearMyData(options: ClearOptions): Promise<void>;
  paste(text: string): void;
}

export const HISTORY_UNAVAILABLE = "History can't be saved in this browser window.";

/** Other tabs drop their in-memory preferences when one tab clears (M10 TR-8). */
const broadcastCleared = () => {
  try {
    const channel = new BroadcastChannel('activeon');
    channel.postMessage('cleared');
    channel.close();
  } catch {}
};

export const SESSION_CLEARED = "Your browser cleared this site's data, so you were signed out.";
export const SESSION_EXPIRED = 'Your sign-in has expired. Sign in again.';
export const PASTE_INPUT_ERROR = "That doesn't look like an IdleOn save.";

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function useActiveOn(): ActiveOn {
  const config = useMemo(() => readSyncConfig(import.meta.env), []);
  const session = useMemo<Session | null>(() => (config.ok ? createSession(config.config) : null), [config]);
  const [auth, setAuth] = useState<AuthState>(() =>
    config.ok ? { status: 'restoring' } : { status: 'unconfigured', missing: config.missing },
  );
  const [save, setSaveState] = useState<SaveState>({ status: 'none' });
  const [sync, setSync] = useState<SyncState>({ status: 'off' });
  const [lastGood, setLastGood] = useState<ActiveOn['lastGood']>(null);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<number | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [history, setHistory] = useState<SaveHistory | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [historyNote, setHistoryNote] = useState<string | null>(null);
  const [verified, setVerified] = useState<BuildMark | null>(null);
  const [cleanBuild, setCleanBuild] = useState<{ commit: string; build: BuildMark | null } | null>(null);
  const historyRef = useRef<{ uid: string; history: SaveHistory } | null>(null);

  const saveRef = useRef(save);
  const setSave = useCallback((next: SaveState | ((prev: SaveState) => SaveState)) => {
    const value = typeof next === 'function' ? next(saveRef.current) : next;
    saveRef.current = value;
    setSaveState(value);
  }, []);

  const parser = useRef<ParserClient | null>(null);
  const parseSeq = useRef(0);
  const signInAbort = useRef<AbortController | null>(null);
  const stopListener = useRef<(() => void) | null>(null);
  const restoring = useRef(true);

  useEffect(() => {
    parser.current = createParserClient();
    return () => {
      parser.current?.dispose();
      parser.current = null;
    };
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  /** Stores a live save parsed at its own cloud-save time (FR-21). Never blocks the screen. */
  const store = useCallback(async (state: AccountState, input: ParseInput) => {
    const h = historyRef.current;
    if (!h || input.kind !== 'envelope') return;
    try {
      await h.history.put(h.uid, state, input.envelope);
      if (historyRef.current === h) setHistoryVersion((v) => v + 1);
    } catch {}
  }, []);

  const runParse = useCallback(
    async (input: ParseInput, source: SaveSource) => {
      const client = parser.current;
      if (!client) return;
      const seq = ++parseSeq.current;
      if (source === 'paste') setPasteError(null);
      setSave((prev) => (prev.status === 'ready' ? prev : { status: 'parsing', source }));
      // A second parse at the save's own time, only for a live save history doesn't have yet (TR-4).
      let withHistory = false;
      const h = historyRef.current;
      if (h && input.kind === 'envelope') {
        const savedAt = cloudSaveTimeOf(input.envelope);
        withHistory = savedAt !== null && !(await h.history.has(h.uid, savedAt).catch(() => true));
      }
      const result = await client.parse(input, { withHistory });
      if (!('superseded' in result) && result.verifiedBuilds) setVerified(result.verifiedBuilds);
      if (!('superseded' in result) && result.ok && result.historyState)
        void store(result.historyState, input);
      if ('superseded' in result || seq !== parseSeq.current) return; // a newer save superseded this one
      if (result.ok) {
        setSave({ status: 'ready', state: result.state, source });
        setLastGood({ state: result.state, source });
        return;
      }
      // A bad paste while a roster is showing stays in the paste form (FR-20, RT-12).
      if (source === 'paste' && saveRef.current.status === 'ready') {
        setPasteError(result.kind === 'input' ? PASTE_INPUT_ERROR : result.message);
        return;
      }
      setSave({ status: 'broken', kind: result.kind, message: result.message, source, build: result.build });
    },
    [setSave, store],
  );

  // Restore a persisted session, and follow sign-in / sign-out.
  useEffect(() => {
    if (!session) return;
    return onUserChanged(session, (user) => {
      const first = restoring.current;
      restoring.current = false;
      if (user) {
        rememberSession();
        setAuth({ status: 'signed-in', user });
        return;
      }
      // FR-4: a session we had before is gone without a sign-out (Safari's 7-day rule, cleared storage).
      const cleared = first && hadSession();
      forgetSession();
      setAuth((prev) => {
        // Keep in-flight device-code UI, and a sign-out that already carries its reason.
        if (
          prev.status === 'device-code' ||
          prev.status === 'requesting-code' ||
          prev.status === 'signed-out'
        )
          return prev;
        return { status: 'signed-out', error: cleared ? SESSION_CLEARED : null };
      });
    });
  }, [session]);

  const endLive = useCallback(() => {
    stopListener.current?.();
    stopListener.current = null;
    parseSeq.current++; // a parse still in flight can't repaint the roster
    setSync({ status: 'off' });
    setSave({ status: 'none' });
    setLastGood(null);
    setLastSnapshotAt(null);
  }, [setSave]);

  // While signed in, listen to the save.
  const uid = auth.status === 'signed-in' ? auth.user.uid : null;
  useEffect(() => {
    if (!session || !uid) return;
    let active = true;
    requestPersistentStorage();
    setSave((prev) => (prev.status === 'none' ? { status: 'waiting' } : prev));
    const onStatus = (s: ListenerStatus) => {
      if (!active) return;
      switch (s.kind) {
        case 'connecting':
          return setSync({ status: 'connecting' });
        case 'live':
          return setSync({ status: 'live' });
        case 'reconnecting':
          return setSync({ status: 'reconnecting', attempt: s.attempt, retryInMs: s.retryInMs });
        case 'wrong-account':
          return setSync({ status: 'wrong-account' });
        case 'auth-expired':
          endLive();
          forgetSession();
          setAuth({ status: 'signed-out', error: SESSION_EXPIRED });
          signOut(session).catch(() => {});
          return;
      }
    };
    const stop = listenToSave(session, uid, {
      onEnvelope: (envelope) => {
        if (!active) return;
        setLastSnapshotAt(Date.now());
        void runParse({ kind: 'envelope', envelope }, 'live');
      },
      onStatus,
    });
    stopListener.current = stop;
    return () => {
      active = false;
      stop();
      if (stopListener.current === stop) stopListener.current = null;
    };
  }, [session, uid, runParse, endLive, setSave]);

  // Open this account's save history while signed in (FR-21, FR-22).
  useEffect(() => {
    if (!uid) return;
    let active = true;
    void openSaveHistory().then((h) => {
      if (!active) return;
      historyRef.current = { uid, history: h };
      setHistory(h);
      setHistoryNote(h.persistent ? null : HISTORY_UNAVAILABLE);
    });
    return () => {
      active = false;
      historyRef.current = null;
      setHistory(null);
      setCleanBuild(null);
    };
  }, [uid]);

  // The newest build this browser parsed cleanly at the current parser pin, read once per pin, so a
  // new build's footer note doesn't vanish the moment its first clean save is stored (D3).
  const commit =
    (save.status === 'ready' ? save.state : lastGood?.state)?.diagnostics.parserPin.commit ?? null;
  useEffect(() => {
    if (!history || !uid || commit === null) return;
    if (cleanBuild?.commit === commit) return;
    let active = true;
    void history
      .cleanBuild(uid, commit)
      .catch(() => null)
      .then((build) => {
        if (active) setCleanBuild({ commit, build });
      });
    return () => {
      active = false;
    };
  }, [history, uid, commit, cleanBuild]);

  const patch = useMemo<PatchSignal | null>(() => {
    const cleanBuilds = cleanBuild?.build ? [cleanBuild.build] : [];
    if (save.status === 'ready') {
      const build = buildOf(save.state);
      return { build, ...patchStatus({ build, outcome: saveOutcome(save.state), verified, cleanBuilds }) };
    }
    if (save.status === 'broken' && save.kind !== 'input') {
      const build = save.build ?? null;
      return { build, ...patchStatus({ build, outcome: 'failed', verified, cleanBuilds }) };
    }
    return null;
  }, [save, verified, cleanBuild]);

  const signIn = useCallback(() => {
    if (!session) return;
    signInAbort.current?.abort();
    const controller = new AbortController();
    signInAbort.current = controller;
    setAuth({ status: 'requesting-code' });
    signInWithGoogleDevice(session, {
      signal: controller.signal,
      onDeviceCode: (code) => {
        if (!controller.signal.aborted) setAuth({ status: 'device-code', code });
      },
    })
      .then((user) => setAuth({ status: 'signed-in', user }))
      .catch((err) => {
        const aborted = err instanceof DeviceFlowError && err.code === 'aborted';
        setAuth({ status: 'signed-out', error: aborted ? null : message(err) });
      });
  }, [session]);

  const cancelSignIn = useCallback(() => {
    signInAbort.current?.abort();
    signInAbort.current = null;
  }, []);

  /** Deletes the signed-in account's history and preferences on this browser (FR-23). */
  const clearAccountData = useCallback(async () => {
    const h = historyRef.current;
    if (h) {
      try {
        await h.history.clear(h.uid);
      } catch {}
    }
    broadcastCleared();
    setCleanBuild(null);
    setHistoryVersion((v) => v + 1);
  }, []);

  const doSignOut = useCallback(
    ({ clearData }: SignOutOptions) => {
      if (!session) return;
      // Stop the listener first, synchronously, so a snapshot arriving before Firebase reports the
      // sign-out can't repaint the roster (FR-6, RT-23).
      endLive();
      forgetSession();
      // With the box checked, the clear runs first, while the history still knows the account (FR-6).
      const cleared = clearData ? clearAccountData() : Promise.resolve();
      void cleared.then(() =>
        signOut(session).catch((err) => setAuth({ status: 'signed-out', error: message(err) })),
      );
    },
    [session, endLive, clearAccountData],
  );

  const clearMyData = useCallback(
    async ({ alsoSignOut }: ClearOptions) => {
      await clearAccountData();
      if (alsoSignOut) doSignOut({ clearData: false });
    },
    [clearAccountData, doSignOut],
  );

  const paste = useCallback((text: string) => void runParse({ kind: 'text', text }, 'paste'), [runParse]);

  return {
    auth,
    save,
    sync,
    online,
    lastSnapshotAt,
    lastGood,
    pasteError,
    history,
    historyVersion,
    historyNote,
    patch,
    signIn,
    cancelSignIn,
    signOut: doSignOut,
    clearMyData,
    paste,
  };
}
