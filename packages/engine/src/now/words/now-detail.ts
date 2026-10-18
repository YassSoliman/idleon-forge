// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7, TR-12: area N's view words that only lazy parts read (Focus, the why sheet, Settings,
// What's new and the setup flows: sign-in, paste, can't read, clear my data, the footer), re-exported
// by words/now.ts. Nothing here is advice (P6, TR-9); every function copes with any argument.

const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const s = (v: unknown): string => String(v ?? '');
const plural = (count: unknown, one: string, many = `${one}s`) =>
  `${n(count)} ${n(count) === 1 ? one : many}`;

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
  /** The why sheet's date for its main Source (SourceView.verifiedOn). */
  verified: (date: unknown) => `verified ${s(date)}`,
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

/** The setup flows (FR-N11): sign-in, paste, can't read, the footer and clear my data. */
export const SETUP_WORDS = {
  /** Can't read (`flows.cant-read` Use last good, with the gremlin). */
  cantRead: "Can't read your save",
  cantReadLine: "Your newest save can't be read. We won't guess from it.",
  lastGoodButton: (at: unknown) => `Use your last good save (from ${s(at)})`,
  lastGoodNote: (age: unknown) => `Caps and times will be ${s(age)} out of date.`,
  pasteInstead: 'Paste a save instead',
  unreadable: "This character couldn't be read. The game may have updated.",
  /** Paste (`flows.paste-save` Drop zone + Clear failure). */
  pasteTitle: 'Paste your save here',
  pasteHint: 'Tap, then paste. It stays in this tab.',
  pasteStep1: 'Open IdleOn Toolbox and sign in there',
  pasteStep2: 'Press Copy for support (or Copy raw data)',
  pasteStep3: 'Come back and paste',
  pasteRead: 'Read this save',
  pasteBusy: 'Reading…',
  /** Footer (`flows.footer` Fan disclaimer). */
  fanMade: 'Fan-made.',
  fanLine:
    'ActiveOn is a fan-made tool, not affiliated with or endorsed by LavaFlame2. Legends of IdleOn is © LavaFlame2.',
  readOnly:
    'Read-only: it never changes your save. Save reading by IdleOn Toolbox (GPL-3.0); facts from the IdleOn Wiki.',
  source: 'Source code (GPL-3.0)',
  noMemory: "Can't remember your choices in this browser.",
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
  signInLead: 'Read-only: ActiveOn never changes your save. Your login stays in this browser.',
  signInWithGoogle: 'Sign in with Google',
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
