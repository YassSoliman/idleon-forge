// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 Alchemy as one engine module, `alchemy-plan` (docs/specs/M19-alchemy.md TR-1). It runs `after: true`
// so it reads M3's, M6's and M7's merged output: the Water line and the vial attempts line get their
// details (X3, X4), the Player line stays silent when M7's Spend Plan already shows it (FR-14), and the
// page's one step is the top Alchemy Next Action of any owner (FR-23). Never a Verdict or a blocker.
import type { AccountState, CauldronId } from '@idleon-forge/account-state';
import { render, type SlotValue } from '@idleon-forge/knowledge';
import type { EngineInput, EngineModule, ModuleGoal, ModuleOutput } from '../core/module';
import { runMetaPath } from '../metapath';
import { classTree, lookupOf } from '../metapath/knowledge';
import type { EngineResult, Goal, GoalDetail } from '../result';
import { amount, joinAnd, sourcesOf } from '../slots/kb';
import {
  type AlchemyKnowledge,
  bandOf,
  type CurveRow,
  ENTRY,
  FACT,
  factRows,
  planRows,
  type ShopRow,
  type VialRow,
  vialPlanRows,
} from './kb';
import { playerBehind } from './p2w';
import { accountPick, type BubbleCost, firstBlocked, type PlanResult, runPlan } from './plan';
import type { AlchemyResult } from './types';
import { rollTargets, vialLevels } from './vials';
import { buildView } from './views';

export interface AlchemyModuleDeps {
  kb: AlchemyKnowledge;
}

const value = (kb: AlchemyKnowledge, id: string, key: string): string | null => {
  const v = kb.entries[id]?.values[key];
  return typeof v === 'string' ? v : null;
};
const num = (kb: AlchemyKnowledge, id: string, key: string, fallback: number): number => {
  const v = kb.entries[id]?.values[key];
  return typeof v === 'number' ? v : fallback;
};
/** A template from an entry's values, rendered; '' when it or a slot is missing. */
export function say(kb: AlchemyKnowledge, id: string, key: string, slots: Record<string, SlotValue> = {}) {
  const t = value(kb, id, key);
  if (t === null) return '';
  try {
    return render(t, slots);
  } catch {
    return '';
  }
}

function goalOf(
  kb: AlchemyKnowledge,
  id: string,
  text: string,
  why: string,
  details: GoalDetail[],
  fields: string[],
  category?: Goal['category'],
): Goal | null {
  const e = kb.entries[id];
  if (!e || !text) return null;
  const cat = category ?? ('category' in e && e.category ? e.category : 'compounding');
  return {
    id,
    title: e.title,
    system: e.system,
    category: cat,
    nextAction: {
      key: `${id}@account`,
      entryId: id,
      text,
      why,
      sources: sourcesOf(kb, id),
      stale: false,
      contested: null,
      confidence: e.confidence,
      provenance: { entryIds: [id], fields },
    },
    milestone: null,
    ...(details.length ? { details } : {}),
  };
}

const detail = (text: string): GoalDetail => ({ subject: 'account', text });

export interface AlchemyRun {
  goals: ModuleGoal[];
  notes: { key: string; details: GoalDetail[] }[];
  view: AlchemyResult | null;
  unknown: string[];
}

/** M19 as a pure function of the Account State, the Knowledge Base, the Stage and the merged result. */
export function buildAlchemy(
  state: AccountState,
  kb: AlchemyKnowledge,
  stage: string | null,
  cost: BubbleCost | null,
  prior: EngineResult | null,
): AlchemyRun {
  const empty: AlchemyRun = { goals: [], notes: [], view: null, unknown: [] };
  const band = bandOf(stage as Parameters<typeof bandOf>[0]);
  if (!band || stage === null || (state.account.currentWorld ?? 0) < 2) return empty;
  const curvesList = factRows<CurveRow[]>(kb, FACT.curves);
  const catalogue = factRows<VialRow[]>(kb, FACT.vials);
  const costs = factRows<{ items: number[]; liquidPerLevel: number }>(kb, FACT.vialCosts);
  const shop = factRows<ShopRow[]>(kb, FACT.shop);
  const rows = planRows(kb);
  const vrows = vialPlanRows(kb);
  if (!curvesList || !catalogue || !costs || !shop || !rows || !vrows) return empty;
  const fail = (): AlchemyRun => ({ ...empty, unknown: [ENTRY.bubbleGoal, ENTRY.vialGoal] });
  if (!state.account.alchemyPlan || !state.account.alchemy || !state.account.liquids) return fail();
  if (!state.account.storageItems || cost === null) return fail();
  let isA: (c: string, a: string) => boolean;
  try {
    const t = classTree(lookupOf(kb));
    isA = (c, a) => t.isA(c, a);
  } catch {
    return fail();
  }
  const curves = new Map(curvesList.map((c) => [c.rawName, c]));
  const plan: PlanResult | null = runPlan({
    state,
    stage: stage as Parameters<typeof runPlan>[0]['stage'],
    band,
    rows,
    curves,
    cost,
    isA,
  });
  if (!plan) return fail();
  const B = ENTRY.bubbleGoal;
  const goals: ModuleGoal[] = [];
  const notes: AlchemyRun['notes'] = [];
  const pick = accountPick(plan);
  const blocked = pick ? null : firstBlocked(plan);
  const fields = [
    'account.alchemyPlan',
    'account.alchemy.cauldrons',
    'account.liquids',
    'account.storageItems',
  ];
  const slots = { belowW2Band: plan.belowW2Band ? 1 : 0 };
  if (pick) {
    const curve = curves.get(pick.rawName);
    const max = num(kb, B, 'maxDetails', 2);
    const next = plan.entries.filter((e) => e !== pick && e.atLeast > 0).slice(0, max);
    const text = say(kb, B, 'level', {
      bubble: pick.name,
      from: pick.from,
      to: pick.to,
      cauldron: CAULDRON_WORD[pick.cauldron],
    });
    const why = say(kb, B, 'why-level', {
      effect: value(kb, B, `effect-${pick.rawName}`) ?? '',
      held: joinAnd(pick.held),
      levels: pick.atLeast,
    });
    const details = next.map((e) =>
      detail(
        say(kb, B, 'detail-next', {
          bubble: e.name,
          from: e.from,
          to: e.to,
          cauldron: CAULDRON_WORD[e.cauldron],
        }),
      ),
    );
    const g = goalOf(kb, B, text, why, details, fields);
    if (g && curve) goals.push({ goal: { ...g, milestone: null }, slots });
  } else if (blocked?.blocked) {
    const b = blocked.blocked;
    const liquids = state.account.liquids;
    const g = b.liquid
      ? goalOf(
          kb,
          B,
          say(kb, B, 'liquid-limit', { liquid: b.name }),
          say(kb, B, 'why-liquid-limit', {
            liquid: b.name,
            current: amount(liquids.find((l) => `Liquid${l.index + 1}` === b.rawName)?.current ?? 0),
            max: liquids.find((l) => `Liquid${l.index + 1}` === b.rawName)?.max ?? 0,
          }),
          [],
          fields,
          'nice',
        )
      : goalOf(
          kb,
          B,
          say(kb, B, 'get-more', { more: b.more, item: b.name, bubble: blocked.name }),
          say(kb, B, 'why-get-more', { bubble: blocked.name, from: blocked.from, to: blocked.to }),
          [],
          fields,
        );
    if (g) goals.push({ goal: g, slots });
  }

  // D-7: the Water the pick's affordable levels need is set aside before the vial line.
  const liquidLeft = [0, 1, 2, 3].map(
    (i) => (state.account.liquids?.find((l) => l.index === i)?.current ?? 0) - (pick?.liquidSpent[i] ?? 0),
  );
  const levels = vialLevels({
    state,
    stage: stage as Parameters<typeof vialLevels>[0]['stage'],
    band,
    rows: vrows,
    catalogue,
    itemCosts: costs.items,
    liquidPerLevel: costs.liquidPerLevel,
    liquidLeft,
    isA,
  });
  const V = ENTRY.vialGoal;
  const vialPick = levels[0] ?? null;
  if (vialPick) {
    const max = num(kb, V, 'maxDetails', 2);
    const g = goalOf(
      kb,
      V,
      say(kb, V, 'level', {
        vial: vialPick.name,
        from: vialPick.from,
        to: vialPick.to,
        items: vialPick.items,
        item: vialPick.itemName,
        liquidCost: vialPick.liquidCost,
        liquid: vialPick.liquidName,
      }),
      say(kb, V, 'why-level'),
      levels
        .slice(1, 1 + max)
        .map((l) => detail(say(kb, V, 'detail-next', { vial: l.name, from: l.from, to: l.to }))),
      ['account.alchemyPlan.vialLevels', 'account.storageItems', 'account.liquids'],
    );
    if (g) goals.push({ goal: g });
  }

  // X3: roll targets ride on M6's vial attempts line while it fires.
  const targets = rollTargets(state, catalogue, num(kb, V, 'maxTargets', 3));
  const attemptsKey = `${ENTRY.attempts}@account`;
  const attemptsGoal = prior?.account.goals.find((g) => g.nextAction.key === attemptsKey);
  if (attemptsGoal && targets.length) {
    // M21 DS-19: units on every number, never a bare "97+".
    const list = targets.map((t) => `${t.name} (a roll of ${t.rollNeeded} or more, ${t.item})`).join(', ');
    notes.push({
      key: attemptsKey,
      details: [detail(say(kb, V, 'roll-targets', { list })), detail(say(kb, V, 'roll-tip-detail'))].filter(
        (d) => d.text,
      ),
    });
  }

  // X4: M3's Water line names the bubble its Water should go to.
  const waterPick = pick?.held.includes('Water')
    ? pick
    : plan.entries.find((e) => e.unlocked && e.held.includes('Water'));
  if (waterPick)
    for (const id of [ENTRY.waterLine, ENTRY.waterBlocker]) {
      const key = `${id}@account`;
      if (prior?.account.goals.some((g) => g.nextAction.key === key))
        notes.push({ key, details: [detail(say(kb, B, 'water-pick', { bubble: waterPick.name }))] });
    }

  // FR-14: the Player upgrades, unless M7's merged Spend Plan already shows that line.
  const behind = playerBehind(state);
  const inPlan = prior?.account.spendPlan?.lines.some((l) => l.entryId.endsWith('#p2w-player')) === true;
  if (behind && !inPlan) {
    const P = ENTRY.playerBehind;
    const g = goalOf(
      kb,
      P,
      say(kb, P, 'line', behind),
      say(kb, P, 'why-line', { best: behind.to }),
      [],
      ['account.alchemyPlan.p2wPlayer', 'account.alchemyPlan.bestAlchemyLevel'],
    );
    if (g) goals.push({ goal: g });
  }

  // FR-17: the permanent Talent Point.
  const T = ENTRY.talentPoint;
  const tp = shop.find((s) => s.index === 8);
  const water = state.account.liquids.find((l) => l.index === 0);
  const nitrogen = state.account.liquids.find((l) => l.index === 1);
  const bought = state.account.alchemyPlan.liquidShopBought[8] ?? 0;
  const tpWater = tp ? tp.x1 * tp.x2 ** bought : null;
  let tubeNote: string | null = null;
  if (tp && tpWater !== null && nitrogen?.unlocked && water) {
    if (water.current >= tpWater && nitrogen.current >= 1) {
      const g = goalOf(
        kb,
        T,
        say(kb, T, 'line'),
        say(kb, T, 'why-line', { water: Math.ceil(tpWater) }),
        [],
        ['account.alchemyPlan.liquidShopBought', 'account.liquids'],
      );
      if (g) goals.push({ goal: g });
    } else if (nitrogen.current < 1) tubeNote = say(kb, T, 'tube-note') || null;
  }

  const view = buildView({
    state,
    kb,
    band,
    plan,
    pick,
    blocked,
    curves,
    catalogue,
    vialPick,
    // FR-11: roll targets only while M6's attempts line fires (none with 0 attempts left).
    targets: attemptsGoal ? targets : [],
    tubeNote,
    goals,
    prior,
  });
  return { goals, notes, view, unknown: [] };
}

export const CAULDRON_WORD: Record<CauldronId, string> = {
  power: 'Power',
  quicc: 'Quicc',
  'high-iq': 'High-IQ',
  kazam: 'Kazam',
};

export function createAlchemyModule(deps: AlchemyModuleDeps): EngineModule {
  return {
    id: 'alchemy-plan',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    after: true,
    run(input: EngineInput, prior): ModuleOutput {
      const full = input.knowledge.kb;
      if (!full) return {};
      const stage = runMetaPath(input.state, full, input.now)?.stage.id ?? null;
      const cost = input.toolbox?.bubbleCost ?? null;
      const r = buildAlchemy(input.state, deps.kb, stage, cost, prior ?? null);
      return {
        account: { goals: r.goals },
        alchemy: r.view,
        ...(r.notes.length ? { goalNotes: r.notes } : {}),
        ...(r.unknown.length
          ? {
              unknownFindings: r.unknown.map((entryId) => ({
                entryId,
                subject: 'account' as const,
                reason: 'field-missing',
              })),
            }
          : {}),
      };
    },
  };
}
