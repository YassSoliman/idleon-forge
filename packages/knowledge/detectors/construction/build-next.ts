// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 F2 (FR-7 to FR-13, TR-7): one Construction building at a time. Walks `construction.fact.build-order`
// (TR-6) over the Stage parts in `parts` and takes the first item below its target level whose salt is
// unlocked, skipping the Death Note at Lv 0 (M6's `death-note.check.build`, FR-12). Its Next Action is
// the first FR-9 step that applies, one form flag each (the entry's `text-<form>` variants):
//   1 `collect`: bar full, some of its salt sits in the Refinery's storage, which never pays a building
//     (the level-up reads inventory and the chest, N.js @8779435);
//   2 bar full and the salt is not running: M6's `refinery.check.salt-off` / `salt-fuel` owns it, no Goal;
//   3 `pay` / `payTimed`: bar full and the salt runs; timed only with Auto Refine off (FR-2a), the amount
//     due is the game's and never stated (D-1);
//   4 `slot`: not in a build slot and a slot is empty;  5 `swap`: every slot busy, swap out the
//     lowest-listed slot holder that is not an earlier item and has no full bar;
//   6 in a slot and building: no Goal; when a slot is empty the next unslotted item takes it (FR-11),
//     else a `pass` whose `nextChangeAt` is when its bar fills, (buildCost − progress) ÷ totalBuildRate.
import type { AccountState, ConstructionBuilding } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

const ORDER = 'construction.fact.build-order';
const DEATH_NOTE = 'Death_Note';

interface OrderItem {
  building: string;
  target: number | 'characters';
}

/** W3-early with the 3D Printer's payment due and its Redox Salts moved out of the Refinery storage. */
const redoxInChest = (s: AccountState, n: number): AccountState =>
  withAccount(s, {
    refineryStorage: { ...(s.account.refineryStorage ?? {}), Refinery1: 0 },
    storageItems: { ...(s.account.storageItems ?? {}), Refinery1: n },
  });

const edit = (s: AccountState, f: (b: ConstructionBuilding) => ConstructionBuilding): AccountState => {
  const c = s.account.construction;
  return withAccount(s, { construction: c && { ...c, buildings: c.buildings.map(f) } });
};

/** US-2: the 3D Printer at Lv 6 and out of its slot, so slot 1 is empty and the Salt Lick is next. */
const printerDone = (s: AccountState): AccountState => {
  const out = edit(s, (b) =>
    b.rawName === '3D_Printer' ? { ...b, level: 6, progress: 0, inSlot: false, bodyFull: false } : b,
  );
  const c = out.account.construction;
  return withAccount(out, { construction: c && { ...c, buildSlots: [2, null] } });
};

export default defineDetector({
  id: 'construction/build-next',
  kind: 'check',
  system: 'construction',
  params: z.strictObject({
    /** The Stage parts of the build order to walk, in order (FR-8: the current Stage, then the next). */
    parts: z.array(z.string()).min(1).default(['W3-early']),
    minWorld: z.int().min(1).default(3),
  }),
  slots: z
    .strictObject({
      building: z.string(),
      salt: z.string(),
      held: z.number(),
      fullIn: z.number(),
      holder: z.string(),
      then1: z.string(),
      then1Level: z.number(),
      then2: z.string(),
      then2Level: z.number(),
      thenOne: z.number(),
      thenNone: z.number(),
      slotSaltOff: z.number(),
      collect: z.number(),
      pay: z.number(),
      payTimed: z.number(),
      slot: z.number(),
      swap: z.number(),
      saltOff: z.number(),
    })
    .partial(),
  reads: [
    'account.construction',
    'account.refinery',
    'account.refineryStorage',
    'account.storageItems',
    'account.currentWorld',
    'characters',
    'diagnostics',
  ],
  examples: {
    fires: [
      // US-2: the 3D Printer (Lv 4, target 6) is built and waiting; 8 Redox Salts sit in the Refinery.
      {
        fixture: 'scrubbed-w3',
        subject: accountSubject,
        expect: {
          slots: {
            building: '3D_Printer',
            salt: 'Redox_Salts',
            collect: 1,
            then1: 'Salt_Lick',
            then1Level: 1,
            then2: 'Talent_Book_Library',
            then2Level: 2,
          },
        },
      },
      // US-2: 17 Redox Salts in the chest and none in the Refinery: pay in the Build menu, untimed (Auto Refine on).
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => redoxInChest(s, 17),
        expect: { slots: { building: '3D_Printer', pay: 1, held: 17 } },
      },
      // US-2: the Printer done, a slot empty: put the Salt Lick in it; its Explosive Salt is not running.
      {
        fixture: 'scrubbed-w3',
        mutate: printerDone,
        expect: { slots: { building: 'Salt_Lick', slot: 1, slotSaltOff: 1, salt: 'Explosive_Salts' } },
      },
    ],
    silent: [
      // W2-late: no buildings, the account is not in World 3.
      { fixture: 'scrubbed-w2' },
      // The Printer building in its slot (bar not full) and no empty slot: a pass, no Goal.
      {
        fixture: 'scrubbed-w3',
        mutate: (s) =>
          edit(s, (b) => (b.rawName === '3D_Printer' ? { ...b, progress: 0, bodyFull: false } : b)),
      },
    ],
    unknown: [{ fixture: 'scrubbed-w3', mutate: (s) => withAccount(s, { construction: null }) }],
  },
  run({ state, facts, now }, { parts, minWorld }) {
    const { construction, refinery, refineryStorage, storageItems, currentWorld } = state.account;
    const subject = accountSubject;
    const unknown = [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
    const known =
      isKnown(state, 'account.construction') &&
      isKnown(state, 'account.refinery') &&
      isKnown(state, 'account.refineryStorage') &&
      isKnown(state, 'account.storageItems');
    if (!known || !construction || !refinery || !refineryStorage || !storageItems || currentWorld == null)
      return unknown;
    if (currentWorld < minWorld) return [];
    const table = facts.get(ORDER) as { rows?: Record<string, OrderItem[]> } | undefined;
    const order = parts.flatMap((p) => table?.rows?.[p] ?? []);
    const byName = new Map(construction.buildings.map((b) => [b.rawName, b]));
    const saltOf = new Map(refinery.salts.map((s) => [s.rawName, s]));
    const characters = state.characters.length;

    // TR-7: the remaining items, in list order, each with its capped target.
    const remaining = order.flatMap((item) => {
      const b = byName.get(item.building);
      if (!b) return [];
      const target = Math.min(item.target === 'characters' ? characters : item.target, b.maxLevel);
      if (b.level >= target) return [];
      if (!saltOf.get(b.saltRawName)?.unlocked) return [];
      if (b.rawName === DEATH_NOTE && b.level === 0) return [];
      return [{ b, target }];
    });
    const first = remaining[0];
    if (!first) return [{ subject, slots: {}, result: 'pass' as const }];

    // The next two items, as lookup slots (no free-text string slots, M11 FR-27).
    const thenOf = (after: typeof remaining): Record<string, number | string> => {
      const [a, b] = after;
      if (!a) return { thenNone: 1 };
      const one = { then1: a.b.rawName, then1Level: a.target };
      return b ? { ...one, then2: b.b.rawName, then2Level: b.target } : { ...one, thenOne: 1 };
    };
    const fires = (
      b: ConstructionBuilding,
      form: Record<string, number>,
      extra: Record<string, number | string> = {},
    ) => {
      const salt = saltOf.get(b.saltRawName);
      const idx = remaining.findIndex((r) => r.b.rawName === b.rawName);
      return [
        {
          subject,
          slots: {
            building: b.rawName,
            salt: salt?.name || b.saltRawName,
            ...thenOf(remaining.slice(idx + 1)),
            ...(salt && !salt.active ? { saltOff: 1 } : {}),
            ...(salt && !salt.active && form.slot === 1 ? { slotSaltOff: 1 } : {}),
            ...form,
            ...extra,
          },
          result: 'fires' as const,
          urgency: 'banked' as const,
          doneKey: `${b.rawName}@${b.level}`,
        },
      ];
    };

    const { b } = first;
    const salt = saltOf.get(b.saltRawName);
    if (b.bodyFull) {
      if ((refineryStorage[b.saltRawName] ?? 0) > 0) return fires(b, { collect: 1 });
      if (!salt?.active) return [{ subject, slots: {}, result: 'pass' as const }]; // step 2: M6's Goal
      const held = storageItems[b.saltRawName] ?? 0;
      if (!salt.autoRefine && salt.fullInSeconds !== null && salt.fullInSeconds > 0)
        return fires(b, { payTimed: 1 }, { held, fullIn: salt.fullInSeconds * 1000 });
      return fires(b, { pay: 1 }, { held });
    }
    const empty = construction.buildSlots.some((x) => x === null);
    if (!b.inSlot) {
      if (empty) return fires(b, { slot: 1 });
      // Never swap out an earlier list item (the Death Note M6 is building, say).
      const at = order.findIndex((o) => o.building === b.rawName);
      const earlier = new Set(order.slice(0, at).flatMap((o) => byName.get(o.building)?.index ?? []));
      const rank = (index: number) => {
        const i = order.findIndex((o) => byName.get(o.building)?.index === index);
        return i < 0 ? Number.POSITIVE_INFINITY : i;
      };
      const holders = construction.buildSlots
        .filter((x): x is number => x !== null && !earlier.has(x))
        .map((x) => construction.buildings.find((y) => y.index === x))
        .filter((y): y is ConstructionBuilding => !!y && !y.bodyFull)
        .sort((p, q) => rank(q.index) - rank(p.index) || q.index - p.index);
      const holder = holders[0];
      if (!holder) return [{ subject, slots: {}, result: 'pass' as const }];
      return fires(b, { swap: 1 }, { holder: holder.rawName });
    }
    // Step 6: building. FR-11: an empty slot takes the next unslotted item.
    if (empty) {
      const nextFree = remaining.slice(1).find((r) => !r.b.inSlot && !r.b.bodyFull);
      if (nextFree) return fires(nextFree.b, { slot: 1 });
    }
    const rate = construction.totalBuildRate;
    return [
      {
        subject,
        slots: {},
        result: 'pass' as const,
        ...(rate > 0
          ? { nextChangeAt: now + Math.max(0, (b.buildCost - b.progress) / rate) * 3_600_000 }
          : {}),
      },
    ];
  },
});
