// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7's engine Detectors (TR-5, M11 TR-4 `kind: 'engine'`) behind the three Spend Checks, plus the combat
// gate (FR-21). They return typed facts and no words: the Check entries hold the words. Each referenced
// one is registered by a one-line re-export in packages/engine/detectors/spend/<name>.ts.
import type { AccountState } from '@idleon-forge/account-state';
import { defineDetector } from '@idleon-forge/knowledge';
import { z } from 'zod';
import { selectPusher } from '../metapath/pusher';
import type { FactLookup } from '../metapath/types';
import {
  DUPLICATE_ENTRIES_ROW,
  HOLD_DAYS,
  MAX_REDUCTION,
  raiseReady,
  stampRef,
  waitingToFit,
} from './candidates';

const none = z.strictObject({});
/** Toolbox's % unit: full hit chance or survivability. */
const FULL = 100;

/** spend/duplicate-entries-guard (FR-12): row 52 buyable at Lv 0, with the tickets banked at the NPCs. */
export function duplicateEntriesGuard(state: AccountState): { fires: boolean; tickets: number } {
  const spend = state.account.spend;
  const row = spend?.vault?.rows.find((r) => r.index === DUPLICATE_ENTRIES_ROW);
  return {
    fires: !!row && row.buyable && row.level === 0,
    tickets: spend?.colosseumTickets?.bankedAtNpcs ?? 0,
  };
}

/** spend/stamp-hydrogen (FR-11, D4): batching on with Hydrogen above Lv 0; the hold, by arithmetic. */
export function stampHydrogen(state: AccountState): {
  batching: boolean;
  hold: { neededPct: number; days: number; stamp: string } | null;
} {
  const spend = state.account.spend;
  const h = spend?.hydrogen;
  if (!spend || !h || h.level <= 0) return { batching: false, hold: null };
  let hold: { neededPct: number; days: number; stamp: string } | null = null;
  for (const s of spend.stamps ?? []) {
    const w = s.level >= s.cap ? waitingToFit(s, h) : null;
    if (
      w &&
      w.days <= HOLD_DAYS &&
      w.neededPct <= MAX_REDUCTION &&
      (hold === null || w.neededPct > hold.neededPct)
    )
      hold = { ...w, stamp: stampRef(s.id) };
  }
  return { batching: true, hold };
}

/** spend/stamp-raise-ready, negative side: at-cap stamps whose raise needs farming or carry capacity. */
export function stampNotReady(
  state: AccountState,
): { ref: string; reason: 'stamp-material' | 'stamp-carry' }[] {
  const spend = state.account.spend;
  const discount = spend?.hydrogen?.discountPct ?? 0;
  const out: { ref: string; reason: 'stamp-material' | 'stamp-carry' }[] = [];
  for (const s of spend?.stamps ?? []) {
    if (s.level < s.cap || !s.raise) continue;
    const v = raiseReady(s, s.raise.atDiscount, discount);
    if (v === 'stamp-material' || v === 'stamp-carry') out.push({ ref: stampRef(s.id), reason: v });
  }
  return out;
}

/**
 * spend/combat-row-gate (FR-21): Bullseye when the pusher's Toolbox hit chance on the frontier map is
 * below 100%, the defence rows when its survivability is. No frontier or no pusher: neither fires.
 */
export function combatGate(state: AccountState, facts: FactLookup): { bullseye: boolean; defence: boolean } {
  try {
    const sel = selectPusher(state, facts);
    if (sel.kind === 'no-frontier') return { bullseye: false, defence: false };
    const index = sel.kind === 'pusher' ? sel.pusher.index : sel.wall.characterIndex;
    const fight = sel.frontier.fights.find((f) => f.characterIndex === index);
    if (!fight) return { bullseye: false, defence: false };
    return { bullseye: fight.hitChance < FULL, defence: fight.survivability < FULL };
  } catch {
    return { bullseye: false, defence: false };
  }
}

const SPEND_READS = ['account.spend'] as const;

export const duplicateEntriesDetector = defineDetector({
  id: 'spend/duplicate-entries-guard',
  kind: 'engine',
  system: 'spend',
  params: none,
  slots: z.strictObject({ tickets: z.number(), payer: z.string(), coins: z.number() }),
  reads: ['account.spend.vault', 'account.spend.colosseumTickets', 'account.spend.wallets'],
  examples: { fires: [{ fixture: 'scrubbed-w3' }], silent: [{ fixture: 'scrubbed-w2' }] },
  run: ({ state }) => [duplicateEntriesGuard(state)],
});

export const stampHydrogenDetector = defineDetector({
  id: 'spend/stamp-hydrogen',
  kind: 'engine',
  system: 'spend',
  params: none,
  slots: z.strictObject({ discount: z.number(), needed: z.number(), days: z.number(), stamp: z.string() }),
  reads: ['account.spend.hydrogen', 'account.spend.stamps'],
  examples: { fires: [], silent: [{ fixture: 'scrubbed-w3' }] },
  run: ({ state }) => [stampHydrogen(state)],
});

export const stampRaiseReadyDetector = defineDetector({
  id: 'spend/stamp-raise-ready',
  kind: 'engine',
  system: 'spend',
  params: none,
  slots: z.strictObject({ count: z.number() }),
  reads: [...SPEND_READS],
  examples: { fires: [{ fixture: 'scrubbed-w2' }], silent: [] },
  run: ({ state }) => [stampNotReady(state)],
});

/** Every registered M7 engine Detector, by id. */
export const SPEND_DETECTORS = Object.freeze({
  [duplicateEntriesDetector.id]: duplicateEntriesDetector,
  [stampHydrogenDetector.id]: stampHydrogenDetector,
  [stampRaiseReadyDetector.id]: stampRaiseReadyDetector,
});
