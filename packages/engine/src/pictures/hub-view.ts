// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `buildSystemsHubView` (M21 FR-S1, FR-S2, area S): the Systems hub as the Design Lab's "Stage report
// card" draws it. M17's `buildSystemsView` (its tiles, world bands and the nav badge's count) plus the
// "Wasting now" strip, the report card (one Stage axis, the behind Systems by gap, the worst open with its
// one step) and each band's once-per-band lines. Pure and deterministic; every string is a module's text,
// a registry name, a count or a view word. It lives under `@idleon-forge/engine/systems-ui`, not the `now`
// barrel, so it loads with the lazy hub and never in the first load (TR-12).
import { STAGE_DEFINITIONS, STAGES, type StageId } from '@idleon-forge/knowledge/stages';
import type { NowPrefs } from '../now/prefs';
import {
  buildSystemsView,
  factsBySystem,
  type Placed,
  type Prefs,
  readPrefs,
  type SystemFacts,
  type SystemsUi,
} from '../now/systems-view';
import type { SystemsView, TileView } from '../now/view';
import type { ClassFamily, EngineResult, SystemPicture } from '../result';
import { BAND_WORDS, REPORT_WORDS } from './words';

const NEW_KINDS: ReadonlySet<string> = new Set(['stamps', 'statues', 'vault', 'printer']);

/** M21 FR-S1, FR-S2: the hub with the report card. */
export function buildSystemsHubView(
  result: EngineResult,
  nowPrefs: NowPrefs,
  ui: SystemsUi,
): SystemsView & SystemsHubExtras {
  const view = buildSystemsView(result, nowPrefs, ui);
  const prefs = readPrefs(result, nowPrefs, ui);
  const facts = factsBySystem(result);
  const tiles = [...view.groups.flatMap((g) => g.tiles), ...(view.later?.tiles ?? [])];
  return { ...view, ...hubExtras(result, prefs, facts, tiles, view.groups) };
}

/** A character as a who-token (DS-3, TokenLine): the family chibi and "Class level"; null for the account. */
export interface WhoToken {
  family: ClassFamily;
  label: string;
}

/** The one step a hub row or a System page leads with (FR-S1, FR-S3): one Next Action. */
export interface SystemStepView {
  key: string;
  text: string;
  who: WhoToken | null;
}

export interface ReportRowView {
  id: string;
  name: string;
  /** The Stage the row expects the System by (BehindSystem.expectedBy); null when not given. */
  expectedBy: StageId | null;
  /** 0..1 on the report card's axis; null without `expectedBy`. */
  at: number | null;
  /** Stages behind the account's (the gap drawn as length). */
  gap: number;
  /** "expected by World 1, mid". */
  expectedText: string | null;
  /** "5 Stages behind". */
  behindText: string | null;
  accessibleName: string;
  /** FR-S1: the worst row is open with its one step. */
  open: boolean;
  step: SystemStepView | null;
}

export interface StageReportView {
  stage: StageId;
  /** "World 3, early". */
  stageLabel: string;
  lede: string;
  /** 0..1: where the account is on the axis. */
  here: number;
  axis: { id: StageId; short: string | null; here: boolean }[];
  /** Gap largest first, at most 5 (DS-9). */
  rows: ReportRowView[];
  /** "All Systems (34)", the link to the bands under the card. */
  allSystems: string;
}

export interface SystemsHubExtras {
  /** FR-S1: the wasting Systems, as chips, with the count in the card's header. */
  wastingNow: { id: string; name: string }[];
  /** "3 Systems wasting", or null with none. */
  wastingLabel: string | null;
  /** FR-S1: null when the Stage is unknown or nothing is behind. */
  report: StageReportView | null;
  /** FR-S2: per world band, its "2 need you" and its one "4 here aren't covered yet" line. */
  bands: Record<number, { needYou: string | null; notCovered: string | null }>;
  /** M21 TR-14: area S's new pictures (US-12), worded by the `## Systems` golden renderer only. */
  pictures: SystemPicture[];
}

const STAGE_SHORT = (id: StageId): string | null =>
  id.endsWith('-early') ? (id.split('-')[0] ?? null) : null;
const stagePos = (id: StageId) => STAGES.indexOf(id) / (STAGES.length - 1);
export const isStage = (s: string | undefined | null): s is StageId =>
  !!s && (STAGES as readonly string[]).includes(s);
export const stageLabel = (id: StageId) => STAGE_DEFINITIONS[id]?.label ?? id;

export function whoToken(result: EngineResult, index: number | null): WhoToken | null {
  if (index === null) return null;
  const c = result.characters.find((x) => x.index === index);
  const family = result.classFamilies?.[index];
  return c && family ? { family, label: `${c.classLabel} ${c.level}` } : null;
}

export function firstStep(
  result: EngineResult,
  prefs: Prefs,
  goals: readonly Placed[],
): SystemStepView | null {
  const stageUnknown = result.stage.id === 'unknown';
  const p = goals.find(
    (x) => prefs.open(x.goal.nextAction.key) && (!stageUnknown || x.goal.category === 'blocker'),
  );
  return p
    ? { key: p.goal.nextAction.key, text: p.goal.nextAction.text, who: whoToken(result, p.index) }
    : null;
}

function hubExtras(
  result: EngineResult,
  prefs: Prefs,
  facts: Map<string, SystemFacts>,
  tiles: readonly TileView[],
  groups: readonly { world: number; tiles: TileView[] }[],
): SystemsHubExtras {
  const wastingNow = groups
    .flatMap((g) => g.tiles)
    .filter((t) => t.status === 'wasting')
    .map((t) => ({ id: t.id, name: t.name }));
  const bands: SystemsHubExtras['bands'] = {};
  for (const g of groups) {
    const need = g.tiles.filter((t) => t.status === 'wasting' || t.status === 'behind').length;
    const nc = g.tiles.filter((t) => t.status === 'not-covered').length;
    bands[g.world] = {
      needYou: need ? BAND_WORDS.needYou(need) : null,
      notCovered: nc ? BAND_WORDS.notCovered(nc) : null,
    };
  }
  return {
    wastingNow,
    wastingLabel: wastingNow.length ? REPORT_WORDS.wasting(wastingNow.length) : null,
    report: reportOf(result, prefs, facts, tiles.length),
    bands,
    pictures: (result.slotPictures ?? []).filter((p) => NEW_KINDS.has(p.kind)),
  };
}

function reportOf(
  result: EngineResult,
  prefs: Prefs,
  facts: Map<string, SystemFacts>,
  total: number,
): StageReportView | null {
  const stage = result.stage.id;
  if (!isStage(stage)) return null;
  const here = STAGES.indexOf(stage);
  const seen = new Set<string>();
  const rows: ReportRowView[] = [];
  for (const r of result.behindSystems ?? []) {
    if (seen.has(r.systemId) || !r.findingKeys.some((k) => prefs.open(k))) continue;
    const f = facts.get(r.systemId);
    if (f?.summary.kind !== 'game') continue;
    seen.add(r.systemId);
    const expectedBy = isStage(r.expectedBy) ? r.expectedBy : null;
    const gap = expectedBy ? Math.max(0, here - STAGES.indexOf(expectedBy)) : 0;
    const expectedText = expectedBy ? REPORT_WORDS.expected(stageLabel(expectedBy)) : null;
    const behindText = expectedBy ? REPORT_WORDS.behind(gap) : null;
    rows.push({
      id: r.systemId,
      name: f.summary.name,
      expectedBy,
      at: expectedBy ? stagePos(expectedBy) : null,
      gap,
      expectedText,
      behindText,
      accessibleName: [f.summary.name, expectedText, behindText].filter(Boolean).join(', '),
      open: false,
      step: null,
    });
  }
  if (rows.length === 0) return null;
  // Gap largest first; the engine's own order breaks ties (stable sort).
  rows.sort((a, b) => b.gap - a.gap);
  const shown = rows.slice(0, 5);
  const worst = shown[0];
  if (worst) {
    worst.open = true;
    const f = facts.get(worst.id);
    const keys = new Set(
      (result.behindSystems ?? []).filter((r) => r.systemId === worst.id).flatMap((r) => r.findingKeys),
    );
    const goals = f ? f.goals : [];
    // The row's own finding first (the Behind Goal may carry it), else the System's first open step.
    worst.step =
      firstStep(
        result,
        prefs,
        goals.filter((g) => keys.has(g.goal.nextAction.key)),
      ) ?? firstStep(result, prefs, goals);
  }
  const label = stageLabel(stage);
  return {
    stage,
    stageLabel: label,
    lede: REPORT_WORDS.lede(label),
    here: stagePos(stage),
    axis: STAGES.map((id) => ({ id, short: STAGE_SHORT(id), here: id === stage })),
    rows: shown,
    allSystems: REPORT_WORDS.allSystems(total),
  };
}
