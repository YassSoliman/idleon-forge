// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// @idleon-forge/truth (M22): invariants checked on every parse, against the save itself. Worker-only
// at runtime; the page may `import type` from here.
export { checkTruth, type TruthInput, type TruthOutput } from './check';
export { CHEST_SAMPLE, factsOf, same } from './facts';
export { GAME_SOURCES } from './game-data';
export { decode, type EnvelopeLike, readRawFacts } from './raw/read';
export { returnClasses, skillTerms, starTotalFloor, unspentFloor } from './raw/talent-points';
export { RULES, type Rule, type RuleInput } from './rules';
export { NO_POINTS, NO_POINTS_KNOWN, reachOf, takeOf } from './rules/rule';
export { CANT_BE_SURE, CANT_BE_SURE_WHY, suppress } from './suppress';
export type * from './types';
