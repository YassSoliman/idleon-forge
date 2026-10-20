// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-16 contract tests: `account.tome` (V7). The PTS that count are the metrics at or under the
// Account LV, each from 350 by the game's TomeLvReq; metrics are keyed by name.
import { describe, expect, it } from 'vitest';
import { accountStateOf, PUBLIC_DIR, readSave } from './helpers';

/** Game client `TomeLvReq` for display row i. */
const lvReq = (i: number) =>
  350 +
  40 * i +
  5 * Math.max(0, i - 35) +
  10 * Math.max(0, i - 60) +
  10 * Math.max(0, i - 80) +
  15 * Math.max(0, i - 100);

describe.each(['first.json', 'fourth.json', 'highend.json'])('%s', (file) => {
  const t = accountStateOf(readSave(PUBLIC_DIR, file)).account.tome;
  it('reads 124 metrics, unique names, in display order', () => {
    expect(t?.metrics).toHaveLength(124);
    expect(new Set(t?.metrics.map((m) => m.name)).size).toBe(124);
    expect(t?.metrics.map((m) => m.order)).toEqual([...Array(124).keys()]);
  });
  it("each metric counts from the game's TomeLvReq", () => {
    for (const m of t?.metrics ?? []) expect(m.lvReq).toBe(lvReq(m.order));
  });
  it('the PTS that count are the metrics at or under the Account LV', () => {
    const counted = (t?.metrics ?? []).filter((m) => m.lvReq <= (t?.accountLevel ?? 0));
    expect(counted.reduce((n, m) => n + m.points, 0)).toBe(t?.totalPoints);
  });
});

it('first.json: 2,286 PTS from 7 metrics at Account LV 602, +87% damage, no pages', () => {
  const t = accountStateOf(readSave(PUBLIC_DIR, 'first.json')).account.tome;
  expect(t?.totalPoints).toBe(2286);
  expect(t?.metrics.filter((m) => m.lvReq <= 602)).toHaveLength(7);
  expect(t?.damagePct).toBeCloseTo(87.04, 1);
  expect(t?.pages).toEqual({ blue: false, red: false });
  expect(t?.metrics[0]).toMatchObject({ name: 'Account_LV', lvReq: 350, tier: 'bronze' });
});
