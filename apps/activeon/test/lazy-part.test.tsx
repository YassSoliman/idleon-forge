// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The lazy views (lazy-part.tsx): a polite loading line while the chunk loads, the view after, and no
// loading line again once the chunk is in memory. A chunk that fails to load shows "Couldn't load this
// view" in place of that view only, and Retry re-requests it (R9 QA P1-1).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Component, type ReactNode, Suspense } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  failedChunkUrl,
  isLoadError,
  Loading,
  lazyPart,
  reloadOnce,
  retryable,
  setLoadHooksForTests,
} from '../src/lazy-part';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const CHUNK = 'http://127.0.0.1/assets/GearTab-C7z6w--y.js';
/** What Chromium rejects a failed `import()` with. */
const chunkError = () => new TypeError(`Failed to fetch dynamically imported module: ${CHUNK}`);

/** Stands in for the shell's AdviceBoundary: anything that reaches it took the whole app. */
class Outer extends Component<{ children: ReactNode }, { error: string | null }> {
  override state = { error: null as string | null };
  static getDerivedStateFromError(e: unknown) {
    return { error: String(e) };
  }
  override render() {
    return this.state.error ? <p>whole app broken</p> : this.props.children;
  }
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <Outer>
      <nav>places</nav>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </Outer>
  );
}

function Hello({ who }: { who: string }) {
  return <p>Hello {who}</p>;
}

describe('lazyPart', () => {
  it('shows the loading line, then the view', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const Part = lazyPart(() => gate.then(() => Hello));
    render(
      <Suspense fallback={<Loading what="the Gear tab" />}>
        <Part who="Gear" />
      </Suspense>,
    );
    const line = screen.getByRole('status');
    expect(line.textContent).toBe('Loading the Gear tab…');
    expect(line.getAttribute('aria-live')).toBe('polite');
    await act(async () => {
      release();
      await gate;
    });
    expect(await screen.findByText('Hello Gear')).toBeTruthy();
  });

  it('renders at once when the chunk is already in memory', async () => {
    const Part = lazyPart(() => Promise.resolve(Hello));
    await Part.preload();
    render(
      <Suspense fallback={<Loading />}>
        <Part who="again" />
      </Suspense>,
    );
    expect(screen.getByText('Hello again')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('retries a chunk that failed to load', async () => {
    let calls = 0;
    const Part = lazyPart(() =>
      ++calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve(Hello),
    );
    await expect(Part.preload()).rejects.toThrow('offline');
    await expect(Part.preload()).resolves.toBe(Hello);
    expect(calls).toBe(2);
  });

  it('a failed chunk shows the retry line in place of the view, and the nav stays', async () => {
    const Part = lazyPart(
      () => Promise.reject(chunkError()),
      () => Hello,
    );
    render(
      <Shell>
        <Part who="Gear" />
      </Shell>,
    );
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain("Couldn't load this part. Check your connection.");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.getByText('places')).toBeTruthy();
    expect(screen.queryByText('whole app broken')).toBeNull();
    expect(screen.queryByText(/Hello/)).toBeNull();
  });

  it('Retry imports the failed chunk again under a cache-busted URL, then shows the view', async () => {
    const urls: string[] = [];
    setLoadHooksForTests({
      importUrl: async (url) => {
        urls.push(url);
        return { GearTab: Hello };
      },
    });
    const Part = lazyPart(
      () => Promise.reject(chunkError()) as Promise<{ GearTab: typeof Hello }>,
      (m) => m.GearTab,
    );
    render(
      <Shell>
        <Part who="Gear" />
      </Shell>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Hello Gear')).toBeTruthy();
    expect(urls).toEqual([`${CHUNK}?retry=1`]);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('reloads once when the cache-busted import fails too, and never twice in a minute', async () => {
    const reload = vi.fn();
    setLoadHooksForTests({ importUrl: () => Promise.reject(chunkError()), reload });
    const Part = lazyPart(
      () => Promise.reject(chunkError()),
      () => Hello,
    );
    render(
      <Shell>
        <Part who="Gear" />
      </Shell>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(sessionStorage.getItem('activeon:chunk-reload')).toBeTruthy();
    expect(reloadOnce()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reloadOnce(Date.now() + 61_000)).toBe(true);
  });

  it('a view that throws while rendering is not a load failure: it goes to the shell boundary', async () => {
    const Broken = () => {
      throw new Error('bug');
    };
    const Part = lazyPart(() => Promise.resolve(Broken));
    await Part.preload();
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Shell>
        <Part />
      </Shell>,
    );
    expect(await screen.findByText('whole app broken')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    quiet.mockRestore();
  });

  it('reads the failed chunk URL from the browser error, and marks Vite preload errors', () => {
    expect(failedChunkUrl(chunkError())).toBe(CHUNK);
    expect(failedChunkUrl(new TypeError('Importing a module script failed.'))).toBeNull();
    const payload = new Error('opaque');
    const e = new Event('vite:preloadError', { cancelable: true }) as Event & { payload?: unknown };
    e.payload = payload;
    window.dispatchEvent(e);
    expect(isLoadError(payload)).toBe(true);
    expect(e.defaultPrevented).toBe(false);
    expect(isLoadError(new Error('bug'))).toBe(false);
  });

  it('retryable re-requests the chunk with a new query each time', async () => {
    const urls: string[] = [];
    setLoadHooksForTests({
      importUrl: (url) => {
        urls.push(url);
        return Promise.reject(chunkError());
      },
    });
    const imp = retryable(() => Promise.reject(chunkError()));
    await expect(imp()).rejects.toThrow();
    await expect(imp()).rejects.toThrow();
    await expect(imp()).rejects.toThrow();
    expect(urls).toEqual([`${CHUNK}?retry=1`, `${CHUNK}?retry=2`]);
  });
});
