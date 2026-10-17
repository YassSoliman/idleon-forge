// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { commaNotation, notateNumber } from '@utility/helpers';
import { getShownLayerEfficiency, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';

export const getEvertree = (holesObject: any, accountData: any) => {
  const choppingEff = notateNumber(getShownLayerEfficiency(holesObject, LAYER_CAVERN.EVERTREE), 'Big');
  const layer = holesObject?.extraCalculations?.[5];
  const choppedLogs = holesObject?.extraCalculations?.[4];
  const reqLogs = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.EVERTREE);

  return {
    choppingEff,
    layer: layer + 1,
    logs: {
      chopped: choppedLogs < 1e9 ? commaNotation(choppedLogs) : notateNumber(choppedLogs, 'Big'),
      required: reqLogs < 1e9 ? commaNotation(reqLogs) : notateNumber(reqLogs, 'Big'),
      maxed: choppedLogs >= reqLogs
    }
  };
}
