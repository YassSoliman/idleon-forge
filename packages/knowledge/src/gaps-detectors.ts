// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 2, the W2/W3 gaps: helpers the wave's Detectors share (re-exported by helpers.ts).
import type { AccountState, ForgeOre, ForgeState } from '@idleon-forge/account-state';

/**
 * The ore to load: the forgeable ore held with the slowest bar (highest `Cooldown`) that fills at least one
 * slot to capacity, else the one held most. Only ores worth one bar count. No Source ranks ores, so the
 * text names this one and the detail lists the rest.
 */
export function oreToLoad(f: ForgeState): { pick: ForgeOre; others: ForgeOre[] } | null {
  const usable = f.oresHeld.filter((o) => o.amount >= o.perBar);
  if (usable.length === 0) return null;
  const full = usable
    .filter((o) => o.amount >= f.oreCapacity)
    .sort((a, b) => b.baseSeconds - a.baseSeconds || a.rawName.localeCompare(b.rawName));
  const pick =
    full[0] ?? [...usable].sort((a, b) => b.amount - a.amount || a.rawName.localeCompare(b.rawName))[0];
  if (!pick) return null;
  return { pick, others: usable.filter((o) => o.rawName !== pick.rawName) };
}

/** A Forge edit for examples: `slots` unlocked, every slot emptied, only `ores` held. */
export function idleForge(state: AccountState, slots: number, ores: ForgeOre[]): AccountState {
  const f = state.account.forge;
  if (!f) return state;
  return {
    ...state,
    account: {
      ...state.account,
      forge: {
        ...f,
        slotsUnlocked: slots,
        slots: f.slots.map((s) => ({
          ...s,
          unlocked: s.index < slots,
          ore: null,
          smelting: false,
          emptyInSeconds: 0,
          bar: null,
          barrel: null,
        })),
        oresHeld: ores,
      },
    },
  };
}

export const COPPER: ForgeOre = {
  rawName: 'Copper',
  name: 'Copper_Ore',
  amount: 500,
  perBar: 2,
  baseSeconds: 15,
};
