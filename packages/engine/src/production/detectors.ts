// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C's engine Detectors (section 10, M11 TR-4 `kind: 'engine'`), behind the Detector contract so
// `kb check` runs their examples on the scrubbed saves and records what they read. The rows, the ranking
// and the Walkthrough are built by the engine module (module.ts), which also reads the Gear Plan, the
// shown Walkthroughs and the Knowledge Base's facts; these return the save-only parts.
import { defineDetector } from '@idleon-forge/knowledge';
import { z } from 'zod';

const slots = z.strictObject({ text: z.string(), why: z.string() });

/** What each anvil makes (FR-C7): the anvils whose hammers the save holds. */
export const productionAnvilDetector = defineDetector({
  id: 'production-plan/anvil',
  kind: 'engine',
  system: 'production-plan',
  params: z.strictObject({}),
  slots,
  reads: ['characters[*].anvil', 'characters[*].anvilSpeed', 'characters[*].smithingLevel'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { anvils: 6 } }],
    silent: [
      {
        fixture: 'scrubbed-w2',
        mutate: (s) => ({ ...s, characters: s.characters.map((c) => ({ ...c, anvil: null })) }),
      },
    ],
  },
  // The product table is 'production-plan.fact.anvil-exp'; the recipe table 'anvil.fact.recipes'.
  run: ({ state }) => {
    const n = state.characters.filter((c) => c.anvil && c.anvil.hammers.length > 0).length;
    return n > 0 ? [{ anvils: n }] : [];
  },
});

/** A free hammer (FR-C4): a -1 entry in the raw hammer list. */
export const anvilHammersDetector = defineDetector({
  id: 'anvil/hammers',
  kind: 'engine',
  system: 'anvil',
  params: z.strictObject({}),
  slots,
  reads: ['characters[*].anvil'],
  examples: {
    fires: [
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => ({
          ...s,
          characters: s.characters.map((c, i) =>
            i === 0 && c.anvil
              ? { ...c, anvil: { ...c.anvil, hammers: [...c.anvil.hammers.slice(1), -1] } }
              : c,
          ),
        }),
        expect: { free: 1 },
      },
    ],
    silent: [
      {
        fixture: 'scrubbed-w2',
        mutate: (s) => ({ ...s, characters: s.characters.map((c) => ({ ...c, anvil: null })) }),
      },
    ],
  },
  run: ({ state }) => {
    const free = state.characters.filter((c) => (c.anvil?.hammers ?? []).includes(-1)).length;
    return free > 0 ? [{ free }] : [];
  },
});

/** The next anvil tab (FR-C4): a tab below Tab 5 not owned yet. */
export const anvilNextTabDetector = defineDetector({
  id: 'anvil/next-tab',
  kind: 'engine',
  system: 'anvil',
  params: z.strictObject({}),
  slots,
  reads: ['account.anvilTabsOwned', 'account.storageItems', 'characters[*].smithingLevel'],
  examples: {
    fires: [
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => ({ ...s, account: { ...s.account, anvilTabsOwned: 2 } }),
        expect: { tab: 3 },
      },
    ],
    silent: [
      {
        fixture: 'scrubbed-w2',
        mutate: (s) => ({ ...s, account: { ...s.account, anvilTabsOwned: 4 } }),
      },
    ],
  },
  // The tab items are 'items.acquisition.equipment-smithing-tabs3' and '...-tabs4' (expand.ts).
  run: ({ state }) => {
    const owned = state.account.anvilTabsOwned;
    if (owned === null || owned === undefined || owned >= 4) return [];
    return [{ tab: owned + 1 }];
  },
});

/** Craft next (FR-C10): characters with a Gear Plan to judge and a recipe table to read. */
export const craftNextDetector = defineDetector({
  id: 'gear/craft-next',
  kind: 'engine',
  system: 'gear',
  params: z.strictObject({}),
  slots,
  reads: ['characters[*].gear', 'account.anvilRecipes', 'account.anvilTabsOwned', 'account.storageItems'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { characters: 6 } }],
    silent: [
      {
        fixture: 'scrubbed-w2',
        mutate: (s) => ({ ...s, characters: s.characters.map((c) => ({ ...c, gear: null })) }),
      },
    ],
  },
  // The recipe table 'anvil.fact.recipes' and the Gear Plan 'gear.fact.plan' are read by the module.
  run: ({ state }) => {
    const n = state.characters.filter((c) => c.gear).length;
    return n > 0 && state.account.anvilRecipes ? [{ characters: n }] : [];
  },
});
