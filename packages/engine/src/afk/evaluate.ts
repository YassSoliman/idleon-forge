// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `evaluateAfkSafety` (M3 TR-3): runs every AFK-safety Check entry's Detector, applies the blocker rule
// (FR-7), gives each character and the account a Safety (FR-8), orders blockers (FR-10) and finds the
// first fill (FR-11). Pure: the clock, the Expected Return and the history are inputs, and the same
// inputs give byte-identical output (FR-31). No Toolbox import: the facts come from the Account State.
import { type AccountState, humanize } from '@idleon-forge/account-state';
import {
  type CheckFinding,
  type CompiledKnowledge,
  type DetectorRegistry,
  type Entry,
  findDetector,
  type HistoryEntry,
  isStale,
  type Subject as KbSubject,
  makeContext,
  render,
  runDetector,
  type SlotValue,
  type SourceT,
  type StageId,
  stagesBetween,
} from '@idleon-forge/knowledge';
import { BUILDS_DETECTORS } from '../builds/detectors';
import { returnAtOf } from './expected-return';
import type {
  AfkSafetyResult,
  CapPill,
  DemotedBecause,
  ExpectedReturn,
  Fill,
  NextAction,
  Safety,
  SafetyFinding,
  SourceRef,
  StageLike,
  Subject,
  SubjectResult,
} from './types';

type CheckEntry = Extract<Entry, { type: 'check' }>;

/**
 * M3's Check entries (TR-5). Every other check entry with `effect: blocker` (for example M9's preset
 * Check) also goes through this pipeline and the same blocker rule (TR-3).
 */
export const AFK_SAFETY_ENTRIES: readonly string[] = [
  'afk.check.no-afk-target',
  'afk.check.dies-fixable-by-food',
  'afk.check.health-food-runs-out',
  'afk.check.low-food-untimed',
  'afk.check.skiller-carry',
  'anvil.check.caps-before-return',
  'worship.check.charge-caps-skull',
  'worship.check.charge-caps-no-skull',
  'trapping.check.slots-and-timers',
  'trapping.check.finishes-early',
  'alchemy.check.cauldron-unassigned',
  'alchemy.check.liquid-cap',
  'arcade.check.balls-cap',
  'refinery.check.fuel-runs-out',
];

/** The engine Detectors behind other modules' blocker Checks (M9 TR-8: wrong preset, 0 attacks). */
export const BLOCKER_ENGINE_DETECTORS: DetectorRegistry = BUILDS_DETECTORS;

/** Present-state Checks rank before stockpile Checks on a tie (FR-10, and section 6 "two fixes that conflict"). */
const PRESENT_STATE = new Set([
  'afk.check.no-afk-target',
  'afk.check.dies-fixable-by-food',
  'afk.check.skiller-carry',
  'alchemy.check.cauldron-unassigned',
  'trapping.check.slots-and-timers',
]);

/** AFK Targets M3 has no Checks for yet (W4): a character on one is `not-covered`, never Ready (FR-8, RT-9). */
export const NOT_COVERED_AFK_TYPES: ReadonlySet<string> = new Set(['LABORATORY', 'COOKING']);

export interface AfkSafetyInput {
  state: AccountState;
  history: readonly HistoryEntry[];
  /** The skew-corrected clock (TR-7). */
  now: number;
  expectedReturn: ExpectedReturn;
  kb: Pick<CompiledKnowledge, 'entries' | 'facts' | 'byType' | 'patches'>;
  /** The Knowledge Base Detector registry (`@idleon-forge/knowledge/detectors`). */
  registry: DetectorRegistry;
  /**
   * Engine Detectors behind other modules' `effect: blocker` Checks, looked up after `registry`. They
   * return M11 CheckFindings, so the blocker rule treats them like M3's own. Default: M9's `builds/*`.
   */
  engineRegistry?: DetectorRegistry;
  /** M2's StageResult (its id). Without a Stage, `appliesTo.stages` is not filtered. */
  stage?: StageLike | null;
}

const subjectKey = (s: KbSubject): Subject => (s.kind === 'account' ? 'account' : `c${s.index}`);

export const sourceRef = (s: SourceT): SourceRef => ({
  label: s.title,
  url: s.url,
  tier: s.tier,
  verifiedOn: s.verified,
  ...(s.claimDate ? { claimDate: s.claimDate } : {}),
  gameVersion: s.gameVersion,
});

function stageApplies(entry: CheckEntry, stage: StageId | null): boolean {
  const stages = entry.appliesTo.stages;
  if (stages === 'all' || stage === null) return true;
  return stages.some((x) =>
    typeof x === 'string' ? x === stage : stagesBetween(x.from, x.to).includes(stage),
  );
}

function characterApplies(entry: CheckEntry, cls: string, level: number): boolean {
  const { classes, levels } = entry.appliesTo;
  // Exact class names: no M3 entry restricts classes. Match promotions (classes.fact.class-tree) when one does.
  if (classes && !classes.includes(cls)) return false;
  if (levels?.min !== undefined && level < levels.min) return false;
  if (levels?.max !== undefined && level > levels.max) return false;
  return true;
}

interface Raw {
  entry: CheckEntry;
  subject: Subject;
  finding: CheckFinding;
}

/** The blocker rule (FR-7), with Final rulings RT-14's already-full exception. */
export function classify(
  entry: Pick<CheckEntry, 'effect' | 'status'>,
  f: Extract<CheckFinding, { result: 'fires' }>,
  now: number,
): { role: 'blocker' | 'next-action'; fixHolds: boolean; demotedBecause: DemotedBecause | null } {
  const fixHolds = f.fixHolds !== false;
  if (entry.effect === 'next-action')
    return { role: 'next-action', fixHolds, demotedBecause: 'effect-next-action' };
  // A Contested Check never blocks (M11 FR-6).
  if (entry.status === 'contested') return { role: 'next-action', fixHolds, demotedBecause: 'not-quick' };
  // (a) quick and (b) fillable are the Detector's call.
  const demoted = f.demotedBecause ?? null;
  if (demoted === 'not-quick' || demoted === 'not-fillable')
    return { role: 'next-action', fixHolds, demotedBecause: demoted };
  // (c) the fix holds for the whole stretch, except when the cap is already full now (RT-14).
  const alreadyBiting = f.at !== undefined && f.at <= now;
  if (!fixHolds && !alreadyBiting)
    return { role: 'next-action', fixHolds, demotedBecause: 'fix-does-not-hold' };
  return { role: 'blocker', fixHolds, demotedBecause: null };
}

export function characterBuiltins(state: AccountState, subject: Subject): Record<string, SlotValue> {
  if (subject === 'account') return {};
  const c = state.characters.find((x) => `c${x.index}` === subject);
  if (!c) return {};
  // Class and level only: a name never goes into advice text (privacy, red-team note 8).
  return { class: humanize(c.class), level: c.level, character: `${humanize(c.class)} Lv ${c.level}` };
}

/**
 * The entry's text, or one of its authored variants: `values['text-stock-up']` applies when the
 * finding's `stockUp` slot is 1 (M3 R-FOOD-1), and so on for any `text-<kebab-name>` / `<camelName>`
 * pair. Every word stays in the entry; the Detector only picks which of its texts applies.
 */
export function textOf(entry: Pick<CheckEntry, 'text' | 'values'>, slots: Record<string, SlotValue>): string {
  for (const [key, template] of Object.entries(entry.values)) {
    if (!key.startsWith('text-') || typeof template !== 'string') continue;
    const flag = key.slice(5).replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
    if (slots[flag] === 1) return template;
  }
  return entry.text;
}

function nextActionOf(
  entry: CheckEntry,
  subject: Subject,
  slots: Record<string, SlotValue>,
  state: AccountState,
  stale: boolean,
  fields: string[],
): NextAction {
  const scopes = [slots, characterBuiltins(state, subject), entry.values];
  return {
    key: `${entry.id}@${subject}`,
    entryId: entry.id,
    text: render(textOf(entry, slots), ...scopes),
    why: render(entry.why, ...scopes),
    sources: entry.sources.map(sourceRef),
    stale,
    contested: null,
    confidence: entry.confidence,
    provenance: { entryIds: [entry.id], fields },
  };
}

/** FR-10: already biting first, then earliest `at`; ties present-state first; then entry id. */
function compareFindings(now: number) {
  const atOf = (f: SafetyFinding) => f.at ?? now;
  return (a: SafetyFinding, b: SafetyFinding) => {
    if (a.role !== b.role) return a.role === 'blocker' ? -1 : 1;
    const biteA = atOf(a) <= now ? 0 : 1;
    const biteB = atOf(b) <= now ? 0 : 1;
    if (biteA !== biteB) return biteA - biteB;
    if (atOf(a) !== atOf(b)) return atOf(a) - atOf(b);
    const pa = PRESENT_STATE.has(a.entryId) ? 0 : 1;
    const pb = PRESENT_STATE.has(b.entryId) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (a.nextAction.stale !== b.nextAction.stale) return a.nextAction.stale ? 1 : -1;
    return a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : 0;
  };
}

function fillLabel(entry: CheckEntry, state: AccountState, subject: Subject): string {
  const what = typeof entry.values.fill === 'string' ? entry.values.fill : entry.title;
  if (subject === 'account') return what;
  const c = state.characters.find((x) => `c${x.index}` === subject);
  return c ? `${humanize(c.class)} Lv ${c.level}'s ${what}` : what;
}

/**
 * R-PILL-1 (M3 Final rulings, 2026-10-17): an entry whose `values.pill` is set is a quick-collect cap.
 * Full now it shows `values.pill` ("Anvil full · collect"); filling before the return it shows
 * `values.pill-soon` ("Anvil full in about 3 h · collect"), rendered with the finding's slots.
 */
function pillOf(
  entry: CheckEntry,
  subject: Subject,
  finding: Extract<CheckFinding, { result: 'fires' }>,
  state: AccountState,
  now: number,
): Omit<CapPill, 'nextAction'> | null {
  const full = entry.values.pill;
  if (typeof full !== 'string') return null;
  const at = finding.at ?? null;
  const fullNow = at === null || at <= now;
  const soon = entry.values['pill-soon'];
  const template = !fullNow && typeof soon === 'string' ? soon : full;
  return {
    key: `${entry.id}@${subject}`,
    entryId: entry.id,
    subject,
    at,
    fullNow,
    label: render(template, finding.slots, characterBuiltins(state, subject), entry.values),
  };
}

/** Full now first, then the soonest, then entry id. */
function compareCaps(a: CapPill, b: CapPill): number {
  if (a.fullNow !== b.fullNow) return a.fullNow ? -1 : 1;
  const at = (a.at ?? 0) - (b.at ?? 0);
  if (at !== 0) return at;
  return a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : 0;
}

export function evaluateAfkSafety(input: AfkSafetyInput): AfkSafetyResult {
  const { state, now, expectedReturn, kb, registry } = input;
  const returnAt = returnAtOf(now, expectedReturn);
  const stage = input.stage?.id ?? null;
  const ctx = makeContext(state, kb, {
    now,
    history: input.history,
    expectedReturnMs: expectedReturn.usedMs,
  });
  const gameVersion = state.account.gameVersion.parserTarget;

  const checks = (kb.byType.check ?? [])
    .map((id) => kb.entries[id])
    .filter((e): e is CheckEntry => e?.type === 'check')
    .filter((e) => AFK_SAFETY_ENTRIES.includes(e.id) || e.effect === 'blocker')
    .filter((e) => stageApplies(e, stage))
    .sort((a, b) => (a.id < b.id ? -1 : 1));

  const raws: Raw[] = [];
  const failedDetectors: AfkSafetyResult['failedDetectors'] = [];
  /** Subjects whose blocker Check could not be read (FR-8). */
  const cannotTell = new Set<Subject>();

  for (const entry of checks) {
    const detector = findDetector(
      entry.detector.id,
      registry,
      input.engineRegistry ?? BLOCKER_ENGINE_DETECTORS,
    );
    const run = detector
      ? runDetector(detector, ctx, entry.detector.params)
      : { ok: false as const, error: 'Detector not registered', detectorId: entry.detector.id };
    if (!run.ok) {
      failedDetectors.push({ detectorId: run.detectorId, entryIds: [entry.id], message: run.error });
      if (entry.effect === 'blocker') {
        for (const c of state.characters) if (entry.subject === 'character') cannotTell.add(`c${c.index}`);
        if (entry.subject === 'account') cannotTell.add('account');
      }
      continue;
    }
    for (const finding of run.findings as readonly CheckFinding[]) {
      const subject = subjectKey(finding.subject);
      if (subject !== 'account') {
        const c = state.characters.find((x) => `c${x.index}` === subject);
        if (!c || !characterApplies(entry, c.class, c.level)) continue;
      }
      raws.push({ entry, subject, finding });
    }
  }

  const findingsBy = new Map<Subject, SafetyFinding[]>();
  const capsBy = new Map<Subject, CapPill[]>();
  const fillsBy = new Map<Subject, Fill[]>();
  let alreadyFull = 0;
  const stale = new Set(
    kb.patches.length ? checks.filter((e) => isStale(e, gameVersion, kb.patches)).map((e) => e.id) : [],
  );

  for (const { entry, subject, finding } of raws) {
    if (finding.result === 'unknown') {
      if (entry.effect === 'blocker' && finding.reason !== 'needs-history') cannotTell.add(subject);
      continue;
    }
    if (finding.result === 'pass') {
      if (finding.nextAt !== undefined && finding.nextAt >= returnAt) {
        const list = fillsBy.get(subject) ?? [];
        list.push({ label: fillLabel(entry, state, subject), at: finding.nextAt, subject });
        fillsBy.set(subject, list);
      }
      continue;
    }
    const fields = [
      ...(findDetector(entry.detector.id, input.registry, input.engineRegistry ?? BLOCKER_ENGINE_DETECTORS)
        ?.reads ?? []),
    ];
    // R-PILL-1: a quick-collect cap is a pill, never a Finding, a blocker or a Goal.
    const pill = pillOf(entry, subject, finding, state, now);
    if (pill) {
      const cap: CapPill = {
        ...pill,
        nextAction: nextActionOf(entry, subject, finding.slots, state, stale.has(entry.id), fields),
      };
      if (cap.fullNow) alreadyFull += 1;
      capsBy.set(subject, [...(capsBy.get(subject) ?? []), cap]);
      continue;
    }
    const { role, fixHolds, demotedBecause } = classify(entry, finding, now);
    const f: SafetyFinding = {
      key: `${entry.id}@${subject}`,
      entryId: entry.id,
      subject,
      role,
      at: finding.at ?? null,
      fixHolds,
      demotedBecause,
      nextAction: nextActionOf(entry, subject, finding.slots, state, stale.has(entry.id), fields),
    };
    if (role === 'next-action' && fixHolds && f.at !== null && f.at <= now) alreadyFull += 1;
    const list = findingsBy.get(subject) ?? [];
    list.push(f);
    findingsBy.set(subject, list);
  }

  const order = compareFindings(now);
  const earliest = (fills: Fill[] | undefined): Fill | null =>
    [...(fills ?? [])].sort((a, b) => a.at - b.at || (a.label < b.label ? -1 : 1))[0] ?? null;

  const resultFor = (subject: Subject, notCovered: boolean): SubjectResult => {
    const findings = [...(findingsBy.get(subject) ?? [])].sort(order);
    let safety: Safety = 'safe';
    if (findings.some((f) => f.role === 'blocker')) safety = 'unsafe';
    else if (cannotTell.has(subject)) safety = 'unknown';
    else if (notCovered) safety = 'not-covered';
    const caps = [...(capsBy.get(subject) ?? [])].sort(compareCaps);
    return { safety, findings, caps, firstFill: earliest(fillsBy.get(subject)) };
  };

  const characters = state.characters.map((c) => ({
    index: c.index,
    ...resultFor(`c${c.index}`, c.afkType !== null && NOT_COVERED_AFK_TYPES.has(c.afkType)),
  }));
  const account = resultFor('account', false);
  const firstFill = earliest(
    [...characters.map((c) => c.firstFill), account.firstFill].filter((x): x is Fill => x !== null),
  );
  return { expectedReturn, returnAt, characters, account, firstFill, alreadyFull, failedDetectors };
}
