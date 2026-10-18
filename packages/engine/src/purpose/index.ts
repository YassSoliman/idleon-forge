// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 Purpose & Milestones (docs/specs/M4-purpose-milestones.md): each character's Purpose, its
// Milestones, ETAs and stop-here, and "What is this character for?". Worker side only.
export { bestExpPerHour } from './best-exp';
export {
  activitiesServing,
  activityOf,
  type CardListOf,
  contributionsOf,
  countText,
  coveredAfkTypes,
  type Derived,
  derive,
  derivePurposes,
  etaSuffix,
  etaWords,
  FAMILIES,
  goalsServedBy,
} from './derive';
export {
  createPurposeModule,
  lineOf,
  type PurposeModuleDeps,
  type PurposeRun,
  purposeOf,
  purposeStatusFor,
  purposesFor,
  sessionStartOf,
  suggestionFor,
} from './module';
export type * from './types';
