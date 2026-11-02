// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
/**
 * All types are auto-generated — do not edit manually.
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
