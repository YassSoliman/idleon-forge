// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24: the words of the ••• menu and first run. Their own entry point (`@idleon-forge/engine/menu-text`),
// like alchemy-text, so they ship in those lazy parts and never in the first load.

/** M24 the ••• menu (Menu and MenuPhone boards): a side panel on desktop, a bottom sheet on a phone. */
export const MENU_WORDS = {
  yourSave: 'Your save',
  live: 'Signed in · live',
  liveHint: 'Updates each time you Cloud Save in the game',
  pasted: 'Pasted save · this tab only',
  pastedHint: 'Sign in to keep it live',
  none: 'No save yet',
  noneHint: 'Sign in, or paste a save from IdleOn Toolbox',
  paste: 'Paste a save instead',
  pasteFrom: 'from IdleOn Toolbox',
  look: 'Look',
  tellUs: 'Tell us',
  yourData: 'Your data on this browser',
  toolbox: 'IdleOn Toolbox',
  wiki: 'IdleOn Wiki',
  source: 'Source code (GPL-3.0)',
  opensNewTab: '(opens in a new tab)',
  legal:
    'Fan-made, read-only. ActiveOn is not affiliated with or endorsed by LavaFlame2. Legends of IdleOn is © LavaFlame2.',
  close: 'Close',
} as const;

/** M24 first run (FirstRun board): sign in or paste, before any save. */
export const FIRST_RUN_WORDS = {
  kicker: 'A coach for Legends of IdleOn',
  title: 'Know what to do before you log off.',
  lead: "ActiveOn reads your save and answers one question per screen: what to fix now, what fills up while you're away, and what to buy next.",
  features: [
    ['What to fix before you go', 'The full things first, then one task per character.'],
    ["What fills up while you're away", 'Anvils, fuel and timers on one line, before you leave.'],
    ['What to buy, and on whom', 'Each character spends its own coins; the plan says who pays.'],
  ],
  readOnlyTitle: 'Read-only, always',
  readOnly:
    'ActiveOn only reads your save. It never changes it, never touches the game and never plays for you. Your sign-in stays in this browser.',
  bring: 'Bring your save',
  signInTitle: 'Sign in with Google',
  best: 'best',
  signInLead:
    'Stays up to date: every Cloud Save in the game shows up here. Google gives you a short code to type in; nothing to install.',
  or: 'or',
  pasteTitle: 'Paste your save',
  pasteLead: 'No sign-in needed. It stays in this tab only.',
  timelineNow: 'now',
  timelineBack: 'back',
  buy: 'buy',
} as const;
