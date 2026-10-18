// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 TR-10: the dominance rule (FR-3) as a table, the hand-out (FR-6) on synthetic holdings, the
// worn-piece rule (FR-15), and the generated ladder against Toolbox's sets and the Gear Plan.
import type { AccountState, CharacterState, HeldGear, WornSlot } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { better, gearFacts, handOut, Pool, pathTo } from '../../src/gear';
import { nextToolTier, type Stats } from '../../src/gear/judge';
import type { Ctx } from '../../src/gear/paths';
import { kb } from './helpers';

const facts = (() => {
  const f = gearFacts(kb);
  if (!f) throw new Error('gear facts not shipped');
  return f;
})();
const item = (over: Partial<Stats> = {}): Stats => ({
  cls: 'ALL',
  lvReq: 1,
  def: 5,
  wp: 0,
  str: 3,
  agi: 0,
  wis: 0,
  luk: 0,
  pct: [],
  ...over,
});

describe('FR-3 better, without a formula', () => {
  it.each([
    ['an empty slot', item(), null, true],
    ['more Defence, same STR', item({ def: 6 }), item(), true],
    ['equal in everything', item(), item(), false],
    ['a trade: more Defence, less STR', item({ def: 9, str: 2 }), item(), false],
    ['a lost % line', item({ def: 9 }), item({ pct: [{ txt: '%_DEFENCE', val: 3 }] }), false],
    [
      'a lower % line',
      item({ def: 9, pct: [{ txt: '%_DEFENCE', val: 2 }] }),
      item({ pct: [{ txt: '%_DEFENCE', val: 3 }] }),
      false,
    ],
    [
      'the same % line at least as high',
      item({ def: 9, pct: [{ txt: '%_DEFENCE', val: 3 }] }),
      item({ pct: [{ txt: '%_DEFENCE', val: 3 }] }),
      true,
    ],
  ] as const)('helmet: %s', (_, x, e, want) => {
    expect(better(x as Stats, e as Stats | null, 'helmet', 'str')).toBe(want);
  });
  it('rings: Defence and Weapon Power each on their own (no sum)', () => {
    expect(better(item({ def: 6, wp: 0 }), item({ def: 3, wp: 1 }), 'ring1', 'str')).toBe(false);
    expect(better(item({ def: 3, wp: 2 }), item({ def: 3, wp: 1 }), 'ring1', 'str')).toBe(true);
  });
  it('weapons and tools compare Weapon Power, not Defence', () => {
    expect(better(item({ wp: 10, def: 0 }), item({ wp: 8, def: 5 }), 'weapon', 'str')).toBe(true);
    expect(better(item({ wp: 10, def: 0 }), item({ wp: 8, def: 5 }), 'pickaxe', 'str')).toBe(true);
  });
});

describe('FR-6 the hand-out', () => {
  const base = {
    asOf: 0,
    account: { gearItems: {}, storageItems: {} },
    characters: [],
    diagnostics: { unknownFields: [], unreadableCharacters: [], failedSections: [], failedSideReads: [] },
  } as unknown as AccountState;
  const char = (index: number, cls: string, level: number) =>
    ({ index, class: cls, level, afkType: 'FIGHTING', skillLevels: {} }) as unknown as CharacterState;
  const slots = (helmet: Stats | null): WornSlot[] =>
    (
      [
        'helmet',
        'weapon',
        'shirt',
        'pendant',
        'pants',
        'ring1',
        'shoes',
        'ring2',
        'pickaxe',
        'hatchet',
        'rod',
        'net',
      ] as const
    ).map((slot) => ({
      slot,
      item:
        slot === 'helmet' && helmet
          ? ({ rawName: 'Old', name: 'Old', type: 'HELMET', slotsLeft: 0, slotsMax: 0, ...helmet } as never)
          : null,
    }));
  const gold: HeldGear = {
    rawName: 'EquipmentHats28',
    name: 'Gold Helmet',
    type: 'HELMET',
    slotsLeft: 3,
    slotsMax: 3,
    count: 1,
    places: [{ place: 'storage', count: 1 }],
    ...item({ def: 15, str: 7, agi: 7, lvReq: 35 }),
  } as HeldGear;

  it('one held Gold Helmet, two candidates: the empty slot first, whatever the level', () => {
    const a = char(0, 'Squire', 80);
    const b = char(1, 'Barbarian', 50);
    const worn = new Map([
      [0, slots(item({ def: 4 }))],
      [1, slots(null)],
    ]);
    const out = handOut(base, facts, [a, b], worn, [gold]);
    expect(out.map((o) => [o.index, o.slot])).toEqual([[1, 'helmet']]);
  });

  it('never below the level gate, never a trade', () => {
    const low = char(0, 'Squire', 20);
    const worn = new Map([[0, slots(null)]]);
    expect(handOut(base, facts, [low], worn, [gold])).toEqual([]);
    const mage = char(0, 'Wizard', 80);
    const w2 = new Map([[0, slots(item({ def: 4, wis: 11, str: 0 }))]]);
    expect(handOut(base, facts, [mage], w2, [gold])).toEqual([]);
  });
});

describe('FR-15 the worn piece counts only for its wearer', () => {
  const ctxOf = (state: AccountState): Ctx => ({
    state,
    facts,
    kb,
    pool: new Pool(state),
    points: { left: 0, bought: 0 },
    unregistered: new Map(),
    smithyDays: null,
  });
  const empty = {
    asOf: 0,
    account: { storageItems: {}, anvilRecipes: [Array(84).fill(1), Array(80).fill(0)], anvilTabsOwned: 2 },
    characters: [{ index: 0, smithingLevel: 50, inventoryItems: {} }],
    diagnostics: { unknownFields: [], unreadableCharacters: [], failedSections: [], failedSideReads: [] },
  } as unknown as AccountState;
  it('Amarok Paws over Copper Boots worn: Iron Boots is crafted from them; without them, Copper Boots first', () => {
    const paws = facts.ladder.get('EquipmentShoes20');
    if (!paws) throw new Error('no Amarok Paws');
    const worn = pathTo(ctxOf(empty), paws, 1, new Map([['EquipmentShoes1', 1]]));
    expect(worn.usesWorn).toEqual(['EquipmentShoes1']);
    const bare = pathTo(ctxOf(empty), paws, 1, new Map());
    expect(bare.usesWorn).toEqual([]);
    expect(bare.all.some((s) => s.kind === 'craft' && s.depth === 2)).toBe(true);
  });
});

describe('TR-10 the generated ladder', () => {
  it('holds every part of the nine W1–W3 Smithy sets that a slot can judge, and every Gear Plan piece', () => {
    for (const set of facts.sets)
      for (const raw of [...set.armors, ...set.tools, ...set.weapons])
        if (!/^(TrapBoxSet|WorshipSkull)/.test(raw)) expect(facts.ladder.has(raw), raw).toBe(true);
    for (const row of facts.plan) expect(facts.ladder.has(row.piece), row.piece).toBe(true);
    expect(facts.sets.map((s) => s.set)).toEqual([
      'COPPER_SET',
      'IRON_SET',
      'AMAROK_SET',
      'GOLD_SET',
      'PLATINUM_SET',
      'EFAUNT_SET',
      'DEMENTIA_SET',
      'VOID_SET',
      'CHIZOAR_SET',
    ]);
  });
  it("every recipe row's task source agrees with the ladder's Task Board position", () => {
    for (const [raw, r] of facts.recipes) {
      const p = facts.ladder.get(raw);
      expect(p, raw).toBeDefined();
      if (r.from === 'task') expect(p?.unlock, raw).not.toBeNull();
      if (p?.unlock) expect(r.from, raw).toBe('task');
    }
  });
});

describe('R9 QA P2-2 the next tool tier, one function for the Now tab and the Gear tab', () => {
  // The rod ladder from the generated facts: Copper 4, Iron 9, Gold 15 (consumes Iron), Plat 25 ...
  const rods = [...facts.ladder.values()].filter((p) => p.slot === 'rod').sort((a, b) => a.lvReq - b.lvReq);
  const rod = (name: string) => rods.find((p) => p.name === name);

  it('with no rod at Fishing 22, the next rod is Iron: the Gold rod is crafted from an Iron one', () => {
    expect(rod('Gold Fishing Rod')?.consumes.map((q) => q.rawName)).toContain(
      rod('Iron Fishing Rod')?.rawName,
    );
    expect(nextToolTier(rods, null, 22)?.name).toBe('Iron Fishing Rod');
  });

  it('holding the Iron rod, the next rod is the best one the level allows', () => {
    const iron = rod('Iron Fishing Rod');
    if (!iron) throw new Error('no Iron Fishing Rod in the ladder');
    expect(nextToolTier(rods, iron, 22)?.name).toBe('Gold Fishing Rod');
    expect(nextToolTier(rods, iron, 12)?.name).toBe('Gold Fishing Rod');
  });
});
