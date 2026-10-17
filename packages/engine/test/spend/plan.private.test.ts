// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 on the private fixtures (local only, TR-9): skipped when fixtures/private/ is absent (always in CI).
// Rules only; no balance or name is asserted or printed.
import { describe, expect, it } from 'vitest';
import { buildSpendPlan } from '../../src/spend';
import { hasPrivateFile, privateFile, scrubbedFile, spendKb, spendStateOf, stageOf } from './helpers';

const kb = spendKb();
const plan = (file: string) => {
  const s = spendStateOf(file);
  return {
    s,
    p: buildSpendPlan({ state: s, kb, stage: stageOf(s), gate: { bullseye: false, defence: false } }),
  };
};

describe.each([
  ['yasser', 'scrubbed-w2', 'W2-late'],
  ['joseph', 'scrubbed-w3', 'W3-early'],
] as const)('private %s', (stem, scrubbed, stage) => {
  it.skipIf(!hasPrivateFile(stem))("has the Stage, the wallet rule and the scrubbed save's order", () => {
    const { s, p } = plan(privateFile(stem));
    expect(p?.stage).toBe(stage);
    for (const w of p?.wallets ?? []) expect(w.planned).toBeLessThanOrEqual(w.coins + 1e-6);
    expect(JSON.stringify(p)).not.toContain(s.characters[0]?.name ?? '\u0000');
    const twin = plan(scrubbedFile(scrubbed)).p;
    expect(p?.lines.map((l) => [l.entryId, l.status, l.payer])).toEqual(
      twin?.lines.map((l) => [l.entryId, l.status, l.payer]),
    );
  });
});
