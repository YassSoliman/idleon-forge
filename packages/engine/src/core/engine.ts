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
import { activityLabel, classLabel, mapLabel } from './labels';
import type { EngineInput, EngineModule, ModuleOutput } from './module';
import { rankGoals, type TaggedGoal } from './rank';
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

function runModule(module: EngineModule, input: EngineInput): Ran {
  try {
    return { module, output: module.run(input), failure: null };
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

  const characters: CharacterResult[] = state.characters.map((c) => {
    const parts = outputs.flatMap(({ module, output }) =>
      (output.characters ?? []).filter((x) => x.index === c.index).map((x) => ({ module, x })),
    );
    const tagged: TaggedGoal[] = parts.flatMap(({ module, x }) =>
      (x.goals ?? []).map((g) => ({ ...g, moduleId: module.id })),
    );
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
      goals: rankGoals(tagged, list),
      higherLeverage: parts.find((p) => p.x.higherLeverage)?.x.higherLeverage ?? null,
      spendChip: chip && chip.lines > 0 ? { lines: chip.lines, coins: chip.coins } : null,
      activePlay: parts.flatMap(({ x }) => x.activePlay ?? []),
      doneThisSession: parts.flatMap(({ x }) => x.doneThisSession ?? []).sort(byConfirmed),
      firstFill: earliest(parts.map(({ x }) => x.firstFill)),
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
  const accountGoals = rankGoals(accountTagged, list);
  const blockerSet = new Set(outputs.flatMap(({ output }) => output.account?.blockerKeys ?? []));
  const blockerKeys = accountGoals
    .filter((g) => g.category === 'blocker' && blockerSet.has(g.nextAction.key))
    .map((g) => g.nextAction.key);
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

  return {
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
  };
}

/** One engine per worker: it keeps the last input and the Expected-Return-independent output. */
export function createEngine(modules: readonly EngineModule[] = DEFAULT_MODULES): Engine {
  let last: { input: EngineInput; stable: Ran[] } | null = null;
  const dependent = (input: EngineInput) =>
    modules.filter((m) => m.dependsOnExpectedReturn).map((m) => runModule(m, input));
  const ordered = (ran: Ran[]) => modules.map((m) => ran.find((r) => r.module === m) as Ran);
  return {
    get ready() {
      return last !== null;
    },
    run(input) {
      const stable = modules.filter((m) => !m.dependsOnExpectedReturn).map((m) => runModule(m, input));
      last = { input, stable };
      return assemble(input, ordered([...stable, ...dependent(input)]));
    },
    rerun(expectedReturnSeconds) {
      if (!last) throw new Error('The engine has no parsed save to re-run.');
      const input = { ...last.input, options: { ...last.input.options, expectedReturnSeconds } };
      last = { input, stable: last.stable };
      return assemble(input, ordered([...last.stable, ...dependent(input)]));
    },
  };
}

/** One-shot run (goldens, tests). */
export const runEngine = (input: EngineInput, modules: readonly EngineModule[] = DEFAULT_MODULES) =>
  createEngine(modules).run(input);
