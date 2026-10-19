// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `buildSystemsHubView` (M21 FR-S1, FR-S2, area S): the Systems hub as the Design Lab's "Stage report
// card" draws it. M17's `buildSystemsView` (its tiles, world bands and the nav badge's count) plus the
// "Wasting now" strip, the report card (one Stage axis, the behind Systems by gap, the worst open with its
// one step) and each band's once-per-band lines. Pure and deterministic; every string is a module's text,
// a registry name, a count or a view word. It lives under `@idleon-forge/engine/systems-ui`, not the `now`
// barrel, so it loads with the lazy hub and never in the first load (TR-12).

// The UI-thread `now` API only (the barrel), never its internal modules: a lazy chunk that imports an
// internal module splits the barrel's first-load chunk (measured: +2.6 KB of first load).
import {
  dismissActive,
  type NowPrefs,
  type SystemsUi,
  type SystemsView,
  skipActive,
  type TileView,
} from '@idleon-forge/engine/now';
import { STAGE_DEFINITIONS, STAGES, type StageId } from '@idleon-forge/knowledge/stages';
import type { ClassFamily, EngineResult, Goal, SystemPicture } from '../result';
import { isWorld4ReadOnly } from '../world4';
import { BAND_WORDS, INDEX_WORDS, REPORT_WORDS } from './words';

/** A cap's System: its key's entry id up to the first dot (M17 `systemOfKey`). */
const systemOfKey = (key: string) => key.split('@')[0]?.split('.')[0] ?? key;

/**
 * M24 (QA P1-5): this System's quick-collect caps that are full now, counted the way Now counts them
 * (`capView` fullNow: no time or a time at or before now; skipped ones left out), with the cap's own verb
 * ("Worship full · spend" -> "spend"). Null when none is full now.
 */
export interface CapsNow {
  count: number;
  verb: string;
  what: string;
}
export function capsFullNow(
  result: EngineResult,
  systemId: string,
  prefs: { open(key: string): boolean },
  now: number,
): CapsNow | null {
  const lines = result.characters.flatMap((c) =>
    (c.info ?? []).filter(
      (l) =>
        l.kind === 'cap' &&
        systemOfKey(l.key) === systemId &&
        prefs.open(l.key) &&
        (l.at === null || l.at === undefined || l.at <= now),
    ),
  );
  const first = lines[0];
  if (!first) return null;
  const label = first.label ?? first.text;
  const cut = label.lastIndexOf(' · ');
  const verb = cut >= 0 ? label.slice(cut + ' · '.length) : 'collect';
  const what = (cut >= 0 ? label.slice(0, cut) : label).replace(/\s+full$/i, '');
  return { count: lines.length, verb, what };
}

const NEW_KINDS: ReadonlySet<string> = new Set(['stamps', 'statues', 'vault', 'printer']);

/** M21 FR-S1, FR-S2: the hub with the report card. */
export function buildSystemsHubView(
  result: EngineResult,
  nowPrefs: NowPrefs,
  ui: SystemsUi,
  /** M17's hub view the caller already built (the session's `systems`), the same result and preferences. */
  view: SystemsView,
): SystemsView & SystemsHubExtras {
  const prefs = readPrefs(result, nowPrefs, ui);
  const facts = goalsBySystem(result);
  const tiles = [...view.groups.flatMap((g) => g.tiles), ...(view.later?.tiles ?? [])];
  return { ...view, ...hubExtras(result, prefs, facts, tiles, view.groups, ui.now) };
}

/** Open = neither skipped today nor dismissed (M17's rule, `now/systems-view.ts` readPrefs). */
export interface Prefs {
  open(key: string): boolean;
}
export function readPrefs(result: EngineResult, prefs: NowPrefs, ui: SystemsUi): Prefs {
  const clock = {
    now: ui.now,
    sessionStartedAt: result.sessionStartedAt,
    lastCloudSave: ui.lastCloudSave ?? null,
  };
  const build = result.versions.gameBuild;
  return {
    open: (key) => {
      const sk = prefs.skips[key];
      const d = prefs.dismissals[key];
      return !(sk !== undefined && skipActive(sk, clock)) && !(d !== undefined && dismissActive(d, build));
    },
  };
}

interface Placed {
  goal: Goal;
  /** CharacterState.index, or null for the account. */
  index: number | null;
}
interface SystemFacts {
  summary: NonNullable<EngineResult['systems']>[number];
  goals: Placed[];
}
/** M15 F5's Behind Goal belongs to its chosen row's System (M17 TR-5). */
const BEHIND_ID = 'metapath.goal.behind';
/** Every Goal by System, characters in save order then the account (M17's `factsBySystem`). */
function goalsBySystem(result: EngineResult): Map<string, SystemFacts> {
  const out = new Map<string, SystemFacts>();
  for (const s of result.systems ?? []) out.set(s.id, { summary: s, goals: [] });
  const place = (goal: Goal, index: number | null) => {
    const id =
      goal.id === BEHIND_ID
        ? (result.behindSystems?.find((r) => r.chosen)?.systemId ?? goal.system)
        : goal.system;
    out.get(id)?.goals.push({ goal, index });
  };
  for (const c of result.characters) for (const g of c.goals) place(g, c.index);
  for (const g of result.account.goals) place(g, null);
  return out;
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
  /** M24: the Systems index (hero, behind list, filtered grid). */
  index: SystemsIndexView;
}

/** M24: how a tile reads on the index: its pip tone and its open count. */
export type IndexTone = 'wasting' | 'todo' | 'ok' | 'off' | 'readonly';
export interface IndexTileView {
  id: string;
  name: string;
  status: TileView['status'];
  tone: IndexTone;
  /** Open items (to fix + to do); null when none. */
  count: number | null;
  /** "not covered yet", "locked" or "can't tell" under the name; null otherwise. */
  sub: string | null;
  accessibleName: string;
  /** M24 filters: wasting or behind. */
  needsYou: boolean;
  /** A read-only World 4 page (`isWorld4ReadOnly`): a page to open, not "not covered yet". */
  readOnly: boolean;
}
export interface SystemsIndexView {
  /** "57 Systems · 2 wasting · 5 behind for World 3 · 11 not covered yet · 3 locked". */
  summary: string;
  /** The wasting Systems with their first open step, for the hero. */
  wasting: { id: string; name: string; step: SystemStepView | null; sub: string }[];
  /** "Behind for World 3"; null when the Stage is unknown. */
  behindTitle: string | null;
  /** The behind rows (gap largest first, at most 5), each with its next step. */
  behind: { id: string; name: string; by: string | null; step: SystemStepView | null }[];
  counts: { needs: number; all: number; notCovered: number; locked: number };
  worlds: {
    world: number;
    heading: string;
    sub: string;
    /** How a world whose Systems are all locked opens (its unlock fact), or null. */
    how: string | null;
    tiles: IndexTileView[];
  }[];
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
  groups: readonly { world: number; heading: string; tiles: TileView[] }[],
  now: number,
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
  const report = reportOf(result, prefs, facts, tiles.length);
  return {
    wastingNow,
    wastingLabel: wastingNow.length ? REPORT_WORDS.wasting(wastingNow.length) : null,
    report,
    bands,
    pictures: (result.slotPictures ?? []).filter((p) => NEW_KINDS.has(p.kind)),
    index: indexOf(result, prefs, facts, tiles, groups, report, now),
  };
}

/** A tile's pip: coral wasting; gold behind, or fine with a step to do or a cap full now; mint fine. */
const toneOf = (t: TileView, capsNow: boolean): IndexTone =>
  t.status === 'wasting'
    ? 'wasting'
    : t.status === 'behind' || (t.status === 'ok' && ((t.counts.toDo ?? 0) > 0 || capsNow))
      ? 'todo'
      : t.status === 'ok'
        ? 'ok'
        : 'off';

/** M24: the Systems index, from the same tiles and report as the M21 hub. */
function indexOf(
  result: EngineResult,
  prefs: Prefs,
  facts: Map<string, SystemFacts>,
  tiles: readonly TileView[],
  groups: readonly { world: number; heading: string; tiles: TileView[] }[],
  report: StageReportView | null,
  now: number,
): SystemsIndexView {
  const stage = result.stage.id;
  const world = isStage(stage) ? `World ${stage.slice(1, 2)}` : null;
  const n = (f: (t: TileView) => boolean) => tiles.filter(f).length;
  const wastingN = n((t) => t.status === 'wasting');
  const behindN = n((t) => t.status === 'behind');
  const readOnly = (t: TileView) => isWorld4ReadOnly(result, t.id);
  const notCoveredN = n((t) => t.status === 'not-covered' && !readOnly(t));
  const lockedN = n((t) => t.status === 'locked');
  const summary = [
    INDEX_WORDS.systems(tiles.length),
    wastingN ? INDEX_WORDS.wasting(wastingN) : null,
    behindN && world ? INDEX_WORDS.behindFor(behindN, world) : null,
    notCoveredN ? INDEX_WORDS.notCovered(notCoveredN) : null,
    lockedN ? INDEX_WORDS.locked(lockedN) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const reasonText = (t: TileView) => {
    const parts = t.reason[0]?.text === t.statusWord.text ? t.reason.slice(2) : t.reason;
    return parts.map((p) => p.text).join('');
  };
  const wasting = groups
    .flatMap((g) => g.tiles)
    .filter((t) => t.status === 'wasting')
    .map((t) => ({
      id: t.id,
      name: t.name,
      step: firstStep(result, prefs, facts.get(t.id)?.goals ?? []),
      sub: [t.name, reasonText(t)].filter(Boolean).join(' · '),
    }));
  const behind = (report?.rows ?? []).map((r) => {
    const goals = facts.get(r.id)?.goals ?? [];
    const keys = new Set(
      (result.behindSystems ?? []).filter((b) => b.systemId === r.id).flatMap((b) => b.findingKeys),
    );
    return {
      id: r.id,
      name: r.name,
      by: r.expectedBy ? INDEX_WORDS.usuallyBy(stageLabel(r.expectedBy)) : null,
      step:
        firstStep(
          result,
          prefs,
          goals.filter((g) => keys.has(g.goal.nextAction.key)),
        ) ?? firstStep(result, prefs, goals),
    };
  });
  const tileView = (t: TileView): IndexTileView => {
    const open = t.counts.toFix + (t.counts.toDo ?? 0);
    const ro = readOnly(t) && t.status === 'not-covered';
    const tone: IndexTone = ro ? 'readonly' : toneOf(t, capsFullNow(result, t.id, prefs, now) !== null);
    return {
      id: t.id,
      name: t.name,
      status: t.status,
      tone,
      count: open > 0 ? open : null,
      sub: ro ? INDEX_WORDS.readOnly : (INDEX_WORDS.tileSub[t.status] ?? null),
      accessibleName: ro ? `${t.name}, ${INDEX_WORDS.readOnlyName}` : t.accessibleName,
      // QA P2: one definition with the pips: a coral or gold pip needs you.
      needsYou: tone === 'wasting' || tone === 'todo',
      readOnly: ro,
    };
  };
  const tileViews = new Map(tiles.map((t) => [t.id, tileView(t)]));
  const worlds = groups.map((g) => {
    const views = g.tiles.map((t) => tileViews.get(t.id) ?? tileView(t));
    const locked = g.tiles.filter((t) => t.status === 'locked');
    const allLocked = locked.length > 0 && locked.length === g.tiles.length;
    const unlock = allLocked
      ? result.systems?.find((s) => s.id === locked[0]?.id && s.unlockBy === 'world')?.unlock
      : null;
    return {
      world: g.world,
      heading: g.heading,
      sub: INDEX_WORDS.worldSub(
        g.tiles.length,
        views.filter((t) => t.needsYou).length,
        g.tiles.filter((t) => t.status === 'not-covered' && !readOnly(t)).length,
        locked.length,
        g.tiles.filter((t) => t.status === 'not-covered' && readOnly(t)).length,
      ),
      how: unlock?.text ?? null,
      tiles: views,
    };
  });
  return {
    summary,
    wasting,
    behindTitle: world ? INDEX_WORDS.behindTitle(world) : null,
    behind,
    counts: {
      needs: worlds.reduce((n, w) => n + w.tiles.filter((t) => t.needsYou).length, 0),
      all: tiles.length,
      notCovered: notCoveredN,
      locked: lockedN,
    },
    worlds,
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
