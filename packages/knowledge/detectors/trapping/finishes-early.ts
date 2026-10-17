// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-21 (iii), RT-1: a placed trap is still running and ends before the return, then sits idle
// until you're back. Only a Next Action: pulling a running trap early gives up what it has built, so
// it is not a quick fix that holds. Gated on World 2 finished (Toolbox's trap gate).
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

const WORLD = 2;

const withTrap = (s: AccountState, index: number, offsetMs: number): AccountState => {
  const afk = s.characters.find((c) => c.index === index)?.afk;
  if (!afk) return s;
  const endsAt = s.asOf + offsetMs;
  return withCharacter(s, index, { afk: { ...afk, traps: { placed: [{ critter: 'Critter1', endsAt }] } } });
};

export default defineDetector({
  id: 'trapping/finishes-early',
  kind: 'check',
  system: 'trapping',
  params: z.strictObject({}),
  slots: z.strictObject({ finishesIn: z.number() }).partial(),
  reads: ['characters[*].index', 'characters[*].afk', 'account.finishedWorlds', 'diagnostics'],
  examples: {
    // US-8: a Cardboard trap that finishes in 3 h against an 8 h Expected Return.
    fires: [{ fixture: 'scrubbed-w3', subject: characterSubject(4), mutate: (s) => withTrap(s, 4, 1.08e7) }],
    silent: [
      { fixture: 'scrubbed-w3' },
      { fixture: 'scrubbed-w3', subject: characterSubject(4), mutate: (s) => withTrap(s, 4, 1.08e8) },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(4),
        mutate: (s) => withUnknown(withTrap(s, 4, 1.08e7), 'characters[4].afk.traps'),
      },
    ],
  },
  run({ state, now, expectedReturnMs }) {
    if (!isKnown(state, 'account.finishedWorlds') || !state.account.finishedWorlds.includes(WORLD)) return [];
    const returnAt = now + expectedReturnMs;
    return state.characters.flatMap((c): CheckFinding[] => {
      const subject = characterSubject(c.index);
      const traps = c.afk?.traps;
      if (!isKnown(state, `characters[${c.index}].afk.traps`) || !traps)
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
      const running = traps.placed.filter((t) => t.endsAt > now);
      if (running.length === 0) return [];
      const at = Math.min(...running.map((t) => t.endsAt));
      if (at >= returnAt) return [{ subject, slots: {}, result: 'pass' as const }];
      return [
        {
          subject,
          slots: { finishesIn: at - now },
          result: 'fires' as const,
          at,
          fixHolds: false,
          demotedBecause: 'effect-next-action' as const,
        },
      ];
    });
  },
});
