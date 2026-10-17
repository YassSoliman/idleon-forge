// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-17, D6: a skiller whose AFK Target's resource stack is at its carry cap (Toolbox
// getItemCapacity for the item's bag) with no free bag slot: every gain is lost now. Only this branch
// blocks until history gives a gather rate (D6); the rate branch is not built yet. The fix "Deposit to
// storage" is fillable only when storage has a free slot. A present-state Check.
import type { AccountState, CharacterAfkFacts } from '@idleon-forge/account-state';
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

const SKILLS = new Set(['MINING', 'CHOPPIN', 'FISHING', 'CATCHING']);

// US-7: the W2-late Squire (mining Copper) with its Copper at the carry cap and a full bag.
const fullBag = (s: AccountState, index: number): AccountState => {
  const c = s.characters.find((x) => x.index === index);
  const inv = c?.afk?.inventory;
  if (!c?.afk || !inv || !c.afkTarget) return s;
  const stacks = inv.stacks.map((x) =>
    x.item === c.afkTarget && x.cap !== null ? { ...x, amount: x.cap } : x,
  );
  const filler = Array.from({ length: Math.max(0, inv.totalSlots - stacks.length) }, (_, i) => ({
    item: `Filler${i}`,
    amount: 1,
    cap: null,
  }));
  const inventory: CharacterAfkFacts['inventory'] = {
    ...inv,
    stacks: [...stacks, ...filler],
    usedSlots: inv.totalSlots,
  };
  return withCharacter(s, index, { afk: { ...c.afk, inventory } });
};

export default defineDetector({
  id: 'afk/skiller-carry',
  kind: 'check',
  system: 'afk',
  params: z.strictObject({}),
  slots: z.strictObject({ item: z.string(), cap: z.number() }).partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].afkTarget',
    'characters[*].afk',
    'account.afk',
    'diagnostics',
  ],
  examples: {
    fires: [{ fixture: 'scrubbed-w2', subject: characterSubject(1), mutate: (s) => fullBag(s, 1) }],
    silent: [{ fixture: 'scrubbed-w2' }, { fixture: 'scrubbed-w3' }],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        mutate: (s) => withUnknown(fullBag(s, 1), 'characters[1].afk.inventory'),
      },
    ],
  },
  run({ state }) {
    const storageFree = state.account.afk?.storageFreeSlots ?? null;
    return state.characters.flatMap((c): CheckFinding[] => {
      if (!c.afkType || !SKILLS.has(c.afkType)) return [];
      const subject = characterSubject(c.index);
      const inv = c.afk?.inventory;
      if (!isKnown(state, `characters[${c.index}].afk.inventory`) || !inv)
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
      if (inv.usedSlots < inv.totalSlots) return [{ subject, slots: {}, result: 'pass' as const }];
      const stack = inv.stacks.find((x) => x.item === c.afkTarget);
      // Bag full and the target's stack unknown or not at cap: nothing provably lost.
      if (!stack || stack.cap === null || stack.amount < stack.cap)
        return [{ subject, slots: {}, result: 'pass' as const }];
      const fillable = storageFree !== null && storageFree > 0;
      return [
        {
          subject,
          slots: { item: stack.item, cap: stack.cap },
          result: 'fires' as const,
          fixHolds: fillable,
          ...(fillable ? {} : { demotedBecause: 'not-fillable' as const }),
        },
      ];
    });
  },
});
