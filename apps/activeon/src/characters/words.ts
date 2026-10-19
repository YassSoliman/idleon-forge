// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (I-character-a): the character page's own words: the strip, the header, the Now tab's side column
// and the Build tab's preset cards, book and ladder. Plain words only; every number comes from the
// engine's view (`view.builds`, the Focus card). Class and level, never a character's name.

const n = (x: number) => x.toLocaleString('en-US');
const plural = (x: number, one: string, many = `${one}s`) => `${n(x)} ${x === 1 ? one : many}`;

export const PAGE_WORDS = {
  strip: 'Characters',
  tabs: 'Character page',
  state: { ready: 'ready', fix: 'fix before you leave', unknown: 'not known' },
  classPath: 'Class path',
  role: 'Role',
  skillsLink: 'Skills →',
  thenHeading: 'Then',
  heroHint: 'your next step for this character',
  /** "Step 1 of 3". */
  stepOf: (i: number, total: number) => `Step ${n(i)} of ${n(total)}`,
  timers: 'Timers',
  about: 'About, on average',
  details: 'Sources and details',
  next: (who: string) => `Next: ${who}`,
  backToAll: 'Back to every character',
} as const;

export const BUILD_WORDS = {
  presets: 'Talent presets',
  inUse: 'in use',
  empty: 'empty',
  fine: 'fine',
  toSpend: 'points to spend',
  talentPoints: 'talent points',
  starPoints: 'star points',
  /** "Spend 869 talent points, starting with Eagle Eye". */
  spend: (points: number, atLeast: boolean, first: string | null, kind = 'talent') =>
    `Spend ${atLeast ? 'at least ' : ''}${plural(points, `${kind} point`)}${first ? `, starting with ${first}` : ''}`,
  addAttacks: (names: readonly string[]) => `Add ${names.join(' and ')} to the attack bar`,
  allSpent: 'Every point is placed',
  /** Why a second preset exists (red team: say to swap in game). */
  skillingWhy: (who: string) =>
    `Your skilling preset is a second set of talents. Swap to it in game when ${who} goes AFK on a skill.`,
  fightingWhy: (who: string) => `Your fighting preset. Swap to it in game when ${who} goes AFK fighting.`,
  /** The quiet preset tile's facts. */
  classAllSpent: 'Class points all spent',
  classWaiting: (points: number, atLeast: boolean) =>
    `${atLeast ? 'at least ' : ''}${plural(points, 'talent point')} waiting`,
  starLeft: (points: number) => `${plural(points, 'star point')} left`,
  emptyAttacks: (count: number) => `${plural(count, 'empty attack slot')}`,
  segTabs: (preset: string) => `${preset}: talent tabs (talent points)`,
  segStar: (preset: string) => `${preset}: star talents (star points)`,
  starTab: 'Star talents',
  /** The caption under the tab controls: one line for both pools (they never add up together). */
  pools: (talent: number, atLeast: boolean, tabs: number, star: number | null) =>
    `Talent points: ${atLeast ? 'at least ' : ''}${n(talent)} across ${plural(tabs, 'tab')}${
      star === null ? '' : ` · Star talents: ${n(star)}, a separate pool`
    }`,
  /** "Skilling preset · Hunter tab: 193 points to place here". */
  tabLine: (preset: string, tab: string) => `${preset} · ${tab}`,
  toPlace: (points: number, atLeast: boolean) =>
    `${atLeast ? 'at least ' : ''}${plural(points, 'point')} to place here`,
  noneToPlace: 'no points waiting here',
  spent: (points: number) => `${n(points)} spent`,
  legend: {
    covered: 'your points cover it',
    next: 'next, when you get more points',
    out: 'not in this build',
  },
  book: (tab: string) => `${tab} talents`,
  ladderH: (preset: string, tab: string) => `${preset}, ${tab}, in order`,
  toFinish: (points: number) => `${n(points)} points to finish`,
  finished: 'every step done',
  keepGoing: 'Got more points in game than ActiveOn shows? Keep going down the list.',
  /** The gold line where the known points run out. */
  endsHere: (points: number, atLeast: boolean, pool: string) =>
    `${atLeast ? 'At least ' : 'Your '}${n(points)} ${pool} points end here`,
  finishStep: (more: number, step: number) => ` · ${plural(more, 'more point')} finish step ${n(step)}`,
  pointsIn: 'points in',
  /** "Build complete at 300 · 66 points have no talent in this build yet". */
  complete: (at: number, spare: number, atLeast: boolean) =>
    `Build complete at ${n(at)}${
      spare > 0
        ? ` · ${atLeast ? 'at least ' : ''}${plural(spare, 'point')} ${spare === 1 ? 'has' : 'have'} no talent in this build yet`
        : ''
    }`,
  status: {
    done: 'Done',
    add: (points: number) => `Add ${n(points)} now`,
    part: (now: number, more: number) => `Add ${n(now)} now · ${plural(more, 'more point')} to finish`,
    next: 'Next',
    last: 'Last step',
    later: 'Later',
  },
  page: (p: number) => `Page ${n(p)}`,
  selected: 'Selected',
  stepOf: (i: number, total: number) => `step ${n(i)} of ${n(total)}`,
  side: {
    canAdd: 'Can add now',
    addOf: (now: number, need: number) => `${n(now)} of ${n(need)} points`,
    toFinish: 'To finish it',
    more: (x: number) => plural(x, 'more point'),
    nextUp: 'Then',
    heroHint: 'your next step for this character',
    /** "Step 1 of 3". */
    stepOf: (i: number, total: number) => `Step ${n(i)} of ${n(total)}`,
    after: 'Points before it',
    level: 'Level',
    done: 'Done',
  },
  attackBar: (heading: string) => `${heading} attack bar`,
  emptySlot: 'Empty slot',
  wants: (name: string) => `Wants ${name}`,
  alsoHas: 'Also has points',
  inBook: {
    covered: (points: number, need: number) =>
      points >= need ? `+${n(points)}` : `+${n(points)} of ${n(need)}`,
    next: 'next',
    later: 'later',
    none: '—',
  },
} as const;
