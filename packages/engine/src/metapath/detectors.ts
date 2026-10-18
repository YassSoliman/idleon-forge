// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2's engine Detectors (M2 TR-1, M11 TR-4, `kind: 'engine'`): the Stage, roster, pusher and Meta Path
// Goal steps behind the M11 Detector contract, so the engine core runs them with per-Detector error
// isolation (`runDetector`) and records their `reads` as provenance.
//
// Each is registered by a one-line re-export in packages/engine/detectors/metapath/<name>.ts.
import { defineDetector } from '@idleon-forge/knowledge';
import { z } from 'zod';
import { behindRows, stageExpectations } from './behind';
import { familyUnlock } from './family';
import { elitePending, pushGoal, subclassPending, worldTutorial } from './gate-chain';
import { selectPusher } from './pusher';
import { analyzeRoster } from './roster';
import { detectStage } from './stage';

const none = z.strictObject({});
const noSlots = z.strictObject({});

const STAGE_READS = [
  'account.finishedWorlds',
  'account.currentWorld',
  'account.gateQuests',
  'account.buildings',
  'account.salts',
  'account.worldCrystals',
  'characters[*].level',
  'characters[*].classIndex',
  'characters[*].npcDialog',
  'diagnostics',
] as const;

export const stageDetector = defineDetector({
  id: 'metapath/stage',
  kind: 'engine',
  system: 'metapath',
  params: none,
  slots: noSlots,
  reads: STAGE_READS,
  examples: {
    fires: [{ fixture: 'scrubbed-w2', expect: { id: 'W2-late' } }],
    silent: [],
  },
  run: ({ state, facts }) => [detectStage(state, facts)],
});

export const rosterDetector = defineDetector({
  id: 'metapath/roster',
  kind: 'engine',
  system: 'metapath',
  params: none,
  slots: noSlots,
  reads: [...STAGE_READS, 'account.accountLevel'],
  examples: { fires: [{ fixture: 'scrubbed-w2', expect: { missingLines: ['Hunter'] } }], silent: [] },
  run: ({ state, facts }) => [analyzeRoster(state, facts, detectStage(state, facts).id)],
});

export const pusherDetector = defineDetector({
  id: 'metapath/pusher',
  kind: 'engine',
  system: 'metapath',
  params: none,
  slots: noSlots,
  reads: ['account.frontier', 'characters[*].level'],
  examples: { fires: [{ fixture: 'scrubbed-w2' }], silent: [] },
  run: ({ state, facts }) => [selectPusher(state, facts)],
});

export const pushStepDetector = defineDetector({
  id: 'metapath/push-step',
  kind: 'engine',
  system: 'metapath',
  params: none,
  slots: noSlots,
  reads: [...STAGE_READS, 'account.frontier'],
  examples: { fires: [{ fixture: 'scrubbed-w2' }], silent: [] },
  run: ({ state, facts }) => [pushGoal(state, facts, detectStage(state, facts), selectPusher(state, facts))],
});

export const worldTutorialDetector = defineDetector({
  id: 'metapath/world-tutorial',
  kind: 'engine',
  system: 'metapath',
  params: none,
  slots: noSlots,
  reads: [...STAGE_READS, 'account.frontier'],
  examples: { fires: [{ fixture: 'scrubbed-w3' }], silent: [{ fixture: 'scrubbed-w2' }] },
  run: ({ state, facts }) => {
    const s = selectPusher(state, facts);
    return worldTutorial(
      state,
      facts,
      detectStage(state, facts),
      s.kind === 'pusher' ? s.pusher.index : null,
    );
  },
});

export const subclassPendingDetector = defineDetector({
  id: 'metapath/subclass-pending',
  kind: 'engine',
  system: 'metapath',
  params: none,
  slots: noSlots,
  reads: STAGE_READS,
  examples: { fires: [], silent: [{ fixture: 'scrubbed-w2' }] },
  run: ({ state, facts }) => subclassPending(state, facts, detectStage(state, facts)),
});

export const elitePendingDetector = defineDetector({
  id: 'metapath/elite-pending',
  kind: 'engine',
  system: 'metapath',
  params: none,
  slots: noSlots,
  reads: STAGE_READS,
  examples: { fires: [], silent: [{ fixture: 'scrubbed-w2' }] },
  run: ({ state, facts }) => elitePending(state, facts, detectStage(state, facts)),
});

/**
 * M15 F3: the next family-level unlock (FR-14 to FR-19). The engine module adds the ETA from save
 * history (FR-16); this Detector runs on one save, so it has none.
 */
export const familyUnlockDetector = defineDetector({
  id: 'metapath/family-unlock',
  kind: 'engine',
  system: 'metapath',
  params: none,
  slots: z.strictObject({ what: z.string(), gate: z.number(), gap: z.number() }),
  reads: [...STAGE_READS, 'account.accountLevel', 'characters[*].quests'],
  examples: {
    fires: [
      { fixture: 'scrubbed-w2', expect: { next: { familyLevel: 300, characterSlot: 6 }, gap: 43 } },
      { fixture: 'scrubbed-w3', expect: { next: { familyLevel: 400 }, gap: 21 } },
    ],
    silent: [],
  },
  run: ({ state, facts, now }) => {
    const stage = detectStage(state, facts);
    const u = familyUnlock(state, facts, stage, analyzeRoster(state, facts, stage.id), [], now);
    return u ? [u] : [];
  },
});

/**
 * M15 F5: the Stage Expectation rows that are behind for this account's Stage (FR-26). Whether each is
 * unmet needs the other modules' findings, so the engine core decides that (TR-9, `behindStep`).
 */
export const behindDetector = defineDetector({
  id: 'metapath/behind',
  kind: 'engine',
  system: 'metapath',
  params: none,
  slots: z.strictObject({ system: z.string() }),
  reads: STAGE_READS,
  examples: { fires: [{ fixture: 'scrubbed-w2' }], silent: [] },
  run: ({ state, facts }) => behindRows(stageExpectations(facts), detectStage(state, facts).id),
});

/** Every M2 engine Detector, by id. */
export const METAPATH_DETECTORS = Object.freeze({
  [stageDetector.id]: stageDetector,
  [rosterDetector.id]: rosterDetector,
  [pusherDetector.id]: pusherDetector,
  [pushStepDetector.id]: pushStepDetector,
  [worldTutorialDetector.id]: worldTutorialDetector,
  [subclassPendingDetector.id]: subclassPendingDetector,
  [elitePendingDetector.id]: elitePendingDetector,
  [familyUnlockDetector.id]: familyUnlockDetector,
  [behindDetector.id]: behindDetector,
});
