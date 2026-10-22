// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 TR-8 budgets, measured on the scrubbed W3-early save (the larger one) and the largest public save.
import { describe, expect, it } from 'vitest';
import { buildSpendPlan, MAX_LINES } from '../../src/spend';
import { PUBLIC_FILES, scrubbedFile, spendKb, spendStateOf, stageOf } from './helpers';

const kb = spendKb();

/** FR-58's Vault plan pricing, measured on its own: M7's TR-8 budget is for the M7 projection. */
type Spend = NonNullable<ReturnType<typeof spendStateOf>['account']['spend']>;
const vaultPricing = (spend: Spend) => {
  const v = spend.vault;
  if (!v) return {};
  return {
    rows: v.rows.map((r) => [r.costs, r.effect, r.effectAt, r.unlockAt]),
    discount: v.discount,
    opened: v.opened,
    unlocks: v.unlocks,
  };
};
const withoutVaultPricing = (spend: Spend) => ({
  ...spend,
  vault: spend.vault
    ? {
        ...spend.vault,
        rows: spend.vault.rows.map(({ costs, effect, effectAt, unlockAt, ...r }) => r),
        discount: undefined,
        opened: undefined,
        unlocks: undefined,
      }
    : null,
});
const kbOf = (x: unknown) => JSON.stringify(x).length / 1024;

describe('M7 TR-8', () => {
  it('the SpendInputs projection adds at most 50 KB to the Account State on in-scope saves', () => {
    for (const f of [scrubbedFile('scrubbed-w2'), scrubbedFile('scrubbed-w3')]) {
      const spend = spendStateOf(f).account.spend as Spend;
      expect(kbOf(withoutVaultPricing(spend))).toBeLessThan(50);
    }
  });

  it("FR-58's per-level Vault pricing adds at most 40 KB more on in-scope saves", () => {
    for (const f of [scrubbedFile('scrubbed-w2'), scrubbedFile('scrubbed-w3')])
      expect(kbOf(vaultPricing(spendStateOf(f).account.spend as Spend)), f).toBeLessThan(40);
  });

  it('prices at most what the coins reach: under 160 KB even when they reach every level', () => {
    // fresh.json holds about 9e23 coins at 474 Vault levels, so every level of every row is in reach.
    for (const f of PUBLIC_FILES) {
      const spend = spendStateOf(f).account.spend;
      if (spend) expect(kbOf(vaultPricing(spend)), f).toBeLessThan(160);
    }
  }, 60_000);

  it('an endgame save (every stamp at its cap, past the MVP scope) stays under 100 KB', () => {
    // Known miss of TR-8's 50 KB on highend.json: 128 at-cap stamps each carry their cap-raise prices.
    for (const f of PUBLIC_FILES.filter((x) => x.endsWith('highend.json')))
      expect(kbOf(withoutVaultPricing(spendStateOf(f).account.spend as Spend))).toBeLessThan(100);
  });

  it('buildSpendPlan stays within its line cap and its time budget (generous for CI)', () => {
    const s = spendStateOf(scrubbedFile('scrubbed-w3'));
    const stage = stageOf(s);
    const gate = { bullseye: false, defence: false };
    buildSpendPlan({ state: s, kb, stage, gate });
    const runs: number[] = [];
    for (let i = 0; i < 20; i++) {
      const t = performance.now();
      const p = buildSpendPlan({ state: s, kb, stage, gate });
      runs.push(performance.now() - t);
      expect(p?.lines.length ?? 0).toBeLessThanOrEqual(MAX_LINES);
    }
    runs.sort((a, b) => a - b);
    // TR-8: 20 ms p95 on a 2020-class laptop; CI machines vary, so the test allows 5x.
    expect(runs[18] ?? 0).toBeLessThan(100);
  });
});
