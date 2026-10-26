// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
export const getGrotto = (holesObject: any) => {
  const layer = holesObject?.extraCalculations[26] + 1;
  const monarchHp = 1e11 * Math.pow(7.5, (holesObject?.extraCalculations[26]));
  const mushroomKillsLeft = Math.max(0, 5e3 * Math.pow(3.4, (holesObject?.extraCalculations[26])) - (holesObject?.extraCalculations[27]));
  const mushroomKills = holesObject?.extraCalculations[27];
  const mushroomKillsReq = 5e3 * Math.pow(3.4, (holesObject?.extraCalculations[26]));
  return { monarchHp, mushroomKillsLeft, mushroomKills, mushroomKillsReq, layer };
}

