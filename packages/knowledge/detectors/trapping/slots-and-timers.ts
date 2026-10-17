// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-21 (ii): a placed trap has finished (endsAt <= now) and sits idle until it is collected and
// re-placed (Toolbox's `trapsOverdue`, isPast(timeLeft)). `endsAt` is anchored to the cloud save (TR-2).
// Gated on World 2 finished (Toolbox's trap gate).
// Branch (i), "fewer traps placed than the set allows", is not built: it needs the per-set trap count
// (`trapping.fact.trap-set-capacity`, RT-8), which no generator produces yet.
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

const WORLD = 2;

// US-8: one Cardboard trap placed on the W3-early Barbarian, ending `offsetMs` after the save.
const withTrap = (s: AccountState, index: number, offsetMs: number): AccountState => {
  const afk = s.characters.find((c) => c.index === index)?.afk;
  if (!afk) return s;
  const endsAt = (s.account.lastCloudSave ?? s.asOf) + offsetMs;
  return withCharacter(s, index, { afk: { ...afk, traps: { placed: [{ critter: 'Critter1', endsAt }] } } });
};

export default defineDetector({
  id: 'trapping/slots-and-timers',
  kind: 'check',
  system: 'trapping',
  params: z.strictObject({}),
  slots: z.strictObject({ traps: z.number(), idleFor: z.number() }).partial(),
  reads: [
    'characters[*].index',
    'characters[*].afk',
    'account.finishedWorlds',
    'account.lastCloudSave',
    'diagnostics',
  ],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', subject: characterSubject(4), mutate: (s) => withTrap(s, 4, -3.6e6) }],
    // US-8: 0 traps placed on the W3-early account; a trap still running is finishes-early's (iii).
    silent: [
      { fixture: 'scrubbed-w3' },
      { fixture: 'scrubbed-w3', subject: characterSubject(4), mutate: (s) => withTrap(s, 4, 1.08e8) },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(4),
        mutate: (s) => withUnknown(withTrap(s, 4, -3.6e6), 'characters[4].afk.traps'),
      },
    ],
  },
  run({ state, now }) {
    if (!isKnown(state, 'account.finishedWorlds') || !state.account.finishedWorlds.includes(WORLD)) return [];
    return state.characters.flatMap((c) => {
      const subject = characterSubject(c.index);
      const traps = c.afk?.traps;
      if (!isKnown(state, `characters[${c.index}].afk.traps`) || !traps)
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
      const done = traps.placed.filter((t) => t.endsAt <= now);
      if (done.length === 0) return [];
      const at = Math.min(...done.map((t) => t.endsAt));
      return [
        {
          subject,
          slots: { traps: done.length, idleFor: now - at },
          result: 'fires' as const,
          at,
          fixHolds: true,
        },
      ];
    });
  },
});
