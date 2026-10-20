// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-12, US-4: who is in the Lab. `first-upload`: nobody is, so nothing is lit; it names the bonus
// nearest the prism and how far it is (one fresh beam can't reach it, dossier C3/C34). `not-connected`:
// a character in a tube whose beam reaches neither the prism nor a connected character, with the pixels
// it is short (Toolbox lab.ts: strictly under its own Line Width).
import { z } from 'zod';
import {
  accountSubject,
  characterSubject,
  isKnown,
  LAB_PRISM,
  labDist,
  labGap,
  withAccount,
  withUnknown,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'lab/uploads',
  kind: 'check',
  system: 'lab',
  params: z.strictObject({ form: z.enum(['first-upload', 'not-connected']) }),
  slots: z.strictObject({ node: z.string(), distance: z.number(), gap: z.number() }).partial(),
  reads: ['account.lab', 'characters[*].index', 'diagnostics'],
  examples: {
    fires: [
      // first.json with nobody in the Lab: Animal Farm is the bonus nearest the prism.
      {
        fixture: 'first',
        params: { form: 'first-upload' },
        mutate: (s) =>
          s.account.lab
            ? withAccount(s, {
                lab: {
                  ...s.account.lab,
                  characters: s.account.lab.characters.map((c) => ({
                    ...c,
                    uploaded: false,
                    connected: false,
                  })),
                },
              })
            : s,
        expect: { slots: { node: 'Animal_Farm' } },
      },
      // first.json with one tube character moved off the board's beam.
      {
        fixture: 'first',
        params: { form: 'not-connected' },
        subject: characterSubject(1),
        mutate: (s) =>
          s.account.lab
            ? withAccount(s, {
                lab: {
                  ...s.account.lab,
                  characters: s.account.lab.characters.map((c) =>
                    c.index === 1 ? { ...c, connected: false, x: 600, y: 60 } : c,
                  ),
                },
              })
            : s,
      },
    ],
    silent: [
      { fixture: 'first', params: { form: 'first-upload' } },
      { fixture: 'first', params: { form: 'not-connected' } },
      { fixture: 'fourth', params: { form: 'not-connected' } },
    ],
    unknown: [
      { fixture: 'first', params: { form: 'first-upload' }, mutate: (s) => withUnknown(s, 'account.lab') },
    ],
  },
  run({ state }, { form }) {
    if (!isKnown(state, 'account.lab'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const lab = state.account.lab;
    if (!lab) return [];
    const mine = new Set(state.characters.map((c) => c.index));
    const chars = lab.characters.filter((c) => mine.has(c.index));
    if (form === 'first-upload') {
      if (chars.some((c) => c.uploaded)) return [];
      const nearest = [...lab.bonuses].sort(
        (a, b) => labDist(LAB_PRISM.x, LAB_PRISM.y, a.x, a.y) - labDist(LAB_PRISM.x, LAB_PRISM.y, b.x, b.y),
      )[0];
      if (!nearest) return [];
      return [
        {
          subject: accountSubject,
          slots: {
            node: nearest.name,
            distance: Math.round(labDist(LAB_PRISM.x, LAB_PRISM.y, nearest.x, nearest.y)),
          },
          result: 'fires' as const,
          doneKey: 'lab-first-upload',
        },
      ];
    }
    return chars.flatMap((c) => {
      if (!c.uploaded || c.connected) return [];
      const gap = labGap(lab, c.index);
      if (gap === null || gap <= 0) return [];
      return [
        {
          subject: characterSubject(c.index),
          slots: { gap },
          result: 'fires' as const,
          doneKey: `lab-gap-${c.index}`,
        },
      ];
    });
  },
});
