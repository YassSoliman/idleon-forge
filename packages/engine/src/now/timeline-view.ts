// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `buildTimelineView` (M17 TR-6): the Timeline place, pure and deterministic, beside `buildNowView`.
// Every bar is a limit a module already timed (`EngineResult.timeline`, M3 and M6): the view never
// computes a time of its own (D-18). It places the bars on one axis (D-16), flags what binds before
// the return (FR-25), finds each fix where Now shows it (FR-27) and says each repeat once.
//
// Lanes (FR-28, D-17): one per character in the Roster's frozen Visit Order, then one per System with
// account bars, in registry order. Every string is a module's text, a registry name, a character's
// name, a time or a word from `view-words.ts` (TR-9).
import type { EngineResult, Goal, Subject, TimelineBar } from '../result';
import { ACCOUNT_GOAL_CAP, CHARACTER_GOAL_CAP } from './build-now-view';
import { clockAt, inSpan, span } from './format';
import { dismissActive, type NowPrefs, type SessionClock, skipActive } from './prefs';
import type { AfkStripView, NowView, TimelineBarView, TimelineFix, TimelineLane, TimelineView } from './view';
import { KIND_WORDS, TIMELINE_WORDS as W } from './view-words';

export interface TimelineUi {
  now: number;
  /** The account's last cloud save: its age decides the stale banner (§6) and when a Skip today ends. */
  lastCloudSave?: number | null;
  /** Minutes east of UTC, for "01:20" clock times; 0 in goldens. */
  tzOffsetMinutes?: number;
}

const HOUR = 3_600_000;
/** A cap pill's time ("in 14h 04m", "in 45m", "in about 5h", "now"), which a Timeline bar says itself. */
const PILL_TIME = / (?:in about [^·]+?|in \d+[dhm](?: \d+[dhm])?|now)(?= ·|$)/;

/** M15 F5's Behind Goal (metapath/behind.ts BEHIND_ID; the view layer imports no Knowledge, M10 TR-1). */
const BEHIND_ID = 'metapath.goal.behind';

/** FR-29, D-16: now to the later of now + 12 h and the return + 25 %, capped at 48 h, always past the return + 1 h. */
export function timelineAxisEnd(now: number, returnAt: number, expectedReturnMs: number): number {
  const wanted = Math.max(now + 12 * HOUR, returnAt + 0.25 * expectedReturnMs);
  return Math.max(Math.min(wanted, now + 48 * HOUR), returnAt + HOUR);
}

function ticksOf(start: number, end: number): { at: number; x: number; label: string }[] {
  const hours = (end - start) / HOUR;
  const step = hours <= 12 ? 2 : hours <= 24 ? 4 : hours <= 36 ? 6 : 12;
  const out: { at: number; x: number; label: string }[] = [];
  for (let h = step; h < hours; h += step) {
    const at = start + h * HOUR;
    out.push({ at, x: (at - start) / (end - start), label: W.tick(h) });
  }
  return out;
}

/**
 * Where each Next Action is shown on Now (FR-27): the character's Now tab or the Account section, and
 * whether "show more" or the Behind Goal's details must open first. Mirrors `buildNowView`'s caps.
 */
function fixIndex(
  result: EngineResult,
  open: (key: string) => boolean,
): Map<string, Omit<TimelineFix, 'key'> & { key: string }> {
  const out = new Map<string, Omit<TimelineFix, 'key'> & { key: string }>();
  const stageUnknown = result.stage.id === 'unknown';
  const place = (goals: readonly Goal[], subject: Subject, cap: number, blockerKeys: ReadonlySet<string>) => {
    let n = 0;
    for (const g of goals) {
      const key = g.nextAction.key;
      const blocker = g.category === 'blocker' || blockerKeys.has(key);
      // Stage unknown (M10 §6): only blockers render on Now, so only they have a fix link.
      if (!blocker && stageUnknown) continue;
      const where = subject === 'account' ? ('account' as const) : ('focus' as const);
      if (blocker || !open(key)) {
        out.set(key, { subject, key, where, expand: null });
        continue;
      }
      out.set(key, { subject, key, where, expand: n >= cap ? 'show-more' : null });
      n++;
    }
  };
  for (const c of result.characters)
    place(c.goals, `c${c.index}`, CHARACTER_GOAL_CAP, new Set(c.verdict.blockerKeys));
  place(result.account.goals, 'account', ACCOUNT_GOAL_CAP, new Set(result.account.blockerKeys));
  // A finding M15 F5 moved into the Behind Goal is fixed from that Goal's details (FR-27).
  const behind = result.account.goals.find((g) => g.id === BEHIND_ID);
  const chosen = result.behindSystems?.find((r) => r.chosen);
  if (behind && chosen && !stageUnknown) {
    const at = out.get(behind.nextAction.key);
    for (const k of chosen.findingKeys)
      if (!out.has(k))
        out.set(k, {
          subject: 'account',
          key: behind.nextAction.key,
          where: 'account',
          expand: at?.expand === 'show-more' ? 'show-more' : 'behind-details',
        });
  }
  return out;
}

/** The producer's own text for a key (a Next Action's), for a limit whose fix doesn't hold (FR-25 c). */
function textByKey(result: EngineResult): Map<string, string> {
  const out = new Map<string, string>();
  for (const c of result.characters) for (const g of c.goals) out.set(g.nextAction.key, g.nextAction.text);
  for (const g of result.account.goals) out.set(g.nextAction.key, g.nextAction.text);
  return out;
}

export function buildTimelineView(
  result: EngineResult,
  prefs: NowPrefs,
  nowView: Pick<NowView, 'roster'>,
  ui: TimelineUi,
): TimelineView | null {
  if (result.returnAt === undefined) return null;
  const now = ui.now;
  const tz = ui.tzOffsetMinutes ?? 0;
  const returnAt = result.returnAt;
  const erMs = result.expectedReturn.usedSeconds * 1000;
  const start = now;
  const end = timelineAxisEnd(now, returnAt, erMs);
  const xOf = (at: number) => Math.min(1, Math.max(0, (at - start) / (end - start)));

  const clock: SessionClock = {
    now,
    sessionStartedAt: result.sessionStartedAt,
    lastCloudSave: ui.lastCloudSave ?? null,
  };
  const skipped = (key: string) => {
    const s = prefs.skips[key];
    return s !== undefined && skipActive(s, clock);
  };
  const dismissed = (key: string) => {
    const d = prefs.dismissals[key];
    return d !== undefined && dismissActive(d, result.versions.gameBuild);
  };
  const fixes = fixIndex(result, (k) => !skipped(k) && !dismissed(k));
  const texts = textByKey(result);
  const pillLabels = new Map(
    result.characters.flatMap((c) =>
      (c.info ?? []).filter((l) => l.kind === 'cap').map((l) => [l.key, l.label ?? l.text] as const),
    ),
  );
  const names = new Map(result.characters.map((c) => [c.index, c.name]));

  const view = (b: TimelineBar): TimelineBarView => {
    const kindWord = KIND_WORDS[b.kind];
    const fullNow = b.at !== null && b.at <= now;
    const presentState = b.at === null && !b.untimed;
    const later = b.at !== null && b.at > end;
    const beforeReturn = fullNow || presentState || (b.at !== null && b.at <= returnAt);
    const state = skipped(b.key) ? 'skipped' : dismissed(b.key) ? 'dismissed' : 'open';
    const fixable = b.effect === 'blocker' || (b.effect === 'next-action' && b.fixHolds);
    const outlined = beforeReturn && state === 'open' && fixable;
    const label =
      b.effect === 'pill'
        ? // The bar says when, once, in its own format: drop the pill's "in 5h 04m" (R6 QA; M21 FR-F6's
          // `{x:in}`, or a legacy "in about 5h").
          (pillLabels.get(b.key)?.replace(PILL_TIME, '') ?? `${b.what} ${kindWord}`)
        : presentState
          ? b.what
          : `${b.what} ${kindWord}`;
    const at = b.at;
    const timeText = b.untimed
      ? W.cantTell
      : at === null || at <= now
        ? W.now
        : `${later ? `${W.later} · ` : ''}${inSpan(at - now)} · ${clockAt(at, tz)}`;
    const flag =
      state === 'skipped' ? W.skipped : state === 'dismissed' ? W.dismissed : outlined ? W.beforeBack : null;
    const where = b.untimed
      ? W.cantTell
      : at === null || at <= now
        ? `${W.now}${beforeReturn && fixable ? `, ${W.beforeBack}` : ''}`
        : `${inSpan(at - now)}, ${W.at(clockAt(at, tz))}, ${at <= returnAt ? W.beforeBack : W.afterBack}`;
    const a11y = `${label}${b.untimed ? ', ' : ' '}${where}${state === 'open' ? '' : `, ${flag}`}`;
    const found = fixes.get(b.key);
    const fix: TimelineFix | null =
      b.effect === 'pill'
        ? { subject: b.subject, key: b.key, where: 'pill', expand: null }
        : beforeReturn && fixable && found
          ? found
          : null;
    const note =
      beforeReturn && b.effect === 'next-action' && !b.fixHolds && !b.untimed
        ? (texts.get(b.key) ?? null)
        : null;
    const x = b.untimed ? null : at === null ? 0 : xOf(at);
    return {
      barId: b.barId,
      key: b.key,
      entryId: b.entryId,
      system: b.system,
      kind: b.kind,
      what: b.what,
      kindWord,
      label,
      at,
      untimed: b.untimed,
      fullNow,
      later,
      beforeReturn,
      outlined,
      hatched: outlined,
      effect: b.effect,
      state,
      timeText,
      flag,
      note,
      a11y,
      fix,
      x,
      hatchTo: outlined ? xOf(returnAt) : null,
      group: null,
    };
  };

  const bySubject = new Map<string, TimelineBar[]>();
  for (const b of result.timeline ?? []) {
    const id = b.subject === 'account' ? `account:${b.system}` : b.subject;
    bySubject.set(id, [...(bySubject.get(id) ?? []), b]);
  }
  const order = (bars: TimelineBar[]) => {
    const views = bars.map(view);
    const timed = views
      .filter((v) => !v.untimed)
      .sort((a, b) => (a.at ?? -1) - (b.at ?? -1) || (a.barId < b.barId ? -1 : a.barId > b.barId ? 1 : 0));
    const seen = new Set<string>();
    const untimed = views.filter((v) => {
      if (!v.untimed || seen.has(v.label)) return false;
      seen.add(v.label);
      return true;
    });
    return { bars: timed, untimed };
  };

  const lanes: TimelineLane[] = nowView.roster.map((row) => ({
    id: `c${row.index}` as Subject,
    kind: 'character',
    index: row.index,
    systemId: null,
    position: row.position,
    heading: `${row.position} · ${row.name}`,
    detail: [`${row.classLabel} lv ${row.level}`, row.activity, row.map].filter(Boolean).join(' · '),
    short: `${row.position} · ${row.classLabel} ${row.level}`,
    verdict: row.pill,
    ...order(bySubject.get(`c${row.index}`) ?? []),
  }));
  const systemOrder = (result.systems ?? []).map((s) => s.id);
  const rank = (id: string) => {
    const i = systemOrder.indexOf(id);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  const accountIds = [...bySubject.keys()]
    .filter((k) => k.startsWith('account:'))
    .map((k) => k.slice('account:'.length))
    .sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : 1));
  const accountLanes: TimelineLane[] = accountIds.map((id) => {
    const name = result.systems?.find((s) => s.id === id)?.name ?? id;
    return {
      id: `account:${id}`,
      kind: 'account',
      index: null,
      systemId: id,
      position: null,
      heading: name,
      detail: null,
      short: name,
      verdict: null,
      ...order(bySubject.get(`account:${id}`) ?? []),
    };
  });

  // Design Lab: a sentence that repeats on several characters is said once, "the same on n more".
  // A bar with its own fix link (outlined, or skipped with a fix) keeps its own line: each fix is
  // that character's.
  const groups = new Map<string, { lane: TimelineLane; bar: TimelineBarView }[]>();
  for (const lane of lanes)
    for (const bar of [...lane.bars, ...lane.untimed]) {
      if (bar.fix && bar.fix.where !== 'pill') continue;
      const id = [bar.effect, bar.label, bar.timeText, bar.state, bar.outlined].join('|');
      groups.set(id, [...(groups.get(id) ?? []), { lane, bar }]);
    }
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const [first, ...rest] = members;
    if (!first) continue;
    first.bar.group = {
      first: true,
      more: rest.map((m) => ({
        index: m.lane.index ?? -1,
        name: names.get(m.lane.index ?? -1) ?? '',
        key: m.bar.key,
      })),
    };
    for (const m of rest) m.bar.group = { first: false, more: [] };
  }

  const all = [...lanes, ...accountLanes].flatMap((l) => l.bars);
  const future = all.flatMap((b) => (b.at !== null && b.at > now ? [b.at] : []));
  const age = ui.lastCloudSave != null ? now - ui.lastCloudSave : null;
  const stale =
    age !== null && age > erMs ? { text: W.stale(span(age)), band: W.sinceSave(span(age)) } : null;
  return {
    axis: {
      start,
      end,
      returnAt,
      backX: xOf(returnAt),
      backLabel: W.back(returnAt > now ? inSpan(returnAt - now) : W.now, clockAt(returnAt, tz)),
      ticks: ticksOf(start, end),
    },
    lanes,
    accountLanes,
    accountNote: result.account.safety === 'unknown' ? W.accountCantTell : null,
    stale,
    empty: all.some((b) => b.outlined) ? null : W.nothingBefore,
    nextExpiry: future.length ? Math.min(...future) : null,
  };
}

/**
 * M21 FR-T5: the compact AFK strip on Now, from the Timeline's bars on a shared axis to the Back marker.
 * Owned by area T (Integration places it on Now). Phase F declares the signature so the shell's view
 * slot exists; it returns null until area T builds it.
 */
export function buildAfkStripView(_timeline: TimelineView | null, _view: NowView): AfkStripView | null {
  return null;
}
