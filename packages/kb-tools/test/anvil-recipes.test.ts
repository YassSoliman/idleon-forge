// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-C3a's CI check: `anvil.fact.recipes` is exactly what the wiki cache says (no hand edits), and
// on every public save each recipe's `n` indexes an entry of its tab's `AnvilCraftStatus` array, no two
// rows share a (tab, n), every entry has a row (V-C11: the wiki's order is the status arrays' order),
// a "start of the tab" recipe is never locked once its tab is owned, and the value 2 appears only on
// achievement recipes (V-C9). gear.fact.recipes agrees with it wherever both name a piece.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ANVIL_FACTS, type AnvilCache, RECIPE_TABS, readCache, withTable } from '../src/anvil-recipes';
import { PUBLIC_FIXTURES, SYSTEMS_DIR } from '../src/paths';

type Row = { tab: number; n: number; lv: number; from: string; by?: string };
const cache: AnvilCache = readCache();
const file = readFileSync(ANVIL_FACTS, 'utf8');
const facts = parse(file) as { facts: { id: string; rows: Record<string, Row> }[] };
const rows = facts.facts.find((f) => f.id === 'anvil.fact.recipes')?.rows ?? {};

const rawSave = (name: string): Record<string, unknown> => {
  const j = JSON.parse(readFileSync(path.join(PUBLIC_FIXTURES, name), 'utf8')) as Record<string, unknown>;
  const find = (o: unknown): Record<string, unknown> | null => {
    if (!o || typeof o !== 'object') return null;
    const d = o as Record<string, unknown>;
    if ('AnvilCraftStatus' in d) return d;
    for (const v of Object.values(d)) {
      const r = find(v);
      if (r) return r;
    }
    return null;
  };
  const d = find(j);
  if (!d) throw new Error(`${name}: no AnvilCraftStatus`);
  return d;
};
const json = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v);
const saves = [
  'first.json',
  'fourth.json',
  'fresh.json',
  'highend.json',
  'latest.json',
  'second.json',
  'third.json',
  'speedrun-rank1.json',
];

describe('anvil.fact.recipes', () => {
  it('is the cache, untouched (run src/anvil-recipes.ts after a re-fetch)', () => {
    expect(withTable(file, cache)).toBe(file);
  });

  it('has one row per (tab, n)', () => {
    const keys = Object.values(rows).map((r) => `${r.tab}:${r.n}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(Object.keys(rows).length).toBe(cache.recipes.length);
  });

  it('agrees with gear.fact.recipes on tab, n and level', () => {
    const gear = parse(readFileSync(path.join(SYSTEMS_DIR, 'gear.facts.yaml'), 'utf8')) as {
      facts: { id: string; rows: Record<string, Row> }[];
    };
    const g = gear.facts.find((f) => f.id === 'gear.fact.recipes')?.rows ?? {};
    for (const [raw, r] of Object.entries(g)) {
      expect(rows[raw], raw).toBeDefined();
      expect([rows[raw]?.tab, rows[raw]?.n, rows[raw]?.lv], raw).toEqual([r.tab, r.n, r.lv]);
    }
  });

  describe.each(saves)('%s', (name) => {
    const d = rawSave(name);
    const status = json(d.AnvilCraftStatus) as number[][];
    const owned = Number(d.CYAnvilTabsOwned);

    it('V-C11: every n indexes its tab, and every entry of tabs 1-4 has a row', () => {
      for (const t of RECIPE_TABS) {
        const mine = Object.values(rows).filter((r) => r.tab === t);
        expect(mine.length, `tab ${t}`).toBe(status[t - 1]?.length);
        for (const r of mine) expect(status[t - 1]?.[r.n - 1], `tab ${t} #${r.n}`).not.toBeUndefined();
      }
    });

    it('a start-of-tab recipe is open once its tab is owned', () => {
      for (const [raw, r] of Object.entries(rows))
        if (r.from === 'start' && r.tab <= owned)
          expect(status[r.tab - 1]?.[r.n - 1], raw).toBeGreaterThanOrEqual(0);
    });

    it('V-C9: the value 2 marks only achievement recipes', () => {
      for (const [raw, r] of Object.entries(rows))
        if (status[r.tab - 1]?.[r.n - 1] === 2) expect(r.from, raw).toBe('achievement');
    });
  });
});
