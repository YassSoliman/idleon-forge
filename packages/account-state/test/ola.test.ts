// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 TR-3, R8: the OLA (OptLacc / accountOptions) indices M6 reads. On every public save and both
// scrubbed fixtures: each index holds a number in a plausible range, and its value is snapshotted per
// fixture, so two neighbouring counters that swap in a patch (same type, same range) still fail here,
// in the weekly re-sync, before any advice moves.
import { fileURLToPath } from 'node:url';
import { normalizeEnvelope } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { OLA, OLA_INDICES } from '../src';
import { listJson, PUBLIC_DIR, readSave } from './helpers';

const SCRUBBED_DIR = fileURLToPath(new URL('../../../fixtures/scrubbed/', import.meta.url));
const saves: [string, string][] = [
  ...listJson(PUBLIC_DIR).map((f): [string, string] => [PUBLIC_DIR, f]),
  ...listJson(SCRUBBED_DIR)
    .filter((f) => !f.endsWith('.meta.json'))
    .map((f): [string, string] => [SCRUBBED_DIR, f]),
];

/** The raw OptLacc array of a save. */
function optLacc(folder: string, file: string): unknown[] {
  const env = normalizeEnvelope(readSave(folder, file));
  const raw = (env.data as Record<string, unknown>).OptLacc;
  const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return Array.isArray(v) ? v : [];
}

/** Plausible ranges: day counters and plays are small, cooldowns are seconds (negative = ready). */
const RANGE: Record<number, [number, number]> = {
  [OLA.TICKETS_TYPHOON_DAYS]: [0, 10_000],
  [OLA.KEYS_FOREST_VILLA_DAYS]: [0, 10_000],
  [OLA.KEYS_EFAUNT_DAYS]: [0, 10_000],
  [OLA.MINIGAME_PLAYS]: [0, 1_000],
  [OLA.TICKETS_CENTURION_DAYS]: [0, 10_000],
  [OLA.TICKETS_LONELY_HUNTER_DAYS]: [0, 10_000],
  [OLA.KEYS_CHIZOAR_DAYS]: [0, 10_000],
  [OLA.ARENA_MAX_WAVE]: [0, 10_000],
  [OLA.SPIKETRAP_GEMS_TODAY]: [0, 1],
  [OLA.SPIKETRAP_BEST]: [0, 1e6],
  [OLA.HOOPS_BEST]: [0, 1e6],
  [OLA.HOOPS_POINTS]: [0, 1e7],
  [OLA.HOOPS_COOLDOWN]: [-1e9, 1e6],
  [OLA.HOOPS_PLAYS_TODAY]: [0, 1_000],
  [OLA.DARTS_POINTS]: [0, 1e7],
  [OLA.DARTS_COOLDOWN]: [-1e9, 1e6],
  [OLA.DARTS_PLAYS_TODAY]: [0, 1_000],
  [OLA.DARTS_BEST]: [0, 1e6],
  [OLA.PET_MART_LAST_CLAIMED_DAY]: [0, 1e5],
};
for (const i of [...OLA.DARTS_LEVELS, ...OLA.HOOPS_LEVELS]) RANGE[i] = [0, 1e5];

describe('the OLA table', () => {
  it('gives every index a range', () => {
    expect(OLA_INDICES.filter((i) => RANGE[i] === undefined)).toEqual([]);
  });
});

describe.each(saves.map(([folder, file]) => [file, folder] as const))('OLA indices on %s', (file, folder) => {
  const o = optLacc(folder, file);
  it('hold numbers in range (or are absent on an older save)', () => {
    for (const i of OLA_INDICES) {
      const v = o[i];
      if (v === undefined || v === null || o.length <= i) continue;
      const n = typeof v === 'string' ? Number(v) : v;
      expect(typeof n === 'number' && Number.isFinite(n), `OLA[${i}] = ${typeof v}`).toBe(true);
      const [lo, hi] = RANGE[i] as [number, number];
      expect(n as number, `OLA[${i}]`).toBeGreaterThanOrEqual(lo);
      expect(n as number, `OLA[${i}]`).toBeLessThanOrEqual(hi);
    }
  });
  it('match their recorded values (review the diff after a re-sync)', () => {
    expect(Object.fromEntries(OLA_INDICES.map((i) => [i, o[i] ?? null]))).toMatchSnapshot();
  });
});
