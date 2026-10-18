// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Timeline place's own headings, labels and legends (M21 area T). They are words only the lazy
// Timeline chunk draws, so they live here, beside it, rather than in the engine's view words, which ship
// in the first load (TR-12: the budget never rises). Every word the engine's builders use stays in
// `@idleon-forge/engine/now` (`TIMELINE_WORDS`, `SLOTS_WORDS`, `AFK_STRIP_WORDS`). Nothing here is
// advice: `timeline.test.tsx` runs the TR-9 lint over this file.

/** FR-T1 (`time.timeline` Lanes with a back-at marker). */
export const BOARD_WORDS = {
  /** The Lab's pixel heading over the board. */
  title: 'When does everyone stop earning?',
  /** The return-time control (the Lab's "Back in" segmented control). */
  backIn: 'Back in',
  backInLabel: "When you'll be back",
  /** The NOW box under the board: the first limit with a fix before you're back. */
  nowBadge: 'Now',
  nowCalm: "Nothing fills up before you're back",
  jumpLabel: 'On this page',
  jumpLanes: 'Lanes',
  jumpSlots: 'Parallel Slots',
  jumpDaily: 'Daily & Weekly',
  listsTitle: 'Every limit, as a list',
  legend: 'Legend',
  legendBank: 'Bank',
  legendCap: 'Cap or storage',
  legendTimer: 'Timer',
  legendFood: 'Food or fuel',
} as const;

/** FR-T3 (`time.parallel-slots` Slot grid + Unassigned tray): the section's own words. */
export const SLOTS_UI_WORDS = {
  title: 'What runs beside the AFK job',
  intro: 'Each character has five Parallel Slots that earn beside the AFK job.',
  character: 'Character',
  footer: 'In use',
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

/** FR-T2 (`time.daily-weekly` Two-ring reset clock, Bank pips calendar, Five-minute plan). */
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
  plan: (minutes: number) => `${minutes} min`,
  planned: (used: string, minutes: number) => `${used} of ${minutes} min planned · no-bank rows first`,
  planNone: (minutes: number) => `Nothing to do fits in ${minutes} min.`,
  /** Banking pips: "2 of 3 days banked". */
  pips: (kept: number, lost: number) =>
    `${kept} of 3 days banked${kept >= 3 ? ', lost tomorrow' : ''}${lost ? `, ${lost} lost` : ''}`,
  lost: (n: number) => `${n} lost`,
  opensLater: (list: string) => `Opens later: ${list}`,
  lostBeforeBack: 'lost before you are back',
} as const;
