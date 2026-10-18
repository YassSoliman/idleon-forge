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

/** M21 FR-S1: the hub's Stage report card and the "Wasting now" strip. */
export const REPORT_WORDS = {
  title: 'What did I skip',
  wastingTitle: 'Wasting now',
  wasting: (n: number) => `${n} ${n === 1 ? 'System' : 'Systems'} wasting`,
  lede: (stage: string) => `You are at ${stage}. Each tick is where your Stage expects that System.`,
  you: 'you',
  expected: (stage: string) => `expected by ${stage}`,
  behind: (n: number) => `${n} ${n === 1 ? 'Stage' : 'Stages'} behind`,
  rowName: (name: string, expected: string, behind: string) => `${name}, ${expected}, ${behind}`,
  nextStep: 'Next step',
  allSystems: (n: number) => `All Systems (${n})`,
  nothingBehind: 'Nothing behind for your Stage.',
} as const;

/** M21 FR-S2: the world bands ("All Systems"). */
export const BAND_WORDS = {
  title: 'All Systems',
  needYou: (n: number) => `${n} ${n === 1 ? 'needs' : 'need'} you`,
  notCovered: (n: number) => `${n} here ${n === 1 ? "isn't" : "aren't"} covered yet`,
} as const;

/** M21 FR-S3, FR-S6: the page frame (Step first) and the picture tap sheet. */
export const FRAME_WORDS = {
  nextStep: 'Next step',
  forStage: 'For your Stage',
  stageMeter: (expected: string, here: string) => `Expected by ${expected} · you are at ${here}`,
  inOrder: (n: number) => `In order: the next ${n} ${n === 1 ? 'step' : 'steps'}`,
  showAll: (n: number) => `Show all ${n}`,
  tapHint: 'Tap any part for its value, cost and Source.',
  value: 'Now',
  next: 'Next',
  cost: 'Cost',
  close: 'Close',
} as const;

/** M21 FR-S4: the Stamps book. */
export const STAMP_WORDS = {
  title: 'Stamp book',
  owned: (n: number, total: number) => `${n} of ${total} stamps owned`,
  tabs: { combat: 'Combat', skills: 'Skills', misc: 'Misc' } as Readonly<Record<string, string>>,
  tabsLabel: 'Stamp tabs',
  status: {
    owned: 'owned',
    now: 'get it now',
    active: 'with active play',
    toward: 'in progress',
    later: 'later',
    unknown: "can't tell",
  } as Readonly<Record<string, string>>,
  atCap: 'at cap',
  level: (level: number, cap: number) => `Lv ${level} of ${cap}`,
  nextLevel: (level: number) => `Lv ${level}`,
  route: {
    held: 'you carry it',
    shop: 'a town shop sells it',
    quest: 'a quest gives it',
    buyThenQuest: 'buy an item, then a quest gives it',
    drop: 'a monster drops it',
    craft: 'craft it at the anvil',
    other: 'another way',
  } as Readonly<Record<string, string>>,
  notOwned: 'not collected yet',
  raiseInPlan: 'its cap raise is in the Spend Plan',
  nextThree: 'Next stamps',
  legend: 'Number = level. The ring fills to its cap.',
} as const;

/** M21 FR-S4: the Statue wall. */
export const STATUE_WORDS = {
  title: 'Statue wall',
  counts: (gold: number, onyx: number, total: number) => `${gold} of ${total} Gold · ${onyx} Onyx`,
  grade: ['not Gold yet', 'Gold', 'Onyx', 'Zenith'] as readonly string[],
  level: (n: number) => `Lv ${n}`,
  nextGold: 'Gold next',
  priceNotChecked: 'Price not checked',
  goldCost: (coins: string) => `Gold for ${coins}`,
  inPlan: 'in the Spend Plan',
  spread: 'Levels per character',
} as const;

/** M21 FR-S4: the Vault tower. */
export const VAULT_WORDS = {
  title: 'Vault tower',
  nextUnlock: (levels: number, name: string) =>
    `${levels} ${levels === 1 ? 'level' : 'levels'} to open ${name}`,
  allOpen: 'Every row is open',
  here: (n: number) => `you are here · ${n} levels`,
  floor: (n: number) => `Opens at ${n} levels`,
  level: (level: number, max: number) => `Lv ${level} of ${max}`,
  maxed: 'maxed',
  locked: 'locked',
  bestBuy: 'Best buy',
} as const;

/** M21 FR-S4: the 3D Printer slot grid. */
export const PRINTER_WORDS = {
  title: 'Printer slots',
  noChange: 'no change',
  empty: 'empty slot',
  perHour: (n: string) => `${n} an hour`,
  printing: (n: number) => `${n} ${n === 1 ? 'character prints' : 'characters print'}`,
} as const;

/** M21 G7, G8 and the restyled bodies (FR-S5). */
export const BODY_WORDS = {
  traps: 'Traps',
  back: 'you are back',
  collectNow: 'Collect now',
  trapDone: 'done before you are back',
  trapLater: 'still running when you are back',
  noTrap: 'no trap set',
  trapsLine: (done: number, total: number) => `${done} of ${total} done before you are back`,
  p2w: 'Pay 2 Win',
  next: 'next',
  cogBoard: 'Cog Board',
  charge: 'Charge',
  totems: 'Totem waves',
  seats: 'Cauldron seats',
  starChart: 'Star Chart',
} as const;
