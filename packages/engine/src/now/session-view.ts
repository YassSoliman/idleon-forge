// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-11, FR-N1 to FR-N7: the Now screen's answer-first parts, owned by area N.
//
// `buildSessionView(view, result, ui)` is pure and needs no clock beyond `result.asOf`. It returns:
// - the counter (FR-N2): the Verdict blockers left, the first fix in Visit Order, the Unknown fold;
// - the grouped jobs (FR-N3): one card per Next Action entry shown on 2 or more Roster rows, keyed by
//   entry id (never by the rendered words), with its `groupText` from the session module;
// - the roster findings (FR-N3, DS-7): a cap pill on 3 or more rows becomes one finding that filters;
// - the Roster's folds (FR-N4): Ready rows fold into one line at 6 or more characters;
// - the pause point (FR-N6) with its one-line why, and the Log in list, the Away card (FR-N7) and the
//   Log off list.
// Components render these in order; they never group, count or sort (M10 red-team #5).
import type { EngineResult, SessionFacts, TimelineBar } from '../result';
import { plural, span } from './format';
import type { ClassFamily, NowView, PauseTab, RosterRow, SessionUi, SessionView } from './view';
import { AWAY_WORDS, COUNTER_WORDS, GROUP_WORDS, PAUSE_WORDS } from './words/now';
import { KIND_WORDS } from './words/time';

/** FR-N6: Log in only while the Play Session is this young … */
export const LOGIN_WINDOW_MS = 10 * 60_000;
/** … and the previous one ended at least this long before it began (RT-26). */
export const LOGIN_GAP_MS = 60 * 60_000;
/** FR-N6 (b): Log off once the count is this low and every character with a Fix was opened. */
export const LOGOFF_MAX_COUNT = 7;
/** FR-N6 (c): Log off this long before the usual session length. */
export const LOGOFF_EARLY_MS = 5 * 60_000;
/** FR-N7: no welcome under 15 min away; one line up to 8 h; the full card after. */
export const AWAY_MIN_MS = 15 * 60_000;
export const AWAY_FULL_MS = 8 * 3_600_000;
/** DS-9: lists cap at 7 (log-off items, Log in rows). */
export const PAUSE_LIST_CAP = 7;
/** FR-N4: with this many characters, Ready rows fold into one line of glyphs. */
export const READY_FOLD_AT = 6;
/** FR-N3: a cap pill on this many rows becomes one roster finding. */
export const FINDING_AT = 3;

export interface WhoToken {
  index: number;
  family: ClassFamily;
  /** "Bowman 60": class and level, the who-token (DS-13). */
  label: string;
}

export interface CounterView {
  /** Verdict blockers left: each character with a Fix once, each account blocker once. */
  count: number;
  /** "2 fixes before you leave", or the All set line at zero. */
  line: string;
  /** The words after the big number ("fixes before you leave"). */
  sentence: string;
  /** At zero, with every character judged or folded: the campfire state. */
  allSet: { text: string; covered: boolean; firstFill: string | null } | null;
  /** The first blocker in Visit Order as a button row (who · where · how long, then its verb). */
  first: null | {
    key: string;
    /** null for an account blocker. */
    who: WhoToken | null;
    where: string | null;
    /** Only with a real `fixSeconds` (D-10: none ship yet), so always null today (DS-3, DS-23). */
    howLong: string | null;
    text: string;
  };
  /** FR-N2: Unknown characters (and an Unknown account safety) aren't counted; they sit in a fold. */
  unknown: { count: number; text: string; indexes: number[]; account: boolean } | null;
}

export interface GroupedJobView {
  entryId: string;
  /** "Same job on 8 characters". */
  heading: string;
  /** The sentence, said once. */
  text: string;
  /** Every row in it is a Fix (the card takes the Fix tone). */
  blocker: boolean;
  /** `cards.shared-job` One trip, map by map: the biggest stop first, then Visit Order. */
  stops: { map: string | null; chips: (WhoToken & { detail: string | null })[] }[];
}

export interface FindingView {
  entryId: string;
  /** The cap pill's own label ("Anvil full · collect"), for the glyph. */
  label: string;
  /** "Anvil full on 6 · collect". */
  text: string;
  count: number;
  indexes: number[];
  /** Full now on at least one row (else the soon state). */
  fullNow: boolean;
}

export interface RowMark {
  /** The grouped job this row's sentence went into, or null. */
  group: string | null;
  /** Cap pills said once as a finding: the row shows only their glyph. */
  inFindings: string[];
}

export interface LoginRow {
  key: string;
  text: string;
  kind: 'limit' | 'reset' | 'level';
  /** For a level row: the character, so the row can open its Build tab. */
  index: number | null;
}

export interface AwayView {
  size: 'line' | 'card';
  awayMs: number;
  /** "Welcome back · away 1h 20m · 2 things filled", or the card's title. */
  text: string;
  /** The card's rows (levels, limits, resets), at most 7. */
  rows: LoginRow[];
  first: CounterView['first'];
}

export interface LogoffItem {
  /** `c<index>` for a character's first blocker, the Next Action key for an account blocker. */
  key: string;
  who: WhoToken | null;
  where: string | null;
  text: string;
}

export interface NowSessionView extends SessionView {
  tab: PauseTab;
  why: string;
  manual: boolean;
  /** Why the automatic pick was made (for tests and the golden). */
  reason: 'login' | 'logoff-return' | 'logoff-visited' | 'logoff-long' | 'rounds';
  counter: CounterView;
  groups: GroupedJobView[];
  findings: FindingView[];
  marks: Record<number, RowMark>;
  /** FR-N4: the Ready rows that fold into "4 ready" (6 or more characters), in Visit Order. */
  readyFold: number[];
  login: { rows: LoginRow[]; more: number } | null;
  away: AwayView | null;
  logoff: { items: LogoffItem[]; more: number };
  facts: SessionFacts | null;
}

type SessionRuntime = SessionFacts & { groupTexts?: Record<string, string> };

const familyOf = (view: NowView, i: number): ClassFamily => view.families?.[i] ?? 'beginner';
const whoOf = (view: NowView, row: RosterRow): WhoToken => ({
  index: row.index,
  family: familyOf(view, row.index),
  label: `${row.classLabel} ${row.level}`,
});

/** The entry id of the sentence a Roster row shows (its first blocker or top Goal), from the result. */
function rowEntry(result: EngineResult, row: RosterRow): string | null {
  if (!row.summary) return null;
  const c = result.characters.find((x) => x.index === row.index);
  const g = c?.goals.find((x) => x.nextAction.text === row.summary);
  return g?.nextAction.entryId ?? null;
}

const firstNumber = (text: string): string | null => /\d[\d,]*/.exec(text)?.[0] ?? null;

/** FR-N2: the counter, from the Now view alone (the golden's `## Now` prints it too). */
export function counterOf(view: NowView): CounterView {
  const fixRows = view.roster.filter((r) => r.pill.kind === 'fix');
  const count = fixRows.length + view.account.blockers.length;
  const unknownRows = view.roster.filter((r) => r.pill.kind === 'unknown');
  const accountUnknown = view.account.safetyUnknown !== null && !view.account.safetyUnknown.skipped;
  const unknownCount = unknownRows.length + (accountUnknown ? 1 : 0);
  const firstRow = fixRows[0];
  const firstAccount = view.account.blockers[0];
  const first: CounterView['first'] = firstRow
    ? {
        key: `c${firstRow.index}`,
        who: whoOf(view, firstRow),
        where: firstRow.map,
        howLong: null,
        text: firstRow.summary,
      }
    : firstAccount
      ? {
          key: firstAccount.action.key,
          who: null,
          where: null,
          howLong: null,
          text: firstAccount.action.text,
        }
      : null;
  const a = view.allSet;
  return {
    count,
    line: count === 0 && a ? a.text : COUNTER_WORDS.line(count),
    sentence: COUNTER_WORDS.sentence(count),
    allSet: count === 0 && a ? { text: a.text, covered: a.covered, firstFill: a.detail } : null,
    first,
    unknown:
      unknownCount > 0
        ? {
            count: unknownCount,
            text: COUNTER_WORDS.unknownFold(unknownCount),
            indexes: unknownRows.map((r) => r.index),
            account: accountUnknown,
          }
        : null,
  };
}

/** FR-N4: the Ready rows that fold into one line, with 6 or more characters. */
export function readyFoldOf(view: NowView): number[] {
  return view.roster.length >= READY_FOLD_AT
    ? view.roster.filter((r) => r.pill.kind === 'ready').map((r) => r.index)
    : [];
}

function groupsOf(view: NowView, result: EngineResult, texts: Record<string, string>): GroupedJobView[] {
  const by = new Map<string, RosterRow[]>();
  for (const row of view.roster) {
    const id = rowEntry(result, row);
    if (id) by.set(id, [...(by.get(id) ?? []), row]);
  }
  const out: GroupedJobView[] = [];
  for (const [entryId, rows] of by) {
    if (rows.length < 2) continue;
    const same = rows.every((r) => r.summary === rows[0]?.summary);
    const text = texts[entryId] ?? (same ? rows[0]?.summary : null);
    if (!text) continue;
    const maps = new Map<string | null, RosterRow[]>();
    for (const r of rows) maps.set(r.map, [...(maps.get(r.map) ?? []), r]);
    const stops = [...maps]
      .sort((x, y) => y[1].length - x[1].length)
      .map(([map, rs]) => ({
        map,
        chips: rs.map((r) => ({ ...whoOf(view, r), detail: same ? null : firstNumber(r.summary) })),
      }));
    out.push({
      entryId,
      heading: GROUP_WORDS.sameJob(rows.length),
      text,
      blocker: rows.every((r) => r.pill.kind === 'fix'),
      stops,
    });
  }
  return out;
}

/** FR-N3, DS-7: cap pills on 3 or more rows, from the Now view alone. */
export function findingsOf(view: NowView): FindingView[] {
  const by = new Map<string, { label: string; rows: number[]; full: boolean }>();
  for (const row of view.roster)
    for (const c of row.caps) {
      const f = by.get(c.entryId) ?? { label: c.label, rows: [], full: false };
      f.rows.push(row.index);
      f.full ||= c.fullNow;
      by.set(c.entryId, f);
    }
  return [...by]
    .filter(([, f]) => f.rows.length >= FINDING_AT)
    .map(([entryId, f]) => ({
      entryId,
      label: f.label,
      text: GROUP_WORDS.finding(f.label, f.rows.length),
      count: f.rows.length,
      indexes: f.rows,
      fullNow: f.full,
    }));
}

/** Timeline bars that bound between the previous session's end and now, grouped by what (DS-7). */
function limitRows(result: EngineResult, from: number): LoginRow[] {
  const bars = (result.timeline ?? []).filter(
    (b: TimelineBar) =>
      b.effect !== 'info' && !b.untimed && (b.at === null ? true : b.at > from && b.at <= result.asOf),
  );
  const by = new Map<string, { what: string; word: string; subjects: Set<string> }>();
  for (const b of bars) {
    const k = `${b.what}|${b.kind}`;
    const g = by.get(k) ?? { what: b.what, word: KIND_WORDS[b.kind], subjects: new Set() };
    g.subjects.add(b.subject);
    by.set(k, g);
  }
  return [...by].map(([k, g]) => ({
    key: `limit:${k}`,
    text: PAUSE_WORDS.limits(g.what[0]?.toUpperCase() + g.what.slice(1), g.word, g.subjects.size),
    kind: 'limit' as const,
    index: null,
  }));
}

const DAY = 86_400_000;
/** Checklist rows whose daily or weekly reset passed while away, one line per clock. */
function resetRows(result: EngineResult, from: number): LoginRow[] {
  const rows = result.checklist?.rows ?? [];
  const passed = (clock: string, end: number | null) => {
    if (end === null) return false;
    const len = clock === 'daily' ? DAY : clock.endsWith('week') ? 7 * DAY : 0;
    return len > 0 && end - len > from;
  };
  const out: LoginRow[] = [];
  const daily = rows.filter((r) => r.clock === 'daily' && r.state === 'todo' && passed(r.clock, r.periodEnd));
  const weekly = rows.filter(
    (r) => r.clock.endsWith('week') && r.state === 'todo' && passed(r.clock, r.periodEnd),
  );
  if (daily.length)
    out.push({
      key: 'reset:daily',
      text: PAUSE_WORDS.resets(PAUSE_WORDS.daily, daily.length),
      kind: 'reset',
      index: null,
    });
  if (weekly.length)
    out.push({
      key: 'reset:weekly',
      text: PAUSE_WORDS.resets(PAUSE_WORDS.weekly, weekly.length),
      kind: 'reset',
      index: null,
    });
  return out;
}

function levelRows(view: NowView, facts: SessionFacts): LoginRow[] {
  return facts.levelGains.flatMap((g) => {
    const row = view.roster.find((r) => r.index === g.characterIndex);
    if (!row) return [];
    return [
      {
        key: `level:${g.characterIndex}`,
        text: PAUSE_WORDS.levels(g.to - g.from, `${row.classLabel} ${row.level}`),
        kind: 'level' as const,
        index: g.characterIndex,
      },
    ];
  });
}

export function buildSessionView(view: NowView, result: EngineResult, ui: SessionUi): NowSessionView {
  const facts = (result.session ?? null) as SessionRuntime | null;
  const counter = counterOf(view);
  const groups = groupsOf(view, result, facts?.groupTexts ?? {});
  const findings = findingsOf(view);
  const marks: Record<number, RowMark> = {};
  for (const row of view.roster) marks[row.index] = { group: null, inFindings: [] };
  for (const g of groups)
    for (const st of g.stops)
      for (const c of st.chips) {
        const m = marks[c.index];
        if (m) m.group = g.entryId;
      }
  for (const f of findings)
    for (const i of f.indexes) {
      const m = marks[i];
      if (m) m.inFindings.push(f.entryId);
    }
  const readyFold = readyFoldOf(view);

  // ---- the pause point (FR-N6): the first rule that applies ----
  const asOf = result.asOf;
  const start = facts?.sessionStartedAt ?? null;
  const prevEnd = facts?.previousSessionEndedAt ?? null;
  const awayMs = start !== null && prevEnd !== null ? start - prevEnd : null;
  const fixIndexes = view.roster.filter((r) => r.pill.kind === 'fix').map((r) => r.index);
  const visited = new Set(ui.visited);
  const median = facts?.medianSessionMs ?? null;
  let reason: NowSessionView['reason'];
  if (start !== null && asOf - start < LOGIN_WINDOW_MS && awayMs !== null && awayMs >= LOGIN_GAP_MS)
    reason = 'login';
  else if (ui.returnChangedThisSession) reason = 'logoff-return';
  else if (counter.count <= LOGOFF_MAX_COUNT && fixIndexes.every((i) => visited.has(i)))
    reason = 'logoff-visited';
  else if (median !== null && start !== null && asOf - start > median - LOGOFF_EARLY_MS)
    reason = 'logoff-long';
  else reason = 'rounds';
  const auto: PauseTab = reason === 'login' ? 'login' : reason === 'rounds' ? 'rounds' : 'logoff';
  const tab = ui.manualTab ?? auto;
  const why =
    ui.manualTab !== null
      ? PAUSE_WORDS.why.manual(PAUSE_WORDS.tabs[ui.manualTab])
      : reason === 'login'
        ? PAUSE_WORDS.why.login(span(awayMs ?? 0))
        : reason === 'logoff-return'
          ? PAUSE_WORDS.why.logoffReturn
          : reason === 'logoff-visited'
            ? PAUSE_WORDS.why.logoffVisited
            : reason === 'logoff-long'
              ? PAUSE_WORDS.why.logoffLong
              : PAUSE_WORDS.why.rounds;

  // ---- Log in: the Away card and what changed (FR-N6, FR-N7) ----
  let login: NowSessionView['login'] = null;
  let away: AwayView | null = null;
  if (facts && prevEnd !== null && awayMs !== null) {
    const limits = limitRows(result, prevEnd);
    const all = [...levelRows(view, facts), ...limits, ...resetRows(result, prevEnd)];
    login = { rows: all.slice(0, PAUSE_LIST_CAP), more: Math.max(0, all.length - PAUSE_LIST_CAP) };
    if (awayMs >= AWAY_MIN_MS)
      away =
        awayMs > AWAY_FULL_MS
          ? {
              size: 'card',
              awayMs,
              text: AWAY_WORDS.title(span(awayMs)),
              rows: all.slice(0, PAUSE_LIST_CAP),
              first: counter.first,
            }
          : {
              size: 'line',
              awayMs,
              text: AWAY_WORDS.oneLine(span(awayMs), limits.length),
              rows: [],
              first: counter.first,
            };
  }

  // ---- Log off: every Verdict blocker, at most 7 (FR-N6) ----
  const items: LogoffItem[] = [
    ...view.roster
      .filter((r) => r.pill.kind === 'fix')
      .map((r) => ({ key: `c${r.index}`, who: whoOf(view, r), where: r.map, text: r.summary })),
    ...view.account.blockers.map((g) => ({ key: g.action.key, who: null, where: null, text: g.action.text })),
  ];

  return {
    tab,
    why,
    manual: ui.manualTab !== null,
    reason,
    counter,
    groups,
    findings,
    marks,
    readyFold,
    login,
    away,
    logoff: { items: items.slice(0, PAUSE_LIST_CAP), more: Math.max(0, items.length - PAUSE_LIST_CAP) },
    facts: facts
      ? {
          sessionStartedAt: facts.sessionStartedAt,
          previousSessionEndedAt: facts.previousSessionEndedAt,
          medianSessionMs: facts.medianSessionMs,
          levelGains: facts.levelGains,
        }
      : null,
  };
}

/**
 * The answer-first lines for the golden's `## Now` (TR-14): the counter, the first fix, the Unknown fold,
 * the roster findings and the Ready fold. All of them come from the Now view alone; the grouped jobs and
 * the pause point need the session module and the Play Session, so the view tests cover them.
 */
export function counterLines(view: NowView): string[] {
  const c = counterOf(view);
  const fold = readyFoldOf(view);
  return [
    `counter: ${c.line}`,
    ...(c.first
      ? [`first: ${[c.first.who?.label, c.first.where, c.first.text].filter(Boolean).join(' · ')}`]
      : []),
    ...(c.unknown ? [`fold: ${c.unknown.text}`] : []),
    ...findingsOf(view).map((f) => `finding: ${f.text}`),
    ...(fold.length ? [`ready fold: ${plural(fold.length, 'character')}`] : []),
  ];
}
