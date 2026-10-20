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
  appliesAtStage,
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
} from '@idleon-forge/knowledge';
import { AFK_SAFETY_ENTRIES, characterBuiltins, textOf, timelineWordsOf, whyOf } from '../afk/evaluate';
import { AFK_INFO_ENTRIES } from '../afk/info';
import type { CharacterContribution, EngineInput, EngineModule, ModuleGoal } from '../core/module';
import { lookupOf } from '../metapath/knowledge';
import { detectStage } from '../metapath/stage';
import type {
  ActivePlay,
  Category,
  Goal,
  GoalDetail,
  Milestone,
  SourceRef,
  Subject,
  TimelineBar,
  UnknownFinding,
} from '../result';

/**
 * M26 Wave 1: World 4 core Systems whose Checks this module runs. They rank at their Stage list
 * position (the W4 Priority List's tier for them), not at the free-value 3.
 */
export const W4_CHECK_SYSTEMS: readonly string[] = [
  'rift',
  'elite-classes',
  'tome',
  'breeding',
  'cooking',
  'lab',
];

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
  // M26 Wave 1: the World 4 core Systems' Checks run here too (one runner for one-card Checks).
  ...W4_CHECK_SYSTEMS,
];

/** M15 F2 (`construction`): M6 runs only this entry of the Construction System; the cog seat is M3's. */
export const UNSPENT_EXTRA_ENTRIES: readonly string[] = ['construction.check.build-next'];

/** M15 entries that rank at their Stage list position (M2 authors it; FR-13), not at the free-value 3. */
const LISTED_ENTRIES: ReadonlySet<string> = new Set(['construction.check.build-next']);
const listedEntry = (e: { id: string; system: string }) =>
  LISTED_ENTRIES.has(e.id) || W4_CHECK_SYSTEMS.includes(e.system);

/** M15 entries that never fire on an account past W4-entry (`coverage: 'beyond'`, P2). */
const NOT_BEYOND: ReadonlySet<string> = new Set([
  'refinery.check.auto-refine-off',
  'refinery.check.refine-full',
  'refinery.check.unlock-next',
  'construction.check.build-next',
]);

/** M3's entries share Systems with M6 (anvil, refinery) but are M3's alone: M6 never runs them (#70 A5). */
const M3_ENTRIES: ReadonlySet<string> = new Set([...AFK_SAFETY_ENTRIES, ...AFK_INFO_ENTRIES]);

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
  ...(s.claimDate ? { claimDate: s.claimDate } : {}),
  gameVersion: s.gameVersion,
});

/** The entry's `why-<flag>` variant when that slot is 1 (as `textOf` picks `text-<flag>`), else its why. */
export { whyOf };

const subjectKey = (f: CheckFinding): Subject =>
  f.subject.kind === 'account' ? 'account' : `c${f.subject.index}`;

/** Whether an entry's `appliesTo.stages` covers `stage`; true when the Stage is unknown (no gate to apply). */
export function appliesAt(entry: Entry, stage: StageId | null): boolean {
  return appliesAtStage(entry.appliesTo, stage);
}

function stageOrNull(state: AccountState, kb: UnspentKnowledge): StageId | null {
  try {
    return detectStage(state, lookupOf(kb)).id;
  } catch {
    return null;
  }
}

/**
 * An account entry's character findings are its per-character detail (#70 A2, A3), rendered with the
 * entry's `values.detail` template, in the Detector's order. Without the template there is no detail.
 */
function detailsOf(entry: CheckEntryT, findings: readonly Fired[], state: AccountState): GoalDetail[] {
  const template = entry.values.detail;
  if (typeof template !== 'string') return [];
  return findings.map((f) => {
    const subject = subjectKey(f);
    return { subject, text: render(template, f.slots, characterBuiltins(state, subject), entry.values) };
  });
}

/** One Goal per firing finding of one entry. */
function goalOf(
  entry: CheckEntryT,
  f: Fired,
  d: AnyDetector,
  kb: UnspentKnowledge,
  details: GoalDetail[] = [],
): ModuleGoal {
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
  // M15: an account-level tip from `values.note`, one detail line under the Goal (P4).
  const note: GoalDetail[] =
    typeof entry.values.note === 'string' && subject === 'account'
      ? [{ subject: 'account', text: render(entry.values.note, ...scope) }]
      : [];
  const goal: Goal = {
    id: entry.id,
    title: entry.title,
    system: entry.system,
    category: (entry.category ?? 'spendable') as Category,
    nextAction: {
      key: `${entry.id}@${subject}`,
      entryId: entry.id,
      text: render(textOf(entry, f.slots), ...scope),
      why: render(whyOf(entry, f.slots), ...scope),
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
    ...(details.length || note ? { details: [...details, ...note] } : {}),
  };
  const byUrgency = entry.priority?.frame === 'by-urgency';
  const listed = listedEntry(entry);
  const urgency = byUrgency ? (f.urgency ?? 'banked') : listed ? 'banked' : null;
  return {
    goal,
    rank: {
      urgency,
      deadline: byUrgency ? (f.deadline ?? null) : null,
      // TR-9: by-urgency entries take position 1 while value is being lost, else 3; the rest sit at 3.
      // M15 FR-13: a listed entry ranks at its Stage list position instead.
      framePosition: listed ? null : urgency === 'losing-now' || urgency === 'lost-before-return' ? 1 : 3,
      cost: entry.effortSeconds ? { unit: 'hours', amount: entry.effortSeconds / 3600 } : null,
    },
    // M15 F5: a Stage Expectation's `when` filters on these (e.g. F2's `building`).
    slots: f.slots,
  };
}

export interface UnspentModuleDeps {
  kb: UnspentKnowledge;
  registry: DetectorRegistry;
  /** The Stage, from M2's `runMetaPath(...).stage`; without it the module detects it from the facts. */
  stage?: (state: AccountState) => { id: StageId } | null;
}

/**
 * The M6 engine module over the compiled Knowledge Base and the Detector registry the worker loads,
 * built like M3's `createAfkSafetyModule`. The core's DEFAULT_MODULES and the parse worker register it.
 */
export function createUnspentModule(deps: UnspentModuleDeps): EngineModule {
  const { kb, registry } = deps;
  const entries = Object.values(kb.entries)
    .filter(
      (e): e is CheckEntryT =>
        e.type === 'check' && (UNSPENT_SYSTEMS.includes(e.system) || UNSPENT_EXTRA_ENTRIES.includes(e.id)),
    )
    .filter((e) => !M3_ENTRIES.has(e.id))
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
      const stage = deps.stage ? (deps.stage(state)?.id ?? null) : stageOrNull(state, kb);
      const account: ModuleGoal[] = [];
      const byCharacter = new Map<number, ModuleGoal[]>();
      const accountPlay: ActivePlay[] = [];
      const unknowns: UnknownFinding[] = [];
      const timeline: TimelineBar[] = [];
      let beyond: boolean | undefined;
      const isBeyond = () => {
        if (beyond === undefined)
          try {
            beyond = detectStage(state, lookupOf(kb)).coverage === 'beyond';
          } catch {
            beyond = false;
          }
        return beyond;
      };
      for (const entry of entries) {
        if (!appliesAt(entry, stage)) continue;
        if (NOT_BEYOND.has(entry.id) && isBeyond()) continue;
        const d = findDetector(entry.detector.id, registry);
        if (d?.kind !== 'check') continue;
        const run = runDetector(d, ctx, entry.detector.params);
        if (!run.ok) {
          // FR-3: a broken Check drops its line; never a Verdict (R9). M17: its System reads "Can't tell".
          unknowns.push({ entryId: entry.id, subject: 'account', reason: 'detector-failed' });
          continue;
        }
        for (const f of run.findings as readonly CheckFinding[])
          if (
            f.result === 'unknown' &&
            (f.reason === 'field-missing' || f.reason === 'parser-section-failed')
          )
            unknowns.push({
              entryId: entry.id,
              subject: f.subject.kind === 'account' ? 'account' : `c${f.subject.index}`,
              reason: f.reason,
            });
        const fired = (run.findings as readonly CheckFinding[]).filter(
          (f): f is Fired => f.result === 'fires',
        );
        // An account entry's character findings are detail on its Goal, never Goals of their own.
        const asDetail = entry.subject === 'account';
        const details = asDetail
          ? detailsOf(
              entry,
              fired.filter((f) => f.subject.kind === 'character'),
              state,
            )
          : [];
        for (const f of fired) {
          if (asDetail && f.subject.kind !== 'account') continue;
          const g = goalOf(entry, f, d, kb, f.subject.kind === 'account' ? details : []);
          // M17 TR-4: a bank bar where the Detector says when value starts to be lost (its deadline),
          // or that it is being lost now. Only entries that author Timeline words emit one.
          const words = timelineWordsOf(entry);
          const at = f.urgency === 'losing-now' ? now : (f.deadline ?? null);
          if (words && at !== null) {
            const key = g.goal.nextAction.key;
            timeline.push({
              barId: key,
              key,
              entryId: entry.id,
              system: entry.system,
              subject: subjectKey(f),
              ...words,
              at,
              untimed: false,
              effect: 'next-action',
              fixHolds: true,
            });
          }
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
      return {
        characters,
        account: { goals: account, activePlay: accountPlay },
        unknownFindings: unknowns,
        timeline,
      };
    },
  };
}
