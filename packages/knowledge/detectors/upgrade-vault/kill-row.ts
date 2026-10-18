// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4, TR-5 `upgrade-vault.contribution.kill-row`: a fighter killing the main monster of a Vault kill
// map (Poopy Sewers and four others) raises the account's kill total there, and each power of 10 steps
// its Vault row up. One finding per feeder, with the account's total, the summed kill rate of every
// feeder (FR-4) and whether the row has a level yet (a row at Lv 0 pays nothing per step: `rule` 0).
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
  valueNum,
  valueStr,
  withAccount,
  withUnknown,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

const KILL_SLOTS = 'upgrade-vault.fact.kill-slots';
const MAPS = 'maps.fact.maps';

export default defineDetector({
  id: 'upgrade-vault/kill-row',
  kind: 'contribution',
  system: 'upgrade-vault',
  params: z.strictObject({ rowLevelMin: z.int().min(0).default(1), ...purposeGoalParam }),
  slots: z
    .strictObject({
      saved: z.number(),
      rate: z.number(),
      feeders: z.string(),
      rule: z.number(),
      rowLevel: z.number(),
      target: z.string(),
      row: z.string(),
      ...PURPOSE_ENGINE_SLOTS,
    })
    .partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].afkTarget',
    'characters[*].mapIndex',
    'characters[*].targetMonster',
    'characters[*].fighting',
    'account.vault',
    'diagnostics',
  ],
  examples: {
    // W2-late Barbarian Lv 60 on Poop: 2,995 kills, 1,430 kills/h, Dirty Money has levels (M4 US-1).
    fires: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(0),
        params: { goal: 'upgrade-vault.goal.kill-row-map-8' },
        expect: { slots: { saved: 2995, rate: 1430, rule: 1, feeders: '0' } },
      },
    ],
    silent: [
      // Nobody fights on Valley of the Beans in the W2-late save.
      { fixture: 'scrubbed-w2', params: { goal: 'upgrade-vault.goal.kill-row-map-14' } },
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(0),
        params: { goal: 'upgrade-vault.goal.kill-row-map-8' },
        mutate: (s) =>
          withAccount(s, {
            vault: s.account.vault && {
              ...s.account.vault,
              killTotals: s.account.vault.killTotals.map(() => 1e13),
            },
          }),
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(0),
        params: { goal: 'upgrade-vault.goal.kill-row-map-8' },
        mutate: (s) => withUnknown(s, 'account.vault'),
      },
    ],
  },
  run(ctx, { rowLevelMin, goal }) {
    const { state } = ctx;
    const g = purposeGoal(ctx, goal);
    const map = valueNum(g, 'map');
    const row = valueStr(g, 'row');
    if (map === null || row === null) return [];
    const mainTarget = (
      ctx.facts.get(MAPS) as { rows?: { index: number; target: string | null }[] } | undefined
    )?.rows?.find((r) => r.index === map)?.target;
    const feeders = fightersOf(
      state,
      (c) => c.mapIndex === map && !!mainTarget && c.targetMonster === mainTarget,
    );
    if (feeders.length === 0) return [];
    const slot = (
      ctx.facts.get(KILL_SLOTS) as { rows?: { map: number; slot: number }[] } | undefined
    )?.rows?.find((r) => r.map === map)?.slot;
    const vault = state.account.vault;
    const total = slot === undefined ? undefined : vault?.killTotals[slot];
    const rowLevel = vault?.rowLevels[row];
    if (!isKnown(state, 'account.vault') || total === undefined || rowLevel === undefined)
      return feeders.map((f) => ({
        subject: characterSubject(f.c.index),
        slots: {},
        advances: 'unknown' as const,
      }));
    const saved = Math.floor(total);
    const { rate, feeders: who } = feederSlots(feeders);
    const next = ladderOf(g).find((at) => at > saved) ?? null;
    return feeders.map((f) => {
      const subject = characterSubject(f.c.index);
      if (f.rate === null) return { subject, slots: {}, advances: 'unknown' as const };
      const slots = {
        saved,
        rate,
        feeders: who,
        rule: rowLevel >= rowLevelMin ? 1 : 0,
        rowLevel,
        target: f.c.afkTarget ?? '',
        row,
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
