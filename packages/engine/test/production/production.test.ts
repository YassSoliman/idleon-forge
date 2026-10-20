// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C Wave C acceptance (docs/specs/M26-crafting-guidance.md section 11): the ranking rule as pure
// tests (7.2 to 7.5), and the stories on the public W4-entry save first.json (US-C1, US-C3, US-C5, US-C5b,
// US-C6, US-C9, US-C10, US-C2's answer) through the worker's modules. Characters by class and level only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runEngine } from '../../src/core/engine';
import { createGearModule } from '../../src/gear';
import { type AnvilProduct, createProductionModule, planAnvil, splitGates } from '../../src/production';
import type { ProductionResult } from '../../src/production/types';
import { bottleneckOf } from '../../src/walkthrough/plan';
import { kb, modules, workerState } from '../walkthrough/helpers';

const P = (index: number, requiredAmount: number, exp: number, levelReq = 1): AnvilProduct => ({
  index,
  rawName: `P${index}`,
  requiredAmount,
  levelReq,
  exp,
});
// Thread-like (60 EXP per 1,000 work), Nails-like (50), Brick-like (46).
const PRODUCTS = [P(0, 100, 6), P(1, 200, 10), P(2, 350, 16)];
const base = {
  stock: [0, 0, 0],
  capacity: 1_000_000,
  speed: 1000,
  smithingLevel: 50,
  hours: 8,
  products: PRODUCTS,
  sourceOf: () => null,
  keepRatio: 1.1,
};

describe('7.2 to 7.5: the anvil ranking (pure)', () => {
  it('with no cap, every hammer goes to the most EXP per work (multisets, not slots)', () => {
    const r = planAnvil({ ...base, hammers: [2, 1, 0], demand: new Map() });
    expect(r.kind).toBe('switch');
    expect([...r.to].sort()).toEqual([0, 0, 0]);
    // The hammer already on product 0 stays there (aligned with the current hammers).
    expect(r.to[2]).toBe(0);
  });
  it('the cap clips Thread: a small anvil spreads its hammers (RC3)', () => {
    const r = planAnvil({
      ...base,
      capacity: 1495,
      speed: 25_678,
      hammers: [3, 4, 5].map(() => 0),
      demand: new Map(),
    });
    expect(new Set(r.to).size).toBeGreaterThan(1);
  });
  it('keeps below the threshold and switches at it (1.09x keeps, 1.10x switches)', () => {
    // Current all on product 1 (50/1000); best all on product 0 (60/1000): 1.2x. With keepRatio 1.25 it keeps.
    const keep = planAnvil({ ...base, hammers: [1, 1, 1], demand: new Map(), keepRatio: 1.25 });
    expect(keep.kind).toBe('keep');
    const sw = planAnvil({ ...base, hammers: [1, 1, 1], demand: new Map(), keepRatio: 1.2 });
    expect(sw.kind).toBe('switch');
  });
  it('Demand first, then the fallback over the rest (7.3: one Demand hammer, two EXP hammers)', () => {
    const demand = new Map([['P2', 20]]); // one hammer makes about 22.9 in 8 h
    const r = planAnvil({
      ...base,
      hammers: [0, 0, 0],
      demand,
      sourceOf: (raw) => (raw === 'P2' ? { rank: 1, target: 'Anvil Tab 2' } : null),
    });
    expect(r.kind).toBe('demand');
    expect(r.to.filter((x) => x === 2)).toHaveLength(1);
    expect(r.to.filter((x) => x === 0)).toHaveLength(2);
    expect(r.demand?.target).toBe('Anvil Tab 2');
    expect(demand.get('P2')).toBeLessThanOrEqual(0);
  });
  it('a free hammer always gets a product', () => {
    const r = planAnvil({ ...base, hammers: [0, 0, -1], demand: new Map() });
    expect(r.kind).toBe('switch');
    expect(r.to).not.toContain(-1);
  });
});

describe('FR-C12: one Bottleneck rule', () => {
  const leaf = (rawName: string, seconds: number | null, kind: 'job' | 'blocked' = 'job') => ({
    leaf: { kind: 'item', rawName, depth: 1 } as never,
    effort: { kind, seconds, supply: null },
  });
  it('an unrated or blocked leaf is never the Bottleneck', () => {
    expect(bottleneckOf([leaf('a', null), leaf('b', null, 'blocked')])).toBeNull();
    expect((bottleneckOf([leaf('a', null), leaf('b', 60)]) as { rawName: string }).rawName).toBe('b');
  });
});

const FIRST = fileURLToPath(new URL('../../../account-state/fixtures/public/first.json', import.meta.url));

function production(): {
  p: ProductionResult;
  label: (i: number) => string;
  index: (cls: string, lv: number) => number;
} {
  const state = workerState(FIRST);
  const mods = modules();
  const at = mods.findIndex((m) => m.id === 'walkthroughs');
  const all = [
    ...mods.slice(0, at),
    createGearModule({ kb }),
    ...mods.slice(at),
    createProductionModule({ kb }),
  ];
  const r = runEngine(
    {
      state,
      history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
      knowledge: { version: 'test', coverage: () => [], kb },
      now: state.asOf,
      options: { expectedReturnSeconds: 8 * 3600 },
    },
    all,
  );
  if (!r.production) throw new Error('no production');
  const index = (cls: string, lv: number) =>
    state.characters.find((c) => c.class === cls && c.level === lv)?.index ?? -1;
  return { p: r.production, label: (i) => `${i}`, index };
}

describe('first.json (W4-entry): the Production Plan', () => {
  const { p, index } = production();
  const rowsOf = (i: number) => p.rows.filter((r) => r.characterIndex === i);
  const dk = index('Divine_Knight', 86);
  const es = index('Elemental_Sorcerer', 87);
  const ma = index('Maestro', 73);
  const bb = index('Blood_Berserker', 96);

  it('US-C5: the Divine Knight switches its three hammers for about 1.6x the Smithing EXP', () => {
    const a = rowsOf(dk).find((r) => r.producer === 'anvil');
    expect(a?.text).toBe('Anvil: switch to Trusty Nails, Boring Brick and Boring Brick');
    expect(a?.chip?.text).toBe('about 1.6x the Smithing EXP');
    expect(a?.why).toContain("Nothing you're working toward needs Chain Link, Leather Hide or Pinion Spur");
    expect(a?.why).toContain('Thread would fill this anvil (1,495)');
    expect(a?.claim).toBe(`anvil:products@c${dk}`);
  });
  it('US-C5b: the Elemental Sorcerer collects its full Chain Link first', () => {
    const a = rowsOf(es).find((r) => r.producer === 'anvil');
    expect(a?.text).toBe('Anvil: collect Chain Link, it is full');
    expect(a?.why).toContain('1,202 of 1,195');
  });
  it('US-C6: the Maestro keeps; 6 of 7 anvils switch for about 1.8x across the account', () => {
    expect(rowsOf(ma).find((r) => r.producer === 'anvil')?.kind).toBe('keep');
    expect(p.anvils.line).toBe('6 of 7 anvils should switch');
    expect(p.anvils.detail).toContain('Maestro Lv 73 keeps');
  });
  it('US-C7: speed-ups are steps (stamp at cap, Hammer Hammer on, the unspent point)', () => {
    const steps =
      rowsOf(dk)
        .find((r) => r.producer === 'anvil')
        ?.steps.map((s) => s.text) ?? [];
    expect(steps).toContain(
      'Anvil Zoomer Stamp is 25 of 25: raise its cap (each level adds about 0.3% anvil speed here)',
    );
    expect(steps).toContain('Hammer Hammer is on: its extra hammer and speed count');
    expect(steps.some((s) => s.startsWith('1 anvil point unspent'))).toBe(true);
  });
  it('US-C1, US-C9: craft next is The Ice Breaker, its gate a link to its recipe', () => {
    const c = rowsOf(dk).find((r) => r.producer === 'craft-next');
    expect(c?.text).toBe('Craft next: The Ice Breaker');
    expect(c?.why).toBe(
      'every material held (it uses the Enforced Slasher you wear) · weapon 25 levels behind',
    );
    expect(c?.gate?.label).toBe('Anvil tab 3');
    expect(c?.gate?.href).toBe('#system-anvil?tab=recipes&focus=EquipmentSword2');
    expect(rowsOf(bb).find((r) => r.producer === 'craft-next')?.text).toBe('Craft next: Golden Net');
  });
  it('US-C10: two shared crafts, most characters first', () => {
    expect(p.shared.map((x) => x.text)).toEqual(['Craft 4 Golden Nets', 'Craft 3 Iron Fishing Rods']);
    expect(p.shared[0]?.detail).toContain('you hold enough for 3 of 4 (Butterfly: 10,109 of 12,550)');
    expect(p.shared[1]?.detail).toContain('you hold enough for all 3');
  });
  it('US-C2, US-C3: the next tab and the Recipes tab', () => {
    expect(p.nextTab?.answer).toBe('Craft Anvil Tab 4: 0 of 4 materials ready');
    expect(p.nextTab?.bottleneck).toContain("can't tell");
    const t = p.tabs.map((x) => [x.tab, x.status]);
    expect(t).toEqual([
      [1, 'owned'],
      [2, 'owned'],
      [3, 'owned'],
      [4, 'locked'],
      [5, 'later'],
    ]);
    const t3 = p.tabs[2];
    expect([t3?.crafted, t3?.open, t3?.locked]).toEqual([8, 55, 9]);
    expect(p.names.EquipmentSword2).toBe('The Ice Breaker');
  });
});

describe('FR-C1: gates in words become links', () => {
  const state = workerState(FIRST);
  it('"(anvil tab 3)" is a chip; "Craft Anvil Tab 4" keeps its words and gains the chip', () => {
    const a = splitGates('Craft Golden Net now (anvil tab 2)', state, kb);
    expect(a[0]).toBe('Craft Golden Net now');
    expect(a[1]).toMatchObject({ kind: 'gate', label: 'Anvil tab 2', met: true });
    const b = splitGates('Craft Anvil Tab 4 at the anvil', state, kb);
    expect(b[0]).toBe('Craft Anvil Tab 4');
    expect(b[1]).toMatchObject({ kind: 'gate', met: false, ready: 0, of: 4 });
    expect(b[2]).toBe(' at the anvil');
  });

  it("each tab gate's sprite is its own tab's numeral (tab 1 is I, not II)", () => {
    const { p } = production();
    expect(p.tabGates.map((g) => [g.label, g.icon])).toEqual(
      [1, 2, 3, 4, 5].map((t) => [t <= 3 ? `Anvil tab ${t}` : `Anvil Tab ${t}`, `EquipmentSmithingTabs${t}`]),
    );
  });
});
