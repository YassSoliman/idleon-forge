// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
export const ALL_SECTIONS = ['goals', 'account', 'characters', 'timers'];

// Saved orders come from storage: keep what is valid, then append sections added since in default order.
export const normalizeSectionOrder = (saved, all = ALL_SECTIONS) => {
  const kept = Array.isArray(saved) ? saved.filter((id, index) => all.includes(id) && saved.indexOf(id) === index) : [];
  return [...kept, ...all.filter((id) => !kept.includes(id))];
};

// Keyboard reorder: one slot left (-1) or right (+1); the ends stay put.
export const moveSection = (order, id, step) => {
  const from = order.indexOf(id);
  const to = from + step;
  if (from === -1 || to < 0 || to >= order.length) return order;
  const next = [...order];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};
