// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Imports are user-supplied files, so anything without an item is dropped rather than rendered
export const isValidTrackedMaterial = (entry) => typeof entry?.item?.rawName === 'string';

export const getValidTrackedMaterials = (trackedItems) => {
  if (!trackedItems || typeof trackedItems !== 'object' || Array.isArray(trackedItems)) return {};
  return Object.fromEntries(Object.entries(trackedItems).filter(([, entry]) => isValidTrackedMaterial(entry)));
};

const PLACEHOLDER_ITEM = /ERROR|Blank|Filler|DONTFILL|FILLER/;

// The items the material tracker has always offered: no gear, no placeholder rows
export const isTrackableItem = ({ displayName, rawName, itemType } = {}) =>
  itemType !== 'Equip' && !PLACEHOLDER_ITEM.test(displayName ?? '') && !PLACEHOLDER_ITEM.test(rawName ?? '');
