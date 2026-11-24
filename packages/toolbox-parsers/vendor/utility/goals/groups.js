// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// A descriptor's groups is one grouping or a list of them (Pets: by world and by passive). Group ids never repeat
// across a descriptor's groupings, so a goal stores only the id and the grouping is found from it.
export const groupingsOf = (descriptor) => {
  const groups = descriptor?.groups;
  if (!groups) return [];
  return Array.isArray(groups) ? groups : [groups];
};

export const groupingOf = (descriptor, id) => {
  const groupings = groupingsOf(descriptor);
  return groupings.find(({ names }) => Object.hasOwn(names ?? {}, String(id))) ?? groupings[0] ?? null;
};

export const firstGroupOf = (grouping) => Object.keys(grouping?.names ?? {})[0] ?? null;

export const isInGroup = (descriptor, id, row) => String(groupingOf(descriptor, id)?.of(row)) === String(id);
