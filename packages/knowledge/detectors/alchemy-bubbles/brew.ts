// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-16, TR-6: brew banked in the cauldrons. Each cauldron whose Toolbox `expectedBubbles` is at
// least 1 counts in one Account finding; the slot is the rounded sum over those cauldrons. When a
// firing cauldron's next bubble is a big bubble from the pairing table (the same table the big-bubble
// Check uses), the finding names it and how many characters it fits.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

/**
 * The big-bubble pairing table (M6 TR-4, confidence M): AFK type -> big bubbles whose own game text
 * names it, best first, by rawName. `anvil` is every character (each has an anvil product). Shared
 * with alchemy-bubbles/big-bubbles, which keeps an identical copy (Detectors can't import each other);
 * an entry may override it in its params.
 */
const PAIRING: Record<string, string[]> = {
  MINING: ['aUpgradesO3'], // Wyoming Blood
  FISHING: ['aUpgradesO6'], // Sploosh Sploosh
  CHOPPIN: ['aUpgradesP3'], // Molto Loggo
  CATCHING: ['aUpgradesG7'], // Bug²
  FIGHTING: ['aUpgradesY8', 'aUpgradesG18', 'aUpgradesY3', 'aUpgradesY12'], // Grind Time, Kill Per Kill, Level Up Gift, Big Game Hunter
  anvil: ['aUpgradesG2'], // Hammer Hammer
};
const Pairing = z.record(z.string(), z.array(z.string()));

export default defineDetector({
  id: 'alchemy-bubbles/brew',
  kind: 'check',
  system: 'alchemy-bubbles',
  params: z.strictObject({
    minExpected: z.number().positive().default(1),
    /** 'plain' fires when no firing cauldron's next bubble is a fitting big bubble; 'big' only when one is. */
    variant: z.enum(['plain', 'big']).default('plain'),
    pairing: Pairing.default(PAIRING),
  }),
  slots: z
    .strictObject({ bubbles: z.number(), cauldrons: z.number(), bigBubble: z.string(), bigFits: z.number() })
    .partial(),
  reads: ['account.alchemy', 'characters[*].afkType', 'characters[*].index', 'diagnostics'],
  examples: {
    fires: [
      // W2-late: Quicc, High-IQ and Kazam, about 10 new bubbles (Power is under 1); Kazam's next
      // bubble, Level Up Gift, is a big bubble for the 4 fighters.
      {
        fixture: 'scrubbed-w2',
        params: { variant: 'big' },
        expect: { slots: { bubbles: 10, cauldrons: 3, bigBubble: 'LEVEL_UP_GIFT', bigFits: 4 } },
      },
      // W3-early: all 4 cauldrons, about 7, and no big bubble next.
      { fixture: 'scrubbed-w3', expect: { slots: { bubbles: 7, cauldrons: 4 } } },
    ],
    silent: [
      { fixture: 'scrubbed-w2' },
      { fixture: 'scrubbed-w3', params: { variant: 'big' } },
      {
        fixture: 'scrubbed-w2',
        mutate: (s) =>
          withAccount(s, {
            alchemy: s.account.alchemy && {
              ...s.account.alchemy,
              cauldrons: s.account.alchemy.cauldrons.map((c) => ({ ...c, expectedNewBubbles: 0.5 })),
            },
          }),
      },
    ],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withAccount(s, { alchemy: null }) }],
  },
  run({ state }, { minExpected, variant, pairing }) {
    const alchemy = state.account.alchemy;
    if (!isKnown(state, 'account.alchemy') || alchemy === null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const firing = alchemy.cauldrons.filter((c) => c.expectedNewBubbles >= minExpected);
    if (firing.length === 0) return [];
    const bubbles = Math.round(firing.reduce((s, c) => s + c.expectedNewBubbles, 0));
    const slots: { bubbles: number; cauldrons: number; bigBubble?: string; bigFits?: number } = {
      bubbles,
      cauldrons: firing.length,
    };
    // The first firing cauldron whose next bubble fits an AFK Target in use on the account (FR-16). Only
    // AFK-type rows count: the `anvil` row (Hammer Hammer) matches no AFK type, by design.
    for (const c of firing) {
      const next = c.nextBubble;
      if (!next) continue;
      const types = Object.entries(pairing)
        .filter(([, raws]) => raws.includes(next.rawName))
        .map(([type]) => type);
      const fits = state.characters.filter((ch) => ch.afkType !== null && types.includes(ch.afkType)).length;
      if (fits > 0) {
        slots.bigBubble = next.name;
        slots.bigFits = fits;
        break;
      }
    }
    if ((variant === 'big') !== (slots.bigBubble !== undefined)) return [];
    return [
      {
        subject: accountSubject,
        slots,
        result: 'fires' as const,
        urgency: 'banked' as const,
        doneKey: firing.map((c) => c.id).join(','),
      },
    ];
  },
});
