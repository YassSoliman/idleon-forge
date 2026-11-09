// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { getShownLayerEfficiency, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';

export const getHive = (holesObject: any, accountData: any) => {
  const fishingEff = getShownLayerEfficiency(holesObject, LAYER_CAVERN.HIVE);
  const layer = holesObject?.extraCalculations?.[3];
  const caughtBugs = holesObject?.extraCalculations?.[2];
  const reqBugs = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.HIVE);

  return {
    fishingEff,
    layer: layer + 1,
    bugs: {
      mined: caughtBugs,
      required: reqBugs,
      maxed: caughtBugs >= reqBugs
    }
  };
}
