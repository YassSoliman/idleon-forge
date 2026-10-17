// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Cards (M8 TR-3, FR-18, FR-19): one generated Acquisition per card in cards.json,
// `cards.acquisition.<slug of the card's rawName>` (mushG -> mush-g), with its base drop chance per
// monster in `rates` (monsterDrops.json `effectiveChance` of the `Cards<cardIndex>` item) and its set;
// and one Goal ladder per card set, `cards.goal.set-<slug of the set rawName>` (CardSet0 -> set-card-set0).
//
// A set's level is floor(set points / cards in the set), where a card adds 1 when collected and its
// star count + 1 above that (Toolbox getCardSets, parsers/cards.ts: stars = floor(totalStars / n) - 1,
// 0-indexed). So level L needs L × n points: the ladder steps are n, 2n, ... 5n, the base maximum of
// 5 per card (4 stars). Levels 6 and 7 need the extra star tiers (Rift 45, the Spelunking lore boss)
// and ride in `data.starUnlockLevels`, not in the ladder. n counts every card of the set's category,
// as Toolbox does.
import type { GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';
import { humanName } from './world-maps';

interface Card {
  rawName: string;
  displayName: string;
  cardIndex: string;
  perTier: number;
  bonus: number;
  category: string;
}
interface CardSet {
  name: string;
  rawName: string;
  bonus: number;
  effect: string;
}
interface Drop {
  monsterRawName: string;
  rawName: string;
  effectiveChance?: number;
  chance?: number;
}

export const BASE_SET_LEVELS = 5;
const PLACEHOLDER = /^(filler|some[_ ])/i;

const generator = defineGenerator({
  name: 'cards',
  system: 'cards',
  inputs: [
    'website-data/cards.json',
    'website-data/shared-data.json#cardSets',
    'website-data/monsterDrops.json',
  ],
  run({ data, pin }) {
    const cards = data.cards as Record<string, Card>;
    const sets = Object.values(data.cardSets as Record<string, CardSet>);
    const drops = data.monsterDrops as Record<string, unknown[]>;
    if (!cards || Object.keys(cards).length === 0) throw new Error('cards: cards.json is empty');
    const chanceOf = new Map<string, Record<string, number>>();
    for (const rows of Object.values(drops))
      for (const d of (rows ?? []) as Drop[]) {
        if (!d || typeof d.rawName !== 'string' || !d.rawName.startsWith('Cards')) continue;
        const r = chanceOf.get(d.rawName) ?? {};
        r[d.monsterRawName] = Math.max(r[d.monsterRawName] ?? 0, d.effectiveChance ?? d.chance ?? 0);
        chanceOf.set(d.rawName, r);
      }
    const cardSource = generatedSource(pin, 'website-data/cards.json', 'IdleOn Toolbox game data: cards');
    const setSource = generatedSource(
      pin,
      'website-data/shared-data.json#cardSets',
      'IdleOn Toolbox game data: cardSets',
    );
    const by = generatedBy(generator, pin);
    const setByName = new Map(sets.map((s) => [s.name, s]));

    const entries: GeneratedEntryT[] = [];
    for (const [key, c] of Object.entries(cards)) {
      if (PLACEHOLDER.test(c.displayName ?? '')) continue;
      const display = humanName(c.displayName);
      const item = `Cards${c.cardIndex}`;
      const set = setByName.get(c.category);
      const rates = chanceOf.get(item);
      entries.push({
        id: `cards.acquisition.${slugify(key)}`,
        system: 'cards',
        type: 'acquisition',
        origin: 'generated',
        title: `Card: ${display}`.slice(0, 80),
        text: `${display} card`.slice(0, 240),
        why: 'Cards drop from their monster or resource; more copies raise the card and its set.',
        values: {
          name: c.displayName,
          cardIndex: c.cardIndex,
          item,
          perTier: c.perTier,
          set: c.category,
          ...(set ? { setRawName: set.rawName } : {}),
        },
        sources: [cardSource],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        thing: { kind: 'card', rawName: key },
        ...(rates ? { rates } : {}),
        generatedBy: by,
      });
    }
    for (const s of sets) {
      const members = Object.entries(cards)
        .filter(([, c]) => c.category === s.name)
        .map(([k]) => k)
        .sort();
      const n = members.length;
      if (n === 0) continue; // a set with no cards in this data has no ladder
      const display = humanName(s.name);
      entries.push({
        id: `cards.goal.set-${slugify(s.rawName)}`,
        system: 'cards',
        type: 'goal',
        origin: 'generated',
        title: `Card set: ${display}`.slice(0, 80),
        text: `{value:int} ${display} set points; next set level at {next:int}`.slice(0, 240),
        why: 'A card set gives its bonus once equipped; each set level multiplies it.',
        values: { set: s.name, setRawName: s.rawName, cards: n },
        sources: [setSource, cardSource],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        scope: 'account',
        category: 'compounding',
        unit: 'set points',
        progress: { id: 'cards/set', params: { set: s.rawName } },
        milestones: Array.from({ length: BASE_SET_LEVELS }, (_, i) => ({
          at: n * (i + 1),
          reward: `set level ${i + 1}`,
        })),
        data: {
          members,
          starUnlockLevels: [6, 7].map((level) => ({ level, at: n * level })),
        },
        generatedBy: by,
      });
    }
    return { entries };
  },
});

export default generator;
