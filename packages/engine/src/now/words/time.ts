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
  // ---- M21 FR-T1 (`time.timeline` Lanes with a back-at marker) ----
  /** The Lab's pixel heading over the board. */
  boardTitle: 'When does everyone stop earning?',
  /** The return-time control (the Lab's "Back in" segmented control). */
  backIn: 'Back in',
  backInLabel: "When you'll be back",
  /** The back marker's flag on the axis: "Back +8h". */
  backFlag: (hours: string) => `Back ${hours}`,
  /** The NOW box under the board: the first limit with a fix before you're back. */
  nowBadge: 'Now',
  nowCalm: "Nothing fills up before you're back",
  /** One jump link per section of the place. */
  jumpLabel: 'On this page',
  jumpLanes: 'Lanes',
  jumpSlots: 'Parallel Slots',
  jumpDaily: 'Daily & Weekly',
  listsTitle: 'Every limit, as a list',
  legendBank: 'Bank',
  legendCap: 'Cap or storage',
  legendTimer: 'Timer',
  legendFood: 'Food or fuel',
  legendUnknown: "Can't tell when",
} as const;

/**
 * M21 FR-T5: the compact AFK strip on Now (`flows.afk-timeline` Compact strip). One sentence under it:
 * "3 limits bind before you're back: the anvil on Bowman 60 first, in 3h 40m".
 */
export const AFK_STRIP_WORDS = {
  label: 'When the first limit binds, per character',
  sentence: (n: number, what: string, who: string, when: string) =>
    `${n} ${n === 1 ? 'limit binds' : 'limits bind'} before you're back: the ${what} on ${who} first, ${when}`,
  nothing: "Nothing binds before you're back",
  fullNow: 'full now',
  open: 'Open the Timeline',
  mark: (who: string, what: string, when: string, before: boolean) =>
    `${who}: ${what}, ${when}${before ? ", before you're back" : ''}`,
} as const;

/** M21 FR-T3: the Parallel Slots grid (`time.parallel-slots` Slot grid + Unassigned tray). */
export const SLOTS_WORDS = {
  title: 'What runs beside the AFK job',
  intro: 'Each character has five Parallel Slots that earn beside the AFK job.',
  character: 'Character',
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
  footer: 'In use',
  /** The tray: one line per slot kind, the characters said once. */
  trayTitle: 'Empty and full slots',
  trayFree: (n: number) => `${n} empty`,
  trayFull: (n: number) => `${n} full`,
  trayNone: 'Every open slot is in use.',
  nowBadge: 'Now',
  legendInUse: 'In use',
  legendEmpty: 'Empty: free value',
  legendFull: 'Full: spend it',
  legendClosed: 'Not open yet',
  scrollLabel: 'Parallel Slots grid, scrolls sideways',
  none: 'No Parallel Slots in this save yet.',
} as const;

/** M21 FR-T2: the Daily & Weekly section (`time.daily-weekly` Two-ring reset clock). */
export const DAILY_WORDS = {
  title: 'Today and this week',
  ringKey: 'Daily reset',
  ringUnknown: "can't tell",
  weekKnown: (left: string) => `Week ring: your weekly reset ${left}`,
  weekUnknown: 'Week ring: reset time not known',
  toDo: (n: number) => `${n} to do before the reset`,
  allDone: 'Nothing left to do before the reset',
  bandCount: (todo: number, total: number) => `${todo} of ${total} to do`,
  open: (band: string) => `Open ${band}`,
  showAll: (n: number) => `Show all ${n}`,
  planTitle: 'How long have you got?',
  planLabel: 'Plan for',
  plan: (minutes: number) => `${minutes} min`,
  planned: (used: string, minutes: number) => `${used} of ${minutes} min planned · no-bank rows first`,
  planNone: (minutes: number) => `Nothing to do fits in ${minutes} min.`,
  /** Banking pips: "2 of 3 days banked". */
  pips: (kept: number, lost: number) =>
    `${kept} of 3 days banked${kept >= 3 ? ', lost tomorrow' : ''}${lost ? `, ${lost} lost` : ''}`,
  lostTomorrow: 'lost tomorrow',
  doneFold: (n: number, open: boolean) => `${n} done · ${open ? 'hide' : 'show'}`,
  opensLater: (list: string) => `Opens later: ${list}`,
  lostBeforeBack: 'lost before you are back',
  seeAll: 'See it on the Timeline',
} as const;
