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
  // ---- M24 (the Timeline board): the three tabs, the hero, the Chart | List toggle, the lanes ----
  tabsLabel: 'Timeline views',
  tabLanes: 'Lanes',
  tabSlots: 'Parallel slots',
  tabDaily: 'Daily & weekly',
  /** The phone's short tab names. */
  tabSlotsShort: 'Slots',
  tabDailyShort: 'Daily',
  sub: (limits: number, characters: number, systems: number) =>
    `${limits} ${limits === 1 ? 'limit' : 'limits'} before you're back · ${characters} ${characters === 1 ? 'character' : 'characters'}, ${systems} account ${systems === 1 ? 'System' : 'Systems'}`,
  losingNow: 'Losing now',
  beforeBack: "Before you're back",
  away: 'How long are you away?',
  viewLabel: 'Show the limits as',
  chart: 'Chart',
  chartLabel: 'Every limit on one clock',
  sources: 'Limits from your save · numbers by IdleOn Toolbox',
  list: 'List',
  characters: 'Characters, soonest first',
  accountHead: 'Account',
  dailyReset: (when: string) => `daily reset ${when}`,
  back: (when: string) => `back · ${when}`,
  legendEarning: 'earning',
  legendBefore: "full before you're back",
  legendAfter: "full after you're back",
  legendFullNow: 'full now',
  legendUnknown: "can't tell when",
  /** A lane's untimed line: "health food runs out · can't tell when". */
  untimed: (what: string) => `${what} · can't tell when`,
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
  // ---- M24 (the Parallel slots board) ----
  sub: 'Beside each AFK job, every character has 5 slots that earn on their own',
  heroCap: 'One move, more from a slot',
  showWhere: 'Show me where',
  sources: 'Slots from your save · IdleOn Wiki: Construction · numbers by IdleOn Toolbox',
  alsoTitle: 'Also worth a minute',
  /** "Worship full on 5 characters". */
  alsoLine: (heading: string, count: string) => `${heading}: ${count}`,
  closedTitle: 'Not open yet',
  /** "Traps · all 6". */
  closedAll: (heading: string, n: number) => `${heading} · all ${n}`,
  closedSome: (heading: string, n: number, of: number) => `${heading} · ${n} of ${of}`,
  legendEarning: 'earning',
  legendFullWord: 'full',
  legendEmptyWord: 'empty: free value',
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
  /** Past the three lost-day boxes: "412 more days lost". */
  moreLost: (n: number) => `${n.toLocaleString('en-US')} more ${n === 1 ? 'day' : 'days'} lost`,
  opensLater: (list: string) => `Opens later: ${list}`,
  lostBeforeBack: 'lost before you are back',
  // ---- M24 (the Daily & weekly board) ----
  sub: 'Daily jobs are lost at the reset unless they bank; weekly ones wait for their own clock',
  sources: 'Times from your save · IdleOn Wiki: Daily Checklist · job times are ActiveOn estimates',
  /** The hero's count line: "12" + "things to do before the daily reset". */
  heroCount: (n: number) =>
    n === 1 ? 'thing to do before the daily reset' : 'things to do before the daily reset',
  heroDone: 'Nothing left before the daily reset',
  losingLine: (label: string) => `${label}: already being lost`,
  todayKey: (done: number, total: number) => `today: ${done} of ${total} done`,
  weekKey: (done: number, total: number, left: string | null) =>
    `this week: ${done} of ${total}${left ? ` · resets ${left}` : ''}`,
  resetIn: 'reset in',
  /** "11 jobs fit in 15 minutes". */
  fits: (n: number, minutes: number) => `${n} ${n === 1 ? 'job fits' : 'jobs fit'} in ${minutes} minutes`,
  fitsUsed: (used: string) => `about ${used} · losing ones first`,
  later: 'Can wait for next time',
  laterWhy: (band: string, clock: string | null) => (clock ? `${band} · ${clock}` : band),
  ticksNote: 'Ticks come from your next save, not from tapping.',
  asideTitle: 'Everything, by how it resets',
  bandNoBank: 'No bank',
  bandNoBankWhy: 'Lost at the daily reset',
  bandBanks: 'Banks up to 3 days',
  bandWeekly: 'Weekly',
  bankKey: 'Gold: days banked · coral: days lost',
  bandShort: { 'no-bank': 'no bank', banks: 'banks 3 days', weekly: 'weekly' },
  axis: (m: number) => `${m} min`,
} as const;
