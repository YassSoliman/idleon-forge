// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19's engine Detectors (TR-4, M11 TR-4 `kind: 'engine'`), behind the Detector contract so `kb check`
// runs their examples on the scrubbed saves and records what they read. The Goals are built by the
// engine module (module.ts), which also needs Toolbox's cost function and M2's Stage; these return the
// save-only parts.
import { defineDetector } from '@idleon-forge/knowledge';
import { z } from 'zod';
import { playerBehind } from './p2w';

const slots = z.strictObject({ text: z.string(), why: z.string() });
const none = z.strictObject({});

export const planDetector = defineDetector({
  id: 'alchemy/plan',
  kind: 'engine',
  system: 'alchemy',
  params: none,
  slots,
  reads: ['account.alchemyPlan', 'account.alchemy', 'account.liquids', 'account.storageItems'],
  examples: {
    fires: [{ fixture: 'scrubbed-w2', expect: { unlocked: 13 } }],
    silent: [
      { fixture: 'scrubbed-w2', mutate: (s) => ({ ...s, account: { ...s.account, currentWorld: 1 } }) },
    ],
  },
  run: ({ state }) => {
    const a = state.account;
    if ((a.currentWorld ?? 0) < 2 || !a.alchemy || !a.alchemyPlan) return [];
    return [{ unlocked: a.alchemy.cauldrons.reduce((n, c) => n + c.unlockedBubbles, 0) }];
  },
});

export const vialsDetector = defineDetector({
  id: 'alchemy/vials',
  kind: 'engine',
  system: 'alchemy',
  params: none,
  slots,
  reads: ['account.alchemyPlan', 'account.storageItems', 'account.liquids'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { unlocked: 15 } }],
    silent: [
      { fixture: 'scrubbed-w3', mutate: (s) => ({ ...s, account: { ...s.account, currentWorld: 1 } }) },
    ],
  },
  run: ({ state }) => {
    const p = state.account.alchemyPlan;
    if ((state.account.currentWorld ?? 0) < 2 || !p) return [];
    return [{ unlocked: p.vialLevels.filter((l) => l > 0).length }];
  },
});

export const p2wDetector = defineDetector({
  id: 'alchemy/p2w',
  kind: 'engine',
  system: 'alchemy',
  params: none,
  slots,
  reads: ['account.alchemyPlan'],
  examples: {
    fires: [{ fixture: 'scrubbed-w2', expect: { from: 10, to: 13 } }],
    silent: [
      {
        fixture: 'scrubbed-w2',
        mutate: (s) =>
          s.account.alchemyPlan
            ? {
                ...s,
                account: {
                  ...s.account,
                  alchemyPlan: { ...s.account.alchemyPlan, p2wPlayer: { speedLv: 13, extraExpLv: 13 } },
                },
              }
            : s,
      },
    ],
  },
  run: ({ state }) => {
    if ((state.account.currentWorld ?? 0) < 2) return [];
    const b = playerBehind(state);
    return b ? [b] : [];
  },
});

export const shopDetector = defineDetector({
  id: 'alchemy/shop',
  kind: 'engine',
  system: 'alchemy',
  params: none,
  slots,
  reads: ['account.alchemyPlan', 'account.liquids'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { nitrogenOpen: true } }],
    silent: [{ fixture: 'scrubbed-w2' }],
  },
  run: ({ state }) => {
    const n = state.account.liquids?.find((l) => l.index === 1);
    if (!state.account.alchemyPlan || !n?.unlocked) return [];
    return [{ nitrogenOpen: true, bought: state.account.alchemyPlan.liquidShopBought[8] ?? 0 }];
  },
});
