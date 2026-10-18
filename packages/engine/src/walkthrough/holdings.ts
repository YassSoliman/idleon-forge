// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 FR-6, TR-11: what the account holds of an item, by place: chest storage, refinery storage, the
// Forge's output slots and every character's bag, each counted once; equipped gear, tools, food and obol
// slots never count (M8 TR-6's rule). And the Demand allocation pool (FR-5, FR-13): holdings are handed
// out in the order nodes ask for them (the higher-ranked Walkthrough first), so two Walkthroughs never
// count the same item twice.
//
// TODO(M8): M8 (#80) implements this rule as `holdings` in collections/routes.ts (storage, refinery,
// bags). Once #80 is on main, move this into packages/engine/src/core/holdings.ts with the Forge output
// added (TR-11) and have both modules import it.
import { type AccountState, isKnown } from '@idleon-forge/account-state';
import type { Holding } from './types';

export function holdingsOf(state: AccountState, rawName: string): Holding[] {
  const out: Holding[] = [];
  const add = (place: Holding['place'], n: number | undefined) => {
    if (n && n > 0) out.push({ place, amount: n });
  };
  add('storage', state.account.storageItems?.[rawName]);
  add('refinery', state.account.refineryStorage?.[rawName]);
  add('forge', state.account.forgeOutput?.find((x) => x.rawName === rawName)?.amount);
  for (const c of state.characters) add(`inv:c${c.index}`, c.inventoryItems?.[rawName]);
  return out;
}

export const totalOf = (h: readonly Holding[]) => h.reduce((n, x) => n + x.amount, 0);

/** FR-33: whether every holding place could be read. Unknown holdings never tick a step done. */
export function holdingsKnown(state: AccountState): boolean {
  return (
    isKnown(state, 'account.storageItems') &&
    state.account.storageItems !== null &&
    state.account.storageItems !== undefined &&
    state.characters.every(
      (c) => isKnown(state, `characters[${c.index}].inventoryItems`) && c.inventoryItems != null,
    )
  );
}

/** The holdings still unclaimed, handed out first-come (FR-13). */
export class HoldingsPool {
  private readonly left = new Map<string, number>();
  constructor(private readonly state: AccountState) {}
  available(rawName: string): number {
    if (!this.left.has(rawName)) this.left.set(rawName, totalOf(holdingsOf(this.state, rawName)));
    return this.left.get(rawName) as number;
  }
  take(rawName: string, need: number): number {
    const got = Math.min(this.available(rawName), need);
    this.left.set(rawName, this.available(rawName) - got);
    return got;
  }
}
