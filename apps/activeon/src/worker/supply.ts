// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The worker's M14 supply step (TR-3), after the adapter and before the engine, in the same parse.
import {
  type AccountState,
  computeSupplyRates,
  type MapGraphRow,
  type SupplyRates,
} from '@idleon-forge/account-state';
import { leavesForRates, rateTargets } from '@idleon-forge/engine/walkthrough';
import type { CompiledKnowledge } from '@idleon-forge/knowledge';
import {
  type ParsedSave,
  type RawSaveEnvelope,
  toolboxCalls,
  withFrozenClock,
} from '@idleon-forge/toolbox-parsers';

/**
 * M14 TR-3: kill and drop rates on the supply maps of every Walkthrough target's missing leaves, plus
 * each character's reachable maps, through Toolbox's clone in the parse's frozen clock. null without a
 * Knowledge Base or when anything throws (the Walkthrough then shows no drop hours, never a guess).
 */
export function supplyRatesOf(
  parsed: ParsedSave,
  envelope: RawSaveEnvelope,
  state: AccountState,
  kb: CompiledKnowledge | null,
): SupplyRates | null {
  if (!kb) return null;
  try {
    const graph = (kb.facts['maps.fact.maps']?.rows ?? []) as unknown as MapGraphRow[];
    const leaves = leavesForRates(state, kb, rateTargets(state, kb));
    return computeSupplyRates(parsed, envelope, state, {
      leaves,
      graph,
      calls: toolboxCalls,
      withFrozenClock,
    });
  } catch {
    return null;
  }
}
