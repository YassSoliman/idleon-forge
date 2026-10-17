// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The save listener's failure rules (M1 FR-5, FR-11, FR-12, FR-17, TR-8) against a fake Firebase.
import type { RawSaveEnvelope } from '@idleon-forge/toolbox-parsers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BACKOFF_MS,
  isAuthError,
  type ListenerStatus,
  type ReadResult,
  type SaveSnapshot,
  type SaveSource,
  SERVER_VARS_MAX_AGE_MS,
  watchSave,
} from '../src/listen';

const ok = <T>(value: T): ReadResult<T> => ({ status: 'ok', value });
const absent: ReadResult<never> = { status: 'absent' };
const err = (message: string, code?: string): ReadResult<never> => ({
  status: 'error',
  error: Object.assign(new Error(message), code ? { code } : {}),
});

type Reads = Record<string, ReadResult<unknown> | Array<ReadResult<unknown>>>;

/** A fake Firebase: scripted reads by path (a list answers one per call, then repeats the last). */
function fakeFirebase(reads: Reads) {
  const calls: string[] = [];
  const subs: Array<{ next: (s: SaveSnapshot | null) => void; error: (e: Error) => void; closed: boolean }> =
    [];
  const answer = (path: string): ReadResult<unknown> => {
    calls.push(path);
    const r = reads[path] ?? absent;
    if (!Array.isArray(r)) return r;
    return (r.length > 1 ? r.shift() : r[0]) ?? absent;
  };
  const source: SaveSource = {
    readRtdb: async (path) => answer(path),
    readDoc: async (collection, id) => answer(`${collection}/${id}`) as ReadResult<Record<string, unknown>>,
    subscribeSave: (_uid, next, error) => {
      const sub = { next, error, closed: false };
      subs.push(sub);
      return () => {
        sub.closed = true;
      };
    },
  };
  return { source, calls, subs };
}

const save = (extra: Record<string, unknown> = {}): SaveSnapshot => ({
  data: { Lv0_0: '[1]', Lv0_1: '[1]', CSver: 34.05, ...extra },
  createTime: null,
});

const healthy = (): Reads => ({
  '_uid/u1': ok(['A', 'B']),
  '_vars/_vars': ok({ GameVERSION: 142 }),
});

function run(reads: Reads, now = () => 1_000_000) {
  const fb = fakeFirebase(reads);
  const statuses: ListenerStatus[] = [];
  const envelopes: RawSaveEnvelope[] = [];
  const stop = watchSave(
    fb.source,
    'u1',
    { onStatus: (s) => statuses.push(s), onEnvelope: (e) => envelopes.push(e) },
    { now },
  );
  return { ...fb, statuses, envelopes, stop, kinds: () => statuses.map((s) => s.kind) };
}

const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('start-up', () => {
  it('attaches the listener after the names and server vars reads', async () => {
    const r = run(healthy());
    await flush();
    expect(r.subs).toHaveLength(1);
    r.subs[0]?.next(save());
    await flush();
    expect(r.kinds()).toEqual(['connecting', 'live']);
    expect(r.envelopes).toHaveLength(1);
    expect(r.envelopes[0]?.charNames).toEqual(['A', 'B']);
    expect(r.envelopes[0]?.serverVars).toEqual({ GameVERSION: 142 });
    expect(r.envelopes[0]?.sideReadReport).toEqual({ failed: [] });
  });

  it('reports the wrong Google account only when the names read succeeded and was empty (FR-5)', async () => {
    for (const names of [absent, ok([])]) {
      const r = run({ ...healthy(), '_uid/u1': names });
      await flush();
      expect(r.kinds()).toEqual(['connecting', 'wrong-account']);
      expect(r.subs).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(600_000);
      expect(r.calls.filter((c) => c === '_uid/u1')).toHaveLength(1); // no retry
    }
  });

  it('retries a names read that errored, and never calls it the wrong account (US-10)', async () => {
    const r = run({ ...healthy(), '_uid/u1': [err('network'), ok(['A', 'B'])] });
    await flush();
    expect(r.statuses).toEqual([
      { kind: 'connecting' },
      { kind: 'reconnecting', attempt: 1, retryInMs: 2_000, reason: 'network' },
    ]);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(r.subs).toHaveLength(1);
    expect(r.kinds()).not.toContain('wrong-account');
  });

  it('retries a server vars read that errored', async () => {
    const r = run({ ...healthy(), '_vars/_vars': [err('timeout'), ok({ GameVERSION: 142 })] });
    await flush();
    expect(r.kinds()).toEqual(['connecting', 'reconnecting']);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(r.subs).toHaveLength(1);
  });

  it('does not retry an auth error at start-up', async () => {
    const r = run({ ...healthy(), '_uid/u1': err('permission_denied at /_uid/u1') });
    await flush();
    expect(r.kinds()).toEqual(['connecting', 'auth-expired']);
    await vi.advanceTimersByTimeAsync(600_000);
    expect(r.subs).toHaveLength(0);
  });
});

describe('a listener error (FR-12)', () => {
  it('is terminal: the listener is closed and a new one starts with backoff 2 s, 10 s, 30 s, then 2 min', async () => {
    const r = run(healthy());
    await flush();
    const delays: number[] = [];
    for (let i = 0; i < 5; i++) {
      const sub = r.subs.at(-1);
      sub?.error(Object.assign(new Error('unavailable'), { code: 'unavailable' }));
      expect(sub?.closed).toBe(true);
      const last = r.statuses.at(-1);
      if (last?.kind !== 'reconnecting') throw new Error(`expected reconnecting, got ${last?.kind}`);
      delays.push(last.retryInMs);
      await vi.advanceTimersByTimeAsync(last.retryInMs - 1);
      expect(r.subs).toHaveLength(i + 1);
      await vi.advanceTimersByTimeAsync(1);
      expect(r.subs).toHaveLength(i + 2);
    }
    expect(delays).toEqual([...BACKOFF_MS, 120_000]);
  });

  it('resets the backoff once a new listener delivers', async () => {
    const r = run(healthy());
    await flush();
    r.subs[0]?.error(new Error('unavailable'));
    await vi.advanceTimersByTimeAsync(2_000);
    r.subs[1]?.next(save());
    await flush();
    r.subs[1]?.error(new Error('unavailable'));
    expect(r.statuses.at(-1)).toMatchObject({ kind: 'reconnecting', attempt: 1, retryInMs: 2_000 });
  });

  it.each(['permission-denied', 'unauthenticated'])(
    '%s means the sign-in expired: no retry',
    async (code) => {
      const r = run(healthy());
      await flush();
      r.subs[0]?.error(Object.assign(new Error('denied'), { code }));
      expect(r.kinds().at(-1)).toBe('auth-expired');
      await vi.advanceTimersByTimeAsync(600_000);
      expect(r.subs).toHaveLength(1);
    },
  );

  it('stop() ends the listener and any pending retry at once', async () => {
    const r = run(healthy());
    await flush();
    r.subs[0]?.error(new Error('unavailable'));
    r.stop();
    await vi.advanceTimersByTimeAsync(600_000);
    expect(r.subs).toHaveLength(1);
  });

  it('a snapshot arriving after stop() is ignored', async () => {
    const r = run(healthy());
    await flush();
    r.stop();
    r.subs[0]?.next(save());
    await flush();
    expect(r.envelopes).toHaveLength(0);
  });
});

describe('each cloud save', () => {
  it('lists side reads that errored, not ones that were absent (FR-17)', async () => {
    const r = run({
      ...healthy(),
      '_comp/u1': err('network'),
      '_usgu/u1/g': ok('guild-1'),
      '_guild/guild-1': err('network'),
      '_tournament/u1': absent,
      '_T_RES_UID/u1': err('network'),
    });
    await flush();
    r.subs[0]?.next(save());
    await flush();
    expect(r.envelopes[0]?.sideReadReport?.failed.sort()).toEqual(['companion', 'guild', 'tournament']);
  });

  it('a newer save that arrives while side reads are in flight wins', async () => {
    const r = run(healthy());
    await flush();
    r.subs[0]?.next(save({ v: 1 }));
    r.subs[0]?.next(save({ v: 2 }));
    await flush();
    expect(r.envelopes.map((e) => e.data.v)).toEqual([2]);
  });

  it('re-reads the names when the save has more characters than names (FR-11)', async () => {
    const r = run({ ...healthy(), '_uid/u1': [ok(['A', 'B']), ok(['A', 'B', 'C'])] });
    await flush();
    r.subs[0]?.next(save({ Lv0_2: '[1]' }));
    await flush();
    expect(r.calls.filter((c) => c === '_uid/u1')).toHaveLength(2);
    expect(r.envelopes[0]?.charNames).toEqual(['A', 'B', 'C']);
    // Names now cover every slot: no more re-reads.
    r.subs[0]?.next(save({ Lv0_2: '[1]' }));
    await flush();
    expect(r.calls.filter((c) => c === '_uid/u1')).toHaveLength(2);
  });

  it('reports the names read as failed when the re-read errors', async () => {
    const r = run({ ...healthy(), '_uid/u1': [ok(['A', 'B']), err('network')] });
    await flush();
    r.subs[0]?.next(save({ Lv0_2: '[1]' }));
    await flush();
    expect(r.envelopes[0]?.sideReadReport?.failed).toContain('charNames');
  });

  it('re-reads server vars after 30 min and when the save format changes, not on every save (TR-8)', async () => {
    let t = 1_000_000;
    const r = run(
      { ...healthy(), '_vars/_vars': [ok({ GameVERSION: 142 }), ok({ GameVERSION: 143 })] },
      () => t,
    );
    const varsReads = () => r.calls.filter((c) => c === '_vars/_vars').length;
    await flush();
    r.subs[0]?.next(save());
    await flush();
    expect(varsReads()).toBe(1);
    t += SERVER_VARS_MAX_AGE_MS - 1;
    r.subs[0]?.next(save());
    await flush();
    expect(varsReads()).toBe(1);
    t += 1;
    r.subs[0]?.next(save());
    await flush();
    expect(varsReads()).toBe(2);
    expect(r.envelopes.at(-1)?.serverVars).toEqual({ GameVERSION: 143 });
    r.subs[0]?.next(save({ CSver: 35.05 }));
    await flush();
    expect(varsReads()).toBe(3);
  });

  it('makes at most 6 side reads per save once names and vars are fresh (TR-9)', async () => {
    const r = run({ ...healthy(), '_usgu/u1/g': ok('g1') });
    await flush();
    const before = r.calls.length;
    r.subs[0]?.next(save());
    await flush();
    expect(r.calls.length - before).toBe(6);
  });
});

describe('isAuthError', () => {
  it.each([
    [{ code: 'permission-denied' }, true],
    [{ code: 'unauthenticated' }, true],
    [new Error('permission_denied at /_uid/x: Client does not have permission'), true],
    [{ code: 'unavailable' }, false],
    [new Error('network'), false],
  ])('%j -> %s', (e, expected) => {
    expect(isAuthError(e)).toBe(expected);
  });
});
