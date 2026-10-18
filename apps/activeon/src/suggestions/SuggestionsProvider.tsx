// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Suggestions in the app shell (M13 FR-1, FR-9, FR-12, FR-19, TR-15). This file stays small and in the
// main chunk: it holds what is open, the toast and the "ready to send" banner. The form, Your
// suggestions, Turnstile and the Worker client load as one lazy chunk when the player opens either.

import type { SuggestionType } from '@idleon-forge/suggestions-worker/contract';
import type { ProofRing } from '@idleon-forge/sync';
import { uidHash } from '@idleon-forge/sync';
import {
  createContext,
  lazy,
  type ReactNode,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { SuggestionsConfig } from './config';
import type { ReportSource, Scene } from './context';
import { createSuggestionsStore, type OutboxItem, type SuggestionsStore } from './store';

const Panel = lazy(() => import('./Panel'));

export type OpenRequest =
  | { kind: 'suggest'; type?: SuggestionType; screen?: Scene['screen']; characterIndex?: number | null }
  | { kind: 'report'; source: ReportSource; screen: Scene['screen']; characterIndex: number | null };

export type PanelView = { view: 'form'; request: OpenRequest } | { view: 'list'; sendNow: string | null };

export interface Toast {
  text: string;
  href?: string | null;
  linkText?: string;
  /** Ends the text with a "Your suggestions" button and a full stop. */
  list?: boolean;
}

export interface SuggestionsApi {
  open(request: OpenRequest): void;
  openList(sendNow?: string | null): void;
  /** The first outbox item once a proof exists (FR-12), for the "ready to send" banner. */
  ready: OutboxItem | null;
}

const Ctx = createContext<SuggestionsApi | null>(null);

/** The Suggestions entry points, or null outside the app shell (the GitHub-link fallback then). */
export const useSuggestions = () => useContext(Ctx);

export interface SuggestionsProviderProps {
  config: SuggestionsConfig;
  /** Signed in through the live sync (FR-7); the uid only keys local storage, it is never sent. */
  uid: string | null;
  signedOut: boolean;
  proof: ProofRing;
  /** The current save and advice, read when the panel opens and again at send time (TR-9). */
  scene(): Scene;
  children: ReactNode;
  store?: SuggestionsStore;
}

export function SuggestionsProvider(props: SuggestionsProviderProps) {
  const { uid, signedOut, proof } = props;
  const store = useMemo(() => props.store ?? createSuggestionsStore(), [props.store]);
  const [panel, setPanel] = useState<PanelView | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [proofReady, setProofReady] = useState(false);

  // TR-9 and §6: one account per browser. Signing out, or in as someone else, clears the draft, the
  // outbox and the cached list (use-activeon clears the proof ring).
  useEffect(() => {
    let gone = false;
    void (async () => {
      const owner = await store.get('owner');
      if (signedOut) {
        if (owner !== null) await store.clear();
        return;
      }
      if (!uid) return;
      const h = await uidHash(uid);
      if (gone) return;
      if (owner !== null && owner !== h) await store.clear();
      if (owner !== h) await store.set('owner', h);
    })();
    return () => {
      gone = true;
    };
  }, [uid, signedOut, store]);

  useEffect(() => {
    let gone = false;
    const load = () => void store.get('outbox').then((o) => !gone && setOutbox(o));
    load();
    const off = store.subscribe(load);
    return () => {
      gone = true;
      off();
    };
  }, [store]);

  // FR-12: an outbox item becomes "ready to send" once a proof exists, in this visit or a later one.
  const waiting = outbox.length > 0 && uid !== null;
  useEffect(() => {
    if (!waiting) return setProofReady(false);
    let gone = false;
    void proof.getSignInProof().then((p) => !gone && p !== null && setProofReady(true));
    const off = proof.onProofReady(() => !gone && setProofReady(true));
    return () => {
      gone = true;
      off();
    };
  }, [waiting, proof]);

  const { scene } = props;
  const ready = proofReady && waiting && panel === null ? (outbox[0] ?? null) : null;
  const api = useMemo<SuggestionsApi>(
    () => ({
      open: (request) => {
        if (request.kind === 'report') return setPanel({ view: 'form', request });
        // The plain Suggest entry: where the player is now; Something's wrong on a broken save (§6).
        const s = scene();
        const screen = request.screen ?? s.screen;
        setPanel({
          view: 'form',
          request: {
            kind: 'suggest',
            type: request.type ?? (screen === 'other' ? 'wrong' : 'idea'),
            screen,
            characterIndex: request.characterIndex === undefined ? s.characterIndex : request.characterIndex,
          },
        });
      },
      openList: (sendNow = null) => setPanel({ view: 'list', sendNow }),
      ready,
    }),
    [scene, ready],
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 12_000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <Ctx.Provider value={api}>
      {props.children}
      {panel ? (
        <Suspense
          fallback={
            <div className="sg-overlay">
              <p className="sg-panel card small muted">Loading…</p>
            </div>
          }
        >
          <Panel
            panel={panel}
            setPanel={setPanel}
            config={props.config}
            signedIn={uid !== null}
            proof={proof}
            scene={props.scene}
            store={store}
            onToast={setToast}
          />
        </Suspense>
      ) : null}
      {toast ? (
        <div className="sg-toast" role="status">
          <p>
            {toast.text}
            {toast.list ? (
              <>
                {' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setToast(null);
                    api.openList();
                  }}
                >
                  Your suggestions
                </button>
                .
              </>
            ) : null}
            {toast.href ? (
              <>
                {' · '}
                <a href={toast.href} target="_blank" rel="noopener noreferrer">
                  {toast.linkText ?? 'View on GitHub'}
                </a>
              </>
            ) : null}
          </p>
          <button
            type="button"
            className="link-btn sg-toast-x"
            aria-label="Dismiss"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

/** FR-12: "Your suggestion is ready to send" with Send now, placed by the app shell. */
export function ReadyToSend() {
  const api = useSuggestions();
  const item = api?.ready;
  if (!api || !item) return null;
  return (
    <div className="banner suggest-ready" role="status">
      <p>Your suggestion is ready to send.</p>
      <button type="button" className="small-btn" onClick={() => api.openList(item.clientId)}>
        Send now
      </button>
    </div>
  );
}

/** Suggest as a button that opens the form, or the GitHub-issue link outside the provider. */
export function SuggestLink(props: {
  className?: string;
  fallbackHref: string;
  type?: SuggestionType;
  children: ReactNode;
}) {
  const api = useSuggestions();
  if (!api)
    return (
      <a className={props.className} href={props.fallbackHref} target="_blank" rel="noopener noreferrer">
        {props.children}
      </a>
    );
  return (
    <button
      type="button"
      className={`link-btn ${props.className ?? ''}`.trim()}
      onClick={() => api.open(props.type ? { kind: 'suggest', type: props.type } : { kind: 'suggest' })}
    >
      {props.children}
    </button>
  );
}

/** Opens Your suggestions (FR-16); nothing outside the provider. */
export function YourSuggestionsLink({ className }: { className?: string }) {
  const api = useSuggestions();
  if (!api) return null;
  return (
    <button type="button" className={`link-btn ${className ?? ''}`.trim()} onClick={() => api.openList()}>
      Your suggestions
    </button>
  );
}
