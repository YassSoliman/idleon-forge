// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
//
// STUB FOR M7 TO REPLACE. M10 TR-2 imports `SpendPlan` from M7 (`@idleon-forge/engine/spend`,
// M7 TR-3) and defines none of its own. M7 isn't built yet, so this file copies M7 TR-3's shape
// exactly, so the Now screen can render a Spend Plan from view fixtures. When M7 lands
// `packages/engine/src/spend/types.ts`, delete this file and point `../../result.ts` at M7's types.

export type SpendSink = 'vault' | 'stamp' | 'bribe' | 'statue-gold' | 'p2w' | 'anvil';
export type SpendStatus = 'buy' | 'move-coins' | 'save-for' | 'hold' | 'unpriced';

export interface SpendStep {
  sink: SpendSink;
  ref: string;
  fromLevel: number | null;
  toLevel: number | null;
  coins: number | null;
  material?: { item: string; amount: number; doer: number };
}

export interface SpendLine {
  id: string;
  entryId: string;
  position: number;
  status: SpendStatus;
  steps: SpendStep[];
  coins: number | null;
  payer: number | null;
  transfer?: { fromBank: number };
  shortfall?: { coins: number; closest: number };
  hold?: { discountPct: number; neededPct: number; days: number };
  text: string;
  reportText: string;
  why: string;
  sources: { label: string; url: string; tier: 1 | 2 | 3 | 4; verifiedOn: string; gameVersion: string }[];
  confidence: 'H' | 'M' | 'L';
  contested: boolean;
  stale: boolean;
  provenance: { fields: string[]; entries: string[] };
}

export interface SpendPlan {
  stage: string;
  wallets: { holder: number | 'bank'; coins: number; planned: number }[];
  lines: SpendLine[];
  visibleCount: number;
  perCharacter: { characterIndex: number; lines: number; coins: number }[];
  unlockFuel: { levels: number; coinsAbout: number; unlocks: string } | null;
  notCovered: string[];
  empty: null | { reason: 'nothing-affordable' | 'nothing-unlocked' | 'nothing-left'; cheapest?: SpendLine };
  unavailable: SpendSink[];
}
