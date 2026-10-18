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
} as const;
