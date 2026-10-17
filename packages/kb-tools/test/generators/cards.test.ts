// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator from '@idleon-forge/knowledge/generators/cards.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

const card = (rawName: string, cardIndex: string, category: string, perTier = 5) => ({
  rawName,
  displayName: `${rawName}_name`,
  cardIndex,
  perTier,
  bonus: 1,
  category,
});

describe('cards generator', () => {
  it('reads base chances from the Cards<index> drop and builds set ladders of n points per level (synthetic slice, hand-checked)', () => {
    const out = runOnSlice(generator, {
      cards: {
        mushG: card('mushG', 'A0', 'Blunder_Hills'),
        frogG: card('frogG', 'A2', 'Blunder_Hills'),
        x: card('x', 'B0', 'Other'),
      },
      cardSets: {
        '{%_EXP_if_below_Lv_50': { name: 'Blunder_Hills', rawName: 'CardSet0', bonus: 8, effect: 'e' },
      },
      monsterDrops: {
        mushG: [{ monsterRawName: 'mushG', rawName: 'CardsA0', chance: 0.01, effectiveChance: 0.004 }],
      },
    });
    const mush = out.entries?.find((e) => e.id === 'cards.acquisition.mush-g');
    expect(mush?.type === 'acquisition' && mush.rates).toEqual({ mushG: 0.004 });
    expect(mush?.values).toMatchObject({
      item: 'CardsA0',
      set: 'Blunder_Hills',
      setRawName: 'CardSet0',
      perTier: 5,
    });
    const set = out.entries?.find((e) => e.id === 'cards.goal.set-card-set0');
    // 2 cards in the set: level L needs 2L points.
    expect(set?.type === 'goal' && set.milestones?.map((m) => m.at)).toEqual([2, 4, 6, 8, 10]);
    expect(set?.type === 'goal' && set.data?.starUnlockLevels).toEqual([
      { level: 6, at: 12 },
      { level: 7, at: 14 },
    ]);
  });

  it('holds its invariants on the pinned data: every card, one ladder per non-empty set', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const acquisitions = out.entries.filter((e) => e.type === 'acquisition');
    const ladders = out.entries.filter((e) => e.type === 'goal');
    expect(acquisitions.length).toBeGreaterThanOrEqual(250);
    expect(ladders.length).toBeGreaterThanOrEqual(10);
    // Hand-checked in cards.json: Blunder_Hills has 16 cards, so its set ladder steps by 16.
    const blunder = ladders.find((e) => e.values.set === 'Blunder_Hills');
    expect(blunder?.type === 'goal' && blunder.milestones?.[0]?.at).toBe(16);
    const mush = acquisitions.find((e) => e.id === 'cards.acquisition.mush-g');
    expect(mush?.type === 'acquisition' && Object.keys(mush.rates ?? {})).toEqual(['mushG']);
  });

  it("reproduces the set level the game stored for each character's equipped set, on a known save", async () => {
    // A character's equipped set bonus in the save (CSetEq) is the set's bonus × its level when it was
    // equipped. Set levels never go down, so the level our ladder computes from Toolbox's parsed cards
    // is at least that; on this maxed save it is equal.
    const out = await runLive(generator);
    const parsed = knownSave('latest.json');
    const cards = parsed.account.cards as Record<string, { rawName: string; stars: number; amount: number }>;
    const byRaw = new Map(Object.values(cards).map((c) => [c.rawName, c]));
    const ladders = out.entries.filter((e) => e.type === 'goal');
    let checked = 0;
    for (const ch of parsed.characters) {
      const eq = (ch.cards as { cardSet?: { rawName?: string; stars?: number } } | undefined)?.cardSet;
      if (!eq?.rawName || typeof eq.stars !== 'number') continue;
      const ladder = ladders.find((e) => e.values.setRawName === eq.rawName);
      if (ladder?.type !== 'goal') continue;
      const points = ((ladder.data?.members ?? []) as string[]).reduce((sum, raw) => {
        const c = byRaw.get(raw);
        return sum + (!c ? 0 : c.stars === 0 && c.amount > 0 ? 1 : c.stars > 0 ? c.stars + 1 : 0);
      }, 0);
      const n = ladder.values.cards as number;
      const level = Math.floor(points / n);
      expect(level).toBeGreaterThanOrEqual(eq.stars + 1);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});
