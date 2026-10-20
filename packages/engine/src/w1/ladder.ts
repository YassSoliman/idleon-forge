// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 4, the World 1 core Systems' Goals (FR-48, 49, 51..53, 78): every `type: goal` entry of these
// Systems whose progress is a Knowledge Base `progress` Detector becomes one Goal with its Milestone, the
// next rung of the entry's own ladder past the value the Detector reads. A ladder that is all reached says
// nothing. These Goals are display lines (their entries' category, usually `nice`); the Systems' Checks
// stay the actions (the M6 module runs them). Pure: no clock, no storage.
import type { AccountState } from '@idleon-forge/account-state';
import {
  appliesAtStage,
  type DetectorRegistry,
  type Entry,
  type FactTable,
  findDetector,
  makeContext,
  type ProgressFinding,
  render,
  runDetector,
  type SourceT,
  type StageId,
} from '@idleon-forge/knowledge';
import type { CharacterContribution, EngineInput, EngineModule, ModuleGoal } from '../core/module';
import type { Category, Goal, SourceRef, Subject, UnknownFinding } from '../result';

/** The Systems whose ladder Goals this module runs. */
export const W1_GOAL_SYSTEMS: readonly string[] = ['owl'];

export interface LadderKnowledge {
  entries: Readonly<Record<string, Entry>>;
  facts: Readonly<Record<string, FactTable>>;
  readsOf?: Readonly<Record<string, string[]>>;
  stale?: readonly string[];
}

export interface LadderModuleDeps {
  kb: LadderKnowledge;
  registry: DetectorRegistry;
  /** The Stage (M2's classifier); without it every Stage gate passes. */
  stage?: (state: AccountState) => { id: StageId | null } | null;
}

type GoalEntry = Extract<Entry, { type: 'goal' }>;

const sourceRef = (s: SourceT): SourceRef => ({
  label: s.title,
  url: s.url,
  tier: s.tier,
  verifiedOn: s.verified,
  ...(s.claimDate ? { claimDate: s.claimDate } : {}),
  gameVersion: s.gameVersion,
});

const subjectOf = (f: ProgressFinding): Subject =>
  f.subject.kind === 'account' ? 'account' : `c${f.subject.index}`;

/** The ladder entries, in id order. */
export const ladderEntries = (kb: LadderKnowledge): GoalEntry[] =>
  Object.values(kb.entries)
    .filter((e): e is GoalEntry => e.type === 'goal' && W1_GOAL_SYSTEMS.includes(e.system))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

export function createLadderGoalsModule(deps: LadderModuleDeps): EngineModule {
  const { kb, registry } = deps;
  const entries = ladderEntries(kb);
  return {
    id: 'w1-ladders',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(input: EngineInput) {
      const { state, now } = input;
      const ctx = makeContext(state, kb, { now });
      let stage: StageId | null = null;
      try {
        stage = deps.stage?.(state)?.id ?? null;
      } catch {
        stage = null;
      }
      const account: ModuleGoal[] = [];
      const byCharacter = new Map<number, ModuleGoal[]>();
      const unknowns: UnknownFinding[] = [];
      for (const entry of entries) {
        if (!appliesAtStage(entry.appliesTo, stage)) continue;
        const d = findDetector(entry.progress.id, registry);
        if (d?.kind !== 'progress') continue;
        const run = runDetector(d, ctx, entry.progress.params);
        if (!run.ok) {
          unknowns.push({ entryId: entry.id, subject: 'account', reason: 'detector-failed' });
          continue;
        }
        for (const f of run.findings as readonly ProgressFinding[]) {
          const subject = subjectOf(f);
          if (f.value === null) {
            if (f.reason === 'field-missing' || f.reason === 'parser-section-failed')
              unknowns.push({ entryId: entry.id, subject, reason: f.reason });
            continue;
          }
          const value = f.value;
          const rung = (entry.milestones ?? []).find((m) => m.at > value);
          if (!rung) continue;
          const scope = { ...f.slots, value, next: rung.at, reward: rung.reward ?? '' };
          const goal: Goal = {
            id: entry.id,
            title: entry.title,
            system: entry.system,
            category: (entry.category ?? 'nice') as Category,
            nextAction: {
              key: `${entry.id}@${subject}`,
              entryId: entry.id,
              text: render(entry.text, scope, entry.values),
              why: render(entry.why, scope, entry.values),
              sources: entry.sources.map(sourceRef),
              stale: kb.stale?.includes(entry.id) ?? false,
              contested: null,
              confidence: entry.confidence,
              provenance: { entryIds: [entry.id], fields: [...(kb.readsOf?.[d.id] ?? d.reads)] },
            },
            milestone: { unit: entry.unit, current: value, next: rung.at, etaSeconds: null, stopHere: false },
          };
          const g: ModuleGoal = { goal, rank: { framePosition: 3, cost: null }, slots: f.slots };
          if (subject === 'account') account.push(g);
          else {
            const i = Number(subject.slice(1));
            byCharacter.set(i, [...(byCharacter.get(i) ?? []), g]);
          }
        }
      }
      const characters: CharacterContribution[] = state.characters.map((c) => ({
        index: c.index,
        goals: byCharacter.get(c.index) ?? [],
      }));
      return { characters, account: { goals: account }, unknownFindings: unknowns };
    },
  };
}
