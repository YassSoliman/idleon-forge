// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 Phase 1 on the scrubbed saves (the W2-late and W3-early accounts with names scrubbed; the private
// fixtures give the same Walkthroughs, checked locally in private.test.ts). Each user story's Given /
// When / Then, the owner's amendment R-Q9a, and the unit rules behind them.
import type { AccountState } from '@idleon-forge/account-state';
import { reachableMaps } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import type { MetaPathResult } from '../../src/metapath/types';
import type { EngineResult, Goal, WalkthroughView } from '../../src/result';
import {
  assignJobs,
  expandTarget,
  HoldingsPool,
  liquidShop,
  type PlanValues,
  presetActions,
  type SupplyEval,
  talentRole,
} from '../../src/walkthrough';
import { engineOf, kb, scrubbedFile, walkthroughsOf, workerState } from './helpers';

const W2 = () => workerState(scrubbedFile('scrubbed-w2'));
const W3 = () => workerState(scrubbedFile('scrubbed-w3'));
const POST_OFFICE = 'post-office.check.unlock';

function postOffice(r: EngineResult): { subject: string; goal: Goal; view: WalkthroughView } {
  const hit = walkthroughsOf(r).find((w) => w.goal.id === POST_OFFICE);
  if (!hit?.goal.walkthrough) throw new Error('no Post Office Walkthrough');
  return { subject: hit.subject, goal: hit.goal, view: hit.goal.walkthrough };
}
const stepWith = (v: WalkthroughView, text: string) => v.steps.find((s) => s.text.includes(text));
const rowGoals = (r: EngineResult, index: number) =>
  r.characters.find((c) => c.index === index)?.goals.filter((g) => g.id === 'walkthrough.check.assign') ?? [];

/** A save with some storage counts changed (holdings drive every step). */
function withStorage(state: AccountState, items: Record<string, number>): AccountState {
  return {
    ...state,
    account: { ...state.account, storageItems: { ...(state.account.storageItems ?? {}), ...items } },
  };
}

describe('US-1 The Post Office before Anvil Tab 2 (W2-late), with R-Q9a', () => {
  const r = engineOf(W2());
  const { subject, view } = postOffice(r);

  it('rides on the Post Office Check on the Barbarian Lv 60 row, once', () => {
    expect(subject).toBe('c0');
    expect(walkthroughsOf(r).filter((w) => w.goal.id === POST_OFFICE)).toHaveLength(1);
    expect(view.collapsed).toContain('slowest: Distilled Water');
  });

  it('shows the tree: 5 Empty Boxes, their three inputs, and the Anvil Tab 2 gate with its own recipe', () => {
    const lines = view.tree.map((t) => `${t.depth}:${t.done}:${t.text}`);
    expect(lines).toContain('1:false:5 Empty Box (0 held)');
    expect(lines).toContain('2:false:1,250 Hermit Can (0 held)');
    expect(lines).toContain('2:false:2,000 Megalodon Tooth (525 held)');
    expect(lines).toContain('2:false:20 Distilled Water (2 held)');
    expect(lines).toContain('2:false:Anvil Tab 2');
    expect(lines).toContain('4:false:100 Iron Bar (85 held)');
    expect(lines).toContain('4:false:100 Chain Link (18 held)');
    expect(lines).toContain('4:true:100 Jungle Logs (100 held)');
    expect(lines).toContain('4:false:100 Bullfrog Horn (8 held)');
  });

  it('makes Distilled Water the Bottleneck: 8 now on 32 Water, up to 3 days, and starts it first', () => {
    const first = view.steps[0];
    expect(first?.text).toContain('Buy 18 Distilled Water at the Liquid Shop');
    expect(first?.text).toContain('the 32 Water you hold buys 8 now');
    expect(first?.text).toContain('up to 3 days');
    expect(first?.why).toContain('needed once Anvil Tab 2 is done');
  });

  it('sends the Bowman Lv 54 to The Mimic Hole: about 3,900 kills, about 2.6 h', () => {
    const s = stepWith(view, 'Megalodon Tooth');
    expect(s?.subject).toBe('c3');
    expect(s?.text).toContain('Send the Bowman Lv 54 to The Mimic Hole (W2)');
    expect(s?.text).toMatch(/about 3,9\d\d kills/);
    expect(s?.text).toContain('about 2.6 h');
    expect(rowGoals(r, 3)[0]?.nextAction.text).toBe(
      'Move to The Mimic Hole: Megalodon Tooth for Unlock the Post Office',
    );
  });

  it('R-Q9a: the Barbarian (pusher and fisher) finishes the push, then fishes the Hermit Cans', () => {
    const s = stepWith(view, 'Hermit Can at Salty Shores');
    expect(s?.subject).toBe('c0');
    expect(s?.text).toBe(
      "On the Barbarian Lv 60: finish Djonnut's quest 2, then gather Hermit Can at Salty Shores (1,250 needed; no rate yet, skilling)",
    );
    expect(s?.why).toContain('the push serves the higher-ranked Goal');
    // No other character fishes for it (a Lv 1 fisher never beats the Role holder at an equal rate).
    expect(view.steps.filter((x) => x.text.includes('Hermit Can') && x.subject !== 'c0')).toHaveLength(0);
    expect(rowGoals(r, 0)[0]?.nextAction.text).toBe(s?.text);
  });

  it('R-Q9a item 4: the preset steps are explicit, after the push', () => {
    const at = view.steps.findIndex((x) => x.text.includes('Hermit Can at Salty Shores'));
    expect(view.steps[at + 1]?.text).toBe('On the Barbarian Lv 60: Set up talent preset 2 for Fishing first');
    expect(view.steps[at + 2]?.text).toBe(
      'On the Barbarian Lv 60: Fill card preset 2 for Fishing, then switch to it',
    );
  });

  it('US-5: the Horns need a door nobody free has opened; names who can and what opens it', () => {
    const s = stepWith(view, 'Bullfrog Horn');
    expect(s?.text).toContain('Farm 92 Bullfrog Horn at Tucked Away (W1)');
    expect(s?.text).toContain('the door from Encroaching Forest Villas needs 4,200 kills first');
    expect(s?.subject).toBeNull();
  });

  it('runs Chain Link on an anvil hammer, collects and smelts the Iron Bars, then crafts in order', () => {
    expect(stepWith(view, 'anvil hammer to Chain Link')?.text).toContain('82 needed');
    expect(stepWith(view, 'Collect 66 Iron Bar from the Forge')).toBeDefined();
    expect(stepWith(view, 'Smelt 15 more Iron Bar')?.text).toContain('Iron Ore you hold');
    const tab = stepWith(view, 'Craft 1 Anvil Tab 2');
    const use = stepWith(view, 'Use Anvil Tab 2');
    const box = stepWith(view, 'Craft 5 Empty Box');
    const hand = view.steps[view.steps.length - 1];
    expect(tab && use && box && hand).toBeTruthy();
    expect((tab?.order ?? 0) < (use?.order ?? 0) && (use?.order ?? 0) < (box?.order ?? 0)).toBe(true);
    expect(box?.after).toContain(use?.order);
    expect(hand?.text).toBe('Hand 5 Empty Box to Postboy Pablob on the Barbarian Lv 60');
    expect(hand?.subject).toBe('c0');
  });

  it('US-5: other ways list the World 3 drops and Crystal Cattle, never as steps', () => {
    expect(view.otherWays.filter((o) => o.endsWith('(open World 3 first)')).length).toBeGreaterThan(3);
    expect(view.otherWays).toContain('Crystal Cattle (Active Play)');
    expect(view.steps.some((s) => s.text.includes('Crystal Cattle'))).toBe(false);
  });

  it('US-4: no printer, so no Parallel Slot Plan and no printer Supply', () => {
    expect(r.account.goals.some((g) => g.id === 'printer.check.slot-plan')).toBe(false);
    expect(view.steps.some((s) => s.text.includes('printer'))).toBe(false);
  });

  it('FR-32: the same inputs give the same Walkthrough', () => {
    expect(postOffice(engineOf(W2())).view).toEqual(view);
  });
});

describe('R-Q9a item 5: always live; a step whose material is held disappears', () => {
  it('drops the Teeth and Horns steps once storage holds them', () => {
    const r = engineOf(withStorage(W2(), { DesertA2: 2000, Forest3: 100 }));
    const { view } = postOffice(r);
    expect(stepWith(view, 'Megalodon Tooth')).toBeUndefined();
    expect(stepWith(view, 'Bullfrog Horn')).toBeUndefined();
    expect(view.tree.find((t) => t.text.startsWith('2,000 Megalodon Tooth'))?.done).toBe(true);
    // The freed Bowman gets no row assignment.
    expect(rowGoals(r, 3)).toHaveLength(0);
  });
});

describe('US-2 The Post Office, nearly there (W3-early)', () => {
  const r = engineOf(W3());
  const { subject, view } = postOffice(r);

  it('rides on the Squire Lv 85 (quest accepted) and marks Hermit Cans held', () => {
    expect(subject).toBe('c3');
    expect(view.tree.find((t) => t.text.includes('Hermit Can'))?.done).toBe(true);
    expect(view.collapsed).toContain('slowest: Megalodon Tooth');
  });

  it('buys Distilled Water today (9 for about 43 Water) instead of farming it', () => {
    expect(stepWith(view, 'Distilled Water')?.text).toBe(
      "Buy 9 Distilled Water at the Liquid Shop (W2 Alchemy) for about 43 Water, if you haven't bought any today",
    );
  });

  it('sends the Shaman Lv 54 for the Teeth; the Barbarian (fishing Role) and the pusher stay', () => {
    const s = stepWith(view, 'Megalodon Tooth');
    expect(s?.subject).toBe('c5');
    expect(s?.text).toMatch(/about 2,1\d\d kills/);
    expect(s?.text).toContain('about 2.4 h');
    expect(rowGoals(r, 4)).toHaveLength(0);
    expect(rowGoals(r, 3)).toHaveLength(0);
  });

  it('crafts the boxes, then hands them in on the Squire Lv 85', () => {
    expect(view.steps.at(-2)?.text).toContain('Craft 5 Empty Box');
    expect(view.steps.at(-1)?.text).toBe('Hand 5 Empty Box to Postboy Pablob on the Squire Lv 85');
  });
});

describe('US-3 The printer feeds the Demand (W3-early)', () => {
  const r = engineOf(W3());
  const printer = r.account.goals.find((g) => g.id === 'printer.check.slot-plan');

  it('proposes one change: the Wizard Lv 73 samples Megalodon Tooth at The Mimic Hole', () => {
    expect(printer?.nextAction.text).toBe(
      'Visit The Mimic Hole on the Wizard Lv 73, put Printer Sampling on the attack bar and use it, set the new Megalodon Tooth sample active in place of Forest Fibres, then go back',
    );
    expect(printer?.details).toBeUndefined();
  });

  it('prices the bonus reset (0% here), and never predicts the sample size', () => {
    expect(printer?.nextAction.why).toContain("printer bonus doesn't drop");
    expect(printer?.nextAction.why).toContain('The sample size shows in the printer once taken.');
  });

  it('keeps every sample once the Demand is covered (FR-29, R-Q7)', () => {
    const later = engineOf(withStorage(W3(), { DesertA2: 2000, PureWater: 20 }));
    expect(later.account.goals.some((g) => g.id === 'printer.check.slot-plan')).toBe(false);
  });
});

describe('US-6 A cycle or a patch', () => {
  it('stops a recipe loop at the repeated item with a diagnostic, and keeps the rest', () => {
    const a = 'items.acquisition.loop-a';
    const b = 'items.acquisition.loop-b';
    const item = (raw: string, other: string) => ({
      ...(kb.entries['items.acquisition.quest13'] as object),
      id: `items.acquisition.${raw.toLowerCase().replace('loop', 'loop-')}`,
      thing: { kind: 'item', rawName: raw },
      data: {
        rawName: raw,
        name: raw,
        typeGen: null,
        wiki: null,
        recipe: {
          lvReqToCraft: 0,
          materials: [
            {
              rawName: other,
              amount: 2,
              ref: `items.acquisition.${other.toLowerCase().replace('loop', 'loop-')}`,
            },
          ],
        },
        forge: null,
        anvil: null,
        liquidShop: null,
        shops: [],
        node: null,
        drops: [],
      },
    });
    const looped = {
      ...kb,
      entries: { ...kb.entries, [a]: item('LoopA', 'LoopB'), [b]: item('LoopB', 'LoopA') },
    };
    const s = W2();
    const ctx = {
      state: s,
      kb: looped as unknown as typeof kb,
      pool: new HoldingsPool(s),
      diagnostics: [] as string[],
    };
    const t = expandTarget(ctx, a);
    const flat = JSON.stringify(t?.root);
    expect(flat).toContain('"stoppedBecause":"cycle"');
    expect(ctx.diagnostics[0]).toContain('recipe loop at LoopA');
  });

  it('reads an unknown anvil tab gate as "check in game" and never as done', () => {
    const s = W2();
    const unknown: AccountState = {
      ...s,
      account: { ...s.account, anvilTabsOwned: null },
      diagnostics: {
        ...s.diagnostics,
        unknownFields: [...s.diagnostics.unknownFields, 'account.anvilTabsOwned'],
      },
    };
    const { view } = postOffice(engineOf(unknown));
    expect(view.tree.find((t) => t.text.startsWith('Anvil Tab 2'))).toEqual({
      depth: 2,
      text: 'Anvil Tab 2 (check in game)',
      done: null,
    });
    expect(stepWith(view, 'Use Anvil Tab 2')).toBeUndefined();
  });
});

describe('US-7 Broken save', () => {
  it('with a failed storage section, every holding reads "can\'t tell" and nothing is ticked', () => {
    const s = W2();
    const broken: AccountState = { ...s, diagnostics: { ...s.diagnostics, failedSections: ['storage'] } };
    const { view } = postOffice(engineOf(broken));
    expect(view.caveats).toContain("can't tell");
    expect(view.tree.filter((t) => t.text.includes('held')).every((t) => t.done === null)).toBe(true);
  });
});

describe('the rules behind the stories', () => {
  it('Liquid Shop (R-Q6): x1 × 1.37^n per buy; 32 Water buys 8; 9 buys cost about 43', () => {
    expect(liquidShop(1, 1.37, 32, 18)).toEqual({ affordableNow: 8, costForMissing: null, days: 3 });
    const nine = liquidShop(1, 1.37, 92.7, 9);
    expect(nine.days).toBe(1);
    expect(Math.round(nine.costForMissing ?? 0)).toBe(43);
  });

  it('reachability (M5 TR-4): the current map, maps killed on, and doors whose own requirement is met', () => {
    const graph = new Map([
      [
        1,
        {
          index: 1,
          world: 1,
          listed: true,
          afkType: 'FIGHTING',
          doors: [{ requirement: 10, destination: 2 }],
        },
      ],
      [
        2,
        {
          index: 2,
          world: 1,
          listed: true,
          afkType: 'FIGHTING',
          doors: [{ requirement: 50, destination: 3 }],
        },
      ],
      [3, { index: 3, world: 1, listed: true, afkType: 'FIGHTING', doors: [] }],
      [4, { index: 4, world: 1, listed: false, afkType: 'FIGHTING', doors: [] }],
      [60, { index: 60, world: 2, listed: true, afkType: 'FIGHTING', doors: [] }],
    ]);
    // Cleared map 1's door (0 left), started map 2 (30 of 50 left): 1, 2 reachable, 3 not; boss map 4 never.
    expect(reachableMaps([[], [0], [30]], 1, graph, 1)).toEqual([1, 2]);
    expect(reachableMaps([[], [0], [0]], 4, graph, 1)).toEqual([1, 2, 3]);
    expect(reachableMaps(null, 60, graph, 1)).toEqual([]);
  });

  const values: PlanValues = {
    unratedBottleneckAt: 500,
    firstJobWithinSeconds: 3600,
    tieSeconds: 360,
    expectedReturnSeconds: 8 * 3600,
  };
  const leaf = (missing: number) =>
    ({
      kind: 'item',
      rawName: 'X',
      name: 'X',
      need: missing,
      held: 0,
      missing,
      holdings: [],
      via: 'leaf',
      children: [],
      supplies: [],
      depth: 1,
    }) as unknown as Parameters<typeof assignJobs>[1][number]['leaf'];
  const drop = (eta: number): SupplyEval => ({
    acquisitionId: 'X',
    kind: 'drop',
    afkable: true,
    where: { world: 1, mapIndex: 1, map: 'Spore Meadows', monster: 'mushG' },
    chance: 0.1,
    quantity: 1,
    perCharacter: [
      {
        characterIndex: 0,
        eligible: true,
        killsNeeded: 10,
        etaSeconds: eta,
        alreadyFarming: false,
        killsPerHour: 100,
        dropRate: 1,
        survivability: 100,
      },
    ],
    bound: 'mean',
  });
  const fishing = (): SupplyEval => ({
    acquisitionId: 'X',
    kind: 'skill-node',
    afkable: true,
    where: { world: 2, mapIndex: 54, map: 'Salty Shores', skill: 'FISHING' },
    perCharacter: [
      {
        characterIndex: 0,
        eligible: true,
        killsNeeded: null,
        etaSeconds: null,
        alreadyFarming: false,
        skillLevel: 1,
        skillEfficiency: 60,
      },
    ],
    bound: 'none',
  });
  const meta = (pushEta: number | null): MetaPathResult =>
    ({
      pusher: { index: 0, frontierMap: 9 },
      pushGoal: {
        entryId: 'metapath.goal.push',
        characterIndex: 0,
        etaSeconds: pushEta,
        step: { kind: 'route' },
      },
      roles: { 0: [{ role: 'fishing', afkType: 'FISHING', active: true, entryId: 'x' }] },
      list: {
        stage: null,
        listId: null,
        positions: { 'metapath.goal.push': 2, 'post-office.check.unlock': 9 },
        lastPosition: 9,
        byUrgency: [],
        carryForward: [],
        contested: [],
        frameOnly: false,
      },
    }) as unknown as MetaPathResult;
  const state = {
    ...W2(),
    characters: [{ ...W2().characters[0], index: 0, afkType: 'FIGHTING' }],
  } as AccountState;
  const job = (s: SupplyEval, seconds: number | null) => ({
    leaf: leaf(1000),
    supplies: [s],
    effort: { kind: 'job' as const, seconds, supply: s },
    parentKey: 'post-office.check.unlock@c0',
    parentEntryId: 'post-office.check.unlock',
    targetId: 'quests.acquisition.postboy-pablob1',
    bottleneck: true,
  });

  it('R-Q9a item 3: a push within an hour goes first', () => {
    const [j] = assignJobs({ state, meta: meta(1800), prior: null, values }, [job(fishing(), 8 * 3600)]);
    expect(j?.assignees).toEqual([0]);
    expect(j?.sequence).toEqual({ firstIs: 'push', reason: 'short', pushEtaSeconds: 1800 });
  });

  it('R-Q9a item 3: otherwise the higher-ranked Goal goes first (the push at position 2)', () => {
    const [j] = assignJobs({ state, meta: meta(5 * 3600), prior: null, values }, [job(fishing(), 8 * 3600)]);
    expect(j?.sequence).toEqual({ firstIs: 'push', reason: 'rank', pushEtaSeconds: 5 * 3600 });
  });

  it('R-Q9: the pusher is never pulled onto a fighting job that is not one of its Roles', () => {
    const [j] = assignJobs({ state, meta: meta(5 * 3600), prior: null, values }, [job(drop(1200), 1200)]);
    expect(j?.assignees).toEqual([]);
  });

  it('R-Q9a item 2: a trained fisher beats a Lv 1 fisher; the Role holder wins only at equal rates', () => {
    const two = {
      ...W2(),
      characters: [0, 1].map((i) => ({ ...W2().characters[i], index: i, afkType: 'FIGHTING' })),
    } as AccountState;
    const s = fishing();
    s.perCharacter = [
      {
        characterIndex: 0,
        eligible: true,
        killsNeeded: null,
        etaSeconds: null,
        alreadyFarming: false,
        skillLevel: 1,
        skillEfficiency: 40,
      },
      {
        characterIndex: 1,
        eligible: true,
        killsNeeded: null,
        etaSeconds: null,
        alreadyFarming: false,
        skillLevel: 30,
        skillEfficiency: 400,
      },
    ];
    const noPush = { ...meta(null), pusher: null, pushGoal: null } as unknown as MetaPathResult;
    expect(
      assignJobs({ state: two, meta: noPush, prior: null, values }, [job(s, 8 * 3600)])[0]?.assignees,
    ).toEqual([1]);
    const tie = fishing();
    tie.perCharacter = [1, 0].map((characterIndex) => ({
      characterIndex,
      eligible: true,
      killsNeeded: null,
      etaSeconds: null,
      alreadyFarming: false,
      skillLevel: 1,
      skillEfficiency: 50,
    }));
    expect(
      assignJobs({ state: two, meta: noPush, prior: null, values }, [job(tie, 8 * 3600)])[0]?.assignees,
    ).toEqual([0]);
  });

  it('R-Q9a item 4: switch to a fitting preset, or set one up first', () => {
    const fit = {
      talents: { skillingAt: 50, skilling: ['BRUTE_EFFICIENCY', 'IDLE_SKILLING'] },
      cards: { both: ['Drop_Rate'], skilling: ['Skill'], FIGHTING: ['Damage'], FISHING: ['Fishing'] },
    };
    const base = W2().characters[0] as AccountState['characters'][number];
    const ready: AccountState['characters'][number] = {
      ...base,
      talentPresets: {
        selected: 0,
        presets: [
          { index: 0, levels: { POWER_STRIKE: 50 } },
          { index: 1, levels: { BRUTE_EFFICIENCY: 100 } },
        ],
      },
      cardPresets: {
        selected: 0,
        unlocked: 2,
        presets: [['+{_Base_Damage'], ['+{%_Fishing_EXP', '+{%_Total_Drop_Rate']],
      },
    };
    expect(talentRole({ BRUTE_EFFICIENCY: 100 }, fit)).toBe('skilling');
    expect(presetActions(ready, 'FISHING', fit)).toEqual([{ kind: 'switch', talent: 1, card: 1 }]);
    const bare: AccountState['characters'][number] = {
      ...base,
      talentPresets: {
        selected: 0,
        presets: [
          { index: 0, levels: { POWER_STRIKE: 50 } },
          { index: 1, levels: {} },
        ],
      },
      cardPresets: { selected: 0, unlocked: 2, presets: [['+{_Base_Damage'], []] },
    };
    expect(presetActions(bare, 'FISHING', fit)).toEqual([
      { kind: 'setup-talent', talent: 1 },
      { kind: 'fill-card', card: 1 },
    ]);
    expect(presetActions(ready, 'FIGHTING', fit)).toEqual([]);
  });
});
