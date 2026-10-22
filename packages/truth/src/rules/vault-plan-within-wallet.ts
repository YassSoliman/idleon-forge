// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Invariant (M26 FR-58): the Vault plan spends only what each character carries, and starts every row
// at the level the save holds. Coins are read raw (`Money_<i>`, `MoneyBANK`) and levels raw (`UpgVault`),
// so a misread wallet or Vault can't hide the problem. Any contradiction holds the whole plan back.
import type { Violation } from '../types';
import type { Rule } from './rule';

const SLACK = 1;

export const vaultPlanWithinWallet: Rule = {
  id: 'vault-plan-within-wallet',
  title: 'The Vault plan spends only what each character carries, from the levels the save holds',
  check({ raw, result }) {
    const out: Violation[] = [];
    const plan = result?.account.spendPlan?.vaultPlan;
    if (!plan) return out;
    const bank = raw.bankCoins ?? 0;
    let fromBank = 0;
    for (const p of plan.pockets) {
      const purse = raw.characters.find((c) => c.index === p.holder)?.coins ?? null;
      fromBank += p.fromBank;
      if (purse === null) continue;
      if (p.spent > purse + p.fromBank + SLACK)
        out.push({
          rule: 'vault-plan-within-wallet',
          key: `vault-plan:payer:${p.holder}`,
          message: `The Vault plan spends ${Math.round(p.spent)} coins on slot ${p.holder}, which carries ${Math.round(purse)}${p.fromBank > 0 ? ` plus ${Math.round(p.fromBank)} from storage` : ''}`,
          severity: 'P1',
          scope: { kind: 'vault-plan', character: p.holder },
          evidence: { spent: p.spent, purse, fromBank: p.fromBank },
        });
    }
    if (fromBank > bank + SLACK)
      out.push({
        rule: 'vault-plan-within-wallet',
        key: 'vault-plan:bank',
        message: `The Vault plan takes ${Math.round(fromBank)} coins out of a bank that holds ${Math.round(bank)}`,
        severity: 'P1',
        scope: { kind: 'vault-plan', character: null },
        evidence: { fromBank, bank },
      });
    const levels = raw.vaultLevels;
    if (levels) {
      const seen = new Set<number>();
      for (const s of plan.steps) {
        if (seen.has(s.index)) continue;
        seen.add(s.index);
        const now = levels[s.index] ?? 0;
        if (s.fromLevel !== now)
          out.push({
            rule: 'vault-plan-within-wallet',
            key: `vault-plan:row:${s.index}`,
            message: `The Vault plan starts ${s.name} at level ${s.fromLevel}, but the save holds level ${now}`,
            severity: 'P2',
            scope: { kind: 'vault-plan', character: null },
            evidence: { row: s.index, plan: s.fromLevel, raw: now },
          });
      }
    }
    return out;
  },
};
