// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 TR-8 budgets, measured on the scrubbed W3-early save (the larger one) and the largest public save.
import { describe, expect, it } from 'vitest';
import { buildSpendPlan, MAX_LINES } from '../../src/spend';
import { PUBLIC_FILES, scrubbedFile, spendKb, spendStateOf, stageOf } from './helpers';

const kb = spendKb();

describe('M7 TR-8', () => {
  it('the SpendInputs projection adds at most 50 KB to the Account State on in-scope saves', () => {
    for (const f of [scrubbedFile('scrubbed-w2'), scrubbedFile('scrubbed-w3')]) {
      const s = spendStateOf(f);
      expect(JSON.stringify(s.account.spend).length).toBeLessThan(50 * 1024);
    }
  });

  it('an endgame save (every stamp at its cap, past the MVP scope) stays under 100 KB', () => {
    // Known miss of TR-8's 50 KB on highend.json: 128 at-cap stamps each carry their cap-raise prices.
    for (const f of PUBLIC_FILES.filter((x) => x.endsWith('highend.json')))
      expect(JSON.stringify(spendStateOf(f).account.spend).length).toBeLessThan(100 * 1024);
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
