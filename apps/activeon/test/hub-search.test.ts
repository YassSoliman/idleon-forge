// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25: the Systems hub search: the fuzzy scorer, the player words, the filter buckets and the fragment.

import { describe, expect, it } from 'vitest';
import { routeOfHash } from '../src/shell/route';
import {
  bucketOf,
  EMPTY_QUERY,
  editDistance,
  formatHubHash,
  fuzzyScore,
  highlightRuns,
  isNarrowed,
  keeps,
  parseHubHash,
  type SearchItem,
  searchSystems,
  toggle,
} from '../src/systems/hub-search';

const ITEMS: SearchItem[] = [
  { id: 'minigames', name: 'Minigames', world: 0 },
  { id: 'pets', name: 'Companions and pets', world: 0 },
  { id: 'anvil', name: 'Anvil', world: 1 },
  { id: 'stamps', name: 'Stamps', world: 1 },
  { id: 'alchemy', name: 'Alchemy cauldrons and liquids', world: 2 },
  { id: 'alchemy-bubbles', name: 'Alchemy bubbles', world: 2 },
  { id: 'alchemy-vials', name: 'Alchemy vials', world: 2 },
  { id: 'refinery', name: 'Refinery', world: 3 },
  { id: 'construction', name: 'Construction', world: 3 },
  { id: 'salt-lick', name: 'Salt Lick', world: 3 },
  { id: 'worship', name: 'Worship', world: 3 },
  { id: 'cooking', name: 'Cooking', world: 4 },
  { id: 'breeding', name: 'Breeding', world: 4 },
];
const ids = (q: string) => searchSystems(q, ITEMS).map((r) => r.id);

describe('the fuzzy scorer', () => {
  it('ranks exact over prefix over word prefix over substring over letters in order', () => {
    const exact = fuzzyScore('anvil', 'Anvil')?.score ?? 0;
    const prefix = fuzzyScore('anv', 'Anvil')?.score ?? 0;
    const word = fuzzyScore('bub', 'Alchemy bubbles')?.score ?? 0;
    const sub = fuzzyScore('nvi', 'Anvil')?.score ?? 0;
    const letters = fuzzyScore('alchmy', 'Alchemy')?.score ?? 0;
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(sub);
    expect(sub).toBeGreaterThan(letters);
    expect(letters).toBeGreaterThan(0);
  });

  it('highlights the matched characters of the text the player sees', () => {
    expect(fuzzyScore('bub', 'Alchemy bubbles')?.hits).toEqual([8, 9, 10]);
    expect(fuzzyScore('alchmy', 'Alchemy')?.hits).toEqual([0, 1, 2, 3, 5, 6]);
    expect(highlightRuns('Anvil', [0, 1])).toEqual([
      { text: 'An', hit: true },
      { text: 'vil', hit: false },
    ]);
  });

  it('is typo tolerant: one typo from five letters, two from eight', () => {
    expect(editDistance('refinry', 'refinery')).toBe(1);
    expect(editDistance('alcehmy', 'alchemy')).toBe(1); // a swap counts once
    expect(fuzzyScore('cokoing', 'Cooking')).not.toBeNull();
    expect(fuzzyScore('wrship', 'Worship')).not.toBeNull();
    expect(fuzzyScore('constrcutoin', 'Construction')).not.toBeNull();
    expect(fuzzyScore('xyz', 'Anvil')).toBeNull();
    expect(fuzzyScore('zzzz', 'Anvil')).toBeNull();
    // Four letters carry no typo: "cogs" is not "cons(tellations)".
    expect(fuzzyScore('cogs', 'constellations')).toBeNull();
  });

  it('ignores case, punctuation and an empty query', () => {
    expect(fuzzyScore('3D', '3D Printer')?.score).toBeGreaterThan(800);
    expect(fuzzyScore("killroy's", "Killroy's Slaughterhouse")).not.toBeNull();
    expect(fuzzyScore('   ', 'Anvil')).toBeNull();
    expect(searchSystems('', ITEMS)).toEqual([]);
  });
});

describe('searching the Systems', () => {
  it('finds a System by the words players use', () => {
    expect(ids('cauldron')[0]).toBe('alchemy');
    expect(ids('salts')).toEqual(expect.arrayContaining(['refinery', 'salt-lick']));
    expect(ids('cogs')[0]).toBe('construction');
    expect(ids('meals')[0]).toBe('cooking');
    expect(ids('pets')).toEqual(expect.arrayContaining(['pets', 'breeding']));
    const r = searchSystems('cogs', ITEMS)[0];
    expect(r?.via).toEqual({ kind: 'alias', text: 'cogs', hits: [0, 1, 2, 3] });
    expect(r?.hits).toEqual([]);
  });

  it('finds a System by a section of its page', () => {
    const r = searchSystems('totems', ITEMS)[0];
    expect(r?.id).toBe('worship');
    expect(r?.via?.kind).toBe('section');
  });

  it('survives typos and ranks the closest name first', () => {
    expect(ids('alchmy')[0]).toBe('alchemy-vials');
    expect(ids('alchmy').slice(0, 3).sort()).toEqual(['alchemy', 'alchemy-bubbles', 'alchemy-vials']);
    expect(ids('refinry')[0]).toBe('refinery');
    expect(ids('stmps')[0]).toBe('stamps');
  });

  it('a query of several words needs each word', () => {
    expect(ids('alchemy vials')[0]).toBe('alchemy-vials');
    expect(ids('vials alchemy')[0]).toBe('alchemy-vials');
  });
});

describe('the filters', () => {
  const t = (status: string, tone: string) => ({ id: 'x', status, tone });
  it('puts every tile in exactly one status bucket', () => {
    expect(bucketOf(t('wasting', 'wasting'))).toBe('wasting');
    expect(bucketOf(t('behind', 'todo'))).toBe('behind');
    expect(bucketOf(t('ok', 'todo'))).toBe('todo');
    expect(bucketOf(t('ok', 'ok'))).toBe('fine');
    expect(bucketOf(t('not-covered', 'off'))).toBe('notCovered');
    expect(bucketOf(t('not-covered', 'readonly'))).toBe('notCovered');
    expect(bucketOf(t('cant-tell', 'off'))).toBe('notCovered');
    expect(bucketOf(t('locked', 'off'))).toBe('locked');
  });

  it('combines the search with the world and status filters', () => {
    const tile = { id: 'refinery', status: 'wasting', tone: 'wasting' };
    const q = { q: 'ref', worlds: [3], status: ['wasting' as const] };
    expect(keeps(tile, 3, q, new Set(['refinery']))).toBe(true);
    expect(keeps(tile, 3, q, new Set(['anvil']))).toBe(false);
    expect(keeps(tile, 2, q, null)).toBe(false);
    expect(keeps(tile, 3, { ...q, status: ['fine'] }, null)).toBe(false);
    expect(keeps(tile, 3, EMPTY_QUERY, null)).toBe(true);
    expect(isNarrowed(EMPTY_QUERY)).toBe(false);
    expect(isNarrowed({ ...EMPTY_QUERY, q: '  ' })).toBe(false);
    expect(isNarrowed({ ...EMPTY_QUERY, worlds: [0] })).toBe(true);
  });

  it('toggles keep a stable order', () => {
    expect(toggle([3], 1, [0, 1, 2, 3])).toEqual([1, 3]);
    expect(toggle([1, 3], 1, [0, 1, 2, 3])).toEqual([3]);
  });
});

describe('the fragment keeps the view', () => {
  it('round-trips the query and the filters', () => {
    const q = { q: 'alch my', worlds: [2, 0], status: ['locked' as const, 'wasting' as const] };
    const hash = formatHubHash(q);
    expect(hash).toBe('#systems?q=alch%20my&w=0,2&s=wasting,locked');
    expect(parseHubHash(hash)).toEqual({ q: 'alch my', worlds: [0, 2], status: ['wasting', 'locked'] });
    expect(formatHubHash(EMPTY_QUERY)).toBe('#systems');
  });

  it('drops anything unknown and reads a plain #systems as nothing narrowed', () => {
    expect(parseHubHash('#systems')).toEqual(EMPTY_QUERY);
    expect(parseHubHash('#now?q=x')).toEqual(EMPTY_QUERY);
    expect(parseHubHash('#systems?w=9,x,12,1&s=bogus,fine')).toEqual({
      q: '',
      worlds: [1, 9],
      status: ['fine'],
    });
  });

  it('the route grammar opens the hub for a fragment with a query', () => {
    const known = { tabs: [], systems: [], indexes: [], timeline: true, maps: [], map: true };
    expect(routeOfHash('#systems?q=cogs&w=3', known)).toEqual({ place: 'systems' });
    expect(routeOfHash('#systems?', known)).toEqual({ place: 'systems' });
  });
});
