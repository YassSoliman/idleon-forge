// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Save history (M1 FR-21–FR-25, TR-14–TR-16): 30 days of this account's live saves, kept in this
// browser's IndexedDB and never sent anywhere. One small index row per save answers Play Sessions and
// gaps without loading states; full Account States are kept only where comparisons need them; a gzip
// of the raw save is kept on about one record per Play Session so a later parser fix can re-derive.
//
// Records are keyed by [uid, lastCloudSave], so a cloud save delivered twice (two tabs, a re-sent
// snapshot) is stored once, and two Google accounts on one browser never see each other's history.
// When IndexedDB can't be opened (some private windows), the same store runs in memory for the tab.
import type { AccountState } from '@idleon-forge/account-state';
import type { RawSaveEnvelope } from '@idleon-forge/toolbox-parsers';
import { compactState, type EngineHistoryOptions, selectEngineHistory } from './engine-history';
import { type BuildMark, buildOf, saveOutcome } from './patch';
import { stampedSlot } from './save-kind';

export const HISTORY_DB = 'activeon';
export const HISTORY_DB_VERSION = 1;
/** History is kept this long (FR-21). */
export const HISTORY_RETENTION_MS = 30 * 24 * 3600 * 1000;
/** A gap of this much or more between cloud saves starts a new Play Session (TR-15). */
export const PLAY_SESSION_GAP_MS = 15 * 60 * 1000;
/** Below this much free quota, raw copies other than the newest are dropped (TR-16). */
export const LOW_QUOTA_BYTES = 100 * 1024 * 1024;
/** How far back compaction looks: every retention rule depends only on a save's neighbours. */
const COMPACT_WINDOW_MS = 6 * 3600 * 1000;
/** Every ActiveOn localStorage key starts with this; per-account ones with `activeon:<uidHash>:`. */
export const STORAGE_PREFIX = 'activeon:';

/** One stored snapshot. Key: [uid, lastCloudSave]. */
export interface SaveRecord {
  /** Firebase uid; stays on this device. */
  uid: string;
  /** Epoch ms, from the save itself. */
  lastCloudSave: number;
  /** Epoch ms, local clock. */
  receivedAt: number;
  schemaVersion: number;
  /** Parsed at `now = lastCloudSave`: the account as it was at that save. */
  state: AccountState;
  /** gzip of the raw envelope's JSON; only on the newest record and the last of each Play Session. */
  rawGzip?: Blob;
}

/** One line per stored save, for Play Sessions and gaps without loading states. */
export interface SaveIndexRow {
  uid: string;
  lastCloudSave: number;
  receivedAt: number;
  /** A full `SaveRecord` is still stored for this save. */
  hasState: boolean;
  /** That record still carries `rawGzip`. */
  hasRaw: boolean;
  /** The save's `lastPlayedCharacterIndex`. */
  lastPlayedCharacterIndex: number | null;
  /** The character this save stamped (`stampedSlot`): the one left on a switch, else the one played. */
  stampedSlot: number | null;
}

/** What the engine and M11's `DetectorContext.history` receive: oldest first, at most 30 days. */
export type HistoryEntry = Pick<SaveRecord, 'lastCloudSave' | 'receivedAt' | 'state'>;

export interface PlaySession {
  /** `lastCloudSave` of its first save. */
  start: number;
  /** `lastCloudSave` of its last save. */
  end: number;
  saves: number;
}

/** Per account: the newest build and save format parsed cleanly, per parser pin commit (FR-29). */
export interface HistoryMeta {
  uid: string;
  clean: Record<string, BuildMark>;
}

export interface SaveHistory {
  /** False when IndexedDB was unavailable and history lives in memory for this tab (FR-25). */
  readonly persistent: boolean;
  /**
   * Stores one live, cleanly parsed (not hard-failed) Account State with its raw envelope.
   * Idempotent per [uid, lastCloudSave]. Pasted states and states without a save time are ignored.
   */
  put(uid: string, state: AccountState, raw: RawSaveEnvelope): Promise<void>;
  /** Whether this cloud save is already stored (so the UI can skip the history parse). */
  has(uid: string, lastCloudSave: number): Promise<boolean>;
  latest(uid: string): Promise<SaveRecord | null>;
  /** The newest stored state saved before `before`: "since last time". */
  previous(uid: string, before: number): Promise<SaveRecord | null>;
  /** The first save of the Play Session that `at` falls in (or the last one that started before it). */
  sessionStart(uid: string, at: number): Promise<SaveRecord | null>;
  /** Every stored state saved at or after `from`, oldest first. */
  since(uid: string, from: number): Promise<SaveRecord[]>;
  /**
   * The earlier saves the engine reads for the save at `before` (M10 TR-6), oldest first, compact
   * except the Play Session's boundary saves (`engineHistoryOf`). Compact copies are cached per save.
   */
  forEngine(uid: string, options: EngineHistoryOptions): Promise<HistoryEntry[]>;
  /** Play Sessions, oldest first; with `from`, only those that ended at or after it. */
  playSessions(uid: string, from?: number): Promise<PlaySession[]>;
  /** The median of the last 10 gaps between Play Sessions, in seconds; null with fewer than 3 gaps. */
  usualGapSeconds(uid: string): Promise<number | null>;
  /** The newest clean build recorded at this parser pin commit, or null. */
  cleanBuild(uid: string, parserCommit: string): Promise<BuildMark | null>;
  /** Deletes this account's history and its `activeon:<uidHash>:` preferences (FR-23). */
  clear(uid: string): Promise<void>;
  /** Drops everything older than 30 days, for every account. Runs on open. */
  prune(now: number): Promise<void>;
}

// --- storage backends ---------------------------------------------------------------------------

/** The operations the history needs from storage, so IndexedDB and memory share one implementation. */
interface Backend {
  /** Index rows, oldest first; with `from`, only those saved at or after it. */
  rows(uid: string, from?: number): Promise<SaveIndexRow[]>;
  row(uid: string, t: number): Promise<SaveIndexRow | undefined>;
  record(uid: string, t: number): Promise<SaveRecord | undefined>;
  write(rows: SaveIndexRow[], records: SaveRecord[], deleteRecords: number[], uid: string): Promise<void>;
  meta(uid: string): Promise<HistoryMeta | undefined>;
  putMeta(meta: HistoryMeta): Promise<void>;
  clear(uid: string): Promise<void>;
  pruneBefore(cutoff: number): Promise<void>;
}

const keyOf = (uid: string, t: number) => `${uid}\u0000${t}`;
const byTime = (a: { lastCloudSave: number }, b: { lastCloudSave: number }) =>
  a.lastCloudSave - b.lastCloudSave;

function memoryBackend(): Backend {
  const rows = new Map<string, SaveIndexRow>();
  const records = new Map<string, SaveRecord>();
  const metas = new Map<string, HistoryMeta>();
  return {
    async rows(uid, from = -Infinity) {
      return [...rows.values()].filter((r) => r.uid === uid && r.lastCloudSave >= from).sort(byTime);
    },
    async row(uid, t) {
      return rows.get(keyOf(uid, t));
    },
    async record(uid, t) {
      return records.get(keyOf(uid, t));
    },
    async write(newRows, newRecords, deletes, uid) {
      for (const r of newRows) rows.set(keyOf(r.uid, r.lastCloudSave), { ...r });
      for (const r of newRecords) records.set(keyOf(r.uid, r.lastCloudSave), r);
      for (const t of deletes) records.delete(keyOf(uid, t));
    },
    async meta(uid) {
      return metas.get(uid);
    },
    async putMeta(meta) {
      metas.set(meta.uid, meta);
    },
    async clear(uid) {
      for (const [k, r] of rows) if (r.uid === uid) rows.delete(k);
      for (const [k, r] of records) if (r.uid === uid) records.delete(k);
      metas.delete(uid);
    },
    async pruneBefore(cutoff) {
      for (const [k, r] of rows) if (r.lastCloudSave < cutoff) rows.delete(k);
      for (const [k, r] of records) if (r.lastCloudSave < cutoff) records.delete(k);
    },
  };
}

const INDEX = 'saveIndex';
const SAVES = 'saves';
const META = 'meta';

const done = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const finished = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('History transaction aborted.'));
  });

function openDb(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = factory.open(HISTORY_DB, HISTORY_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const key = ['uid', 'lastCloudSave'];
      if (!db.objectStoreNames.contains(INDEX)) {
        db.createObjectStore(INDEX, { keyPath: key }).createIndex('byTime', 'lastCloudSave');
      }
      if (!db.objectStoreNames.contains(SAVES)) {
        const saves = db.createObjectStore(SAVES, { keyPath: key });
        saves.createIndex('byReceived', ['uid', 'receivedAt']);
        saves.createIndex('byTime', 'lastCloudSave');
      }
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'uid' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB could not be opened.'));
    req.onblocked = () => reject(new Error('IndexedDB is blocked by another tab.'));
  });
}

function idbBackend(db: IDBDatabase): Backend {
  const range = (uid: string, from = -Infinity) => IDBKeyRange.bound([uid, from], [uid, Infinity]);
  const deleteOlder = (store: IDBObjectStore, cutoff: number) =>
    new Promise<void>((resolve, reject) => {
      const req = store.index('byTime').openCursor(IDBKeyRange.upperBound(cutoff, true));
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve();
        cursor.delete();
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  return {
    async rows(uid, from) {
      const tx = db.transaction(INDEX, 'readonly');
      return (await done(tx.objectStore(INDEX).getAll(range(uid, from)))) as SaveIndexRow[];
    },
    async row(uid, t) {
      const tx = db.transaction(INDEX, 'readonly');
      return (await done(tx.objectStore(INDEX).get([uid, t]))) as SaveIndexRow | undefined;
    },
    async record(uid, t) {
      const tx = db.transaction(SAVES, 'readonly');
      return (await done(tx.objectStore(SAVES).get([uid, t]))) as SaveRecord | undefined;
    },
    async write(rows, records, deletes, uid) {
      const tx = db.transaction([INDEX, SAVES], 'readwrite');
      const index = tx.objectStore(INDEX);
      const saves = tx.objectStore(SAVES);
      for (const r of rows) index.put(r);
      for (const r of records) saves.put(r);
      for (const t of deletes) saves.delete([uid, t]);
      await finished(tx);
    },
    async meta(uid) {
      const tx = db.transaction(META, 'readonly');
      return (await done(tx.objectStore(META).get(uid))) as HistoryMeta | undefined;
    },
    async putMeta(meta) {
      const tx = db.transaction(META, 'readwrite');
      tx.objectStore(META).put(meta);
      await finished(tx);
    },
    async clear(uid) {
      const tx = db.transaction([INDEX, SAVES, META], 'readwrite');
      tx.objectStore(INDEX).delete(range(uid));
      tx.objectStore(SAVES).delete(range(uid));
      tx.objectStore(META).delete(uid);
      await finished(tx);
    },
    async pruneBefore(cutoff) {
      const tx = db.transaction([INDEX, SAVES], 'readwrite');
      await Promise.all([
        deleteOlder(tx.objectStore(INDEX), cutoff),
        deleteOlder(tx.objectStore(SAVES), cutoff),
      ]);
      await finished(tx);
    },
  };
}

// --- helpers ------------------------------------------------------------------------------------

/** First 12 hex characters of SHA-256(uid): the preference namespace (M10 TR-8). No uid in keys. */
export async function uidHash(uid: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(uid));
  return Array.from(new Uint8Array(digest).slice(0, 6), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The namespace of one account's preferences in localStorage. */
export const preferencePrefix = async (uid: string) => `${STORAGE_PREFIX}${await uidHash(uid)}:`;

/**
 * The cloud-save time of a raw envelope (epoch ms), read straight from `TimeAway.GlobalTime` the way
 * the adapter reads it, so the UI can tell whether a save is new to history before parsing it.
 */
export function cloudSaveTimeOf(envelope: RawSaveEnvelope): number | null {
  let timeAway: unknown = envelope.data?.TimeAway;
  if (typeof timeAway === 'string') {
    try {
      timeAway = JSON.parse(timeAway);
    } catch {
      return null;
    }
  }
  if (typeof timeAway !== 'object' || timeAway === null) return null;
  const g = Number((timeAway as Record<string, unknown>).GlobalTime);
  return Number.isFinite(g) ? Math.round(g * 1000) : null;
}

async function gzip(text: string): Promise<Blob | undefined> {
  if (typeof CompressionStream === 'undefined') return undefined;
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return await new Response(stream).blob();
  } catch {
    return undefined;
  }
}

/** The raw envelope a record was parsed from, or null when its raw copy was not kept. */
export async function readRaw(record: SaveRecord): Promise<RawSaveEnvelope | null> {
  if (!record.rawGzip) return null;
  const stream = record.rawGzip.stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text()) as RawSaveEnvelope;
}

/** Splits index rows (oldest first) into Play Sessions, as index ranges. */
function sessionRanges(rows: SaveIndexRow[]): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    const last = ranges.at(-1);
    if (!prev || !last || row.lastCloudSave - prev.lastCloudSave >= PLAY_SESSION_GAP_MS) ranges.push([i, i]);
    else last[1] = i;
  });
  return ranges;
}

/** Play Sessions from index rows (oldest first). Exported for the Expected Return and tests. */
export function toPlaySessions(rows: SaveIndexRow[]): PlaySession[] {
  return sessionRanges(rows).map(([a, b]) => ({
    start: rows[a]?.lastCloudSave ?? 0,
    end: rows[b]?.lastCloudSave ?? 0,
    saves: b - a + 1,
  }));
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
};

/** The median of the last 10 gaps between Play Sessions (seconds), or null with fewer than 3 gaps. */
export function usualGap(sessions: PlaySession[]): number | null {
  const gaps = sessions.slice(1).map((s, i) => s.start - (sessions[i]?.end ?? s.start));
  if (gaps.length < 3) return null;
  return Math.round(median(gaps.slice(-10)) / 1000);
}

/** Within one run of autosaves of the same character, one full state per clock hour is kept. */
export const AUTOSAVE_KEEP_EVERY_MS = 3600 * 1000;

/**
 * Which saves keep their full state and their raw copy (TR-14, revised by the 2026-10-17 live
 * recording: an autosave stamps the current character every few minutes, a switch save stamps the
 * character just left, and characters away on AFK are never saved). Full states are kept for:
 *  1. the newest save;
 *  2. every leave event: a save whose stamped slot differs from the previous save's. Characters away
 *     are frozen, so it holds the left character's state at the start of its AFK stretch, which M3
 *     TR-6 compares with the next leave of the same character for food and gather rates;
 *  3. the first and last save of each Play Session;
 *  4. of a run of saves stamping the same character, the last (the switch save that left it, or the
 *     newest), plus, once the run has lasted an hour, the first save in each clock hour.
 * Raw copies: the newest save and the last save of each Play Session, or only the newest when quota is
 * low (TR-16). Every rule looks only at a save's neighbours, so a window of recent rows decides
 * everything except its first row.
 */
function retention(rows: SaveIndexRow[], lowQuota: boolean): { state: Set<number>; raw: Set<number> } {
  const state = new Set<number>();
  const raw = new Set<number>();
  const hour = (t: number) => Math.floor(t / AUTOSAVE_KEEP_EVERY_MS);
  // Where each row's run began (a row index), or -1 when the run began before the window.
  const runStart: number[] = [];
  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    const same =
      prev !== undefined &&
      row.lastCloudSave - prev.lastCloudSave < PLAY_SESSION_GAP_MS &&
      prev.stampedSlot === row.stampedSlot;
    runStart.push(!prev ? -1 : same ? (runStart[i - 1] ?? -1) : i);
  });
  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    const next = rows[i + 1];
    const t = row.lastCloudSave;
    const startsSession = !prev || t - prev.lastCloudSave >= PLAY_SESSION_GAP_MS;
    const endsSession = !next || next.lastCloudSave - t >= PLAY_SESSION_GAP_MS;
    const startsRun = startsSession || prev?.stampedSlot !== row.stampedSlot;
    const endsRun = endsSession || next?.stampedSlot !== row.stampedSlot;
    // At most one more per clock hour, once a run has lasted an hour (a run that began before the
    // window has: the window is 6 h long).
    const began = runStart[i] ?? -1;
    const longRun = began === -1 || t - (rows[began]?.lastCloudSave ?? t) >= AUTOSAVE_KEEP_EVERY_MS;
    const newHour = prev !== undefined && longRun && hour(prev.lastCloudSave) !== hour(t);
    if (!next || startsSession || endsSession || startsRun || endsRun || newHour) state.add(t);
    if (!next || (endsSession && !lowQuota)) raw.add(t);
  });
  return { state, raw };
}

// --- the store ----------------------------------------------------------------------------------

export interface OpenHistoryOptions {
  /** IndexedDB to use; defaults to the global one. `null` forces the in-memory store. */
  indexedDB?: IDBFactory | null;
  /** Where preferences live, cleared by `clear(uid)`; defaults to localStorage when available. */
  storage?: Pick<Storage, 'length' | 'key' | 'removeItem'> | null;
  /** Free-quota check (TR-16); defaults to `navigator.storage.estimate()`. */
  estimate?: () => Promise<{ quota?: number; usage?: number } | undefined>;
  /** Local clock (epoch ms). */
  clock?: () => number;
}

const defaultStorage = (): OpenHistoryOptions['storage'] => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

const defaultEstimate = async () => {
  try {
    return await navigator.storage?.estimate?.();
  } catch {
    return undefined;
  }
};

/**
 * Opens this browser's save history, pruned to 30 days. Never throws: without IndexedDB it returns an
 * in-memory history with `persistent: false`, and the UI says so once (FR-25).
 */
export async function openSaveHistory(options: OpenHistoryOptions = {}): Promise<SaveHistory> {
  const clock = options.clock ?? Date.now;
  let factory: IDBFactory | null;
  try {
    factory = options.indexedDB === undefined ? (globalThis.indexedDB ?? null) : options.indexedDB;
  } catch {
    factory = null;
  }
  let backend: Backend;
  let persistent = false;
  try {
    if (!factory) throw new Error('no IndexedDB');
    backend = idbBackend(await openDb(factory));
    persistent = true;
  } catch {
    backend = memoryBackend();
  }
  const history = createHistory(backend, persistent, {
    storage: options.storage === undefined ? defaultStorage() : options.storage,
    estimate: options.estimate ?? defaultEstimate,
    clock,
  });
  try {
    await history.prune(clock());
  } catch {}
  return history;
}

function createHistory(
  backend: Backend,
  persistent: boolean,
  deps: {
    storage: OpenHistoryOptions['storage'];
    estimate: NonNullable<OpenHistoryOptions['estimate']>;
    clock: () => number;
  },
): SaveHistory {
  const stored = async (uid: string, rows: SaveIndexRow[]) => {
    const out: SaveRecord[] = [];
    for (const row of rows) {
      if (!row.hasState) continue;
      const r = await backend.record(uid, row.lastCloudSave);
      if (r) out.push(r);
    }
    return out;
  };
  const first = async (uid: string, rows: SaveIndexRow[]) => (await stored(uid, rows))[0] ?? null;
  /** Compact copies for `forEngine`, per account and save. A stored state never changes once written. */
  const compactCache = new Map<string, Map<number, HistoryEntry>>();

  const lowQuota = async () => {
    try {
      const e = await deps.estimate();
      return e?.quota !== undefined && e.quota - (e.usage ?? 0) < LOW_QUOTA_BYTES;
    } catch {
      return false;
    }
  };

  /**
   * Brings stored states and raw copies in line with `retention`, touching only what changed. Each
   * rule depends only on a save's neighbours, so it reads the rows of the last few hours around the
   * new save and leaves the first one (whose predecessor is outside the window) alone.
   */
  const compact = async (uid: string, t: number) => {
    let rows = await backend.rows(uid, t - COMPACT_WINDOW_MS);
    if (rows.length < 3) rows = await backend.rows(uid, t - HISTORY_RETENTION_MS);
    const keep = retention(rows, await lowQuota());
    const changedRows: SaveIndexRow[] = [];
    const rewritten: SaveRecord[] = [];
    const deletes: number[] = [];
    const stripRaw: SaveIndexRow[] = [];
    rows.forEach((row, i) => {
      const at = row.lastCloudSave;
      // The first row's predecessor may be outside the window, so only its raw copy (which depends on
      // what follows it) is decided here; its state was decided when it was not first.
      if (i > 0 && row.hasState && !keep.state.has(at)) {
        deletes.push(at);
        changedRows.push({ ...row, hasState: false, hasRaw: false });
      } else if (row.hasState && row.hasRaw && !keep.raw.has(at)) {
        stripRaw.push(row);
      }
    });
    for (const row of stripRaw) {
      const record = await backend.record(uid, row.lastCloudSave);
      if (record) {
        const { rawGzip: _drop, ...rest } = record;
        rewritten.push(rest);
      }
      changedRows.push({ ...row, hasRaw: false });
    }
    if (changedRows.length > 0) await backend.write(changedRows, rewritten, deletes, uid);
  };

  const recordClean = async (uid: string, state: AccountState) => {
    if (saveOutcome(state) !== 'clean') return;
    const commit = state.diagnostics.parserPin.commit;
    const meta = (await backend.meta(uid)) ?? { uid, clean: {} };
    const prev = meta.clean[commit];
    const b = buildOf(state);
    const max = (x: number | null | undefined, y: number | null) =>
      x === null || x === undefined ? y : y === null ? x : Math.max(x, y);
    const next: BuildMark = {
      serverBuild: max(prev?.serverBuild, b.serverBuild),
      saveVersion: max(prev?.saveVersion, b.saveVersion),
    };
    if (prev && prev.serverBuild === next.serverBuild && prev.saveVersion === next.saveVersion) return;
    await backend.putMeta({ uid, clean: { ...meta.clean, [commit]: next } });
  };

  return {
    persistent,

    async put(uid, state, raw) {
      const t = state.account.lastCloudSave;
      if (t === null || state.diagnostics.source !== 'live') return; // pastes are never stored (D2)
      if (await backend.row(uid, t)) return;
      const rawGzip = await gzip(JSON.stringify(raw));
      const receivedAt = deps.clock();
      const record: SaveRecord = {
        uid,
        lastCloudSave: t,
        receivedAt,
        schemaVersion: state.schemaVersion,
        state,
        ...(rawGzip ? { rawGzip } : {}),
      };
      const row: SaveIndexRow = {
        uid,
        lastCloudSave: t,
        receivedAt,
        hasState: true,
        hasRaw: rawGzip !== undefined,
        lastPlayedCharacterIndex: state.lastPlayedCharacterIndex,
        stampedSlot: stampedSlot(state),
      };
      await backend.write([row], [record], [], uid);
      await recordClean(uid, state);
      await compact(uid, t);
    },

    async has(uid, lastCloudSave) {
      return (await backend.row(uid, lastCloudSave)) !== undefined;
    },

    async latest(uid) {
      const rows = (await backend.rows(uid)).filter((r) => r.hasState);
      return first(uid, rows.slice(-1));
    },

    async previous(uid, before) {
      const rows = (await backend.rows(uid)).filter((r) => r.hasState && r.lastCloudSave < before);
      return first(uid, rows.slice(-1));
    },

    async sessionStart(uid, at) {
      const rows = await backend.rows(uid);
      const ranges = sessionRanges(rows).filter(([a]) => (rows[a]?.lastCloudSave ?? Infinity) <= at);
      const range = ranges.at(-1);
      const row = range ? rows[range[0]] : undefined;
      return row ? first(uid, [row]) : null;
    },

    async since(uid, from) {
      return stored(
        uid,
        (await backend.rows(uid)).filter((r) => r.lastCloudSave >= from),
      );
    },

    async forEngine(uid, options) {
      const rows = (await backend.rows(uid)).filter((r) => r.hasState);
      const { kept, whole } = selectEngineHistory(
        rows.map((r) => r.lastCloudSave),
        options,
      );
      const cache = compactCache.get(uid) ?? new Map<number, HistoryEntry>();
      compactCache.set(uid, cache);
      const out: HistoryEntry[] = [];
      for (const t of kept) {
        const hit = whole.has(t) ? undefined : cache.get(t);
        if (hit) {
          out.push(hit);
          continue;
        }
        const r = await backend.record(uid, t);
        if (!r) continue;
        const entry = { lastCloudSave: t, receivedAt: r.receivedAt, state: compactState(r.state) };
        cache.set(t, entry);
        out.push(whole.has(t) ? { lastCloudSave: t, receivedAt: r.receivedAt, state: r.state } : entry);
      }
      const live = new Set(kept);
      for (const t of cache.keys()) if (!live.has(t)) cache.delete(t);
      return out;
    },

    async playSessions(uid, from) {
      const sessions = toPlaySessions(await backend.rows(uid));
      return from === undefined ? sessions : sessions.filter((s) => s.end >= from);
    },

    async usualGapSeconds(uid) {
      return usualGap(toPlaySessions(await backend.rows(uid)));
    },

    async cleanBuild(uid, parserCommit) {
      return (await backend.meta(uid))?.clean[parserCommit] ?? null;
    },

    async clear(uid) {
      compactCache.delete(uid);
      await backend.clear(uid);
      const store = deps.storage;
      if (!store) return;
      const prefix = await preferencePrefix(uid);
      try {
        const keys = Array.from({ length: store.length }, (_, i) => store.key(i)).filter(
          (k): k is string => k?.startsWith(prefix) ?? false,
        );
        for (const k of keys) store.removeItem(k);
      } catch {}
    },

    async prune(now) {
      await backend.pruneBefore(now - HISTORY_RETENTION_MS);
    },
  };
}
