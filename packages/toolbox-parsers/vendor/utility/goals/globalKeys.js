// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { isGlobalSkill } from '../consts';

// Entries every character shares (a global skill), by system: one value for the account, so any stored scope means
// the account. Data-free so the store can read it without the registry
export const GLOBAL_KEYS = { skill: isGlobalSkill };
