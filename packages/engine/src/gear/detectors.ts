// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18's engine Detectors (TR-4, M11 TR-4 `kind: 'engine'`), behind the Detector contract so `kb check`
// runs their examples on the scrubbed saves and records what they read. The Goals, Walkthrough roots and
// views are built by the engine module (build.ts), which also reads M2's Stage and pusher and the
// Knowledge Base's gear facts; these return the save-only parts.
import { GEAR_SLOTS } from '@idleon-forge/account-state';
import { defineDetector } from '@idleon-forge/knowledge';
import { z } from 'zod';
import { afkToolSlot } from './judge';

const slots = z.strictObject({ text: z.string(), why: z.string() });
const EQUIPMENT = 8;

export const gearSlotsDetector = defineDetector({
  id: 'gear/slots',
  kind: 'engine',
  system: 'gear',
  params: z.strictObject({ part: z.enum(['held', 'empty', 'afk-tool']).default('empty') }),
  slots,
  reads: [
    'characters[*].gear',
    'account.gearItems',
    'account.storageItems',
    'characters[*].inventoryItems',
    'characters[*].afkType',
  ],
  examples: {
    fires: [
      { fixture: 'scrubbed-w3', params: { part: 'empty' }, expect: { empty: 11 } },
      { fixture: 'scrubbed-w3', params: { part: 'afk-tool' }, expect: { without: 1 } },
    ],
    silent: [
      {
        fixture: 'scrubbed-w2',
        params: { part: 'afk-tool' },
        mutate: (s) => ({ ...s, characters: s.characters.map((c) => ({ ...c, afkType: 'FIGHTING' })) }),
      },
    ],
  },
  run: ({ state }, params) => {
    const known = state.characters.filter((c) => c.gear);
    if (known.length === 0) return [];
    if (params.part === 'afk-tool') {
      const without = known.filter((c) => {
        const slot = afkToolSlot(c);
        return slot !== null && (c.gear ?? [])[GEAR_SLOTS.indexOf(slot)] === null;
      }).length;
      return without > 0 ? [{ without }] : [];
    }
    const empty = known.reduce(
      (n, c) => n + (c.gear ?? []).slice(0, EQUIPMENT).filter((w) => w === null).length,
      0,
    );
    if (params.part === 'empty') return empty > 0 ? [{ empty }] : [];
    const held = Object.keys(state.account.gearItems ?? {}).filter(
      (r) => (state.account.storageItems?.[r] ?? 0) > 0,
    ).length;
    return held > 0 && empty > 0 ? [{ held, empty }] : [];
  },
});

export const gearPlanDetector = defineDetector({
  id: 'gear/plan',
  kind: 'engine',
  system: 'gear',
  params: z.strictObject({}),
  slots,
  reads: ['characters[*].gear', 'account.anvilRecipes', 'account.anvilTabsOwned', 'account.taskUnlocks'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { characters: 6 } }],
    silent: [
      {
        fixture: 'scrubbed-w2',
        mutate: (s) => ({ ...s, characters: s.characters.map((c) => ({ ...c, gear: null })) }),
      },
    ],
  },
  // The Gear Plan ('gear.fact.plan'), the ladder ('gear.fact.ladder') and the recipes ('gear.fact.recipes')
  // are read by the module; here, whether there is gear to judge.
  run: ({ state }) => {
    const n = state.characters.filter((c) => c.gear).length;
    return n > 0 && state.account.anvilRecipes ? [{ characters: n }] : [];
  },
});

export const armorSmithyDetector = defineDetector({
  id: 'armor-smithy/state',
  kind: 'engine',
  system: 'armor-smithy',
  params: z.strictObject({ part: z.enum(['hire', 'register']).default('hire') }),
  slots,
  reads: ['account.armorSmithy', 'characters[*].gear'],
  examples: {
    fires: [
      {
        fixture: 'scrubbed-w3',
        params: { part: 'hire' },
        mutate: (s) => ({
          ...s,
          account: {
            ...s.account,
            armorSmithy: s.account.armorSmithy && { ...s.account.armorSmithy, canHire: true },
          },
        }),
        expect: { canHire: true },
      },
    ],
    silent: [
      { fixture: 'scrubbed-w3', params: { part: 'hire' } },
      { fixture: 'scrubbed-w2', params: { part: 'register' } },
    ],
  },
  // The sets and their parts are 'armor-smithy.fact.sets'.
  run: ({ state }, params) => {
    const s = state.account.armorSmithy;
    if (!s) return [];
    if (params.part === 'hire') return s.canHire && !s.hired ? [{ canHire: true }] : [];
    return s.hired ? [{ registered: s.registered.length }] : [];
  },
});
