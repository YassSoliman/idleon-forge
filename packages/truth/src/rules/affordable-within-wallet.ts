// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Invariant: a cost marked affordable now never exceeds what can be paid now (M22 FR-2d). A Spend
// Plan line with status `buy` is paid from its payer's coins; `move-coins` also takes from the bank.
// Coins are read raw (`Money_<i>`, `MoneyBANK`), so a misread wallet can't hide the problem. Lines
// are checked one by one and summed per payer, since the plan pays them all from the same purse.
import type { SpendLine } from '@idleon-forge/engine/result';
import type { Violation } from '../types';
import type { Rule } from './rule';

const SLACK = 1;

export const affordableWithinWallet: Rule = {
  id: 'affordable-within-wallet',
  title: 'A cost marked affordable never exceeds what can be paid now',
  check({ raw, result }) {
    const out: Violation[] = [];
    const plan = result?.account.spendPlan;
    if (!plan) return out;
    const bank = raw.bankCoins ?? 0;
    const coinsOf = (i: number) => raw.characters.find((c) => c.index === i)?.coins ?? null;
    const byPayer = new Map<number, { total: number; fromBank: number; lines: SpendLine[] }>();
    let fromBankAll = 0;
    for (const line of plan.lines) {
      if ((line.status !== 'buy' && line.status !== 'move-coins') || line.coins === null) continue;
      // Per-character Anvil lines have no line payer: each step names its own.
      const parts: { payer: number; coins: number }[] =
        line.payer !== null
          ? [{ payer: line.payer, coins: line.coins }]
          : line.steps.flatMap((s) =>
              s.payer !== undefined && s.coins !== null ? [{ payer: s.payer, coins: s.coins }] : [],
            );
      const fromBank = line.status === 'move-coins' ? (line.transfer?.fromBank ?? 0) : 0;
      fromBankAll += fromBank;
      for (const { payer, coins } of parts) {
        const purse = coinsOf(payer);
        if (purse === null) continue;
        const acc = byPayer.get(payer) ?? { total: 0, fromBank: 0, lines: [] };
        acc.total += coins;
        acc.fromBank += line.payer !== null ? fromBank : 0;
        acc.lines.push(line);
        byPayer.set(payer, acc);
        const can = purse + (line.status === 'move-coins' ? bank : 0);
        if (coins > can + SLACK)
          out.push({
            rule: 'affordable-within-wallet',
            key: line.id,
            message: `Spend line "${line.text}": it costs ${Math.round(coins)} coins now, slot ${payer} can pay ${Math.round(can)}`,
            severity: 'P1',
            scope: { kind: 'spend-line', character: payer, itemKey: line.id },
            evidence: { cost: coins, purse, bank: line.status === 'move-coins' ? bank : null },
          });
      }
    }
    for (const [payer, acc] of byPayer) {
      const purse = coinsOf(payer) ?? 0;
      if (acc.total <= purse + acc.fromBank + SLACK) continue;
      if (acc.lines.length < 2) continue; // already reported line by line
      out.push({
        rule: 'affordable-within-wallet',
        key: `payer:${payer}`,
        message: `Slot ${payer}'s buy-now lines add up to ${Math.round(acc.total)} coins, more than the ${Math.round(purse + acc.fromBank)} it can pay`,
        severity: 'P2',
        scope: { kind: 'coins', character: payer },
        evidence: { total: acc.total, purse, fromBank: acc.fromBank },
      });
    }
    if (fromBankAll > bank + SLACK)
      out.push({
        rule: 'affordable-within-wallet',
        key: 'bank',
        message: `The Spend Plan moves ${Math.round(fromBankAll)} coins out of a bank that holds ${Math.round(bank)}`,
        severity: 'P2',
        scope: { kind: 'coins', character: null },
        evidence: { fromBank: fromBankAll, bank },
      });
    return out;
  },
};
