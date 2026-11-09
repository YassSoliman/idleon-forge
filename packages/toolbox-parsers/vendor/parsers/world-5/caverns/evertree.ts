// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
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
