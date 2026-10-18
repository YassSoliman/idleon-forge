// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 TR-10: band levels from the curves, the in-order allocation, and the cost function's upper bound.
import type { AccountState } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { bandLevel, curveRows } from '@idleon-forge/knowledge/generators/alchemy-curves.gen';
import { toolboxCalls } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { type CurveRow, FACT, planRows } from '../../src/alchemy/kb';
import { runPlan } from '../../src/alchemy/plan';
import { classTree, lookupOf } from '../../src/metapath/knowledge';

const ctx = await goldenContext();
const curves = ctx.kb.facts[FACT.curves]?.rows as unknown as CurveRow[];
const byName = (n: string) => curves.find((c) => c.name === n);

describe('bands (FR-1)', () => {
  it('a decay bubble with x2 = 100 bands at 12, 25, 67; Warriors Rule (x2 = 50) at 6, 13, 34', () => {
    expect(byName('HEARTY_DIGGY')?.bands).toEqual([12, 25, 67]);
    expect(byName('WARRIORS_RULE')?.bands).toEqual([6, 13, 34]);
  });
  it('linear bubbles take the x2 = 100 reference; Call Me Pope its own decayMulti curve', () => {
    expect(byName('ROID_RAGIN')?.bands).toEqual([12, 25, 67]);
    expect(byName('WYOMING_BLOOD')?.bands).toEqual([12, 25, 67]);
    expect(byName('CALL_ME_POPE')?.bands).toEqual([8, 18, 47]);
  });
  it('each band level is the first level at the share (10, 20, 40 %)', () => {
    for (const x2 of [12, 30, 50, 60, 70, 100]) {
      const share = (l: number) => l / (l + x2);
      for (const f of [0.1, 0.2, 0.4]) {
        const l = bandLevel(x2, f);
        expect(share(l)).toBeGreaterThanOrEqual(f - 1e-12);
        expect(share(l - 1)).toBeLessThan(f);
      }
    }
  });
  it('no Trench Seawater, Toxic Mercury or Bits bubble is in W1-W3 scope', () => {
    expect(curves.every((c) => c.materials.every((m) => !/^Liquid[34]$|^Bits$/.test(m.rawName)))).toBe(true);
    expect(curveRows({ power: [] }, [{ name: 'power', imageLetter: 'O' }])).toEqual([]);
  });
  it('every plan rawName is a generated curve (authored rows naming a missing rawName fail)', () => {
    const rows = planRows(ctx.kb) ?? [];
    expect(rows.length).toBe(9);
    for (const r of rows)
      for (const b of r.bubbles) expect(curves.some((c) => c.rawName === b.rawName)).toBe(true);
  });
});

describe('costs (F-b): no discount is the upper bound', () => {
  it('the undiscounted cost is finite and at least the floor at every W1-W3 bubble and level', () => {
    // The bound itself (every discount is a factor of at most 1, applied before the clamp) is Toolbox's
    // own code; the worker call takes no discounts, so here each undiscounted price is checked to exist.
    for (const c of curves)
      for (let level = 0; level <= 100; level += 7)
        for (const m of c.materials) {
          const full = toolboxCalls.bubbleCost(m.rawName, c.index, level, m.baseCost);
          expect(Number.isFinite(full)).toBe(true);
          expect(full).toBeGreaterThanOrEqual(/^Liquid/.test(m.rawName) ? m.baseCost : 1);
        }
  });
  it('the next level is priced at the current level (V3): Water rises by 1 every 20 levels', () => {
    expect(toolboxCalls.bubbleCost('Liquid1', 0, 19, 2)).toBe(2);
    expect(toolboxCalls.bubbleCost('Liquid1', 0, 20, 2)).toBe(3);
  });
});

describe('allocation (FR-3)', () => {
  const f = listFixtures({ private: false }).find((x) => x.id === 'scrubbed-w3');
  if (!f) throw new Error('no scrubbed-w3');
  const base = stateOf(f);
  const tree = classTree(lookupOf(ctx.kb));
  const plan = (s: AccountState) =>
    runPlan({
      state: s,
      stage: 'W3-early',
      band: 'w3',
      rows: planRows(ctx.kb) ?? [],
      curves: new Map(curves.map((c) => [c.rawName, c])),
      cost: toolboxCalls.bubbleCost,
      isA: (c, a) => tree.isA(c, a),
    });

  it('rows sharing Water never count it twice: the three rows take what is there, in order', () => {
    const r = plan(base);
    const spent = (r?.entries ?? []).reduce((n, e) => n + (e.liquidSpent[0] ?? 0), 0);
    const water = base.account.liquids?.find((l) => l.index === 0)?.current ?? 0;
    expect(spent).toBeLessThanOrEqual(water);
    expect(r?.entries.slice(0, 3).map((e) => [e.name, e.from, e.to])).toEqual([
      ['Roid Ragin', 12, 25],
      ['Swift Steppin', 1, 25],
      ['Stable Jenius', 9, 13],
    ]);
    expect(r?.entries.slice(0, 2).reduce((n, e) => n + (e.liquidSpent[0] ?? 0), 0)).toBe(84);
  });

  it('two rows sharing Spore Cap never both count the same Spore Caps', () => {
    const s = structuredClone(base);
    if (s.account.liquids) for (const l of s.account.liquids) l.current = 1e6;
    if (s.account.storageItems) s.account.storageItems.Grasslands1 = 10;
    const r = plan(s);
    const multis = (r?.entries ?? []).filter((e) => /^aUpgrades[OGP]1$/.test(e.rawName));
    const spores = multis.reduce((n, e) => {
      let k = 0;
      for (let l = e.from; l < e.from + e.atLeast; l++) k += toolboxCalls.bubbleCost('Grasslands1', 1, l, 3);
      return n + k;
    }, 0);
    expect(spores).toBeLessThanOrEqual(10);
  });

  it('a row stops at its band', () => {
    const s = structuredClone(base);
    if (s.account.liquids) for (const l of s.account.liquids) l.current = 1e9;
    for (const e of plan(s)?.entries ?? []) expect(e.from + e.atLeast).toBeLessThanOrEqual(e.band);
  });

  it('belowW2Band is set while an unlocked row is under its W2 band (FR-28)', () => {
    expect(plan(base)?.belowW2Band).toBe(true);
    const s = structuredClone(base);
    const p = s.account.alchemyPlan;
    if (p)
      for (const k of Object.keys(p.bubbleLevels) as (keyof typeof p.bubbleLevels)[])
        p.bubbleLevels[k] = p.bubbleLevels[k].map((l) => Math.max(l, 12));
    expect(plan(s)?.belowW2Band).toBe(false);
  });
});
