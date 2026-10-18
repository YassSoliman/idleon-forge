// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 FR-3: an active salt with Auto Refine off whose bar is full (`power >= powerCap`, the game's own
// rank-up test, red-team #21) has stopped making salt until it is refined: refine it now
// (`losing-now`). Several full salts merge into one Account finding in Refinery order (P1). Early
// form (TR-5): no full bar, but an Auto-Refine-off salt fills before the Expected Return, so the
// answer changes then: a `pass` whose `nextChangeAt` is that moment (M6 FR-28).
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

/** W3-early with Redox switched to Auto Refine off, `power` of 50 and the bar full in `fullIn` s. */
const redox = (s: AccountState, power: number, fullIn: number): AccountState =>
  withAccount(s, {
    refinery: s.account.refinery && {
      salts: s.account.refinery.salts.map((x, i) =>
        i === 0 ? { ...x, autoRefine: false, power, fullInSeconds: fullIn } : x,
      ),
    },
  });

export default defineDetector({
  id: 'refinery/full-bar',
  kind: 'check',
  system: 'refinery',
  params: z.strictObject({ minWorld: z.int().min(1).default(3) }),
  slots: z.strictObject({ salt: z.string(), salts: z.number() }).partial(),
  reads: ['account.refinery', 'account.currentWorld', 'diagnostics'],
  examples: {
    fires: [
      // US-1: Redox with Auto Refine off and its bar full at rank 1.
      {
        fixture: 'scrubbed-w3',
        subject: accountSubject,
        mutate: (s) => redox(s, 50, 0),
        expect: { slots: { salt: 'Redox_Salts', salts: 1 } },
      },
    ],
    silent: [
      // Redox is on Auto Refine: its bar never fills.
      { fixture: 'scrubbed-w3' },
      // Off and filling within 8 h: no Goal yet (the early form's pass).
      { fixture: 'scrubbed-w3', mutate: (s) => redox(s, 40, 9000) },
      { fixture: 'scrubbed-w2' },
    ],
    unknown: [{ fixture: 'scrubbed-w3', mutate: (s) => withAccount(s, { refinery: null }) }],
  },
  run({ state, now, expectedReturnMs }, { minWorld }) {
    const { refinery, currentWorld } = state.account;
    const subject = accountSubject;
    if (!isKnown(state, 'account.refinery') || !refinery || currentWorld == null)
      return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
    if (currentWorld < minWorld) return [];
    const manual = refinery.salts.filter((s) => s.unlocked && s.active && !s.autoRefine);
    const full = manual.filter((s) => s.power >= s.powerCap);
    const first = full[0];
    if (first)
      return [
        {
          subject,
          slots: { salt: first.name, salts: full.length },
          result: 'fires' as const,
          urgency: 'losing-now' as const,
          doneKey: full.map((s) => s.rawName).join(','),
        },
      ];
    const soon = manual
      .map((s) => s.fullInSeconds)
      .filter((t): t is number => t !== null && t > 0 && t * 1000 < expectedReturnMs);
    return [
      {
        subject,
        slots: {},
        result: 'pass' as const,
        ...(soon.length ? { nextChangeAt: now + Math.min(...soon) * 1000 } : {}),
      },
    ];
  },
});
