// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7: the Now area's view words (area N): the header, the counter, the pause points, the Away
// card, grouped jobs, the Roster's folds, Focus, the why sheet, Settings and the flows. Nothing here is
// advice (P6, TR-9): no imperative from the Next Action templates and no rating word. Every function
// copes with any argument (the lint calls each one with `(3, 'Anvil')`).

const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const s = (v: unknown): string => String(v ?? '');
const plural = (count: unknown, one: string, many = `${one}s`) =>
  `${n(count)} ${n(count) === 1 ? one : many}`;

/** The header (`now.header` One-line, G1 overflow menu, `now.stage-badge` crest). */
export const HEADER_WORDS = {
  /** The save-age chip ("save read 1 min ago"). */
  read: (ago: unknown) => `save read ${s(ago)}`,
  pasted: (ago: unknown) => `pasted · ${s(ago)}`,
  lastGood: (ago: unknown) => `last good save · ${s(ago)}`,
  noSave: 'no save yet',
  reconnecting: 'Reconnecting…',
  offline: (at: unknown) => `Offline · showing your save from ${s(at)}`,
  updating: 'updating…',
  /** A newer build is live (M12 FR-24): the quiet chip; a pasted save is kept across the reload. */
  newVersion: 'New version ready · Reload',
  /** The pasted save couldn't be kept for the reload: the chip says so before it reloads. */
  newVersionDrops: 'Reload drops your pasted save · Reload anyway',
  menu: 'More',
  menuTitle: 'ActiveOn',
  menuDot: 'something new',
  familyLevel: (level: unknown) => `Family level ${n(level).toLocaleString('en-US')}`,
  settings: 'Settings',
  suggest: 'Suggest something',
  yourSuggestions: 'Your suggestions',
  confusing: 'Something confusing here?',
  signIn: 'Sign in',
  signOut: 'Sign out',
  /** The crest's sheet: what the next Stage needs (M2 D5). */
  stageTitle: (label: unknown) => `To move past ${s(label)}`,
  stageCount: (count: unknown) => plural(count, 'thing'),
  stageHint: 'Each box ticks itself when your save shows it done.',
  stageButton: (label: unknown, count: unknown) => `${s(label)}, ${plural(count, 'thing')} to go`,
  /** R11 QA: the crest's own count, worded so it never reads like the Now badge's fix count. */
  stageToGo: (count: number) => `${count} to go`,
} as const;

/** The counter (`now.verdict-banner` Counter that reaches zero, FR-N2) and its stale-first state. */
export const COUNTER_WORDS = {
  /** The sentence after the big number ("fixes before you leave"). */
  sentence: (count: unknown) => (n(count) === 1 ? 'fix before you leave' : 'fixes before you leave'),
  /** The whole line, for the live region and the golden ("2 fixes before you leave"). */
  line: (count: unknown) => `${n(count)} ${n(count) === 1 ? 'fix' : 'fixes'} before you leave`,
  allSet: 'All set: safe to log off',
  /** The framed first fix's label (M21.1 refresh: "Do it first", the canvas). */
  first: 'Do it first',
  /** The muted line under the counter. */
  age: (ago: unknown) => `save read ${s(ago)}`,
  /** "Your save is 8h 28m old: press Cloud Save, then check again" (DS-11, US-3). */
  stale: (age: unknown) => `Your save is ${s(age)} old: press Cloud Save, then check again`,
  lastKnown: (count: unknown) => `last known: ${plural(count, 'fix', 'fixes')}`,
  /** The Unknown fold (`now.focus-unknown` Hidden from the count). */
  unknownFold: (count: unknown) => `${n(count)} we can't tell: see why`,
  unknownWhy: "We can't judge these yet, so they don't count against leaving.",
  /** The All set first-fill line's lead ("Back in 8h"). */
  backIn: (span: unknown) => `Back in ${s(span)}`,
} as const;

/** The Expected Return line (`now.return-chips` Learned default, with the consequence sentence). */
export const RETURN_WORDS = {
  lead: 'Back in about',
  change: 'Change',
  sheetTitle: 'When are you back?',
  /** "Plans for 8h away · the anvil on Bowman 60 fills first, in 3h 40m". */
  plans: (span: unknown) => `Plans for ${s(span)} away`,
  fillsFirst: (what: unknown, when: unknown) => `${s(what)} fills first, ${s(when)}`,
  nothingFills: "nothing fills before you're back",
  learning: "We'll learn your usual after a few sessions.",
} as const;

/** The pause points (`flows.session-checklist` Auto tab, FR-N6). */
export const PAUSE_WORDS = {
  label: 'Pause point',
  tabs: { login: 'Log in', rounds: 'Rounds', logoff: 'Log off' },
  why: {
    login: (away: unknown) => `Picked Log in: you were away ${s(away)}`,
    rounds: "Picked Rounds: you're on your rounds",
    logoffReturn: 'Picked Log off: you set when you are back',
    logoffVisited: 'Picked Log off: every character with a fix was opened',
    logoffLong: 'Picked Log off: this session is past your usual length',
    manual: (tab: unknown) => `You picked ${s(tab)}: it stays for this session`,
  },
  /** The Log off list (DO-CONFIRM: the save ticks it, never a tap). */
  logoffTitle: 'Before you log off',
  logoffHint: 'Ticks itself after your next Cloud Save. Nothing to tap.',
  ticked: 'done',
  open: 'to do',
  more: (count: unknown) => `+${n(count)} more`,
  safe: (back: unknown) => `Safe to log off · back in ${s(back)}`,
  /** The Log in list. */
  loginTitle: 'Since you were away',
  limits: (what: unknown, word: unknown, count: unknown) =>
    n(count) > 1 ? `${s(what)} ${s(word)} on ${n(count)}` : `${s(what)} ${s(word)}`,
  resets: (which: unknown, count: unknown) => `${s(which)} reset passed · ${plural(count, 'row')} to do`,
  daily: 'Daily',
  weekly: 'Weekly',
  levels: (gained: unknown, who: unknown) =>
    `+${plural(gained, 'level')} on ${s(who)} · new talent points: see Build`,
  nothingChanged: 'Nothing changed while you were away.',
} as const;

/** The Away card (`flows.away-card` Scaled welcome, FR-N7). */
export const AWAY_WORDS = {
  oneLine: (away: unknown, filled: unknown) =>
    `Welcome back · away ${s(away)} · ${plural(filled, 'thing')} filled`,
  title: (away: unknown) => `While you were away · ${s(away)}`,
  startWith: 'Start with:',
  nothingToStart: 'Nothing to fix first.',
} as const;

/** Grouped jobs and roster findings (`now.roster` Grouped jobs, `now.cap-pills` Account-level finding). */
export const GROUP_WORDS = {
  sameJob: (count: unknown) => `Same job on ${n(count)} characters`,
  inGroup: 'in the group job',
  /** "Anvil full on 6 · collect": the cap pill's own label with the count. */
  finding: (label: unknown, count: unknown) => {
    const [head, ...rest] = s(label).split(' · ');
    return [`${head} on ${n(count)}`, ...rest].join(' · ');
  },
  findingsLabel: 'On many characters',
  filterHint: 'Tap one to show only those characters.',
  trip: 'Map by map',
} as const;

/** The Roster (`now.roster`, `now.roster-row`, FR-N4). */
export const ROSTER_WORDS = {
  heading: 'Characters',
  /** `now.spend-chip` the one Spend card. */
  spendCard: 'Spend Plan',
  spendTitle: 'Coins to spend',
  spendLine: (lines: unknown, chars: unknown) => `${n(lines)} buys on ${n(chars)} characters`,
  spendOpen: 'Open the Spend Plan',
  readyFold: (count: unknown) => `${n(count)} ready`,
  readyFoldName: (count: unknown) => `${plural(count, 'character')} ready, show them`,
  showReady: 'show',
  hideReady: 'hide',
  optional: 'optional',
  moreCaps: (count: unknown) => `+${n(count)}`,
  capCount: (count: unknown) => `${n(count)} full`,
  playing: 'playing',
  nextUp: 'Next up',
} as const;

/** The Account section (`cards.account-section` Summary header, FR-N10). */
export const ACCOUNT_WORDS = {
  title: 'Account',
  summary: (fixes: unknown, goals: unknown) => `${plural(fixes, 'fix', 'fixes')} · ${plural(goals, 'Goal')}`,
  open: 'show',
  close: 'hide',
  fixFirst: 'Before you leave',
  goals: 'Goals',
  spend: 'Spend Plan',
  bestBuy: 'Best buy now',
  saveUp: 'Save up for',
  bringFirst: 'Bring first',
  /** R11 QA: the Bring first steps past the first three; the sheet lists them all. */
  bringMore: (n: number) => `and ${n} more: tap the line for all of them`,
  starChart: 'Star Chart',
  starChartLine: 'Star Chart: its own page under Systems',
  /** D-9: the Account keeps one Star Chart line; the chart lives on its System page. */
  starChartSummary: (points: number | null, unlocked: number) =>
    `Star Chart: ${points ?? '?'} ${points === 1 ? 'point' : 'points'} · ${unlocked} signs unlocked`,
  starChartSee: 'see it',
  ifYouHaveTime: 'If you have time',
  notCovered: 'Not covered yet',
  notCoveredLine: "ActiveOn has no advice for these yet. They never change whether it's safe to log off.",
  unknownSafety: "Can't tell from the save",
  /** R12 QA: the desktop side column's glance (the canvas): counts, the Daily bar, Next up, the fixes. */
  fixWord: (count: number) => (count === 1 ? 'fix' : 'fixes'),
  goalWord: (count: number) => (count === 1 ? 'Goal' : 'Goals'),
  daily: 'Daily',
  dailyLine: (done: number, total: number, reset: string) => `${done} of ${total} · ${reset}`,
  leaveTitle: 'Characters to fix',
  nextUp: 'Up next',
  leaveMore: (count: number) => `and ${count} more`,
} as const;

/** The flows (FR-N11): waiting, empty, broken, sign-in, paste, footer, clear my data, toasts. */
export const FLOW_WORDS = {
  steps: ['Reading your save', 'Working it out', 'Drawing your characters'],
  waitingSteps: ['Signed in', 'Fetching your save', 'Reading your characters'],
  waitingLabel: 'Waiting for your save',
  cloudSaveHint: 'Still nothing. Press Cloud Save in the game, or switch character, and it shows up here.',
  prefsLoading: 'Loading your choices…',
  empty: (back: unknown, what: unknown) =>
    what ? `Nothing to do now. Back in ${s(back)}: ${s(what)}.` : `Nothing to do now. Back in ${s(back)}.`,
  emptyTitle: 'Nothing to do',
  usingLastGood: (at: unknown, age: unknown) =>
    `Advice from your last good save at ${s(at)} (${s(age)} old). The newest one can't be read.`,
  /** Can't work it out (`flows.cant-work-out` Fallback roster + Report prefilled). */
  paused: 'Advice paused.',
  pausedLine: "We read your save but couldn't work out the advice. Here's who is doing what.",
  pausedWord: 'Paused',
  report: 'Report the problem',
  reportNote: 'This will be posted publicly on GitHub. No save data, no character names.',
  pasteOpen: 'Paste your save instead',
  /** Toasts (`flows.banners` Toast once). */
  reload: 'Reload',
  later: 'Later',
  failedChecks: (count: unknown) => `${plural(count, 'check')} failed`,
  /** Sign-in (`flows.sign-in` Out of the way + Code card). */
  signInTitle: 'Sign in to read your save',
  pastedBar: 'Pasted save. Sign in to keep it live.',
} as const;

// The words only the lazy parts read (Focus, the why sheet, Settings, What's new, the setup flows) live
// in their own module, so they load with those parts (M21 TR-12); the barrel still exports them.
export * from './now-detail';
