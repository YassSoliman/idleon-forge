// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { isGlobalSkill } from '../consts';

// Entries every character shares (a global skill), by system: one value for the account, so any stored scope means
// the account. Data-free so the store can read it without the registry
export const GLOBAL_KEYS = { skill: isGlobalSkill };
