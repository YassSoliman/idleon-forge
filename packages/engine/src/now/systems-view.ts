// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `buildSystemsView` and `buildSystemPageView` (M17 TR-5): the Systems hub and the generic System
// page, pure and deterministic, beside `buildNowView`. They read only what the modules already
// computed (`EngineResult`, M10's `NowPrefs`) and add no advice (TR-9): every string is a module's
// text, a registry or fact-table fact, a name, a count or a word from `view-words.ts`.
//
// Status, the first that applies (FR-17): locked, wasting, behind, can't tell, not covered yet, ok.
// Cap pills never make a System wasting (M3 R-PILL-1, D-8); a skipped or dismissed blocker doesn't
// either, and the tile says "· n skipped" instead.
import type { EngineResult, Goal, InfoLine, Subject, SystemSummary } from '../result';
import { goalView, safeHref, sourceView, spendLineKey } from './build-now-view';
import { dismissActive, type NowPrefs, type SessionClock, skipActive } from './prefs';
import { tabHomeOf } from './system-homes';
import type {
  NowView,
  Segment,
  SystemPageGoal,
  SystemPageView,
  SystemsView,
  TileStatus,
  TileView,
} from './view';
import { HUB_WORDS, REASON_WORDS, STATUS_WORDS, WORLD_NAMES } from './view-words';

export interface SystemsUi {
  now: number;
  /** The account's last cloud save, for when a Skip today ends (M10 D3). */
  lastCloudSave?: number | null;
}

/** M15 F5's Behind Goal (metapath/behind.ts BEHIND_ID; not imported: the view layer stays Knowledge-free, M10 TR-1). */
const BEHIND_ID = 'metapath.goal.behind';
/** The pseudo gap M2 emits past World 4 (FR-20). */
const BEYOND_GAP = 'worlds-5-7';

const word = (text: string): Segment => ({ text, origin: 'view-word' });
const count = (text: string): Segment => ({ text, origin: 'count' });
const fact = (text: string): Segment => ({ text, origin: 'fact' });

/** An entry id's System: its prefix (`anvil.check.caps-before-return@c3` → `anvil`, TR-5). */
const systemOfKey = (key: string) => key.split('@')[0]?.split('.')[0] ?? key;

interface Prefs {
  skipped(key: string): boolean;
  dismissed(key: string): boolean;
  open(key: string): boolean;
}

function readPrefs(result: EngineResult, prefs: NowPrefs, ui: SystemsUi): Prefs {
  const clock: SessionClock = {
    now: ui.now,
    sessionStartedAt: result.sessionStartedAt,
    lastCloudSave: ui.lastCloudSave ?? null,
  };
  const build = result.versions.gameBuild;
  const skipped = (key: string) => {
    const s = prefs.skips[key];
    return s !== undefined && skipActive(s, clock);
  };
  const dismissed = (key: string) => {
    const d = prefs.dismissals[key];
    return d !== undefined && dismissActive(d, build);
  };
  return { skipped, dismissed, open: (k) => !skipped(k) && !dismissed(k) };
}

/** A Goal's System (TR-5): its own, except the Behind Goal belongs to the chosen row's System. */
function goalSystem(g: Goal, result: EngineResult): string {
  if (g.id === BEHIND_ID) return result.behindSystems?.find((r) => r.chosen)?.systemId ?? g.system;
  return g.system;
}

interface Placed {
  goal: Goal;
  subject: Subject;
  /** CharacterState.index, or null for the account. */
  index: number | null;
}

/** Every Goal with its subject, characters in save order then the account. */
function allGoals(result: EngineResult): Placed[] {
  return [
    ...result.characters.flatMap((c) =>
      c.goals.map((goal) => ({ goal, subject: `c${c.index}` as Subject, index: c.index })),
    ),
    ...result.account.goals.map((goal) => ({ goal, subject: 'account' as Subject, index: null })),
  ];
}

const urgent = (g: Goal) => g.urgency === 'losing-now' || g.urgency === 'lost-before-return';
const isFix = (g: Goal, stageUnknown: boolean) => g.category === 'blocker' || (!stageUnknown && urgent(g));

interface SystemFacts {
  summary: SystemSummary;
  goals: Placed[];
  pills: { line: InfoLine; index: number }[];
}

function factsBySystem(result: EngineResult): Map<string, SystemFacts> {
  const out = new Map<string, SystemFacts>();
  for (const s of result.systems ?? []) out.set(s.id, { summary: s, goals: [], pills: [] });
  for (const p of allGoals(result)) out.get(goalSystem(p.goal, result))?.goals.push(p);
  for (const c of result.characters)
    for (const line of c.info ?? [])
      if (line.kind === 'cap') out.get(systemOfKey(line.key))?.pills.push({ line, index: c.index });
  return out;
}

function spendLinesOf(result: EngineResult, prefs: Prefs, systemId: string) {
  const plan = result.account.spendPlan;
  if (!plan || result.stage.id === 'unknown') return [];
  return plan.lines.filter(
    (l) => prefs.open(spendLineKey(l)) && l.steps.some((s) => systemOfKey(s.ref) === systemId),
  );
}

function tileOf(f: SystemFacts, result: EngineResult, prefs: Prefs, ui: SystemsUi): TileView {
  const s = f.summary;
  const stageUnknown = result.stage.id === 'unknown';
  const returnAt = ui.now + result.expectedReturn.usedSeconds * 1000;
  let toFix = 0;
  let skipped = 0;
  let toDo = 0;
  for (const { goal } of f.goals) {
    const key = goal.nextAction.key;
    const fix = isFix(goal, stageUnknown);
    if (!fix && stageUnknown) continue;
    if (!prefs.open(key)) {
      if (fix) skipped++;
      continue;
    }
    if (fix) toFix++;
    else toDo++;
  }
  const pillsFull = f.pills.filter(
    ({ line }) =>
      !prefs.skipped(line.key) && (line.at === null || line.at === undefined || line.at <= returnAt),
  ).length;
  const behindRow = (result.behindSystems ?? []).some(
    (r) => r.systemId === s.id && r.findingKeys.some((k) => prefs.open(k)),
  );
  const behind = !stageUnknown && behindRow;
  const failed = [
    ...result.diagnostics.failedDetectors.flatMap((d) => d.entryIds),
    ...(result.unknownFindings ?? []).map((u) => u.entryId),
  ].some((id) => systemOfKey(id) === s.id);

  let status: TileStatus;
  if (s.unlocked === 'no') status = 'locked';
  else if (toFix > 0) status = 'wasting';
  else if (behind) status = 'behind';
  else if (s.unlocked === 'unknown' || failed || (stageUnknown && s.covered)) status = 'cant-tell';
  else if (!s.covered) status = 'not-covered';
  else status = 'ok';

  const parserBehind = result.versions.parserBehind;
  const reason: Segment[] = [];
  const add = (...xs: Segment[]) => {
    if (reason.length > 0) reason.push(word(REASON_WORDS.sep));
    reason.push(...xs);
  };
  const toDoShown = stageUnknown ? null : toDo;
  const alsoBehind = status === 'locked' && behindRow;
  switch (status) {
    case 'locked': {
      const precise = s.unlockBy === 'own' && s.unlock ? s.unlock.text : null;
      add(precise ? fact(precise) : word(REASON_WORDS.opensInWorld(s.world)));
      if (toDoShown) add(count(REASON_WORDS.toDo(toDoShown)));
      if (alsoBehind) add(word(REASON_WORDS.alsoBehind));
      break;
    }
    case 'wasting':
      add(count(REASON_WORDS.toFix(toFix)));
      if (toDoShown) add(count(REASON_WORDS.toDo(toDoShown)));
      break;
    case 'behind':
      add(word(REASON_WORDS.behind));
      if (toDoShown) add(count(REASON_WORDS.toDo(toDoShown)));
      break;
    case 'ok':
      add(word(parserBehind ? REASON_WORDS.nothingToFixMaybe : REASON_WORDS.nothingToFix));
      if (toDoShown) add(count(REASON_WORDS.toDo(toDoShown)));
      break;
    case 'cant-tell':
      add(word(REASON_WORDS.cantTell));
      break;
    case 'not-covered':
      add(word(REASON_WORDS.notCovered));
      if (spendLinesOf(result, prefs, s.id).length > 0) add(word(REASON_WORDS.inSpendPlan));
      break;
  }
  if (skipped > 0) add(count(REASON_WORDS.skipped(skipped)));
  if (pillsFull > 0) add(count(REASON_WORDS.pillsFull(pillsFull)));
  if (parserBehind && status !== 'ok') add(word(REASON_WORDS.mayBeOutOfDate));

  const statusWord = word(STATUS_WORDS[status]);
  const reasonText = reason.map((r) => r.text).join('');
  return {
    id: s.id,
    name: s.name,
    world: s.world,
    status,
    statusWord,
    reason,
    counts: { toDo: toDoShown, toFix, skipped, pillsFull },
    alsoBehind,
    accessibleName: `${s.name}, ${statusWord.text}, ${reasonText}`,
  };
}

/** The highest world whose `worlds/reached` unlock says yes (FR-20); 0 when none does. */
function highestWorld(systems: readonly SystemSummary[]): number {
  return systems.reduce(
    (w, s) => (s.unlockBy === 'world' && s.unlocked === 'yes' ? Math.max(w, s.world) : w),
    0,
  );
}

/** M17 TR-5: the Systems hub. Null-safe: without `result.systems` it has no tiles. */
export function buildSystemsView(result: EngineResult, nowPrefs: NowPrefs, ui: SystemsUi): SystemsView {
  const prefs = readPrefs(result, nowPrefs, ui);
  const facts = factsBySystem(result);
  const game = (result.systems ?? []).filter((s) => s.kind === 'game');
  const tiles = game.map((s) => tileOf(facts.get(s.id) as SystemFacts, result, prefs, ui));
  const highest = highestWorld(game);
  const shown = tiles.filter((t) => t.world <= highest + 1);
  const folded = tiles.filter((t) => t.world > highest + 1);
  const worlds = [...new Set(shown.map((t) => t.world))].sort((a, b) => a - b);
  const groups = worlds.map((w) => ({
    world: w,
    heading: WORLD_NAMES[w] ?? `World ${w}`,
    tiles: shown.filter((t) => t.world === w),
  }));
  const ordered = groups.flatMap((g) => g.tiles);
  const gameIds = new Set(game.map((s) => s.id));
  return {
    needsYou: [
      ...ordered
        .filter((t) => t.status === 'wasting')
        .map((t) => ({ id: t.id, name: t.name, status: 'wasting' as const })),
      // A locked System is never "Needs you", even when behind: its tile says so (R6 QA).
      ...ordered
        .filter((t) => t.status === 'behind')
        .map((t) => ({ id: t.id, name: t.name, status: 'behind' as const })),
    ],
    groups,
    later: folded.length ? { label: HUB_WORDS.later(folded.length), tiles: folded } : null,
    beyond: result.notCovered.some((n) => n.systemId === BEYOND_GAP) ? HUB_WORDS.beyond : null,
    otherGaps: result.notCovered
      .filter((n) => n.systemId !== BEYOND_GAP && !gameIds.has(n.systemId))
      .map((n) => n.label),
    wastingCount: tiles.filter((t) => t.status === 'wasting').length,
  };
}

/** Who a Goal is for on a System page (FR-23): name, class and level, or "Account". */
const whoOf = (result: EngineResult, index: number | null) => {
  if (index === null) return 'Account';
  const c = result.characters.find((x) => x.index === index);
  return c ? `${c.name} · ${c.classLabel} lv ${c.level}` : `Character ${index + 1}`;
};

/**
 * M17 TR-5: one System's page. `nowView` is the Now view the caller already built (its Roster is the
 * frozen Visit Order). Null for an id that isn't a game System in the registry (FR-7 opens Now).
 */
export function buildSystemPageView(
  result: EngineResult,
  nowPrefs: NowPrefs,
  nowView: Pick<NowView, 'roster'>,
  ui: SystemsUi & { id: string; highlight: string | null },
): SystemPageView | null {
  const summary = result.systems?.find((s) => s.id === ui.id && s.kind === 'game');
  if (!summary) return null;
  const prefs = readPrefs(result, nowPrefs, ui);
  const f = factsBySystem(result).get(summary.id) as SystemFacts;
  const tile = tileOf(f, result, prefs, ui);
  const stageUnknown = result.stage.id === 'unknown';
  const order = nowView.roster.map((r) => r.index);
  const rank = (p: Placed) => (p.index === null ? Number.MAX_SAFE_INTEGER : order.indexOf(p.index));
  // Engine order: characters in the frozen Visit Order (each in its own rank order), then the account.
  const placed = f.goals
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map((x) => x.p);
  const goals: SystemPageGoal[] = [];
  const skippedKeys: string[] = [];
  const dismissed: { key: string; text: string }[] = [];
  for (const p of placed) {
    const key = p.goal.nextAction.key;
    if (stageUnknown && p.goal.category !== 'blocker') continue;
    if (prefs.dismissed(key) && p.goal.category !== 'blocker') {
      dismissed.push({ key, text: p.goal.nextAction.text });
      continue;
    }
    if (prefs.skipped(key)) {
      skippedKeys.push(key);
      continue;
    }
    goals.push({ ...goalView(p.goal), who: whoOf(result, p.index), subject: p.subject });
  }
  const pills = f.pills
    .filter(({ line }) => !prefs.skipped(line.key))
    .sort((a, b) => order.indexOf(a.index) - order.indexOf(b.index))
    .map(({ line, index }) => ({
      subject: `c${index}` as Subject,
      index,
      who: whoOf(result, index),
      label: line.label ?? line.text,
      key: line.key,
      fullNow: line.at === null || line.at === undefined || line.at <= ui.now,
    }));
  const unlock = summary.unlock
    ? {
        text: summary.unlock.text,
        world: summary.unlock.world,
        stale: summary.unlock.stale,
        source: summary.unlock.sources.length
          ? sourceView(summary.unlock.sources, summary.unlock.stale)
          : null,
      }
    : null;
  return {
    tile,
    goals,
    skippedKeys,
    dismissed,
    pills,
    spendLines: spendLinesOf(result, prefs, summary.id).map((l) => ({ lineId: l.id, text: l.text })),
    unlock,
    locked: tile.status === 'locked',
    alwaysOpen: summary.unlockBy === 'always',
    coverage: {
      covered: summary.covered,
      checks: coverageChecks(summary.checks),
    },
    tabHome: tabHomeOf(summary.id),
    wiki: summary.wiki ? safeHref(summary.wiki) : null,
    highlight: ui.highlight,
    stageUnknown,
  };
}

/**
 * The coverage list, one row per title (R9 QA): two Checks can share a title ("Water at cap" is a line
 * and, with a slow refill, a blocker); the row says "see above" when either fired.
 */
function coverageChecks(
  checks: readonly { title: string; fired: boolean }[],
): { title: string; state: 'nothing-to-do' | 'see-above' }[] {
  const fired = new Map<string, boolean>();
  for (const c of checks) fired.set(c.title, (fired.get(c.title) ?? false) || c.fired);
  return [...fired].map(([title, f]) => ({ title, state: f ? 'see-above' : 'nothing-to-do' }));
}

/** The System a Next Action's "See it" opens (FR-31), or null when it gets none. */
export function seeItSystem(goal: Pick<Goal, 'id' | 'system'>, result: EngineResult): string | null {
  const id = goalSystem(goal as Goal, result);
  const s = result.systems?.find((x) => x.id === id);
  return s && s.kind === 'game' ? s.id : null;
}
