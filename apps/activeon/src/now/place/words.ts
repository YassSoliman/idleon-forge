// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (area I-now): the words of the Now place and the Characters place that the engine's word files
// don't already have. Casual-first: plain verbs, class + level, units on numbers. Every number comes
// from the engine's views; these only put it into a sentence.

const n = (x: number) => x.toLocaleString('en-US');
const plural = (x: number, one: string, many = `${one}s`) => `${n(x)} ${x === 1 ? one : many}`;
/** "Worship charge" from "worship charge". */
export const upperFirst = (s: string) => (s ? s[0]?.toUpperCase() + s.slice(1) : s);
/** "craft Copper Boots…" from "Craft Copper Boots…" (not for a name that starts the sentence). */
export const lowerFirst = (s: string) =>
  s.length > 1 && /[A-Z]/.test(s[0] ?? '') && /[a-z ]/.test(s[1] ?? '')
    ? s[0]?.toLowerCase() + s.slice(1)
    : s;

export const NOW_PLACE_WORDS = {
  /** The hero's one-word verdict (rule 7: gold do it, coral losing now, mint fine, grey can't tell). */
  verdict: { fix: 'Fix first', collect: 'Collect', ready: 'Ready', unknown: "Can't tell" },
  heroLabel: 'Before you log off',
  thenSafe: (back: string) => `then you're safe to log off for ${back}`,
  safeFor: (back: string) => `Safe to log off for ${back}`,
  fixesLeft: (count: number) => `${plural(count, 'fix', 'fixes')} before you leave`,
  /** "Worship charge is full on 5 characters". */
  fullOn: (what: string, count: number, who: string | null) =>
    count === 1 && who
      ? `${upperFirst(what)} is full on ${who}`
      : `${upperFirst(what)} is full on ${plural(count, 'character')}`,
  /** "Spend it so it fills again. Nothing else blocks your AFK." */
  fullWhy: (verb: string | null, nothingElse: boolean) =>
    `${upperFirst(verb ?? 'collect')} it so it fills again.${nothingElse ? ' Nothing else blocks your AFK.' : ''}`,
  alsoFull: (what: string, count: number) => `Also full: ${what} on ${plural(count, 'character')}`,
  losingNow: 'being lost now',
  how: 'How',
  readySub: (fill: string | null) => fill ?? 'Nothing fills up before you are back.',
  cantTell: "We can't tell yet whether it's safe to log off",
  // The Away line (red-team #3).
  awayLead: 'While you were away',
  filledUp: (count: number, what: string) => `${n(count)} ${what} filled up`,
  lost: (label: string) => label,
  allFighting: (count: number) => (count === 1 ? 'still fighting' : `all ${n(count)} still fighting`),
  // Before you're back.
  backTitle: "Before you're back",
  awayAsk: 'How long are you away?',
  now: 'now',
  back: (span: string) => `You're back · ${span}`,
  keyChar: (what: string | null) => (what ? `a character's ${what} fills` : "a character's limit"),
  keyAccount: (labels: string[]) => labels.join(', '),
  limitsInAll: (count: number) => `${plural(count, 'limit')} in all`,
  nothingBefore: 'Nothing fills up before you are back.',
  timeline: 'Timeline',
  // The character cards.
  characters: 'Characters',
  inVisitOrder: 'in visit order',
  stateCount: (count: number, word: string) => `${n(count)} ${word.toLowerCase()}`,
  /** "Health food: can't tell when it runs out on 6 characters". */
  untimed: (what: string, kindWord: string, count: number) =>
    `${upperFirst(what)}: can't tell when it ${kindWord === 'full' || kindWord === 'ready' || kindWord === 'lost' ? `is ${kindWord}` : kindWord} on ${plural(count, 'character')}`,
  thenTask: (task: string) => `Then ${lowerFirst(task)}`,
  timer: (label: string, when: string) => `${label} ${when}`,
  // Coins.
  coinsTitle: (buys: number, chars: number) =>
    `Coins to spend · ${plural(buys, 'buy')} on ${plural(chars, 'character')}`,
  coinsWho: (buys: number, coins: string) => `${plural(buys, 'buy')} · ${coins} coins`,
  spendPlan: 'Spend Plan',
  // The rail.
  account: 'Account',
  fixes: (count: number) => (count === 1 ? 'fix' : 'fixes'),
  goals: (count: number) => (count === 1 ? 'Goal' : 'Goals'),
  daily: 'Daily',
  dailyDone: (done: number, total: number) => `${n(done)} of ${n(total)} done`,
  dailyRing: (done: number, total: number) => `Daily: ${n(done)} of ${n(total)} done`,
  lostAtReset: 'Lost at the reset',
  moreDaily: (today: number, week: number) =>
    `${today > 0 ? `${n(today)} more today` : ''}${today > 0 && week > 0 ? ', ' : ''}${week > 0 ? `${n(week)} this week` : ''}`,
  dailyLink: 'Daily & weekly',
  upNext: 'Up next',
  coinsShort: (buys: number, chars: number) => `${plural(buys, 'buy')} on ${plural(chars, 'character')}`,
  coinsCap: 'Coins to spend',
  // Rounds.
  startRound: (pos: number, total: number) => `Start your round · ${n(pos)} of ${n(total)}`,
  nextRound: (pos: number, total: number) => `Next on your round · ${n(pos)} of ${n(total)}`,
  open: (who: string) => `Open ${who}`,
  thenAlso: (verb: string, what: string) => `then ${verb} its ${what}`,
  yourRound: 'Your round',
  roundSummary: (chars: number, maps: number, fixes: number) =>
    `${plural(chars, 'character')} · ${plural(maps, 'map')} · ${fixes > 0 ? `${plural(fixes, 'fix', 'fixes')} first` : 'all safe to leave'}`,
  sameJob: (count: number, text: string) => `Same job on ${n(count)}: ${lowerFirst(text)}`,
  sameJobFull: (count: number, verb: string, what: string) =>
    `Same job on ${n(count)}: ${verb} the full ${what}`,
  oneTrip: (count: number, map: string) =>
    `All ${n(count)} are at ${map}, so it's one trip · do it as you pass each one`,
  trips: (maps: string[]) => `Map by map: ${maps.join(' · ')}`,
  leavingSoon: (count: number) => `Leaving soon? ${plural(count, 'full thing')} to collect first`,
  leavingFix: (count: number) => `Leaving soon? ${plural(count, 'fix', 'fixes')} first`,
  logOff: 'Log off',
  // Log in.
  welcome: 'Welcome back',
  fullRow: (what: string, count: number) => `${upperFirst(what)} filled up on ${plural(count, 'character')}`,
  filledWhileAway: (count: number) =>
    count === 0
      ? 'Nothing filled up while you were away'
      : `${plural(count, 'thing')} filled up while you were away`,
  startWith: 'Start with',
  showMe: 'Show me',
  account1: 'Account',
  thenRound: 'Then your round',
  roundLine: (chars: number, fixes: number) =>
    `${plural(chars, 'character')}, one job each · ${fixes > 0 ? `${plural(fixes, 'fix', 'fixes')} first` : 'every one is safe to leave'}`,
  rounds: 'Rounds',
  rowLink: { limit: 'Timeline', reset: 'Daily', level: 'Build' },
} as const;

export const CHARACTERS_PLACE_WORDS = {
  title: 'Characters',
  sub: (count: number, family: number | null) =>
    `${plural(count, 'character')}${family !== null ? ` · family level ${n(family)}` : ''} · sorted by Visit order: fix first, then most to spend`,
  legend: { gold: 'do it', mint: 'fine', mut: 'later' },
  cols: {
    who: 'Visit order',
    afk: 'AFK target',
    build: 'Talent points',
    gear: 'Gear slots',
    cards: 'Card preset',
    signs: 'Star sign',
    skills: 'Parallel slots',
  } as Record<string, string>,
  small: {
    build: { behind: 'to spend', ok: 'all spent', unknown: 'no build yet' },
    gear: { fix: 'held · wear it', behind: 'behind your level' },
    cards: { fix: 'switch it', behind: 'you own them' },
    signs: { behind: 'swap them' },
    skills: { behind: 'fill one now' },
  } as Record<string, Partial<Record<string, string>>>,
  stateWhy: { fix: 'fix before you leave', ready: 'nothing full', unknown: "can't tell from the save" },
  fullWhat: (what: string) => `${what} full`,
  hint: "Each square opens that character's tab.",
  allAfk: (count: number, what: string) => ` All ${n(count)} AFK in ${what}.`,
  noAfk: 'not known',
  nextCap: (slot: number) => `Next character · slot ${n(slot)}`,
  familyOf: (at: number, of: number) => `Family level ${n(at)} of ${n(of)}`,
  toGo: (gap: number) => `${n(gap)} to go`,
  slotOpen: 'The slot is open now',
  tree: 'Your class tree',
  ghost: (slot: number, at: number | null) =>
    at !== null ? `slot ${n(slot)}, at ${n(at)}` : `slot ${n(slot)}`,
  noOne: 'no one yet',
  skills: 'Skills',
  noOneBuilt: (list: string) => `No one is built for ${list}`,
  shade: 'brighter = higher level',
  roleKey: 'gold = the skill this character should train (its Role)',
} as const;
