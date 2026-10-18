// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4: the progress of a Vault kill row (`upgrade-vault.goal.kill-row-map-<i>`): the account's kills
// on that map, summed over every character (Toolbox `vaultTotalKills`), read through the generated
// map -> slot table, never by a hard-coded slot.
import { z } from 'zod';
import { accountSubject, isKnown, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export const KILL_SLOTS = 'upgrade-vault.fact.kill-slots';

export default defineDetector({
  id: 'upgrade-vault/kill-total',
  kind: 'progress',
  system: 'upgrade-vault',
  params: z.strictObject({ map: z.int().min(0) }),
  slots: z.strictObject({}),
  reads: ['account.vault', 'diagnostics'],
  examples: {
    // W2-late: 2,995 Poop kills on Poopy Sewers (M4 US-1).
    fires: [{ fixture: 'scrubbed-w2', params: { map: 8 }, expect: { value: 2995 } }],
    silent: [],
    unknown: [{ fixture: 'scrubbed-w2', params: { map: 8 }, mutate: (s) => withUnknown(s, 'account.vault') }],
  },
  run(ctx, { map }) {
    const { state } = ctx;
    const rows = (ctx.facts.get(KILL_SLOTS) as { rows?: { map: number; slot: number }[] } | undefined)?.rows;
    const slot = rows?.find((r) => r.map === map)?.slot;
    const v = slot === undefined ? undefined : state.account.vault?.killTotals[slot];
    if (!isKnown(state, 'account.vault') || v === undefined)
      return [{ subject: accountSubject, slots: {}, value: null, reason: 'field-missing' as const }];
    return [{ subject: accountSubject, slots: {}, value: Math.floor(v) }];
  },
});
