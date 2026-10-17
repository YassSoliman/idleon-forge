// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-22: a character assigned to no cauldron (Toolbox `alchemy.activities[i].activity === -1`) adds
// no brewing while you're away. Applies from W2-early (the account is working on World 2 or later).
// A present-state Check: "Assign {class} to a cauldron" is a one-minute fix.
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

const WORLD = 2;

const unassign = (s: AccountState, index: number): AccountState => {
  const afk = s.characters.find((c) => c.index === index)?.afk;
  return afk ? withCharacter(s, index, { afk: { ...afk, cauldronAssigned: false } }) : s;
};

export default defineDetector({
  id: 'alchemy/cauldron-unassigned',
  kind: 'check',
  system: 'alchemy',
  params: z.strictObject({}),
  slots: z.strictObject({}),
  reads: ['characters[*].index', 'characters[*].afk', 'account.currentWorld', 'diagnostics'],
  examples: {
    // US-8: a mutation setting the W2-late Bowman Lv 54's activity to -1.
    fires: [{ fixture: 'scrubbed-w2', subject: characterSubject(3), mutate: (s) => unassign(s, 3) }],
    // US-8: every character on both fixtures is assigned.
    silent: [{ fixture: 'scrubbed-w2' }, { fixture: 'scrubbed-w3' }],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(3),
        mutate: (s) => withUnknown(unassign(s, 3), 'characters[3].afk.cauldronAssigned'),
      },
    ],
  },
  run({ state }) {
    if (!isKnown(state, 'account.currentWorld') || (state.account.currentWorld ?? 0) < WORLD) return [];
    return state.characters.flatMap((c): CheckFinding[] => {
      const subject = characterSubject(c.index);
      const assigned = c.afk?.cauldronAssigned;
      if (
        !isKnown(state, `characters[${c.index}].afk.cauldronAssigned`) ||
        assigned === null ||
        assigned === undefined
      )
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
      if (assigned) return [{ subject, slots: {}, result: 'pass' as const }];
      return [{ subject, slots: {}, result: 'fires' as const, fixHolds: true }];
    });
  },
});
