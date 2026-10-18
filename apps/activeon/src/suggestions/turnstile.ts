// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Turnstile (M13 TR-5): the script loads only when a form or an Add details box opens, never on the Now
// screen. One widget per box, action "suggest". A token is single-use and lives 300 s, so the widget is
// reset after every attempt and a fresh token is fetched for the next one.
import { TURNSTILE_ACTION } from '@idleon-forge/suggestions-worker/contract';
import { useCallback, useEffect, useRef, useState } from 'react';

export const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface RenderOptions {
  sitekey: string;
  action: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  size?: 'normal' | 'flexible' | 'compact';
  callback(token: string): void;
  'expired-callback'(): void;
  'error-callback'(): void;
}

export interface TurnstileApi {
  render(el: HTMLElement, options: RenderOptions): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;

/** Loads the Turnstile script once per page. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TURNSTILE_SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('no turnstile')));
    s.onerror = () => {
      loading = null;
      reject(new Error('turnstile blocked'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export type TurnstileState = 'loading' | 'ready' | 'blocked';

/** A widget in `ref`, its current token (null until solved), and `reset()` for after each attempt. */
export function useTurnstile(siteKey: string | null, active = true) {
  const ref = useRef<HTMLDivElement | null>(null);
  const id = useRef<string | null>(null);
  const api = useRef<TurnstileApi | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<TurnstileState>('loading');

  useEffect(() => {
    if (!siteKey || !active) return;
    let gone = false;
    loadTurnstile()
      .then((t) => {
        if (gone || !ref.current) return;
        api.current = t;
        id.current = t.render(ref.current, {
          sitekey: siteKey,
          action: TURNSTILE_ACTION,
          appearance: 'interaction-only',
          size: 'flexible',
          callback: (v) => {
            setToken(v);
            setState('ready');
          },
          'expired-callback': () => setToken(null),
          'error-callback': () => {
            setToken(null);
            setState('blocked');
          },
        });
        setState('ready');
      })
      .catch(() => !gone && setState('blocked'));
    return () => {
      gone = true;
      if (api.current && id.current) {
        try {
          api.current.remove(id.current);
        } catch {}
      }
      id.current = null;
      setToken(null);
    };
  }, [siteKey, active]);

  /** Spends the current token: the next attempt needs a new one (single use). */
  const take = useCallback((): string | null => {
    const t = token;
    setToken(null);
    if (api.current && id.current) {
      try {
        api.current.reset(id.current);
      } catch {}
    }
    return t;
  }, [token]);

  return { ref, token, state, take };
}
