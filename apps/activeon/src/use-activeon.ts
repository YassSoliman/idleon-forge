// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The app's state: sign-in, the live save listener, and parsing (in the worker), plus the paste
// fallback. Nothing here writes to the game; nothing leaves the browser except the reads themselves.
import type { AccountState } from '@idleon-forge/account-state';
import {
  type BuildMark,
  buildOf,
  classifySave,
  cloudSaveTimeOf,
  createProofRing,
  createSession,
  DEFAULT_EXPECTED_RETURN_MS,
  type DeviceCode,
  DeviceFlowError,
  type HistoryEntry,
  type ListenerStatus,
  learnedExpectedReturn,
  listenToSave,
  localOffsetAt,
  onUserChanged,
  openProofStore,
  openSaveHistory,
  type PatchStatus,
  PLAY_SESSION_GAP_MS,
  type ProofRing,
  patchStatus,
  readSyncConfig,
  type SaveHistory,
  type SaveKind,
  type Session,
  type SignedInUser,
  saveOutcome,
  signInWithGoogleDevice,
  signOut,
  watchIdTokens,
} from '@idleon-forge/sync';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildInfo, liveBuildDiffers } from './now/release';
import { forgetSession, hadSession, rememberSession, requestPersistentStorage } from './storage';
import { createParserClient, type ParserClient } from './worker/parser-client';
import type { EngineCall, EngineOutcome, ParseFailureKind, ParseInput } from './worker/protocol';

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
  | {
      status: 'ready';
      state: AccountState;
      source: SaveSource;
      /** The engine's result for this state (M10 TR-6), or why it threw (FR-39). */
      result: EngineOutcome | null;
      /** Counts clean saves, so the screen can react once to each (FR-14). */
      seq: number;
      /** How this live save relates to the previous one (M1 `classifySave`, FR-14 ruling). */
      kind: SaveKind;
      /** The slot this save stamped (M1 `stampedSlot`). */
      slot: number | null;
    }
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

/** A pasted save survives the "New version ready" reload in this tab only (sessionStorage, guarded). */
const RELOAD_PASTE = 'activeon:reload-paste';

/** Keeps the pasted text for a reload; false when the browser won't keep it (the chip then warns). */
export function keepPasteForReload(text: string | null): boolean {
  if (text === null) return true;
  try {
    sessionStorage.setItem(RELOAD_PASTE, text);
    return true;
  } catch {
    return false;
  }
}

/** The pasted text a reload kept, read once and forgotten. */
export function takeKeptPaste(): string | null {
  try {
    const t = sessionStorage.getItem(RELOAD_PASTE);
    if (t !== null) sessionStorage.removeItem(RELOAD_PASTE);
    return t;
  } catch {
    return null;
  }
}

export interface ActiveOn {
  auth: AuthState;
  /** The signed-in uid, for the preference namespace (never displayed, never sent). */
  uid: string | null;
  /** Expected Return in seconds as the engine uses it: the player's choice, else learned, else 8 h (FR-27). */
  expectedReturnSeconds: number;
  /** The player's choice for this Play Session, or null for the default (TR-8). */
  setExpectedReturn(seconds: number | null): void;
  /** An Expected Return re-run is in flight ("updating…", TR-6). */
  updating: boolean;
  /** A newer ActiveOn build replaced this one's chunks (M12 TR-10). */
  updated: boolean;
  /** R11 QA: the pasted save a "New version ready" reload kept and this load parsed again; null when none. */
  restoredPaste: string | null;
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
  /** Proof of sign-in for Suggestions (M13 TR-4): `getSignInProof()`, `onProofReady(cb)`. */
  proof: ProofRing;
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
  const [chosenReturn, setChosenReturn] = useState<number | null>(null);
  const [learnedReturn, setLearnedReturn] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const historyRef = useRef<{ uid: string; history: SaveHistory } | null>(null);
  const expectedReturnSeconds = chosenReturn ?? learnedReturn ?? DEFAULT_EXPECTED_RETURN_MS / 1000;
  const returnRef = useRef(expectedReturnSeconds);
  returnRef.current = expectedReturnSeconds;
  const lastLive = useRef<AccountState | null>(null);
  const seqRef = useRef(0);
  // One ring per tab, over its own IndexedDB store; it only ever holds this account's ID tokens.
  const proof = useMemo(() => {
    const store = openProofStore();
    return createProofRing({
      store: {
        load: () => store.then((s) => s.load()),
        save: (entries) => store.then((s) => s.save(entries)),
      },
    });
  }, []);

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
    parser.current = createParserClient({ checkUpdated: liveBuildDiffers });
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
      let sessionStartedAt: number | null = null;
      let learned: number | null = null;
      // The earlier saves the engine reads (M10 TR-6): live saves only, never a paste (M1 D2).
      let earlier: HistoryEntry[] = [];
      const h = historyRef.current;
      if (h && input.kind === 'envelope') {
        const savedAt = cloudSaveTimeOf(input.envelope);
        withHistory = savedAt !== null && !(await h.history.has(h.uid, savedAt).catch(() => true));
        if (savedAt !== null) {
          // The Play Session this save belongs to (M1 TR-15): a 15-minute gap after the newest stored
          // save starts a new one at this save.
          const latest = await h.history.latest(h.uid).catch(() => null);
          const start = await h.history.sessionStart(h.uid, savedAt).catch(() => null);
          sessionStartedAt =
            latest && savedAt - latest.lastCloudSave >= PLAY_SESSION_GAP_MS
              ? savedAt
              : (start?.lastCloudSave ?? savedAt);
          earlier = await h.history.forEngine(h.uid, { before: savedAt, sessionStartedAt }).catch(() => []);
        }
        const sessions = await h.history.playSessions(h.uid).catch(() => []);
        const ms = learnedExpectedReturn({
          sessions,
          now: Date.now(),
          timeZoneOffsetMin: localOffsetAt,
        }).learnedMs;
        learned = ms === null ? null : Math.round(ms / 1000);
        setLearnedReturn(learned);
      }
      const engine: EngineCall = {
        expectedReturnSeconds: returnRef.current,
        sessionStartedAt,
        learnedExpectedReturnSeconds: learned,
        history: earlier,
        knowledgeVersion: buildInfo.knowledge,
      };
      const result = await client.parse(input, { withHistory, engine });
      if (!('superseded' in result) && result.verifiedBuilds) setVerified(result.verifiedBuilds);
      if (!('superseded' in result) && result.ok && result.historyState)
        void store(result.historyState, input);
      if ('superseded' in result || seq !== parseSeq.current) return; // a newer save superseded this one
      if (result.ok) {
        const cls =
          source === 'live'
            ? classifySave(lastLive.current, result.state)
            : { kind: 'first' as const, slot: null };
        if (source === 'live') lastLive.current = result.state;
        setSave({
          status: 'ready',
          state: result.state,
          source,
          result: result.result ?? null,
          seq: ++seqRef.current,
          kind: cls.kind,
          slot: cls.slot,
        });
        setLastGood({ state: result.state, source });
        return;
      }
      if (result.kind === 'updated') {
        setUpdated(true);
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

  // R11 QA: a pasted save kept across the "New version ready" reload is parsed again here, once the
  // parser exists. (AppBody restored it before, but a child's effects run before this hook's, so the
  // parser wasn't there yet and the save was dropped.) The text stays in a ref, so StrictMode's
  // dispose-and-recreate in development parses it again instead of losing it.
  const kept = useRef<string | null | undefined>(undefined);
  const [restoredPaste, setRestoredPaste] = useState<string | null>(null);
  useEffect(() => {
    if (kept.current === undefined) kept.current = takeKeptPaste();
    const text = kept.current;
    if (text === null) return;
    setRestoredPaste(text);
    void runParse({ kind: 'text', text }, 'paste');
  }, [runParse]);

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
    lastLive.current = null;
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
          void proof.clear();
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
  }, [session, uid, runParse, endLive, setSave, proof]);

  // Every ID token Firebase issues goes into the proof ring (M13 TR-4); nothing leaves the browser.
  useEffect(() => {
    if (!session) return;
    return watchIdTokens(session, (token) => void proof.record(token));
  }, [session, proof]);

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
      void proof.clear();
      // With the box checked, the clear runs first, while the history still knows the account (FR-6).
      const cleared = clearData ? clearAccountData() : Promise.resolve();
      void cleared.then(() =>
        signOut(session).catch((err) => setAuth({ status: 'signed-out', error: message(err) })),
      );
    },
    [session, endLive, clearAccountData, proof],
  );

  const clearMyData = useCallback(
    async ({ alsoSignOut }: ClearOptions) => {
      await clearAccountData();
      if (alsoSignOut) doSignOut({ clearData: false });
    },
    [clearAccountData, doSignOut],
  );

  const paste = useCallback((text: string) => void runParse({ kind: 'text', text }, 'paste'), [runParse]);

  const rerunSeq = useRef(0);
  const setExpectedReturn = useCallback(
    (seconds: number | null) => {
      setChosenReturn(seconds);
      const target = seconds ?? learnedReturn ?? DEFAULT_EXPECTED_RETURN_MS / 1000;
      returnRef.current = target;
      const client = parser.current;
      if (!client || saveRef.current.status !== 'ready') return;
      const seq = ++rerunSeq.current;
      setUpdating(true);
      void client.rerun(target).then((r) => {
        if (seq !== rerunSeq.current) return;
        setUpdating(false);
        if ('superseded' in r || !r.ok) return;
        setSave((prev) => (prev.status === 'ready' ? { ...prev, result: r.result } : prev));
      });
    },
    [learnedReturn, setSave],
  );

  return {
    auth,
    uid,
    expectedReturnSeconds,
    setExpectedReturn,
    updating,
    updated,
    restoredPaste,
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
    proof,
    signIn,
    cancelSignIn,
    signOut: doSignOut,
    clearMyData,
    paste,
  };
}
