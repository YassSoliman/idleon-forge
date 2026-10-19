// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Map place's own M24 words (the `Map`, `MapConstellations`, `MapDeathNote`, `MapCards` and `MapW4`
// boards): tab names, hero captions, legends. Only the lazy Map chunk draws them, so they live beside it
// (TR-12). Every engine word stays in `@idleon-forge/engine/map` (`MAP_WORDS`). Nothing here is advice:
// `map.test.tsx` lints this file with the TR-9 lexicon.

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export const MAP_UI_WORDS = {
  tabsLabel: 'Map views',
  srcRoute: 'Doors and kill counts from your save · numbers by IdleOn Toolbox',
  srcStars: 'Constellations from your save · IdleOn Wiki: Star Signs',
  srcDeathNote: 'Kills from your save · IdleOn Wiki: Death Note',
  srcCards: 'Cards from your save · IdleOn Wiki: Cards · numbers by IdleOn Toolbox',
  worldLabel: 'World',
  worldTab: (w: number) => `World ${w}`,
  // ---- Route ----
  heroCap: 'Next door on the route',
  heroGateCap: 'Every route door is open',
  /** "Bowman 81 is there · in about 26m at its kill rate" (QA P3: never "about in 26m"). */
  heroWho: (who: string, when: string | null) =>
    when
      ? `${who} is there · ${/^in /.test(when) ? `in about ${when.slice(3)}` : `about ${when}`} at its kill rate`
      : `${who} is there`,
  heroOf: (need: number) => `of ${fmt(need)} kills`,
  legendOpen: 'door open',
  legendShut: 'door shut · kills needed',
  legendSide: 'side map not reached',
  /** QA P3: the skilling maps' plain squares are this key (their door is a skill level, shown above them). */
  legendNoDoor: 'skill-level door, no door or not known',
  sideMaps: 'Side maps',
  skillMaps: 'Skilling maps',
  boss: (name: string) => `Boss · ${name}`,
  ladderNote: 'The number above a map is the kills on the map before it that open its door.',
  // ---- Constellations ----
  starsBadge: (claimed: number, of: number) => `${claimed} of ${of}`,
  starsCap: 'Star Signs',
  starsNext: 'Your next three',
  starsAll: 'Every constellation, world by world',
  starsPoints: (n: number) => `+${n}`,
  pointsWord: 'points',
  starClaimed: 'claimed',
  starReady: (p: string) => `${p} · ready`,
  starReach: (p: string) => p,
  starFar: 'not reachable yet',
  legendClaimed: 'claimed',
  legendReady: 'done, waiting to be claimed',
  legendReach: 'on a map you reach',
  legendFar: 'not reachable yet',
  starsLine: (ready: number, reach: number) =>
    [ready ? `${ready} done and waiting` : '', reach ? `${reach} on maps you reach` : '']
      .filter(Boolean)
      .join(' · ') || 'none on maps you reach yet',
  // ---- Death Note ----
  dnBadge: (level: number) => `Lv ${level}`,
  dnCap: 'Your kills are banked, not lost',
  dnCloseCap: 'Closest Death Note rank',
  dnBuilding: 'Death Note building',
  dnRanks: 'Ranks, map by map',
  dnAll: 'kills by all your characters together',
  dnClosest: 'closest',
  dnRankReached: 'rank reached',
  dnOnTheWay: 'on the way to the next rank',
  dnRanksAt: (ranks: number[]) => `Ranks at ${ranks.map(short).join(', ')} kills`,
  dnCover: (n: number) =>
    `ActiveOn reads ${n} ${n === 1 ? 'map' : 'maps'} from your save so far; other monsters you have fought count too.`,
  dnFight: (who: string[]) =>
    who.length > 2
      ? `${who.length} characters fight here now`
      : who.length
        ? `${who.join(', ')} ${who.length === 1 ? 'fights' : 'fight'} here now`
        : 'Nobody here right now',
  dnFirst: 'The next level',
  dnWhere: 'Where',
  dnWhereV: 'Construction Table, World 3 town',
  dnNow: 'Building it now',
  dnYes: 'Yes · in a build slot',
  dnNo: 'No · not in a build slot',
  dnCosts: 'Costs',
  dnHold: 'You hold',
  dnHeld: (held: number, need: number) => `${fmt(held)} of ${fmt(need)}`,
  dnRefinery: 'Refinery',
  dnRefineryWhy: 'where salts come from',
  dnConstruction: 'Construction',
  dnConstructionWhy: 'build slots and order',
  dnNone: 'No Death Note kills in your save yet.',
  // ---- Cards ----
  cardsBadge: (have: number, of: number) => `${have} of ${of}`,
  cardsCap: 'Closest card level-up',
  cardTitle: (name: string, missing: number, label: string) =>
    `${name} card: ${fmt(missing)} more ${missing === 1 ? 'copy' : 'copies'} to ${label}`,
  cardOf: (n: number) => `of ${fmt(n)} copies`,
  cardFarming: (who: string[], map: string) =>
    `${who.join(', ')} already ${who.length === 1 ? 'farms' : 'farm'} it at ${map}`,
  cardWhere: (map: string) => `Drops at ${map}`,
  alsoClose: 'Also close',
  cardsAll: 'A card on every fighting map',
  cardLevelKey: 'card level',
  cardNotReached: 'not yet, map not reached',
  cardReached: 'not yet, map reached',
  cardsLine: (have: number, of: number) => `${have} of ${of} cards`,
  cardsHint: 'Card levels come from copies collected; your drop-rate bonuses make every map faster.',
  cardTile: (map: string, level: number | null, odds: string | null) =>
    `${map}: ${level !== null ? `card level ${level}` : 'not yet'}${odds ? ` · ${odds}` : ''}`,
  cardsNone: 'No card data in your save yet.',
} as const;

function short(n: number): string {
  return n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${n / 1000}k` : String(n);
}
