// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs and constellations (docs/specs/M16-star-signs.md), Phase 1.
import { type AccountState, type SupplyLeaf, TELESCOPE_ROUTE } from '@idleon-forge/account-state';

export {
  bySelection,
  type Candidate,
  type CandidateKind,
  constellationCandidates,
  GOAL_KINDS,
} from './constellations';
export { candyPool, contextOf, DEFAULT_VALUES, type StarContext, takeCandy } from './context';
export {
  ENTRY as STAR_SIGNS_ENTRY,
  FACT as STAR_SIGNS_FACT,
  knowledgeReady,
  type StarKnowledge,
} from './knowledge';
export { buildStarSigns, createStarSignsModule, starValues } from './module';
export { buyable, chartState, currentLeg, fitSet, legs } from './signs';
export { telescopePlan } from './telescope';
export type * from './types';

/**
 * X3: the three tree maps the worker adds to M14's supply maps, so F1's open step has a kill rate. Only
 * while the Telescope quest is not handed in and some character still has a tree door shut.
 */
export function telescopeRateLeaves(state: AccountState): SupplyLeaf[] {
  if (state.account.starSigns?.telescopeQuestDone !== false) return [];
  const shut = state.characters.some((c) => c.telescopeRoute?.some((d) => d === null || d > 0));
  if (!shut) return [];
  return [
    {
      rawName: 'star-signs-telescope-route',
      maps: TELESCOPE_ROUTE.map((d) => ({ mapIndex: d.mapIndex, chance: 1 })),
    },
  ];
}
