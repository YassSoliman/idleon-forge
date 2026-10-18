// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M9 Builds (docs/specs/M9-builds.md) as an engine module (M10 `EngineModule`). It runs M9's Goal
// Checks through their Detectors and keeps, per character, at most one "Talent presets" Goal and one
// "Talents" Goal (FR-19), none at all while the wrong-preset blocker fires (FR-6). The two blockers
// (wrong preset, 0 attacks) are not emitted here: they are `effect: blocker` Checks, so M3's
// `evaluateAfkSafety` runs them into the Verdict. It never sets a Verdict. Pure: no clock, no storage.
import { type AccountState, humanize } from '@idleon-forge/account-state';
import {
  type AnyDetector,
  type CheckFinding,
  type CompiledKnowledge,
  type Entry,
  makeContext,
  render,
  runDetector,
  type SlotValue,
  type SourceT,
} from '@idleon-forge/knowledge';
import { textOf } from '../afk/evaluate';
import type {
  CharacterContribution,
  EngineHistory,
  EngineInput,
  EngineModule,
  ModuleGoal,
} from '../core/module';
import type { BuildRoadmap, Category, Goal, GoalDetail, NotCoveredItem, SourceRef } from '../result';
import { type AccountAnalysis, analyzeAccount, wrongPreset } from './analyze';
import { spent } from './classify';
import { BUILDS_DETECTORS } from './detectors';
import { checkoutDetector, readBookDetector } from './library';
import { buildRoadmaps } from './roadmap';

/** M15 F4: the Talent Book Library's Account Goals, in this order (read a held book, then check out). */
export const LIBRARY_ENTRIES: Readonly<Record<string, AnyDetector>> = {
  'library.check.read-book': readBookDetector,
  'library.check.checkout': checkoutDetector,
};

/** The entry's `detail-<flag>` variant when that slot is 1, else its `detail` template. */
function detailOf(entry: CheckEntryT, slots: Record<string, SlotValue>): string | null {
  for (const [key, template] of Object.entries(entry.values)) {
    if (!key.startsWith('detail-') || typeof template !== 'string') continue;
    const flag = key.slice(7).replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
    if (slots[flag] === 1) return template;
  }
  return typeof entry.values.detail === 'string' ? entry.values.detail : null;
}

type CheckEntryT = Extract<Entry, { type: 'check' }>;
type Fired = Extract<CheckFinding, { result: 'fires' }>;

/** FR-19: the "Talent presets" Goal is the first of these that fires ... */
export const PRESET_GOAL_ORDER = [
  'talent-presets.check.same-role',
  'talent-presets.check.empty',
  'talent-presets.check.incomplete',
  'talent-presets.check.behind',
] as const;
/** ... and the "Talents" Goal the first of these. */
export const TALENT_GOAL_ORDER = [
  'talent-resets.check.reset',
  'talents.check.attack-bar',
  'talents.check.skill-attack',
  'talents.check.next-step',
] as const;

/** Entries whose Detector runs in Goal mode here (the blocker mode runs in M3's pipeline). */
const GOAL_PARAMS: Readonly<Record<string, Record<string, unknown>>> = {
  'talents.check.attack-bar': { mode: 'goal' },
};

/** FR-21 "Not covered yet" lines (M10 `notCovered`). */
export const NOT_COVERED: Readonly<Record<string, NotCoveredItem>> = {
  beyond: { systemId: 'talents-beyond', label: 'Talent builds past World 4' },
  journeyman: { systemId: 'talents-journeyman', label: 'Journeyman talent builds' },
  beginner: { systemId: 'talents-beginner', label: 'Beginner talent builds' },
  elite: { systemId: 'talents-elite', label: 'Elite talent builds' },
};

export type BuildsKnowledgeInput = Pick<CompiledKnowledge, 'entries' | 'facts'> &
  Partial<Pick<CompiledKnowledge, 'readsOf' | 'stale'>>;

const sourceRef = (s: SourceT): SourceRef => ({
  label: s.title,
  url: s.url,
  tier: s.tier,
  verifiedOn: s.verified,
  gameVersion: s.gameVersion,
});

/**
 * D6, FR-12a: the character gained class levels since the baseline (the last save before this Play
 * Session) and the preset in `slot` spends the same in tabs 1–3. No baseline, no signal.
 */
export function levelUpSignal(
  state: AccountState,
  history: EngineHistory,
  index: number,
  slot: number,
): boolean {
  const start = history.sessionStartedAt;
  if (start === null) return false;
  const baseline = [...history.entries].reverse().find((h) => h.lastCloudSave < start);
  const was = baseline?.state.characters.find((c) => c.index === index);
  const now = state.characters.find((c) => c.index === index);
  if (!was?.talents || !now?.talents || now.level <= was.level) return false;
  const presetAt = (t: NonNullable<typeof now.talents>, s: number) =>
    t.selectedPreset === s ? t.active : t.other;
  const a = presetAt(now.talents, slot);
  const b = presetAt(was.talents, slot);
  return !!a && !!b && spent(a) === spent(b);
}

interface Candidate {
  entry: CheckEntryT;
  finding: Fired;
  detector: AnyDetector;
}

export interface BuildsModuleDeps {
  kb: BuildsKnowledgeInput;
}

/** The M9 engine module over the compiled Knowledge Base. The worker and the goldens register it. */
export function createBuildsModule(deps: BuildsModuleDeps): EngineModule {
  const { kb } = deps;
  const stale = new Set(kb.stale ?? []);
  const entryOf = (id: string): CheckEntryT | null => {
    const e = kb.entries[id];
    return e?.type === 'check' && e.status !== 'retired' ? e : null;
  };

  const goalOf = (
    c: Candidate,
    state: AccountState,
    acc: AccountAnalysis,
    input: EngineInput,
  ): ModuleGoal | null => {
    const { entry, finding, detector } = c;
    const slots = finding.slots as Record<string, SlotValue>;
    const buildId = typeof slots.buildId === 'string' ? slots.buildId : '';
    const build = buildId ? kb.entries[buildId] : undefined;
    const isStale = stale.has(entry.id) || (!!build && (stale.has(build.id) || build.stale !== undefined));
    const index = finding.subject.kind === 'character' ? finding.subject.index : -1;
    const ch = state.characters.find((x) => x.index === index);
    let rank: ModuleGoal['rank'] = { framePosition: 3 };
    if (entry.id === 'talents.check.next-step') {
      const levelUp = levelUpSignal(state, input.history, index, Number(slots.slot));
      if (slots.core !== 1 && !levelUp) return null; // D6: a non-core step only after a level-up
      // RT1: a core step keeps position 3 only while its tab has points left behind, or after a level-up.
      rank =
        slots.core === 1 && (Number(slots.tabPoints) > 0 || levelUp)
          ? { framePosition: 3 }
          : { framePosition: null, atLastPosition: true };
    }
    if (entry.id === 'talent-resets.check.reset' && isStale) return null; // FR-22
    const builtins: Record<string, SlotValue> = ch
      ? { class: humanize(ch.class), level: ch.level, character: `${humanize(ch.class)} Lv ${ch.level}` }
      : {};
    const scopes = [slots, builtins, entry.values] as const;
    const sources = [...entry.sources, ...(build?.sources ?? [])].filter(
      (s, i, all) => all.findIndex((x) => x.url === s.url) === i,
    );
    const a = acc.characters.get(index);
    const states =
      entry.id === 'talents.check.next-step' && a
        ? (Number(slots.slot) === a.active.slot ? a.active : a.other)?.states
        : undefined;
    const goal: Goal = {
      id: entry.id,
      title: typeof entry.values.goal === 'string' ? entry.values.goal : entry.title,
      system: entry.system,
      category: (entry.category ?? 'compounding') as Category,
      nextAction: {
        key: `${entry.id}@c${index}`,
        entryId: entry.id,
        text: render(textOf(entry, slots), ...scopes),
        why: render(entry.why, ...scopes),
        sources: sources.map(sourceRef),
        stale: isStale,
        contested: null,
        confidence: entry.confidence,
        provenance: {
          entryIds: build ? [entry.id, build.id] : [entry.id],
          fields: [...(kb.readsOf?.[detector.id] ?? detector.reads)],
        },
      },
      milestone: states?.length
        ? {
            unit: String(entry.values.unit ?? entry.title),
            current: states.filter((s) => s.met).length,
            next: states.length,
            etaSeconds: null,
            stopHere: false,
          }
        : null,
    };
    return { goal, rank };
  };

  return {
    id: 'builds',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(input: EngineInput) {
      const { state, now } = input;
      const ctx = makeContext(state, kb, { now, history: input.history.entries });
      const acc = analyzeAccount(state, ctx.facts);
      const fired = new Map<string, Map<number, Candidate>>();
      for (const id of [...PRESET_GOAL_ORDER, ...TALENT_GOAL_ORDER]) {
        const entry = entryOf(id);
        const detector = entry ? BUILDS_DETECTORS[entry.detector.id] : undefined;
        if (!entry || !detector) continue;
        const run = runDetector(detector, ctx, { ...entry.detector.params, ...GOAL_PARAMS[id] });
        if (!run.ok) continue; // a broken Check drops its line (M11 FR-13); never a Verdict
        const byChar = new Map<number, Candidate>();
        for (const f of run.findings as readonly CheckFinding[])
          if (f.result === 'fires' && f.subject.kind === 'character')
            byChar.set(f.subject.index, { entry, finding: f, detector });
        fired.set(id, byChar);
      }
      const characters: CharacterContribution[] = state.characters.map((c) => {
        const a = acc.characters.get(c.index);
        if (!a || wrongPreset(a)) return { index: c.index, goals: [] }; // FR-6
        const pick = (order: readonly string[]) => {
          for (const id of order) {
            const cand = fired.get(id)?.get(c.index);
            const g = cand ? goalOf(cand, state, acc, input) : null;
            if (g) return g;
          }
          return null;
        };
        const goals = [pick(PRESET_GOAL_ORDER), pick(TALENT_GOAL_ORDER)].filter(
          (g): g is ModuleGoal => g !== null,
        );
        return { index: c.index, goals, spendCount: goals.length };
      });
      // M15 F4: the Library's Account Goals (one each, the rest as details, #70 A5).
      const account: ModuleGoal[] = [];
      for (const [id, detector] of Object.entries(LIBRARY_ENTRIES)) {
        const entry = entryOf(id);
        if (!entry) continue;
        const run = runDetector(detector, ctx, entry.detector.params);
        if (!run.ok) continue;
        const fired = (run.findings as readonly CheckFinding[]).filter(
          (f): f is Fired => f.result === 'fires',
        );
        const head = fired.find((f) => f.subject.kind === 'account');
        if (!head) continue;
        const seen = new Set<number>();
        const details: GoalDetail[] = fired.flatMap((f) => {
          if (f.subject.kind !== 'character' || seen.has(f.subject.index)) return [];
          seen.add(f.subject.index);
          const template = detailOf(entry, f.slots);
          return template
            ? [{ subject: `c${f.subject.index}` as const, text: render(template, f.slots, entry.values) }]
            : [];
        });
        const sources = entry.sources.map(sourceRef);
        account.push({
          goal: {
            id: entry.id,
            title: entry.title,
            system: entry.system,
            category: (entry.category ?? 'spendable') as Category,
            nextAction: {
              key: `${entry.id}@account`,
              entryId: entry.id,
              text: render(textOf(entry, head.slots), head.slots, entry.values),
              why: render(entry.why, head.slots, entry.values),
              sources,
              stale: stale.has(entry.id),
              contested: null,
              confidence: entry.confidence,
              provenance: {
                entryIds: [entry.id],
                fields: [...(kb.readsOf?.[detector.id] ?? detector.reads)],
              },
            },
            milestone: null,
            ...(details.length ? { details } : {}),
          },
          rank: {
            framePosition: 3,
            urgency: 'banked',
            cost: entry.effortSeconds ? { unit: 'hours', amount: entry.effortSeconds / 3600 } : null,
          },
        });
      }
      const notCovered: NotCoveredItem[] = [];
      const add = (k: keyof typeof NOT_COVERED) => {
        const item = NOT_COVERED[k] as NotCoveredItem;
        if (!notCovered.includes(item)) notCovered.push(item);
      };
      if (acc.beyond) add('beyond');
      else {
        for (const reason of acc.notCovered.values()) add(reason as keyof typeof NOT_COVERED);
        if (acc.eliteTabs.length) add('elite');
      }
      // The Build view's roadmaps (owner request 2026-10-18). A throw here drops only the view.
      let builds: BuildRoadmap[] | undefined;
      try {
        builds = buildRoadmaps(state, ctx.facts, { stale, entries: kb.entries });
      } catch {
        builds = undefined;
      }
      return { characters, notCovered, account: { goals: account }, ...(builds ? { builds } : {}) };
    },
  };
}
