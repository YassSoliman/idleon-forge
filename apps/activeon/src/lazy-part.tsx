// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Lazy chunks for the views that aren't the Now screen: the character page's tabs, the Characters and
// Systems places, the System pages and their bodies, and the Timeline (main-chunk budget, M12 TR-12).
//
// The pattern, in one line per view:
//   export const BuildTab = lazyPart(() => import('./BuildView'), (m) => m.BuildTab);
// and render it inside a <Suspense fallback={<Loading />}> (Focus, Shell and SystemPage have one).
// A `lazyPart` is a React.lazy component that also renders the loaded module synchronously once it is
// in memory, so a view that has loaded once never shows the loading line again. `preload()` fetches
// it early (Shell prefetches every part when the browser is idle; tests await `preloadParts()`).
// While a chunk loads, a polite line is read at once and our walking blob shows only after 400 ms
// (M21 TR-13, D-11); a failed chunk shows the G3 line (the PartFailed atom) with its retry.
// Vite emits each chunk under assets/, so the CSP's `script-src 'self'` covers them unchanged.
//
// A chunk that fails to load (offline, a new deploy) never takes the whole app (R9 QA P1-1). Each part
// carries its own boundary: "Couldn't load this part" with Try again (G3), in place of the view only, so the
// navigation stays and no advice from a half-loaded view is shown. Chromium caches a failed `import()`
// for the life of the page, so calling the importer again never re-requests the chunk. `retryable`
// remembers the failed chunk's URL and imports it again as `<url>?retry=N`, a new module URL the
// browser does fetch. If that fails too (a failed shared chunk stays cached), Retry reloads the page
// once, guarded by a sessionStorage stamp so it can never loop.
import { PART_WORDS } from '@idleon-forge/engine/now';
import { Component, type ComponentType, lazy, type ReactNode, useState } from 'react';
import { PartFailed, Loading as Waiting } from './design/atoms/States';

export interface LazyPart<P> {
  (props: P): React.ReactNode;
  preload(): Promise<ComponentType<P>>;
}

const parts: Array<() => Promise<unknown>> = [];

/** Errors that come from fetching a chunk, as opposed to a view that threw while rendering. */
const loadErrors = new WeakSet<object>();
const LOAD_MESSAGE =
  /dynamically imported module|Importing a module script failed|Unable to preload CSS|error loading dynamically/i;

function markLoadError(e: unknown): unknown {
  if (e && typeof e === 'object') loadErrors.add(e);
  return e;
}

export function isLoadError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  return loadErrors.has(e) || (e instanceof Error && LOAD_MESSAGE.test(e.message));
}

// Vite's import helper fires `vite:preloadError` for every failed lazy import (and a failed CSS
// preload) before it rejects. We mark the error so a part's boundary knows it is a load failure, and
// let it reject as usual (no preventDefault): the boundary owns the retry. We never reload here, since
// a reload while offline would drop a pasted save and could loop.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (e) => {
    markLoadError((e as Event & { payload?: unknown }).payload);
  });
}

/** The chunk URL a failed import names (Chromium and Firefox put it in the message; Safari doesn't). */
export function failedChunkUrl(e: unknown): string | null {
  const m = e instanceof Error ? /(https?:\/\/\S+?\.js)(?=$|[\s'"?#])/.exec(e.message) : null;
  return m?.[1] ?? null;
}

const withRetry = (url: string, n: number) => {
  const u = new URL(url);
  u.searchParams.set('retry', String(n));
  return u.href;
};

// How a cache-busted URL is imported and how the page reloads; tests swap them.
const hooks = {
  importUrl: (url: string): Promise<unknown> => import(/* @vite-ignore */ url),
  reload: () => window.location.reload(),
};
export function setLoadHooksForTests(h: Partial<typeof hooks>): void {
  Object.assign(hooks, h);
}

/**
 * Wraps a dynamic import so a call after a failure re-requests the chunk: `<url>?retry=N` when the
 * failure named the URL, else the importer again. Every rejection is marked as a load error.
 */
export function retryable<M>(importer: () => Promise<M>): () => Promise<M> {
  let failedUrl: string | null = null;
  let tries = 0;
  return () => {
    const attempt = failedUrl ? (hooks.importUrl(withRetry(failedUrl, ++tries)) as Promise<M>) : importer();
    return attempt.then(
      (m) => {
        failedUrl = null;
        return m;
      },
      (e: unknown) => {
        failedUrl = failedChunkUrl(e) ?? failedUrl;
        throw markLoadError(e);
      },
    );
  };
}

const RELOAD_KEY = 'activeon:chunk-reload';
const RELOAD_GAP_MS = 60_000;

/** Reloads the page once per minute at most (never while offline). True if it reloaded. */
export function reloadOnce(now = Date.now()): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (now - last < RELOAD_GAP_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    return false; // no storage, no guard: never reload
  }
  hooks.reload();
  return true;
}

export function lazyPart<P extends object>(load: () => Promise<ComponentType<P>>): LazyPart<P>;
export function lazyPart<P extends object, M>(
  importer: () => Promise<M>,
  pick: (m: M) => ComponentType<P>,
): LazyPart<P>;
export function lazyPart<P extends object, M>(
  first: () => Promise<M | ComponentType<P>>,
  pick?: (m: M) => ComponentType<P>,
): LazyPart<P> {
  const load: () => Promise<ComponentType<P>> = pick
    ? (() => {
        const imp = retryable(first as () => Promise<M>);
        // A re-imported chunk that lacks the export (a bundler-renamed one) counts as a failed load.
        return () =>
          imp().then(
            (m) =>
              pick(m) ??
              Promise.reject(markLoadError(new Error('Unable to preload the view from its chunk'))),
          );
      })()
    : (first as () => Promise<ComponentType<P>>);
  let loaded: ComponentType<P> | null = null;
  let pending: Promise<ComponentType<P>> | null = null;
  const preload = () => {
    pending ??= load().then(
      (c) => {
        loaded = c;
        return c;
      },
      (e: unknown) => {
        pending = null; // a failed fetch (offline, new deploy) can be retried
        throw markLoadError(e);
      },
    );
    return pending;
  };
  // React.lazy keeps a rejection forever, so a retry needs a fresh one.
  const makeLazy = () => lazy(() => preload().then((c) => ({ default: c })));
  let Lazy = makeLazy();
  const retry = async () => {
    await preload();
    Lazy = makeLazy();
  };
  // The boundary asks for the view at its own render, so a Retry renders what has loaded since.
  const Part = (props: P) => {
    const view = () => {
      const C = loaded ?? Lazy;
      return <C {...props} />;
    };
    return <PartBoundary retry={retry} view={view} />;
  };
  Part.preload = preload;
  parts.push(preload);
  return Part;
}

interface BoundaryProps {
  retry: () => Promise<void>;
  view: () => ReactNode;
}

/** One part's boundary: a failed chunk shows the retry line; any other error goes up as before. */
class PartBoundary extends Component<BoundaryProps, { error: unknown; failed: boolean }> {
  override state = { error: null as unknown, failed: false };
  static getDerivedStateFromError(error: unknown) {
    return { error, failed: true };
  }
  override render() {
    if (!this.state.failed) return this.props.view();
    // A view that threw while rendering is a bug, not the network: the shell's boundary says so.
    if (!isLoadError(this.state.error)) throw this.state.error;
    return (
      <LoadFailed retry={this.props.retry} onLoaded={() => this.setState({ error: null, failed: false })} />
    );
  }
}

function LoadFailed({ retry, onLoaded }: { retry: () => Promise<void>; onLoaded: () => void }) {
  const [busy, setBusy] = useState(false);
  const onRetry = async () => {
    setBusy(true);
    try {
      await retry();
      onLoaded();
    } catch {
      if (!reloadOnce()) setBusy(false);
    }
  };
  return (
    <PartFailed
      line={`${PART_WORDS.failed} ${PART_WORDS.hint}`}
      retry={PART_WORDS.retry}
      busy={busy ? PART_WORDS.retrying : null}
      onRetry={onRetry}
    />
  );
}

/**
 * Every registered part, fetched (Shell calls it when idle; tests await it before rendering). A part
 * can live inside another part's chunk (a System page body), so it runs until no new part registers.
 */
export async function preloadParts(): Promise<void> {
  let seen = -1;
  while (seen !== parts.length) {
    seen = parts.length;
    await Promise.all(parts.map((p) => p().catch(() => null)));
  }
}

/**
 * The one loading state of a lazy view (M21 TR-13, D-11): a polite live line for screen readers at
 * once, and our walking blob only after 400 ms, so a fast chunk never flashes it (US-14).
 */
export function Loading({ what = 'this view', text }: { what?: string; text?: string }) {
  const line = text ?? `Loading ${what}…`;
  return (
    <div className="lazy-loading">
      <p className="sr-only" role="status" aria-live="polite">
        {line}
      </p>
      <Waiting delayMs={400} label={line} quiet />
    </div>
  );
}
