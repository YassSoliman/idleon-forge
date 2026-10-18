// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// generated/_lookups.json (M11 TR-10): name tables used by `kb check` (class, talent, item, monster,
// map rawNames) and by the scrub's unknown-string scan (TR-14 step 4). Validation only, never shipped.
import { defineGenerator } from './types';

interface ClassPromotion {
  promotesTo?: string[];
  promotesFrom?: string;
  talentTabs?: string[];
}

const sorted = (xs: Iterable<string>) =>
  [...new Set([...xs].filter((x) => typeof x === 'string' && x !== ''))].sort();

/** class -> every class it promotes to, transitively. */
export function classTreeOf(promotions: Record<string, ClassPromotion>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const down = (c: string, seen: Set<string>): string[] => {
    const next = promotions[c]?.promotesTo ?? [];
    const all: string[] = [];
    for (const n of next) {
      if (seen.has(n)) continue;
      seen.add(n);
      all.push(n, ...down(n, seen));
    }
    return all;
  };
  for (const c of Object.keys(promotions).sort()) out[c] = sorted(down(c, new Set([c])));
  return out;
}

export default defineGenerator({
  name: '_lookups',
  system: 'lookups',
  raw: true,
  inputs: [
    'website-data/classPromotions.json',
    'website-data/talents.json',
    'website-data/items.json',
    'website-data/monsters.json',
    'website-data/cards.json',
    'website-data/quests.json',
    'website-data/petStats.json',
    'website-data/stamps.json',
    'website-data/shared-data.json#mapNames',
    'website-data/shared-data.json#rawMapNames',
    'website-data/shared-data.json#npcRoster',
    'website-data/shared-data.json#starSigns',
    'website-data/shared-data.json#cardSets',
    'website-data/shared-data.json#spelunkingRocks',
    'website-data/shared-data.json#towers',
    'website-data/cauldrons.json',
  ],
  run({ data }) {
    const promotions = data.classPromotions as Record<string, ClassPromotion>;
    const talents = data.talents as Record<string, Record<string, { name?: string }>>;
    const talentsByClass: Record<string, string[]> = {};
    for (const [cls, p] of Object.entries(promotions))
      talentsByClass[cls] = sorted((p.talentTabs ?? []).flatMap((tab) => Object.keys(talents[tab] ?? {})));
    const quests = data.quests as Record<string, Record<string, { CustomType?: string }>>;
    const pets = (data.petStats as { monsterRawName?: string; monsterName?: string }[][]).flat();
    const stamps = data.stamps as Record<string, Record<string, { rawName?: string; displayName?: string }>>;
    const monsters = data.monsters as Record<string, { Name?: string }>;
    const items = data.items as Record<string, { displayName?: string }>;
    const cards = data.cards as Record<string, { displayName?: string }>;
    const cauldrons = data.cauldrons as Record<string, { bubbleName?: string }[]>;
    return {
      classes: sorted(Object.keys(promotions)),
      classTree: classTreeOf(promotions),
      talentsByClass,
      talents: sorted(Object.values(talents).flatMap((tab) => Object.keys(tab))),
      talentTabs: sorted(Object.keys(talents)),
      items: sorted(Object.keys(items)),
      itemNames: sorted(Object.values(items).map((i) => i.displayName ?? '')),
      monsters: sorted(Object.keys(monsters)),
      monsterNames: sorted(Object.values(monsters).map((m) => m.Name ?? '')),
      maps: sorted([
        ...Object.values(data.mapNames as Record<string, string>),
        ...(data.rawMapNames as string[]),
      ]),
      cards: sorted(Object.keys(cards)),
      cardNames: sorted(Object.values(cards).map((c) => c.displayName ?? '')),
      cardSets: sorted(Object.keys(data.cardSets as Record<string, unknown>)),
      quests: sorted([
        ...Object.keys(quests),
        ...Object.values(quests).flatMap((q) => Object.values(q).map((step) => step.CustomType ?? '')),
      ]),
      npcs: sorted([...Object.keys(data.npcRoster as Record<string, unknown>), ...Object.keys(quests)]),
      pets: sorted(pets.flatMap((p) => [p.monsterRawName ?? '', p.monsterName ?? ''])),
      stamps: sorted(
        Object.values(stamps).flatMap((t) =>
          Object.values(t).flatMap((s) => [s.rawName ?? '', s.displayName ?? '']),
        ),
      ),
      starSigns: sorted((data.starSigns as { starName?: string }[]).map((s) => s.starName ?? '')),
      spelunking: sorted((data.spelunkingRocks as { name?: string }[][]).flat().map((r) => r?.name ?? '')),
      // Bubble names, for M6's big-bubble and brew slots (the golden's string-slot check, FR-27).
      bubbles: sorted(Object.values(cauldrons).flatMap((c) => c.map((b) => b.bubbleName ?? ''))),
      // Construction building rawNames, for M15 F2's building slots (FR-27).
      buildings: sorted(Object.keys(data.towers as Record<string, unknown>)),
      sentinels: ['Blank', 'LockedInvSpace', 'Null'],
    };
  },
});
