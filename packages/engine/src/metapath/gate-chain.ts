// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Meta Path Goals (M2 FR-9, FR-10, FR-12 to FR-17, TR-11): the push Goal (the next gate-chain step
// for the pusher), the W3 tutorial, subclass and elite nudges, the next character and the swap token.
// Each is a finding with slots; every word a player reads lives in the Goal's entry (M11 TR-4).
import { type AccountState, isKnown, type RouteDoor } from '@idleon-forge/account-state';
import { STAGE_DEFINITIONS, type StageId, stageIndex, stagesBetween } from '@idleon-forge/knowledge';
import { holdingsKnown, holdingsOf, totalOf } from '../walkthrough/holdings';
import {
  classTree,
  ENTRY,
  gateChain,
  gateQuest,
  gateQuestSteps,
  MetaPathKnowledgeError,
  routeTo,
  worldGates,
} from './knowledge';
import { plannedPaths } from './planned';
import type { PusherSelection } from './pusher';
import { CLASS_PICK_LEVEL } from './roster';
import type { FactLookup, MetaPathGoal, PushGoal, PushStep, RosterResult, StageResult } from './types';

const PUSH = 'metapath.goal.push' as const;
const SECONDS_PER_HOUR = 3600;

/**
 * The route path the frontier step walks for `world` (TR-7, TR-10): the shortest door path from the
 * town to the map the gate chain's route step names. The parse worker passes it to `computeFrontier`.
 */
export function frontierRoute(kb: FactLookup, world: number): RouteDoor[] | null {
  const route = gateChain(kb, world)?.find((s) => s.kind === 'route');
  if (!route?.ref) return null;
  const [kind, value] = route.ref.split(':') as [string, string];
  let destination: number | null = null;
  if (kind === 'map') destination = Number(value);
  else if (kind === 'npc') destination = gateQuestSteps(kb, value)[0]?.map ?? null;
  if (destination === null || !Number.isInteger(destination))
    throw new MetaPathKnowledgeError(`gate chain w${world}: bad route ref ${route.ref}`);
  return routeTo(kb, world, destination);
}

const questNumber = (quest: string) => Number(/(\d+)$/.exec(quest)?.[1] ?? Number.NaN);
const questNpc = (quest: string) => quest.replace(/\d+$/, '');

function crystalCount(state: AccountState, crystal: string | null): number | null {
  const c = state.account.worldCrystals ?? null;
  if (c === null || crystal === null) return null;
  return crystal === 'Crystal1'
    ? c.desertTopaz
    : crystal === 'Crystal2'
      ? c.glacierQuartz
      : crystal === 'Crystal3'
        ? c.galaxialAmethyst
        : null;
}

export type PushOutcome =
  | { goal: PushGoal; unavailable: null }
  | { goal: null; unavailable: 'no-frontier' | 'beyond-coverage' | 'no-stage' | 'chain-done' };

/** FR-12, FR-13, TR-11: the push Goal, position 2 of every list. */
export function pushGoal(
  state: AccountState,
  kb: FactLookup,
  stage: StageResult,
  selection: PusherSelection,
): PushOutcome {
  if (stage.id === null || stage.world === null) return { goal: null, unavailable: 'no-stage' };
  if (stage.coverage === 'beyond') return { goal: null, unavailable: 'beyond-coverage' };
  if (selection.kind === 'no-frontier') return { goal: null, unavailable: 'no-frontier' };
  const { frontier } = selection;
  const world = stage.world;
  const chainId = ENTRY.gateChain(world);
  const steps = gateChain(kb, world) ?? [];
  const fieldsBase = ['account.frontier', 'account.gateQuests', 'account.worldCrystals'];
  const provenance = { entryIds: [chainId, ENTRY.pusherRule], fields: fieldsBase };

  if (selection.kind === 'wall') {
    const { wall } = selection;
    return {
      unavailable: null,
      goal: {
        entryId: PUSH,
        characterIndex: wall.characterIndex,
        current: 0,
        goal: frontier.requirement,
        etaSeconds: null,
        chainId,
        step: {
          kind: 'wall',
          mapName: frontier.mapName,
          mapIndex: frontier.mapIndex,
          reason: wall.reason,
          hitChance: wall.hitChance,
          survivability: wall.survivability,
        },
        provenance,
      },
    };
  }

  const p = selection.pusher.index;
  const fight = frontier.fights.find((f) => f.characterIndex === p);
  const route = frontier.routeCleared.find((r) => r.characterIndex === p);
  const killsLeft = fight?.killsLeft ?? frontier.requirement;
  const current = Math.max(0, frontier.requirement - killsLeft);
  const gate = worldGates(kb).find((g) => g.world === world);
  const quests = state.account.gateQuests ?? {};

  for (const s of steps) {
    let step: PushStep | null = null;
    if (s.kind === 'route') {
      if (!route || route.count < route.of)
        step = {
          kind: 'route',
          mapName: frontier.mapName,
          mapIndex: frontier.mapIndex,
          door: frontier.door,
          killsLeft,
        };
    } else if (s.kind === 'quest' && s.ref) {
      const done = quests[s.ref as keyof typeof quests]?.completedBy.includes(p) ?? false;
      if (!done)
        step = {
          kind: 'quest',
          quest: s.ref,
          npc: questNpc(s.ref),
          number: questNumber(s.ref),
          title: gateQuest(kb, s.ref)?.title ?? null,
        };
    } else if (s.kind === 'boss' || s.kind === 'crystal') {
      // The crystal is the boss's drop; there is no separate boss-kill field (TR-11).
      const crystal = gate?.crystal ?? null;
      if (!((crystalCount(state, crystal) ?? 0) > 0))
        step =
          s.kind === 'boss'
            ? { kind: 'boss', boss: s.ref ?? '', crystal }
            : { kind: 'crystal', crystal: crystal ?? s.ref ?? '' };
    } else if (s.kind === 'gatekeeper') {
      if (!state.account.finishedWorlds.includes(world))
        step = { kind: 'gatekeeper', npc: s.ref ?? gate?.gatekeeper ?? '' };
    }
    if (step === null) continue;
    const eta =
      step.kind === 'route' && fight && fight.finalKillsPerHour > 0
        ? Math.round((killsLeft / fight.finalKillsPerHour) * SECONDS_PER_HOUR)
        : null;
    return {
      unavailable: null,
      goal: {
        entryId: PUSH,
        characterIndex: p,
        current,
        goal: frontier.requirement,
        etaSeconds: eta,
        chainId,
        step,
        provenance,
      },
    };
  }
  return { goal: null, unavailable: 'chain-done' };
}

const inStages = (stage: StageId | null, from: StageId, to: StageId) =>
  stage !== null && stagesBetween(from, to).includes(stage);

/** FR-16: Hoggindaz 1–5, W3-early to W3-late, until any character completes Hoggindaz 5. */
export function worldTutorial(
  state: AccountState,
  kb: FactLookup,
  stage: StageResult,
  pusher: number | null,
): MetaPathGoal[] {
  if (stage.coverage === 'beyond' || !inStages(stage.id, 'W3-early', 'W3-late')) return [];
  const quests = state.account.gateQuests ?? null;
  if (quests === null) return [];
  const chain = gateQuestSteps(kb, 'Hoggindaz').slice(0, 5);
  const last = chain[chain.length - 1];
  if (!last || (quests[last.questName as keyof typeof quests]?.completedBy.length ?? 0) > 0) return [];
  const rows = state.characters.map((c) => {
    let n = 0;
    while (
      n < chain.length &&
      quests[chain[n]?.questName as keyof typeof quests]?.completedBy.includes(c.index)
    )
      n++;
    const next = chain[n] as (typeof chain)[number];
    const inProgress = quests[next.questName as keyof typeof quests]?.inProgressBy.includes(c.index) ?? false;
    return { c, n, next, inProgress };
  });
  const best = rows.sort(
    (a, b) =>
      b.n - a.n ||
      Number(b.inProgress) - Number(a.inProgress) ||
      Number(b.c.index === pusher) - Number(a.c.index === pusher) ||
      b.c.level - a.c.level ||
      a.c.index - b.c.index,
  )[0];
  if (!best) return [];
  return [
    {
      entryId: 'metapath.goal.world-tutorial-w3',
      subject: { kind: 'character', index: best.c.index },
      slots: {
        quest: best.next.questName,
        number: questNumber(best.next.questName),
        title: best.next.title,
        done: best.n,
      },
      order: 0,
      provenance: { entryIds: [ENTRY.gateChain(3)], fields: ['account.gateQuests'] },
    },
  ];
}

/** The items Rocklyte's first two quests take (Toolbox quests.json#Rocklyte, dossier C4). */
export const ROCKLYTE = { npc: 'Rocklyte', peanut: 'Peanut', goldenPeanut: 'PeanutG', quests: 3 } as const;

/** Rocklyte's quests this character finished in a row (1-3), or -1 when its quests can't be read. */
function rocklyteDone(state: AccountState, c: AccountState['characters'][number]): number {
  if (!isKnown(state, `characters[${c.index}].quests`) || !c.quests) return -1;
  const q = c.quests[ROCKLYTE.npc];
  if (!q) return -1;
  let n = 0;
  while (n < ROCKLYTE.quests && q[String(n + 1)] === 1) n++;
  return n;
}

const heldOf = (state: AccountState, rawName: string) =>
  holdingsKnown(state) ? totalOf(holdingsOf(state, rawName)) : -1;

/**
 * FR-15: a subclass nudge per base-class character (W2-early on); "Pick your class" for a Beginner.
 * Both name the class the Planned Path gives (owner report 2026-10-19), and a Beginner planned as the
 * Journeyman is told not to pick a class and to do Rocklyte's quests instead, at any level.
 */
export function subclassPending(
  state: AccountState,
  kb: FactLookup,
  stage: StageResult,
  roster?: RosterResult | null,
): MetaPathGoal[] {
  if (stage.coverage === 'beyond' || stage.id === null || stageIndex(stage.id) < stageIndex('W2-early'))
    return [];
  const tree = classTree(kb);
  const plans = plannedPaths(state, kb, stage.id, roster);
  return state.characters.flatMap((c): MetaPathGoal[] => {
    const row = c.classIndex == null ? undefined : tree.byIndex.get(c.classIndex);
    if (!row) return [];
    if (row.tier !== 'base' && row.tier !== 'beginner') return [];
    const plan = plans.find((p) => p.characterIndex === c.index);
    const fields = [`characters[${c.index}].classIndex`, `characters[${c.index}].level`];
    if (row.tier === 'beginner' && plan?.via === 'rocklyte')
      return [
        {
          entryId: 'metapath.goal.subclass',
          subject: { kind: 'character', index: c.index },
          slots: {
            class: row.class,
            action: 'become-journeyman',
            next: 'Journeyman',
            done: rocklyteDone(state, c),
            peanuts: heldOf(state, ROCKLYTE.peanut),
            goldenPeanuts: heldOf(state, ROCKLYTE.goldenPeanut),
          },
          order: 0,
          provenance: {
            entryIds: [ENTRY.slotPlan],
            fields: [...fields, `characters[${c.index}].quests`, 'account.storageItems'],
          },
        },
      ];
    if (c.level < CLASS_PICK_LEVEL) return [];
    return [
      {
        entryId: 'metapath.goal.subclass',
        subject: { kind: 'character', index: c.index },
        slots: {
          class: row.class,
          action: row.tier === 'beginner' ? 'pick-class' : 'subclass',
          next: plan?.basis === 'roster' ? (plan.next ?? '') : '',
        },
        order: 0,
        provenance: { entryIds: [], fields },
      },
    ];
  });
}

/**
 * FR-17: the elite order, DK and ES first (PV 6.2), then the unverified BC, BB, BM, SB (confidence L).
 * Judgment: it moves into `metapath.goal.elite` with the Goal entries (see the M2 PR).
 */
export const ELITE_ORDER = [
  'Divine_Knight',
  'Elemental_Sorcerer',
  'Bubonic_Conjuror',
  'Blood_Berserker',
  'Beast_Master',
  'Siege_Breaker',
] as const;

export function elitePending(state: AccountState, kb: FactLookup, stage: StageResult): MetaPathGoal[] {
  // Any World 4 band (M26 FR-3), never past World 4.
  if (stage.coverage === 'beyond' || stage.id === null || STAGE_DEFINITIONS[stage.id].world !== 4) return [];
  const tree = classTree(kb);
  return state.characters.flatMap((c): MetaPathGoal[] => {
    const row = c.classIndex == null ? undefined : tree.byIndex.get(c.classIndex);
    const elite = row?.tier === 'subclass' ? row.promotesTo[0] : undefined;
    if (!elite) return [];
    const at = (ELITE_ORDER as readonly string[]).indexOf(elite);
    return [
      {
        entryId: 'metapath.goal.elite',
        subject: { kind: 'character', index: c.index },
        slots: { class: row?.class ?? '', elite },
        order: at < 0 ? ELITE_ORDER.length : at,
        provenance: { entryIds: [], fields: [`characters[${c.index}].classIndex`] },
      },
    ];
  });
}

/** FR-9: the next-character Goal once its slot is open (a note while closed); FR-10: the swap token. */
export function rosterGoals(roster: RosterResult, stage: StageResult): MetaPathGoal[] {
  if (stage.coverage === 'beyond' || stage.id === null) return [];
  const out: MetaPathGoal[] = [];
  const n = roster.nextCharacter;
  if (n?.slotOpen)
    out.push({
      entryId: 'metapath.goal.next-character',
      subject: { kind: 'account' },
      slots: { line: n.line, baseClass: n.baseClass, slotNumber: n.slotNumber },
      order: 0,
      provenance: {
        entryIds: [ENTRY.slotPlan],
        fields: ['account.accountLevel', 'characters[*].classIndex'],
      },
    });
  if (roster.swapToken && stageIndex(stage.id) >= stageIndex('W2-late'))
    out.push({
      entryId: 'metapath.goal.swap-token',
      subject: { kind: 'character', index: roster.swapToken.characterIndex },
      slots: { from: roster.swapToken.from, to: roster.swapToken.to },
      order: 0,
      provenance: { entryIds: [ENTRY.slotPlan], fields: ['characters[*].classIndex'] },
    });
  return out;
}
