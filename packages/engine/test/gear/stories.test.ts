// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 user stories (docs/specs/M18-gear-tools.md §4) on the scrubbed saves, which are the two private
// accounts with names removed: CI runs them. By class and level only, never a name (TR-9). The empty-slot
// crafts may ride in M15's Behind Goal as its Next Action or details, so lines are looked up across all
// Goals' texts.
import type { AccountState, GearWorn } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { buildSmithy, gearFacts, Pool, pathTo } from '../../src/gear';
import type { Ctx } from '../../src/gear/paths';
import { setWarnings } from '../../src/gear/paths';
import type { EngineResult, Goal } from '../../src/result';
import { gearGoals, kb, run, scrubbedFile, slotOf, workerState } from './helpers';

const W2 = () => workerState(scrubbedFile('scrubbed-w2'));
const W3 = () => workerState(scrubbedFile('scrubbed-w3'));
const copy = (s: AccountState) => structuredClone(s);
const T = 60_000;

const goal = (r: EngineResult, id: string, subject = 'account'): Goal | undefined =>
  gearGoals(r).find((g) => g.goal.id === id && g.subject === subject)?.goal;
/** Every line a player reads: Next Actions and details, wherever they rank (the Behind Goal included). */
const lines = (r: EngineResult) =>
  [...r.account.goals, ...r.characters.flatMap((c) => c.goals)].flatMap((g) => [
    g.nextAction.text,
    ...(g.details ?? []).map((d) => d.text),
  ]);
const gearOf = (r: EngineResult, index: number) => r.gear?.characters.find((c) => c.index === index);
const slot = (r: EngineResult, index: number, s: string) => gearOf(r, index)?.slots.find((x) => x.slot === s);
const wear = (st: AccountState, index: number, s: number, w: GearWorn) => {
  const c = st.characters.find((x) => x.index === index);
  if (c?.gear) c.gear[s] = w;
};

describe('US-1 use what I already have', () => {
  it(
    'W3-early: one account Goal at position 3, the Bowman Lv 60 and the Shaman Lv 54',
    () => {
      const r = run(W3());
      const g = goal(r, 'gear.check.equip-held');
      expect(g?.nextAction.text).toBe('Equip gear you already hold on 2 characters');
      expect(g?.details?.map((d) => d.text)).toEqual([
        'Bowman Lv 60: Gold Helmet, Copper Platebody and Copper Platelegs from storage',
        'Shaman Lv 54: Farmer Brim from storage',
      ]);
      expect(g?.nextAction.why).toBe(
        'Better gear for these characters is sitting unused. Nothing to craft or buy.',
      );
    },
    T,
  );

  // The spec's case says the Gold Helmet then goes to the Shaman Lv 54; FR-3 and FR-6 say otherwise. It
  // has no WIS, so it doesn't dominate the Shaman's Green Headband, and in the replacement pass (higher
  // class level first) the Barbarian Lv 56's Copper Helmet is the first it beats (build note in the PR).
  it(
    'a Bowman that already wears a helmet: the Gold Helmet skips the Wizard Lv 73 (a trade) for the Barbarian Lv 56',
    () => {
      const st = copy(W3());
      wear(st, slotOf(st, 'Bowman', 60), 0, 'EquipmentHats29');
      const r = run(st);
      const details = goal(r, 'gear.check.equip-held')?.details?.map((d) => d.text) ?? [];
      expect(details.some((d) => d.startsWith('Wizard Lv 73'))).toBe(false);
      expect(details).toContain('Barbarian Lv 56: Gold Helmet from storage');
      expect(details).toContain('Shaman Lv 54: Farmer Brim from storage');
    },
    T,
  );

  it(
    "W2-late: three characters, a bag and a tool among them; the Barbarian Lv 60's Old Hatchet is free stats only",
    () => {
      const st = W2();
      const r = run(st);
      const g = goal(r, 'gear.check.equip-held');
      expect(g?.nextAction.text).toBe('Equip gear you already hold on 3 characters');
      expect(g?.details?.map((d) => d.text)).toEqual([
        'Wizard Lv 56: 2 Copper Bands from storage',
        "Bowman Lv 54: Copper Band and Carrot Launcher from storage, Spore Tee from the Squire Lv 43's bag",
        'Squire Lv 43: Iron Pickaxe (it mines at Mining 20) from storage',
      ]);
      expect(g?.details?.some((d) => d.text.includes('Hatchet'))).toBe(false);
    },
    T,
  );

  it(
    'a later save where the Bowman wears the three pieces: that detail is gone, 1 character left',
    () => {
      const st = copy(W3());
      const i = slotOf(st, 'Bowman', 60);
      wear(st, i, 0, 'EquipmentHats28');
      wear(st, i, 2, 'EquipmentShirts11');
      wear(st, i, 4, 'EquipmentPants2');
      if (st.account.storageItems)
        for (const k of ['EquipmentHats28', 'EquipmentShirts11', 'EquipmentPants2'])
          st.account.storageItems[k] = 0;
      const r = run(st);
      const g = goal(r, 'gear.check.equip-held');
      expect(g?.nextAction.text).toBe('Equip gear you already hold on 1 character');
      expect(g?.details?.map((d) => d.text)).toEqual(['Shaman Lv 54: Farmer Brim from storage']);
    },
    T,
  );
});

describe('US-2 no empty slots', () => {
  it(
    'W2-late: Copper Platelegs for the Wizard Lv 56; the Bowman Lv 54 gets Copper Boots and Iron Platelegs',
    () => {
      const t = lines(run(W2()));
      expect(t.some((x) => x.endsWith('Craft Copper Platelegs for your pants (anvil tab 1)'))).toBe(true);
      expect(t.some((x) => x.endsWith('Craft Copper Boots for your shoes (anvil tab 1)'))).toBe(true);
      expect(t.some((x) => x.endsWith('Craft Iron Platelegs for your pants (anvil tab 1)'))).toBe(true);
      expect(t).toContain('Fill 1 empty ring slot: craft a Copper Band now');
    },
    T,
  );

  it(
    'W3-early: one line for 7 empty rings, Copper Bands now, Steel Band named as the better unlock',
    () => {
      const g = goal(run(W3()), 'gear.check.empty-slot');
      expect(g?.nextAction.text).toBe(
        'Fill 7 empty ring slots: craft Copper Bands now (100 Copper Bars each)',
      );
      expect(g?.details?.map((d) => d.text).sort()).toEqual([
        'Barbarian Lv 56: 2 rings',
        'Bowman Lv 60: 1 ring',
        'Shaman Lv 54: 2 rings',
        'Squire Lv 51: 2 rings',
      ]);
      expect(g?.nextAction.why).toContain(
        'Steel Band is better from Lv 15: Unlock Steel Band at the W1 Task Board',
      );
    },
    T,
  );

  it(
    'W3-early: Amarok Paws for 4 characters, one account line at position 3, and M14 says you hold everything',
    () => {
      const r = run(W3());
      const g = goal(r, 'gear.check.next-piece');
      expect(g?.nextAction.text).toBe('Craft Amarok Paws for 4 characters (anvil tab 1)');
      expect(g?.details?.map((d) => d.text)).toEqual([
        'Wizard Lv 73: shoes, over its Copper Boots',
        'Bowman Lv 60: empty shoes',
        'Shaman Lv 54: shoes, over its Copper Boots',
        'Squire Lv 51: shoes, over its Copper Boots',
      ]);
      expect(g?.walkthrough?.collapsed).toMatch(/^You hold everything/);
      const steps = g?.walkthrough?.steps.map((s) => s.text) ?? [];
      expect(steps.findIndex((s) => s.includes('Copper Boots'))).toBeLessThan(
        steps.findIndex((s) => s.includes('Iron Boots')),
      );
      expect(steps.at(-1)).toContain('Amarok Paws');
      // The Wizard, the Squire Lv 51 and the Shaman have no other gear Goal this run.
      for (const [cls, lv] of [
        ['Wizard', 73],
        ['Squire', 51],
        ['Shaman', 54],
      ] as const)
        expect(
          r.characters
            .find((c) => c.index === slotOf(W3(), cls, lv))
            ?.goals.filter((x) => x.id.startsWith('gear.')),
        ).toEqual([]);
    },
    T,
  );
});

describe('US-3 the tool for the job', () => {
  it(
    'W3-early: the Barbarian Lv 56 fishes with no rod: the Iron Fishing Rod, unlocked then crafted',
    () => {
      const st = W3();
      const r = run(st);
      const g = goal(r, 'gear.check.afk-tool', `c${slotOf(st, 'Barbarian', 56)}`);
      expect(g?.nextAction.text).toBe('Unlock the Iron Fishing Rod at the W1 Task Board, then craft it');
      expect(g?.nextAction.why).toBe(
        'Your Barbarian Lv 56 fishes with no rod: the tool sets its skill power.',
      );
      // X5: M6's unlock-point line names it first.
      const spend = r.account.goals.find((x) => x.id === 'task-unlocks.check.spend');
      expect(spend?.details?.map((d) => d.text)).toContain(
        'For gear, first: Spiked Menace, Pharaoh Bow, Iron Fishing Rod',
      );
    },
    T,
  );

  it(
    "W2-late: the Squire Lv 43's Iron Pickaxe is a hand-out, not a tool line; its ladder names the Gold Pickaxe's gates",
    () => {
      const st = W2();
      const r = run(st);
      const i = slotOf(st, 'Squire', 43);
      expect(goal(r, 'gear.check.afk-tool', `c${i}`)).toBeUndefined();
      const ladder = gearOf(r, i)?.ladders.find((l) => l.skill === 'mining');
      expect(ladder?.next).toBe('Gold Pickaxe at Mining 15: needs the W2 Task Board unlock and anvil tab 2');
    },
    T,
  );
});

describe('US-4 what to work toward', () => {
  it(
    'W3-early Squire Lv 85: The Ice Breaker, 45 levels behind; anvil tab 3 first (it opens the W3 unlocks)',
    () => {
      const st = W3();
      const r = run(st);
      const i = slotOf(st, 'Squire', 85);
      const g = goal(r, 'gear.check.next-piece', `c${i}`);
      expect(g?.title).toBe('Next piece: The Ice Breaker for your weapon');
      expect(g?.nextAction.text).toBe('Craft Anvil Tab 3 to open the W3 Task Board unlocks');
      expect(slot(r, i, 'weapon')?.word).toBe('45 levels behind');
      const tree = g?.walkthrough?.tree.map((l) => l.text).join('\n') ?? '';
      expect(tree).toContain('Anvil Tab 3');
      expect(tree).toContain('Enforced Slasher');
    },
    T,
  );

  it(
    'W3-early Wizard Lv 73: no gear Goal of its own; its Quarterstaff reads 38 levels behind',
    () => {
      const st = W3();
      const r = run(st);
      const i = slotOf(st, 'Wizard', 73);
      expect(gearGoals(r).filter((g) => g.subject === `c${i}`)).toEqual([]);
      expect(slot(r, i, 'weapon')?.word).toBe('38 levels behind');
    },
    T,
  );

  it(
    'W2-late Barbarian Lv 60: Enforced Slasher, 39 levels behind, behind anvil tab 2 and Smithing 23',
    () => {
      const st = W2();
      const r = run(st);
      const i = slotOf(st, 'Barbarian', 60);
      const g = goal(r, 'gear.check.next-piece', `c${i}`);
      expect(g?.title).toBe('Next piece: Enforced Slasher for your weapon');
      expect(g?.nextAction.text).toBe('Craft Anvil Tab 2 to open the W2 Task Board unlocks');
      expect(gearOf(r, i)?.status).toBe('weapon 39 levels behind');
      expect(g?.walkthrough?.tree.some((l) => l.text.startsWith('Smithing 23'))).toBe(true);
    },
    T,
  );

  it(
    'W3-early Bowman Lv 60: Pharaoh Bow, the Spiked Menace unlock first',
    () => {
      const st = W3();
      const g = goal(run(st), 'gear.check.next-piece', `c${slotOf(st, 'Bowman', 60)}`);
      expect(g?.title).toBe('Next piece: Pharaoh Bow for your weapon');
      expect(g?.nextAction.text).toBe('Unlock Spiked Menace at the W2 Task Board (Unlocks tab)');
    },
    T,
  );
});

describe("US-5 don't lose a set", () => {
  const ctxOf = (st: AccountState): Ctx => {
    const facts = gearFacts(kb);
    if (!facts) throw new Error('no gear facts');
    const worn = new Map(st.characters.map((c) => [c.index, []]));
    const smithy = buildSmithy(st, kb, facts, worn as never);
    return {
      state: st,
      facts,
      kb,
      pool: new Pool(st),
      points: { left: 10, bought: 16 },
      unregistered: smithy.unregistered,
      smithyDays: smithy.daysLeft,
    };
  };
  it(
    'a Gold Helmet for the Squire Lv 51 uses its Copper Helmet: register the Copper set first, or craft a spare',
    () => {
      const st = W3();
      const ctx = ctxOf(st);
      const piece = ctx.facts.ladder.get('EquipmentHats28');
      if (!piece) throw new Error('no Gold Helmet');
      const p = pathTo(ctx, piece, 1, new Map([['EquipmentHats17', 1]]));
      expect(p.usesWorn).toEqual(['EquipmentHats17']);
      expect(setWarnings(ctx, p, () => 0)).toEqual([
        'This uses your Copper Helmet. The Smithy opens in 25 days, and the Copper set needs this piece: craft a spare.',
      ]);
    },
    T,
  );

  it(
    "the Squire Lv 85's Ice Breaker warns about the Royal Bayonet's Gold set and its 3 stones",
    () => {
      const st = W3();
      const why =
        goal(run(st), 'gear.check.next-piece', `c${slotOf(st, 'Squire', 85)}`)?.nextAction.why ?? '';
      expect(why).toContain(
        'This uses your Royal Bayonet. The Smithy opens in 25 days, and the Gold set needs this piece',
      );
      expect(why).toContain('It has 3 upgrade stones in it.');
    },
    T,
  );
});

describe('US-6 the Smithy when it opens', () => {
  it(
    'the countdown on both saves, and no Smithy Goal while it waits',
    () => {
      for (const [st, days] of [
        [W2(), 26],
        [W3(), 25],
      ] as const) {
        const r = run(st);
        expect(r.gear?.smithy.line).toBe(`Opens in ${days} days, or once 2,000 gems were bought`);
        expect(gearGoals(r).filter((g) => g.goal.id.startsWith('armor-smithy.'))).toEqual([]);
      }
    },
    T,
  );

  it(
    'after the 30 days: hire it, at position 3',
    () => {
      const st = copy(W3());
      if (st.account.armorSmithy)
        st.account.armorSmithy = { ...st.account.armorSmithy, canHire: true, daysWaited: 30 };
      const g = goal(run(st), 'armor-smithy.check.hire');
      expect(g?.nextAction.text).toBe('Hire the Armor-set Smithy in Frostbite Towndra');
    },
    T,
  );

  it(
    'hired: register the Copper set, with where each part is; the Iron card names the Iron Pickaxe in storage',
    () => {
      const st = copy(W3());
      if (st.account.armorSmithy)
        st.account.armorSmithy = { ...st.account.armorSmithy, canHire: true, hired: true };
      const r = run(st);
      const g = goal(r, 'armor-smithy.check.register');
      expect(g?.nextAction.text).toBe('Register the Copper set: wear it all, log in, tap a piece');
      expect(g?.details?.length).toBeGreaterThan(0);
      expect(g?.details?.every((d) => /: (worn by your .+ Lv \d+|in storage or a bag)$/.test(d.text))).toBe(
        true,
      );
      expect(r.gear?.smithy.sets.find((s) => s.set === 'IRON_SET')?.line).toBe(
        '1 of 4 parts: the Iron Pickaxe in storage',
      );
    },
    T,
  );
});

describe('US-7 the pictures light one thing', () => {
  it(
    "the Bowman Lv 60's Gear tab: three slots empty with one held, shoes empty, the helmet lit",
    () => {
      const st = W3();
      const r = run(st);
      const i = slotOf(st, 'Bowman', 60);
      for (const s of ['helmet', 'shirt', 'pants']) expect(slot(r, i, s)?.word).toBe('empty · one held');
      expect(slot(r, i, 'shoes')?.word).toBe('empty');
      expect(gearOf(r, i)?.lit).toBe('helmet');
      expect(gearOf(r, i)?.step).toBe('Equip the Gold Helmet from storage');
    },
    T,
  );

  it(
    'the heat strip: 6 rows, 9 columns, the Bowman Lv 60 helmet cell carries the hand-out key',
    () => {
      const st = W3();
      const r = run(st);
      expect(r.gear?.heat.rows).toHaveLength(6);
      expect(r.gear?.heat.columns).toHaveLength(9);
      const row = r.gear?.heat.rows.find((x) => x.index === slotOf(st, 'Bowman', 60));
      expect(row?.cells[0]?.actionKey).toBe('gear.check.equip-held@account');
    },
    T,
  );
});

describe('FR-29 determinism, FR-30 fail closed', () => {
  it(
    'the same state gives byte-identical gear output',
    () => {
      const a = run(W3()).gear;
      const b = run(W3()).gear;
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    },
    T,
  );

  it(
    'unknown recipe states: the pieces still show, with no "craft now" and no unlock step',
    () => {
      const st = copy(W3());
      st.account.anvilRecipes = null;
      const r = run(st);
      const texts = gearGoals(r)
        .filter((g) => g.goal.id === 'gear.check.next-piece')
        .map((g) => g.goal.nextAction.text);
      expect(texts.length).toBeGreaterThan(0);
      expect(texts.some((t) => /now|^Unlock/.test(t))).toBe(false);
      expect(texts.some((t) => t.includes('Check how'))).toBe(true);
    },
    T,
  );

  it(
    'an item this version does not know makes that one slot unknown',
    () => {
      const st = copy(W3());
      const i = slotOf(st, 'Squire', 85);
      wear(st, i, 1, '?');
      const r = run(st);
      expect(slot(r, i, 'weapon')?.state).toBe('unknown');
      expect(slot(r, i, 'helmet')?.state).not.toBe('unknown');
    },
    T,
  );
});
