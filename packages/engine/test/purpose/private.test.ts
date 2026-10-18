// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-5 on the real saves (local only: fixtures/private is gitignored, so these skip in CI). The
// scrubbed saves are the same accounts with names removed, so every Purpose must match theirs.
import { describe, expect, it } from 'vitest';
import { derived, hasPrivate, privateFile, scrubbedFile, workerState } from './helpers';

const pairs = [
  ['yasser', 'scrubbed-w2'],
  ['joseph', 'scrubbed-w3'],
] as const;

describe.each(pairs)('the private save %s', (stem, scrubbed) => {
  it.skipIf(!hasPrivate(stem))(`gives the same Purposes as ${scrubbed}`, () => {
    const real = derived(workerState(privateFile(stem))).purposes;
    const shared = derived(workerState(scrubbedFile(scrubbed))).purposes;
    const view = (ps: typeof real) =>
      ps.map((p) => ({ i: p.characterIndex, status: p.status, lines: p.goals.map((g) => g.text.headline) }));
    expect(view(real)).toEqual(view(shared));
  });
});
