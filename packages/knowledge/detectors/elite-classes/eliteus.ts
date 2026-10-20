// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-17, US-12: a character on one of the six subclasses Eliteus serves has not taken its elite. Step
// `gang` (the first quest, 10 Greenie Gang kills) or `pick` (one click at Eliteus); V8 and V44 settled the
// counter and the picker from the game client (account-state elite.ts). One finding per character; the
// Meta Path's elite Goal claims the same card (FR-5).
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

export default defineDetector({
  id: 'elite-classes/eliteus',
  kind: 'check',
  system: 'elite-classes',
  params: z.strictObject({}),
  slots: z
    .strictObject({
      elite: z.string(),
      class: z.string(),
      kills: z.number(),
      left: z.number(),
      pick: z.number(),
    })
    .partial(),
  reads: ['characters[*].index', 'characters[*].class', 'characters[*].eliteStep', 'diagnostics'],
  examples: {
    // first.json: every subclass already promoted, the Maestro is not on an Eliteus line.
    fires: [
      {
        fixture: 'first',
        subject: characterSubject(2),
        mutate: (s) =>
          withCharacter(s, 2, {
            class: 'Bowman',
            eliteStep: { step: 'gang', elite: 'Siege_Breaker', gangKills: 3 },
          }),
        expect: { slots: { elite: 'Siege_Breaker', class: 'Bowman', kills: 3, left: 7, pick: 0 } },
      },
      {
        fixture: 'first',
        subject: characterSubject(3),
        mutate: (s) =>
          withCharacter(s, 3, {
            class: 'Squire',
            eliteStep: { step: 'pick', elite: 'Divine_Knight', gangKills: null },
          }),
        expect: { slots: { pick: 1 } },
      },
    ],
    silent: [{ fixture: 'first' }, { fixture: 'highend' }, { fixture: 'fourth' }],
    unknown: [
      {
        fixture: 'first',
        subject: characterSubject(0),
        mutate: (s) => withUnknown(s, 'characters[0].eliteStep'),
      },
    ],
  },
  run({ state }) {
    return state.characters.flatMap((c): CheckFinding[] => {
      const subject = characterSubject(c.index);
      if (!isKnown(state, `characters[${c.index}].eliteStep`) || c.eliteStep === null)
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
      const e = c.eliteStep;
      if (!e || (e.step !== 'gang' && e.step !== 'pick') || !e.elite) return [];
      const kills = e.gangKills ?? 0;
      return [
        {
          subject,
          slots: {
            elite: e.elite,
            class: c.class,
            kills,
            left: Math.max(0, 10 - kills),
            pick: e.step === 'pick' ? 1 : 0,
          },
          result: 'fires' as const,
          doneKey: `eliteus-${c.index}`,
        },
      ];
    });
  },
});
