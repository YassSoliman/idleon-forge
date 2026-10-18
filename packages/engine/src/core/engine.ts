// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The engine core (M10 §2, TR-6): runs every registered module with per-module error isolation,
// merges their output per subject, ranks with M2's comparator, dedupes, computes Visit Order and
// assembles `EngineResult`. It decides no advice: until M2–M9 register, every Verdict is Unknown
// `not-covered` and "Not covered yet" carries AFK safety (M10 §6, "Nothing covered yet").
//
// The Expected Return split (TR-6): `run` keeps the output of modules that don't depend on Expected
// Return, so `rerun` re-runs only the dependent ones (M3's Verdicts, firstFill, M6 urgencies) and
// re-assembles, including Visit Order.

import { STAGES, type StageId } from '@idleon-forge/knowledge';
import { behindAnalysis } from '../metapath/behind';
import { lookupOf } from '../metapath/knowledge';
import { metaPathModule } from '../metapath/module';
import { EMPTY_PRIORITY_LIST } from '../metapath/priority';
import type {
  CharacterResult,
  Done,
  EngineResult,
  FailedDetector,
  Fill,
  NotCoveredItem,
  Verdict,
} from '../result';
import { classFamilies } from './families';
import { activityLabel, classLabel, mapLabel } from './labels';
import type { EngineHistory, EngineInput, EngineModule, ModuleOutput } from './module';
import { rankGoals, type TaggedGoal } from './rank';
import { systemSummaries } from './systems';
import { visitOrder } from './visit-order';

/** The System M3 covers; listed under "Not covered yet" until a module covers AFK safety. */
export const AFK_SAFETY_NOT_COVERED: NotCoveredItem = { systemId: 'afk', label: 'AFK safety' };
/** The Stage before M2 ships (no "Can't tell where your account is" banner: that is id 'unknown'). */
export const STAGE_NOT_COVERED: EngineResult['stage'] = { id: 'not-covered', label: 'Stage not covered yet' };

/** Modules register here as they ship (M2–M9). */
export const DEFAULT_MODULES: readonly EngineModule[] = [metaPathModule];

export interface Engine {
  run(input: EngineInput): EngineResult;
  /** Re-runs only the Expected-Return-dependent modules on the last input (TR-6). */
  rerun(expectedReturnSeconds: number): EngineResult;
  /** Whether `run` has been called (a rerun needs a parsed state). */
  readonly ready: boolean;
}

interface Ran {
  module: EngineModule;
  output: ModuleOutput | null;
  failure: FailedDetector | null;
}

function runModule(module: EngineModule, input: EngineInput, prior?: EngineResult): Ran {
  try {
    return { module, output: module.run(input, prior), failure: null };
  } catch (err) {
    return {
      module,
      output: null,
      failure: {
        detectorId: `${module.id}/module`,
        entryIds: [],
        message: err instanceof Error ? `${err.name}: ${err.message}` : 'unknown error',
      },
    };
  }
}

const NOT_COVERED_VERDICT: Verdict = {
  kind: 'unknown',
  blockerKeys: [],
  unknownReason: 'not-covered',
  suggestion: null,
};
const CANNOT_TELL_VERDICT: Verdict = {
  kind: 'unknown',
  blockerKeys: [],
  unknownReason: 'cannot-tell',
  suggestion: null,
};

const earliest = (fills: (Fill | null | undefined)[]): Fill | null =>
  fills.reduce<Fill | null>((best, f) => (f && (best === null || f.at < best.at) ? f : best), null);

const STAGES_KNOWN: ReadonlySet<string> = new Set(STAGES);

/**
 * M15 FR-26: characters first seen in the current Play Session (absent from the last save before it).
 * Without history from before the session nobody is new.
 */
export function newThisSession(
  history: EngineHistory,
  state: Pick<EngineInput['state'], 'characters'>,
): Set<number> {
  const start = history.sessionStartedAt;
  if (start === null) return new Set();
  const before = history.entries.filter((e) => e.lastCloudSave < start).at(-1);
  if (!before) return new Set();
  const had = new Set(before.state.characters.map((c) => c.index));
  return new Set(state.characters.filter((c) => !had.has(c.index)).map((c) => c.index));
}

const byConfirmed = (a: Done, b: Done) => a.confirmedAt - b.confirmedAt || (a.key < b.key ? -1 : 1);

export function assemble(input: EngineInput, ran: readonly Ran[]): EngineResult {
  const { state, history, knowledge, options } = input;
  const outputs = ran.flatMap((r) => (r.output ? [{ module: r.module, output: r.output }] : []));
  const failures = ran.flatMap((r) => (r.failure ? [r.failure] : []));
  const blockerFailure = ran.some((r) => r.failure && r.module.affectsVerdict);
  const verdictModule = ran.some((r) => r.module.covers.includes('verdict'));
  const afkCovered = ran.some((r) => r.module.covers.includes('afk-safety') && r.output !== null);

  const list = outputs.find((o) => o.output.priorityList)?.output.priorityList ?? EMPTY_PRIORITY_LIST;
  const stage = outputs.find((o) => o.output.stage)?.output.stage ?? STAGE_NOT_COVERED;
  const spendPlan = outputs.find((o) => o.output.account?.spendPlan)?.output.account?.spendPlan ?? null;
  const lastPlayed = state.lastPlayedCharacterIndex;
  const taggedOf = new Map<number, TaggedGoal[]>();

  const characters: CharacterResult[] = state.characters.map((c) => {
    const parts = outputs.flatMap(({ module, output }) =>
      (output.characters ?? []).filter((x) => x.index === c.index).map((x) => ({ module, x })),
    );
    const tagged: TaggedGoal[] = parts.flatMap(({ module, x }) =>
      (x.goals ?? []).map((g) => ({ ...g, moduleId: module.id })),
    );
    taggedOf.set(c.index, tagged);
    const given = parts.find((p) => p.x.verdict)?.x.verdict;
    const verdict: Verdict = blockerFailure
      ? CANNOT_TELL_VERDICT
      : (given ?? (verdictModule ? CANNOT_TELL_VERDICT : NOT_COVERED_VERDICT));
    const chip = spendPlan?.perCharacter.find((p) => p.characterIndex === c.index);
    return {
      index: c.index,
      name: c.name,
      classId: c.class,
      classLabel: classLabel(c),
      level: c.level,
      activityLabel: activityLabel(c),
      mapLabel: mapLabel(c),
      isPlaying: lastPlayed !== null && c.index === lastPlayed,
      verdict,
      purpose: parts.flatMap(({ x }) => x.purpose ?? []),
      ...(() => {
        const p = parts.find(({ x }) => x.purposeStatus !== undefined)?.x;
        return p ? { purposeStatus: p.purposeStatus, purposeNote: p.purposeNote ?? null } : {};
      })(),
      // Ranked below, after M15 F5's Behind step (TR-9) may move some of them to the Account section.
      goals: [],
      higherLeverage: parts.find((p) => p.x.higherLeverage)?.x.higherLeverage ?? null,
      spendChip: chip && chip.lines > 0 ? { lines: chip.lines, coins: chip.coins } : null,
      activePlay: parts.flatMap(({ x }) => x.activePlay ?? []),
      doneThisSession: parts.flatMap(({ x }) => x.doneThisSession ?? []).sort(byConfirmed),
      firstFill: earliest(parts.map(({ x }) => x.firstFill)),
      info: parts.flatMap(({ x }) => x.info ?? []),
    };
  });

  // A character the save has but the parser couldn't read is an Unknown row in its slot, never
  // dropped (M1 FR-19b): "can't tell from the save".
  for (const index of state.diagnostics.unreadableCharacters) {
    if (characters.some((c) => c.index === index)) continue;
    characters.push({
      index,
      name: `Character ${index + 1}`,
      classId: '',
      classLabel: 'Unknown class',
      level: 0,
      activityLabel: "Couldn't be read",
      mapLabel: null,
      isPlaying: false,
      verdict: CANNOT_TELL_VERDICT,
      purpose: [],
      goals: [],
      higherLeverage: null,
      spendChip: null,
      activePlay: [],
      doneThisSession: [],
      firstFill: null,
    });
  }
  characters.sort((a, b) => a.index - b.index);

  const accountTagged: TaggedGoal[] = outputs.flatMap(({ module, output }) =>
    (output.account?.goals ?? []).map((g) => ({ ...g, moduleId: module.id })),
  );
  const givenSafety = outputs.find((o) => o.output.account?.safety)?.output.account?.safety;
  const safety: EngineResult['account']['safety'] = blockerFailure
    ? 'unknown'
    : (givenSafety ?? (afkCovered ? 'unknown' : 'not-covered'));

  const toSpend = new Map<number, number>();
  for (const { output } of outputs)
    for (const x of output.characters ?? [])
      toSpend.set(x.index, (toSpend.get(x.index) ?? 0) + (x.spendCount ?? 0));
  for (const p of spendPlan?.perCharacter ?? [])
    toSpend.set(p.characterIndex, (toSpend.get(p.characterIndex) ?? 0) + p.lines);
  const order = visitOrder(
    characters.map((c) => ({
      index: c.index,
      level: c.level,
      verdict: c.verdict.kind,
      toSpend: toSpend.get(c.index) ?? 0,
    })),
    outputs.flatMap(({ output }) => output.visitHints ?? []),
  );

  // M15 F5 (TR-9): after every module's findings and before the ranking, the weakest System's fix
  // findings move into one Behind Goal in the Account section (FR-29, D-6). Not on an account past the
  // covered Stages (M2 `frameOnly`, P2): the table is calibrated for W1 to W4.
  const kb = knowledge.kb;
  const analysis =
    kb && STAGES_KNOWN.has(stage.id) && !list.frameOnly
      ? behindAnalysis({
          kb: lookupOf(kb),
          stage: stage.id as StageId,
          list,
          characters: state.characters.map((c) => ({
            index: c.index,
            level: c.level,
            label: `${classLabel(c)} Lv ${c.level}`,
            goals: taggedOf.get(c.index) ?? [],
          })),
          account: accountTagged,
          visitOrder: order,
          newCharacters: newThisSession(history, state),
          unknownEntries: new Set(failures.flatMap((f) => f.entryIds)),
        })
      : null;
  const behind = analysis?.result ?? null;
  const kept = (gs: readonly TaggedGoal[]) => (behind ? gs.filter((g) => !behind.moved.has(g)) : [...gs]);
  for (const c of characters) c.goals = rankGoals(kept(taggedOf.get(c.index) ?? []), list);
  const accountGoals = rankGoals([...kept(accountTagged), ...(behind ? [behind.goal] : [])], list);
  const blockerSet = new Set(outputs.flatMap(({ output }) => output.account?.blockerKeys ?? []));
  const blockerKeys = accountGoals
    .filter((g) => g.category === 'blocker' && blockerSet.has(g.nextAction.key))
    .map((g) => g.nextAction.key);

  const notCovered: NotCoveredItem[] = [];
  const seen = new Set<string>();
  const addGap = (item: NotCoveredItem) => {
    if (seen.has(item.systemId)) return;
    seen.add(item.systemId);
    notCovered.push(item);
  };
  if (!afkCovered) addGap(AFK_SAFETY_NOT_COVERED);
  for (const item of knowledge.coverage(state)) addGap(item);
  for (const { output } of outputs) for (const item of output.notCovered ?? []) addGap(item);

  // M14 FR-23: a Walkthrough rides on its parent Goal's card, once per parent.
  const views = new Map(
    outputs.flatMap(({ output }) => (output.walkthroughs ?? []).map((w) => [w.parentKey, w.view] as const)),
  );
  if (views.size > 0) {
    const attach = (goals: EngineResult['account']['goals']) =>
      goals.map((g) => {
        const view = views.get(g.nextAction.key);
        return view ? { ...g, walkthrough: view } : g;
      });
    for (const c of characters) c.goals = attach(c.goals);
    accountGoals.splice(0, accountGoals.length, ...attach(accountGoals));
  }

  // M19 X3, X4: details an after-step adds to another module's Goal (never its text).
  const notes = new Map<string, EngineResult['account']['goals'][number]['details']>();
  for (const { output } of outputs)
    for (const n of output.goalNotes ?? []) notes.set(n.key, [...(notes.get(n.key) ?? []), ...n.details]);
  if (notes.size > 0) {
    const add = (goals: EngineResult['account']['goals']) =>
      goals.map((g) => {
        const more = notes.get(g.nextAction.key);
        return more?.length ? { ...g, details: [...(g.details ?? []), ...more] } : g;
      });
    for (const c of characters) c.goals = add(c.goals);
    accountGoals.splice(0, accountGoals.length, ...add(accountGoals));
  }

  // M17 TR-2: Checks that couldn't tell, for the hub's "Can't tell" (subjects of absent characters drop).
  const present = new Set(characters.map((c) => `c${c.index}`));
  const unknownFindings = outputs
    .flatMap(({ output }) => output.unknownFindings ?? [])
    .filter((u) => u.subject === 'account' || present.has(u.subject))
    .sort((a, b) =>
      a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : a.subject < b.subject ? -1 : 1,
    );

  // M17 TR-2: the modules' Timeline bars, sorted by subject (characters by index, then the account),
  // then `at` (nulls first), then barId; bars of absent characters drop.
  const subjectRank = (s: string) => (s === 'account' ? Number.MAX_SAFE_INTEGER : Number(s.slice(1)));
  const timeline = outputs
    .flatMap(({ output }) => output.timeline ?? [])
    .filter((b) => b.subject === 'account' || present.has(b.subject))
    .sort(
      (a, b) =>
        subjectRank(a.subject) - subjectRank(b.subject) ||
        (a.at === null ? (b.at === null ? 0 : -1) : b.at === null ? 1 : a.at - b.at) ||
        (a.barId < b.barId ? -1 : a.barId > b.barId ? 1 : 0),
    );
  const returnAt = outputs.find((o) => o.output.returnAt !== undefined)?.output.returnAt;

  const result: EngineResult = {
    asOf: state.asOf,
    lastPlayedCharacterIndex: lastPlayed,
    sessionStartedAt: history.sessionStartedAt,
    expectedReturn: {
      usedSeconds: options.expectedReturnSeconds,
      learnedSeconds: history.learnedExpectedReturnSeconds,
    },
    stage,
    characters,
    visitOrder: order,
    account: {
      goals: accountGoals,
      blockerKeys,
      safety,
      spendPlan,
      activePlay: outputs.flatMap(({ output }) => output.account?.activePlay ?? []),
      doneThisSession: outputs
        .flatMap(({ output }) => output.account?.doneThisSession ?? [])
        .sort(byConfirmed),
    },
    firstFill: earliest([
      ...characters.map((c) => c.firstFill),
      ...outputs.map(({ output }) => output.firstFill),
    ]),
    alreadyFull: outputs.reduce((n, { output }) => n + (output.alreadyFull ?? 0), 0),
    higherLeverageStatus:
      outputs.find((o) => o.output.higherLeverageStatus)?.output.higherLeverageStatus ?? 'ok',
    notCovered,
    versions: {
      knowledge: knowledge.version,
      gameBuild: state.account.gameVersion.serverBuild,
      parserTarget: state.account.gameVersion.parserTarget,
      parserBehind: false,
    },
    diagnostics: { failedDetectors: failures },
    ...buildsOf(outputs),
    ...(() => {
      const cards = outputs.find((o) => o.output.cards)?.output.cards;
      return cards ? { cards } : {};
    })(),
    ...(analysis ? { behindSystems: analysis.rows } : {}),
    ...(outputs.some(({ output }) => output.unknownFindings) ? { unknownFindings } : {}),
    ...(() => {
      const o = outputs.find((x) => x.output.starSigns !== undefined)?.output;
      return o ? { starSigns: o.starSigns ?? null } : {};
    })(),
    ...(outputs.some(({ output }) => output.timeline) ? { timeline } : {}),
    ...(returnAt !== undefined ? { returnAt } : {}),
    // M18: the Gear tab, heat strip and Smithy cards ride through untouched.
    ...(() => {
      const o = outputs.find((x) => x.output.gear !== undefined)?.output;
      return o ? { gear: o.gear ?? null } : {};
    })(),
    // M20: the checklist, Skills tabs, pictures and Skill Grid ride through untouched.
    ...(() => {
      const pick = <K extends 'checklist' | 'skills' | 'slotPictures' | 'skillGrid'>(k: K) =>
        outputs.find((o) => o.output[k] !== undefined)?.output[k];
      const checklist = pick('checklist');
      const skills = pick('skills');
      // M21 TR-10: M20's pictures and area S's `pictures` module both emit these; concatenated in module
      // order, so M20's come first (orchestrator-approved F-frozen edit).
      const slotPictures = outputs.some((o) => o.output.slotPictures !== undefined)
        ? outputs.flatMap((o) => o.output.slotPictures ?? [])
        : undefined;
      const skillGrid = pick('skillGrid');
      const alchemy = outputs.find((o) => o.output.alchemy !== undefined)?.output.alchemy;
      return {
        ...(alchemy !== undefined ? { alchemy } : {}),
        ...(checklist !== undefined ? { checklist } : {}),
        ...(skills !== undefined ? { skills } : {}),
        ...(slotPictures !== undefined ? { slotPictures } : {}),
        ...(skillGrid !== undefined ? { skillGrid } : {}),
      };
    })(),
    // M21 TR-9, TR-11: the Map and Play Session facts ride through untouched (stubs emit null in F).
    ...(() => {
      const session = outputs.find((o) => o.output.session !== undefined)?.output.session;
      const map = outputs.find((o) => o.output.map !== undefined)?.output.map;
      return {
        ...(session !== undefined ? { session } : {}),
        ...(map !== undefined ? { map } : {}),
      };
    })(),
    // M21 FR-F4: the who-glyph families, read here so the UI never imports the Knowledge Base.
    ...(kb ? { classFamilies: classFamilies(lookupOf(kb), state.characters) } : {}),
  };
  // M17 TR-2: the registry with unlock states, built here in the worker (it runs unlock Detectors).
  if (kb && knowledge.registries)
    result.systems = systemSummaries({ state, kb, registries: knowledge.registries, now: input.now }, result);
  return result;
}

/** M9's Build roadmaps ride through untouched (the Build view); absent when no module emits them. */
function buildsOf(
  outputs: readonly { output: ModuleOutput }[],
): Pick<EngineResult, 'builds' | 'nextCharacter'> {
  const builds = outputs.find((o) => o.output.builds)?.output.builds;
  // M21 (area C): the next character card rides with the roadmaps.
  const next = outputs.find((o) => o.output.nextCharacter !== undefined)?.output.nextCharacter;
  return { ...(builds ? { builds } : {}), ...(next !== undefined ? { nextCharacter: next } : {}) };
}

/** One engine per worker: it keeps the last input and the Expected-Return-independent output. */
export function createEngine(modules: readonly EngineModule[] = DEFAULT_MODULES): Engine {
  let last: { input: EngineInput; stable: Ran[] } | null = null;
  const first = modules.filter((m) => !m.after);
  const later = modules.filter((m) => m.after);
  const dependent = (input: EngineInput) =>
    first.filter((m) => m.dependsOnExpectedReturn).map((m) => runModule(m, input));
  const ordered = (ran: Ran[]) => first.map((m) => ran.find((r) => r.module === m) as Ran);
  // M14 TR-1: engine steps that read the other modules' assembled result run last, on that result.
  const finish = (input: EngineInput, ran: Ran[]) => {
    if (later.length === 0) return assemble(input, ran);
    const prior = assemble(input, ran);
    return assemble(input, [...ran, ...later.map((m) => runModule(m, input, prior))]);
  };
  return {
    get ready() {
      return last !== null;
    },
    run(input) {
      const stable = first.filter((m) => !m.dependsOnExpectedReturn).map((m) => runModule(m, input));
      last = { input, stable };
      return finish(input, ordered([...stable, ...dependent(input)]));
    },
    rerun(expectedReturnSeconds) {
      if (!last) throw new Error('The engine has no parsed save to re-run.');
      const input = { ...last.input, options: { ...last.input.options, expectedReturnSeconds } };
      last = { input, stable: last.stable };
      return finish(input, ordered([...last.stable, ...dependent(input)]));
    },
  };
}

/** One-shot run (goldens, tests). */
export const runEngine = (input: EngineInput, modules: readonly EngineModule[] = DEFAULT_MODULES) =>
  createEngine(modules).run(input);
