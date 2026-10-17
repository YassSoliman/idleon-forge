// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Reading quests.json for the quests and stamps generators. A quest's order is its position in the
// NPC's object (the same order Toolbox's getQuests walks), never arithmetic on its key: keys are
// strings and not always 1..n (Fishpaste97 uses '971', '972').
import { humanName } from './world-maps';

/** A JSON value, as generated entries' `data` holds. */
export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export interface QuestItem {
  rawName: string;
  name?: string;
  amount?: number;
}
export interface QuestStep {
  Type?: string;
  QuestName?: string;
  Name?: string;
  CustomType?: string;
  ConsumeItems?: boolean;
  InventorySpacesNeeded?: number;
  itemReq?: QuestItem[];
  rewards?: QuestItem[];
  customArray?: { desc?: string; value?: number }[];
  Difficulty?: string;
}

export interface OrderedStep {
  npc: string;
  key: string;
  order: number;
  step: QuestStep;
}

/** Every quest step of every NPC, in Toolbox's order. Non-object keys (sprite, spriteAcross...) are skipped. */
export function questSteps(quests: Record<string, Record<string, unknown>>): OrderedStep[] {
  const out: OrderedStep[] = [];
  for (const npc of Object.keys(quests)) {
    let order = 0;
    for (const [key, step] of Object.entries(quests[npc] ?? {})) {
      if (Number.isNaN(Number(key)) || !step || typeof step !== 'object') continue;
      out.push({ npc, key, order: order++, step: step as QuestStep });
    }
  }
  return out;
}

export interface Craft {
  rawName: string;
  materials?: { rawName: string; itemName?: string; itemQuantity?: number }[];
}

/** rawName -> its one-level recipe (crafts.json is keyed by item name). */
export function craftsByRawName(crafts: Record<string, Craft>): Map<string, Craft> {
  const m = new Map<string, Craft>();
  for (const c of Object.values(crafts)) if (c?.rawName) m.set(c.rawName, c);
  return m;
}

/** An item requirement with its one-level craft recipe and Smithing level, when it has one (M8 TR-8 rule 3). */
export function requirement(
  item: QuestItem,
  crafts: Map<string, Craft>,
  items: Record<string, { lvReqToCraft?: number }>,
): { [k: string]: Json } {
  const out: { [k: string]: Json } = {
    kind: 'item',
    rawName: item.rawName,
    name: humanName(item.name ?? item.rawName),
    amount: item.amount ?? 1,
  };
  const craft = crafts.get(item.rawName);
  if (craft?.materials?.length)
    out.craft = {
      lvReqToCraft: items[item.rawName]?.lvReqToCraft ?? 0,
      materials: craft.materials.map((m) => ({
        rawName: m.rawName,
        name: humanName(m.itemName ?? m.rawName),
        amount: m.itemQuantity ?? 1,
      })),
    };
  return out;
}

/** The measurable parts of a Custom quest: [{ desc, value }]. */
export const customOf = (s: QuestStep) =>
  (s.customArray ?? []).map((c) => ({ desc: humanName(c.desc ?? ''), value: c.value ?? null }));
