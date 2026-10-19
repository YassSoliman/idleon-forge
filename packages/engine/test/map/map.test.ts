// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-9, FR-M1 to FR-M3, FR-M7, US-9 (area M): the `map` module and the Map place's view, through the
// full engine on the scrubbed public saves. Characters are named by class and level only. The golden
// pipeline has no frontier (it is computed in the parse worker with Toolbox's kill rates), so the US-9
// frontier is the W3-early save's own M2 fight, set on the state the way the worker sets it.
import type { AccountState, Frontier } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { loadSource } from '@idleon-forge/kb-tools/src/load';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';
import { buildMap, buildMapView, createMapModule, MAP_FACT, MAP_WORDS } from '../../src/map';
import { worldRoute } from '../../src/map/module';
import { frontierRoute } from '../../src/metapath/gate-chain';
import { lookupOf } from '../../src/metapath/knowledge';
import { buildMapView as barrelMapView } from '../../src/now';
import { buildNowView, DEFAULT_UI } from '../../src/now/build-now-view';
import { EMPTY_PREFS } from '../../src/now/prefs';
import { renderMapText } from '../../src/now/render-map-text';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const fixture = (id: string) => {
  const f = fixtures.find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  return f;
};
const run = (id: string, edit?: (s: AccountState) => void) => {
  const f = fixture(id);
  const state = stateOf(f);
  edit?.(state);
  const r = goldenResult({
    state,
    kb: ctx.kb,
    registries: ctx.registries,
    now: f.now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
  const view = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: f.now });
  return { state, r, view, v: buildMapView(r, view), now: f.now };
};
const labelOf = (view: ReturnType<typeof run>['view'], i: number) => {
  const row = view.roster.find((x) => x.index === i);
  return row ? `${row.classLabel} ${row.level}` : '?';
};

/** The W3-early save's frontier as M2 reads it: Thermonuclear Climb's door, the Squire 85 at 1,065 an hour. */
function withW3Frontier(state: AccountState) {
  const squire = state.characters.find((c) => c.class === 'Squire' && c.level === 85);
  if (!squire) throw new Error('no Squire 85 on scrubbed-w3');
  const frontier: Frontier = {
    world: 3,
    mapIndex: 109,
    mapName: 'Thermonuclear_Climb',
    door: 0,
    kind: 'uncleared',
    requirement: 15_000,
    routeCleared: state.characters.map((c) => ({
      characterIndex: c.index,
      count: c.index === squire.index ? 8 : 2,
      of: 11,
      reachesFrontier: c.index === squire.index,
    })),
    fights: state.characters.map((c) => ({
      characterIndex: c.index,
      finalKillsPerHour: c.index === squire.index ? 1065 : 0,
      killsPerHour: c.index === squire.index ? 1065.4 : 0,
      hitChance: 36,
      survivability: 100,
      killsLeft: c.index === squire.index ? 14_981 : 15_000,
    })),
  };
  state.account.frontier = frontier;
  return squire.index;
}

describe('US-9 the Map on W3-early (scrubbed-w3)', () => {
  let squire = -1;
  const { v, view, r, state } = run('scrubbed-w3', (s) => {
    squire = withW3Frontier(s);
  });

  it('W1 and W2 fold to one line with their doors; W3 is open; W4 shows dimmed, never locked', () => {
    expect(v?.worlds.map((b) => [b.world, b.state])).toEqual([
      [1, 'done'],
      [2, 'done'],
      [3, 'open'],
      [4, 'next'],
    ]);
    expect(v?.worlds[0]?.line).toMatch(/^\d+ of \d+ route doors open( · \d+ side maps? not reached)?$/);
    expect(v?.worlds[3]?.line).toBe('Opens with the Galaxial Amethyst');
    expect(v?.summary).toBe('3 of 4 worlds open · 6 characters');
  });

  it('R11 QA: "n of n route doors open" never sits beside an unexplained lock on the route', () => {
    for (const b of v?.worlds ?? []) {
      if (b.state === 'next' || b.beyond) continue;
      const locked = b.nodes.filter((n) => n.state === 'locked');
      const side = locked.filter((n) => !n.onRoute).length;
      if (b.cleared === b.total) expect(locked.filter((n) => n.onRoute)).toEqual([]);
      if (side > 0) expect(b.line).toContain(`${side} side map${side === 1 ? '' : 's'} not reached`);
      else expect(b.line).not.toContain('side map');
    }
  });

  it('the boss gates carry their crystal and keys; the next world shows no gate of its own', () => {
    expect(v?.worlds.map((b) => b.gate?.boss ?? null)).toEqual(['Amarok', 'Efaunt', 'Chizoar', null]);
    expect(v?.worlds[0]?.gate?.lines.map((l) => l.text)).toEqual([
      'Desert Topaz handed in',
      '4 keys waiting · 2 earned a day',
    ]);
    expect(v?.worlds[2]?.gate?.lines[0]?.text).toBe('Galaxial Amethyst: 0 of 1 held');
  });

  it("the frontier door is a ring on Thermonuclear Climb, filled by the pusher's kills, with the time", () => {
    const f = v?.frontier;
    expect(f?.mapIndex).toBe(109);
    expect(f?.map).toBe('Thermonuclear Climb');
    expect(f?.to).toBe('Waterlogged Entrance');
    expect(f?.who?.index).toBe(squire);
    expect(f?.who?.label).toBe('Squire 85');
    expect(f?.killsText).toBe('19 of 15,000 kills');
    expect(f?.step).toBe('Kill 14,981 more here to open Waterlogged Entrance');
    // TR-9: kills left over the floored kill rate, from the save's own time (DS-6).
    expect(f?.when).toBe('in 14h 04m');
    expect(r.map?.frontier?.best?.etaMs).toBe(Math.round((14_981 / 1065) * 3_600_000));
  });

  it('six markers sit on their maps; a shared map stacks', () => {
    expect(r.map?.markers).toHaveLength(6);
    const here = (v?.worlds ?? []).flatMap((b) => b.nodes.flatMap((n) => n.here.map((h) => h.index)));
    expect(new Set(here).size).toBe(6);
    const climb = v?.worlds[2]?.nodes.find((n) => n.mapIndex === 109);
    expect(climb?.state).toBe('frontier');
    expect(climb?.here.map((h) => h.label)).toEqual(['Squire 85']);
    expect(climb?.label).toBe('Thermonuclear Climb, next door, Here: Squire 85, 15,000 kills for its door');
  });

  it('the sheet lists who, door progress, the card, the Death Note and the constellations, in that order', () => {
    const sh = v?.sheets[109];
    expect(sh?.who.map((w) => w.label)).toEqual(['Squire 85']);
    expect(sh?.doors).toHaveLength(1);
    expect(sh?.doors[0]?.heading).toBe('Next door: Waterlogged Entrance');
    expect(sh?.doors[0]?.openLine).toBe('0 of 6 characters have it open.');
    expect(sh?.doors[0]?.rows.map((x) => [x.who.label, x.text, x.pusher, x.when])).toEqual([
      ['Squire 85', '19 of 15,000 kills', true, 'in 14h 04m'],
    ]);
    expect(sh?.card).toEqual({ level: null, text: 'Not yet', chance: 'Base drop: 1 in 10,000 kills' });
    expect(sh?.deathNote).toEqual({ kills: '19 kills', next: '24,981 kills to rank 1' });
    expect(sh?.constellations).toEqual(['C-6']);
  });

  it('a skilling map says its door in levels, never in kills (DS-19)', () => {
    const skill = (v?.worlds ?? []).flatMap((b) => b.nodes).filter((n) => n.kind === 'skill' && n.doorText);
    expect(skill.length).toBeGreaterThan(0);
    for (const n of skill) {
      expect(n.doorText).toMatch(/^Lv [\d,]+ for its door$/);
      expect(v?.sheets[n.mapIndex]?.doors).toEqual([]);
    }
  });

  it('FR-M3: each overlay has exactly one ring; Route rings the frontier', () => {
    const rings = v?.overlays.map((o) => [o.overlay, o.ring]);
    expect(rings?.map(([o]) => o)).toEqual(['route', 'constellations', 'deathNote', 'cards']);
    expect(v?.overlays[0]?.ring).toBe(109);
    for (const o of v?.overlays ?? []) {
      if (o.ring !== null && o.overlay !== 'route') expect(o.marked).toContain(o.ring);
      expect(o.ringText.length).toBeGreaterThan(0);
    }
    // Route marks the pusher's path doors (M2's route, town excluded), the frontier among them.
    expect(r.map?.overlays.route[0]).toBe(101);
    expect(r.map?.overlays.route).toContain(109);
  });

  it('FR-M5: every shown map has a sheet, in world order, for the routes', () => {
    expect(v?.maps.length).toBeGreaterThan(40);
    expect(Object.keys(v?.sheets ?? {}).length).toBe(v?.maps.length);
    expect(v?.maps).toEqual([...(v?.maps ?? [])].sort((a, b) => a - b));
  });

  it('the golden text names characters as C1…Cn plus class and level, never a name', () => {
    const text = renderMapText(v, { label: (i) => `C${i + 1}`, classOf: (i) => labelOf(view, i) });
    expect(text).toContain('Frontier: Thermonuclear Climb to Waterlogged Entrance');
    for (const c of state.characters) expect(text).not.toContain(c.name);
  });
});

describe('FR-M7 the map is facts, not advice', () => {
  it('the module emits only the map: no Goals, Verdicts, Next Actions or timeline bars', () => {
    const f = fixture('scrubbed-w3');
    const out = createMapModule().run({
      state: stateOf(f),
      history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
      knowledge: { version: 'test', coverage: () => [], kb: ctx.kb },
      now: f.now,
      options: { expectedReturnSeconds: 3600 },
    });
    expect(Object.keys(out)).toEqual(['map']);
    expect(out.map).not.toBeNull();
  });

  it('without a Knowledge Base the map is null, and the view says nothing', () => {
    const f = fixture('scrubbed-w3');
    const out = createMapModule().run({
      state: stateOf(f),
      history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
      knowledge: { version: 'test', coverage: () => [] },
      now: f.now,
      options: { expectedReturnSeconds: 3600 },
    });
    expect(out.map).toBeNull();
  });
});

describe('§8 states and edge cases', () => {
  it("W2-late with every route door open: no frontier ring, the open world's gate is lit", () => {
    const { v } = run('scrubbed-w2', (s) => {
      const f: Frontier = {
        world: 2,
        mapIndex: 64,
        mapName: 'Sands_of_Time',
        door: 0,
        kind: 'hardest-cleared',
        requirement: 3000,
        routeCleared: s.characters.map((c) => ({
          characterIndex: c.index,
          count: 10,
          of: 10,
          reachesFrontier: true,
        })),
        fights: s.characters.map((c) => ({
          characterIndex: c.index,
          finalKillsPerHour: 500,
          killsPerHour: 500,
          hitChance: 100,
          survivability: 100,
          killsLeft: 0,
        })),
      };
      s.account.frontier = f;
    });
    expect(v?.frontier).toBeNull();
    expect(v?.worlds.find((b) => b.state === 'open')?.gate?.lit).toBe(true);
    expect(v?.overlays[0]?.ringText).toBe("Every door on the route is open; Efaunt's gate comes next");
  });

  it('a W1 account: W1 open plus the W2 gate, dimmed (D-6)', () => {
    const { v } = run('scrubbed-w2', (s) => {
      s.account.currentWorld = 1;
    });
    expect(v?.worlds.map((b) => [b.world, b.state])).toEqual([
      [1, 'open'],
      [2, 'next'],
    ]);
  });

  it('past World 4: the bands fold, and W5 and up is one "not covered yet" band', () => {
    const { v } = run('latest');
    const last = v?.worlds.at(-1);
    expect(last?.beyond).toBe(true);
    expect(last?.heading).toBe('Worlds 5+');
    expect(last?.line).toBe('Not covered yet');
    expect(v?.worlds.filter((b) => !b.beyond).every((b) => b.state === 'done')).toBe(true);
  });

  it('doorKillsLeft missing: nodes say no state and the sheets hide the door rows (DS-3)', () => {
    const { v } = run('scrubbed-w3', (s) => {
      for (const c of s.characters) c.doorKillsLeft = null;
    });
    const nodes = (v?.worlds ?? []).flatMap((b) => b.nodes).filter((n) => n.kind === 'fight');
    expect(nodes.every((n) => n.state === 'unknown')).toBe(true);
    expect(Object.values(v?.sheets ?? {}).every((sh) => sh.doors.length === 0)).toBe(true);
  });

  it('no current world: no map', () => {
    const { r } = run('scrubbed-w3', (s) => {
      s.account.currentWorld = null;
    });
    expect(r.map).toBeNull();
  });
});

describe('facts', () => {
  it("V-3: every character's door kills follow maps.fact.maps door order, on every public save", () => {
    const maps = (ctx.kb.facts[MAP_FACT.maps] as unknown as { rows: { index: number; doors: unknown[] }[] })
      .rows;
    const doors = new Map(maps.map((m) => [m.index, m.doors.length]));
    let checked = 0;
    for (const f of fixtures) {
      const state = stateOf(f);
      for (const c of state.characters)
        for (const [k, row] of Object.entries(c.doorKillsLeft ?? {})) {
          if (!Array.isArray(row) || row.length === 0 || !doors.has(Number(k))) continue;
          expect(row.length, `${f.id} map ${k}`).toBe(doors.get(Number(k)));
          checked++;
        }
    }
    expect(checked).toBeGreaterThan(1000);
  }, 120_000);

  it('the compiled bundle ships map.fact.boss-gates (map.facts.yaml, with its wiki Sources)', () => {
    const src = loadSource();
    const fact = src.facts.find((x) => x.value.id === MAP_FACT.bossGates)?.value;
    expect(fact?.sources.every((s) => s.tier === 2 && s.url.startsWith('https://idleon.wiki/'))).toBe(true);
    // Shipped through kb-tools' ENGINE_FACTS: no entry or Detector names it (FR-M7).
    const shipped = ctx.kb.facts[MAP_FACT.bossGates] as unknown as {
      rows: { world: number; bossMap: number }[];
    };
    expect(shipped?.rows).toEqual(fact?.rows);
    expect(shipped.rows.map((g) => g.world)).toEqual([1, 2, 3, 4]);
    // Each boss arena is a real map of its world.
    const maps = (ctx.kb.facts[MAP_FACT.maps] as unknown as { rows: { index: number; world: number }[] })
      .rows;
    for (const g of shipped.rows) expect(maps.find((m) => m.index === g.bossMap)?.world).toBe(g.world);
  });

  it("the map's route per world is M2's frontier route", () => {
    const facts = lookupOf(ctx.kb);
    for (const w of [1, 2, 3, 4]) expect(worldRoute(facts, w)).toEqual(frontierRoute(facts, w));
  });

  it('the barrel buildMapView is the map view itself', () => {
    const { r, view, v } = run('scrubbed-w3');
    expect(barrelMapView(r, view)).toEqual(v);
    expect(buildMap(stateOf(fixture('scrubbed-w3')), ctx.kb)?.worlds).toHaveLength(4);
  });

  it('the map words carry units and no advice verbs beyond the push step', () => {
    expect(MAP_WORDS.kills(19, 15_000)).toBe('19 of 15,000 kills');
    expect(MAP_WORDS.keysWaiting(4, 2)).toBe('4 keys waiting · 2 earned a day');
    expect(MAP_WORDS.keysWaiting(0, 0)).toBe('No one earns these keys yet');
  });
});

describe('M24: the Route rows, the constellation grid and the Death Note tab (scrubbed-w3)', () => {
  const { v } = run('scrubbed-w3');

  it('lays each world out as its route path in walking order, town first, then side and skilling maps', () => {
    const w3 = v?.worlds.find((b) => b.world === 3);
    expect(w3?.route[0]?.node.state).toBe('town');
    expect(w3?.route[0]?.need).toBeNull();
    // The door kills sit on the map after the door: the Waterlogged Entrance stop carries 15k.
    expect(w3?.route.find((r) => r.node.name === 'Waterlogged Entrance')?.need).toBe('15k');
    const onRoute = new Set(w3?.route.map((r) => r.node.mapIndex));
    expect(w3?.side.every((n) => n.kind === 'fight' && !onRoute.has(n.mapIndex))).toBe(true);
    expect(w3?.skill.every((n) => n.kind === 'skill')).toBe(true);
  });

  it('gives every W1 to W3 constellation one state from the save, claimed ones included', () => {
    const stars = v?.stars ?? [];
    expect(stars).toHaveLength(26);
    expect(stars.find((x) => x.code === 'A-2')?.state).toBe('claimed');
    expect(stars.find((x) => x.code === 'C-2')?.progress).toBe('2 of 4');
    expect(new Set(stars.map((x) => x.state))).toEqual(new Set(['claimed', 'reach', 'far']));
  });

  it('lists the Death Note maps closest to their next rank first, with the 7 ranks and the building', () => {
    const dn = v?.deathNote ?? [];
    expect(dn.length).toBe(5);
    expect(dn[0]?.ranks).toEqual([25_000, 100_000, 250_000, 500_000, 1_000_000, 5_000_000, 100_000_000]);
    const left = dn.map((r) => r.left ?? 0);
    expect(left).toEqual([...left].sort((a, b) => a - b));
    expect(v?.deathNoteBuilding).toEqual({
      level: 0,
      inBuildSlot: true,
      cost: { item: 'Explosive Salts', amount: 10, held: 0 },
    });
  });
});

describe('M24: the World 4 door ladder (a W4 account, MapW4)', () => {
  it("walks past the gate path's third map door by door, to the 300k door", () => {
    const { v } = run('first');
    const w4 = v?.worlds.find((b) => b.world === 4);
    expect(w4?.route.length).toBeGreaterThanOrEqual(13);
    expect(w4?.route.map((r) => r.need)).toContain('300k');
    expect(w4?.side.length).toBeLessThan(3);
  });
});
