// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (area I-now): what the Now place draws, read off the engine's own views (the Now view, the
// Timeline view, the session view, the checklist). Pure and small; it adds no judgement. It only groups
// what the engine already decided ("full now", "before you're back", Visit Order) into the boards' parts:
// the hero's verdict word, the cards' state words, the mini-timeline's marks, the Away line.
import type {
  ChecklistView,
  NowView,
  RosterRow,
  TimelineBarView,
  TimelineLane,
  TimelineView,
} from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';

/** One limit that is full now on some characters: "Worship charge" on 5. */
export interface FullGroup {
  entryId: string;
  /** The producer's words, "worship charge". */
  what: string;
  /** The cap pill's verb, "spend" from "Worship full · spend"; null without one. */
  verb: string | null;
  /** Characters, in Visit Order. */
  indexes: number[];
}

/** An account limit losing value now ("Colosseum tickets lost"), with the Goal that fixes it. */
export interface LossNow {
  entryId: string;
  label: string;
  /** The account Goal's own sentence ("Collect 4 Colosseum tickets"); null when it has none. */
  action: string | null;
}

export type CardState = 'fix' | 'collect' | 'ready' | 'unknown';
export type HeroState = 'fix' | 'collect' | 'ready' | 'unknown';

const open = (b: TimelineBarView) => b.state === 'open' && !b.untimed;
const charLanes = (t: TimelineView | null): TimelineLane[] =>
  (t?.lanes ?? []).filter((l) => l.kind === 'character' && l.index !== null);
const accountLanes = (t: TimelineView | null): TimelineLane[] => [
  ...(t?.lanes ?? []).filter((l) => l.kind === 'account'),
  ...(t?.accountLanes ?? []),
];
const verbOf = (label: string): string | null => label.split(' · ')[1]?.trim() || null;

/** Visit Order position of each character (1-based), for sorting. */
const orderOf = (view: NowView) => new Map(view.roster.map((r) => [r.index, r.position] as const));

/**
 * The limits already full on characters (the Roster's cap pills that are full now), biggest group first,
 * then the first in Visit Order. The words come from the Timeline's bar for the same entry when there is
 * one ("worship charge"), else from the pill's own label ("Anvil full · collect" → "anvil").
 */
export function fullGroups(timeline: TimelineView | null, view: NowView): FullGroup[] {
  const whatOf = new Map<string, string>();
  for (const lane of charLanes(timeline))
    for (const b of lane.bars) if (!whatOf.has(b.entryId)) whatOf.set(b.entryId, b.what);
  const by = new Map<string, FullGroup>();
  for (const row of view.roster)
    for (const c of row.caps) {
      if (!c.fullNow) continue;
      const head = (c.label.split(' · ')[0] ?? c.label).replace(/\s+full$/i, '').toLowerCase();
      // One group per thing that is full: two entries for the same producer ("worship charge" with and
      // without a skull) are one line.
      const what = whatOf.get(c.entryId) ?? head;
      const g = by.get(what) ?? { entryId: c.entryId, what, verb: verbOf(c.label), indexes: [] };
      if (!g.indexes.includes(row.index)) g.indexes.push(row.index);
      by.set(what, g);
    }
  const order = orderOf(view);
  const pos = (i: number) => order.get(i) ?? 99;
  return [...by.values()].sort(
    (a, z) => z.indexes.length - a.indexes.length || pos(a.indexes[0] ?? 0) - pos(z.indexes[0] ?? 0),
  );
}

/** Account limits that bound already and lose value while they wait (the bank kind: "tickets lost"). */
export function lossesNow(timeline: TimelineView | null, view: NowView): LossNow[] {
  const out: LossNow[] = [];
  for (const lane of accountLanes(timeline))
    for (const b of lane.bars) {
      if (!open(b) || !b.fullNow || !(b.kind === 'bank' || b.kindWord === 'lost')) continue;
      if (out.some((o) => o.entryId === b.entryId)) continue;
      const goal = view.account.goals.find((g) => g.action.entryId === b.entryId);
      out.push({ entryId: b.entryId, label: b.label, action: goal?.action.text ?? null });
    }
  return out;
}

/** The characters with something full now. */
export const fullSet = (groups: readonly FullGroup[]): Set<number> =>
  new Set(groups.flatMap((g) => g.indexes));

/** A card's one state word: the Verdict first (Fix, Unknown), then "Collect" when something is full now. */
export function cardState(row: RosterRow, full: ReadonlySet<number>): CardState {
  if (row.pill.kind === 'fix') return 'fix';
  if (row.pill.kind === 'unknown') return 'unknown';
  return full.has(row.index) ? 'collect' : 'ready';
}

/**
 * Every character's one state word, keyed by index: the same `cardState` Now's cards and the Characters
 * grid use, so the Character page's header, strip and Next tile never say "ready" where they say
 * "Collect" (M24 QA P1-10). Who is full now comes from the Roster's cap pills alone (`fullGroups` only
 * reads the Timeline for its words), so no Timeline is needed.
 */
export function characterStates(view: NowView): Map<number, CardState> {
  const full = fullSet(fullGroups(null, view));
  return new Map(view.roster.map((r) => [r.index, cardState(r, full)] as const));
}

/** The hero's verdict: fixes first; else collect what is full; else ready; Unknown when nothing is judged. */
export function heroState(
  count: number,
  allSet: { covered: boolean } | null,
  groups: readonly FullGroup[],
): HeroState {
  if (count > 0) return 'fix';
  if (groups.length > 0) return 'collect';
  return allSet ? 'ready' : 'unknown';
}

/** The colour of each state word and its pip (rule 7): coral losing now, gold do it, mint fine, grey later. */
export const STATE_TONE: Record<CardState, 'coral' | 'gold' | 'mint' | 'muted'> = {
  fix: 'coral',
  collect: 'gold',
  ready: 'mint',
  unknown: 'muted',
};

/** The Pip tone of each state (grey has no tone). */
export const PIP: Record<CardState, 'coral' | 'gold' | 'mint' | undefined> = {
  fix: 'coral',
  collect: 'gold',
  ready: 'mint',
  unknown: undefined,
};

export interface Mark {
  key: string;
  /** A character's index, or null for an account limit. */
  index: number | null;
  /** 0 (now) to 1 (you're back). */
  x: number;
  /** Which of the two rows it sits on, so close marks don't overlap. */
  row: 0 | 1;
  what: string;
  label: string;
  /** The limit's System id ("refinery"), for its sprite. */
  system: string;
  a11y: string;
}

/**
 * The mini-timeline between now and you're back: each character's next limit after now, and every
 * account limit after now, on a 0..1 axis. A limit already full is the hero's, not the timeline's.
 */
export function miniMarks(
  timeline: TimelineView | null,
  view: NowView,
  when: (at: number) => string,
): Mark[] {
  if (!timeline) return [];
  const { start, returnAt } = timeline.axis;
  const span = Math.max(1, returnAt - start);
  const rows = new Map(view.roster.map((r) => [r.index, r] as const));
  const marks: Omit<Mark, 'row'>[] = [];
  const within = (b: TimelineBarView) => open(b) && b.at !== null && b.at > start && b.at <= returnAt;
  for (const lane of charLanes(timeline)) {
    const r = rows.get(lane.index as number);
    const b = r ? lane.bars.filter(within).sort((a, z) => (a.at ?? 0) - (z.at ?? 0))[0] : undefined;
    if (!r || !b || b.at === null) continue;
    const who = `${r.classLabel} ${r.level}`;
    marks.push({
      key: b.key,
      index: r.index,
      x: (b.at - start) / span,
      what: b.what,
      label: b.label,
      system: b.system,
      a11y: `${who}: ${b.label} ${when(b.at)}`,
    });
  }
  for (const lane of accountLanes(timeline))
    for (const b of lane.bars.filter(within))
      marks.push({
        key: b.key,
        index: null,
        x: ((b.at as number) - start) / span,
        what: b.what,
        label: b.label,
        system: b.system,
        a11y: `${b.label} ${when(b.at as number)}`,
      });
  marks.sort((a, z) => a.x - z.x);
  // Close marks alternate rows (a mark is 24 px; 4 % of a 700 px axis is about 28 px).
  let last = -1;
  let row: 0 | 1 = 1;
  return marks.map((m) => {
    row = m.x - last < 0.04 ? (row === 0 ? 1 : 0) : 0;
    last = m.x;
    return { ...m, row };
  });
}

/** A character's next limit after now, for the card's blue timer; null when nothing is timed. */
export function nextLimit(
  timeline: TimelineView | null,
  index: number,
): { label: string; at: number } | null {
  const lane = charLanes(timeline).find((l) => l.index === index);
  const start = timeline?.axis.start ?? 0;
  const b = lane?.bars
    .filter((x) => open(x) && x.at !== null && x.at > start)
    .sort((a, z) => (a.at ?? 0) - (z.at ?? 0))[0];
  return b && b.at !== null ? { label: b.label, at: b.at } : null;
}

/**
 * The limits the engine can't time, said once for the account (QA: not on every card): one line per
 * thing ("health food"), with how many characters it is on, in Visit Order.
 */
export function untimedGroups(
  timeline: TimelineView | null,
  view: NowView,
): { what: string; kindWord: string; indexes: number[] }[] {
  const order = orderOf(view);
  const by = new Map<string, { what: string; kindWord: string; indexes: number[] }>();
  for (const lane of charLanes(timeline)) {
    if (!order.has(lane.index as number)) continue;
    for (const b of lane.untimed) {
      if (b.state !== 'open') continue;
      const g = by.get(b.what) ?? { what: b.what, kindWord: b.kindWord, indexes: [] };
      if (!g.indexes.includes(lane.index as number)) g.indexes.push(lane.index as number);
      by.set(b.what, g);
    }
  }
  const pos = (i: number) => order.get(i) ?? 99;
  for (const g of by.values()) g.indexes.sort((a, z) => pos(a) - pos(z));
  return [...by.values()];
}

export interface Payer {
  index: number;
  label: string;
  lines: number;
  coins: number;
}

/** Characters with coins to spend, in Visit Order (the Spend card's payers). */
export function payersOf(view: NowView, result: EngineResult): Payer[] {
  return view.roster.flatMap((r) => {
    const c = result.characters.find((x) => x.index === r.index);
    return c?.spendChip
      ? [
          {
            index: r.index,
            label: `${r.classLabel} ${r.level}`,
            lines: c.spendChip.lines,
            coins: c.spendChip.coins,
          },
        ]
      : [];
  });
}

/** The rail's daily part: up to three rows lost at the reset, and what else is left today and this week. */
export function dailyPart(checklist: ChecklistView | null, cap = 3) {
  if (!checklist) return null;
  const todo = (band: string) =>
    checklist.bands.filter((b) => b.band === band).flatMap((b) => b.rows.filter((r) => r.state === 'todo'));
  const lost = todo('no-bank');
  const rest = [...lost.slice(cap), ...todo('banks')].length;
  return {
    ring: checklist.rings.today,
    text: checklist.dailyText,
    rows: lost.slice(0, cap),
    moreToday: rest,
    moreWeek: todo('weekly').length,
  };
}

/** The Away line's parts: what filled up, what is being lost, and whether everyone still fights. */
export function awayParts(
  groups: readonly FullGroup[],
  losses: readonly LossNow[],
  view: NowView,
  words: {
    filledUp(count: number, what: string): string;
    lost(label: string): string;
    allFighting(count: number): string;
  },
): string[] {
  const parts = [
    ...groups.map((g) => words.filledUp(g.indexes.length, g.indexes.length === 1 ? g.what : `${g.what}s`)),
    ...losses.map((l) => words.lost(l.label)),
  ];
  const fighting = view.roster.filter((r) => r.activity?.startsWith('Fighting'));
  if (view.roster.length > 0 && fighting.length === view.roster.length)
    parts.push(words.allFighting(view.roster.length));
  return parts;
}

/** The first character on the round: the first in Visit Order not opened yet this Play Session. */
export function roundNext(view: NowView, visited: readonly number[]): RosterRow | null {
  return view.roster.find((r) => !visited.includes(r.index)) ?? view.roster[0] ?? null;
}
