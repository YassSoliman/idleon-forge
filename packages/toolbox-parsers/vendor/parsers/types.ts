// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
/**
 * All types are auto-generated: do not edit manually.
 *
 * Sources:
 *   - generated-firebase-types.ts  ← node scripts/generate-firebase-types.mjs
 *   - generated-types.ts           ← npx jest __test__/extract-types.test.js
 *   - data/website-data.d.ts       ← z-processing/tools/typeGenerator.js (via process.js)
 */

// Raw Firebase save data
export type { SparseArray, IdleonData, GuildData, CompanionData, ServerVars, TournamentData } from './generated-firebase-types';

// Parsed output of serializeData / initializeCharacter
export type { Account, Character } from './generated-types';
