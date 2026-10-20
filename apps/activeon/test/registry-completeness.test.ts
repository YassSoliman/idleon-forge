// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-0b (1), G1: every System in packages/knowledge/systems.yaml has a home (the engine's
// SYSTEM_HOMES) and a page (apps/activeon/src/systems/pages.ts), so a new registry row can't land
// without a findable place. A home that is a Character page tab or the Timeline is its own page.
// The Systems homed before M26 without a row are listed in PENDING with the wave that draws them
// (spec section 9); the list only shrinks: a System that gains its home must leave it.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SYSTEM_HOMES } from '@idleon-forge/engine/now';
import { describe, expect, it } from 'vitest';
import { FULL_PAGES, SYSTEM_PAGES } from '../src/systems/pages';

const YAML = path.resolve(import.meta.dirname, '../../../packages/knowledge/systems.yaml');

/** The registry's rows: id and kind (`game` by default), read off the file kb-tools validates. */
function registry(): Array<{ id: string; kind: string }> {
  const rows: Array<{ id: string; kind: string }> = [];
  for (const line of readFileSync(YAML, 'utf8').split('\n')) {
    const id = /^ {2}- id: (\S+)\s*$/.exec(line)?.[1];
    if (id) rows.push({ id, kind: 'game' });
    const kind = /^ {4}kind: (\S+)\s*$/.exec(line)?.[1];
    const last = rows.at(-1);
    if (kind && last) last.kind = kind;
  }
  return rows;
}

/** Older game Systems still on the generic page, by the M26 wave that homes them (null: not planned). */
const PENDING: Readonly<Record<string, number | null>> = {
  classes: 2,
  'merit-shop': 2,
  'task-unlocks': 2,
  'task-board': 2,
  bribes: 4,
  'post-office': 4,
  owl: 4,
  'boss-keys': 4,
  'death-note': 4,
  'salt-lick': 4,
  equinox: 4,
  'atom-collider': 4,
  obols: 5,
  arcade: 5,
  islands: 5,
  killroy: 5,
  'weekly-battles': 5,
  ballot: 5,
  library: 5,
  quests: 6,
  colosseum: 6,
  poppy: 6,
  'gem-shop': 7,
  pets: 7,
  guild: 7,
  portals: null,
  'random-events': null,
  'pet-tournament': null,
};

const hasPage = (id: string): boolean => {
  const home = SYSTEM_HOMES[id];
  if (!home) return false;
  if (home.tab || home.timeline || FULL_PAGES[id]) return true;
  return home.page !== undefined && SYSTEM_PAGES[home.page] !== undefined;
};

describe('the System registry is complete (M26 FR-0b)', () => {
  const rows = registry();

  it('reads every registry row', () => {
    expect(rows.length).toBeGreaterThanOrEqual(80);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  it('gives every game System a home and a page', () => {
    const missing = rows
      .filter((r) => r.kind !== 'activeon' && !(r.id in PENDING))
      .filter((r) => !SYSTEM_HOMES[r.id] || !hasPage(r.id))
      .map((r) => r.id);
    expect(missing).toEqual([]);
  });

  it('homes the Wave 0 rows (#179)', () => {
    for (const id of [
      'sigils',
      'rift',
      'tome',
      'elite-classes',
      'achievements',
      'dungeons',
      'family',
      'food',
      'storage',
      'stats',
      'coins',
      'friend-bonuses',
      'event-shop',
      'trophies-nametags',
      'town-shops',
      'drop-rate',
    ])
      expect({ id, page: hasPage(id) }).toEqual({ id, page: true });
  });

  it('lists only registry Systems still without a home in PENDING', () => {
    const ids = new Set(rows.map((r) => r.id));
    expect(Object.keys(PENDING).filter((id) => !ids.has(id))).toEqual([]);
    expect(Object.keys(PENDING).filter((id) => hasPage(id))).toEqual([]);
  });

  it('points every page id at a page', () => {
    const broken = Object.entries(SYSTEM_HOMES)
      .filter(([id, h]) => h.page !== undefined && !FULL_PAGES[id] && !SYSTEM_PAGES[h.page])
      .map(([id]) => id);
    expect(broken).toEqual([]);
  });
});
