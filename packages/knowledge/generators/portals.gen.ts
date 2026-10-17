// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Portals (M2 TR-7, M4 TR-4): a Goal ladder per fighting map of W1–W4 reachable from its town
// (`portals.goal.map-<i>`, one step per door that has a kill requirement), and the fact table
// `portals.fact.world-routes`: for each world, the shortest door-by-door path from the town to every
// map reachable inside it through mapPortalDestinations. M2 picks the route to the world's boss map
// from it (the boss map is not in Toolbox's data; it comes with metapath.fact.world-gates). A fighting
// map gets a ladder when it is reachable, or when a door with a requirement leads on from it (some maps,
// such as Poopy Sewers, are entered on foot and no door lists them). Boss lairs, colosseums and the
// Rift are neither.
import type { FactTableT, GeneratedEntryT } from '../src/schema';
import { MAP_INPUTS, mapDataOf, mapGraph, worldOf } from './map-graph';
import { defineGenerator, generatedBy, generatedSource } from './types';

export const WORLDS = [1, 2, 3, 4] as const;

const generator = defineGenerator({
  name: 'portals',
  system: 'portals',
  inputs: [...MAP_INPUTS],
  run({ data, pin }) {
    const g = mapGraph(mapDataOf(data));
    const by = generatedBy(generator, pin);
    const source = generatedSource(
      pin,
      'website-data/shared-data.json',
      'IdleOn Toolbox game data: mapPortals and mapPortalDestinations',
    );
    const pretty = (m: number) => g.name(m).replace(/_/g, ' ');
    const entries: GeneratedEntryT[] = [];
    const routes: { world: number; town: number; paths: Record<string, unknown[]> }[] = [];
    for (const world of WORLDS) {
      const paths = g.pathsIn(world);
      routes.push({
        world,
        town: (world - 1) * 50,
        paths: Object.fromEntries(
          [...paths].sort(([a], [b]) => a - b).map(([m, steps]) => [String(m), steps]),
        ),
      });
      for (const m of g.indices) {
        if (worldOf(m) !== world || !g.isReal(m) || g.afkType(m) !== 'FIGHTING') continue;
        const doors = g.doors(m).filter((d) => d.requirement > 0);
        if (doors.length === 0) continue;
        // Reachable from the town, or entered on foot with a door onward (Poopy Sewers): boss lairs,
        // colosseums and the Rift are neither, so they get no ladder.
        if (!paths.has(m) && !doors.some((d) => d.to !== null)) continue;
        // Ascending requirement, so the ladder reads in the order the kills reach it.
        const byReq = new Map<number, typeof doors>();
        for (const d of doors) byReq.set(d.requirement, [...(byReq.get(d.requirement) ?? []), d]);
        const milestones = [...byReq.entries()]
          .sort(([a], [b]) => a - b)
          .map(([at, ds]) => ({
            at,
            reward: ds
              .map((d) => (d.to === null ? `door ${d.door + 1}` : `door to ${pretty(d.to)}`))
              .join(' and '),
          }));
        entries.push({
          id: `portals.goal.map-${m}`,
          system: 'portals',
          type: 'goal',
          origin: 'generated',
          title: `Portal: ${pretty(m)}`.slice(0, 80),
          text: `{value:compact} kills on ${pretty(m)}; next door opens at {next:compact}`.slice(0, 240),
          why: `Kills on ${pretty(m)} open its doors to the next maps.`.slice(0, 240),
          values: { map: m, world },
          sources: [source],
          appliesTo: { stages: 'all' },
          confidence: 'H',
          status: 'active',
          scope: 'character',
          category: 'compounding',
          unit: 'kills',
          progress: { id: 'portals/kills-on-map', params: { map: m } },
          milestones,
          data: { doors: g.doors(m).map((d) => ({ ...d })) },
          generatedBy: by,
        });
      }
    }
    const facts: FactTableT[] = [
      {
        id: 'portals.fact.world-routes',
        system: 'portals',
        origin: 'generated',
        title: 'Shortest door paths from each town, W1–W4',
        rows: routes as unknown as FactTableT['rows'],
        sources: [source],
        generatedBy: by,
      },
    ];
    return { entries, facts };
  },
});

export default generator;
