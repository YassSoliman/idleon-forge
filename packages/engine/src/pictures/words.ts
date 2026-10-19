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
  inOrder: (n: number) => (n === 1 ? 'Next step' : `In order: the next ${n} steps`),
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
  showAll: (n: number) => `Show all ${n} floors`,
  fewer: 'Show fewer floors',
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

/** M24: the Systems index (the "wasting now" hero, behind for your Stage, the filtered grid). */
export const INDEX_WORDS = {
  systems: (n: number) => `${n} Systems`,
  wasting: (n: number) => `${n} wasting`,
  behindFor: (n: number, world: string) => `${n} behind for ${world}`,
  notCovered: (n: number) => `${n} not covered yet`,
  locked: (n: number) => `${n} locked`,
  wastingTitle: 'Wasting now',
  wastingHint: 'fix before you leave',
  seeFix: 'See the fix',
  open: 'Open',
  behindTitle: (world: string) => `Behind for ${world}`,
  behindHint: 'next step for each',
  usuallyBy: (stage: string) => `usually done by ${stage}`,
  allTitle: 'All Systems',
  filterLabel: 'Filter',
  filters: { needs: 'Needs you', all: 'All', notCovered: 'Not covered yet', locked: 'Locked' },
  worldSub: (systems: number, need: number, notCovered: number, locked: number) =>
    [
      `${systems} ${systems === 1 ? 'System' : 'Systems'}`,
      locked > 0 && locked === systems ? 'all locked' : null,
      need > 0 ? `${need} ${need === 1 ? 'needs' : 'need'} you` : null,
      notCovered > 0 ? `${notCovered} not covered` : null,
      locked > 0 && locked < systems ? `${locked} locked` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  seeOnMap: 'See it on the Map',
  tileSub: { 'not-covered': 'not covered yet', locked: 'locked', 'cant-tell': "can't tell" } as Readonly<
    Record<string, string>
  >,
  legend: {
    wasting: 'wasting',
    todo: 'to do',
    ok: 'nothing to fix',
    notCovered: 'not covered yet',
    locked: 'locked',
  },
  nothingHere: 'Nothing here with this filter.',
  moreWasting: (n: number) => `${n} more wasting`,
  fewer: 'Show fewer',
} as const;

/** M24: the System page template (header, the framed answer, the footer line). */
export const PAGE_FRAME_WORDS = {
  back: (where: string) => `Systems · ${where}`,
  world: (w: number) => (w === 0 ? 'Across worlds' : `World ${w}`),
  status: {
    wasting: 'Wasting',
    behind: (world: string | null) => (world ? `Behind for ${world}` : 'Behind for your Stage'),
    ok: 'Nothing to fix',
    noChecks: 'No checks yet',
    notCovered: 'Not covered yet',
    locked: 'Locked',
    cantTell: "Can't tell",
  },
  cap: {
    wasting: 'Fix before you leave',
    todo: 'Do this next',
    ok: 'All good',
    off: 'Not covered yet',
    locked: 'How it opens',
    cantTell: "Can't tell",
  },
  okHero: 'Nothing to do here today',
  okSub: 'Every check here is fine.',
  notCoveredHero: (name: string) => `ActiveOn doesn't check ${name} yet`,
  cantTellHero: "ActiveOn can't tell from your save",
  lockedHero: (name: string) => `${name} isn't open yet`,
  more: (n: number) => (n === 1 ? 'One more step below.' : `${n} more steps below.`),
  whatChecks: 'What ActiveOn checks',
  noChecksYet: 'Nothing yet. ActiveOn shows how it opens and links the wiki.',
  suggestCheck: (name: string) => `Suggest a check for ${name}`,
  wiki: (name: string) => `IdleOn Wiki: ${name}`,
  inGame: 'In game',
  howItOpens: 'How it opens',
  openFromStart: 'Open from the start',
  nothingInGame: 'Nothing to do in game right now',
  check: {
    fine: 'nothing to do',
    todo: 'to do',
    losing: 'losing now',
  },
  checksLine: (titles: readonly string[]) =>
    titles.length ? `Checks: ${titles.join(', ')}` : 'Checks: none yet',
  toolbox: (v: string) => `Toolbox ${v}`,
  sections: (name: string) => `${name} sections`,
} as const;

/**
 * M24: "What it is", one line per System on the thin page (board after/sys/_Simple.dc.html). A plain
 * description of the game feature, never advice; its Source is the System's IdleOn Wiki page, linked on
 * the same page. A System without a line here shows none.
 */
export const SYSTEM_BLURBS: Readonly<Record<string, string>> = {
  classes: "Your characters' classes and subclasses.",
  talents: 'Talent points each character spends in its talent book, on two presets.',
  'talent-resets': 'Reset potions give back the points of one preset so you can spend them again.',
  'gem-shop': 'Account upgrades bought with gems.',
  'merit-shop': "Merits from tasks buy bonuses in each world's merit shop on the Task Board.",
  'task-unlocks': "Task unlock points open recipes on the Task Board's Unlocks tab.",
  pets: 'Companions and the Pet Mart.',
  cards: 'Cards from monster kills, equipped per character, plus one card set bonus each.',
  obols: 'Obols are small stat discs; family obol slots open with family level.',
  portals: 'Portals and the kill counts that open each map.',
  skills: 'Skill levels, skill doors and the tool each skill needs.',
  'random-events': 'One random event a day, somewhere in the worlds.',
  'pet-tournament': 'A tournament for your companions.',
  'task-board': 'Small daily tasks on the Task Board.',
  guild: 'Daily and weekly tasks that earn guild points.',
  forge: 'The Forge smelts ore into bars.',
  bribes: 'Coin-bought bonuses from Mr Pigibank, who also opens Stamps.',
  'post-office': 'Companies send daily orders; filling them earns boxes that give each character bonuses.',
  owl: "Orion the Great Horned Owl's Feather Enterprise, at the Grand Owl Perch.",
  quests: 'NPCs across every world hand out quests; some are needed to move on.',
  'boss-keys': 'Keys for Amarok at End Of The Road in Blunder Hills.',
  colosseum: 'The Dewdrop Colosseum in Blunder Hills. Each run costs 1 ticket.',
  poppy: "Poppy the Kangaroo Mouse's Fish Pond, at The Oasis.",
  arcade: 'Arcade balls build up over time; you spend them at the Arcade for its bonuses.',
  islands: 'Island Expeditions, paid for with Message Bottles.',
  killroy: 'Killroy in the YumYum Grotto: one room a week until World 3 is finished.',
  'weekly-battles': 'A new boss every week, one turn per character.',
  ballot: 'One vote a week for a bonus everyone gets.',
  library: "Talent books raise a talent's max level; checkouts build up over time.",
  'death-note': 'A Construction building that counts kills per map.',
  'salt-lick': 'A Construction building in Frostbite Tundra.',
  equinox: 'Equinox, opened with an Equinox Mirror.',
  'atom-collider': 'The last building at the Construction Table.',
};

/** M24: the thin page's section words. */
export const SIMPLE_WORDS = {
  whatItIs: 'What it is',
  quickCollects: 'Quick collects',
  onTimeline: 'On the Timeline',
  timelineLink: 'Open the Timeline',
  spendPlan: 'In the Spend Plan',
  spendPlanLink: 'Open the Spend Plan',
  untilCap: 'until the cap',
  capsIn: (t: string) => `Caps in ${t}`,
  beforeCap: 'Before it caps',
  seeEvery: (tab: string) => `See every character's ${tab}`,
} as const;

/** M24: the Anvil page (board after/sys/Anvil.dc.html). */
export const ANVIL_WORDS = {
  character: (n: number) => `Character ${n}`,
  smithing: (lv: number) => `Smithing ${lv}`,
  split: (speed: number, cap: number, spare: number) =>
    `${speed} Speed · ${cap} Capacity${spare ? ` · ${spare} spare` : ''}`,
  add: (toSpeed: number, toCap: number, spare: number) =>
    toCap <= 0
      ? `Add ${toSpeed === spare && spare > 1 ? 'all ' : ''}${toSpeed} to Speed`
      : toSpeed <= 0
        ? `Add ${toCap === spare && spare > 1 ? 'all ' : ''}${toCap} to Capacity`
        : `Add ${toSpeed} to Speed, ${toCap} to Capacity`,
  respec: (speed: number, cap: number) => `Respec to ${speed} Speed, ${cap} Capacity`,
  fine: 'Fine as it is',
  cantTell: "Can't tell",
  timesWork: (x: number, h: number) => `about ${x} times the anvil work in ${h}h`,
  moreWork: (p: number, h: number) => `about ${p}% more anvil work in ${h}h`,
  respecAdds: (p: number, h: number) => `a respec adds only about ${p}% in ${h}h`,
  bestSplit: (h: number) => `already the best split for ${h}h`,
  free: 'small, but free',
  hero: (who: string, spare: number, toSpeed: number, toCap: number) =>
    toCap <= 0
      ? `Put ${who}'s ${spare} spare anvil ${spare === 1 ? 'point' : 'points'} into Speed`
      : toSpeed <= 0
        ? `Put ${who}'s ${spare} spare anvil ${spare === 1 ? 'point' : 'points'} into Capacity`
        : `Put ${who}'s ${spare} spare anvil points into Speed (${toSpeed}) and Capacity (${toCap})`,
  alsoSpare: (who: string, n: number) => `${who} has ${n} spare ${n === 1 ? 'point' : 'points'} too.`,
  points: 'points',
  doingNothing: 'doing nothing right now',
  everyCharacter: 'every character',
  only: (who: string) => `${who} only`,
  characters: (n: number) => `${n} characters`,
  why: (slow: string, k: number, fast: string) =>
    `${slow} takes ${k} times the work of ${fast}, so only Speed makes more of it while you're away. Capacity only lets ${fast} keep piling up once it fills.`,
  work: (n: string) => `${n} work`,
  fillsIn: 'fills in',
  workTitle: 'Speed makes the slow items',
  workHint: 'work for one item · fills from empty',
  splitTitle: "Every character's split",
  awayFor: 'Away for',
  legend: { speed: 'Speed', capacity: 'Capacity', spare: 'spare, doing nothing' },
  tabs: { split: 'Point split', makes: 'What each anvil makes' },
  whetstone: 'Anvil Reset Whetstone',
  whetstoneSub: 'moves points you already spent',
  where: 'Where',
  price: 'Price',
  howMany: 'How many',
  // Game facts, Sources on anvil.check.respec (wiki Vendors, Frostbite Towndra; wiki Smithing).
  whereValue: 'World 3 town shop',
  priceValue: '1.2M coins',
  howManyValue: 'one a day',
  worthOn: 'Worth it on',
  worthNone: 'No character gains enough from a respec right now.',
  day: (i: number) => (i === 0 ? 'today' : i === 1 ? 'tomorrow' : `in ${i} days`),
  noExp: 'A respec also clears Exp points; none of your characters has any.',
  hasExp: 'A respec also clears Exp points.',
  fullNow: 'full now',
  fullIn: (t: string) => `full in ${t}`,
  of: (a: string, b: string) => `${a} of ${b}`,
  makesTitle: 'What each anvil makes',
} as const;
