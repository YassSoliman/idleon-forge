// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 Alchemy user stories (docs/specs/M19-alchemy.md section 4) on the scrubbed saves, through the full
// golden engine with Toolbox's bubble cost function. Fixtures are named by class and level only.
import type { AccountState } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import { toolboxCalls } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { potLine, renderAlchemyText, tubeLine } from '../../src/alchemy/text';
import { vialTries } from '../../src/alchemy/vials';
import { goldenResult } from '../../src/golden';
import type { EngineResult, Goal } from '../../src/result';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const fixture = (id: string) => {
  const f = fixtures.find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  return f;
};
const run = (id: string, edit?: (s: AccountState) => AccountState, toolbox = true): EngineResult => {
  const f = fixture(id);
  const state = edit ? edit(structuredClone(stateOf(f))) : stateOf(f);
  return goldenResult({
    state,
    kb: ctx.kb,
    registries: ctx.registries,
    now: f.now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
    ...(toolbox ? { toolbox: { bubbleCost: toolboxCalls.bubbleCost } } : {}),
  });
};
const goal = (r: EngineResult, id: string): Goal | undefined => r.account.goals.find((g) => g.id === id);
const details = (g: Goal | undefined) => (g?.details ?? []).map((d) => d.text);

const w2 = run('scrubbed-w2');
const w3 = run('scrubbed-w3');

describe('US-1 which bubble', () => {
  it('W2-late: Roid Ragin 3 → 12, at least 9 levels, then Swift Steppin 1 → 8', () => {
    const g = goal(w2, 'alchemy-bubbles.goal.level-next');
    expect(g?.nextAction.text).toBe('Level Roid Ragin 3 → 12 (Power cauldron)');
    expect(g?.nextAction.why).toContain('at least 9 levels');
    expect(g?.nextAction.why).toContain('Copper Ore and Water');
    expect(details(g)).toEqual(['then Swift Steppin 1 → 8 (Quicc)']);
    expect(g?.category).toBe('compounding');
  });

  it('W3-early: Roid Ragin 12 → 25 and Swift Steppin take 84 of the Water; Stable Jenius gets 9 → 13', () => {
    const g = goal(w3, 'alchemy-bubbles.goal.level-next');
    expect(g?.nextAction.text).toBe('Level Roid Ragin 12 → 25 (Power cauldron)');
    expect(g?.nextAction.why).toContain('at least 13 levels');
    expect(details(g)).toEqual(['then Swift Steppin 1 → 25 (Quicc)', 'then Stable Jenius 9 → 13 (High-IQ)']);
  });

  it('every row at its W3 band: no bubble Goal, and the page says the plan is met', () => {
    const r = run('scrubbed-w3', (s) => {
      const p = s.account.alchemyPlan;
      if (p)
        for (const k of Object.keys(p.bubbleLevels) as (keyof typeof p.bubbleLevels)[])
          p.bubbleLevels[k] = p.bubbleLevels[k].map((l) => Math.max(l, 70));
      return s;
    });
    expect(goal(r, 'alchemy-bubbles.goal.level-next')).toBeUndefined();
    expect(r.alchemy?.planMet).toBe(true);
    expect(r.alchemy?.notes.planMet).toBe('Bubble Plan met for your Stage');
  });

  it('without the Toolbox cost function M19 stays silent and reads unknown (fail closed)', () => {
    const r = run('scrubbed-w2', undefined, false);
    expect(goal(r, 'alchemy-bubbles.goal.level-next')).toBeUndefined();
    expect(r.unknownFindings?.some((u) => u.entryId === 'alchemy-bubbles.goal.level-next')).toBe(true);
  });

  it('no M19 output on a W1 account', () => {
    const r = run('scrubbed-w2', (s) => ({ ...s, account: { ...s.account, currentWorld: 1 } }));
    expect(r.account.goals.filter((g) => g.id.includes('level-next'))).toEqual([]);
  });
});

describe('US-2 Water at cap names the bubble', () => {
  it("W2-late: M3's Water line carries 'level Roid Ragin first', its own text unchanged", () => {
    const g = goal(w2, 'alchemy.check.liquid-cap-line');
    expect(g?.nextAction.text).toBe('Spend Water on bubbles, vials or the Liquid Shop');
    expect(details(g)).toContain('level Roid Ragin first');
  });
});

describe('US-3 vials', () => {
  it('W3-early: Copper Corona 1 → 2 with the bubble pick reserved, then Sippy Splinters and Mushroom Soup', () => {
    const g = goal(w3, 'alchemy-vials.goal.level-next');
    expect(g?.nextAction.text).toBe('Level Copper Corona 1 → 2 (100 Copper Ore, 3 Water)');
    expect(details(g)).toEqual(['then Sippy Splinters 1 → 2', 'then Mushroom Soup 1 → 2']);
  });

  it("W2-late: M6's attempts line gets today's easiest rolls", () => {
    const g = goal(w2, 'alchemy-vials.check.daily-attempts');
    expect(g?.nextAction.text).toBe('Use your 11 vial attempts on the W2 town cauldron');
    expect(details(g)[0]).toBe(
      'Easiest rolls with what you hold: Dieter Drink (a roll of 40 or more, Bean Slices), Skinny 0 Cal (a roll of 60 or more, Snake Skin), Jungle Juice (a roll of 60 or more, Jungle Logs)',
    );
  });

  it('W3-early: 0 of 17 attempts left, so no roll targets', () => {
    expect(goal(w3, 'alchemy-vials.check.daily-attempts')).toBeUndefined();
    expect(w3.alchemy?.rollTargets).toEqual([]);
    expect(w3.alchemy?.attempts).toEqual({ current: 0, max: 17 });
  });

  it('the Water the bubble pick needs is never given to the vial line (D-7)', () => {
    // Leave exactly the pick's Water plus 2: the vial needs 3, so no vial Goal.
    const r = run('scrubbed-w2', (s) => {
      const water = s.account.liquids?.find((l) => l.index === 0);
      if (water) water.current = 20;
      return s;
    });
    expect(goal(r, 'alchemy-bubbles.goal.level-next')?.nextAction.text).toBe(
      'Level Roid Ragin 3 → 12 (Power cauldron)',
    );
    expect(goal(r, 'alchemy-vials.goal.level-next')).toBeUndefined();
  });
});

describe('M24 every locked vial: the ones you can try and the ones missing their item', () => {
  it('W3-early: the tries list has no top-three cap and keeps going when no attempts are left', () => {
    const t = w3.alchemy?.vialTries;
    expect(t).toBeTruthy();
    const locked = (w3.alchemy?.vials ?? []).filter((v) => v.level === 0).length;
    expect((t?.tryable.length ?? 0) + (t?.missing.length ?? 0)).toBe(locked);
    // The attempts line doesn't fire (0 left), so rollTargets is empty, but the tries are still listed.
    expect(w3.alchemy?.rollTargets).toEqual([]);
    for (const list of [t?.tryable ?? [], t?.missing ?? []])
      for (let i = 1; i < list.length; i++)
        expect((list[i]?.rollNeeded ?? 0) >= (list[i - 1]?.rollNeeded ?? 0)).toBe(true);
  });

  it("W2-late: the first three tries are M6's roll targets, and each held amount sums its places", () => {
    const t = w2.alchemy?.vialTries;
    expect(t?.tryable.slice(0, 3).map((v) => v.name)).toEqual([
      'Dieter Drink',
      'Skinny 0 Cal',
      'Jungle Juice',
    ]);
    expect((t?.tryable.length ?? 0) > 3).toBe(true);
    for (const v of t?.tryable ?? []) {
      expect(v.held).toBe(v.places.reduce((n, p) => n + p.amount, 0));
      expect(v.held > 0).toBe(true);
    }
  });

  it('Refinery and Forge holdings never make a vial tryable; bags and storage do, largest first', () => {
    const cat = [
      { index: 0, name: 'A_VIAL', item: 'ItemA', itemName: 'Item_A', score: 60, liquid: 1, stat: '' },
      { index: 1, name: 'B_VIAL', item: 'ItemB', itemName: 'Item_B', score: 40, liquid: 1, stat: '' },
      { index: 2, name: 'C_VIAL', item: 'ItemC', itemName: 'Item_C', score: 50, liquid: 1, stat: '' },
    ];
    const state = {
      account: {
        alchemyPlan: { vialLevels: [0, 0, 3] },
        storageItems: { ItemA: 2 },
        refineryStorage: { ItemA: 56, ItemB: 9 },
        forgeOutput: [{ rawName: 'ItemB', amount: 4 }],
      },
      characters: [{ index: 3, inventoryItems: { ItemA: 7 } }],
    } as unknown as AccountState;
    const t = vialTries(state, cat);
    expect(t?.tryable).toEqual([
      {
        index: 0,
        name: 'A Vial',
        rollNeeded: 60,
        item: 'Item A',
        held: 9,
        places: [
          { place: 'bag', index: 3, amount: 7 },
          { place: 'storage', amount: 2 },
        ],
        elsewhere: { refinery: 56, forge: 0 },
      },
    ]);
    expect(t?.missing).toEqual([{ index: 1, name: 'B Vial', rollNeeded: 40, item: 'Item B' }]);
  });
});

describe('US-4 Pay 2 Win', () => {
  const p2w = (r: EngineResult) =>
    r.account.spendPlan?.lines.filter((l) => l.entryId.includes('#p2w-')) ?? [];
  it("W2-late: the Player line leads M7's Pay 2 Win lines, unpriced, and no separate Player Check shows", () => {
    const [first, second] = p2w(w2);
    expect(first?.text).toBe('Buy Player Alchemy Speed and Extra EXP 10 → 13');
    expect(first?.status).toBe('unpriced');
    expect(second?.entryId).toContain('#p2w-liquids');
    expect(goal(w2, 'alchemy-p2w.check.player-behind')).toBeUndefined();
  });

  it('W3-early: Player 19 → 20, then Water Regen; no Nitrogen upgrade (its Pay 2 Win level is −1)', () => {
    const lines = p2w(w3);
    expect(lines[0]?.text).toBe('Buy Player Alchemy Speed and Extra EXP 19 → 20');
    expect(lines[1]?.entryId).toContain('#p2w-liquids');
    expect(lines.some((l) => l.steps.some((s) => s.ref.includes('liquid-n2')))).toBe(false);
  });

  it('FR-14: without the Spend Plan line, the Player Check shows on its own', () => {
    const r = run('scrubbed-w2', (s) => ({ ...s, account: { ...s.account, spend: null } }));
    expect(goal(r, 'alchemy-p2w.check.player-behind')?.nextAction.text).toBe(
      'Pay 2 Win: buy Player Alchemy Speed and Extra EXP 10 → 13',
    );
  });
});

describe('US-5 the Liquid Shop', () => {
  it.each(['scrubbed-w2', 'scrubbed-w3'])('%s: the gem row is to do, 5 Water', (id) => {
    const r = id === 'scrubbed-w2' ? w2 : w3;
    const row = r.checklist?.rows.find((x) => x.id === 'liquid-shop-gem');
    expect(row?.label).toBe('Liquid Shop: One Measly Gem');
    expect(row?.details).toEqual(['5 Water']);
    expect(row?.state).toBe('todo');
  });

  it('W3-early: no Talent Point Goal while Nitrogen is under 1; the tube says so', () => {
    expect(goal(w3, 'alchemy.check.talent-point')).toBeUndefined();
    expect(w3.alchemy?.tubes.find((t) => t.index === 1)?.note).toBe('Talent Point needs 1 Liquid Nitrogen');
  });

  it('W3-early with 2 Liquid Nitrogen: the Talent Point Goal shows', () => {
    const r = run('scrubbed-w3', (s) => {
      const n = s.account.liquids?.find((l) => l.index === 1);
      if (n) n.current = 2;
      return s;
    });
    expect(goal(r, 'alchemy.check.talent-point')?.nextAction.text).toBe(
      'Buy a Talent Point in the Liquid Shop',
    );
  });
});

describe('US-6 the page lights one bubble', () => {
  it('W2-late: the Power pot is lit; the others read their own pick', () => {
    const a = w2.alchemy;
    const lines = a?.pots.map((p) => potLine(p));
    expect(lines).toEqual([
      'Next: Roid Ragin 3 → 12',
      'Next: Swift Steppin 1 → 8',
      'Stable Jenius 1 → 12 · needs Water',
      'Nothing to level yet · spend brew',
    ]);
    const lit = a?.pots.filter((p) => p.next?.actionKey);
    expect(lit?.map((p) => p.cauldron)).toEqual(['power']);
    expect(lit?.[0]?.next?.actionKey).toBe('alchemy-bubbles.goal.level-next@account');
  });

  it("W2-late: the Water tube carries M3's line key, so See it lights the tube", () => {
    const t = w2.alchemy?.tubes.find((x) => x.index === 0);
    expect(t?.actionKey).toBe('alchemy.check.liquid-cap-line@account');
    expect(t && tubeLine(t)).toBe('32 of 32 · full');
  });

  it('is deterministic (FR-25)', () => {
    expect(renderAlchemyText(run('scrubbed-w2').alchemy ?? null)).toBe(renderAlchemyText(w2.alchemy ?? null));
  });
});

describe('FR-28 the Stage Expectation', () => {
  it('the bubble Goal carries belowW2Band on both saves', () => {
    expect(w2.alchemy).toBeTruthy();
    expect(goal(w3, 'alchemy-bubbles.goal.level-next')).toBeTruthy();
  });
});

describe('public saves', () => {
  it.each(fixtures.filter((f) => f.kind === 'public').map((f) => f.id))(
    '%s runs without a failure',
    (id) => {
      const r = run(id);
      expect(r.diagnostics.failedDetectors.filter((d) => d.detectorId.startsWith('alchemy'))).toEqual([]);
      if ((stateOf(fixture(id)).account.currentWorld ?? 0) < 2)
        expect(r.account.goals.some((g) => g.id.endsWith('level-next'))).toBe(false);
    },
    60_000,
  ); // a full engine run per save; slow under a loaded CI runner (as #114)
});
