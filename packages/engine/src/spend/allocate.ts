// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 FR-5 to FR-7, FR-22, FR-24: walk the ranked candidates with a running balance per wallet and give
// each one a status and a payer. Deterministic: ties go to the lower character index (FR-6).
import type { Wallet } from '@idleon-forge/account-state';
import type { Candidate, Fill } from './candidates';
import type { SpendStatus, SpendStep } from './types';

/** FR-22 (Final rulings RT-2): a reserve line holds coins back only while it is at most this far short. */
export const RESERVE_SHORTFALL_SHARE = 0.5;

export interface Allocation {
  candidate: Candidate;
  status: SpendStatus;
  fill: Fill;
  payer: number | null;
  transfer?: { fromBank: number };
  shortfall?: { coins: number; closest: number };
}

interface Purse {
  start: number;
  balance: number;
  /** FR-22: held back for a reserve line ranked above. */
  reserved: number;
}

export class Wallets {
  private readonly purses = new Map<number, Purse>();
  private readonly bank: Purse;
  /** Wallets in order of first use (FR-6 rule 1). */
  readonly used: number[] = [];

  constructor(wallets: readonly Wallet[]) {
    let bank = 0;
    for (const w of wallets)
      if (w.holder === 'bank') bank = w.coins;
      else this.purses.set(w.holder, { start: w.coins, balance: w.coins, reserved: 0 });
    this.bank = { start: bank, balance: bank, reserved: 0 };
  }

  holders(): number[] {
    return [...this.purses.keys()].sort((a, b) => a - b);
  }
  avail(i: number): number {
    const p = this.purses.get(i);
    return p ? Math.max(0, p.balance - p.reserved) : 0;
  }
  start(i: number): number {
    return this.purses.get(i)?.start ?? 0;
  }
  bankAvail(): number {
    return this.bank.balance;
  }
  spend(i: number, coins: number, fromBank = 0) {
    const p = this.purses.get(i);
    if (!p) return;
    this.bank.balance -= fromBank;
    p.balance = p.balance + fromBank - coins;
    if (!this.used.includes(i)) this.used.push(i);
  }
  reserve(i: number, coins: number) {
    const p = this.purses.get(i);
    if (p) p.reserved += Math.min(coins, Math.max(0, p.balance - p.reserved));
  }
  /** Device-only per-wallet plan totals. */
  planned(): { holder: number | 'bank'; coins: number; planned: number }[] {
    return [
      ...this.holders().map((i) => {
        const p = this.purses.get(i) as Purse;
        return { holder: i, coins: p.start, planned: p.start - p.balance };
      }),
      { holder: 'bank' as const, coins: this.bank.start, planned: this.bank.start - this.bank.balance },
    ];
  }
}

/** FR-6: a wallet already used, then the preferred one (the stamp doer), then the smallest that covers. */
export function chooseWallet(
  w: Wallets,
  covers: (i: number) => boolean,
  prefer: number | null,
): number | null {
  for (const i of w.used) if (covers(i)) return i;
  if (prefer !== null && w.holders().includes(prefer) && covers(prefer)) return prefer;
  let best: number | null = null;
  for (const i of w.holders()) if (covers(i) && (best === null || w.avail(i) < w.avail(best))) best = i;
  return best;
}

/** One candidate through FR-5 to FR-7, FR-22 and FR-24, in rank order (mutates the running balances). */
export function allocate(c: Candidate, w: Wallets): Allocation | null {
  if (c.unpriced) return { candidate: c, status: 'unpriced', fill: c.full, payer: null };
  if (c.hold) return { candidate: c, status: 'hold', fill: c.full, payer: null };
  if (c.perStepPayer) {
    // Anvil coin points: each character pays for its own Anvil, never another wallet or the bank (AC-8.4).
    const kept: SpendStep[] = c.full.steps.filter((s) => {
      if (s.payer === undefined || s.coins === null || w.avail(s.payer) < s.coins) return false;
      w.spend(s.payer, s.coins);
      return true;
    });
    if (!kept.length) return null;
    return {
      candidate: c,
      status: 'buy',
      fill: { coins: kept.reduce((t, s) => t + (s.coins ?? 0), 0), steps: kept },
      payer: null,
    };
  }
  const limit = (i: number) =>
    c.shareCap === null ? w.avail(i) : Math.min(w.avail(i), c.shareCap * w.start(i));
  const full = c.full.coins;
  // 1. One wallet covers the whole target.
  const one = chooseWallet(w, (i) => limit(i) >= full, c.preferPayer);
  if (one !== null) {
    w.spend(one, full);
    return { candidate: c, status: 'buy', fill: c.full, payer: one };
  }
  // 2. FR-7: one wallet plus the bank (never for an open-ended row: D6 excludes bank top-ups).
  if (c.shareCap === null && w.bankAvail() > 0) {
    const bank = w.bankAvail();
    const topped = chooseWallet(w, (i) => w.avail(i) + bank >= full, c.preferPayer);
    if (topped !== null) {
      const fromBank = full - w.avail(topped);
      w.spend(topped, full, fromBank);
      return { candidate: c, status: 'move-coins', fill: c.full, payer: topped, transfer: { fromBank } };
    }
  }
  // 3. TR-4 partial fill: the largest checkpoint one wallet covers. The rest stays a later line.
  for (const p of c.partial) {
    const payer = chooseWallet(w, (i) => limit(i) >= p.coins, c.preferPayer);
    if (payer !== null) {
      w.spend(payer, p.coins);
      return { candidate: c, status: 'buy', fill: p, payer };
    }
  }
  // 4. save-for, against the closest wallet (smallest shortfall, ties to the lower index).
  let closest: number | null = null;
  for (const i of w.holders())
    if (closest === null || full - w.avail(i) < full - w.avail(closest)) closest = i;
  if (closest === null) return { candidate: c, status: 'save-for', fill: c.full, payer: null };
  const short = full - w.avail(closest);
  // FR-22: only a reserve line holds coins back, and only while it is at most 50% short (RT-2).
  if (c.reserve && short <= RESERVE_SHORTFALL_SHARE * full) w.reserve(closest, full);
  return {
    candidate: c,
    status: 'save-for',
    fill: c.full,
    payer: null,
    shortfall: { coins: short, closest },
  };
}
