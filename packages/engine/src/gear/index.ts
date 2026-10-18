// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 Gear & Tools (docs/specs/M18-gear-tools.md), Phase 1. Worker-side only: the UI reads EngineResult.gear.
export { buildGear, type GearBuildInput, type GearBuildOutput } from './build';
export { armorSmithyDetector, gearPlanDetector, gearSlotsDetector } from './detectors';
export { better, familyOf, handOut, judgeSlot, planRows, planStage, targetOf, wearable } from './judge';
export { ENTRY as GEAR_ENTRY, FACT as GEAR_FACT, type GearKnowledge, gearFacts } from './kb';
export { createGearModule } from './module';
export { COLUMN_UNLOCKS, Pool, pathTo, rootOf } from './paths';
export { buildSmithy } from './smithy';
export type * from './types';
