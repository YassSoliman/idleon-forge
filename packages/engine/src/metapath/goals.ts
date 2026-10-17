// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2's findings as EngineResult Goals (M10 TR-2): every word comes from the Goal's entry (its title,
// why and the per-case Next Action template in `values`), filled with the finding's slots.
import { type Entry, render, type SlotValue } from '@idleon-forge/knowledge';
import type { Goal, Milestone, SourceRef, Subject } from '../result';
import { worldGates } from './knowledge';
import type { FactLookup, MetaPathGoal, MetaPathKnowledge, MetaPathResult, PushGoal } from './types';

export interface MetaPathGoalOut {
  subject: Subject;
  goal: Goal;
}

const sourcesOf = (e: Entry): SourceRef[] =>
  e.sources.map((s) => ({
    label: s.title,
    url: s.url,
    tier: s.tier,
    verifiedOn: s.verified,
    gameVersion: s.gameVersion,
  }));

function goalOf(
  kb: MetaPathKnowledge,
  entryId: string,
  subject: Subject,
  template: string,
  slots: Record<string, SlotValue>,
  over: {
    title?: string;
    why?: string;
    milestone?: Milestone | null;
    fields?: string[];
    entryIds?: string[];
  } = {},
): Goal | null {
  const e = kb.entries[entryId];
  if (e?.type !== 'goal') return null;
  const text = e.values[template];
  if (typeof text !== 'string') return null;
  return {
    id: entryId,
    title: over.title ?? e.title,
    system: e.system,
    category: e.category,
    nextAction: {
      key: `${entryId}@${subject}`,
      entryId,
      text: render(text, slots),
      why: over.why ?? e.why,
      sources: sourcesOf(e),
      stale: false,
      contested: null,
      confidence: e.confidence,
      provenance: { entryIds: [entryId, ...(over.entryIds ?? [])], fields: over.fields ?? [] },
    },
    milestone: over.milestone ?? null,
  };
}

const subjectOf = (s: MetaPathGoal['subject']): Subject => (s.kind === 'account' ? 'account' : `c${s.index}`);

/** The push Goal (FR-12, FR-13): title and why from the world's gate chain, the step's wording. */
function pushOut(kb: MetaPathKnowledge, facts: FactLookup, p: PushGoal, world: number): Goal | null {
  const chain = kb.entries[p.chainId];
  const crystalName = (raw: string | null) =>
    worldGates(facts).find((g) => g.crystal === raw)?.crystalName ?? raw ?? '';
  const s = p.step;
  let slots: Record<string, SlotValue>;
  switch (s.kind) {
    case 'route':
      slots = { killsLeft: s.killsLeft, map: s.mapName };
      break;
    case 'quest':
      slots = { npc: s.npc, number: s.number };
      break;
    case 'boss':
      slots = { boss: s.boss, crystal: crystalName(s.crystal) };
      break;
    case 'crystal':
      slots = { crystal: crystalName(s.crystal) };
      break;
    case 'gatekeeper':
      slots = { npc: s.npc };
      break;
    case 'wall':
      slots = { map: s.mapName, hit: Math.round(s.hitChance), survivability: Math.round(s.survivability) };
      break;
  }
  const milestone: Milestone | null =
    s.kind === 'route'
      ? { unit: 'portal kills', current: p.current, next: p.goal, etaSeconds: p.etaSeconds, stopHere: false }
      : null;
  return goalOf(kb, p.entryId, `c${p.characterIndex}`, s.kind, slots, {
    title: chain?.text ?? `World ${world}`,
    why: chain?.why,
    milestone,
    fields: p.provenance.fields,
    entryIds: p.provenance.entryIds,
  });
}

/** One Meta Path Goal finding as a Goal: which `values` template its slots fill. */
function findingOut(kb: MetaPathKnowledge, g: MetaPathGoal): Goal | null {
  const subject = subjectOf(g.subject);
  const fields = g.provenance.fields;
  switch (g.entryId) {
    case 'metapath.goal.subclass': {
      const template =
        g.slots.action === 'pick-class'
          ? 'pick-class'
          : g.slots.class === 'Journeyman'
            ? 'journeyman'
            : 'subclass';
      return goalOf(kb, g.entryId, subject, template, {}, { fields });
    }
    case 'metapath.goal.world-tutorial-w3':
      return goalOf(
        kb,
        g.entryId,
        subject,
        'next',
        { npc: 'Hoggindaz', number: g.slots.number ?? 1, title: g.slots.title ?? '' },
        { fields },
      );
    case 'metapath.goal.elite':
      return goalOf(kb, g.entryId, subject, 'next', { elite: g.slots.elite ?? '' }, { fields });
    case 'metapath.goal.next-character':
      return g.slots.line === 'Journeyman'
        ? goalOf(kb, g.entryId, subject, 'journeyman', {}, { fields })
        : goalOf(
            kb,
            g.entryId,
            subject,
            'next',
            { line: g.slots.line ?? '', baseClass: g.slots.baseClass ?? '' },
            { fields },
          );
    case 'metapath.goal.swap-token':
      return goalOf(
        kb,
        g.entryId,
        subject,
        'next',
        { from: g.slots.from ?? '', to: g.slots.to ?? '' },
        { fields },
      );
  }
}

/** Every Meta Path Goal of a result, with its subject. Goals whose entry isn't shipped are left out. */
export function metaPathGoals(
  kb: MetaPathKnowledge,
  facts: FactLookup,
  r: MetaPathResult,
): MetaPathGoalOut[] {
  const out: MetaPathGoalOut[] = [];
  if (r.pushGoal && r.stage.world !== null) {
    const goal = pushOut(kb, facts, r.pushGoal, r.stage.world);
    if (goal) out.push({ subject: `c${r.pushGoal.characterIndex}`, goal });
  }
  for (const g of r.goals) {
    const goal = findingOut(kb, g);
    if (goal) out.push({ subject: subjectOf(g.subject), goal });
  }
  return out;
}
