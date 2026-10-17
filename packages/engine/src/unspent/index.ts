// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 Unspent & idle (docs/specs/M6-unspent-idle.md) as an engine module (M10 `EngineModule`): runs every
// M6 Check entry's Detector over the Account State and turns each firing finding into a Goal with one
// Next Action, its ranking hints (M2 TR-14: urgency, deadline, frame position, effort), `spendCount`
// per character (FR-30) and the skill-minigame Active Play entry (TR-10). It never sets a Verdict
// (FR-1), so a throw here never makes a character Unknown (R9). Pure: no clock, no storage.
import type { AccountState } from '@idleon-forge/account-state';
import {
  type AnyDetector,
  type CheckFinding,
  type DetectorRegistry,
  type Entry,
  type FactTable,
  findDetector,
  makeContext,
  render,
  runDetector,
  type SourceT,
  type StageId,
  stagesBetween,
} from '@idleon-forge/knowledge';
import type { CharacterContribution, EngineInput, EngineModule, ModuleGoal } from '../core/module';
import { lookupOf } from '../metapath/knowledge';
import { detectStage } from '../metapath/stage';
import type { ActivePlay, Category, Goal, Milestone, SourceRef, Subject } from '../result';

/** The Systems whose Check entries this module runs (M6 TR-1). */
export const UNSPENT_SYSTEMS: readonly string[] = [
  'boss-keys',
  'colosseum',
  'alchemy-bubbles',
  'alchemy-vials',
  'merit-shop',
  'task-unlocks',
  'gem-shop',
  'pets',
  'minigames',
  'post-office',
  'anvil',
  'poppy',
  'refinery',
  'death-note',
];

/** Entries whose Goal carries a Milestone (TR-10): the printer progress line, in gems. */
const MILESTONE_ENTRIES: Readonly<Record<string, { unit: string; current: string; next: string }>> = {
  'gem-shop.check.printer-progress': { unit: 'gems', current: 'gems', next: 'price' },
};

export interface UnspentKnowledge {
  entries: Readonly<Record<string, Entry>>;
  facts: Readonly<Record<string, FactTable>>;
  /** Field paths each Detector declares, by Detector id (CompiledKnowledge.readsOf). */
  readsOf?: Readonly<Record<string, string[]>>;
  /** Entries flagged Stale at the pin (CompiledKnowledge.stale). */
  stale?: readonly string[];
}

type CheckEntryT = Extract<Entry, { type: 'check' }>;
type Fired = Extract<CheckFinding, { result: 'fires' }>;

const sourceRef = (s: SourceT): SourceRef => ({
  label: s.title,
  url: s.url,
  tier: s.tier,
  verifiedOn: s.verified,
  gameVersion: s.gameVersion,
});

const subjectKey = (f: CheckFinding): Subject =>
  f.subject.kind === 'account' ? 'account' : `c${f.subject.index}`;

/** Whether an entry's `appliesTo.stages` covers `stage`; true when the Stage is unknown (no gate to apply). */
export function appliesAt(entry: Entry, stage: StageId | null): boolean {
  const { stages } = entry.appliesTo;
  if (stages === 'all' || stage === null) return true;
  return stages.some((s) =>
    typeof s === 'string' ? s === stage : stagesBetween(s.from, s.to).includes(stage),
  );
}

function stageOrNull(state: AccountState, kb: UnspentKnowledge): StageId | null {
  try {
    return detectStage(state, lookupOf(kb)).id;
  } catch {
    return null;
  }
}

/** One Goal per firing finding of one entry. */
function goalOf(entry: CheckEntryT, f: Fired, d: AnyDetector, kb: UnspentKnowledge): ModuleGoal {
  const subject = subjectKey(f);
  const scope = [f.slots, entry.values] as const;
  const m = MILESTONE_ENTRIES[entry.id];
  const current = m ? f.slots[m.current] : undefined;
  const next = m ? f.slots[m.next] : undefined;
  const milestone: Milestone | null =
    m && typeof current === 'number' && typeof next === 'number'
      ? { unit: m.unit, current, next, etaSeconds: null, stopHere: false }
      : null;
  const sources = entry.sources.map(sourceRef);
  const goal: Goal = {
    id: entry.id,
    title: entry.title,
    system: entry.system,
    category: (entry.category ?? 'spendable') as Category,
    nextAction: {
      key: `${entry.id}@${subject}`,
      entryId: entry.id,
      text: render(entry.text, ...scope),
      why: render(entry.why, ...scope),
      sources,
      stale: kb.stale?.includes(entry.id) ?? false,
      contested:
        entry.status === 'contested' && entry.contested
          ? {
              sides: entry.contested.sides.map((s) => ({
                text: s.position,
                sources: s.sources.map(sourceRef),
              })),
            }
          : null,
      confidence: entry.confidence,
      provenance: { entryIds: [entry.id], fields: [...(kb.readsOf?.[d.id] ?? d.reads)] },
    },
    milestone,
  };
  const byUrgency = entry.priority?.frame === 'by-urgency';
  const urgency = byUrgency ? (f.urgency ?? 'banked') : null;
  return {
    goal,
    rank: {
      urgency,
      deadline: byUrgency ? (f.deadline ?? null) : null,
      // TR-9: by-urgency entries take position 1 while value is being lost, else 3; the rest sit at 3.
      framePosition: urgency === 'losing-now' || urgency === 'lost-before-return' ? 1 : 3,
      cost: entry.effortSeconds ? { unit: 'hours', amount: entry.effortSeconds / 3600 } : null,
    },
  };
}

/** The M6 engine module over a compiled (or test-loaded) Knowledge Base and the Detector registry. */
export function createUnspentModule(kb: UnspentKnowledge, registry: DetectorRegistry): EngineModule {
  const entries = Object.values(kb.entries)
    .filter((e): e is CheckEntryT => e.type === 'check' && UNSPENT_SYSTEMS.includes(e.system))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    id: 'unspent-idle',
    covers: [],
    dependsOnExpectedReturn: true,
    affectsVerdict: false,
    run(input: EngineInput) {
      const { state, now } = input;
      const ctx = makeContext(state, kb, {
        now,
        history: input.history.entries,
        expectedReturnMs: input.options.expectedReturnSeconds * 1000,
      });
      const stage = stageOrNull(state, kb);
      const account: ModuleGoal[] = [];
      const byCharacter = new Map<number, ModuleGoal[]>();
      const accountPlay: ActivePlay[] = [];
      for (const entry of entries) {
        if (!appliesAt(entry, stage)) continue;
        const d = findDetector(entry.detector.id, registry);
        if (d?.kind !== 'check') continue;
        const run = runDetector(d, ctx, entry.detector.params);
        if (!run.ok) continue; // FR-3: a broken Check drops its line; never a Verdict (R9).
        for (const f of run.findings as readonly CheckFinding[]) {
          if (f.result !== 'fires') continue;
          const g = goalOf(entry, f, d, kb);
          if (f.subject.kind === 'account') account.push(g);
          else byCharacter.set(f.subject.index, [...(byCharacter.get(f.subject.index) ?? []), g]);
          if (entry.activePlay && f.subject.kind === 'account')
            accountPlay.push({
              key: g.goal.nextAction.key,
              text: g.goal.nextAction.text,
              estimateSeconds: entry.activePlay.minutes * 60,
              subject: 'account',
              sources: g.goal.nextAction.sources,
            });
        }
      }
      const characters: CharacterContribution[] = state.characters.map((c) => {
        const goals = byCharacter.get(c.index) ?? [];
        return {
          index: c.index,
          goals,
          // FR-30: the character's non-`nice` M6 Goals, for Visit Order.
          spendCount: goals.filter((g) => g.goal.category !== 'nice').length,
        };
      });
      return { characters, account: { goals: account, activePlay: accountPlay } };
    },
  };
}
