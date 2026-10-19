// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 F6 the Alchemy page's data (docs/specs/M19-alchemy.md FR-8, FR-18 to FR-23, TR-5, TR-6): pots,
// the cauldron columns, the vial shelf, the liquid tubes and the Pay 2 Win grid, with the one element to
// light. Built in the worker; the lazy page chunk only formats it. Views add no advice.
import type { AccountState, CauldronId } from '@idleon-forge/account-state';
import type { ModuleGoal } from '../core/module';
import type { EngineResult } from '../result';
import {
  type AlchemyKnowledge,
  BAND_INDEX,
  type CurveRow,
  ENTRY,
  LIQUID_NAMES,
  LIQUID_OPENS_AT,
  titleName,
  type VialRow,
} from './kb';
import { p2wCells } from './p2w';
import type { PlanEntry, PlanResult } from './plan';
import type { AlchemyResult, Band, BubblePick, ColumnChip, PotView, TubeView, VialView } from './types';
import type { VialLevel } from './vials';

const CAULDRONS: readonly CauldronId[] = ['power', 'quicc', 'high-iq', 'kazam'];

const say = (kb: AlchemyKnowledge, id: string, key: string) => {
  const v = kb.entries[id]?.values[key];
  return typeof v === 'string' ? v : '';
};

const pickOf = (e: PlanEntry, key: string | null): BubblePick => ({
  cauldron: e.cauldron,
  rawName: e.rawName,
  name: e.name,
  from: e.from,
  to: e.to,
  atLeast: e.atLeast,
  band: e.band,
  blocked: e.blocked,
  actionKey: key,
});

/** F-a: a decay curve's share of its maximum at `level`, in whole percent; null for linear curves. */
export function pctOfMax(c: CurveRow, level: number): number | null {
  if (c.linear || c.x2 <= 0 || !c.bands) return null;
  return Math.floor((100 * level) / (level + c.x2));
}

export interface ViewInput {
  state: AccountState;
  kb: AlchemyKnowledge;
  band: Band;
  plan: PlanResult;
  pick: PlanEntry | null;
  blocked: PlanEntry | null;
  curves: ReadonlyMap<string, CurveRow>;
  catalogue: readonly VialRow[];
  vialPick: VialLevel | null;
  targets: { index: number; name: string; rollNeeded: number; item: string }[];
  tries: AlchemyResult['vialTries'];
  tubeNote: string | null;
  goals: readonly ModuleGoal[];
  prior: EngineResult | null;
}

export function buildView(x: ViewInput): AlchemyResult {
  const { state, kb, band, plan, pick, blocked } = x;
  const alch = state.account.alchemy;
  const goalKey = (id: string) => (x.goals.some((g) => g.goal.id === id) ? `${id}@account` : null);
  const bubbleKey = goalKey(ENTRY.bubbleGoal);
  // FR-8: the lit bubble is the account pick, else the first blocked row; none when the plan is met.
  const lit = pick ?? blocked;
  const inPlan = new Set(plan.entries.map((e) => e.rawName));
  const pots: PotView[] = CAULDRONS.map((id) => {
    const mine = plan.entries.filter((e) => e.cauldron === id);
    const open = mine.filter((e) => e.unlocked);
    const next = open.find((e) => e.atLeast > 0) ?? open.find((e) => e.blocked) ?? null;
    const c = alch?.cauldrons.find((k) => k.id === id);
    return {
      cauldron: id,
      next: next ? pickOf(next, next === lit ? bubbleKey : null) : null,
      rows: open.slice(0, 3).map((e) => pickOf(e, e === lit ? bubbleKey : null)),
      locked: mine.filter((e) => !e.unlocked).map((e) => e.name),
      expectedNewBubbles: c?.expectedNewBubbles ?? 0,
      unlockedBubbles: c?.unlockedBubbles ?? 0,
      nextUnlock: c?.nextBubble ? titleName(c.nextBubble.name) : null,
    };
  });
  const column = Object.fromEntries(
    CAULDRONS.map((id) => [
      id,
      [...x.curves.values()]
        .filter((c) => c.cauldron === id)
        .sort((a, b) => a.index - b.index)
        .map((c): ColumnChip => {
          const level = state.account.alchemyPlan?.bubbleLevels[id]?.[c.index] ?? 0;
          const unlocked = c.index < (alch?.cauldrons.find((k) => k.id === id)?.unlockedBubbles ?? 0);
          return {
            rawName: c.rawName,
            name: titleName(c.name),
            level,
            bandLevel: c.bands ? c.bands[BAND_INDEX[band]] : null,
            pctOfMax: pctOfMax(c, level),
            inPlan: inPlan.has(c.rawName),
            unlocked,
          };
        }),
    ]),
  ) as AlchemyResult['column'];

  const targetSet = new Set(x.targets.map((t) => t.index));
  const vialLevels = state.account.alchemyPlan?.vialLevels ?? [];
  const vials: VialView[] = x.catalogue.map((v) => ({
    index: v.index,
    name: titleName(v.name),
    level: vialLevels[v.index] ?? 0,
    rollNeeded: (vialLevels[v.index] ?? 0) === 0 ? v.score : null,
    lit: x.vialPick?.index === v.index,
    rollTarget: targetSet.has(v.index),
  }));

  // FR-21: a tube at its cap is lit when the page opens from M3's Water line.
  const waterKey = [ENTRY.waterLine, ENTRY.waterBlocker]
    .map((id) => `${id}@account`)
    .find((k) => x.prior?.account.goals.some((g) => g.nextAction.key === k));
  const plan2 = state.account.alchemyPlan;
  const tubes: TubeView[] = (state.account.liquids ?? []).map((l) => ({
    index: l.index,
    name: LIQUID_NAMES[l.index] as string,
    current: l.current,
    max: l.max,
    open: l.unlocked,
    opensAt: LIQUID_OPENS_AT[l.index] ?? null,
    actionKey: l.index === 0 && l.current >= l.max ? (waterKey ?? null) : null,
    note: l.index === 1 && l.unlocked ? x.tubeNote : null,
  }));

  const p2w = p2wCells(state, kb.entries).map((c) => {
    if (!c.next) return c;
    // FR-22: the next cell lights from M7's Pay 2 Win line or FR-14's Check.
    const line = x.prior?.account.spendPlan?.lines.find((l) => l.entryId.includes('#p2w-'));
    const key = goalKey(ENTRY.playerBehind) ?? (line ? line.id : null);
    return { ...c, actionKey: key };
  });

  // FR-23: the account's top Alchemy Next Action of any owner; this module's own Goals come after.
  const prior = (x.prior?.account.goals ?? []).find((g) => g.system.startsWith('alchemy'));
  const own = x.goals[0]?.goal;
  const top = prior ?? own ?? null;
  const attempts = alch?.vialAttempts ?? null;
  return {
    band,
    pick: pick ? pickOf(pick, bubbleKey) : null,
    pots,
    column,
    vials,
    vialPick: x.vialPick
      ? {
          name: x.vialPick.name,
          from: x.vialPick.from,
          to: x.vialPick.to,
          actionKey: goalKey(ENTRY.vialGoal),
        }
      : null,
    rollTargets: x.targets.map(({ name, rollNeeded, item }) => ({ name, rollNeeded, item })),
    vialTries: x.tries,
    tubes,
    p2w,
    planMet: plan.met,
    notes: {
      planMet: say(kb, ENTRY.bubbleGoal, 'plan-met'),
      covers: (state.account.currentWorld ?? 0) >= 4 ? say(kb, ENTRY.bubbleGoal, 'covers') : null,
      unlocks: say(kb, ENTRY.bubbleGoal, 'unlocks'),
    },
    attempts: attempts && plan2 ? { current: attempts.current, max: attempts.max } : null,
    topStep: top ? { key: top.nextAction.key, text: top.nextAction.text } : null,
  };
}
