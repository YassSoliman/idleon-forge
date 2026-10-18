// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The lazy views (lazy-part.tsx): a polite loading line while the chunk loads, the view after, and no
// loading line again once the chunk is in memory.
import { act, cleanup, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Loading, lazyPart } from '../src/lazy-part';

afterEach(() => cleanup());

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
});
