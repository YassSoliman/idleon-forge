// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C Crafting guidance and Production Plans (docs/specs/M26-crafting-guidance.md), Wave C.
export { type AnvilProduct, align, planAnvil, ratioText } from './anvil';
export { craftable, craftCandidates, craftNextOf, sharedCrafts } from './craft';
export { recipeGate, splitGates, systemHref, type TextPart, tabGate, tabReadiness } from './gates';
export {
  buildProduction,
  createProductionModule,
  ENTRY as PRODUCTION_ENTRY,
  KEEP_RATIO,
  nextTabOf,
  productsOf,
} from './module';
export { recipeTabs } from './recipes';
export type * from './types';
