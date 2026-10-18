// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 Skills, Parallel Slots and the Daily & Weekly Checklist (docs/specs/M20-skills-parallel-slots.md),
// Phase 1. Worker-side only: the UI reads EngineResult.checklist, .skills, .slotPictures and .skillGrid.
export { buildChecklist, rowDefs } from '../checklist/build';
export {
  accountWeekEnd,
  accountWeeksSinceSave,
  ballotWeekEnd,
  ballotWeekOf,
  firstAccountWeekEnd,
  periodIndex,
  serverWeekEnd,
  serverWeekOf,
} from '../checklist/clocks';
export { buildResetGoals } from '../checklist/goals';
export { killroyRoomDone, killroyRunner, readRow } from '../checklist/rows';
export type * from '../checklist/types';
export { buildSlots, slotsOpen } from './build';
export { ENTRY as M20_ENTRY, FACT as M20_FACT, type M20Knowledge } from './kb';
export { createChecklistModule, createM20Modules, createSlotsModule } from './module';
export { buildSkillGrid, buildSkills, gatesOf, SKILL_NAME } from './skills';
export type * from './types';
