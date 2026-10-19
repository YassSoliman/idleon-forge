// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-M1 to FR-M5, TR-9: the Map place's view (area M). A pure join of the worker's `MapResult` with
// the Roster's names, on the UI thread (M4 TR-9). It computes nothing new (D-18): the bands, the gate
// lines, the frontier ring and its time, the node states, the four overlays with their one ring each,
// and one sheet per map in the FR-M2 order. Only the lazy Map place and the golden call it.
import { humanize } from '@idleon-forge/account-state';
import { clockAt, inSpan } from '../now/format';
import type { MapView, NowView } from '../now/view';
import { WORLD_NAMES } from '../now/words/shared';
import type { EngineResult, MapResult } from '../result';
import { MAP_WORDS as W } from './words';

export type MapOverlay = 'route' | 'constellations' | 'deathNote' | 'cards';
export const MAP_OVERLAYS: readonly MapOverlay[] = ['route', 'constellations', 'deathNote', 'cards'];

export type MapNodeState = 'town' | 'cleared' | 'frontier' | 'reached' | 'locked' | 'unknown';

/** One character as the map draws it: a who-glyph plus "Squire 85" (never a name, never a slot code). */
export interface MapWho {
  index: number;
  classLabel: string;
  level: number;
  /** "Squire 85". */
  label: string;
}

export interface MapNodeView {
  mapIndex: number;
  /** "Thermonuclear Climb". */
  name: string;
  kind: 'fight' | 'skill' | 'town' | 'other';
  state: MapNodeState;
  /** Characters standing here, in Roster order. */
  here: MapWho[];
  /** The first door's requirement ("15,000 kills for its door"); null without a door. */
  doorText: string | null;
  /** A short requirement tag for the tile ("15k"); null without a door. */
  doorTag: string | null;
  /** On the pusher's route (the Route overlay). */
  onRoute: boolean;
  /** The button's accessible name: the map, its state in words, who is here and its door. */
  label: string;
}

export interface MapGateView {
  boss: string;
  bossMap: number | null;
  state: 'done' | 'open' | 'locked';
  /** The open world's gate when every route door is open and no door is left to ring: the next step. */
  lit: boolean;
  /** The crystal line, then the keys line; a line whose fact is unknown is hidden (DS-3). */
  lines: { kind: 'crystal' | 'keys'; text: string }[];
}

export interface MapBandView {
  world: number;
  /** "World 3 · Frostbite Tundra". */
  heading: string;
  state: 'done' | 'open' | 'next';
  /** W5 and up: one folded "not covered yet" band. */
  beyond: boolean;
  /** "7 of 12 doors open"; for the next world, what opens it. */
  line: string;
  cleared: number;
  total: number;
  gate: MapGateView | null;
  nodes: MapNodeView[];
  /** Everyone standing in this world (the folded band's glyph stack). */
  here: MapWho[];
  /**
   * M24 (the Route board): the route path in walking order, town first, each stop with the door's kill
   * count on the map before it ("8k", null for the town) and whether it is the door the frontier opens.
   * Empty when the facts have no path for this world.
   */
  route: { node: MapNodeView; need: string | null; next: boolean }[];
  /** M24: the fighting maps off the route path (side maps). */
  side: MapNodeView[];
  /** M24: the skilling maps. */
  skill: MapNodeView[];
}

/** M24 (the Constellations tab): one constellation, by world. */
export interface MapStarView {
  /** "A-9". */
  code: string;
  world: number;
  mapIndex: number;
  /** "Rollin' Tundra", or null when the map is not on the map (an arena, a colosseum). */
  map: string | null;
  requirement: string;
  points: number;
  /** "5 of 3". */
  progress: string;
  state: 'claimed' | 'ready' | 'reach' | 'far';
}

/** M24 (the Death Note tab): one map's Death Note kills against its ranks. */
export interface MapDeathNoteRow {
  mapIndex: number;
  map: string;
  kills: number;
  /** The rank thresholds in kills, ascending. */
  ranks: number[];
  /** Ranks reached. */
  rank: number;
  /** "17,857 kills to rank 1"; "Top rank reached". */
  next: string;
  left: number | null;
  who: MapWho[];
}

export interface MapFrontierView {
  mapIndex: number;
  /** "Thermonuclear Climb". */
  map: string;
  /** "Waterlogged Entrance"; null when the door's destination isn't in the facts. */
  to: string | null;
  world: number;
  who: MapWho | null;
  done: number;
  requirement: number;
  /** "19 of 15,000 kills". */
  killsText: string;
  /** "Kill 14,981 more here to open Waterlogged Entrance"; "Nobody can fight here yet" without a fighter. */
  step: string;
  /** "in 14h 04m" from the save's own kill rate; null when nobody can fight there (DS-3). */
  when: string | null;
}

export interface MapSheetDoorRow {
  who: MapWho;
  done: number;
  requirement: number;
  /** "19 of 15,000 kills". */
  text: string;
  open: boolean;
  /** The pusher on the frontier door, with its time. */
  pusher: boolean;
  when: string | null;
}

export interface MapSheetView {
  mapIndex: number;
  title: string;
  /** "World 3 · Frostbite Tundra". */
  world: string;
  state: MapNodeState;
  /** The state chip's word ("Next door"); null for a plain map. */
  chip: string | null;
  /** 1. who is here. */
  who: MapWho[];
  /** 2. door progress per character, per door; empty when the save has no door kills (DS-3). */
  doors: { heading: string; line: string; openLine: string; rows: MapSheetDoorRow[] }[];
  /** 3. the map's card. */
  card: { level: number | null; text: string; chance: string | null } | null;
  /** 4. its Death Note kills against the next rank. */
  deathNote: { kills: string; next: string } | null;
  /** 5. the constellations on this map. */
  constellations: string[];
}

export interface MapOverlayView {
  overlay: MapOverlay;
  label: string;
  /** Maps this overlay has something on; every other node is grey. */
  marked: number[];
  /** The overlay's one ring (P9); null when there is none. */
  ring: number | null;
  /** Why that one, under the grid. */
  ringText: string;
}

export interface MapPlaceView extends MapView {
  worlds: MapBandView[];
  /** "3 of 4 worlds open · 6 characters". */
  summary: string;
  frontier: MapFrontierView | null;
  overlays: MapOverlayView[];
  sheets: Record<number, MapSheetView>;
  /** Every map index with a sheet, in world order (the routes' `known.maps`). */
  maps: number[];
  /** M24: every constellation the facts cover, in fact order; null without the star-sign state. */
  stars: MapStarView[] | null;
  /** M24: the Death Note's maps, closest to its next rank first. */
  deathNote: MapDeathNoteRow[];
  /** M24: the Death Note building (level, building now, the next level's cost and holding). */
  deathNoteBuilding: MapResult['deathNoteBuilding'] | null;
}

const pretty = (name: string) => humanize(name).replace(/\s+/g, ' ').trim();
const tag = (n: number) =>
  n >= 1_000_000
    ? `${Math.round(n / 100_000) / 10}M`
    : n >= 1000
      ? `${Math.round(n / 100) / 10}k`
      : String(n);

const NODE_WORD: Record<MapNodeState, string> = {
  town: W.stateTown,
  cleared: W.stateCleared,
  frontier: W.stateFrontier,
  reached: W.stateReached,
  locked: W.stateLocked,
  unknown: '',
};

export interface MapViewOptions {
  /** Epoch ms for the frontier's "in 14h 04m"; the save's own time when omitted (goldens). */
  now?: number;
  /** M21 G10, the Times setting: 'clock' says the frontier's time as "around 20:10". */
  times?: 'relative' | 'clock';
  /** Minutes east of UTC for the clock form; 0 when omitted. */
  tzOffsetMinutes?: number;
}

/** M21 TR-9: the Map place's view; null without the map module's data. */
export function buildMapView(
  result: EngineResult,
  view: NowView,
  opts: MapViewOptions = {},
): MapPlaceView | null {
  const map: MapResult | null | undefined = result.map;
  if (!map) return null;
  const now = opts.now ?? result.asOf;
  const rows = new Map(view.roster.map((r) => [r.index, r]));
  const order = new Map(view.roster.map((r, i) => [r.index, i]));
  const whoOf = (index: number): MapWho | null => {
    const r = rows.get(index);
    if (r) return { index, classLabel: r.classLabel, level: r.level, label: `${r.classLabel} ${r.level}` };
    const c = result.characters.find((x) => x.index === index);
    return c
      ? { index, classLabel: c.classLabel, level: c.level, label: `${c.classLabel} ${c.level}` }
      : null;
  };
  const byOrder = (a: MapWho, b: MapWho) => (order.get(a.index) ?? 99) - (order.get(b.index) ?? 99);

  const names = new Map<number, string>();
  const worldOf = new Map<number, number>();
  for (const w of map.worlds)
    for (const m of w.maps) {
      names.set(m.mapIndex, pretty(m.name));
      worldOf.set(m.mapIndex, w.world);
    }
  const nameOf = (i: number) => names.get(i) ?? null;
  const here = new Map<number, MapWho[]>();
  for (const mk of map.markers) {
    const who = whoOf(mk.characterIndex);
    if (who) here.set(mk.mapIndex, [...(here.get(mk.mapIndex) ?? []), who].sort(byOrder));
  }
  const route = new Set(map.overlays.route);
  const doorsKnown = Object.keys(map.doors).length > 0;
  const f = map.frontier;

  const nodeState = (mapIndex: number, kind: string): MapNodeState => {
    if (kind === 'town') return 'town';
    // A skilling map's door opens on a skill level, which door kills don't tell: no state claimed.
    if (kind === 'skill')
      return f && f.mapIndex === mapIndex ? 'frontier' : here.has(mapIndex) ? 'reached' : 'unknown';
    if (f && f.mapIndex === mapIndex) return 'frontier';
    if (!doorsKnown) return 'unknown';
    const rowsHere = map.doors[mapIndex] ?? [];
    if (rowsHere.some((r) => r.door === 0 && r.done >= r.requirement)) return 'cleared';
    // Someone standing here has reached it, even with no kills on its door yet.
    if (rowsHere.length || here.has(mapIndex)) return 'reached';
    return 'locked';
  };

  // ---- the frontier ring ----
  let frontier: MapFrontierView | null = null;
  if (f) {
    const node = map.worlds.flatMap((w) => w.maps).find((m) => m.mapIndex === f.mapIndex);
    const toIndex = node?.doors.find((d) => d.requirement === f.requirement)?.destination ?? null;
    const to = toIndex !== null ? nameOf(toIndex) : null;
    const who = f.best ? whoOf(f.best.characterIndex) : null;
    const done = f.best ? Math.max(0, f.requirement - f.best.killsLeft) : 0;
    const left = f.best?.killsLeft ?? f.requirement;
    const eta = f.best?.etaMs ?? null;
    frontier = {
      mapIndex: f.mapIndex,
      map: nameOf(f.mapIndex) ?? pretty(String(f.mapIndex)),
      to,
      world: worldOf.get(f.mapIndex) ?? 0,
      who,
      done,
      requirement: f.requirement,
      killsText: W.kills(done, f.requirement),
      step: eta === null ? W.noFighter : to ? W.push(left, to) : W.pushAny(left),
      when:
        eta === null
          ? null
          : opts.times === 'clock' && result.asOf + eta > now
            ? `around ${clockAt(result.asOf + eta, opts.tzOffsetMinutes ?? 0)}`
            : inSpan(Math.max(0, result.asOf + eta - now)),
    };
  }

  // ---- the bands ----
  const worlds: MapBandView[] = map.worlds.map((w) => {
    if (w.maps.length === 0 && w.world > 4)
      return {
        world: w.world,
        heading: W.notCoveredHeading,
        state: 'open' as const,
        beyond: true,
        line: W.notCoveredLine,
        cleared: 0,
        total: 0,
        gate: null,
        nodes: [],
        here: [],
        route: [],
        side: [],
        skill: [],
      };
    const nodes: MapNodeView[] = w.maps.map((m) => {
      const state = nodeState(m.mapIndex, m.kind);
      const need = m.doors[0]?.requirement ?? null;
      const who = here.get(m.mapIndex) ?? [];
      const name = pretty(m.name);
      // A skilling map's door needs a skill level (maps.fact.maps), a fighting map's a kill count.
      const doorText =
        need === null || m.kind === 'town'
          ? null
          : m.kind === 'skill'
            ? W.doorLevel(need)
            : W.doorNeeds(need);
      const parts = [
        name,
        NODE_WORD[state],
        who.length ? W.hereList(who.map((x) => x.label)) : '',
        doorText ?? '',
      ].filter(Boolean);
      return {
        mapIndex: m.mapIndex,
        name,
        kind: m.kind,
        state,
        here: who,
        doorText,
        doorTag:
          doorText === null || need === null ? null : m.kind === 'skill' ? W.levelTag(need) : tag(need),
        onRoute: route.has(m.mapIndex),
        label: parts.join(', '),
      };
    });
    // R11 QA: the locked maps off the route; the door count is the route's own.
    const side = nodes.filter((n) => n.state === 'locked' && !n.onRoute).length;
    const g = w.gate;
    const gateState: MapGateView['state'] =
      w.state === 'done' ? 'done' : w.state === 'open' ? 'open' : 'locked';
    const lines: MapGateView['lines'] = [];
    if (g?.crystal)
      lines.push({
        kind: 'crystal',
        text:
          w.state === 'done'
            ? W.crystalIn(pretty(g.crystal.item))
            : g.crystal.held !== null
              ? W.crystalHeld(pretty(g.crystal.item), g.crystal.held, g.crystal.need)
              : '',
      });
    if (g && g.keysHeld !== null && g.keysPerDay !== null && w.state !== 'next')
      lines.push({ kind: 'keys', text: W.keysWaiting(g.keysHeld, g.keysPerDay) });
    const prev = map.worlds.find((x) => x.world === w.world - 1);
    const byNode = new Map(nodes.map((n) => [n.mapIndex, n]));
    const routeSteps: { node: MapNodeView; need: string | null; next: boolean }[] = (w.route ?? []).flatMap(
      (r, i, all) => {
        const node = byNode.get(r.mapIndex);
        const prev = all[i - 1];
        return node
          ? [{ node, need: r.need !== null ? tag(r.need) : null, next: !!f && prev?.mapIndex === f.mapIndex }]
          : [];
      },
    );
    // The facts' path can end at the world's gate NPC well before its last map (W4: its third of 13);
    // then the route walks on door by door (each map's first door to a map of this world), so the whole
    // door ladder shows. A path that already covers most of the world (W1 to W3) is left as it is.
    const raw = new Map(w.maps.map((m) => [m.mapIndex, m]));
    const fights = nodes.filter((n) => n.kind === 'fight').length;
    const short = routeSteps.length > 0 && routeSteps.length * 2 < fights;
    for (let guard = 0; short && guard < 40; guard++) {
      const last = routeSteps[routeSteps.length - 1];
      const door = last ? raw.get(last.node.mapIndex)?.doors[0] : undefined;
      const node = door ? byNode.get(door.destination) : undefined;
      if (
        !door ||
        !node ||
        node.kind !== 'fight' ||
        routeSteps.some((r) => r.node.mapIndex === node.mapIndex)
      )
        break;
      routeSteps.push({ node, need: tag(door.requirement), next: !!f && last?.node.mapIndex === f.mapIndex });
    }
    const onPath = new Set(routeSteps.map((r) => r.node.mapIndex));
    // The locked fighting maps off the walked route (M24: the route now runs past the gate's path).
    const sideOff = routeSteps.length
      ? nodes.filter((n) => n.state === 'locked' && n.kind === 'fight' && !onPath.has(n.mapIndex)).length
      : side;
    const line =
      w.state === 'next'
        ? prev?.gate?.crystal
          ? W.opensWith(pretty(prev.gate.crystal.item))
          : prev?.gate
            ? W.opensAfter(prev.gate.boss)
            : ''
        : w.state === 'done'
          ? W.fold(w.cleared, w.total, sideOff)
          : W.doorsOpen(w.cleared, w.total, sideOff);
    return {
      world: w.world,
      route: routeSteps,
      side: nodes.filter((n) => n.kind === 'fight' && !onPath.has(n.mapIndex)),
      skill: nodes.filter((n) => n.kind === 'skill' && !onPath.has(n.mapIndex)),
      heading: WORLD_NAMES[w.world] ?? `World ${w.world}`,
      state: w.state,
      beyond: false,
      line,
      cleared: w.cleared,
      total: w.total,
      // A dimmed next world shows what opens it, not its own exit gate.
      gate:
        g && w.state !== 'next'
          ? {
              boss: g.boss,
              bossMap: g.bossMap,
              state: gateState,
              lit: w.state === 'open' && !f && w.total > 0 && w.cleared >= w.total,
              lines: lines.filter((l) => l.text),
            }
          : null,
      nodes,
      here: nodes.flatMap((n) => n.here).sort(byOrder),
    };
  });

  // ---- the sheets (FR-M2 order) ----
  const sheets: Record<number, MapSheetView> = {};
  const maps: number[] = [];
  for (const band of worlds)
    for (const n of band.nodes) {
      maps.push(n.mapIndex);
      const node = map.worlds.flatMap((w) => w.maps).find((m) => m.mapIndex === n.mapIndex);
      const doorRows = map.doors[n.mapIndex] ?? [];
      const doorIds = [...new Set(doorRows.map((r) => r.door))].sort((a, b) => a - b);
      const doors = doorIds.flatMap((doorIndex, i) => {
        const these = doorRows
          .filter((r) => r.door === doorIndex)
          .flatMap((r) => {
            const who = whoOf(r.characterIndex);
            if (!who) return [];
            const pusher =
              f?.mapIndex === n.mapIndex && f.door === r.door && f.best?.characterIndex === r.characterIndex;
            return [
              {
                who,
                done: r.done,
                requirement: r.requirement,
                text: W.kills(r.done, r.requirement),
                open: r.done >= r.requirement,
                pusher,
                when: pusher ? (frontier?.when ?? null) : null,
              },
            ];
          })
          .sort((a, b) => Number(b.pusher) - Number(a.pusher) || b.done - a.done || byOrder(a.who, b.who));
        const need = these[0]?.requirement;
        if (need === undefined) return [];
        // The door's destination: the node's door with that requirement (the facts keep both in door order).
        const dest = node?.doors.find((d) => d.requirement === need)?.destination;
        const to = dest !== undefined ? nameOf(dest) : null;
        return [
          {
            heading: to ? W.sheetDoor(to) : W.sheetDoorAny(i + 1),
            line: W.sheetDoorLine(need),
            openLine: W.sheetDoorOpen(these.filter((r) => r.open).length, result.characters.length),
            rows: these,
          },
        ];
      });
      const card = map.overlays.cards[n.mapIndex];
      const dn = map.overlays.deathNote[n.mapIndex];
      sheets[n.mapIndex] = {
        mapIndex: n.mapIndex,
        title: n.name,
        world: band.heading,
        state: n.state,
        chip: n.state === 'frontier' ? W.nextDoor : null,
        who: n.here,
        doors,
        card: card
          ? {
              level: card.level,
              text: card.level !== null ? W.cardLevel(card.level) : W.cardNotYet,
              chance: card.baseChance ? W.cardChance(Math.round(1 / card.baseChance)) : null,
            }
          : null,
        deathNote: dn
          ? {
              kills: W.deathNoteKills(dn.kills),
              next:
                dn.nextAt !== null && dn.nextRank
                  ? W.deathNoteNext(dn.nextAt - dn.kills, dn.nextRank)
                  : W.deathNoteTop,
            }
          : null,
        constellations: map.overlays.constellations[n.mapIndex] ?? [],
      };
    }

  // ---- the overlays: one ring each (FR-M3, P9) ----
  const open = worlds.find((b) => b.state === 'open');
  const shownNodes = worlds.flatMap((b) => b.nodes);
  const starRing =
    open?.nodes.find(
      (n) =>
        (map.overlays.constellations[n.mapIndex]?.length ?? 0) > 0 &&
        (map.doors[n.mapIndex]?.length ?? 0) > 0,
    ) ?? null;
  const dnEntries = Object.entries(map.overlays.deathNote)
    .map(([k, v]) => ({
      mapIndex: Number(k),
      left: v.nextAt !== null ? v.nextAt - v.kills : null,
      rank: v.nextRank,
    }))
    .filter((x): x is { mapIndex: number; left: number; rank: string } => x.left !== null && x.rank !== null)
    .sort((a, b) => a.left - b.left || a.mapIndex - b.mapIndex);
  const cardRing =
    Object.entries(map.overlays.cards)
      .map(([k, v]) => ({ mapIndex: Number(k), ...v }))
      .filter((c) => c.level === null && c.baseChance !== null)
      .sort((a, b) => (b.baseChance ?? 0) - (a.baseChance ?? 0) || a.mapIndex - b.mapIndex)[0] ?? null;
  const dnRing = dnEntries[0] ?? null;
  const nm = (i: number) => nameOf(i) ?? String(i);
  const litGate = worlds.find((b) => b.gate?.lit);
  const overlays: MapOverlayView[] = [
    {
      overlay: 'route',
      label: W.overlayRoute,
      marked: shownNodes.filter((n) => n.onRoute).map((n) => n.mapIndex),
      ring: f?.mapIndex ?? null,
      ringText: f ? W.ringRoute(nm(f.mapIndex)) : litGate?.gate ? W.ringGate(litGate.gate.boss) : W.ringNone,
    },
    {
      overlay: 'constellations',
      label: W.overlayStars,
      marked: shownNodes
        .filter((n) => map.overlays.constellations[n.mapIndex]?.length)
        .map((n) => n.mapIndex),
      ring: starRing?.mapIndex ?? null,
      ringText: starRing
        ? W.ringStars(map.overlays.constellations[starRing.mapIndex]?.[0] ?? '', starRing.name)
        : W.ringNone,
    },
    {
      overlay: 'deathNote',
      label: W.overlayDeathNote,
      marked: Object.keys(map.overlays.deathNote).map(Number),
      ring: dnRing?.mapIndex ?? null,
      ringText: dnRing ? W.ringDeathNote(nm(dnRing.mapIndex), dnRing.left, dnRing.rank) : W.ringNone,
    },
    {
      overlay: 'cards',
      label: W.overlayCards,
      marked: Object.keys(map.overlays.cards).map(Number),
      ring: cardRing?.mapIndex ?? null,
      ringText: cardRing ? W.ringCards(nm(cardRing.mapIndex)) : W.ringNone,
    },
  ];

  // ---- M24: the Constellations and Death Note tabs ----
  const stars: MapStarView[] | null = map.stars
    ? map.stars.map((x) => ({
        code: x.name,
        world: x.world,
        mapIndex: x.mapIndex,
        map: nameOf(x.mapIndex),
        requirement: x.requirement,
        points: x.points,
        progress: W.starProgress(x.progress, x.players),
        state: x.state,
      }))
    : null;
  const deathNote: MapDeathNoteRow[] = Object.entries(map.overlays.deathNote)
    .map(([k, d]) => {
      const mapIndex = Number(k);
      const ranks = map.deathNoteRanks?.[mapIndex] ?? (d.nextAt !== null ? [d.nextAt] : []);
      return {
        mapIndex,
        map: nm(mapIndex),
        kills: d.kills,
        ranks,
        rank: ranks.filter((r) => d.kills >= r).length,
        next:
          d.nextAt !== null && d.nextRank ? W.deathNoteNext(d.nextAt - d.kills, d.nextRank) : W.deathNoteTop,
        left: d.nextAt !== null ? d.nextAt - d.kills : null,
        who: here.get(mapIndex) ?? [],
      };
    })
    .sort(
      (a, b) =>
        (a.left ?? Number.POSITIVE_INFINITY) - (b.left ?? Number.POSITIVE_INFINITY) ||
        a.mapIndex - b.mapIndex,
    );

  const covered = worlds.filter((b) => !b.beyond);
  return {
    stars,
    deathNote,
    deathNoteBuilding: map.deathNoteBuilding ?? null,
    worlds,
    summary: W.summary(
      covered.filter((b) => b.state !== 'next').length,
      covered.length,
      result.characters.length,
    ),
    frontier,
    overlays,
    sheets,
    maps,
  };
}
