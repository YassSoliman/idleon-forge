// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// R11 QA: a pasted save kept across the "New version ready" reload is parsed again on the next load.
// Before, AppBody (a child) took the kept text in its own effect, which runs before the hook's: the
// parser didn't exist yet, so the text was read, forgotten and never parsed.
import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const parse = vi.fn();
vi.mock('../src/worker/parser-client', () => ({
  createParserClient: () => {
    let disposed = false;
    return {
      parse: (input: unknown) => {
        parse(input, disposed);
        // A disposed client resolves "superseded", like the real one.
        return Promise.resolve(disposed ? { superseded: true } : { superseded: true });
      },
      rerun: () => Promise.resolve({ superseded: true }),
      dispose: () => {
        disposed = true;
      },
    };
  },
}));

const { keepPasteForReload, takeKeptPaste, useActiveOn } = await import('../src/use-activeon');

beforeEach(() => {
  parse.mockClear();
  sessionStorage.clear();
});
afterEach(() => sessionStorage.clear());

describe('the kept paste after "New version ready · Reload" (R11 QA)', () => {
  it('is parsed on mount, as a paste, and read from storage once', async () => {
    expect(keepPasteForReload('{"data":{}}')).toBe(true);
    const { result } = renderHook(() => useActiveOn());
    await waitFor(() => expect(parse).toHaveBeenCalled());
    const live = parse.mock.calls.filter(([, disposed]) => !disposed);
    expect(live.map(([input]) => input)).toEqual([{ kind: 'text', text: '{"data":{}}' }]);
    expect(result.current.restoredPaste).toBe('{"data":{}}');
    expect(takeKeptPaste()).toBeNull();
  });

  it('survives StrictMode: the dispose-and-recreate still parses it on the live client', async () => {
    keepPasteForReload('{"data":{"x":1}}');
    renderHook(() => useActiveOn(), { wrapper: StrictMode });
    await waitFor(() => expect(parse.mock.calls.some(([, disposed]) => !disposed)).toBe(true));
    const live = parse.mock.calls.filter(([, disposed]) => !disposed);
    expect(live.at(-1)?.[0]).toEqual({ kind: 'text', text: '{"data":{"x":1}}' });
  });

  it('does nothing without a kept paste', async () => {
    const { result } = renderHook(() => useActiveOn());
    await act(async () => {});
    expect(parse).not.toHaveBeenCalled();
    expect(result.current.restoredPaste).toBeNull();
  });
});
