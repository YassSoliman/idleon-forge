// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 FR-14 to FR-21 with the owner's amendment R-Q9a (2026-10-17): each missing leaf's effort, the
// Bottleneck, the jobs, and one job per character within AFK safety and the pusher.
//
// Who may take a job:
//   1. a character already on one of its Supplies stays there (FR-9);
//   2. a character whose own Role matches the job's activity (Barbarian, Role Fishing, for Hermit Cans) is
//      a candidate even when it is the pusher or busy with another of its Roles (R-Q9a item 1). A Role
//      holder is never pulled onto an activity that is not one of its Roles (R-Q9);
//   3. a free character: its current activity serves no shown Goal (before M4: not the pusher, no
//      skiller, no Role holder on its Role; M4 D6, the Copper lesson);
//   4. any other eligible character, shown with "this moves it off <activity>".
// Never: a Lab character, one with an M3 blocker the move would not fix, or a map that fails FR-12.
// Inside a group, the soonest finish wins (two finishes within `tieSeconds` are a tie, then the weakest
// character that clears the map keeps the stronger ones free, then the lower index); a skilling job
// goes to the best real rate the save exposes: efficiency, then skill level, then the Role holder
// (R-Q9a item 2). A character serving two Goals orders its two jobs: one that finishes within an hour
// first, else the higher-ranked Goal first (R-Q9a item 3).
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { PUSHER_ROLE, rankPosition } from '../metapath';
import type { MetaPathResult } from '../metapath/types';
import type { EngineResult } from '../result';
import { alreadyFarmingSeconds } from './supply';
import type { CharacterEval, Job, ReqNode, SupplyEval } from './types';

type ItemNode = Extract<ReqNode, { kind: 'item' }>;

export const SKILLING = ['MINING', 'CHOPPIN', 'FISHING', 'CATCHING'] as const;
const DAY = 86_400;

export interface PlanValues {
  unratedBottleneckAt: number;
  firstJobWithinSeconds: number;
  tieSeconds: number;
  expectedReturnSeconds: number;
}

export type EffortKind = 'buy' | 'produce' | 'smelt' | 'job' | 'blocked';
export interface LeafEffort {
  kind: EffortKind;
  /** FR-14 effort in seconds; null for an unrated small skilling leaf or nothing usable. */
  seconds: number | null;
  supply: SupplyEval | null;
}

const best = (evals: CharacterEval[]) =>
  evals
    .filter((e) => e.eligible && e.etaSeconds !== null)
    .reduce<CharacterEval | null>(
      (b, e) => (b === null || (e.etaSeconds as number) < (b.etaSeconds as number) ? e : b),
      null,
    );

/** FR-14: the minimum effort over every Supply kind, and what kind of step it makes. */
export function leafEffort(leaf: ItemNode, supplies: SupplyEval[], v: PlanValues): LeafEffort {
  const options: { kind: EffortKind; seconds: number | null; supply: SupplyEval; small?: boolean }[] = [];
  for (const s of supplies) {
    if (s.kind === 'liquid-shop' && s.liquid?.days != null)
      options.push({ kind: 'buy', seconds: s.liquid.days <= 1 ? 0 : s.liquid.days * DAY, supply: s });
    else if (s.kind === 'shop') options.push({ kind: 'buy', seconds: 0, supply: s });
    else if (s.kind === 'anvil') {
      const b = best(s.perCharacter);
      if (b) options.push({ kind: 'produce', seconds: b.etaSeconds, supply: s });
    } else if (s.kind === 'forge' && s.forge && s.forge.oreHeld >= leaf.missing)
      options.push({ kind: 'smelt', seconds: 0, supply: s });
    else if (s.kind === 'drop' || s.kind === 'printer') {
      const b = best(s.perCharacter);
      if (b) options.push({ kind: 'job', seconds: b.etaSeconds, supply: s });
    } else if (s.kind === 'skill-node' && s.afkable)
      options.push(
        leaf.missing >= v.unratedBottleneckAt
          ? { kind: 'job', seconds: v.expectedReturnSeconds, supply: s }
          : { kind: 'job', seconds: null, supply: s, small: true },
      );
  }
  const farmed = alreadyFarmingSeconds(leaf, supplies);
  if (farmed !== null) {
    const s = supplies.find((x) => x.perCharacter.some((p) => p.alreadyFarming && p.etaSeconds !== null));
    if (s) options.push({ kind: 'job', seconds: farmed, supply: s });
  }
  const rated = options
    .filter((o) => o.seconds !== null)
    .sort((a, b) => (a.seconds as number) - (b.seconds as number));
  const pick = rated[0] ?? options.find((o) => o.small) ?? null;
  if (!pick) return { kind: 'blocked', seconds: null, supply: null };
  return { kind: pick.kind, seconds: pick.seconds, supply: pick.supply };
}

/**
 * FR-15 with M26 FR-C12 (one Bottleneck rule): the rated missing leaf with the largest effort; ties to the
 * deeper node, then rawName. A blocked leaf (no Supply) or an unrated one (a Supply without hours) is never
 * the Bottleneck: with no rated leaf there is none, and the Walkthrough says it can't tell yet.
 */
export function bottleneckOf(leaves: { leaf: ItemNode; effort: LeafEffort }[]): ItemNode | null {
  const usable = leaves.filter((l) => l.effort.kind !== 'blocked' && l.effort.seconds !== null);
  usable.sort((a, b) => {
    const sa = a.effort.seconds;
    const sb = b.effort.seconds;
    if (sa === null && sb !== null) return 1;
    if (sb === null && sa !== null) return -1;
    if (sa !== null && sb !== null && sa !== sb) return sb - sa;
    if (a.leaf.depth !== b.leaf.depth) return b.leaf.depth - a.leaf.depth;
    return a.leaf.rawName < b.leaf.rawName ? -1 : a.leaf.rawName > b.leaf.rawName ? 1 : 0;
  });
  return usable[0]?.leaf ?? null;
}

/** FR-C12: missing leaves with no source or no time estimate (blocked or unrated). */
export const unratedCount = (leaves: { effort: LeafEffort }[]): number =>
  leaves.filter((l) => l.effort.kind === 'blocked' || l.effort.seconds === null).length;

export interface PlanContext {
  state: AccountState;
  meta: MetaPathResult | null;
  prior: EngineResult | null;
  values: PlanValues;
  /** Characters already on a Supply of some missing leaf (FR-9), buy leaves included: they serve the Demand. */
  onSupply?: ReadonlySet<number>;
}

/**
 * The skilling Roles a character holds (Fishing, Mining, Choppin, Catching). The pusher and the generic
 * fighting Roles ("Fights AFK", "Can push portals") name no particular Supply, so they never make a
 * character the owner of a farming job (R-Q9a item 1 is about a Role that matches the Supply).
 */
export const ownRoles = (meta: MetaPathResult | null, index: number) =>
  (meta?.roles[index] ?? []).filter(
    (r) =>
      r.role !== PUSHER_ROLE && r.afkType !== null && (SKILLING as readonly string[]).includes(r.afkType),
  );

/**
 * FR-18's "never move this character" rule, as one predicate for other modules (M16 X2): the pusher on
 * its push, a Role holder on its own Role activity, a Lab or Cooking character. A move that sends such a
 * character away for minutes and back (M16's star visits) may still pick it when no one else can.
 */
export function isMoveExcluded(
  c: Pick<CharacterState, 'index' | 'afkType'>,
  meta: MetaPathResult | null,
): boolean {
  if (c.afkType === 'LABORATORY' || c.afkType === 'COOKING') return true;
  if (meta?.pusher?.index === c.index) return true;
  return ownRoles(meta, c.index).some((r) => r.active && r.afkType === c.afkType);
}

export const activityOfSupply = (s: SupplyEval): string =>
  s.kind === 'skill-node' ? (s.where.skill ?? 'SKILLING') : 'FIGHTING';

function isServing(ctx: PlanContext, c: CharacterState): boolean {
  if (ctx.meta?.pusher?.index === c.index) return true;
  if (ctx.onSupply?.has(c.index)) return true;
  if ((SKILLING as readonly string[]).includes(c.afkType ?? '')) return true;
  return ownRoles(ctx.meta, c.index).some((r) => r.active && r.afkType === c.afkType);
}

const hasBlocker = (ctx: PlanContext, index: number) =>
  ctx.prior?.characters.find((c) => c.index === index)?.verdict.kind === 'fix';

interface Candidate {
  c: CharacterState;
  supply: SupplyEval;
  e: CharacterEval;
  group: 'own' | 'free' | 'other';
  blocked: boolean;
}

function compareRated(a: Candidate, b: Candidate, tie: number): number {
  const ea = a.e.etaSeconds as number;
  const eb = b.e.etaSeconds as number;
  if (Math.abs(ea - eb) > tie) return ea - eb;
  // Ties: the weakest character that clears the map comfortably keeps the stronger ones free.
  const sa = a.e.survivability ?? 100;
  const sb = b.e.survivability ?? 100;
  if (sa !== sb) return sa - sb;
  const ka = a.e.killsPerHour ?? 0;
  const kb = b.e.killsPerHour ?? 0;
  if (ka !== kb) return ka - kb;
  return a.c.index - b.c.index;
}

function compareSkill(a: Candidate, b: Candidate, ctx: PlanContext, activity: string): number {
  const ea = a.e.skillEfficiency ?? 0;
  const eb = b.e.skillEfficiency ?? 0;
  if (ea !== eb) return eb - ea;
  const la = a.e.skillLevel ?? 0;
  const lb = b.e.skillLevel ?? 0;
  if (la !== lb) return lb - la;
  const ra = ownRoles(ctx.meta, a.c.index).some((r) => r.afkType === activity) ? 0 : 1;
  const rb = ownRoles(ctx.meta, b.c.index).some((r) => r.afkType === activity) ? 0 : 1;
  if (ra !== rb) return ra - rb;
  return a.c.index - b.c.index;
}

export interface JobInput {
  leaf: ItemNode;
  supplies: SupplyEval[];
  effort: LeafEffort;
  parentKey: string;
  parentEntryId: string;
  targetId: string;
  bottleneck: boolean;
}

/** FR-17 to FR-19 and R-Q9a: one job per character, jobs in the order given (highest Walkthrough first, longest first). */
export function assignJobs(ctx: PlanContext, inputs: JobInput[]): Job[] {
  const { state, meta, values } = ctx;
  const taken = new Set<number>();
  const mapsTaken = new Set<number>();
  const jobs: Job[] = [];
  for (const j of inputs) {
    const activity = j.effort.supply ? activityOfSupply(j.effort.supply) : 'FIGHTING';
    const job: Job = {
      key: `walkthrough@${j.targetId}#${j.leaf.rawName}`,
      rawName: j.leaf.rawName,
      name: j.leaf.name,
      missing: j.leaf.missing,
      supplies: j.supplies,
      assignees: [],
      etaSeconds: j.effort.seconds,
      bottleneckOf: j.bottleneck ? [j.targetId] : [],
      parentKey: j.parentKey,
      targetId: j.targetId,
      activity,
      chosen: null,
      pref: null,
    };
    // 1. Already farming (FR-9): stays, no move, and counts toward the rate.
    const already = j.supplies.flatMap((s) =>
      s.perCharacter.filter((p) => p.alreadyFarming && !taken.has(p.characterIndex)).map((e) => ({ s, e })),
    );
    if (already.length) {
      for (const { e } of already) taken.add(e.characterIndex);
      job.assignees = [...new Set(already.map((a) => a.e.characterIndex))];
      job.chosen = { supply: already[0]?.s as SupplyEval, eval: already[0]?.e as CharacterEval };
      job.pref = 1;
      job.etaSeconds = alreadyFarmingSeconds(j.leaf, j.supplies) ?? job.etaSeconds;
      jobs.push(job);
      continue;
    }
    const cands: Candidate[] = [];
    for (const s of j.supplies) {
      if (s.kind !== 'drop' && s.kind !== 'skill-node') continue;
      const act = activityOfSupply(s);
      for (const e of s.perCharacter) {
        if (!e.eligible || taken.has(e.characterIndex)) continue;
        if (s.kind === 'drop' && s.where.mapIndex !== null && mapsTaken.has(s.where.mapIndex)) continue;
        const c = state.characters.find((x) => x.index === e.characterIndex);
        if (!c || c.afkType === 'LABORATORY') continue;
        // FR-18: an M3 blocker comes first. Such a character is still a candidate (a blocker is often a
        // one-minute fix, e.g. collect the anvil), after every unblocked one, and its step says "fix
        // first"; leaving fighting for a skilling job ends a fighting-safety blocker by itself.
        const blocked = hasBlocker(ctx, c.index) && !(c.afkType === 'FIGHTING' && act !== 'FIGHTING');
        const roles = ownRoles(meta, c.index);
        const pusher = meta?.pusher?.index === c.index;
        const ownRole = roles.some((r) => r.afkType === act);
        // R-Q9: a character on its Role activity (the pusher pushing, a fisher fishing) is never pulled
        // onto an activity that isn't one of its Roles; moving between its own Roles is allowed (R-Q9a).
        const onRole = pusher || roles.some((r) => r.active && r.afkType === c.afkType);
        if (onRole && !ownRole) continue;
        const group = ownRole ? 'own' : isServing(ctx, c) ? 'other' : 'free';
        cands.push({ c, supply: s, e, group, blocked });
      }
    }
    const skill = activity !== 'FIGHTING';
    const order = (x: Candidate) => (x.group === 'other' ? 2 : 0) + (x.blocked ? 1 : 0);
    cands.sort((a, b) => {
      const g = order(a) - order(b);
      if (g !== 0) return g;
      if (skill) return compareSkill(a, b, ctx, activity);
      return compareRated(a, b, values.tieSeconds);
    });
    const pick = cands[0];
    if (pick) {
      taken.add(pick.c.index);
      if (pick.supply.kind === 'drop' && pick.supply.where.mapIndex !== null)
        mapsTaken.add(pick.supply.where.mapIndex);
      job.assignees = [pick.c.index];
      job.chosen = { supply: pick.supply, eval: pick.e };
      job.pref = pick.group === 'own' ? 'role' : pick.group === 'free' ? 2 : 3;
      if (pick.blocked) job.fixFirst = true;
      if (!skill) job.etaSeconds = pick.e.etaSeconds;
      const push = meta?.pushGoal;
      if (push && push.characterIndex === pick.c.index) {
        const pushEta = push.etaSeconds;
        const jobEta = skill ? null : pick.e.etaSeconds;
        const within = values.firstJobWithinSeconds;
        let firstIs: 'push' | 'job';
        let reason: 'short' | 'rank';
        if (pushEta !== null && pushEta <= within) {
          firstIs = 'push';
          reason = 'short';
        } else if (jobEta !== null && jobEta <= within) {
          firstIs = 'job';
          reason = 'short';
        } else {
          reason = 'rank';
          const list = meta?.list;
          const p = list ? rankPosition({ entryId: push.entryId, framePosition: null }, list) : 0;
          const q = list ? rankPosition({ entryId: j.parentEntryId, framePosition: null }, list) : 1;
          firstIs = p <= q ? 'push' : 'job';
        }
        job.sequence = { firstIs, reason, pushEtaSeconds: pushEta };
      }
    }
    jobs.push(job);
  }
  return jobs;
}
