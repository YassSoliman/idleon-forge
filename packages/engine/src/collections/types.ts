// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 Collections' internal types (M8 TR-7). `CollectionsResult` stays inside the engine: the Now screen
// gets only M10's Goal, NextAction and ActivePlay objects. Characters are CharacterState.index, never a name.

export type AcqStatus = 'owned' | 'now' | 'active' | 'toward' | 'later' | 'unknown';

export type HoldingPlace = 'storage' | 'refinery' | `inv:c${number}`;

export type Requirement =
  | {
      kind: 'item';
      rawName: string;
      name: string;
      amount: number;
      held: number;
      where: HoldingPlace[];
      craft?: { materials: { rawName: string; name: string; amount: number; held: number }[]; level: number };
      /** FR-5: missing but sold in a reached town's shop (buy then hand in). */
      buyAt?: { shop: number; town: string };
    }
  | { kind: 'coins'; amount: number | null; bestHolder: number | null }
  | { kind: 'custom'; desc: string; target: number; progress: number | null }
  | { kind: 'freeSlots'; amount: number }
  | { kind: 'smithing'; level: number }
  | { kind: 'stock'; inStock: boolean }
  | { kind: 'world'; world: number }
  | { kind: 'system'; id: string; label: string };

export interface RouteEval {
  /** Index into the Acquisition entry's `data.routes`. */
  routeIndex: number;
  kind: 'held' | 'shop' | 'quest' | 'buyThenQuest' | 'drop' | 'craft' | 'other';
  status: Exclude<AcqStatus, 'owned'>;
  /** The chosen character (FR-10), never a name. */
  character: number | null;
  requirements: Requirement[];
  /** Only where FR-8 allows (a fighting drop on the character's current AFK Target). */
  etaSeconds: number | null;
  /** FR-7: the same NPC's next quest, when it is a hand-in whose items are held. */
  lookAhead: { questName: string; rewards: string[] } | null;
}

export interface StampAcquisition {
  /** `stamps.acquisition.<slug of rawName>`. */
  entryId: string;
  rawName: string;
  name: string;
  status: AcqStatus;
  best: RouteEval | null;
  others: RouteEval[];
  provenance: { entryIds: string[]; fields: string[] };
}

export interface CollectionsResult {
  stamps: {
    owned: number;
    obtainable: number;
    byStatus: Record<AcqStatus, number>;
    items: StampAcquisition[];
    /** FR-2: collected stamps at Lv 0, for M7. */
    lv0ForSpendPlan: string[];
  };
  cards: { perCharacter: { index: number; slots: unknown; set: unknown; preset: unknown }[] };
  cardLists: { classIndex: number; stage: string; entryId: string }[];
  obols: {
    altar: RouteEval | null;
    altarDone: boolean;
    placements: { from: 'storage'; to: 'family' | `c${number}`; shape: string; count: number }[];
    nextFamilySlot: { levelReq: number; shape: string } | null;
  };
}
