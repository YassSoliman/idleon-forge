// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `cards.fact.drops` (M8 "Cards view", owner request 2026-10-18): one compact row per card, by card
// rawName, so the Cards view can name a card the account doesn't own yet, show what it does and say
// where it drops. A row has the display name, the effect text and bonus per level (cards.json), the
// copies per tier, the set, the best base drop chance with its monster (monsterDrops.json
// `effectiveChance` of the `Cards<cardIndex>` item, before the game's ×5-while-unowned rule and its
// card drop multiplier), the monster's AFK type (monsters.json) and the real maps it spawns on
// (shared-data `mapEnemiesArray`, placeholder maps left out, as items.gen.ts does). A card with no map
// (bosses, crystal mobs, most trees and fish, events) keeps `maps: []`; the view never guesses one.
// It is a fact table rather than 274 Acquisitions so it ships small (kb-budget.json). Generated tables
// cite Toolbox only; the Cards view carries the wiki Cards page as its player-facing Source (#74).
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, PLACEHOLDER_MAP_NAMES } from './types';

interface Card {
  rawName: string;
  displayName: string;
  cardIndex: string;
  effect?: string;
  bonus?: number;
  perTier: number;
  category: string;
}
interface Drop {
  monsterRawName: string;
  rawName: string;
  effectiveChance?: number;
  chance?: number;
}

/** One row of `cards.fact.drops`. */
export interface CardDropRow {
  name: string;
  effect: string;
  bonus: number;
  perTier: number;
  set: string;
  /** Best base chance per kill (or per resource action) over the monsters that drop it; 0 when none. */
  chance: number;
  monster: string | null;
  afkType: string | null;
  maps: number[];
}

const PLACEHOLDER = /^(filler|some[_ ])/i;

const generator = defineGenerator({
  name: 'card-drops',
  system: 'cards',
  inputs: [
    'website-data/cards.json',
    'website-data/monsterDrops.json',
    'website-data/monsters.json',
    'website-data/shared-data.json#mapEnemiesArray',
    'website-data/shared-data.json#mapNames',
  ],
  run({ data, pin }) {
    const cards = data.cards as Record<string, Card>;
    const drops = data.monsterDrops as Record<string, unknown[]>;
    const monsters = data.monsters as Record<string, { AFKtype?: string }>;
    const enemies = data.mapEnemiesArray as string[];
    const mapNames = data.mapNames as Record<string, string>;
    if (!cards || Object.keys(cards).length === 0) throw new Error('card-drops: cards.json is empty');
    if (!Array.isArray(enemies) || enemies.length < 100)
      throw new Error('card-drops: mapEnemiesArray is missing or short; the data shape changed');

    const mapsOf = new Map<string, number[]>();
    enemies.forEach((m, i) => {
      const name = mapNames[String(i)];
      if (!m || m === 'Nothing' || name === undefined || PLACEHOLDER_MAP_NAMES.has(name)) return;
      mapsOf.set(m, [...(mapsOf.get(m) ?? []), i]);
    });
    // Best chance per card item, with the monster that gives it (ties: the alphabetically first monster).
    const best = new Map<string, { monster: string; chance: number }>();
    for (const monster of Object.keys(drops).sort())
      for (const d of (drops[monster] ?? []) as Drop[]) {
        if (!d || typeof d.rawName !== 'string' || !d.rawName.startsWith('Cards')) continue;
        const chance = d.effectiveChance ?? d.chance ?? 0;
        const was = best.get(d.rawName);
        if (!was || chance > was.chance)
          best.set(d.rawName, { monster: d.monsterRawName ?? monster, chance });
      }

    const rows: Record<string, CardDropRow> = {};
    for (const key of Object.keys(cards).sort()) {
      const c = cards[key] as Card;
      if (PLACEHOLDER.test(c.displayName ?? '')) continue;
      const drop = best.get(`Cards${c.cardIndex}`) ?? null;
      // The card's own monster first (its rawName), then the monster whose table drops it.
      const monster = mapsOf.has(key) ? key : (drop?.monster ?? (monsters[key] ? key : null));
      rows[key] = {
        name: c.displayName,
        effect: typeof c.effect === 'string' ? c.effect : '',
        bonus: typeof c.bonus === 'number' ? c.bonus : 0,
        perTier: c.perTier,
        set: c.category,
        chance: drop?.chance ?? 0,
        monster,
        afkType: (monster && monsters[monster]?.AFKtype) || null,
        maps: monster ? (mapsOf.get(monster) ?? []) : [],
      };
    }
    const fact: FactTableT = {
      id: 'cards.fact.drops',
      system: 'cards',
      origin: 'generated',
      title: 'Cards: effect, copies per tier, base drop chance and drop maps',
      rows: rows as unknown as FactTableT['rows'],
      sources: [
        generatedSource(pin, 'website-data/cards.json', 'IdleOn Toolbox game data: cards and monster drops'),
      ],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
