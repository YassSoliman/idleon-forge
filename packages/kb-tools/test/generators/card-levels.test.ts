// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { starSteps } from '@idleon-forge/knowledge/generators/card-levels.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

describe('card-levels generator', () => {
  it('reads perTier, not the effect text (synthetic slice, hand-checked)', () => {
    // perTier 10: copies must exceed 10 × 1, 4, 9, 25 -> 11, 41, 91, 251.
    // perTier 1.5: exceed 1.5, 6, 13.5, 37.5 -> 2, 7, 14, 38.
    expect(starSteps(10)).toEqual([11, 41, 91, 251]);
    expect(starSteps(1.5)).toEqual([2, 7, 14, 38]);
    const out = runOnSlice(generator, {
      cards: {
        Copper: {
          rawName: 'Copper',
          displayName: 'Copper',
          perTier: 10,
          category: 'Easy_Resources',
          effect: '+{_99_accuracy',
          bonus: 4,
        },
        Boss2A: { rawName: 'Boss2A', displayName: 'Efaunt', perTier: 1.5, category: 'Bosses' },
      },
    });
    expect(out.entries?.map((e) => e.id)).toEqual(['cards.goal.copper']);
    const e = out.entries?.[0];
    expect(e?.type === 'goal' && e.milestones?.map((m) => m.at)).toEqual([1, 11, 41, 91, 251]);
    expect(e?.values).toEqual({ card: 'Copper', perTier: 10 });
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    // 16 + 14 + 16 + 14 monster cards (W1–W4) plus 13 + 31 + 36 resource cards at the pin.
    expect(out.entries.length).toBeGreaterThan(100);
    expect(out.entries.length).toBeLessThan(160);
    // M4 TR-4: the dropper's AFK type, so a fighting Contribution expands only over fighting cards.
    const afk = (id: string) => out.entries.find((e) => e.id === id)?.values.afkType;
    expect(afk('cards.goal.copper')).toBe('MINING');
    expect(afk('cards.goal.poop-small')).toBe('FIGHTING');
  });

  it("gives the same star count as Toolbox's calculateStars on known saves", async () => {
    const out = await runLive(generator);
    const steps = new Map(
      out.entries.map((e) => [
        e.values.card as string,
        e.type === 'goal' ? (e.milestones ?? []).slice(1).map((m) => m.at) : [],
      ]),
    );
    let checked = 0;
    for (const file of ['latest.json', 'fresh.json', 'third.json', 'first.json']) {
      const cards = knownSave(file).account.cards as Record<
        string,
        { rawName: string; amount: number; stars: number }
      >;
      for (const c of Object.values(cards)) {
        const s = steps.get(c.rawName);
        if (!s || c.amount <= 0 || c.stars >= 5) continue; // 5★+ come from the rift/spelunking lists
        const ours = s.filter((at) => c.amount >= at).length;
        expect(Math.min(c.stars, 4), `${file} ${c.rawName} x${c.amount}`).toBe(ours);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(100);
  });
});
