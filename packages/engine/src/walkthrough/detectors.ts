// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14's engine Detectors (TR-5, M11 TR-4 `kind: 'engine'`): the Requirement Tree of a target and the
// printer state, behind the Detector contract, so `kb check` runs their examples on the scrubbed saves
// and records what they read. The Walkthrough itself is built by the engine step (module.ts), which reads
// other modules' results; these return the parts that depend on the Account State and the facts alone.
// Registered by one-line re-exports in packages/engine/detectors/{walkthrough,printer}/.
import { defineDetector } from '@idleon-forge/knowledge';
import { z } from 'zod';
import type { FactLookup } from '../metapath/types';
import { expandTarget, missingLeaves } from './expand';
import { HoldingsPool } from './holdings';
import type { WalkthroughKnowledge } from './knowledge';

const slots = z.strictObject({ step: z.string(), reason: z.string() });

/**
 * The planner's judgment values (M14 FR-14, Q4, R-Q9a), as the `walkthrough/plan` Detector's params so a
 * Knowledge Base PR can tune them: an unrated skilling leaf at or above `unratedBottleneckAt` items counts
 * as one Expected Return of effort; a job that finishes within `firstJobWithinSeconds` goes first on its
 * character; two finish times within `tieSeconds` are a tie (the steps show hours to one decimal).
 */
export const planParams = z.strictObject({
  target: z.string().default('quests.acquisition.postboy-pablob1'),
  unratedBottleneckAt: z.number().positive().default(500),
  firstJobWithinSeconds: z.number().positive().default(3600),
  tieSeconds: z.number().nonnegative().default(360),
});

/** The Knowledge Base as M14 reads it, over a Detector's fact lookup (entries and fact tables by id). */
export function knowledgeOver(facts: FactLookup): WalkthroughKnowledge {
  const by = (kind: 'entry' | 'fact') =>
    new Proxy({} as Record<string, never>, {
      get: (_t, id) => {
        if (typeof id !== 'string') return undefined;
        const x = facts.get(id) as Record<string, unknown> | undefined;
        if (!x) return undefined;
        const isFact = 'rows' in x;
        return (kind === 'fact') === isFact ? x : undefined;
      },
    });
  return { entries: by('entry'), facts: by('fact') } as unknown as WalkthroughKnowledge;
}

export const walkthroughPlanDetector = defineDetector({
  id: 'walkthrough/plan',
  kind: 'engine',
  system: 'walkthrough',
  params: planParams,
  slots,
  reads: [
    'account.storageItems',
    'account.refineryStorage',
    'account.forgeOutput',
    'account.anvilTabsOwned',
    'characters[*].inventoryItems',
    'characters[*].smithingLevel',
    'characters[*].quests',
  ],
  examples: {
    fires: [{ fixture: 'scrubbed-w2', expect: { target: 'quests.acquisition.postboy-pablob1' } }],
    silent: [],
  },
  run: ({ state, facts }, params) => {
    const kb = knowledgeOver(facts);
    const t = expandTarget({ state, kb, pool: new HoldingsPool(state), diagnostics: [] }, params.target);
    if (!t) return [];
    return [{ target: params.target, missing: missingLeaves(t.root).map((l) => l.rawName) }];
  },
});

export const printerSlotPlanDetector = defineDetector({
  id: 'printer/slot-plan',
  kind: 'engine',
  system: 'printer',
  params: z.strictObject({}),
  slots,
  reads: ['account.printer'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { level: 4 } }],
    silent: [{ fixture: 'scrubbed-w2' }],
  },
  run: ({ state }) => {
    const p = state.account.printer;
    if (!p || p.level <= 0) return [];
    return [{ level: p.level, printing: Math.min(p.level, state.characters.length) }];
  },
});
