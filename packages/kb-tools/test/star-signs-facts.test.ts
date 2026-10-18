// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 TR-3: the authored star sign facts against Toolbox's game data at the parser pin. Runs on every
// parser sync, so a changed number or requirement text fails the sync PR. The parent tree has no Toolbox
// copy: it is re-verified from N.js on every major patch (M11's staleness pass).
import { TELESCOPE_ROUTE } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { loadSource } from '../src/load';
import { loadGameData } from '../src/toolbox-data';

const src = loadSource();
const fact = (id: string) => src.facts.find((f) => f.value.id === id)?.value.rows as Record<string, unknown>;
const entry = (id: string) => src.authored.find((e) => e.value.id === id)?.value;
const data = loadGameData().data as {
  constellations: {
    rawIndex: number;
    mapIndex: number;
    requiredPlayers: number;
    points: number;
    name: string;
    requirement: string;
  }[];
  starSigns: { starName: string; cost: number; tree: string }[];
};
const cons = (fact('star-signs.fact.constellations').constellations ?? []) as {
  name: string;
  rawIndex: number;
  mapIndex: number;
  players: number;
  points: number;
  requirement: string;
  world: number;
}[];
const nodes = (fact('star-signs.fact.chart').nodes ?? []) as {
  node: number;
  id: number;
  sign: string;
  parent: string | null;
  cost: number;
  chart: string;
}[];
const rules = fact('star-signs.fact.rules') as {
  route: { mapIndex: number; door: number }[];
  starters: string[];
  telescope: { mapIndex: number };
};
const list = (key: string) =>
  String(entry('star-signs.goal.signs')?.values[key] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

describe('star-signs.fact.constellations equals Toolbox constellations at the pin', () => {
  it('covers every W1 to W3 constellation, with map, players, points and requirement text', () => {
    const toolbox = data.constellations.filter((c) => /^[ABC]-/.test(c.name));
    expect(cons.map((c) => c.name)).toEqual(toolbox.map((c) => c.name));
    for (const c of cons) {
      const t = toolbox.find((x) => x.rawIndex === c.rawIndex);
      expect(t, c.name).toBeDefined();
      expect([c.name, c.mapIndex, c.players, c.points, c.requirement]).toEqual([
        t?.name,
        t?.mapIndex,
        t?.requiredPlayers,
        t?.points,
        t?.requirement,
      ]);
    }
  });
  it('pays 37, 32 and 39 points in W1, W2 and W3 (F-l)', () => {
    const by = (w: number) => cons.filter((c) => c.world === w).reduce((n, c) => n + c.points, 0);
    expect([by(1), by(2), by(3)]).toEqual([37, 32, 39]);
  });
});

describe('star-signs.fact.chart equals Toolbox starSigns at the pin', () => {
  it('has nodes 0 to 63 with the same sign, cost and chart', () => {
    expect(nodes.map((n) => n.node)).toEqual([...Array(64).keys()]);
    for (const n of nodes) {
      const t = data.starSigns[n.id];
      expect([n.sign, n.cost, n.chart]).toEqual([t?.starName, t?.cost, t?.tree]);
    }
  });
  it('every parent is a node of the chart', () => {
    const signs = new Set(nodes.map((n) => n.sign));
    for (const n of nodes.slice(1)) expect(signs.has(n.parent ?? ''), n.sign).toBe(true);
  });
});

describe('chart order and fit lists (US-5, TR-3)', () => {
  const order = ['chart-leg-1', 'chart-leg-2', 'chart-leg-3', 'chart-leg-4'].flatMap(list);
  it('lists every item after its parent, or with a starter parent', () => {
    const seen = new Set(rules.starters);
    for (const s of order) {
      const n = nodes.find((x) => x.sign === s);
      expect(n, s).toBeDefined();
      expect(seen.has(n?.parent ?? '') || n?.parent === 'The_Buff_Guy', `${s} after ${n?.parent}`).toBe(true);
      seen.add(s);
    }
  });
  it('the legs cost 19, 18 and 14 (F-b, F-c, D-5)', () => {
    const cost = (k: string) => list(k).reduce((n, s) => n + (nodes.find((x) => x.sign === s)?.cost ?? 0), 0);
    expect([cost('chart-leg-1'), cost('chart-leg-2'), cost('chart-leg-3')]).toEqual([19, 18, 14]);
    expect(4 + list('chart-leg-1').length + list('chart-leg-2').length).toBe(24);
  });
  it('never lists The Forsaken or Mr No Sleep (D-7)', () => {
    const all = [
      ...order,
      ...['fighting', 'mining', 'choppin', 'fishing', 'catching'].flatMap((a) => list(`fit-${a}`)),
    ];
    expect(all).not.toContain('The_Forsaken');
    expect(all).not.toContain('Mr_No_Sleep');
    for (const s of all)
      expect(
        nodes.some((n) => n.sign === s),
        s,
      ).toBe(true);
  });
});

describe('the Telescope route (F-f)', () => {
  it('equals the account-state route and walks from Jungle Perimeter to Where the Branches End in maps.fact.maps', () => {
    expect(rules.route).toEqual(TELESCOPE_ROUTE);
    const maps = fact('maps.fact.maps') as unknown as {
      index: number;
      doors: { destination: number | null; requirement: number }[];
    }[];
    const dest = rules.route.map((r) => maps.find((m) => m.index === r.mapIndex)?.doors[r.door]?.destination);
    expect(dest).toEqual([13, 18, rules.telescope.mapIndex]);
    const reqs = rules.route.map((r) => maps.find((m) => m.index === r.mapIndex)?.doors[r.door]?.requirement);
    expect(reqs).toEqual([3000, 2500, 5000]);
  });
});
