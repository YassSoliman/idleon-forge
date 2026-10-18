// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 FR-4, FR-10: the first locked salt (Refinery order, salts 2–6) can be unlocked: its cost
// (`refinery.fact.salt-unlock-costs`, the previous salt) is covered by that salt in the storage chest
// (the unlock reads chest storage only, N.js @7643814; the Refinery's own storage slots don't count),
// and no built-and-waiting Construction building is paid in that salt (its payment is reserved, FR-10;
// the amount it needs is the game's, D-1, so no amount is reserved, only the salt).
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

const FACT = 'refinery.fact.salt-unlock-costs';

interface CostRow {
  salt: string;
  cost: string;
  amount: number;
}

/** W3-early with `n` Explosive Salts in the chest and Spontaneity still locked. */
const explosive = (s: AccountState, n: number): AccountState =>
  withAccount(s, { storageItems: { ...(s.account.storageItems ?? {}), Refinery2: n } });

/** ... and nothing paid in Explosive Salts waiting (the fixture's Death Note and Boulder Roller are). */
const deathNotePaid = (s: AccountState): AccountState => {
  const c = s.account.construction;
  return withAccount(s, {
    construction: c && {
      ...c,
      buildings: c.buildings.map((b) =>
        b.saltRawName === 'Refinery2' ? { ...b, level: b.level + 1, progress: 0, bodyFull: false } : b,
      ),
    },
  });
};

export default defineDetector({
  id: 'refinery/unlock-next',
  kind: 'check',
  system: 'refinery',
  params: z.strictObject({ minWorld: z.int().min(1).default(3) }),
  slots: z
    .strictObject({ salt: z.string(), cost: z.number(), material: z.string(), held: z.number() })
    .partial(),
  reads: [
    'account.refinery',
    'account.storageItems',
    'account.construction',
    'account.currentWorld',
    'diagnostics',
  ],
  examples: {
    fires: [
      {
        fixture: 'scrubbed-w3',
        subject: accountSubject,
        mutate: (s) => deathNotePaid(explosive(s, 160)),
        expect: { slots: { salt: 'Spontaneity_Salts', cost: 150, material: 'Explosive_Salts', held: 160 } },
      },
    ],
    silent: [
      // 0 Explosive Salts in the chest.
      { fixture: 'scrubbed-w3' },
      // Enough Explosive, but the Death Note and Boulder Roller are built and waiting for Explosive Salts (FR-10).
      { fixture: 'scrubbed-w3', mutate: (s) => explosive(s, 160) },
      // In the Refinery's own storage only: the unlock reads the chest.
      {
        fixture: 'scrubbed-w3',
        mutate: (s) =>
          withAccount(deathNotePaid(s), {
            refineryStorage: { ...(s.account.refineryStorage ?? {}), Refinery2: 160 },
          }),
      },
      { fixture: 'scrubbed-w2' },
    ],
    unknown: [{ fixture: 'scrubbed-w3', mutate: (s) => withAccount(s, { construction: null }) }],
  },
  run({ state, facts }, { minWorld }) {
    const { refinery, storageItems, construction, currentWorld } = state.account;
    const subject = accountSubject;
    const unknown = [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
    const known =
      isKnown(state, 'account.refinery') &&
      isKnown(state, 'account.storageItems') &&
      isKnown(state, 'account.construction');
    if (!known || !refinery || !storageItems || !construction || currentWorld == null) return unknown;
    if (currentWorld < minWorld) return [];
    const table = facts.get(FACT) as { rows?: unknown } | undefined;
    const rows = (Array.isArray(table?.rows) ? table.rows : []) as CostRow[];
    const next = refinery.salts.find((s) => !s.unlocked);
    const row = next ? rows.find((r) => r.salt === next.rawName) : undefined;
    if (!next || !row) return [];
    const held = storageItems[row.cost] ?? 0;
    if (held < row.amount) return [];
    const waiting = construction.buildings.some(
      (b) => b.bodyFull && b.level < b.maxLevel && b.saltRawName === row.cost,
    );
    if (waiting) return [];
    const material = refinery.salts.find((s) => s.rawName === row.cost)?.name ?? row.cost;
    return [
      {
        subject,
        slots: { salt: next.name, cost: row.amount, material, held },
        result: 'fires' as const,
        urgency: 'banked' as const,
        doneKey: next.rawName,
      },
    ];
  },
});
