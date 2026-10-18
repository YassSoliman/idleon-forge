// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 Purpose & Milestones (docs/specs/M4-purpose-milestones.md): what each character's current activity
// advances. Every concrete Contribution's Detector runs once (M11 contract); M4's engine layer then
// applies what a Detector can't see (M2's pusher, frontier map, push ETA and Roles; M5's best map),
// projects account kill counters to `now` (FR-9), computes ETAs (FR-4), the worthwhile test (FR-7),
// the status (FR-8), the ranking (FR-10), the stop-here suggestion (FR-13) and the Milestone crossings
// of this Play Session (FR-12). Pure: no clock, no I/O; same inputs give the same output (FR-17).
import { type AccountState, type CharacterState, isKnown } from '@idleon-forge/account-state';
import {
  type ContributionFinding,
  type Entry,
  feederIndices,
  makeContext,
  type ProgressFinding,
  render,
  runDetector,
  type SlotValue,
  stagesBetween,
} from '@idleon-forge/knowledge';
import { classTree, lookupOf } from '../metapath/knowledge';
import { compareGoals } from '../metapath/priority';
import type { Rankable } from '../metapath/types';
import { aboutDuration, compact } from '../now/format';
import type {
  ActivityRef,
  DeriveInput,
  Eta,
  GoalInstance,
  MilestoneCrossing,
  NotWorthwhileReason,
  Purpose,
  PurposeStatus,
  SkillKey,
  StopHere,
} from './types';

type ContributionEntry = Extract<Entry, { type: 'contribution' }>;
type GoalEntry = Extract<Entry, { type: 'goal' }>;

/** The ranking id of the push Goal (M2), so the pusher's portal ranks where M2's push does. */
export const PUSH_GOAL = 'metapath.goal.push';
export const ROLES_GOAL = 'roles.goal.skill';
const DEFAULT_HORIZON_HOURS = 24;

type Kind = 'kills' | 'cards' | 'class' | 'door' | 'yesno';
interface Family {
  kind: Kind;
  unit: GoalInstance['unit'];
  scope: GoalInstance['scope'];
  /** FR-9: account kill counters are projected to `now`; cards, Class EXP and the push never are. */
  project: boolean;
}
/** How each Purpose Detector's findings become Goal instances (TR-4 table). */
export const FAMILIES: Readonly<Record<string, Family>> = {
  'portals/push': { kind: 'kills', unit: 'kills', scope: 'character', project: false },
  'upgrade-vault/kill-row': { kind: 'kills', unit: 'kills', scope: 'account', project: true },
  'death-note/skull': { kind: 'kills', unit: 'kills', scope: 'account', project: true },
  'cards/fight-level': { kind: 'cards', unit: 'copies', scope: 'account', project: false },
  'classes/exp': { kind: 'class', unit: 'level', scope: 'character', project: false },
  'skills/door': { kind: 'door', unit: 'level', scope: 'character', project: false },
  'skills/tool-chain': { kind: 'yesno', unit: 'yesno', scope: 'character', project: false },
  'stamps/material': { kind: 'yesno', unit: 'yesno', scope: 'account', project: false },
  'roles/skill': { kind: 'yesno', unit: 'yesno', scope: 'character', project: false },
  'cards/skill-first-copy': { kind: 'yesno', unit: 'yesno', scope: 'account', project: false },
};

const SKILL_OF: Readonly<Record<string, SkillKey>> = {
  MINING: 'mining',
  CHOPPIN: 'chopping',
  FISHING: 'fishing',
  CATCHING: 'catching',
};

/** "2,995", "10k", "1.5M": exact under 10,000, compact above (units are added by the template). */
export function countText(n: number): string {
  const v = Math.floor(n);
  if (Math.abs(v) < 10_000) return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return compact(v);
}

/** The one duration words of the Now screen (Design Lab: one formatter): "about 5h". */
export const etaWords = (seconds: number) => aboutDuration(seconds);

// ---------- activity (FR-1) ----------

const NO_TARGET_TYPES = new Set(['Nothing', 'Paying_Respect']);

/** FR-1: one ActivityRef per character; null when a field it needs is unknown (`cannot-tell`). */
export function activityOf(state: AccountState, c: CharacterState): ActivityRef | null {
  if (!isKnown(state, `characters[${c.index}].afkType`)) return null;
  if (c.afkType === null) return null;
  if (NO_TARGET_TYPES.has(c.afkType)) return { kind: 'none' };
  const target = c.targetMonster ?? null;
  if (!target && !c.afkTarget) return { kind: 'none' };
  return {
    kind: 'afk',
    afkType: c.afkType,
    mapIndex: c.mapIndex ?? null,
    target,
    skill: SKILL_OF[c.afkType] ?? null,
  };
}

// ---------- applicability ----------

function stageApplies(e: Entry, stage: string | null): boolean {
  const s = e.appliesTo.stages;
  if (s === 'all' || stage === null) return true;
  return s.some((x) =>
    typeof x === 'string' ? x === stage : (stagesBetween(x.from, x.to) as string[]).includes(stage),
  );
}

/** The active Contributions, sorted by id (determinism). */
export function contributionsOf(kb: DeriveInput['kb']): ContributionEntry[] {
  return Object.values(kb.entries)
    .filter((e): e is ContributionEntry => e.type === 'contribution' && e.status !== 'retired' && !!e.goal)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** FR-8: the AFK types some active Contribution names; others are `not-covered`. */
export function coveredAfkTypes(kb: DeriveInput['kb']): Set<string> {
  return new Set(contributionsOf(kb).flatMap((e) => (e.activity.afkType ? [e.activity.afkType] : [])));
}

// ---------- helpers ----------

const num = (v: SlotValue | undefined): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;
const str = (v: SlotValue | undefined): string | null => (typeof v === 'string' ? v : null);
const ladderOf = (g: GoalEntry | null): number[] =>
  [...(g?.milestones ?? []).map((m) => m.at)].sort((a, b) => a - b);
/** The first ladder step above `x`; null after the last one (or for a null `x`). */
const afterOf = (ladder: readonly number[], x: number | null): number | null =>
  x === null ? null : (ladder.find((at) => at > x) ?? null);

/** When character `c` last saved (epoch ms): its own save, so the projection advances with `now`. */
function lastSaveOf(state: AccountState, c: CharacterState): number | null {
  if (c.secondsSinceLastSave === null) return null;
  return state.asOf - c.secondsSinceLastSave * 1000;
}

function horizonHours(e: ContributionEntry, expectedReturnHours: number): number | null {
  if (e.values.horizon === 'none') return null;
  const h = typeof e.values.horizonHours === 'number' ? e.values.horizonHours : DEFAULT_HORIZON_HOURS;
  return Math.max(h, expectedReturnHours); // D1: never below the Expected Return
}

const time = (
  seconds: number,
  rate: number,
  feeders: number[],
  bound: 'estimate' | 'mean-at-base-rate',
): Eta => ({
  kind: 'time',
  seconds: Math.max(0, Math.round(seconds)),
  ratePerHour: rate,
  feeders,
  bound,
});

/** "· about 5h" etc.: the ETA words appended to a line; empty when the ETA is unknown (hide unknown tokens). */
export function etaSuffix(eta: Eta): string {
  switch (eta.kind) {
    case 'time':
      return ` · ${etaWords(eta.seconds)}${eta.bound === 'mean-at-base-rate' ? ' on average' : ''}`;
    case 'none':
      return eta.reason === 'zero-rate'
        ? ' · not progressing'
        : eta.reason === 'reached-unconfirmed'
          ? ' · reached, claim to confirm'
          : eta.reason === 'complete'
            ? ' · maxed'
            : '';
    default:
      return '';
  }
}

interface Raw {
  entry: ContributionEntry;
  goal: GoalEntry | null;
  family: Family;
  finding: ContributionFinding;
  index: number;
}

export interface Diagnostic {
  entryId: string;
  characterIndex: number | null;
  message: string;
}

export interface Derived {
  purposes: Purpose[];
  /** Raw findings kept for rendering (slots), by `${contributionId}@${index}`. */
  slotsOf: Map<string, Readonly<Record<string, SlotValue>>>;
  diagnostics: Diagnostic[];
}

/** The class card list M8 authors (`cardList(class, stage)`), injected so M4 needs no M8 import cycle. */
export type CardListOf = (cls: string, stage: string | null) => readonly string[];

/**
 * TR-3 `derivePurposes`, with the card list (M8 FR-18) injected. Returns one Purpose per readable
 * character, in save order.
 */
export function derive(input: DeriveInput, cardListOf: CardListOf = () => []): Derived {
  const { state, kb, registry, meta, now } = input;
  const facts = lookupOf(kb);
  const stage = meta.stage.id;
  const tree = (() => {
    try {
      return classTree(facts);
    } catch {
      return null;
    }
  })();
  const ctx = makeContext(state, kb, { now, expectedReturnMs: input.expectedReturnHours * 3_600_000 });
  const diagnostics: Diagnostic[] = [];
  const dropped = new Map<number, number>();
  const drop = (entryId: string, index: number | null, message: string) => {
    diagnostics.push({ entryId, characterIndex: index, message });
    if (index !== null) dropped.set(index, (dropped.get(index) ?? 0) + 1);
  };
  const byIndex = new Map(state.characters.map((c) => [c.index, c]));
  const activities = new Map(state.characters.map((c) => [c.index, activityOf(state, c)]));

  // ---- FR-2: run every applicable Contribution's Detector once ----
  const raws: Raw[] = [];
  for (const entry of contributionsOf(kb)) {
    if (!stageApplies(entry, stage)) continue;
    const family = FAMILIES[entry.detector.id];
    const detector = registry[entry.detector.id];
    if (!family || !detector) continue;
    const goal = (kb.entries[entry.goal as string] as GoalEntry | undefined) ?? null;
    const run = runDetector(detector, ctx, { ...entry.detector.params, goal: entry.goal });
    if (!run.ok) {
      // FR-18: a throw drops the Goal for every character on that AFK type.
      for (const c of state.characters)
        if (c.afkType === entry.activity.afkType) drop(entry.id, c.index, run.error);
      continue;
    }
    for (const f of run.findings as ContributionFinding[]) {
      if (f.subject.kind !== 'character') continue;
      const index = f.subject.index;
      const c = byIndex.get(index);
      if (!c || c.afkType !== entry.activity.afkType) continue;
      const { classes, levels } = entry.appliesTo;
      if (classes && !classes.some((k) => (tree ? tree.isA(c.class, k) : c.class === k))) continue;
      if (levels?.min !== undefined && c.level < levels.min) continue;
      if (levels?.max !== undefined && c.level > levels.max) continue;
      if (f.advances === 'unknown') {
        drop(entry.id, index, 'a field this Goal reads is unknown');
        continue;
      }
      raws.push({ entry, goal, family, finding: f, index });
    }
  }

  // ---- instances ----
  const slotsOf = new Map<string, Readonly<Record<string, SlotValue>>>();
  const instancesOf = new Map<number, GoalInstance[]>();
  const add = (i: number, g: GoalInstance) => instancesOf.set(i, [...(instancesOf.get(i) ?? []), g]);
  const stale = new Set(kb.stale);
  for (const r of raws) {
    const g = instanceOf(r);
    if (g) {
      add(r.index, g);
      slotsOf.set(`${g.contributionId}@${r.index}`, { ...(r.goal?.values ?? {}), ...r.finding.slots });
    }
  }

  function instanceOf(r: Raw): GoalInstance | null {
    const { entry, goal, family, finding: f, index } = r;
    const c = byIndex.get(index) as CharacterState;
    // The generated Goal's values (a Vault row's name, a map) are template slots too; the finding's win.
    const slots: Record<string, SlotValue> = { ...(goal?.values ?? {}), ...f.slots };
    const ladder = ladderOf(goal);
    let saved = num(slots.saved) ?? 0;
    const rate = num(slots.rate) ?? 0;
    const mask = num(slots.feeders);
    const feeders = mask === null ? [index] : feederIndices(mask);
    let reason: NotWorthwhileReason | undefined;
    let eta: Eta;
    let etaFollowing: Eta | null = null;
    let projected = saved;
    let next: number | null = null;
    let following: number | null = null;
    let reached: number | null = null;
    let etaAtSaved: number | null = f.etaMs === undefined || f.etaMs === null ? null : f.etaMs / 1000;

    if (family.kind === 'yesno') {
      // Yes or no (FR-6): only a live Goal is a line; a Role line needs the Role (D6).
      if (f.advances !== 'yes') return null;
      if (entry.detector.id === 'roles/skill') {
        const roles = meta.roles[index] ?? [];
        if (!roles.some((x) => x.active && x.afkType === entry.activity.afkType)) return null;
      }
      eta = { kind: 'yesno' };
    } else if (family.kind === 'door') {
      if (f.advances !== 'yes') return null;
      next = ladder.find((at) => at > saved) ?? null;
      reached = [...ladder].reverse().find((at) => at <= saved) ?? null;
      following = afterOf(ladder, next);
      eta = { kind: 'yesno' };
    } else if (family.kind === 'class') {
      const best = input.bestExpPerHour[index] ?? null;
      // TR-6: without M5's best map the Goal is skipped, never guessed.
      if (best === null || !(best > 0)) {
        drop(entry.id, index, 'no best class EXP map yet (M5 sweep)');
        return null;
      }
      reached = saved;
      next = ladder.find((at) => at > saved) ?? null;
      following = afterOf(ladder, next);
      eta =
        next === null
          ? { kind: 'none', reason: 'complete' }
          : etaAtSaved === null
            ? { kind: 'none', reason: 'zero-rate' }
            : time(etaAtSaved, rate, [index], 'estimate');
      const minRatio =
        typeof entry.detector.params.minRatio === 'number' ? entry.detector.params.minRatio : 0.5;
      if (rate < minRatio * best) reason = 'rule';
    } else if (family.kind === 'cards') {
      next = ladder.find((at) => at > saved) ?? null;
      reached = [...ladder].reverse().find((at) => at <= saved) ?? null;
      following = afterOf(ladder, next);
      if (num(slots.complete) === 1 || next === null) eta = { kind: 'none', reason: 'complete' };
      else if (etaAtSaved === null) eta = { kind: 'none', reason: 'zero-rate' };
      else eta = time(etaAtSaved, rate, feeders, 'mean-at-base-rate');
      const later = num(slots.thenEtaMs);
      if (following !== null && later !== null)
        etaFollowing = time(later / 1000, rate, feeders, 'mean-at-base-rate');
      // M8's card list names generated card Acquisitions: cards.acquisition.<the ladder's slug>.
      const slug = (entry.goal as string).split('.')[2] ?? '';
      const onList = cardListOf(c.class, stage).includes(`cards.acquisition.${slug}`);
      if (num(slots.rule) !== 1 && !onList) reason = 'rule';
    } else {
      // kills: portals, Vault rows, Death Note
      const push =
        entry.detector.id === 'portals/push' &&
        meta.pusher?.index === index &&
        meta.pusher.frontierMap === c.mapIndex &&
        meta.pushGoal?.characterIndex === index &&
        meta.pushGoal.step.kind === 'route'
          ? meta.pushGoal
          : null;
      if (push) {
        // US-6: M2's numbers unchanged, so the row and M2's Next Action never show two ETAs.
        saved = push.current;
        projected = saved;
        next = push.goal;
        etaAtSaved = push.etaSeconds;
      } else next = ladder.find((at) => at > saved) ?? null;
      // A map whose doors are all open has no portal Goal left: no line (noise, #70).
      if (entry.detector.id === 'portals/push' && next === null) return null;
      reached = [...ladder].reverse().find((at) => at <= saved) ?? null;
      following = afterOf(ladder, next);
      let unconfirmed = false;
      if (family.project && next !== null && rate > 0) {
        // FR-9: every feeder's kills since its own last save, clamped at the next Milestone.
        let gain = 0;
        for (const i of feeders) {
          const fc = byIndex.get(i);
          const last = fc ? lastSaveOf(state, fc) : null;
          const r = fc?.fighting?.finalKillsPerHour ?? 0;
          if (last !== null && r > 0) gain += (r * Math.max(0, now - last)) / 3_600_000;
        }
        projected = Math.min(next, saved + gain);
        unconfirmed = saved + gain >= next;
      }
      if (next === null) eta = { kind: 'none', reason: 'complete' };
      else if (rate <= 0 && !push) eta = { kind: 'none', reason: 'zero-rate' };
      else if (unconfirmed) eta = { kind: 'none', reason: 'reached-unconfirmed' };
      else if (push)
        eta =
          push.etaSeconds === null
            ? { kind: 'none', reason: 'zero-rate' }
            : time(push.etaSeconds, rate, [index], 'estimate');
      else eta = time(((next - projected) / rate) * 3600, rate, feeders, 'estimate');
      if (following !== null && rate > 0)
        etaFollowing = time(((following - projected) / rate) * 3600, rate, feeders, 'estimate');
      if (entry.detector.id === 'portals/push') {
        if (!push) reason = 'rule'; // D5: only M2's pusher on M2's frontier map
      } else if (num(slots.rule) !== 1) reason = 'rule';
    }

    // ---- FR-7 worthwhile ----
    if (entry.contestedOn === 'usefulness') reason = 'usefulness-contested';
    else if (eta.kind === 'none' && eta.reason === 'complete') reason = 'complete';
    else if (!reason && eta.kind === 'none' && eta.reason === 'zero-rate') reason = 'zero-rate';
    else if (!reason && entry.eta === 'kills-per-hour') {
      const h = horizonHours(entry, input.expectedReturnHours);
      // A projected crossing keeps the result it had at the saved value (FR-9).
      const at = eta.kind === 'time' ? eta.seconds : etaAtSaved;
      if (h !== null && at !== null && at > h * 3600) reason = 'horizon';
    }

    const badges: GoalInstance['badges'] = [];
    if (entry.status === 'contested') badges.push('contested');
    if (stale.has(entry.id)) badges.push('stale');
    if (input.parserBehind) badges.push('parser-behind');

    const engineSlots: Record<string, SlotValue> = {
      now: `${family.project ? '~' : ''}${countText(projected)}`,
      at: next === null ? '' : countText(next),
      later: following === null ? '' : countText(following),
      etaText: eta.kind === 'time' ? etaWords(eta.seconds) : '',
      laterEtaText: etaFollowing?.kind === 'time' ? etaWords(etaFollowing.seconds) : '',
    };
    const complete = eta.kind === 'none' && eta.reason === 'complete';
    const variant =
      family.kind === 'cards' && complete
        ? entry.values.complete
        : family.kind === 'cards' && saved === 0
          ? entry.values.first
          : undefined;
    let headline: string;
    try {
      headline = render(typeof variant === 'string' ? variant : entry.text, engineSlots, slots, entry.values);
    } catch (e) {
      drop(entry.id, index, e instanceof Error ? e.message : 'template');
      return null;
    }
    if (family.kind === 'yesno' || family.kind === 'door') {
      // no ETA words for skilling (FR-6)
    } else if (!(complete && typeof variant === 'string')) {
      // A capped ladder has no next Milestone: drop the template's dangling "→" before "· maxed".
      if (complete) headline = headline.replace(/\s*→\s*$/, '');
      headline += etaSuffix(eta);
    }
    const whyNot = typeof entry.values.whyNot === 'string' ? entry.values.whyNot : null;
    let detail: string | null = null;
    if (reason === 'rule' && whyNot) {
      try {
        detail = render(whyNot, engineSlots, slots, entry.values);
      } catch {
        detail = null;
      }
    }
    return {
      goalId: entry.goal as string,
      contributionId: entry.id,
      characterIndex: index,
      scope: family.scope,
      unit: family.unit,
      saved,
      projected,
      reached,
      next,
      following,
      eta,
      etaFollowing,
      worthwhile: reason === undefined,
      ...(reason ? { notWorthwhileReason: reason } : {}),
      badges,
      text: { headline, detail },
      provenance: {
        entryIds: [entry.id, entry.goal as string],
        fields: [...(kb.readsOf[entry.detector.id] ?? [])],
      },
    };
  }

  // ---- per character ----
  const covered = coveredAfkTypes(kb);
  const purposes: Purpose[] = state.characters.map((c) => {
    const activity = activities.get(c.index) ?? null;
    const goals = rank(instancesOf.get(c.index) ?? []);
    const worthwhile = goals.filter((g) => g.worthwhile);
    let status: PurposeStatus;
    if (activity === null) status = 'cannot-tell';
    else if (activity.kind === 'none') status = 'no-activity';
    else if (worthwhile.length > 0) status = 'serving';
    else if ((dropped.get(c.index) ?? 0) > 0) status = 'cannot-tell';
    else if (activity.kind === 'afk' && !covered.has(activity.afkType)) status = 'not-covered';
    else if (goals.length > 0) status = 'exhausted';
    else status = 'none';
    const headline = goals[0] ?? null;
    const reached = crossings(c, goals);
    const stopHere = status === 'serving' ? stopHereOf(goals, reached) : null;
    const prompt =
      status === 'not-covered' && activity?.kind === 'afk'
        ? {
            kind: 'not-covered' as const,
            reason: { headline: `Not covered yet: ${humanAfk(activity.afkType)}`, detail: null },
            afkType: activity.afkType,
          }
        : status === 'exhausted' || status === 'none'
          ? { kind: 'what-for' as const, reason: { headline: reasonOf(goals), detail: null } }
          : null;
    const suggestedTarget =
      status === 'exhausted' || status === 'none' || status === 'no-activity' ? roleTarget(c) : null;
    return {
      characterIndex: c.index,
      activity: activity ?? { kind: 'none' },
      status,
      goals,
      headline,
      stopHere,
      prompt,
      suggestedTarget,
      reached,
    };
  });

  function rank(gs: GoalInstance[]): GoalInstance[] {
    const served = gs.length;
    const r = (g: GoalInstance): Rankable => ({
      entryId: g.contributionId.startsWith('portals.') && g.worthwhile ? PUSH_GOAL : g.goalId,
      category: 'compounding',
      stale: g.badges.includes('stale'),
      contested: g.badges.includes('contested'),
      cost: null,
      milestoneEtaSeconds: g.eta.kind === 'time' ? g.eta.seconds : null,
      goalsServed: served,
      urgency: null,
      deadline: null,
      framePosition: null,
      subjectKey: g.contributionId,
    });
    const sorted = [...gs].sort(
      (a, b) => Number(b.worthwhile) - Number(a.worthwhile) || compareGoals(r(a), r(b), meta.list),
    );
    // FR-15: an order-contested Goal never headlines over an uncontested worthwhile one.
    const first = sorted[0];
    if (first?.badges.includes('contested')) {
      const j = sorted.findIndex((g) => g.worthwhile && !g.badges.includes('contested'));
      if (j > 0) sorted.unshift(...sorted.splice(j, 1));
    }
    return sorted;
  }

  /** FR-12: Milestones the saved counter crossed since the Play Session's first save. */
  function crossings(c: CharacterState, goals: GoalInstance[]): MilestoneCrossing[] {
    const start = input.history.sessionStart;
    if (!start) return [];
    const out: MilestoneCrossing[] = [];
    for (const g of goals) {
      if (g.unit === 'yesno') continue;
      const goal = (kb.entries[g.goalId] as GoalEntry | undefined) ?? null;
      const progress = goal?.progress;
      const d = progress ? registry[progress.id] : undefined;
      if (!goal || !progress || !d || d.kind !== 'progress') continue;
      const run = runDetector(d, makeContext(start, kb, { now }), progress.params);
      if (!run.ok) continue;
      const f = (run.findings as ProgressFinding[]).find((x) =>
        g.scope === 'account'
          ? x.subject.kind === 'account'
          : x.subject.kind === 'character' && x.subject.index === c.index,
      );
      const before = f && f.value !== null ? f.value : null;
      if (before === null) continue;
      const crossed = ladderOf(goal).filter((at) => before < at && at <= g.saved);
      const top = crossed.at(-1);
      if (top !== undefined)
        out.push({
          goalId: g.goalId,
          milestone: top,
          provenance: { entryIds: [g.goalId], fields: g.provenance.fields },
        });
    }
    return out;
  }

  /** FR-13: the headline crosses its next Milestone within the Expected Return (or did this session), and the step after is beyond the horizon. */
  function stopHereOf(goals: GoalInstance[], reached: MilestoneCrossing[]): StopHere | null {
    const top = goals[0];
    if (!top?.worthwhile || top.unit === 'yesno' || top.next === null || top.following === null) return null;
    const entry = kb.entries[top.contributionId] as ContributionEntry | undefined;
    if (!entry?.stopHere) return null;
    const h = horizonHours(entry, input.expectedReturnHours);
    if (h === null) return null;
    const soon =
      (top.eta.kind === 'time' && top.eta.seconds <= input.expectedReturnHours * 3600) ||
      reached.some((x) => x.goalId === top.goalId);
    if (!soon || top.eta.kind !== 'time') return null;
    if (top.etaFollowing?.kind !== 'time' || top.etaFollowing.seconds <= h * 3600) return null;
    // (b): nothing else with a horizon stays worthwhile (Goals with no horizon never run out, so they
    // don't keep a finite grind worth staying for; US-2).
    const others = goals.slice(1).filter((g) => {
      if (!g.worthwhile) return false;
      const e = kb.entries[g.contributionId] as ContributionEntry | undefined;
      return !!e && horizonHours(e, input.expectedReturnHours) !== null;
    });
    if (others.length > 0) return null;
    return {
      contributionId: top.contributionId,
      goalId: top.goalId,
      at: top.next,
      etaAt: top.eta,
      following: top.following,
      etaFollowing: top.etaFollowing,
      provenance: top.provenance,
    };
  }

  /** FR-14's reason: what was checked and why none of it counts, in the entries' own words. */
  function reasonOf(goals: GoalInstance[]): string {
    if (goals.length === 0) return 'Nothing this activity does is on your Goals.';
    const words = goals.slice(0, 3).map((g) => {
      const e = kb.entries[g.contributionId] as ContributionEntry | undefined;
      const slots = slotsOf.get(`${g.contributionId}@${g.characterIndex}`) ?? {};
      const key =
        g.notWorthwhileReason === 'complete'
          ? 'whyComplete'
          : g.notWorthwhileReason === 'horizon'
            ? 'whySlow'
            : g.notWorthwhileReason === 'zero-rate'
              ? 'whyStuck'
              : 'whyNot';
      const t = e?.values[key];
      if (typeof t === 'string')
        try {
          return render(t, slots, e?.values);
        } catch {
          /* fall through */
        }
      return `${e?.title ?? g.goalId}: ${g.notWorthwhileReason ?? 'not worth it'}`;
    });
    return `${[...new Set(words)].join('; ')}.`;
  }

  /** FR-14 fallback: the character's active M2 Role that owns an AFK Target other than this one. */
  function roleTarget(c: CharacterState): ActivityRef | null {
    const roles = meta.roles[c.index] ?? [];
    const r = roles.find(
      (x) =>
        x.active &&
        x.afkType !== null &&
        !x.afkType.startsWith('parallel:') &&
        x.afkType !== 'FIGHTING' &&
        x.afkType !== c.afkType,
    );
    if (!r?.afkType) return null;
    return {
      kind: 'afk',
      afkType: r.afkType,
      mapIndex: null,
      target: null,
      skill: SKILL_OF[r.afkType] ?? null,
    };
  }

  return { purposes, slotsOf, diagnostics };
}

/** "COOKING" -> "Cooking", "CHOPPIN" -> "Choppin". */
export const humanAfk = (t: string) => t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ');

/** TR-3 `derivePurposes`: one Purpose per readable character. */
export const derivePurposes = (input: DeriveInput): Purpose[] => derive(input).purposes;

/**
 * TR-3 (M5 TR-9): the Goal instances `activity` would serve for `contributors`, with hypothetical
 * fighting rates injected by the caller (M5's what-if channel; M4 never computes them).
 */
export function goalsServedBy(
  activity: ActivityRef,
  contributors: number[],
  rates: Record<number, DeriveInput['state']['characters'][number]['fighting'] | null>,
  input: DeriveInput,
  cardListOf?: CardListOf,
): GoalInstance[] {
  if (activity.kind !== 'afk') return [];
  const state: AccountState = {
    ...input.state,
    characters: input.state.characters.map((c) =>
      contributors.includes(c.index)
        ? {
            ...c,
            afkType: activity.afkType,
            targetMonster: activity.target,
            mapIndex: activity.mapIndex,
            fighting: rates[c.index] ?? null,
          }
        : c,
    ),
  };
  return derive({ ...input, state }, cardListOf)
    .purposes.filter((p) => contributors.includes(p.characterIndex))
    .flatMap((p) => p.goals);
}

/** TR-3 (M5 TR-9): the inverse index: the activities whose Contributions name `goalId`. */
export function activitiesServing(goalId: string, kb: DeriveInput['kb']): ActivityRef[] {
  return contributionsOf(kb)
    .filter((e) => e.goal === goalId && e.activity.afkType)
    .map((e) => ({
      kind: 'afk' as const,
      afkType: e.activity.afkType as string,
      mapIndex: null,
      target: null,
      skill: SKILL_OF[e.activity.afkType as string] ?? null,
    }));
}
