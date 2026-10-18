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
} as const;

/** The counter (`now.verdict-banner` Counter that reaches zero, FR-N2) and its stale-first state. */
export const COUNTER_WORDS = {
  /** The sentence after the big number ("fixes before you leave"). */
  sentence: (count: unknown) => (n(count) === 1 ? 'fix before you leave' : 'fixes before you leave'),
  /** The whole line, for the live region and the golden ("2 fixes before you leave"). */
  line: (count: unknown) => `${n(count)} ${n(count) === 1 ? 'fix' : 'fixes'} before you leave`,
  allSet: 'All set: safe to log off',
  first: 'First',
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

/** Focus, the Character page's Now tab (FR-N5). */
export const FOCUS_WORDS = {
  beforeYouLeave: 'Before you leave',
  current: 'Now',
  ticksItself: 'Ticks itself when your next Cloud Save shows it done.',
  prev: 'prev',
  prevName: (who: unknown) => `Previous: ${s(who)}`,
  dots: 'Characters in Visit Order',
  dotsOpen: 'Show every character',
  pagerTitle: 'Characters in Visit Order',
  /** "1 of 6 · 5 left". */
  here: (position: unknown) => s(position),
  goals: (who: unknown) => `Also for ${s(who)}`,
  betterFit: 'Better fit:',
  why: 'why?',
  doneThisSession: (count: unknown) => `Done this session (${n(count)})`,
  ifYouHaveTime: 'If you have time',
  allCharacters: '← All characters',
  quest: 'Quest',
  purposeMore: (count: unknown) => `${plural(count, 'more rung')}`,
  /** G5: the cloud-save tip, only while the follow state is guessing (M10 FR-14). */
  cloudSaveTip: 'Tip: press Cloud Save in the game to lock this in.',
} as const;

/** The Goal card and the why sheet (`cards.goal-card` Action-only, `cards.why-sheet`, FR-N8). */
export const CARD_WORDS = {
  open: 'Open why and controls',
  sheetTitle: (kind: unknown) => `${s(kind)} · why`,
  willGive: 'Will give you',
  guide: 'Scout',
  sources: 'Sources',
  moreSources: (count: unknown) => `+${n(count)} more`,
  disagree: 'Sources disagree',
  howDecided: 'How this was decided',
  decidedBy: (by: unknown) => `Decided by ${s(by)}.`,
  alsoConsidered: (text: unknown, reason: unknown) => `Also considered: ${s(text)} (${s(reason)})`,
  overflow: 'More controls',
  skip: 'Skip today',
  skippedLine: (count: unknown) => `${n(count)} skipped today`,
  show: 'show',
  undo: 'undo',
  notForMe: 'Hold: not for me',
  notForMeHint: 'Hold for about 1 s. We stop suggesting this until the next patch.',
  notForMeDone: (text: unknown) => `We won't suggest this again until the next patch: ${s(text)}`,
  report: 'Report this',
  more: (count: unknown) => `+${n(count)} more`,
  less: 'show less',
  hidden: (count: unknown) => `Hidden until next patch (${n(count)})`,
  done: 'Done',
  details: (count: unknown) => `${plural(count, 'character')}`,
  walkthroughStep: (order: unknown, total: unknown) => `step ${n(order)} of ${n(total)}`,
  walkthroughAll: 'All steps',
  walkthroughTree: 'Everything it needs',
  walkthroughOther: (count: unknown) => `Other ways (${n(count)})`,
  toGo: (count: unknown) => `${n(count).toLocaleString('en-US')} to go`,
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
  starChart: 'Star Chart',
  starChartLine: 'Star Chart: its own page under Systems',
  ifYouHaveTime: 'If you have time',
  notCovered: 'Not covered yet',
  notCoveredLine: "ActiveOn has no advice for these yet. They never change whether it's safe to log off.",
  unknownSafety: "Can't tell from the save",
} as const;

/** Settings (G10). */
export const SETTINGS_WORDS = {
  title: 'Settings',
  theme: 'Theme',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  times: 'Times',
  timesRelative: 'In 2h 10m',
  timesClock: 'Around 20:10',
  backIn: 'Back in',
  backLearned: 'Learned',
  backAsk: 'Always ask',
  stored: 'Kept in this browser for this account.',
  notStored: "Can't remember your choices in this browser: they last for this visit.",
} as const;

/** What's new (`flows.whats-new` Patch notes scroll, owner override; D-16). */
export const NEWS_WORDS = {
  tab: (count: unknown) => `What's new · ${n(count)}`,
  title: 'New since your last visit',
  count: (count: unknown) => plural(count, 'change'),
  gotIt: 'Got it',
  more: (count: unknown) => `and ${n(count)} more`,
  everyChange: 'every change',
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
  /** Can't read (`flows.cant-read` Use last good, with the gremlin). */
  cantRead: "Can't read your save",
  cantReadLine: "Your newest save can't be read. We won't guess from it.",
  useLastGood: (at: unknown) => `Use your last good save (from ${s(at)})`,
  lastGoodNote: (age: unknown) => `Caps and times will be ${s(age)} out of date.`,
  pasteInstead: 'Paste a save instead',
  usingLastGood: (at: unknown, age: unknown) =>
    `Advice from your last good save at ${s(at)} (${s(age)} old). The newest one can't be read.`,
  /** Can't work it out (`flows.cant-work-out` Fallback roster + Report prefilled). */
  paused: 'Advice paused.',
  pausedLine: "We read your save but couldn't work out the advice. Here's who is doing what.",
  pausedWord: 'Paused',
  report: 'Report the problem',
  reportNote: 'This will be posted publicly on GitHub. No save data, no character names.',
  unreadable: "This character couldn't be read. The game may have updated.",
  /** Paste (`flows.paste-save` Drop zone + Clear failure). */
  pasteTitle: 'Paste your save here',
  pasteHint: 'Tap, then paste. It stays in this tab.',
  pasteStep1: 'Open IdleOn Toolbox and sign in there',
  pasteStep2: 'Press Copy for support (or Copy raw data)',
  pasteStep3: 'Come back and paste',
  pasteRead: 'Read this save',
  pasteBusy: 'Reading…',
  pasteOpen: 'Paste your save instead',
  /** Toasts (`flows.banners` Toast once). */
  reload: 'Reload',
  later: 'Later',
  /** Footer (`flows.footer` Fan disclaimer). */
  fanMade: 'Fan-made.',
  fanLine:
    'ActiveOn is a fan-made tool, not affiliated with or endorsed by LavaFlame2. Legends of IdleOn is © LavaFlame2.',
  readOnly:
    'Read-only: it never changes your save. Save reading by IdleOn Toolbox (GPL-3.0); facts from the IdleOn Wiki.',
  source: 'Source code (GPL-3.0)',
  noMemory: "Can't remember your choices in this browser.",
  failedChecks: (count: unknown) => `${plural(count, 'check')} failed`,
  /** Clear my data (`flows.clear-my-data` What it clears + Hold to clear). */
  clearTitle: 'Clear your ActiveOn data?',
  clearOpen: 'Clear my data',
  goes: 'Goes',
  stays: 'Stays',
  goesList: [
    'Save history on this browser',
    'Skip today and Not for me choices',
    'Your return time',
    "What's new, already seen",
  ],
  staysList: [
    'Your game save: we never touch it',
    'Your Google sign-in, unless you tick below',
    'Suggestions you filed on GitHub',
  ],
  alsoSignOut: 'Also sign out',
  holdToClear: 'Hold to clear',
  holdHint: 'Hold for about 1 s. Let go to cancel. Keyboard: hold Enter.',
  cleared: 'Cleared. Nothing of yours is left on this browser.',
  cancel: 'Cancel',
  /** Sign-in (`flows.sign-in` Out of the way + Code card). */
  signInTitle: 'Sign in to read your save',
  signInLead: 'Read-only: ActiveOn never changes your save. Your login stays in this browser.',
  signInWithGoogle: 'Sign in with Google',
  pastedBar: 'Pasted save. Sign in to keep it live.',
  codeStep1: 'On your phone or computer, open',
  codeStep2: 'Type this code:',
  copy: 'Copy',
  copied: 'Copied',
  codeWaiting: 'Waiting for you to approve on Google. The code works for',
  codeMore: 'more.',
  asking: 'Asking Google for a sign-in code…',
  restoring: 'Checking for a saved sign-in…',
  approved: 'Signed in. Waiting for your save: press Cloud Save in the game, or switch character.',
  signedIn: (email: unknown) => (email ? `Signed in as ${s(email)}` : 'Signed in'),
  useAnother: 'Sign out and use another account',
  unconfigured: "Live sign-in isn't set up in this build. Paste your save instead.",
} as const;
