// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 as an engine module (M10 TR-6): each character's Purpose as `PurposeLine`s (TR-3 mapping), the
// stop-here suggestion as one Goal with one Next Action (D4), the Milestones reached this Play Session
// as Done lines (FR-12), and the Purpose status M3's Verdict composer reads. M3 and M2 read the same
// Purposes through `purposesFor` (memoized per run), so M4 runs once per save and Expected Return.
import type { AccountState } from '@idleon-forge/account-state';
import { type CompiledKnowledge, type DetectorRegistry, type Entry, render } from '@idleon-forge/knowledge';
import { cardList } from '../collections/cards';
import type { EngineInput, EngineModule, ModuleOutput } from '../core/module';
import { runMetaPath } from '../metapath';
import { lookupOf } from '../metapath/knowledge';
import type { Done, Goal, NextAction, PurposeLine, SourceRef, Subject, UnknownFinding } from '../result';
import { bestExpPerHour } from './best-exp';
import { countText, type Derived, derive, etaWords, humanAfk, ROLES_GOAL } from './derive';
import type { GoalInstance, MetaPathInput, Purpose, PurposeStatus } from './types';

export interface PurposeModuleDeps {
  kb: CompiledKnowledge;
  /** The Knowledge Base Detector registry (M11), which holds every Purpose Detector. */
  registry: DetectorRegistry;
}

type GoalEntry = Extract<Entry, { type: 'goal' }>;

export interface PurposeRun extends Derived {
  meta: MetaPathInput | null;
}

/** M1 SaveHistory.sessionStart: the first earlier save of the current Play Session, or null. */
export function sessionStartOf(input: EngineInput): AccountState | null {
  const start = input.history.sessionStartedAt;
  if (start === null) return null;
  return input.history.entries.find((e) => e.lastCloudSave >= start)?.state ?? null;
}

const memo = new WeakMap<object, Map<string, PurposeRun>>();

/** The Purposes of one engine run; computed once per (state, now, Expected Return, history). */
export function purposesFor(input: EngineInput, deps: PurposeModuleDeps): PurposeRun {
  const key = `${input.now}|${input.options.expectedReturnSeconds}|${input.history.sessionStartedAt}|${input.history.entries.length}`;
  const byState = memo.get(input.state) ?? new Map<string, PurposeRun>();
  memo.set(input.state, byState);
  const hit = byState.get(key);
  if (hit) return hit;
  let meta: MetaPathInput | null = null;
  try {
    meta = runMetaPath(input.state, deps.kb, input.now);
  } catch {
    meta = null;
  }
  const run: PurposeRun = meta
    ? {
        meta,
        ...derive(
          {
            state: input.state,
            history: { sessionStart: sessionStartOf(input) },
            kb: deps.kb,
            registry: deps.registry,
            meta,
            bestExpPerHour: bestExpPerHour(input.state, lookupOf(deps.kb)),
            expectedReturnHours: input.options.expectedReturnSeconds / 3600,
            now: input.now,
          },
          (cls, stage) => cardList(lookupOf(deps.kb), cls, stage),
        ),
      }
    : { meta: null, purposes: [], slotsOf: new Map(), diagnostics: [] };
  byState.set(key, run);
  return run;
}

/** M5 TR-9 `purposeOf(i)`: the same Purpose the engine run used. */
export const purposeOf = (input: EngineInput, deps: PurposeModuleDeps, index: number): Purpose | null =>
  purposesFor(input, deps).purposes.find((p) => p.characterIndex === index) ?? null;

/** For M3's Verdict composer (FR-8): a character's Purpose status. */
export const purposeStatusFor =
  (deps: PurposeModuleDeps) =>
  (index: number, input: EngineInput): PurposeStatus | 'not-implemented' =>
    purposesFor(input, deps).purposes.find((p) => p.characterIndex === index)?.status ?? 'cannot-tell';

export const sourcesOf = (e: Entry | undefined): SourceRef[] =>
  (e?.sources ?? []).map((s) => ({
    label: s.title,
    url: s.url,
    tier: s.tier,
    verifiedOn: s.verified,
    ...(s.claimDate ? { claimDate: s.claimDate } : {}),
    gameVersion: s.gameVersion,
  }));

/** FR-14 fallback suggestion: the active Role's AFK Target, in roles.goal.skill's words. */
export function suggestionFor(deps: PurposeModuleDeps) {
  return (index: number, input: EngineInput): NextAction | null => {
    const p = purposesFor(input, deps).purposes.find((x) => x.characterIndex === index);
    const t = p?.suggestedTarget;
    const e = deps.kb.entries[ROLES_GOAL];
    const template = e?.values.suggest;
    if (!p || !t || t.kind !== 'afk' || typeof template !== 'string' || p.status === 'no-activity')
      return null;
    return {
      key: `${ROLES_GOAL}@c${index}`,
      entryId: ROLES_GOAL,
      text: render(template, { skill: humanAfk(t.afkType).toLowerCase() }),
      why: e?.why ?? '',
      sources: sourcesOf(e),
      stale: false,
      contested: null,
      confidence: e?.confidence ?? 'M',
      provenance: { entryIds: [ROLES_GOAL], fields: ['characters[*].classIndex'] },
    };
  };
}

const UNIT_WORDS: Record<GoalInstance['unit'], string> = {
  kills: 'kills',
  copies: 'copies',
  level: 'level',
  items: 'items',
  yesno: '',
};

/** TR-3: one Goal instance as M10's `PurposeLine`. */
export function lineOf(g: GoalInstance, kb: CompiledKnowledge, stopHere: boolean): PurposeLine {
  const entry = kb.entries[g.contributionId];
  const time = (e: GoalInstance['eta'] | null) => (e?.kind === 'time' ? e.seconds : null);
  const ladder =
    g.unit === 'yesno'
      ? null
      : {
          unit: UNIT_WORDS[g.unit],
          reached: g.reached,
          current: g.projected,
          projected:
            g.projected !== g.saved ||
            g.contributionId.startsWith('upgrade-vault.') ||
            g.contributionId.startsWith('death-note.'),
          next: g.next,
          nextEtaSeconds: time(g.eta),
          later: g.following,
          laterEtaSeconds: time(g.etaFollowing),
          mean: g.eta.kind === 'time' && g.eta.bound === 'mean-at-base-rate',
        };
  return {
    goalId: g.goalId,
    title: entry?.title ?? g.goalId,
    worthwhile: g.worthwhile,
    milestone:
      g.unit === 'yesno' || g.next === null
        ? null
        : { unit: UNIT_WORDS[g.unit], current: g.projected, next: g.next, etaSeconds: time(g.eta), stopHere },
    badges: g.badges,
    sources: sourcesOf(entry),
    provenance: g.provenance,
    text: g.text.headline,
    detail: g.text.detail,
    ladder,
  };
}

/** D4: the stop-here suggestion as one Goal with one Next Action, keyed per Milestone (TR-8). */
function stopHereGoal(p: Purpose, run: PurposeRun, kb: CompiledKnowledge): Goal | null {
  const s = p.stopHere;
  if (!s) return null;
  const entry = kb.entries[s.contributionId];
  const g = p.goals.find((x) => x.contributionId === s.contributionId);
  if (entry?.type !== 'contribution' || !entry.stopHere || !g) return null;
  const slots = run.slotsOf.get(`${s.contributionId}@${p.characterIndex}`) ?? {};
  const text = render(
    entry.stopHere,
    {
      at: countText(s.at),
      later: countText(s.following),
      etaText: s.etaAt.kind === 'time' ? etaWords(s.etaAt.seconds) : '',
      laterEtaText: s.etaFollowing.kind === 'time' ? etaWords(s.etaFollowing.seconds) : '',
      now: countText(g.projected),
    },
    slots,
    entry.values,
  );
  const subject: Subject = `c${p.characterIndex}`;
  return {
    id: s.goalId,
    title: entry.title,
    system: entry.system,
    category: 'nice',
    nextAction: {
      key: `${s.contributionId}@${subject}#${s.at}`,
      entryId: s.contributionId,
      text,
      why: render(entry.why, slots, entry.values),
      sources: sourcesOf(entry),
      stale: g.badges.includes('stale'),
      contested: null,
      confidence: entry.confidence,
      provenance: s.provenance,
    },
    milestone: {
      unit: UNIT_WORDS[g.unit],
      current: g.projected,
      next: s.at,
      etaSeconds: s.etaAt.kind === 'time' ? s.etaAt.seconds : null,
      stopHere: true,
    },
  };
}

/** FR-12: "Reached 10k Poop kills: Dirty Money step 4", for the whole Play Session. */
function crossingDone(p: Purpose, run: PurposeRun, kb: CompiledKnowledge, at: number): Done[] {
  return p.reached.map((x) => {
    const goal = kb.entries[x.goalId] as GoalEntry | undefined;
    const g = p.goals.find((y) => y.goalId === x.goalId);
    const slots = g ? (run.slotsOf.get(`${g.contributionId}@${p.characterIndex}`) ?? {}) : {};
    const target =
      typeof slots.target === 'string' && slots.target ? `${slots.target.replace(/_/g, ' ')} ` : '';
    const what =
      goal?.unit === 'level'
        ? `${goal.title.toLowerCase()} ${x.milestone}`
        : `${countText(x.milestone)} ${target}${goal?.unit ?? ''}`;
    const reward = goal?.milestones?.find((m) => m.at === x.milestone)?.reward;
    return {
      key: `${x.goalId}@c${p.characterIndex}#reached-${x.milestone}`,
      text: `Reached ${what.trim()}${reward ? `: ${reward}` : ''}`,
      confirmedAt: at,
    };
  });
}

export function createPurposeModule(deps: PurposeModuleDeps): EngineModule {
  return {
    id: 'purpose',
    covers: [],
    dependsOnExpectedReturn: true,
    affectsVerdict: false,
    run(input: EngineInput): ModuleOutput {
      const run = purposesFor(input, deps);
      if (!run.meta) return {};
      const at = input.state.account.lastCloudSave ?? input.state.asOf;
      const unknownFindings: UnknownFinding[] = run.diagnostics
        // A Goal skipped for want of M5's sweep is not an unknown field (TR-6).
        .filter((d) => d.characterIndex !== null && !d.message.includes('M5'))
        .map((d) => ({
          entryId: d.entryId,
          subject: `c${d.characterIndex}` as Subject,
          reason: 'field-missing',
        }));
      return {
        characters: run.purposes.map((p) => {
          const stop = stopHereGoal(p, run, deps.kb);
          return {
            index: p.characterIndex,
            purpose: p.goals.map((g) => lineOf(g, deps.kb, stop !== null && p.stopHere?.goalId === g.goalId)),
            purposeStatus: p.status,
            purposeNote: p.prompt?.reason.headline ?? null,
            ...(stop ? { goals: [{ goal: stop, rank: { rankAs: p.stopHere?.goalId ?? stop.id } }] } : {}),
            doneThisSession: crossingDone(p, run, deps.kb, at),
          };
        }),
        unknownFindings: [...new Map(unknownFindings.map((u) => [`${u.entryId}@${u.subject}`, u])).values()],
      };
    },
  };
}
