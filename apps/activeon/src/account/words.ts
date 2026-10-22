// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the words of the account pages (canvas boards SpendPlan and Goals): plain verbs, class and level
// for a character, never a name; units on every number.
import type { SpendSink } from '@idleon-forge/engine/result';

export const SPEND_WORDS = {
  /** M26 FR-58: a Vault line's link to the Upgrade Vault page's Vault plan. */
  fullVaultPlan: 'See the full Vault plan',
  crumb: 'Spend Plan',
  back: 'Now',
  heroOne: 'buy your coins cover today',
  heroMany: 'buys your coins cover today',
  heroNone: 'buys your coins cover today: save up for the next one',
  heroSub: (payers: number, planned: string, held: string) =>
    `On ${payers} ${payers === 1 ? 'character' : 'characters'} · about ${planned} of the ${held} coins they hold · nothing is pooled: each character pays from its own pocket`,
  heroSubNone: 'Nothing is pooled: each character pays from its own pocket',
  bestFirst: (who: string, n: number, of: number) =>
    of === 1 || n === of
      ? `Log into ${who} first: ${n === 1 ? 'the buy is' : `all ${n} buys are`} on it`
      : `Log into ${who} first: ${n} of the ${of} buys are on it`,
  bestBuy: 'Best buy now',
  order: 'In this order',
  orderCount: (lines: number, priced: number, unpriced: number) =>
    [
      `${lines} ${lines === 1 ? 'line' : 'lines'}`,
      `${priced} priced`,
      unpriced ? `${unpriced} to price in game` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  thenTitle: 'Then',
  coins: 'coins',
  skip: 'Skip today',
  skipLabel: (what: string) => `Skip "${what}" today`,
  skipped: (n: number) => `${n} skipped today`,
  undo: 'Undo',
  priceInGame: 'price in game',
  withdraw: (coins: string) => `withdraw ${coins} from storage first`,
  short: (coins: string) => `${coins} short: save for it`,
  pockets: 'Pockets',
  pocketsLabel: 'Who holds the coins',
  coinsHeld: 'coins held',
  pocketOf: (planned: string, held: string) => `${planned} of ${held}`,
  pocketIdle: (held: string) => `${held} · nothing on the list`,
  pocketEmpty: 'empty',
  spentByPlan: 'spent by this plan',
  leftOver: 'left over',
  storage: (coins: string) => `Coins in storage · ${coins}`,
  showMore: (n: number) => `Show ${n} more`,
  showLess: 'Show less',
  storageLine:
    'Shared by every character. The plan never counts it as spendable; it only says "withdraw from storage" when one pocket is a little short.',
  unpricedTitle: (n: number) => `Price not checked · ${n}`,
  unpricedLine:
    "ActiveOn can't read the price of these. Check it in game; the totals above assume you skip them.",
  notInPlan: 'Not in this plan',
  unavailable: (what: string) => `Can't price ${what} right now`,
  empty: 'Nothing on the Spend Plan right now.',
  noPlan: "The Spend Plan can't be worked out from this save yet.",
} as const;

/** Where a step's coins go, as the game names the place. */
export const SINK_WORDS: Record<SpendSink, string> = {
  vault: 'Upgrade Vault',
  stamp: 'Stamps',
  bribe: 'Bribes',
  'statue-gold': 'Statues',
  p2w: 'Alchemy · Pay 2 Win',
  anvil: 'Anvil',
};

/** M7 FR-20's "not covered" ids, in words. */
export const NOT_COVERED_WORDS: Record<string, string> = {
  'forge.upgrades': 'Forge upgrades',
  'stamps.raise-material': "stamps whose cap materials you don't have yet",
};

export const GOALS_WORDS = {
  crumb: 'Goals',
  back: 'Now',
  cap: (n: number, blockers: number) =>
    `${n} ${n === 1 ? 'Goal' : 'Goals'} for your account · ${
      blockers === 0
        ? 'none of them stop you logging off'
        : `${blockers} ${blockers === 1 ? 'fix stops' : 'fixes stop'} you logging off`
    }`,
  title: (n: number) =>
    n === 1 ? 'Start with this one' : n === 2 ? 'Start with these two' : 'Start with these three',
  none: 'No Goals for your account right now.',
  fixFirst: 'Fix these first',
  seeIt: 'See it',
  show: 'Show',
  all: (n: number) => `All ${n}`,
  more: (n: number) => `Show ${n} more`,
  less: 'Show less',
  skip: 'Skip',
  skipLabel: (what: string) => `Skip "${what}" today`,
  skipped: (n: number) => `${n} skipped today`,
  hidden: (n: number) => `${n} hidden until next patch`,
  undo: 'Undo',
  losingNow: 'being lost now',
  lostBefore: 'lost before you are back',
  banked: 'waiting, banked',
  oneChar: 'On one character',
  oneCharLine: 'Most Goals are account-wide. These need a particular character logged in.',
  meaning: 'What the groups mean',
} as const;

/** The three groups of the Goals list, by the Goal's category (blockers have their own block). */
export const GROUP_WORDS = {
  spendable: { title: "Spend what's waiting", line: 'Points, tickets and tries that do nothing until used.' },
  compounding: { title: 'Grow your account', line: 'Changes that keep paying off.' },
  nice: { title: 'Extras', line: 'Nice to have, no rush.' },
} as const;
