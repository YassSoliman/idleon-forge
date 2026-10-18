// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4, TR-5 `cards.contribution.fight`: a fighter on a monster with a card raises the account's copies
// of that card toward its next level. The ETA is a mean at the base drop chance (`bound:
// 'mean-at-base-rate'`, red-team note 11): missing copies ÷ (Σ feeders' kills/h × chance), with the
// chance ×5 while the account owns none (the game's LootDropOddsReset, cards dossier, H). The card
// multiplier only shortens it, so the horizon test errs toward "not worthwhile". Copies are never
// projected (FR-9: drops are random). `rule` 1 marks the first copy; the class card list is the engine's.
import { z } from 'zod';
import {
  characterSubject,
  feederSlots,
  fightersOf,
  isKnown,
  ladderOf,
  PURPOSE_ENGINE_SLOTS,
  purposeGoal,
  purposeGoalParam,
  valueStr,
  withAccount,
  withUnknown,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

const DROPS = 'cards.fact.drops';

export default defineDetector({
  id: 'cards/fight-level',
  kind: 'contribution',
  system: 'cards',
  params: z.strictObject({ unownedMultiplier: z.number().min(1).default(5), ...purposeGoalParam }),
  slots: z
    .strictObject({
      saved: z.number(),
      rate: z.number(),
      feeders: z.string(),
      rule: z.number(),
      chance: z.number(),
      complete: z.number(),
      thenEtaMs: z.number(),
      target: z.string(),
      ...PURPOSE_ENGINE_SLOTS,
    })
    .partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].afkTarget',
    'characters[*].targetMonster',
    'characters[*].fighting',
    'account.cards',
    'diagnostics',
  ],
  examples: {
    // W2-late Barbarian Lv 60 on Poop: 1 copy, next level at 11 (M4 US-3); W3-early Squire Lv 85: no
    // Thermostat card yet, so the first copy drops at 5× the chance (US-6).
    fires: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(0),
        params: { goal: 'cards.goal.poop-small' },
        expect: { slots: { saved: 1, rule: 0, rate: 1430 } },
      },
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(3),
        params: { goal: 'cards.goal.thermostat' },
        expect: { slots: { saved: 0, rule: 1 } },
      },
    ],
    // W2-late Shaman Lv 44 on Slime: the card is at its last base level (4 stars).
    silent: [
      { fixture: 'scrubbed-w2', subject: characterSubject(2), params: { goal: 'cards.goal.slime-g' } },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(0),
        params: { goal: 'cards.goal.poop-small' },
        mutate: (s) => withUnknown(s, 'account.cards'),
      },
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(0),
        params: { goal: 'cards.goal.poop-small' },
        mutate: (s) => withAccount(s, { cards: null }),
      },
    ],
  },
  run(ctx, { unownedMultiplier, goal }) {
    const { state } = ctx;
    const g = purposeGoal(ctx, goal);
    const card = valueStr(g, 'card');
    if (card === null) return [];
    const drop = (
      ctx.facts.get(DROPS) as { rows?: Record<string, { chance: number; monster: string | null }> }
    )?.rows?.[card];
    const monster = drop?.monster ?? card;
    const feeders = fightersOf(state, (c) => c.targetMonster === monster);
    if (feeders.length === 0) return [];
    const cards = state.account.cards;
    if (!isKnown(state, 'account.cards') || !cards || !drop)
      return feeders.map((f) => ({
        subject: characterSubject(f.c.index),
        slots: {},
        advances: 'unknown' as const,
      }));
    const amount = cards[card]?.amount ?? 0;
    const ladder = ladderOf(g);
    const next = ladder.find((at) => at > amount) ?? null;
    const following = next === null ? null : (ladder.find((at) => at > next) ?? null);
    const { rate, feeders: who } = feederSlots(feeders);
    const perHour = rate * drop.chance; // copies per hour at the base chance, once one is owned
    const hoursTo = (from: number, to: number) => {
      if (perHour <= 0) return null;
      if (from > 0) return (to - from) / perHour;
      return 1 / (perHour * unownedMultiplier) + (to - 1) / perHour;
    };
    const ms = (h: number | null) => (h === null ? null : Math.round(h * 3_600_000));
    return feeders.map((f) => {
      const subject = characterSubject(f.c.index);
      if (f.rate === null) return { subject, slots: {}, advances: 'unknown' as const };
      const base = {
        saved: amount,
        rate,
        feeders: who,
        rule: amount === 0 ? 1 : 0,
        chance: drop.chance,
        target: f.c.afkTarget ?? '',
      };
      if (next === null)
        return { subject, slots: { ...base, complete: 1 }, advances: 'no' as const, etaMs: null };
      const eta = ms(hoursTo(amount, next));
      const thenEta = following === null ? null : ms(hoursTo(amount, following));
      const slots = { ...base, complete: 0, ...(thenEta === null ? {} : { thenEtaMs: thenEta }) };
      return { subject, slots, advances: eta === null ? ('no' as const) : ('yes' as const), etaMs: eta };
    });
  },
});
