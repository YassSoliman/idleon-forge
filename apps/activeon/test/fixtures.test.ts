// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 RT-21: the story fixtures hold what the stories assume of them.
import { buildNowView, DEFAULT_UI, EMPTY_PREFS } from '@idleon-forge/engine/now';
import { describe, expect, it } from 'vitest';
import { allSetW2, scrubbed, W2_BLOCKERS } from './fixtures';

describe('allSetW2 (US-4)', () => {
  it('W2-late has exactly the two blockers allSetW2 resolves: the Barbarian Lv 60 food and the account', () => {
    const { result } = scrubbed('scrubbed-w2');
    const charBlockers = result.characters.flatMap((c) => c.verdict.blockerKeys);
    expect(charBlockers.map((k) => k.split('@')[0])).toEqual([W2_BLOCKERS.food]);
    expect(result.account.blockerKeys.map((k) => k.split('@')[0])).toEqual([W2_BLOCKERS.account]);
  }, 120_000);

  it('yields zero blockers: no character to fix and none in the Account', () => {
    const r = allSetW2();
    expect(r.characters.every((c) => c.verdict.kind !== 'fix' && c.verdict.blockerKeys.length === 0)).toBe(
      true,
    );
    expect(r.account.blockerKeys).toEqual([]);
    expect(r.account.goals.some((g) => g.category === 'blocker')).toBe(false);
    const view = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: r.asOf, lastCloudSave: r.asOf - 60_000 });
    expect(view.progress.fix).toBe(0);
    expect(view.account.blockers).toEqual([]);
  }, 120_000);
});
