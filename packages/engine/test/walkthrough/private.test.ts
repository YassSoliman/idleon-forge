// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 acceptance on the two private saves (local only; skipped in CI, which runs the scrubbed copies in
// walkthrough.test.ts). The real saves must give exactly the scrubbed saves' Walkthroughs and printer
// plan: every text names characters by class and level only, so nothing here depends on a name.
import { describe, expect, it } from 'vitest';
import { engineOf, hasPrivate, privateFile, scrubbedFile, walkthroughsOf, workerState } from './helpers';

const PAIRS = [
  ['yasser', 'scrubbed-w2'],
  ['joseph', 'scrubbed-w3'],
] as const;

describe.each(PAIRS)('private save %s', (stem, scrubbed) => {
  it.skipIf(!hasPrivate(stem))('gives the same Walkthroughs and printer plan as %s', () => {
    const real = engineOf(workerState(privateFile(stem)));
    const copy = engineOf(workerState(scrubbedFile(scrubbed)));
    const views = (r: typeof real) => walkthroughsOf(r).map((w) => w.goal.walkthrough);
    expect(views(real)).toEqual(views(copy));
    const printer = (r: typeof real) =>
      r.account.goals.find((g) => g.id === 'printer.check.slot-plan')?.nextAction.text;
    expect(printer(real)).toEqual(printer(copy));
  });
});
