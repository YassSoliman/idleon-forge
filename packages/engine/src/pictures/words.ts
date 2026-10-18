// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7 (area S): the words of the Systems hub's report card, the System page frame and the picture
// bodies. They sit under `@idleon-forge/engine/systems-ui` rather than `now/words/systems.ts` so the
// bundler keeps them out of the first load (TR-12): every module the `now` barrel reaches bundles into
// one first-load chunk. M17's hub and page words stay in `now/words/systems.ts`.
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
  collectNow: 'Ready to collect',
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
  starPoints: (n: number) => `+${n} Star Chart points`,
  signsUnlocked: (n: number, max: number) => `${n} of ${max} signs unlocked`,
  bestWave: (n: number) => `best wave ${n}`,
} as const;
