// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-24, TR-6: big-bubble slots. Silent when the account owns Sheepie ("all big bubbles count as
// equipped"); unknown without companion data. Otherwise each character has `bigBubbleSlots` slots
// (1, the "Changing the Code" bribe, Breeding arena wave 100). The character's candidates are its AFK
// Target's row of the pairing table, then the anvil row (Hammer Hammer), best first, unlocked and not
// already equipped. `fill`: one finding per empty slot a candidate can fill. `swap`: one finding per
// equipped big bubble that fits none of the character's uses while a candidate exists.
// The W3 skill row (Call Me Bob/Ash/Pope) needs M2's Roles, which no Detector reads yet: those bubbles
// are treated as fitting, so they are never swapped out. TODO(M2): add the Roles row.
import { z } from 'zod';
import { accountSubject, characterSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

/** The pairing table (M6 TR-4); identical to alchemy-bubbles/brew's. */
const PAIRING: Record<string, string[]> = {
  MINING: ['aUpgradesO3'], // Wyoming Blood
  FISHING: ['aUpgradesO6'], // Sploosh Sploosh
  CHOPPIN: ['aUpgradesP3'], // Molto Loggo
  CATCHING: ['aUpgradesG7'], // Bug²
  FIGHTING: ['aUpgradesY8', 'aUpgradesG18', 'aUpgradesY3', 'aUpgradesY12'], // Grind Time, Kill Per Kill, Level Up Gift, Big Game Hunter
  anvil: ['aUpgradesG2'], // Hammer Hammer
};
/** Call Me Bob, Call Me Ash, Call Me Pope: the W3 skill row, kept as always fitting (see above). */
const W3_SKILL_ROW = ['aUpgradesO11', 'aUpgradesG11', 'aUpgradesP11'];

export default defineDetector({
  id: 'alchemy-bubbles/big-bubbles',
  kind: 'check',
  system: 'alchemy-bubbles',
  params: z.strictObject({
    mode: z.enum(['fill', 'swap']),
    pairing: z.record(z.string(), z.array(z.string())).default(PAIRING),
  }),
  slots: z.strictObject({ bubble: z.string(), from: z.string(), empty: z.number() }).partial(),
  reads: [
    'account.alchemy',
    'account.bigBubbleSlots',
    'account.pets',
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].bigBubbles',
    'diagnostics',
  ],
  examples: {
    fires: [
      // W2-late: the Squire Lv 43 (Mining Copper) gets Wyoming Blood.
      {
        fixture: 'scrubbed-w2',
        params: { mode: 'fill' },
        subject: characterSubject(1),
        expect: { slots: { bubble: 'WYOMING_BLOOD' } },
      },
      // W3-early: the Shaman Lv 54 has 2 empty slots: Level Up Gift and Hammer Hammer.
      {
        fixture: 'scrubbed-w3',
        params: { mode: 'fill' },
        subject: characterSubject(5),
        expect: { slots: { bubble: 'HAMMER_HAMMER' } },
      },
      // W3-early: the Wizard Lv 73 fights with Molto Loggo equipped.
      {
        fixture: 'scrubbed-w3',
        params: { mode: 'swap' },
        subject: characterSubject(0),
        expect: { slots: { from: 'MOLTO_LOGGO', bubble: 'HAMMER_HAMMER' } },
      },
    ],
    silent: [
      // W2-late: the fighters have no fighting big bubble unlocked yet.
      { fixture: 'scrubbed-w2', params: { mode: 'fill' }, subject: characterSubject(0) },
      // W3-early: the Barbarian Lv 56 fishes with Sploosh Sploosh and Hammer Hammer.
      { fixture: 'scrubbed-w3', params: { mode: 'fill' }, subject: characterSubject(4) },
      { fixture: 'scrubbed-w3', params: { mode: 'swap' }, subject: characterSubject(4) },
      // Sheepie owned: every big bubble counts as equipped.
      {
        fixture: 'scrubbed-w3',
        params: { mode: 'fill' },
        mutate: (s) => withAccount(s, { pets: s.account.pets && { ...s.account.pets, sheepie: true } }),
      },
      // W3-early: the Squire Lv 51 mines with Wyoming Blood and Hammer Hammer.
      { fixture: 'scrubbed-w3', params: { mode: 'swap' }, subject: characterSubject(1) },
    ],
    unknown: [
      { fixture: 'scrubbed-w3', params: { mode: 'fill' }, mutate: (s) => withAccount(s, { pets: null }) },
    ],
  },
  run({ state }, { mode, pairing }) {
    const { alchemy, bigBubbleSlots, pets } = state.account;
    const known =
      isKnown(state, 'account.alchemy') &&
      isKnown(state, 'account.bigBubbleSlots') &&
      isKnown(state, 'account.pets') &&
      alchemy != null &&
      bigBubbleSlots != null &&
      pets != null;
    if (!known)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    if (pets.sheepie) return [];
    const names = new Map(alchemy.unlockedBubbles.map((b) => [b.rawName, b.name]));
    const out = [];
    for (const c of state.characters) {
      if (!isKnown(state, `characters[${c.index}].bigBubbles`) || c.afkType == null) continue;
      const slots = (c.bigBubbles ?? []).slice(0, bigBubbleSlots);
      while (slots.length < bigBubbleSlots) slots.push(null);
      const equipped = slots.filter((b): b is string => b != null);
      const uses = [...(pairing[c.afkType] ?? []), ...(pairing.anvil ?? [])];
      const candidates = uses.filter((r) => names.has(r) && !equipped.includes(r));
      if (mode === 'fill') {
        const empty = slots.length - equipped.length;
        for (const r of candidates.slice(0, empty))
          out.push({
            subject: characterSubject(c.index),
            slots: { bubble: names.get(r) as string, empty },
            result: 'fires' as const,
            urgency: 'banked' as const,
            doneKey: `fill:${r}`,
          });
      } else {
        const wrong = equipped.filter((r) => !uses.includes(r) && !W3_SKILL_ROW.includes(r) && names.has(r));
        wrong.forEach((from, i) => {
          const to = candidates[i];
          if (!to) return;
          out.push({
            subject: characterSubject(c.index),
            slots: { from: names.get(from) as string, bubble: names.get(to) as string },
            result: 'fires' as const,
            urgency: 'banked' as const,
            doneKey: `swap:${from}:${to}`,
          });
        });
      }
    }
    return out;
  },
});
