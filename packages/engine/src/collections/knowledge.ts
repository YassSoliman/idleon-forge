// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Typed reads of the Knowledge Base entries and fact tables M8 uses (M8 TR-3, TR-4). Every game fact
// comes from a generated entry or fact table by id; every order from an authored Priority List. Nothing
// here is typed in. A missing table throws `CollectionsKnowledgeError`, which the Detector runner turns
// into a failed Detector (M11 FR-13), never a guess.
import type { Entry, FactTable } from '@idleon-forge/knowledge';

export class CollectionsKnowledgeError extends Error {
  override name = 'CollectionsKnowledgeError';
}

export interface FactLookup {
  get(id: string): Readonly<Entry | FactTable> | undefined;
}

/** Ids M8 reads. Detector sources name them as literals so `kb compile` ships them. */
export const M8 = {
  acquire: 'stamps.priority.acquire',
  unobtainable: 'stamps.fact.unobtainable',
  sharedResources: 'stamps.fact.shared-resources',
  townUnlocks: 'metapath.fact.town-unlocks',
  obolAltarLevel: 'obols.fact.obol-altar',
  obolAltarQuest: 'quests.acquisition.obol-altar1',
  keywords: 'cards.fact.activity-keywords',
  setsFighting: 'cards.priority.set-for-fighting',
  setsFighting50: 'cards.priority.set-for-fighting-50',
  setsSkilling: 'cards.priority.set-for-skilling',
  cardPreferences: 'cards.fact.card-preferences',
  cardSlots: 'cards.fact.slots',
  classTree: 'classes.fact.class-tree',
} as const;

// ---- generated route shapes (packages/knowledge/generators/stamps.gen.ts) ----
export interface ItemReq {
  kind: 'item';
  rawName: string;
  name: string;
  amount: number;
  craft?: { lvReqToCraft: number; materials: { rawName: string; name: string; amount: number }[] };
}
export interface QuestRoute {
  kind: 'quest';
  npc: string;
  questKey: string;
  questOrder: number;
  questName: string;
  title: string;
  questType: string | null;
  world: number | null;
  consumes: boolean;
  inventorySpacesNeeded: number;
  requires: ItemReq[];
  custom: { desc: string; value: number }[];
  alsoRewards: { rawName: string; amount: number }[];
}
export interface ShopRoute {
  kind: 'shop';
  shop: number;
  town: string;
  world: number | null;
  price: number | null;
}
export interface DropRoute {
  kind: 'drop';
  monster: string;
  chance: number;
  world: number | null;
}
export type Route = QuestRoute | ShopRoute | DropRoute;

export interface StampEntry {
  id: string;
  rawName: string;
  name: string;
  routes: Route[];
  entry: Entry;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function factRows<T>(kb: FactLookup, id: string): T {
  const f = kb.get(id);
  if (!f || !('rows' in f))
    throw new CollectionsKnowledgeError(`fact table ${id} is not in the Knowledge Base`);
  return f.rows as T;
}

export function entryOf<T extends Entry['type']>(
  kb: FactLookup,
  id: string,
  type: T,
): Extract<Entry, { type: T }> | null {
  const e = kb.get(id) as Entry | undefined;
  return e && 'type' in e && e.type === type ? (e as Extract<Entry, { type: T }>) : null;
}

/** A `list: order` Priority List's positions, each a tie of entry ids. Throws when missing. */
export function orderOf(kb: FactLookup, id: string, seen: readonly string[] = []): string[][] {
  const l = entryOf(kb, id, 'priority');
  if (!l) throw new CollectionsKnowledgeError(`priority list ${id} is not in the Knowledge Base`);
  return l.tiers.flatMap((tier): string[][] => {
    // An included block keeps its own order, as positions after this one.
    const block = tier.find((item) => isObj(item) && 'include' in item) as { include: string } | undefined;
    if (block) return seen.includes(block.include) ? [] : orderOf(kb, block.include, [...seen, id]);
    return [
      tier.flatMap((item) =>
        typeof item === 'string' ? [item] : isObj(item) && 'ref' in item ? [item.ref] : [],
      ),
    ];
  });
}

/** The stamps M8 has routes for: every Acquisition `stamps.priority.acquire` lists, in list order. */
export function stampEntries(kb: FactLookup): StampEntry[] {
  return orderOf(kb, M8.acquire)
    .flat()
    .flatMap((id) => {
      const e = entryOf(kb, id, 'acquisition');
      if (!e) return [];
      const data = ('data' in e ? e.data : undefined) as { routes?: Route[] } | undefined;
      const name = typeof e.values.name === 'string' ? e.values.name : e.thing.rawName;
      return [{ id, rawName: e.thing.rawName, name, routes: data?.routes ?? [], entry: e }];
    });
}

/** Shop index -> town and world, from the shop routes M8 ships (shared-data `shops` names). */
export function shopTowns(
  stamps: readonly StampEntry[],
): Map<number, { town: string; world: number | null }> {
  const out = new Map<number, { town: string; world: number | null }>();
  for (const s of stamps)
    for (const r of s.routes) if (r.kind === 'shop') out.set(r.shop, { town: r.town, world: r.world });
  return out;
}

/** The generated Obol Altar quest (`quests.acquisition.obol-altar1`) as a route. */
export function obolAltarQuest(kb: FactLookup): QuestRoute {
  const e = entryOf(kb, M8.obolAltarQuest, 'acquisition');
  const data = (e && 'data' in e ? e.data : undefined) as Omit<QuestRoute, 'kind'> | undefined;
  if (!data) throw new CollectionsKnowledgeError(`${M8.obolAltarQuest} is not in the Knowledge Base`);
  return { ...data, kind: 'quest', alsoRewards: [] };
}

/** The generated Acquisition id of a card or stamp rawName (packages/knowledge/generators/types.ts `slugify`). */
export const acquisitionId = (system: 'cards' | 'stamps', raw: string) =>
  `${system}.acquisition.${raw
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .replace(/-+/g, '-')}`;

/** "Vitality_Stamp" -> "Vitality Stamp", "BobJoePickle" -> "Bob Joe Pickle". Display only. */
export const human = (s: string) => {
  const spaced = s.replace(/_/g, ' ').trim();
  return spaced.includes(' ') ? spaced : spaced.replace(/([a-z])([A-Z])/g, '$1 $2');
};
