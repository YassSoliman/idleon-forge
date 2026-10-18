// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4, TR-5 the death-note skull Contribution: a fighter on a Death Note monster raises the account's
// kills of it toward its next rank (25k, 100k, ...). One finding per feeder, with the account's kills
// and every feeder's summed rate. Ranks raise the world's multikill only once the Death Note building
// has a level (W3 dossier, H): below it the kills are banked (`rule` 0).
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

export default defineDetector({
  id: 'death-note/skull',
  kind: 'contribution',
  system: 'death-note',
  params: z.strictObject({ buildingLevelMin: z.int().min(0).default(1), ...purposeGoalParam }),
  slots: z
    .strictObject({
      saved: z.number(),
      rate: z.number(),
      feeders: z.number(),
      rule: z.number(),
      building: z.number(),
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
    'account.deathNote',
    'account.buildings',
    'diagnostics',
  ],
  examples: {
    // W3-early Shaman Lv 54 on Sand Castle: ~12.8k kills, building Lv 0, so banked (M4 US-3).
    fires: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(5),
        params: { goal: 'death-note.goal.sandcastle' },
        expect: { slots: { saved: 12806, rule: 0, building: 0 } },
      },
    ],
    silent: [
      { fixture: 'scrubbed-w3', params: { goal: 'death-note.goal.poop-small' } },
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(5),
        params: { goal: 'death-note.goal.sandcastle' },
        mutate: (s) =>
          withAccount(s, {
            deathNote: Object.fromEntries(Object.keys(s.account.deathNote ?? {}).map((m) => [m, 1e9])),
          }),
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(5),
        params: { goal: 'death-note.goal.sandcastle' },
        mutate: (s) => withUnknown(s, 'account.deathNote'),
      },
    ],
  },
  run(ctx, { buildingLevelMin, goal }) {
    const { state } = ctx;
    const g = purposeGoal(ctx, goal);
    const monster = valueStr(g, 'monster');
    if (monster === null) return [];
    const feeders = fightersOf(state, (c) => c.targetMonster === monster);
    if (feeders.length === 0) return [];
    const kills = state.account.deathNote?.[monster];
    const building = state.account.buildings?.deathNote;
    if (
      !isKnown(state, 'account.deathNote') ||
      !isKnown(state, 'account.buildings') ||
      kills === undefined ||
      building === null ||
      building === undefined
    )
      return feeders.map((f) => ({
        subject: characterSubject(f.c.index),
        slots: {},
        advances: 'unknown' as const,
      }));
    const saved = kills;
    const { rate, feeders: who } = feederSlots(feeders);
    const next = ladderOf(g).find((at) => at > saved) ?? null;
    return feeders.map((f) => {
      const subject = characterSubject(f.c.index);
      if (f.rate === null) return { subject, slots: {}, advances: 'unknown' as const };
      const slots = {
        saved,
        rate,
        feeders: who,
        rule: building >= buildingLevelMin ? 1 : 0,
        building,
        target: f.c.afkTarget ?? '',
      };
      if (next === null || rate <= 0) return { subject, slots, advances: 'no' as const, etaMs: null };
      return {
        subject,
        slots,
        advances: 'yes' as const,
        etaMs: Math.round(((next - saved) / rate) * 3_600_000),
      };
    });
  },
});
