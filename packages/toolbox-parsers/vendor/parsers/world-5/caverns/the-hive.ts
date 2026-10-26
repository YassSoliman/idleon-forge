// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { commaNotation, notateNumber } from '@utility/helpers';
import { getShownLayerEfficiency, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';

export const getHive = (holesObject: any, accountData: any) => {
  const fishingEff = notateNumber(getShownLayerEfficiency(holesObject, LAYER_CAVERN.HIVE), 'Big');
  const layer = holesObject?.extraCalculations?.[3];
  const caughtBugs = holesObject?.extraCalculations?.[2];
  const reqBugs = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.HIVE);

  return {
    fishingEff,
    layer: layer + 1,
    bugs: {
      mined: caughtBugs < 1e9 ? commaNotation(caughtBugs) : notateNumber(caughtBugs, 'Big'),
      required: reqBugs < 1e9 ? commaNotation(reqBugs) : notateNumber(reqBugs, 'Big'),
      maxed: caughtBugs >= reqBugs
    }
  };
}
