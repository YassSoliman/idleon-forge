// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 Bubba (docs/specs/M23-bubba.md), Phase 1.
export {
  buildBubba,
  createBubbaModule,
  ENTRY as BUBBA_ENTRY,
  FACT as BUBBA_FACT,
  GOAL_KEY as BUBBA_GOAL_KEY,
} from './module';
export { amount, bonusText, charismaLabel, meatText, patsText, renderBubbaText, spanText } from './text';
export type * from './types';
