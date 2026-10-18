// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 340ef2ccfa460673b759369dabf8996eb11d8086.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const objectsOnly = (list) => Array.isArray(list) ? list.filter(isPlainObject) : [];

// Sections come from localStorage and user-picked import files, and render() maps over them,
// so a wrong shape would crash the page on every load
export const getValidPlannerSections = (planner) => objectsOnly(planner?.sections).map((section) => ({
  ...section,
  items: objectsOnly(section.items),
  materials: objectsOnly(section.materials)
}));
