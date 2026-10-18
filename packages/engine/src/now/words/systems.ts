// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7: the Systems area's view words (area S): the hub tiles' reasons, the hub and the System pages.
import { WORLD_NAMES } from './shared';

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

export const HUB_WORDS = {
  title: 'Systems',
  needsYou: 'Needs you',
  later: (n: number) => `Later worlds: ${n} Systems`,
  beyond: 'Worlds 5–7: not covered yet',
  otherGaps: 'Not covered yet: other gaps',
} as const;

export const PAGE_WORDS = {
  nextActions: 'Next Actions',
  // M19 TR-8: while a lazy picture chunk loads.
  loadingPicture: 'Loading the picture…',
  quickCollects: 'Quick collects',
  onTimeline: 'On the Timeline',
  timelineLink: 'Open the Timeline',
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
