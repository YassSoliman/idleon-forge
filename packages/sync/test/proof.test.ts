// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Proof of sign-in (M13 TR-4, D1): only an ID token that expired 15+ minutes ago, by Google's clock.
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { createProofRing, openProofStore, PROOF_RING_SIZE, readTokenTimes } from '../src';

const MIN = 60_000;
const T0 = Date.UTC(2026, 9, 17, 12); // Google's clock at the first token

const b64url = (v: unknown) =>
  btoa(JSON.stringify(v)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/** A fake ID token issued at `iatMs` (Google time), valid 1 h. Signature is irrelevant here. */
const token = (iatMs: number, sub = 'uid-1') =>
  `${b64url({ alg: 'RS256' })}.${b64url({ sub, iat: iatMs / 1000, exp: iatMs / 1000 + 3600 })}.sig`;

/** A ring on a fake local clock that runs `skewMs` ahead of Google's. */
function ring(skewMs = 0) {
  let googleNow = T0;
  const timers: Array<{ at: number; fn: () => void }> = [];
  const r = createProofRing({
    clock: () => googleNow + skewMs,
    setTimer: (fn, ms) => {
      const t = { at: googleNow + skewMs + ms, fn };
      timers.push(t);
      return t;
    },
    clearTimer: (h) => {
      const i = timers.indexOf(h as (typeof timers)[number]);
      if (i >= 0) timers.splice(i, 1);
    },
  });
  return {
    r,
    advance(ms: number) {
      googleNow += ms;
      for (const t of [...timers].filter((x) => x.at <= googleNow + skewMs)) {
        timers.splice(timers.indexOf(t), 1);
        t.fn();
      }
    },
    get googleNow() {
      return googleNow;
    },
  };
}

describe('proof of sign-in', () => {
  it('reads sub, iat and exp, and rejects anything that is not a JWT', () => {
    expect(readTokenTimes(token(T0))).toEqual({ sub: 'uid-1', iat: T0 / 1000, exp: T0 / 1000 + 3600 });
    expect(readTokenTimes('nope')).toBeNull();
    expect(readTokenTimes('a.b.c')).toBeNull();
  });

  it('never returns a token whose exp is in the future, even when it is the only one', async () => {
    const f = ring();
    await f.r.record(token(T0));
    expect(await f.r.getSignInProof()).toBeNull();
    f.advance(70 * MIN); // expired 10 min ago: still not a proof
    expect(await f.r.getSignInProof()).toBeNull();
  });

  it('a local clock 30 minutes fast still never yields a live or recently expired token', async () => {
    const f = ring(30 * MIN);
    await f.r.record(token(T0));
    f.advance(50 * MIN); // the local clock says 80 min, Google says 50: live
    expect(await f.r.getSignInProof()).toBeNull();
    f.advance(24 * MIN); // Google 74 min: expired 14 min ago
    expect(await f.r.getSignInProof()).toBeNull();
    f.advance(2 * MIN); // Google 76 min: expired 16 min ago
    expect(await f.r.getSignInProof()).toBe(token(T0));
  });

  it('after sign-in, two refreshes and a reload, a proof exists', async () => {
    const store = await openProofStore(new IDBFactory());
    let googleNow = T0;
    const first = createProofRing({ store, clock: () => googleNow });
    await first.record(token(T0));
    googleNow += 55 * MIN;
    await first.record(token(googleNow)); // refresh 1
    googleNow += 55 * MIN;
    await first.record(token(googleNow)); // refresh 2
    googleNow += 5 * MIN;
    // A reload: a new ring over the same IndexedDB store.
    const reloaded = createProofRing({ store, clock: () => googleNow });
    expect(await reloaded.getSignInProof()).toBe(token(T0));
  });

  it('keeps only the 3 newest tokens, and never mixes accounts', async () => {
    const f = ring();
    for (let i = 0; i < 5; i++) await f.r.record(token(T0 + i * 55 * MIN));
    f.advance(10 * 60 * MIN);
    const proof = await f.r.getSignInProof();
    expect(proof).toBe(token(T0 + 4 * 55 * MIN)); // the newest expired one
    expect(PROOF_RING_SIZE).toBe(3);
    await f.r.record(token(f.googleNow, 'uid-2')); // another account signs in
    expect(await f.r.getSignInProof()).toBeNull();
  });

  it('onProofReady fires once the proof is due, and clear forgets everything', async () => {
    const f = ring();
    const got: string[] = [];
    await f.r.record(token(T0));
    f.r.onProofReady((p) => got.push(p));
    await Promise.resolve();
    expect(got).toEqual([]);
    f.advance(76 * MIN);
    await new Promise((r) => setTimeout(r, 0));
    expect(got).toEqual([token(T0)]);
    await f.r.clear();
    expect(await f.r.getSignInProof()).toBeNull();
  });
});
