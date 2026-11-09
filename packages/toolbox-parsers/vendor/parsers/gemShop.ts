// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { tryToParse } from '@utility/helpers';
import type { IdleonData } from './types';

export const getGemShop = (idleonData: IdleonData) => {
  const gemShopRaw = tryToParse(idleonData?.GemItemsPurchased) || idleonData?.GemItemsPurchased;
  return parseGemShop(gemShopRaw);
}

export const parseGemShop = (gemShopRaw: unknown) => {
  return gemShopRaw;
}
