// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The parser client's queueing, timeout and restart rules (M1 TR-5, FR-10, RT-11) with a fake Worker.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createParserClient, type WorkerLike } from '../src/worker/parser-client';
import type { ParseRequest, WorkerRequest, WorkerResponse } from '../src/worker/protocol';

class FakeWorker implements WorkerLike {
  readonly received: WorkerRequest[] = [];
  terminated = false;
  private onMessage: ((e: MessageEvent<WorkerResponse>) => void) | null = null;
  private onError: ((e: ErrorEvent) => void) | null = null;

  postMessage(message: WorkerRequest) {
    this.received.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  addEventListener(type: 'message' | 'error', listener: (e: never) => void) {
    if (type === 'message') this.onMessage = listener as (e: MessageEvent<WorkerResponse>) => void;
    else this.onError = listener as (e: ErrorEvent) => void;
  }
  /** Answers the newest request it received. */
  answer(ok = true) {
    const req = this.received.at(-1);
    if (!req) throw new Error('nothing to answer');
    const data: WorkerResponse =
      req.type === 'rerun'
        ? { id: req.id, ok: true, rerun: true, result: { error: 'test' }, ms: 1 }
        : ok
          ? { id: req.id, ok: true, state: { asOf: req.now } as never, ms: 1 }
          : { id: req.id, ok: false, kind: 'empty', message: 'no', ms: 1 };
    this.onMessage?.({ data } as MessageEvent<WorkerResponse>);
  }
  fail(message = 'boom') {
    this.onError?.({ message, preventDefault() {} } as ErrorEvent);
  }
}

function setup(timeoutMs = 15_000, checkUpdated?: () => Promise<boolean>) {
  const workers: FakeWorker[] = [];
  const client = createParserClient({
    timeoutMs,
    ...(checkUpdated ? { checkUpdated } : {}),
    createWorker: () => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    },
  });
  const current = () => {
    const w = workers.at(-1);
    if (!w) throw new Error('no worker yet');
    return w;
  };
  return { client, workers, current };
}

const input = (n: number) => ({ kind: 'text' as const, text: String(n) });
const nowOf = (r: WorkerRequest) => (r as ParseRequest).input;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createParserClient', () => {
  it('keeps at most one parse in flight and one pending; the newest replaces the pending one (FR-10)', async () => {
    const { client, current } = setup();
    const a = client.parse(input(1));
    const b = client.parse(input(2));
    const c = client.parse(input(3));
    expect(current().received.map(nowOf)).toEqual([input(1)]); // only one sent
    await expect(b).resolves.toEqual({ superseded: true });
    current().answer();
    await expect(a).resolves.toMatchObject({ ok: true });
    expect(current().received.map(nowOf)).toEqual([input(1), input(3)]);
    current().answer();
    await expect(c).resolves.toMatchObject({ ok: true });
  });

  it('three saves in a burst run at most two parses and end on the newest (US-3)', async () => {
    const { client, current } = setup();
    const results = [client.parse(input(1)), client.parse(input(2)), client.parse(input(3))];
    current().answer();
    await vi.advanceTimersByTimeAsync(0);
    current().answer();
    const settled = await Promise.all(results);
    expect(current().received).toHaveLength(2);
    expect(settled.map((r) => ('superseded' in r ? 'superseded' : 'ok'))).toEqual(['ok', 'superseded', 'ok']);
  });

  it('times out a parse after 15 s and replaces the worker', async () => {
    const { client, workers, current } = setup();
    const a = client.parse(input(1));
    await vi.advanceTimersByTimeAsync(15_000);
    await expect(a).resolves.toMatchObject({ ok: false, kind: 'timeout', ms: expect.any(Number) });
    expect(workers[0]?.terminated).toBe(true);
    const b = client.parse(input(2));
    expect(workers).toHaveLength(2);
    current().answer();
    await expect(b).resolves.toMatchObject({ ok: true });
  });

  it('sends the pending parse to a fresh worker after a timeout', async () => {
    const { client, workers } = setup();
    void client.parse(input(1));
    const b = client.parse(input(2));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(workers).toHaveLength(2);
    expect(workers[1]?.received.map(nowOf)).toEqual([input(2)]);
    workers[1]?.answer();
    await expect(b).resolves.toMatchObject({ ok: true });
  });

  it('fails the parse in flight as a crash on a worker error, and recreates the worker once', async () => {
    const { client, workers, current } = setup();
    const a = client.parse(input(1));
    current().fail('chunk 404');
    await expect(a).resolves.toMatchObject({ ok: false, kind: 'crash', message: 'chunk 404' });
    const b = client.parse(input(2));
    expect(workers).toHaveLength(2);
    current().answer();
    await expect(b).resolves.toMatchObject({ ok: true });
  });

  it('a worker that keeps failing to load makes every later request fail at once, not hang (RT-11)', async () => {
    const { client, workers, current } = setup();
    const a = client.parse(input(1));
    current().fail();
    await expect(a).resolves.toMatchObject({ kind: 'crash' });
    const b = client.parse(input(2));
    current().fail();
    await expect(b).resolves.toMatchObject({ kind: 'crash' });
    await expect(client.parse(input(3))).resolves.toMatchObject({ ok: false, kind: 'crash' });
    await expect(client.parse(input(4))).resolves.toMatchObject({ ok: false, kind: 'crash' });
    expect(workers).toHaveLength(2);
  });

  it('dispose() resolves what is in flight and pending instead of dropping it', async () => {
    const { client, current } = setup();
    const a = client.parse(input(1));
    const b = client.parse(input(2));
    client.dispose();
    await expect(a).resolves.toEqual({ superseded: true });
    await expect(b).resolves.toEqual({ superseded: true });
    expect(current().terminated).toBe(true);
    await expect(client.parse(input(3))).resolves.toEqual({ superseded: true });
  });

  it('asks for the history parse only when told to', () => {
    const { client, current } = setup();
    void client.parse(input(1), { now: 5, withHistory: true });
    expect(current().received[0]).toMatchObject({ type: 'parse', now: 5, withHistory: true });
  });

  const engine = {
    expectedReturnSeconds: 8 * 3600,
    sessionStartedAt: null,
    learnedExpectedReturnSeconds: null,
    knowledgeVersion: 'k',
  };

  it('re-runs coalesce, newest wins, behind the request in flight (M10 TR-6)', async () => {
    const { client, current } = setup();
    const a = client.parse(input(1), { engine });
    const r1 = client.rerun(4 * 3600);
    const r2 = client.rerun(12 * 3600);
    await expect(r1).resolves.toEqual({ superseded: true });
    current().answer();
    await expect(a).resolves.toMatchObject({ ok: true });
    expect(current().received.at(-1)).toMatchObject({ type: 'rerun', expectedReturnSeconds: 12 * 3600 });
    current().answer();
    await expect(r2).resolves.toMatchObject({ ok: true, rerun: true });
  });

  it('a re-run behind a pending parse folds into it and never displaces the save', async () => {
    const { client, current } = setup();
    void client.parse(input(1), { engine });
    const b = client.parse(input(2), { engine });
    await expect(client.rerun(2 * 3600)).resolves.toEqual({ superseded: true });
    current().answer();
    await vi.advanceTimersByTimeAsync(0);
    expect(current().received.at(-1)).toMatchObject({
      type: 'parse',
      input: input(2),
      engine: { expectedReturnSeconds: 2 * 3600 },
    });
    current().answer();
    await expect(b).resolves.toMatchObject({ ok: true });
  });

  it('a worker error after a deploy is "updated", not a broken save (M12 TR-10)', async () => {
    const { client, current } = setup(15_000, async () => true);
    const a = client.parse(input(1));
    current().fail('chunk 404');
    await expect(a).resolves.toMatchObject({ ok: false, kind: 'updated' });
  });

  it('a worker error with the same build live stays a crash', async () => {
    const { client, current } = setup(15_000, async () => false);
    const a = client.parse(input(1));
    current().fail('boom');
    await expect(a).resolves.toMatchObject({ ok: false, kind: 'crash', message: 'boom' });
  });
});
