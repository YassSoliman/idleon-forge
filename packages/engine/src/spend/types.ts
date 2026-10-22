// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 Spend Plan engine output (docs/specs/M7-spend-plan.md TR-3). M10 imports `SpendPlan` from here
// (`../result.ts` re-exports it). Plain data only: it crosses the worker boundary by structuredClone.
// Characters are indices; no name ever enters a SpendPlan (TR-9).
import type { VaultPlan } from './vault-plan';

export type SpendSink = 'vault' | 'stamp' | 'bribe' | 'statue-gold' | 'p2w' | 'anvil';
export type SpendStatus = 'buy' | 'move-coins' | 'save-for' | 'hold' | 'unpriced';

/** One purchase inside a line (a group has several). */
export interface SpendStep {
  sink: SpendSink;
  /** Generated Acquisition id, e.g. "upgrade-vault.acquisition.row-23", "stamps.acquisition.stamp-a4". */
  ref: string;
  fromLevel: number | null;
  toLevel: number | null;
  /** null when unpriced. */
  coins: number | null;
  /** Stamp cap raise: the material to carry, and the character who carries it (FR-10). */
  material?: { item: string; amount: number; doer: number };
  /** Anvil coin points only: the character whose Anvil it is pays this step (TR-4). */
  payer?: number;
}

export interface SpendLine {
  /** `${entryId}:${ref}:${fromLevel}->${toLevel}`; Skip and Not for me key on entryId + ref (FR-18). */
  id: string;
  /** Spend item key `${listId}#${itemSlug}`, e.g. "spend.priority.w2-late#max-sleepy-time" (TR-6). */
  entryId: string;
  /** List position (ties share a number). */
  position: number;
  status: SpendStatus;
  steps: SpendStep[];
  /** Sum of steps; null if any step is unpriced. */
  coins: number | null;
  /** Character index; null for unpriced, save-for with no candidate, and per-character Anvil lines. */
  payer: number | null;
  /** move-coins only (D1). */
  transfer?: { fromBank: number };
  /** save-for only. */
  shortfall?: { coins: number; closest: number };
  /** Hydrogen hold (D4). */
  hold?: { discountPct: number; neededPct: number; days: number };
  /** Rendered from the entry's template; class and level only, no names. A short step (12 words or fewer). */
  text: string;
  /** The rest of the line: a grouped line's purchase names and its "carry N X on Y" steps; null if none. */
  detail: string | null;
  /** FR-19 rendering: costs at 2 s.f., no shortfall, transfer or balance. */
  reportText: string;
  why: string;
  sources: { label: string; url: string; tier: 1 | 2 | 3 | 4; verifiedOn: string; gameVersion: string }[];
  confidence: 'H' | 'M' | 'L';
  contested: boolean;
  stale: boolean;
  provenance: { fields: string[]; entries: string[] };
}

/** Section 7: a gap the Spend Plan can't turn into a line, kept for a later Goal (M4). */
export interface SpendHandoff {
  kind: 'stamp-material' | 'stamp-carry' | 'guilding-tools';
  /** Generated Acquisition id. */
  ref: string;
  /** Items missing (stamp-material), or carry capacity missing (stamp-carry); 1 for Guilding Tools. */
  shortfall: number;
}

export interface SpendPlan {
  /** From M2. */
  stage: string;
  /** Device-only; never in a report or a committed snapshot. */
  wallets: { holder: number | 'bank'; coins: number; planned: number }[];
  /** Full ordered list. */
  lines: SpendLine[];
  /** <= 5 (FR-15). */
  visibleCount: number;
  /** FR-16. */
  perCharacter: { characterIndex: number; lines: number; coins: number }[];
  /** FR-13. */
  unlockFuel: { levels: number; coinsAbout: number; unlocks: string } | null;
  /** FR-20, e.g. ["forge.upgrades"]. */
  notCovered: string[];
  empty: null | { reason: 'nothing-affordable' | 'nothing-unlocked' | 'nothing-left'; cheapest?: SpendLine };
  /** FR-25: sinks whose section failed or is missing. */
  unavailable: SpendSink[];
  /** Section 7: not-ready stamp raises and the Guilding Tools gap. */
  handoffs: SpendHandoff[];
  /** M26 FR-58: every coin on the Upgrade Vault, row by row (the Vault page's answer); null without a Vault. */
  vaultPlan: VaultPlan | null;
}
