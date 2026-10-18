// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 FR-1, FR-2, FR-5: an unlocked, active salt on Auto Refine below the rank its predecessor can
// still fuel. Only a manual Refine of a full bar ranks a salt up; the auto pass empties the bar into
// salt and never touches the rank (N.js @7640085, @7727530), so the salt stays at its rank for good.
// Reads Toolbox's `saltMaxSafeRank` (the predecessor limit), never the printer-capped `maxSafeRank`
// (red-team #1). At or above the safe rank: silent in either setting (FR-2; ActiveOn never says
// "turn Auto Refine on", D-2). The salts merge into one Account finding, in Refinery order, with the
// first one's Next Action (P1). The entry applies W3-early … W4-entry; the engine drops it on a
// `beyond` account (P2). Inactive salts are M6 FR-31's (FR-6), so they never reach this rule.
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

const redoxOff = (s: AccountState): AccountState =>
  withAccount(s, {
    refinery: s.account.refinery && {
      salts: s.account.refinery.salts.map((x, i) => (i === 0 ? { ...x, autoRefine: false } : x)),
    },
  });

export default defineDetector({
  id: 'refinery/auto-refine',
  kind: 'check',
  system: 'refinery',
  params: z.strictObject({ minWorld: z.int().min(1).default(3) }),
  slots: z
    .strictObject({ salt: z.string(), rank: z.number(), fullIn: z.number(), salts: z.number() })
    .partial(),
  reads: ['account.refinery', 'account.currentWorld', 'diagnostics'],
  examples: {
    fires: [
      // US-1: Redox on Auto Refine at rank 1, power 0 of 50; its safe rank is Toolbox's maxUsefulRank.
      {
        fixture: 'scrubbed-w3',
        subject: accountSubject,
        expect: { slots: { salt: 'Redox_Salts', rank: 1, fullIn: 45_000_000, salts: 1 } },
      },
    ],
    silent: [
      { fixture: 'scrubbed-w3', mutate: redoxOff },
      // FR-2: at its safe rank, silent whatever the setting.
      {
        fixture: 'scrubbed-w3',
        mutate: (s) =>
          withAccount(s, {
            refinery: s.account.refinery && {
              salts: s.account.refinery.salts.map((x, i) => (i === 0 ? { ...x, saltMaxSafeRank: 1 } : x)),
            },
          }),
      },
      // W2-late: Redox listed as unlocked, but inactive and the account is not in World 3.
      { fixture: 'scrubbed-w2' },
    ],
    unknown: [
      { fixture: 'scrubbed-w3', mutate: (s) => withAccount(s, { refinery: null }) },
      {
        fixture: 'scrubbed-w3',
        mutate: (s) =>
          withAccount(s, {
            refinery: s.account.refinery && {
              salts: s.account.refinery.salts.map((x) => ({ ...x, saltMaxSafeRank: null })),
            },
          }),
      },
    ],
  },
  run({ state }, { minWorld }) {
    const { refinery, currentWorld } = state.account;
    const subject = accountSubject;
    const unknown = [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
    if (!isKnown(state, 'account.refinery') || !refinery || currentWorld == null) return unknown;
    if (currentWorld < minWorld) return [];
    const running = refinery.salts.filter((s) => s.unlocked && s.active && s.autoRefine);
    // A failed balance or cycle computation is unknown, never a guessed safe rank (FR-5).
    if (running.some((s) => s.saltMaxSafeRank === null || s.fullInSeconds === null)) return unknown;
    const below = running.filter((s) => s.rank < (s.saltMaxSafeRank as number));
    const first = below[0];
    if (!first) return [{ subject, slots: {}, result: 'pass' as const }];
    return [
      {
        subject,
        slots: {
          salt: first.name,
          rank: first.rank,
          fullIn: (first.fullInSeconds as number) * 1000,
          salts: below.length,
        },
        result: 'fires' as const,
        urgency: 'banked' as const,
        doneKey: below.map((s) => s.rawName).join(','),
      },
    ];
  },
});
