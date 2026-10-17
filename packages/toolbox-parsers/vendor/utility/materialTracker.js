// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Imports are user-supplied files, so anything without an item is dropped rather than rendered
export const isValidTrackedMaterial = (entry) => typeof entry?.item?.rawName === 'string';

export const getValidTrackedMaterials = (trackedItems) => {
  if (!trackedItems || typeof trackedItems !== 'object' || Array.isArray(trackedItems)) return {};
  return Object.fromEntries(Object.entries(trackedItems).filter(([, entry]) => isValidTrackedMaterial(entry)));
};
