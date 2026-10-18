// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 TR-3, TR-14: the route grammar. Every row of FR-7, both legacy `?c=` rewrites, the overview
// anchors, collisions and junk input; `parseRoute` is total.
import { describe, expect, it } from 'vitest';
import { characterTabs } from '../src/now/character-tabs';
import { formatRoute, parseRoute, placeOf, type Route, routeKey, routeOfHash } from '../src/shell/route';

const known = {
  tabs: characterTabs.map((t) => t.id),
  systems: ['refinery', 'alchemy-bubbles', 'post-office'],
  indexes: [0, 1, 2, 3],
  timeline: false,
  maps: [0, 1, 2, 30],
  map: false,
};
const r = (hash: string, search = '') => parseRoute(hash, search, known);

describe('parseRoute (FR-7)', () => {
  it('reads every place and page', () => {
    expect(r('').route).toEqual({ place: 'now' });
    expect(r('#now').route).toEqual({ place: 'now' });
    expect(r('#characters').route).toEqual({ place: 'characters', section: null });
    expect(r('#now-3').route).toEqual({ place: 'character', index: 3, tab: 'now' });
    expect(r('#build-3').route).toEqual({ place: 'character', index: 3, tab: 'build' });
    expect(r('#cards-2').route).toEqual({ place: 'character', index: 2, tab: 'cards' });
    expect(r('#systems').route).toEqual({ place: 'systems' });
    expect(r('#system-alchemy-bubbles').route).toEqual({ place: 'system', id: 'alchemy-bubbles' });
  });

  it('opens Characters at an overview for #builds and #cards', () => {
    expect(r('#builds').route).toEqual({ place: 'characters', section: 'builds' });
    expect(r('#cards').route).toEqual({ place: 'characters', section: 'cards' });
  });

  it('opens Now for anything unknown, with no rewrite', () => {
    for (const hash of [
      '#system-nonsense',
      '#build-99',
      '#spend-plan',
      '#timeline',
      '#nope-1',
      '#system-',
      '#',
      '#NOW',
      '#build-1x',
      '#<script>',
    ])
      expect(r(hash)).toEqual({ route: { place: 'now' }, rewrite: null });
  });

  it('rewrites a legacy ?c= once, keeping its tab (D-2)', () => {
    expect(r('', '?c=3')).toEqual({ route: { place: 'character', index: 3, tab: 'now' }, rewrite: '#now-3' });
    expect(r('#build-3', '?c=3')).toEqual({
      route: { place: 'character', index: 3, tab: 'build' },
      rewrite: '#build-3',
    });
    expect(r('#build-2', '?c=3').rewrite).toBe('#now-3');
    expect(r('', '?c=x').rewrite).toBeNull();
    expect(r('', '?c=99')).toEqual({ route: { place: 'now' }, rewrite: '#now-99' });
  });

  it('shows the Timeline only once it exists (Phase 2)', () => {
    expect(routeOfHash('#timeline', { ...known, timeline: true })).toEqual({
      place: 'timeline',
      section: null,
    });
  });

  it('round-trips through formatRoute', () => {
    const routes: Route[] = [
      { place: 'now' },
      { place: 'characters', section: null },
      { place: 'characters', section: 'cards' },
      { place: 'character', index: 1, tab: 'build' },
      { place: 'systems' },
      { place: 'system', id: 'refinery' },
    ];
    for (const route of routes) expect(r(formatRoute(route)).route).toEqual(route);
  });

  it('can\'t collide: no tab id is "system" and every tab id is lower-case letters', () => {
    for (const t of characterTabs) {
      expect(t.id).not.toBe('system');
      expect(t.id).toMatch(/^[a-z]+$/);
    }
  });

  it('runs in well under 0.1 ms (TR-11)', () => {
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) r('#system-alchemy-bubbles', '?c=2');
    expect((performance.now() - t0) / 1000).toBeLessThan(0.1);
  });

  it('can\'t route to a tab named "map": no character tab takes the Map\'s prefix', () => {
    for (const t of characterTabs) expect(t.id).not.toBe('map');
  });
});

describe('M21 routes (TR-6)', () => {
  const on = { ...known, timeline: true, map: true };
  it.each([
    ['#map', { place: 'map', mapIndex: null }],
    ['#map-1', { place: 'map', mapIndex: 1 }],
    ['#map-30', { place: 'map', mapIndex: 30 }],
    ['#map-99', { place: 'map', mapIndex: null }],
    ['#map-0', { place: 'map', mapIndex: 0 }],
    ['#daily', { place: 'timeline', section: 'daily' }],
    ['#slots', { place: 'timeline', section: 'slots' }],
    ['#timeline', { place: 'timeline', section: null }],
    ['#map-', { place: 'now' }],
    ['#map-1x', { place: 'now' }],
    ['#maps', { place: 'now' }],
    ['#MAP', { place: 'now' }],
    ['#daily-1', { place: 'now' }],
  ] as const)('%s → %o', (hash, route) => {
    expect(routeOfHash(hash, on)).toEqual(route);
  });

  it('checks #map-<n> before the #<tab>-<index> pattern, even with a "map" tab registered', () => {
    const clash = { ...on, tabs: [...on.tabs, 'map'] };
    expect(routeOfHash('#map-2', clash)).toEqual({ place: 'map', mapIndex: 2 });
  });

  it('opens Now for the Map and Timeline sections until those places exist', () => {
    for (const hash of ['#map', '#map-1', '#map-99'])
      expect(routeOfHash(hash, known)).toEqual({ place: 'now' });
    for (const hash of ['#daily', '#slots']) expect(routeOfHash(hash, known)).toEqual({ place: 'now' });
  });

  it('round-trips through formatRoute', () => {
    const routes: Route[] = [
      { place: 'map', mapIndex: null },
      { place: 'map', mapIndex: 2 },
      { place: 'timeline', section: null },
      { place: 'timeline', section: 'daily' },
      { place: 'timeline', section: 'slots' },
    ];
    for (const route of routes) expect(routeOfHash(formatRoute(route), on)).toEqual(route);
  });

  it('keeps one scroll key per Map and Timeline place', () => {
    expect(routeKey({ place: 'map', mapIndex: 3 })).toBe('#map');
    expect(routeKey({ place: 'timeline', section: 'daily' })).toBe('#timeline');
  });

  it('places the Map in its own place', () => {
    expect(placeOf({ place: 'map', mapIndex: null })).toBe('map');
    expect(placeOf({ place: 'timeline', section: 'slots' })).toBe('timeline');
  });
});
