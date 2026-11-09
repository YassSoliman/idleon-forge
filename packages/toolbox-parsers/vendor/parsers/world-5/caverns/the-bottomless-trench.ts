// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { getShownLayerEfficiency, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';

export const getBottomlessTrench = (holesObject: any, accountData: any) => {
  // The fish pool itself sits at MotherlodeEffBase / 4, but the cavern UI prints the same quarter of
  // MotherlodeEffBase as the other three layered caverns
  const fishingEff = getShownLayerEfficiency(holesObject, LAYER_CAVERN.TRENCH);
  const depth = holesObject?.extraCalculations?.[7] ?? 0;
  const caughtFish = holesObject?.extraCalculations?.[6] ?? 0;
  const reqFish = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.TRENCH);

  return {
    fishingEff,
    layer: depth + 1,
    fish: {
      caught: caughtFish,
      required: reqFish,
      maxed: caughtFish >= reqFish
    }
  };
};
