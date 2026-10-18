// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 engine types (TR-6). Plain, structured-cloneable data: indices only, never a name (TR-13).
import type { Subject, WalkthroughView } from '../result';

export type Gate =
  | 'anvil-tab'
  | 'smithing'
  | 'recipe'
  | 'quest'
  | 'world'
  | 'free-slots'
  | 'skill-efficiency';
export type SupplyKind =
  | 'drop'
  | 'skill-node'
  | 'anvil'
  | 'forge'
  | 'shop'
  | 'liquid-shop'
  | 'printer'
  | 'recipe'
  | 'active-play';

export interface Holding {
  place: 'storage' | 'refinery' | 'forge' | `inv:c${number}`;
  amount: number;
}

export type IneligibleReason =
  | 'unreachable'
  | 'unsafe'
  | 'no-rate'
  | 'pusher'
  | 'lab'
  | 'role'
  | 'blocker'
  | 'busy'
  | 'map-taken'
  | 'skill-gate';

export interface CharacterEval {
  characterIndex: number;
  eligible: boolean;
  reason?: IneligibleReason;
  killsNeeded: number | null;
  etaSeconds: number | null;
  alreadyFarming: boolean;
  /** Toolbox rates on the Supply's map (drop Supplies). */
  killsPerHour?: number;
  dropRate?: number;
  survivability?: number;
  /** Skilling: level and efficiency as equipped. */
  skillLevel?: number;
  skillEfficiency?: number;
}

export interface SupplyEval {
  acquisitionId: string;
  kind: SupplyKind;
  /** True for drop and skill-node Supplies on an AFK-able map someone can reach. */
  afkable: boolean;
  where: {
    world: number | null;
    mapIndex: number | null;
    map?: string;
    monster?: string;
    monsterName?: string;
    town?: string;
    skill?: string;
  };
  /** Drop chance per kill (effectiveChance) and quantity; skill gates. */
  chance?: number;
  quantity?: number;
  minEfficiency?: number;
  perCharacter: CharacterEval[];
  bound: 'mean' | 'none';
  /** Liquid Shop: what the Water held buys now (FR-11, Q6). */
  liquid?: { water: number; affordableNow: number; costForMissing: number | null; days: number | null };
  /** Anvil: the product's levelReq and requiredAmount; forge: the ore and how much of it is held. */
  anvil?: { levelReq: number; requiredAmount: number };
  forge?: { ore: string; oreName: string; oreHeld: number };
  wiki?: string | null;
}

export type ReqNode =
  | {
      kind: 'item';
      rawName: string;
      name: string;
      need: number;
      held: number;
      missing: number;
      holdings: Holding[];
      via: 'recipe' | 'leaf' | 'anvil' | 'forge';
      children: ReqNode[];
      supplies: SupplyEval[];
      stoppedBecause?: 'cycle' | 'depth';
      /** A holding could not be read (FR-33): never ticked done. */
      unknown?: true;
      /** No generated Acquisition: a W5+ or unknown system (§6). */
      notCovered?: true;
      /** M18 FR-15: copies the receivers wear, counted in `held`. */
      worn?: number;
      wiki?: string | null;
      depth: number;
    }
  | {
      kind: 'gate';
      gate: Gate;
      label: string;
      met: boolean | null;
      children: ReqNode[];
      depth: number;
      /** The anvil tab number for an anvil-tab gate. */
      tab?: number;
      level?: number;
    };

export interface Job {
  key: string;
  rawName: string;
  name: string;
  missing: number;
  supplies: SupplyEval[];
  assignees: number[];
  etaSeconds: number | null;
  bottleneckOf: string[];
  /** The parent Goal key and target of the Walkthrough this job is for (the highest-ranked one). */
  parentKey: string;
  targetId: string;
  /** FIGHTING, FISHING, ... */
  activity: string;
  /** The Supply chosen for the assignee. */
  chosen: { supply: SupplyEval; eval: CharacterEval } | null;
  /** Why the assignee was chosen (pref 1 already, 2 free, 3 moved, role). */
  pref: 1 | 2 | 3 | 'role' | null;
  /** FR-18: the assignee has an M3 blocker to fix before it moves. */
  fixFirst?: true;
  /** R-Q9a: on a character that also pushes, the order of its two jobs. */
  sequence?: { firstIs: 'push' | 'job'; reason: 'short' | 'rank'; pushEtaSeconds: number | null };
}

export interface PrinterPlanRow {
  characterIndex: number;
  action: 'keep' | 'swap-to-stored' | 'take-sample' | 'none';
  item: string | null;
  replaces: string | null;
  mapIndex: number | null;
  covered: boolean;
}

export interface PrinterSlotPlan {
  slotsUsed: number;
  slotsTotal: number;
  characters: PrinterPlanRow[];
  /** The multi before and after a sample (FR-27a). */
  multiNow: number;
  multiAfterSample: number;
  /** The proposed changes, at most one per character (FR-27). */
  changes: PrinterChange[];
}

export interface PrinterChange {
  characterIndex: number;
  action: 'swap-to-stored' | 'take-sample';
  item: string;
  replaces: string | null;
  mapIndex: number | null;
  perHour: number | null;
  missing: number;
  /** FR-27a: the share of the printer multi a sample loses (0 when nothing resets). */
  resetLoss: number;
}

export interface WalkthroughBuilt {
  targetId: string;
  parentKey: string;
  parentEntryId: string;
  parentSubject: Subject;
  tree: ReqNode;
  bottleneck: string | null;
  view: WalkthroughView;
}

export interface WalkthroughResult {
  walkthroughs: WalkthroughBuilt[];
  demand: { rawName: string; missing: number; byParent: { key: string; amount: number }[] }[];
  jobs: Job[];
  printer: PrinterSlotPlan | null;
}
