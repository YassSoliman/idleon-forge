// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Deterministic parsing for the tooling (TR-15 "what keeps goldens stable"): the frozen clock from
// parseSave, plus a seeded Math.random (Toolbox's construction optimizer calls it) and TZ=UTC.
import type { AccountState } from '@idleon-forge/account-state';
import { toAccountState } from '@idleon-forge/account-state';
import { normalizeEnvelope, type ParsedSave, parseSave } from '@idleon-forge/toolbox-parsers';

/** mulberry32: a tiny seeded PRNG, enough to make Toolbox's random calls repeatable. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PARSE_SEED = 0x1d1e0;

/** Runs `fn` with Math.random seeded and the process time zone set to UTC. */
export function deterministic<T>(fn: () => T, seed = PARSE_SEED): T {
  const realRandom = Math.random;
  const realTz = process.env.TZ;
  Math.random = seededRandom(seed);
  process.env.TZ = 'UTC';
  try {
    return fn();
  } finally {
    Math.random = realRandom;
    if (realTz === undefined) delete process.env.TZ;
    else process.env.TZ = realTz;
  }
}

/** Toolbox's full parse of an export, deterministically. */
export function parseExport(raw: unknown, now: number): ParsedSave {
  const envelope = normalizeEnvelope(raw);
  return deterministic(() => parseSave(envelope, { now }));
}

/** The Account State of an export, deterministically. */
export function accountStateOfExport(raw: unknown, now: number): AccountState {
  const envelope = normalizeEnvelope(raw);
  const parsed = deterministic(() => parseSave(envelope, { now }));
  return toAccountState(parsed, envelope, { source: 'paste' });
}
