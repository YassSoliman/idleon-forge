// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The app's state: sign-in, the live save listener, and parsing (in the worker), plus the paste
// fallback. Nothing here writes to the game; nothing leaves the browser except the reads themselves.
import type { AccountState } from '@idleon-forge/account-state';
import {
  createSession,
  type DeviceCode,
  DeviceFlowError,
  type ListenerStatus,
  listenToSave,
  onUserChanged,
  readSyncConfig,
  type Session,
  type SignedInUser,
  signInWithGoogleDevice,
  signOut,
} from '@idleon-forge/sync';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearLocalData,
  forgetSession,
  hadSession,
  rememberSession,
  requestPersistentStorage,
} from './storage';
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
  | { status: 'broken'; kind: ParseFailureKind; message: string; source: SaveSource };

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
  signIn(): void;
  cancelSignIn(): void;
  signOut(options: SignOutOptions): void;
  paste(text: string): void;
}

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

  const runParse = useCallback(
    async (input: ParseInput, source: SaveSource) => {
      const client = parser.current;
      if (!client) return;
      const seq = ++parseSeq.current;
      if (source === 'paste') setPasteError(null);
      setSave((prev) => (prev.status === 'ready' ? prev : { status: 'parsing', source }));
      const result = await client.parse(input);
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
      setSave({ status: 'broken', kind: result.kind, message: result.message, source });
    },
    [setSave],
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

  const doSignOut = useCallback(
    ({ clearData }: SignOutOptions) => {
      if (!session) return;
      // Stop the listener first, synchronously, so a snapshot arriving before Firebase reports the
      // sign-out can't repaint the roster (FR-6, RT-23).
      endLive();
      forgetSession();
      if (clearData) void clearLocalData();
      signOut(session).catch((err) => setAuth({ status: 'signed-out', error: message(err) }));
    },
    [session, endLive],
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
    signIn,
    cancelSignIn,
    signOut: doSignOut,
    paste,
  };
}
