// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 48cb4ee697988ec5eac14ba97142add6296505b2.
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
