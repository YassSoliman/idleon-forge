// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
export const searchEntities = (searchList, query, limit = 30) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact = [];
  const prefix = [];
  const substring = [];
  // The whole list every time, no early break: an exact match can sit anywhere in it, and stopping
  // once the prefix bucket is full is how "Bored Bean" ended up below "Bored Beanie".
  for (const entry of searchList) {
    const label = entry.label.toLowerCase();
    if (label === q) exact.push(entry);
    else if (label.startsWith(q)) prefix.push(entry);
    else if (label.includes(q)) substring.push(entry);
  }
  return [...exact, ...prefix, ...substring].slice(0, limit);
};
