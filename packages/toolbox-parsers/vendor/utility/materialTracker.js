// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 3e14ee1dec06800dd5357337f9dc1b347f7a2f58.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Imports are user-supplied files, so anything without an item is dropped rather than rendered
export const isValidTrackedMaterial = (entry) => typeof entry?.item?.rawName === 'string';

export const getValidTrackedMaterials = (trackedItems) => {
  if (!trackedItems || typeof trackedItems !== 'object' || Array.isArray(trackedItems)) return {};
  return Object.fromEntries(Object.entries(trackedItems).filter(([, entry]) => isValidTrackedMaterial(entry)));
};

// useLocalStorage swallows QuotaExceededError, so a full origin quota only shows up on read-back
export const isStoredInLocalStorage = (key, value) => {
  try {
    return localStorage.getItem(key) === JSON.stringify(value);
  } catch {
    return false;
  }
};
