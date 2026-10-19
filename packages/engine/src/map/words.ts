// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7: the Map area's view words (area M): the Map place, its bands, gates, overlays and the map
// sheet. The map is facts, not advice (FR-M7): nothing here tells the player what to do except the
// frontier's one step, which is M2's push said in the map's terms. `view-words.test` lints this file.

export const MAP_WORDS = {
  /** The place heading (a pixel display face at 16 px and up). */
  title: 'Map',
  /** "3 of 4 worlds open · 6 characters". */
  summary: (open: number, of: number, characters: number) =>
    `${open} of ${of} worlds open · ${characters} character${characters === 1 ? '' : 's'}`,
  /**
   * "7 of 7 route doors open · 6 side maps not reached". R11 QA: the count is the route's doors, so the
   * locked maps off the route are named apart instead of sitting beside "7 of 7" unexplained.
   */
  doorsOpen: (cleared: number, total: number, side = 0) =>
    `${cleared} of ${total} route doors open${side > 0 ? ` · ${side} side map${side === 1 ? '' : 's'} not reached` : ''}`,
  /** A finished world, folded to one line. */
  fold: (cleared: number, total: number, side = 0) =>
    `${cleared} of ${total} route doors open${side > 0 ? ` · ${side} side map${side === 1 ? '' : 's'} not reached` : ''}`,
  opensWith: (item: string) => `Opens with the ${item}`,
  opensAfter: (boss: string) => `Opens after ${boss}`,
  notCovered: 'Worlds 5+ · not covered yet',
  notCoveredHeading: 'Worlds 5+',
  notCoveredLine: 'Not covered yet',
  /** The boss gate's lines. */
  crystalIn: (item: string) => `${item} handed in`,
  crystalHeld: (item: string, held: number, need: number) => `${item}: ${held} of ${need} held`,
  keysWaiting: (n: number, perDay: number) =>
    perDay > 0
      ? `${n} key${n === 1 ? '' : 's'} waiting · ${perDay} earned a day`
      : n > 0
        ? `${n} key${n === 1 ? '' : 's'} waiting`
        : 'No one earns these keys yet',
  gateDone: 'Gate open',
  gateLocked: 'Gate closed',
  /** The frontier ring. */
  now: 'Now',
  nextDoor: 'Next door',
  doorTo: (from: string, to: string) => `${from} to ${to}`,
  kills: (done: number, need: number) => `${fmt(done)} of ${fmt(need)} kills`,
  push: (left: number, to: string) => `Kill ${fmt(left)} more here to open ${to}`,
  pushAny: (left: number) => `Kill ${fmt(left)} more here to open the next door`,
  noFighter: 'Nobody can fight here yet',
  alsoHere: (world: string) => `Also in ${world}:`,
  here: 'Here',
  hereList: (names: string[]) => `Here: ${names.join(', ')}`,
  /** Node states, in words (never colour alone). */
  stateTown: 'Town',
  stateCleared: 'door open',
  stateFrontier: 'next door',
  stateReached: 'reached',
  stateLocked: 'not reached',
  doorNeeds: (n: number) => `${fmt(n)} kills for its door`,
  doorLevel: (n: number) => `Lv ${fmt(n)} for its door`,
  levelTag: (n: number) => `Lv ${fmt(n)}`,
  /** The overlay switcher (FR-M3): one overlay at a time. */
  overlayLabel: 'What the map shows',
  overlayRoute: 'Route',
  overlayStars: 'Constellations',
  overlayDeathNote: 'Death Note',
  overlayCards: 'Cards',
  ringRoute: (map: string) => `${map}: the next door on the route`,
  ringGate: (boss: string) => `Every door on the route is open; ${boss}'s gate comes next`,
  ringStars: (name: string, map: string) => `${name} is on ${map}, a map you have reached`,
  ringDeathNote: (map: string, left: number, rank: string) =>
    `${map}: ${fmt(left)} kills to Death Note ${rank}, the closest`,
  ringCards: (map: string) => `${map}: the easiest card you don't have yet`,
  ringNone: 'Nothing to ring on this overlay yet',
  tapHint: 'Tap a map to see who is there and what its door needs.',
  listLabel: 'Every map, in world order',
  /** The map sheet (FR-M2), in its order. */
  sheetWho: 'Who is here',
  sheetNobody: 'Nobody here right now',
  sheetDoor: (to: string) => `Next door: ${to}`,
  sheetDoorAny: (n: number) => `Door ${n}`,
  sheetDoorLine: (need: number) => `Opens after ${fmt(need)} kills here, for each character.`,
  sheetDoorOpen: (open: number, of: number) => `${open} of ${of} characters have it open.`,
  sheetCard: 'Card here',
  cardLevel: (level: number) => `Card level ${level}`,
  cardNotYet: 'Not yet',
  cardChance: (one: number) => `Base drop: 1 in ${fmt(one)} kills`,
  sheetDeathNote: 'Death Note',
  deathNoteKills: (kills: number) => `${fmt(kills)} kills`,
  deathNoteNext: (left: number, rank: string) => `${fmt(left)} kills to ${rank}`,
  deathNoteTop: 'Top rank reached',
  sheetStars: 'Constellations here',
  close: 'Close',
  /** The place's own controls and states. */
  showMaps: (n: number) => `Show its ${n} maps`,
  hideMaps: 'Hide its maps',
  mainRoute: 'Fighting maps',
  skillMaps: 'Skilling maps',
  empty: 'The map shows once your save names a current world.',
  ringLabel: 'Ringed',
  /** M24: a constellation's progress, "5 of 3". */
  starProgress: (done: number, of: number) => `${done} of ${of}`,
} as const;

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
