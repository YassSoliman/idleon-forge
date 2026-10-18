// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7: the Time area's view words (area T): the Timeline place.
import type { TimelineKind } from '../../result';

/** The Timeline's kind words (FR-24): what happens when a limit binds, one per TimelineKind. */
export const KIND_WORDS: Record<TimelineKind, string> = {
  storage: 'full',
  food: 'runs out',
  'time-cap': 'stops',
  production: 'caps',
  bank: 'lost',
  timer: 'ready',
};

/** The Timeline place (FR-24 to FR-30, §6): its labels and sentence parts. */
export const TIMELINE_WORDS = {
  title: 'Timeline',
  intro: 'When each character and the account stop earning, against when you are back.',
  back: (when: string, at: string) => `Back ${when} · ${at}`,
  /** With the Times setting (G10): "Back in 8h 00m" or "Back around 02:20". */
  backOne: (when: string) => `Back ${when}`,
  /** The clock form of a moment (G10 "Around 20:10"). */
  around: (at: string) => `around ${at}`,
  backShort: 'Back',
  now: 'now',
  later: 'later',
  cantTell: "can't tell when",
  beforeBack: "before you're back",
  afterBack: "after you're back",
  skipped: 'skipped',
  dismissed: 'hidden until next patch',
  at: (at: string) => `at ${at}`,
  seeFix: 'See the fix',
  seeFixFor: (what: string) => `See the fix: ${what}`,
  seeIt: 'See it',
  seeItFor: (what: string) => `See it: ${what}`,
  sameOn: (n: number) => `the same on ${n} more`,
  account: 'Account · helps everyone',
  accountCantTell: "Can't tell from the save",
  nothingTimed: 'Nothing timed here.',
  /** A lane whose only bars are said once on an earlier lane ("the same on n more"). */
  inGroupAbove: 'In the group above',
  nothingBefore: "Nothing fills up before you're back",
  stale: (age: string) => `Your last save is ${age} old: these times are projected from it.`,
  /** Fits the narrow board column in two lines: the age never breaks (R6 QA). */
  sinceSave: (age: string) => `Save age: ${String(age).replace(/ /g, '\u00a0')}`,
  pastBand: 'when each limit filled since then is not in the save',
  scrollLabel: 'Timeline lanes, scrolls sideways',
  unavailable: "The Timeline needs AFK safety, which isn't covered yet",
  legendOutlined: "Outlined: before you're back, with its fix",
  legendHatched: 'Stripes: the hours it sits full',
  tick: (hours: number) => `+${hours}h`,
} as const;

/**
 * M21 FR-T5: the compact AFK strip on Now (`flows.afk-timeline` Compact strip). One sentence under it:
 * "3 limits bind before you're back: the anvil on Bowman 60 first, in 3h 40m".
 */
export const AFK_STRIP_WORDS = {
  sentence: (n: number, what: string, who: string, when: string) =>
    `${n} ${n === 1 ? 'limit binds' : 'limits bind'} before you're back: the ${what} on ${who} first, ${when}`,
  nothing: "Nothing binds before you're back",
  fullNow: 'full now',
  open: 'Open the Timeline',
  mark: (who: string, what: string, when: string, before: boolean) =>
    `${who}: ${what}, ${when}${before ? ", before you're back" : ''}`,
} as const;

/**
 * M21 FR-T3: the Parallel Slots grid's words that `buildSlotsView` uses (the column heads, a cell's state
 * word, the column count and the tray count). The lazy section's own headings and legend live with it
 * (`apps/activeon/src/timeline/words.ts`), so they stay out of the first load (TR-12).
 */
export const SLOTS_WORDS = {
  /** Column heads, in the Lab's order. */
  kinds: {
    cauldron: 'Cauldron',
    trap: 'Traps',
    worship: 'Worship',
    cog: 'Cog Board',
    printer: 'Printer',
  },
  /** A cell's state word, beside its glyph (never colour alone). */
  states: {
    filled: 'In use',
    capped: 'Full',
    fillable: 'Empty',
    unfillable: "Can't fill yet",
    locked: 'Not open yet',
    unknown: "Can't tell",
    'not-covered': 'Not covered yet',
  },
  /** The column footer: "5 of 6 in use · 1 free". */
  count: (inUse: number, of: number, free: number, full: number) =>
    [`${inUse} of ${of} in use`, free ? `${free} free` : '', full ? `${full} full` : '']
      .filter(Boolean)
      .join(' · '),
} as const;
