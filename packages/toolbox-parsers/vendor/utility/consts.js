// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
export const TOOLS = {
  PICKAXE: 0,
  HATCHET: 1,
  ROD: 2,
  NET: 3,
  TRAP: 4,
  SKULL: 5
}
// Skills every character shares: one level for the whole account
export const GLOBAL_SKILLS = ['gaming', 'sailing', 'breeding', 'farming', 'summoning'];
export const isGlobalSkill = (name) => GLOBAL_SKILLS.includes(name);
