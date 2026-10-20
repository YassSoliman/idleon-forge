// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 6: the Milestone-ladder Goals of the Systems M6's module runs (Minigames, Poppy, ...). Each
// Goal's `progress` Detector gives the value; the next rung of its `milestones` above it is the target.
// A ladder that is complete says nothing. The Goal ranks after every listed entry (it is on no Priority
// List), so a long ladder never pushes a Check off the top of Now.
import {
  type AnyDetector,
  type DetectorContext,
  type DetectorRegistry,
  type Entry,
  findDetector,
  type ProgressFinding,
  render,
  runDetector,
  type SourceT,
} from '@idleon-forge/knowledge';
import type { ModuleGoal } from '../core/module';
import type { Category, Goal, SourceRef, Subject, UnknownFinding } from '../result';

export type LadderGoalEntry = Extract<Entry, { type: 'goal' }>;

/** The Systems whose ladder Goals this module runs. */
export const LADDER_GOAL_SYSTEMS: readonly string[] = ['minigames', 'poppy'];

/** An authored ladder Goal (a generated parent only lends its ladder through `extends`). */
export const isLadderGoal = (e: Entry): e is LadderGoalEntry =>
  e.type === 'goal' &&
  LADDER_GOAL_SYSTEMS.includes(e.system) &&
  !('origin' in e && e.origin === 'generated') &&
  (e.milestones?.length ?? 0) > 0;

const sourceRef = (s: SourceT): SourceRef => ({
  label: s.title,
  url: s.url,
  tier: s.tier,
  verifiedOn: s.verified,
  ...(s.claimDate ? { claimDate: s.claimDate } : {}),
  gameVersion: s.gameVersion,
});

export interface LadderRun {
  goals: Array<{ subject: Subject; goal: ModuleGoal }>;
  unknowns: UnknownFinding[];
}

/** Runs one ladder Goal: one Goal per subject whose value is below the ladder's last rung. */
export function runLadderGoal(
  entry: LadderGoalEntry,
  ctx: DetectorContext,
  registry: DetectorRegistry,
  readsOf: Readonly<Record<string, string[]>> | undefined,
  stale: readonly string[] | undefined,
): LadderRun {
  const out: LadderRun = { goals: [], unknowns: [] };
  const d: AnyDetector | undefined = findDetector(entry.progress.id, registry);
  if (d?.kind !== 'progress') return out;
  const run = runDetector(d, ctx, entry.progress.params);
  if (!run.ok) {
    out.unknowns.push({ entryId: entry.id, subject: 'account', reason: 'detector-failed' });
    return out;
  }
  const ladder = [...(entry.milestones ?? [])].sort((a, b) => a.at - b.at);
  for (const f of run.findings as readonly ProgressFinding[]) {
    const subject: Subject = f.subject.kind === 'account' ? 'account' : `c${f.subject.index}`;
    if (f.value === null) {
      if (f.reason === 'field-missing' || f.reason === 'parser-section-failed')
        out.unknowns.push({ entryId: entry.id, subject, reason: f.reason });
      continue;
    }
    const value = f.value;
    const rung = ladder.find((m) => m.at > value);
    if (!rung) continue;
    const slots = { ...f.slots, value, next: rung.at, more: rung.at - value, reward: rung.reward };
    const goal: Goal = {
      id: entry.id,
      title: entry.title,
      system: entry.system,
      category: (entry.category ?? 'compounding') as Category,
      nextAction: {
        key: `${entry.id}@${subject}`,
        entryId: entry.id,
        text: render(entry.text, slots, entry.values),
        why: render(entry.why, slots, entry.values),
        sources: entry.sources.map(sourceRef),
        stale: stale?.includes(entry.id) ?? false,
        contested: null,
        confidence: entry.confidence,
        provenance: { entryIds: [entry.id], fields: [...(readsOf?.[d.id] ?? d.reads)] },
      },
      milestone: { unit: entry.unit, current: value, next: rung.at, etaSeconds: null, stopHere: false },
    };
    out.goals.push({ subject, goal: { goal, rank: { framePosition: null, cost: null }, slots } });
  }
  return out;
}
