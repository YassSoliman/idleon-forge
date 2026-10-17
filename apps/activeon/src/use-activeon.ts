// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The app's state: sign-in, the live save listener, and parsing (in the worker), plus the paste
// fallback. Nothing here writes to the game; nothing leaves the browser except the reads themselves.
import type { AccountState } from '@idleon-forge/account-state';
import {
  createSession,
  type DeviceCode,
  DeviceFlowError,
  listenToSave,
  onUserChanged,
  readSyncConfig,
  type Session,
  type SignedInUser,
  signInWithGoogleDevice,
  signOut,
} from '@idleon-forge/sync';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  | { status: 'broken'; kind: ParseFailureKind | 'sync'; message: string; source: SaveSource };

export interface ActiveOn {
  auth: AuthState;
  save: SaveState;
  /** The last save that parsed cleanly, kept while a newer one is broken. */
  lastGood: { state: AccountState; source: SaveSource } | null;
  signIn(): void;
  cancelSignIn(): void;
  signOut(): void;
  paste(text: string): void;
}

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function useActiveOn(): ActiveOn {
  const config = useMemo(() => readSyncConfig(import.meta.env), []);
  const session = useMemo<Session | null>(() => (config.ok ? createSession(config.config) : null), [config]);
  const [auth, setAuth] = useState<AuthState>(() =>
    config.ok ? { status: 'restoring' } : { status: 'unconfigured', missing: config.missing },
  );
  const [save, setSave] = useState<SaveState>({ status: 'none' });
  const [lastGood, setLastGood] = useState<ActiveOn['lastGood']>(null);

  const parser = useRef<ParserClient | null>(null);
  const parseSeq = useRef(0);
  const signInAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    parser.current = createParserClient();
    return () => {
      parser.current?.dispose();
      parser.current = null;
    };
  }, []);

  const runParse = useCallback(async (input: ParseInput, source: SaveSource) => {
    const client = parser.current;
    if (!client) return;
    const seq = ++parseSeq.current;
    setSave((prev) => (prev.status === 'ready' ? prev : { status: 'parsing', source }));
    const result = await client.parse(input);
    if (seq !== parseSeq.current) return; // a newer save superseded this one
    if (result.ok) {
      setSave({ status: 'ready', state: result.state, source });
      setLastGood({ state: result.state, source });
    } else {
      setSave({ status: 'broken', kind: result.kind, message: result.message, source });
    }
  }, []);

  // Restore a persisted session, and follow sign-in / sign-out.
  useEffect(() => {
    if (!session) return;
    return onUserChanged(session, (user) =>
      setAuth((prev) => {
        if (user) return { status: 'signed-in', user };
        // Signed out; keep any in-flight device-code UI.
        return prev.status === 'device-code' || prev.status === 'requesting-code'
          ? prev
          : { status: 'signed-out', error: null };
      }),
    );
  }, [session]);

  // While signed in, listen to the save.
  const uid = auth.status === 'signed-in' ? auth.user.uid : null;
  useEffect(() => {
    if (!session || !uid) return;
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    setSave((prev) => (prev.status === 'none' ? { status: 'waiting' } : prev));
    listenToSave(session, uid, {
      onEnvelope: (envelope) => {
        if (!cancelled) void runParse({ kind: 'envelope', envelope }, 'live');
      },
      onError: (err) => {
        if (!cancelled) setSave({ status: 'broken', kind: 'sync', message: message(err), source: 'live' });
      },
    })
      .then((unsub) => {
        if (cancelled) unsub();
        else unsubscribe = unsub;
      })
      .catch((err) => {
        if (!cancelled) setSave({ status: 'broken', kind: 'sync', message: message(err), source: 'live' });
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [session, uid, runParse]);

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

  const doSignOut = useCallback(() => {
    if (!session) return;
    parseSeq.current++;
    setSave({ status: 'none' });
    setLastGood(null);
    signOut(session).catch((err) => setAuth({ status: 'signed-out', error: message(err) }));
  }, [session]);

  const paste = useCallback((text: string) => void runParse({ kind: 'text', text }, 'paste'), [runParse]);

  return { auth, save, lastGood, signIn, cancelSignIn, signOut: doSignOut, paste };
}
