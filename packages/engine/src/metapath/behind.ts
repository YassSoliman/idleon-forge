// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 F5, Behind for your Stage (docs/specs/M15-account-depth.md FR-26 to FR-32, TR-9, TR-10): the one
// System whose Stage Expectation is furthest behind the account's Stage. The table is our own
// (metapath.metapath.stage-expectations); the idea comes from IdleOn AutoReview's Pinchy rater, cited as
// inspiration only. The engine core calls `behindStep` after every module's findings and before the
// final ranking: the chosen fix's findings move into one account Goal (D-6), whose Next Action is the
// fix's own top Next Action with its urgency, cost and deadline (FR-28, FR-30). Pure and deterministic.
import { type Entry, render, STAGES, type StageId, stageIndex } from '@idleon-forge/knowledge';
import type { TaggedGoal } from '../core/rank';
import { rankableOf } from '../core/rank';
import type { Goal, GoalDetail, SourceRef, Subject } from '../result';
import { compareGoals, rankPosition } from './priority';
import type { FactLookup, ResolvedPriorityList } from './types';

export const BEHIND_ID = 'metapath.goal.behind';
export const EXPECTATIONS_ID = 'metapath.metapath.stage-expectations';
/** FR-26: character findings below this class level never count (a row may set its own). */
export const DEFAULT_MIN_CHARACTER_LEVEL = 30;

export interface StageExpectationRow {
  id: string;
  system: string;
  expectedBy: StageId;
  fix: string;
  when?: { findingField: string; equals: string | number };
  minCharacterLevel?: number;
  why: string;
  sources: Extract<Entry, { type: 'metapath' }>['sources'];
}

/** The table, in its tie-break order; empty when the entry isn't shipped. */
export function stageExpectations(kb: FactLookup): StageExpectationRow[] {
  const e = kb.get(EXPECTATIONS_ID) as Entry | undefined;
  if (!e || !('type' in e) || e.type !== 'metapath' || e.status === 'retired') return [];
  return (e.expectations ?? []) as StageExpectationRow[];
}

export interface BehindCharacter {
  index: number;
  level: number;
  /** "Bowman Lv 54": who the moved line is for (P3), class and level only (TR-12). */
  label: string;
  goals: readonly TaggedGoal[];
}

export interface BehindInput {
  kb: FactLookup;
  stage: StageId | null;
  list: ResolvedPriorityList;
  characters: readonly BehindCharacter[];
  account: readonly TaggedGoal[];
  /** Character indices, first visited first (the tie-break between equal findings, US-5). */
  visitOrder: readonly number[];
  /** Characters first seen in the current Play Session (FR-26: making one never marks the account behind). */
  newCharacters: ReadonlySet<number>;
  /** Entry ids whose Detector failed this run: their rows are skipped, never read as met (FR-31). */
  unknownEntries: ReadonlySet<string>;
}

export interface BehindResult {
  row: StageExpectationRow;
  /** The Behind Goal, ranked like its fix (FR-30). */
  goal: TaggedGoal;
  /** The fix's findings it took over (FR-29): the core drops them from their rows. */
  moved: ReadonlySet<TaggedGoal>;
}

interface Finding {
  g: TaggedGoal;
  subject: Subject;
  label: string | null;
}

/** FR-26: rows strictly earlier than the account's Stage; the current Stage and later are on-path work. */
export function behindRows(
  rows: readonly StageExpectationRow[],
  stage: StageId | null,
): StageExpectationRow[] {
  if (stage === null || !(STAGES as readonly string[]).includes(stage)) return [];
  return rows.filter((r) => stageIndex(r.expectedBy) < stageIndex(stage));
}

const sourceRefs = (e: Pick<StageExpectationRow, 'sources'>): SourceRef[] =>
  e.sources.map((s) => ({
    label: s.title,
    url: s.url,
    tier: s.tier,
    verifiedOn: s.verified,
    ...(s.claimDate ? { claimDate: s.claimDate } : {}),
    gameVersion: s.gameVersion,
  }));

function findingsOf(row: StageExpectationRow, input: BehindInput): Finding[] {
  const min = row.minCharacterLevel ?? DEFAULT_MIN_CHARACTER_LEVEL;
  const counts = new Map(
    input.characters.map((c) => [c.index, c.level >= min && !input.newCharacters.has(c.index)] as const),
  );
  // TR-10 `when`: only findings whose Detector slot equals the value count (F2's `building` is the 3D
  // Printer). The slots ride on the module's Goal (ModuleGoal.slots); a finding without them never counts.
  const when = row.when;
  const isFix = (g: TaggedGoal) =>
    g.goal.nextAction.entryId === row.fix && (!when || g.slots?.[when.findingField] === when.equals);
  const out: Finding[] = [];
  for (const c of input.characters)
    for (const g of c.goals)
      if (isFix(g) && counts.get(c.index)) out.push({ g, subject: `c${c.index}`, label: c.label });
  for (const g of input.account) {
    if (!isFix(g)) continue;
    const details = g.goal.details ?? [];
    const anyCounts =
      details.length === 0 ||
      details.some((d) => d.subject === 'account' || counts.get(Number(d.subject.slice(1))) === true);
    if (anyCounts) out.push({ g, subject: 'account', label: null });
  }
  return out;
}

/** TR-9 step 4: the fix's top finding by the one comparator, then Visit Order, account findings last. */
function sortFindings(fs: Finding[], input: BehindInput): Finding[] {
  const visit = (f: Finding) => {
    if (f.subject === 'account') return Number.POSITIVE_INFINITY;
    const i = input.visitOrder.indexOf(Number(f.subject.slice(1)));
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...fs].sort(
    (a, b) =>
      compareGoals(rankableOf(a.g), rankableOf(b.g), input.list) ||
      visit(a) - visit(b) ||
      (a.g.goal.nextAction.key < b.g.goal.nextAction.key ? -1 : 1),
  );
}

const lineOf = (f: Finding) =>
  f.label ? `${f.label}: ${f.g.goal.nextAction.text}` : f.g.goal.nextAction.text;

/** FR-31: a fix that isn't safe to follow (unknown, Contested, Stale) never carries the Goal. */
function unsafe(row: StageExpectationRow, top: Finding, input: BehindInput): boolean {
  const e = input.kb.get(row.fix) as Entry | undefined;
  return (
    input.unknownEntries.has(row.fix) ||
    (e !== undefined && 'status' in e && e.status === 'contested') ||
    top.g.goal.nextAction.contested !== null ||
    top.g.goal.nextAction.stale
  );
}

/** TR-9: choose the weakest System and build its Goal; null when nothing is behind (no "on track" line). */
export function behindStep(input: BehindInput): BehindResult | null {
  const entry = input.kb.get(BEHIND_ID) as Entry | undefined;
  if (!entry || !('type' in entry) || entry.type !== 'goal') return null;
  const rows = behindRows(stageExpectations(input.kb), input.stage);
  const candidates: { row: StageExpectationRow; order: number; findings: Finding[] }[] = [];
  rows.forEach((row, order) => {
    const findings = sortFindings(findingsOf(row, input), input);
    const top = findings[0];
    if (!top || unsafe(row, top, input)) return;
    candidates.push({ row, order, findings });
  });
  // FR-27: earliest expectedBy, then the fix's list position, then table order.
  const pos = (c: (typeof candidates)[number]) =>
    rankPosition({ ...rankableOf((c.findings[0] as Finding).g), atLastPosition: false }, input.list);
  candidates.sort(
    (a, b) =>
      stageIndex(a.row.expectedBy) - stageIndex(b.row.expectedBy) || pos(a) - pos(b) || a.order - b.order,
  );
  const chosen = candidates[0];
  if (!chosen) return null;
  const [top, ...rest] = chosen.findings as [Finding, ...Finding[]];
  const details: GoalDetail[] = [
    ...(top.subject === 'account' ? (top.g.goal.details ?? []) : []),
    ...rest.map((f) => ({ subject: f.subject, text: lineOf(f) })),
  ];
  const fix = top.g.goal;
  const seen = new Set<string>();
  const sources = [...fix.nextAction.sources, ...sourceRefs(chosen.row)].filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
  const goal: Goal = {
    id: BEHIND_ID,
    title: render(entry.text, { system: chosen.row.system }),
    system: 'metapath',
    category: fix.category,
    nextAction: {
      ...fix.nextAction,
      text: lineOf(top),
      why: `${entry.why} ${fix.nextAction.why}`.trim(),
      sources,
      provenance: {
        entryIds: [...new Set([...fix.nextAction.provenance.entryIds, BEHIND_ID, EXPECTATIONS_ID])],
        fields: fix.nextAction.provenance.fields,
      },
    },
    milestone: fix.milestone,
    ...(details.length ? { details } : {}),
  };
  return {
    row: chosen.row,
    goal: { goal, ...(top.g.rank ? { rank: top.g.rank } : {}), moduleId: 'meta-path' },
    moved: new Set(chosen.findings.map((f) => f.g)),
  };
}
