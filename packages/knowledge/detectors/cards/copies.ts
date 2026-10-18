// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4: the progress of a generated card ladder (`cards.goal.<card>`): copies of the card the account
// holds. A card the account has never found is 0 copies (Toolbox lists only found cards).
import { z } from 'zod';
import { accountSubject, isKnown, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'cards/copies',
  kind: 'progress',
  system: 'cards',
  params: z.strictObject({ card: z.string().min(1) }),
  slots: z.strictObject({}),
  reads: ['account.cards', 'diagnostics'],
  examples: {
    // W2-late: 1 Poop card (M4 US-3); the W3-early account has 0 Thermostat cards (US-6).
    fires: [
      { fixture: 'scrubbed-w2', params: { card: 'poopSmall' }, expect: { value: 1 } },
      { fixture: 'scrubbed-w3', params: { card: 'thermostat' }, expect: { value: 0 } },
    ],
    silent: [],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        params: { card: 'poopSmall' },
        mutate: (s) => withUnknown(s, 'account.cards'),
      },
    ],
  },
  run({ state }, { card }) {
    const cards = state.account.cards;
    if (!isKnown(state, 'account.cards') || !cards)
      return [{ subject: accountSubject, slots: {}, value: null, reason: 'field-missing' as const }];
    return [{ subject: accountSubject, slots: {}, value: cards[card]?.amount ?? 0 }];
  },
});
