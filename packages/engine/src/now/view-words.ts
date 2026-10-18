// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The only file allowed to hold view prose for M17's new views (TR-9): status words, counts, headings
// and link labels. Every other string a view shows is a module's own text, a registry or fact-table
// fact, a character's name, a time or a count. Nothing here is advice: no imperative from the Next
// Action templates and no rating word (P6). `view-words.test.ts` lints it.
import type { TileStatus } from './view';

export const PLACE_WORDS = {
  now: 'Now',
  characters: 'Characters',
  systems: 'Systems',
} as const;

export const STATUS_WORDS: Record<TileStatus, string> = {
  locked: 'Locked',
  wasting: 'Wasting',
  behind: 'Behind',
  'cant-tell': "Can't tell",
  'not-covered': 'Not covered yet',
  ok: 'Nothing to fix',
};

/** The tile's reason pieces (FR-18). */
export const REASON_WORDS = {
  sep: ' · ',
  toFix: (n: number) => `${n} to fix before you leave`,
  toDo: (n: number) => `${n} to do`,
  behind: 'Behind for your Stage',
  alsoBehind: 'behind for your Stage',
  nothingToFix: 'Nothing to fix',
  nothingToFixMaybe: 'Nothing to fix (may be out of date)',
  cantTell: "Can't tell from the save",
  notCovered: 'Not covered yet',
  inSpendPlan: 'in the Spend Plan',
  pillsFull: (n: number) => `${n} full · collect`,
  skipped: (n: number) => `${n} skipped`,
  mayBeOutOfDate: 'may be out of date',
  opensInWorld: (world: number) => `Opens in ${WORLD_NAMES[world] ?? `World ${world}`}`,
  openFromStart: 'Open from the start',
} as const;

/** World group headings (FR-16), in game order. */
export const WORLD_NAMES: Record<number, string> = {
  0: 'Across worlds',
  1: 'World 1 · Blunder Hills',
  2: 'World 2 · Yum-Yum Desert',
  3: 'World 3 · Frostbite Tundra',
  4: 'World 4 · Hyperion Nebula',
};

export const HUB_WORDS = {
  title: 'Systems',
  needsYou: 'Needs you',
  later: (n: number) => `Later worlds: ${n} Systems`,
  beyond: 'Worlds 5–7: not covered yet',
  otherGaps: 'Not covered yet: other gaps',
} as const;

export const PAGE_WORDS = {
  nextActions: 'Next Actions',
  quickCollects: 'Quick collects',
  spendPlan: 'In the Spend Plan',
  spendPlanLink: 'Open the Spend Plan on Now',
  howItOpens: 'How it opens',
  coverage: 'What ActiveOn checks here',
  sources: 'Sources',
  account: 'Account',
  notCheckedYet: (name: string) => `ActiveOn doesn't check ${name} yet.`,
  suggest: 'Suggest something for it',
  checkedNothing: 'checked: nothing to do',
  checkedSeeAbove: 'checked: see above',
  nothingShown: 'Nothing here right now.',
  seeEvery: (tab: string) => `See every character's ${tab}`,
  wiki: 'IdleOn Wiki page',
  stale: 'Stale',
  blockersOnly: "Only what to fix before you leave shows while ActiveOn can't tell where your account is.",
} as const;

export const LINK_WORDS = {
  seeIt: (name: string) => `See it: ${name}`,
  back: '← back',
  toSystems: '→ Systems',
  toCharacters: 'Builds and cards → Characters',
  go: 'go',
  skipToContent: 'Skip to content',
} as const;

export const CHARACTERS_WORDS = {
  title: 'Characters',
  open: 'Open',
} as const;
