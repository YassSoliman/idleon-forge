// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 48cb4ee697988ec5eac14ba97142add6296505b2.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { getShownLayerEfficiency, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';

export const getEvertree = (holesObject: any, accountData: any) => {
  const choppingEff = getShownLayerEfficiency(holesObject, LAYER_CAVERN.EVERTREE);
  const layer = holesObject?.extraCalculations?.[5];
  const choppedLogs = holesObject?.extraCalculations?.[4];
  const reqLogs = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.EVERTREE);

  return {
    choppingEff,
    layer: layer + 1,
    logs: {
      chopped: choppedLogs,
      required: reqLogs,
      maxed: choppedLogs >= reqLogs
    }
  };
}
