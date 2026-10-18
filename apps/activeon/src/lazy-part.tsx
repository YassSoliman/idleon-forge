// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Lazy chunks for the views that aren't the Now screen: the character page's tabs, the Characters and
// Systems places, the System pages and their bodies, and the Timeline (main-chunk budget, M12 TR-12).
//
// The pattern, in one line per view:
//   export const BuildTab = lazyPart(() => import('./BuildView').then((m) => m.BuildTab));
// and render it inside a <Suspense fallback={<Loading />}> (Focus, Shell and SystemPage have one).
// A `lazyPart` is a React.lazy component that also renders the loaded module synchronously once it is
// in memory, so a view that has loaded once never shows the loading line again. `preload()` fetches
// it early (Shell prefetches every part when the browser is idle; tests await `preloadParts()`).
// Vite emits each chunk under assets/, so the CSP's `script-src 'self'` covers them unchanged.
import { type ComponentType, lazy } from 'react';

export interface LazyPart<P> {
  (props: P): React.ReactNode;
  preload(): Promise<ComponentType<P>>;
}

const parts: Array<() => Promise<unknown>> = [];

export function lazyPart<P extends object>(load: () => Promise<ComponentType<P>>): LazyPart<P> {
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
        throw e;
      },
    );
    return pending;
  };
  const Lazy = lazy(() => preload().then((c) => ({ default: c })));
  const Part = (props: P) => {
    const C = loaded ?? Lazy;
    return <C {...props} />;
  };
  Part.preload = preload;
  parts.push(preload);
  return Part;
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

/** The one loading state of a lazy view: a polite live line, never a spinner. */
export function Loading({ what = 'this view', text }: { what?: string; text?: string }) {
  return (
    <p className="small muted lazy-loading" role="status" aria-live="polite">
      {text ?? `Loading ${what}…`}
    </p>
  );
}
