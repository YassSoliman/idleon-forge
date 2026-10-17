// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
export const indexGraph = (graph) => {
  const byId = graph.nodes;
  const edgesFrom = new Map();
  const edgesTo = new Map();
  for (const edge of graph.edges) {
    if (!edgesFrom.has(edge.from)) edgesFrom.set(edge.from, []);
    edgesFrom.get(edge.from).push(edge);
    if (!edgesTo.has(edge.to)) edgesTo.set(edge.to, []);
    edgesTo.get(edge.to).push(edge);
  }
  // Nodes that exist only to label a row, like Coin, are not destinations: keeping them out of the
  // search list also keeps them out of the category counts and the browse lists.
  const searchList = Object.entries(byId).filter(([, node]) => node.navigable !== false).map(([id, node]) => ({
    id,
    kind: node.kind,
    label: (node.name || node.rawName).replace(/_/g, ' '),
    ...(node.disambig ? { disambig: node.disambig } : {}),
  }));
  return { byId, edgesFrom, edgesTo, searchList };
};
