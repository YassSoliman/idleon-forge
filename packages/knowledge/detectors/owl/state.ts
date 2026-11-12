// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-51: Orion the Great Horned Owl, one part per Check entry (account findings only).
// - `start`: Orion has never run (no feathers held or made, no Megafeather, no Bonuses of Orion).
// - `mega-reset`: The Great Mega Reset is open (feathers this run past 100B) and the feathers held pay for it
//   (Toolbox's megaFeatherRestart alert). There is no Megafeather cap: saves past 12 and up to 37 exist.
// - `restart`: Feather Restart is open (past 750K this run) and affordable, and no Mega Reset is (Toolbox's
//   featherRestart alert, using the upgrade's own unlock rather than the alert's off-by-one gate).
// - `bonuses`: Bonuses of Orion is affordable and neither reset is (then it is their first step instead,
//   the `bonus` slot): it is the one upgrade that never resets.
import { z } from 'zod';
import {
  accountSubject,
  isKnown,
  OWL,
  owlAffordable,
  owlNextBonus,
  owlNotStarted,
  owlRestartFactor,
  withAccount,
  withUnknown,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'owl/state',
  kind: 'check',
  system: 'owl',
  params: z.strictObject({ part: z.enum(['start', 'restart', 'mega-reset', 'bonuses']) }),
  slots: z
    .strictObject({
      next: z.number(),
      per: z.number(),
      level: z.number(),
      delta: z.number(),
      feathers: z.number(),
      cost: z.number(),
      first: z.number(),
      st0: z.number(),
      st1: z.number(),
      st2: z.number(),
      st3: z.number(),
      st4: z.number(),
      st5: z.number(),
      mf1: z.number(),
      mf2: z.number(),
      mf3: z.number(),
      mf4: z.number(),
      mf5: z.number(),
      mf6: z.number(),
      mf7: z.number(),
      mf8: z.number(),
      mf9: z.number(),
      mf10: z.number(),
    })
    .partial(),
  reads: ['account.owl', 'diagnostics'],
  examples: {
    fires: [
      // A new account today: Orion's slots are there and all 0.
      { fixture: 'fresh', params: { part: 'start' } },
      // The W2 test account (scrubbed) holds 5.6e28 feathers at 12 Megafeathers: the 13th is affordable.
      { fixture: 'scrubbed-w2', params: { part: 'mega-reset' }, expect: { slots: { next: 13 } } },
      {
        fixture: 'highend',
        params: { part: 'restart' },
        mutate: (s) =>
          s.account.owl
            ? withAccount(s, {
                owl: { ...s.account.owl, feathers: (s.account.owl.upgrades[OWL.restart]?.cost ?? 0) * 2 },
              })
            : s,
        expect: { slots: { next: 47, per: 5 } },
      },
      {
        fixture: 'highend',
        params: { part: 'bonuses' },
        mutate: (s) =>
          s.account.owl
            ? withAccount(s, {
                owl: {
                  ...s.account.owl,
                  feathers: s.account.owl.upgrades[OWL.bonuses]?.cost ?? 0,
                  // Neither reset open: Bonuses of Orion is then the card itself.
                  upgrades: s.account.owl.upgrades.map((u) =>
                    u.index === OWL.restart || u.index === OWL.megaReset ? { ...u, unlocked: false } : u,
                  ),
                },
              })
            : s,
        expect: { slots: { level: 42 } },
      },
    ],
    silent: [
      // first.json predates Orion (no slots 263-264): no Owl, nothing to say.
      { fixture: 'first', params: { part: 'start' } },
      { fixture: 'highend', params: { part: 'start' } },
      { fixture: 'highend', params: { part: 'restart' } },
      { fixture: 'highend', params: { part: 'mega-reset' } },
      // The mega reset is affordable there, so Bonuses of Orion is its first step, not a card of its own.
      { fixture: 'scrubbed-w2', params: { part: 'bonuses' } },
    ],
    unknown: [
      { fixture: 'highend', params: { part: 'start' }, mutate: (s) => withUnknown(s, 'account.owl') },
    ],
  },
  run({ state }, { part }) {
    if (!isKnown(state, 'account.owl'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const o = state.account.owl;
    if (!o) return [];
    const fire = (slots: Record<string, number>, doneKey: string) => [
      { subject: accountSubject, slots, result: 'fires' as const, urgency: 'banked' as const, doneKey },
    ];
    if (part === 'start') return owlNotStarted(o) ? fire({}, 'owl-start') : [];
    const mega = owlAffordable(o, OWL.megaReset);
    const restart = !mega && owlAffordable(o, OWL.restart);
    const next = owlNextBonus(o);
    const bonusReady = owlAffordable(o, OWL.bonuses) && next !== null;
    // Flags pick the entry's words: `st<offset>` the stat the next level raises, `mf<n>` the next Megafeather.
    const stat = (b: NonNullable<typeof next>) => ({ [`st${b.offset}`]: 1, delta: b.delta });
    const bonusSlots = bonusReady && next ? { ...stat(next), level: o.bonusesLevel + 1, first: 1 } : {};
    if (part === 'mega-reset') {
      if (!mega) return [];
      const n = o.megafeathers + 1;
      return fire(
        { next: n, ...(n <= 10 ? { [`mf${n}`]: 1 } : {}), feathers: o.feathers, ...bonusSlots },
        `owl-mega-${n}`,
      );
    }
    if (part === 'restart') {
      if (!restart) return [];
      const n = o.restarts + 1;
      return fire(
        { next: n, per: owlRestartFactor(o), feathers: o.feathers, ...bonusSlots },
        `owl-restart-${o.megafeathers}-${n}`,
      );
    }
    if (mega || restart || !bonusReady || !next) return [];
    const cost = o.upgrades[OWL.bonuses]?.cost ?? 0;
    return fire(
      { level: o.bonusesLevel + 1, ...stat(next), cost, feathers: o.feathers },
      `owl-bonuses-${o.bonusesLevel + 1}`,
    );
  },
});
