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
  /** M25 (board m25/SystemsSearch.dc.html): the search field, its list and the quick filters. */
  search: {
    label: 'Search Systems',
    placeholder: 'Find a System (try "cogs")',
    key: '/',
    keyHint: 'Press / to search',
    listLabel: 'Matching Systems',
    /** Around a matched player word: matches "cogs". */
    aliasLead: 'matches "',
    aliasEnd: '"',
    sectionLead: 'section: ',
    keys: '↑ ↓ move · Enter opens · Esc clears',
    clearQuery: 'Clear the search',
    count: (n: number) => (n === 1 ? '1 System matches' : `${n} Systems match`),
    none: 'No System matches',
  },
  worldLegend: 'World',
  accountWide: 'Account-wide',
  worldShort: (w: number) => (w === 0 ? INDEX_WORDS.accountWide : `${w}`),
  worldName: (w: number) => (w === 0 ? INDEX_WORDS.accountWide : `World ${w}`),
  statusLegend: 'Status',
  statusFilters: {
    wasting: 'Wasting now',
    behind: 'Behind',
    todo: 'To do',
    fine: 'Fine',
    notCovered: 'Not covered',
    locked: 'Locked',
  },
  clearAll: 'Clear all',
  shown: (n: number, all: number) => `${n} of ${all} Systems`,
  emptyTitle: 'Nothing here',
  emptyQuery: (q: string) => `No System matches "${q}".`,
  emptyFilters: 'No System fits these filters.',
  emptyHint: 'Check the spelling, try a word like cogs or salts, or turn a filter off.',
  emptyHintFilters: 'Turn a filter off to see more.',
  worldSub: (systems: number, need: number, notCovered: number, locked: number, readOnly = 0) =>
    [
      `${systems} ${systems === 1 ? 'System' : 'Systems'}`,
      locked > 0 && locked === systems ? 'all locked' : null,
      readOnly > 0 && readOnly === systems ? 'read-only, no checks yet' : null,
      need > 0 ? `${need} ${need === 1 ? 'needs' : 'need'} you` : null,
      notCovered > 0 ? `${notCovered} not covered` : null,
      readOnly > 0 && readOnly < systems ? `${readOnly} read-only` : null,
      locked > 0 && locked < systems ? `${locked} locked` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  seeOnMap: 'See it on the Map',
  readOnly: 'read-only',
  readOnlyName: 'Read-only, no checks yet',
  tileSub: { 'not-covered': 'not covered yet', locked: 'locked', 'cant-tell': "can't tell" } as Readonly<
    Record<string, string>
  >,
  legend: {
    wasting: 'wasting',
    todo: 'behind or to do',
    ok: 'nothing to fix',
    notCovered: 'not covered yet',
    locked: 'locked',
    readOnly: 'read-only, no checks yet',
  },
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
    readOnly: 'Read-only',
    readOnlyReason: 'no checks yet',
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
  /** QA P1-5: caps full now, with their own verb ("5 full · spend"). */
  capsFull: (n: number, verb: string) => `${n} full · ${verb}`,
  /** "Worship full on 5 characters". */
  capsHero: (what: string, n: number) => `${what} full on ${n === 1 ? '1 character' : `${n} characters`}`,
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
    titles.length === 0
      ? 'Checks: none yet'
      : titles.length <= 5
        ? `Checks: ${titles.join(', ')}`
        : `Checks: ${titles.slice(0, 4).join(', ')} and ${titles.length - 4} more`,
  moreChecks: (n: number) => `${n} more checks: nothing to do`,
  everyStep: (n: number) => `Every step in order${n ? ` (${n})` : ''}`,
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
  moreSpare: (n: number) => `${n} more ${n === 1 ? 'character has' : 'characters have'} spare points.`,
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

/** M24: the Stamps page (board after/sys/Stamps.dc.html). */
export const STAMPS_PAGE_WORDS = {
  tabs: { collect: 'Collect', level: 'Level up', book: 'Stamp book' },
  nextTitle: 'Next stamps',
  nextHint: 'in order · now first',
  bookTitle: 'Your stamp book',
  stamps: (n: number) => (n === 1 ? 'stamp' : 'stamps'),
  toCollect: (from: number, to: number, total: number) => `${from} → ${to} of ${total}`,
  ofTotal: (n: number, total: number) => `${n} of ${total}`,
  collected: (n: number, total: number) => `${n} of ${total} collected`,
  later: (n: number) => `${n} more need a new world, an earlier quest or a drop.`,
  levelTitle: 'Level up',
  levelInPlan: 'Level up · in the Spend Plan',
  levelEmpty: 'No stamp level-up is in the Spend Plan right now.',
  levelRows: 'Stamps to level',
  nextLevel: (lv: number, cap: number) => `Lv ${lv} of ${cap}`,
  nextCost: (coins: string) => `next level ${coins}`,
  capRaise: 'cap raise in the Spend Plan',
  whenNow: 'Now',
} as const;

/** M24: the Statues page (board after/sys/Statues.dc.html). */
export const STATUES_PAGE_WORDS = {
  tabs: { wall: 'Statue wall', who: 'By character' },
  inPlan: 'In your Spend Plan',
  hero: (name: string) => `Turn the ${name} Gold`,
  subPrice: (coins: string) => `It's the next statue on your wall that isn't Gold yet. Gold costs ${coins}.`,
  subNoPrice:
    "It's the next statue on your wall that isn't Gold yet. ActiveOn doesn't know its price, so check it in game.",
  ofGold: (total: number) => `of ${total} Gold`,
  onyx: (n: number) => (n === 0 ? 'none Onyx yet' : `${n} Onyx`),
  legendGold: 'Gold',
  legendNot: 'not Gold yet',
  legendNumber: 'Number = highest level on any character',
  highlighted: (name: string) => `The highlighted statue is ${name}.`,
  byCharacter: (name: string) => `${name} by character`,
  perCharacter: 'Statues level up per character.',
  noSplit: "The save doesn't split this statue's levels by character.",
  whoTitle: 'Statue levels by character',
  levelled: (n: number) => `${n} ${n === 1 ? 'statue' : 'statues'} levelled`,
  highest: (name: string, lv: number) => `highest: ${name} Lv ${lv}`,
  level: (n: number) => `Lv ${n}`,
  aria: (name: string, lv: number, grade: string) => `${name}, level ${lv}, ${grade}`,
} as const;

/** M24: the Upgrade Vault page (board after/sys/UpgradeVault.dc.html). */
export const VAULT_PAGE_WORDS = {
  tabs: { tower: 'Tower', plan: 'Spend Plan', all: (n: number) => `All ${n} upgrades` },
  hero: (level: number, name: string, coins: string) =>
    level === 0
      ? `Buy the first level of ${name} for ${coins}`
      : `Buy level ${level + 1} of ${name} for ${coins}`,
  sub: (gap: string | null) =>
    ['Every level counts toward the next floor, whichever upgrade it is.', gap].filter(Boolean).join(' '),
  gap: (levels: number, name: string) => `${levels} more Vault levels open ${name}.`,
  coins: 'coins',
  levelOf: (lv: number, max: number) => `level ${lv} of ${max}`,
  towerTitle: 'The tower',
  towerHint: 'newest at the top · each opens at a total of Vault levels',
  here: 'You are here',
  levels: (n: string) => `${n} Vault levels`,
  nextToOpen: (n: number) => `the next to open: ${n} more levels`,
  opensLater: 'opens later',
  atLevels: (n: string) => `at ${n} levels`,
  openedAt: (n: string) => `opened at ${n}`,
  buyNext: 'buy this next',
  rowNote: (lv: number, max: number, coins: string | null) =>
    coins ? `level ${lv} of ${max} · next level ${coins}` : lv >= max ? 'maxed' : `level ${lv} of ${max}`,
  inPlan: 'In the Spend Plan',
  cheapest: 'Cheapest levels first: every level counts toward the next floor, whichever upgrade it is.',
} as const;

/** M24: the Talent presets page (board after/sys/TalentPresets.dc.html). */
export const PRESETS_PAGE_WORDS = {
  tabs: { waiting: 'Points waiting', star: 'Star points', on: 'Which preset is on' },
  characters: (n: number) => (n === 1 ? 'character' : 'characters'),
  havePoints: 'have points waiting',
  setUp: 'set up',
  waiting: 'points waiting',
  toSpend: (n: number) => `${n.toLocaleString('en-US')} points to spend`,
  atLeast: (n: number) => `Empty: at least ${n.toLocaleString('en-US')} points`,
  noneWaiting: 'nothing waiting',
  startWith: (t: string) => `start with ${t}`,
  build: 'Build',
  buildOf: (who: string) => `Open the Build of ${who}`,
  how: 'How presets work',
  howLines: [
    'Each preset spends all your talent points on its own, so a second preset costs nothing.',
    'Fight on the fighting preset, then swap before you leave a character skilling.',
    'Star points are spent per preset too.',
  ],
  role: { fighting: 'Fighting', skilling: 'Skilling', other: 'Other' } as Readonly<Record<string, string>>,
  starTitle: 'Star points per preset',
  starNone: 'No star points waiting.',
  starPoints: (n: number) => `${n.toLocaleString('en-US')} star points`,
  onTitle: 'The preset each character is on',
  active: 'on now',
  noBuilds: 'ActiveOn has no Build data for your characters yet.',
} as const;

/** M24: the Gear & Tools page (board after/sys/GearTools.dc.html). */
export const GEAR_PAGE_WORDS = {
  tabs: { empty: 'Empty slots', weapons: 'Weapons', worn: 'Everything worn' },
  emptySlots: (n: number) => (n === 1 ? 'empty slot' : 'empty slots'),
  onCharacters: (n: number) => `on ${n} ${n === 1 ? 'character' : 'characters'}`,
  slot: {
    helmet: 'Helmet',
    weapon: 'Weapon',
    shirt: 'Shirt',
    pendant: 'Pendant',
    pants: 'Pants',
    ring1: 'Ring',
    shoes: 'Shoes',
    ring2: 'Ring',
    pickaxe: 'Pickaxe',
    hatchet: 'Hatchet',
    rod: 'Fishing rod',
    net: 'Bug net',
  } as Readonly<Record<string, string>>,
  held: (what: string) => `In storage: ${what}`,
  anyPiece: 'Any piece',
  noEmpty: 'No empty gear slots.',
  thenWeapons: 'Then: weapons',
  unlockLine: 'These recipes open at the Task Board or the Merit Shop first.',
  unlock: (what: string) => `Unlock ${what}`,
  where: (kind: 'task-unlock' | 'merit', world: number) =>
    kind === 'merit' ? `World ${world} Merit Shop` : `World ${world} Task Board, Unlocks tab`,
  tasksLink: 'Tasks: spend unlock points',
  weaponsTitle: 'Every weapon',
  now: (name: string) => `${name} now`,
  next: (name: string) => `next: ${name}`,
  noWeapon: 'no weapon',
  ok: 'fine for now',
} as const;

/** M24: the Minigames page (board after/sys/Minigames.dc.html). */
export const MINIGAMES_PAGE_WORDS = {
  tabs: { today: 'Today', points: 'Points to spend' },
  rounds: (n: number) => (n === 1 ? 'round' : 'rounds'),
  readyNow: 'ready now',
  games: { darts: 'Darts', hoops: 'Hoops', spiketrap: 'Spiketrap Surprise' },
  play: 'Play a round',
  ready: 'Ready now',
  readyIn: (t: string) => `Ready in ${t}`,
  gems: 'Gems today',
  nothing: 'Nothing to do',
  pointsToSpend: 'Points to spend',
  playsToday: (n: number) => `${n} ${n === 1 ? 'play' : 'plays'} today`,
  best: (n: number) => `best round ${n}`,
  dartsTitle: 'Where Darts points go',
  dartsHint: (points: number, levels: number) => `${points} to spend · ${levels} levels so far`,
  // From minigames.check.darts-spend's why (Toolbox getDartsData; the Minigames dossier).
  dartsOrder: [
    ['DMG', 'until 40 levels in total'],
    ['TALENT and DMG', 'after that, side by side'],
    ['VAULT', 'last'],
  ] as const,
  hoopsNote: "Hoops points: ActiveOn doesn't show Hoops prices yet, so spend those in game.",
  plays: (n: number) => `${n} skill minigame ${n === 1 ? 'play' : 'plays'} left today`,
} as const;

/** M24: the Star Signs page (board after/sys/StarSigns.dc.html). */
export const SIGNS_PAGE_WORDS = {
  tabs: { road: 'Road to two signs', who: 'Signs by character', chart: 'Star Chart' },
  roadTitle: 'Road to two signs',
  telescope: 'The Telescope',
  telescopeDone: 'You reached it: constellations count for every character.',
  telescopeKills: (n: number) => `${n.toLocaleString('en-US')} more kills open the way up`,
  telescopeOpen: 'Reachable now: hand in the Telescope quest',
  telescopeWho: (who: string) => `${who} · now`,
  constellations: 'Constellations',
  constellationsLine: (n: number, pts: number) =>
    `${n} ${n === 1 ? 'constellation is' : 'constellations are'} next, worth ${pts} Star Chart points`,
  noConstellations: 'No constellation in reach right now.',
  holdPoints: (n: number) => `you have ${n} ${n === 1 ? 'point' : 'points'} now`,
  cosmos: 'Chronus Cosmos',
  cosmosDone: 'Unlocked: every character wears 2 signs',
  cosmosLine: 'Unlock it on the Star Chart: every character wears 2 signs',
  done: 'done',
  whoTitle: 'What each character wears',
  whoHint: 'signs change only at the Telescope',
  swapTo: (signs: string) => `Swap to ${signs}`,
  wears: (signs: string) => `wears ${signs}`,
  right: 'already right',
  nothingWorn: 'no sign',
  killsToReach: (n: number) => `about ${n.toLocaleString('en-US')} kills until it can reach the Telescope`,
  afterCosmos: 'After Chronus Cosmos',
  chartBadge: (n: number, max: number) => `${n} of ${max}`,
} as const;
