// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-9: the `map` engine module, owned by area M (Map and nav). It emits `EngineResult.map`: the world
// bands with their boss gates, the frontier door with the pusher's kills and time, where each character
// stands, door kills per character, and the four overlays. The map is facts, not advice (FR-M7): it adds
// no Goals, no Verdicts and no Next Actions, and it never throws into the engine (a failure is `null`).
import type { AccountState } from '@idleon-forge/account-state';
import type { CompiledKnowledge } from '@idleon-forge/knowledge';
import type { EngineInput, EngineModule, ModuleOutput } from '../core/module';
import { gateChain, gateQuestSteps, lookupOf, routeTo } from '../metapath/knowledge';
import { selectPusher } from '../metapath/pusher';
import type { FactLookup } from '../metapath/types';
import type { MapNode, MapResult } from '../result';

/** The worlds the facts cover (boss gates, routes): W5 and up fold into one "not covered yet" band. */
export const LAST_MAP_WORLD = 4;

export const MAP_FACT = {
  maps: 'maps.fact.maps',
  bossGates: 'map.fact.boss-gates',
  worldGates: 'metapath.fact.world-gates',
  worldRoutes: 'portals.fact.world-routes',
  cards: 'cards.fact.drops',
  constellations: 'star-signs.fact.constellations',
} as const;

export interface MapFactRow {
  index: number;
  name: string;
  world: number;
  afkType: string | null;
  target: string | null;
  listed: boolean;
  doors: { requirement: number; destination: number | null }[];
}
export interface BossGateRow {
  world: number;
  boss: string;
  bossMap: number;
  key: string;
  keyName: string;
}
interface WorldGateRow {
  world: number;
  crystal: string | null;
  crystalName: string | null;
}
interface RouteRow {
  world: number;
  town: number;
}
interface CardDropRow {
  name: string;
  chance: number;
  monster: string;
}
interface ConstellationRow {
  name: string;
  mapIndex: number;
  world: number;
}
interface DeathNoteEntry {
  id: string;
  system?: string;
  progress?: { params?: { monster?: string } };
  milestones?: { at: number; reward: string }[];
}

type Kb = Pick<CompiledKnowledge, 'entries' | 'facts'>;

/**
 * A mirror of `map.fact.boss-gates` (packages/knowledge/systems/map.facts.yaml, with its wiki Sources).
 * The compiled bundle ships a fact only when an entry or a Detector names it, and the Map adds neither
 * (FR-M7), so the module reads the shipped fact when it is there and this mirror otherwise. A test holds
 * the two equal; Integration can drop the mirror once the fact ships.
 */
export const BOSS_GATES: readonly BossGateRow[] = [
  { world: 1, boss: 'Amarok', bossMap: 29, key: 'Key1', keyName: 'Forest Villa Key' },
  { world: 2, boss: 'Efaunt', bossMap: 66, key: 'Key2', keyName: "Efaunt's Tomb Key" },
  { world: 3, boss: 'Chizoar', bossMap: 114, key: 'Key3', keyName: "Chizoar's Cavern Key" },
  { world: 4, boss: 'Massive Troll', bossMap: 165, key: 'Key4', keyName: "Troll's Enclave Key" },
];

const rowsOf = <T>(kb: Kb, id: string): T | null =>
  (kb.facts[id] as { rows?: unknown } | undefined)?.rows !== undefined
    ? ((kb.facts[id] as { rows: unknown }).rows as T)
    : null;

/**
 * A world's route path, town first: the same path M2's frontier walks (`metapath/gate-chain.ts`
 * `frontierRoute`, held equal by the map test). Repeated here because gate-chain.ts imports the Knowledge
 * Base's runtime, which would pull its schemas into the lazy Map chunk; this only reads facts.
 */
export function worldRoute(kb: FactLookup, world: number): ReturnType<typeof routeTo> {
  const route = gateChain(kb, world)?.find((s) => s.kind === 'route');
  if (!route?.ref) return null;
  const [kind, value] = route.ref.split(':') as [string, string];
  const destination =
    kind === 'map' ? Number(value) : kind === 'npc' ? (gateQuestSteps(kb, value)[0]?.map ?? null) : null;
  if (destination === null || !Number.isInteger(destination)) return null;
  return routeTo(kb, world, destination);
}

/** The map's kind for its node glyph: the town, a fighting map, a skilling map, or anything else. */
export function nodeKind(row: MapFactRow, town: number | null): MapNode['kind'] {
  if (row.index === town) return 'town';
  if (row.afkType === 'FIGHTING') return 'fight';
  if (row.afkType !== null) return 'skill';
  return 'other';
}

/** Kills left on one door for one character: null when the character never reached the map (no row). */
const killsLeft = (c: AccountState['characters'][number], map: number, door: number): number | null => {
  const row = c.doorKillsLeft?.[map];
  if (!Array.isArray(row) || row.length === 0) return null;
  const v = row[door];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

function crystalHeld(state: AccountState, crystal: string | null): number | null {
  const c = state.account.worldCrystals ?? null;
  if (c === null || crystal === null) return null;
  return crystal === 'Crystal1'
    ? c.desertTopaz
    : crystal === 'Crystal2'
      ? c.glacierQuartz
      : crystal === 'Crystal3'
        ? c.galaxialAmethyst
        : null;
}

/** M21 TR-9: the Map place's data from one Account State and the compiled Knowledge Base. */
export function buildMap(state: AccountState, kb: Kb): MapResult | null {
  const current = state.account.currentWorld ?? null;
  const maps = rowsOf<MapFactRow[]>(kb, MAP_FACT.maps);
  if (current === null || current < 1 || !maps) return null;
  const facts = lookupOf(kb);
  const gates = rowsOf<BossGateRow[]>(kb, MAP_FACT.bossGates) ?? BOSS_GATES;
  const worldGates = rowsOf<WorldGateRow[]>(kb, MAP_FACT.worldGates) ?? [];
  const towns = new Map((rowsOf<RouteRow[]>(kb, MAP_FACT.worldRoutes) ?? []).map((r) => [r.world, r.town]));
  const byIndex = new Map(maps.map((m) => [m.index, m]));
  const people = state.characters;
  const pathOf = (world: number) => {
    try {
      return (worldRoute(facts, world) ?? []).filter((d) => d.door >= 0 && d.requirement > 0);
    } catch {
      return [];
    }
  };

  // ---- the bands: W1 to the current world, the next one dimmed, W5+ as one folded band ----
  const lastShown = Math.min(current + 1, LAST_MAP_WORLD);
  const worlds: MapResult['worlds'] = [];
  for (let w = 1; w <= lastShown; w++) {
    const town = towns.get(w) ?? null;
    const nodes: MapNode[] = maps
      .filter((m) => m.world === w && (m.listed || m.index === town))
      .map((m) => ({
        mapIndex: m.index,
        name: m.name,
        kind: nodeKind(m, town),
        doors: m.doors.flatMap((d) =>
          d.destination === null || d.requirement <= 0
            ? []
            : [{ destination: d.destination, requirement: d.requirement }],
        ),
      }));
    const path = pathOf(w);
    const known = people.some((c) => c.doorKillsLeft != null);
    const state_: 'done' | 'open' | 'next' = w < current ? 'done' : w === current ? 'open' : 'next';
    const cleared =
      state_ === 'next'
        ? 0
        : known
          ? path.filter((d) => people.some((c) => killsLeft(c, d.mapIndex, d.door) === 0)).length
          : state_ === 'done'
            ? path.length
            : 0;
    const gate = gates.find((g) => g.world === w);
    const bank = gate ? (state.account.keys ?? []).find((k) => k.rawName === gate.key) : undefined;
    const wg = worldGates.find((g) => g.world === w);
    worlds.push({
      world: w,
      state: state_,
      cleared,
      total: path.length,
      gate: gate
        ? {
            boss: gate.boss,
            bossMap: byIndex.has(gate.bossMap) ? gate.bossMap : null,
            keysHeld: bank ? bank.banked : null,
            keysPerDay: bank ? bank.perDay : null,
            crystal:
              wg?.crystal && wg.crystalName
                ? { item: wg.crystalName, held: crystalHeld(state, wg.crystal), need: 1 }
                : null,
          }
        : null,
      maps: nodes,
    });
  }
  if (current > LAST_MAP_WORLD)
    worlds.push({ world: LAST_MAP_WORLD + 1, state: 'open', cleared: 0, total: 0, gate: null, maps: [] });
  const shown = new Set(worlds.flatMap((w) => w.maps.map((m) => m.mapIndex)));

  // ---- the frontier: M2's door, filled by the pusher's kills (or the wall's, with no time) ----
  let frontier: MapResult['frontier'] = null;
  const pick = selectPusher(state, facts);
  // M2's "hardest-cleared" fallback means every door on the route is open: the gate is the next step, so
  // there is no door to ring (§8 "No frontier").
  if (pick.kind !== 'no-frontier' && pick.frontier.kind !== 'hardest-cleared') {
    const f = pick.frontier;
    const who = pick.kind === 'pusher' ? pick.pusher.index : pick.wall.characterIndex;
    const fight = f.fights.find((x) => x.characterIndex === who);
    frontier = {
      mapIndex: f.mapIndex,
      door: f.door,
      requirement: f.requirement,
      best: fight
        ? {
            characterIndex: who,
            killsLeft: fight.killsLeft,
            // TR-9: kills left over M2's floored kill rate, arithmetic on Toolbox numbers (ADR 0005).
            etaMs:
              pick.kind === 'pusher' && fight.finalKillsPerHour > 0
                ? Math.round((fight.killsLeft / fight.finalKillsPerHour) * 3_600_000)
                : null,
          }
        : null,
    };
  }

  // ---- where everyone stands (the Toolbox map name, matched against the facts) ----
  const byName = new Map<string, number>();
  for (const m of maps) if (!byName.has(m.name)) byName.set(m.name, m.index);
  const markers = people.flatMap((c) => {
    const i = c.currentMap ? byName.get(c.currentMap) : undefined;
    return i === undefined ? [] : [{ characterIndex: c.index, mapIndex: i }];
  });

  // ---- door kills per character, on every shown map: only characters with kills on that door ----
  const doors: MapResult['doors'] = {};
  for (const mapIndex of shown) {
    const m = byIndex.get(mapIndex);
    // A skilling map's door needs a skill level, not kills: only fighting maps carry door kills.
    if (m?.afkType !== 'FIGHTING') continue;
    const rows: MapResult['doors'][number] = [];
    m.doors.forEach((d, door) => {
      if (d.destination === null || d.requirement <= 0) return;
      for (const c of people) {
        const left = killsLeft(c, mapIndex, door);
        // Every character has a row for every map (V-3), so a door with no kills on it is "not reached".
        if (left === null || left >= d.requirement) continue;
        rows.push({
          characterIndex: c.index,
          door,
          done: Math.max(0, d.requirement - left),
          requirement: d.requirement,
        });
      }
    });
    if (rows.length) doors[mapIndex] = rows;
  }

  // ---- overlays ----
  const route = current <= LAST_MAP_WORLD ? pathOf(current).map((d) => d.mapIndex) : [];
  const constellations: MapResult['overlays']['constellations'] = {};
  const stars = (rowsOf<{ constellations?: ConstellationRow[] }>(kb, MAP_FACT.constellations)
    ?.constellations ?? []) as ConstellationRow[];
  for (const s of stars) {
    if (!shown.has(s.mapIndex)) continue;
    const list = constellations[s.mapIndex] ?? [];
    list.push(s.name);
    constellations[s.mapIndex] = list;
  }

  const deathNote: MapResult['overlays']['deathNote'] = {};
  const dn = state.account.deathNote ?? null;
  const ranks = new Map<string, { at: number; reward: string }[]>();
  for (const e of Object.values(kb.entries) as DeathNoteEntry[]) {
    const monster = e.system === 'death-note' ? e.progress?.params?.monster : undefined;
    if (monster && e.milestones)
      ranks.set(
        monster,
        [...e.milestones].sort((a, b) => a.at - b.at),
      );
  }
  const cardRows = rowsOf<Record<string, CardDropRow>>(kb, MAP_FACT.cards) ?? {};
  const owned = state.account.cards ?? null;
  const cards: MapResult['overlays']['cards'] = {};
  for (const mapIndex of shown) {
    const m = byIndex.get(mapIndex);
    if (!m?.target || m.afkType !== 'FIGHTING') continue;
    const kills = dn?.[m.target];
    if (dn !== null && kills !== undefined) {
      const next = ranks.get(m.target)?.find((r) => r.at > kills) ?? null;
      deathNote[mapIndex] = { kills, nextRank: next?.reward ?? null, nextAt: next?.at ?? null };
    }
    const card = cardRows[m.target];
    if (card && owned !== null) {
      const have = owned[m.target];
      cards[mapIndex] = {
        cardId: m.target,
        level: have && have.amount > 0 ? have.stars + 1 : null,
        baseChance: Number.isFinite(card.chance) && card.chance > 0 ? card.chance : null,
      };
    }
  }

  return { worlds, frontier, markers, doors, overlays: { route, constellations, deathNote, cards } };
}

export function createMapModule(): EngineModule {
  return {
    id: 'map',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(input: EngineInput): ModuleOutput {
      const kb = input.knowledge.kb ?? null;
      if (!kb) return { map: null };
      try {
        return { map: buildMap(input.state, kb) };
      } catch {
        return { map: null };
      }
    },
  };
}
