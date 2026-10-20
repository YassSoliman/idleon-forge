// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25 (board `m25/CharStrip`): the character strip and the Characters grid show the in-game name under
// the class label, small and quiet, so two characters of one class can be told apart. A save
// without names (numbered "Character 3") shows no name line. The fixture's names are placeholders.
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { shownName } from '../src/characters/name';
import { healthReady } from '../src/now/character-tabs';
import { fixture, props, renderNow, saveOf } from './now-helpers';

beforeAll(() => healthReady);
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

const withNumbered = () => {
  const r = fixture('mid-session');
  // Slot 2 has no name in the save: the adapter numbers it.
  r.characters = r.characters.map((c) => (c.index === 2 ? { ...c, name: 'Character 3' } : c));
  return r;
};

describe('shownName', () => {
  it('returns the name, or null for a numbered or empty one', () => {
    expect(shownName({ index: 0, name: 'Alder' })).toBe('Alder');
    expect(shownName({ index: 2, name: 'Character 3' })).toBeNull();
    expect(shownName({ index: 0, name: '  ' })).toBeNull();
    expect(shownName(undefined)).toBeNull();
    // A real name that happens to look numbered for another slot stays.
    expect(shownName({ index: 0, name: 'Character 3' })).toBe('Character 3');
  });
});

describe('character names (M25)', () => {
  it('the strip shows each name under its class and level, and in the link name', () => {
    const r = withNumbered();
    window.history.replaceState(null, '', '/#build-1');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const strip = screen.getByRole('navigation', { name: 'Characters' });
    const chip = within(strip).getByRole('link', { name: /^Squire 43, Alder: / });
    expect(chip.querySelector('.cp-chip-who')?.textContent).toBe('Squire 43');
    expect(chip.querySelector('.cp-chip-name')?.textContent).toBe('Alder');
    // The numbered character has no name line.
    const numbered = within(strip).getByRole('link', { name: /^Bowman 38: / });
    expect(numbered.querySelector('.cp-chip-name')).toBeNull();
    // The header stays class and level.
    expect(screen.getByRole('heading', { level: 2, name: 'Shaman 44' })).toBeTruthy();
  });

  it('the Characters grid shows the name under the class label', () => {
    const r = withNumbered();
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const grid = document.querySelector('.cp-grid') as HTMLElement;
    const names = [...grid.querySelectorAll('.cp-who-name')].map((x) => x.textContent);
    expect(names.sort()).toEqual(['Alder', 'Birch', 'Dahlia', 'Elm']);
    const who = [...grid.querySelectorAll<HTMLAnchorElement>('a.cp-who')].find((a) =>
      a.textContent?.includes('Barbarian 51'),
    );
    expect(who?.getAttribute('aria-label')).toMatch(/Barbarian 51, Dahlia, /);
  });
});
