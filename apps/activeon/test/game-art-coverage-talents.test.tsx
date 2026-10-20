// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment jsdom
// Copyright (C) 2026 IdleOn Forge contributors.
// M25 guard: every talent and attack wears its game icon (data/UISkillIcon<skillIndex>), never its
// two-letter monogram, wherever the game has an icon for it: the attack bar (which holds names only),
// the build steps and talent lists, and the sentences on Now and in Walkthroughs that name a talent.
// The monogram stays only as the fallback for a name the game has no icon for.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { BuildPresetView, BuildRoadmap, EngineResult } from '@idleon-forge/engine/result';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { gameArtSrc, talentArt } from '../src/art/game/game-art';
import { talentIdInText, talentIdOfName } from '../src/art/game/talent-art';
import { TALENT_INDEX } from '../src/art/game/talent-index.gen';
import { healthReady } from '../src/now/character-tabs';
import { fixture, props, renderNow, saveOf } from './now-helpers';

const ROOT = resolve(import.meta.dirname, '../../..');
const shipped = new Set(
  (
    JSON.parse(readFileSync(join(ROOT, 'apps/activeon/public/game-art/manifest.json'), 'utf8')) as {
      files: string[];
    }
  ).files,
);

beforeAll(() => healthReady);
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

describe('talent names -> game icons', () => {
  it('every talent in the pinned talents.json has its icon in the mirror', () => {
    const missing = Object.entries(TALENT_INDEX).filter(
      ([, id]) =>
        !shipped.has(decodeURIComponent((gameArtSrc(talentArt(id)) ?? '').slice('/game-art/'.length))),
    );
    expect(missing).toEqual([]);
    expect(Object.keys(TALENT_INDEX).length).toBeGreaterThan(350);
  });

  it('finds a talent by its name as the app writes it', () => {
    for (const name of [
      'Piercing Arrow',
      'Kung Fu Kick',
      'Homing Arrows',
      'Magic Shortbow',
      'Book of the Wise',
    ])
      expect(talentIdOfName(name), name).not.toBeNull();
    expect(talentIdOfName('Not A Talent')).toBeNull();
  });

  it('finds the talent a sentence names, and not a lone common word', () => {
    expect(talentIdInText('Put Piercing Arrow on the attack bar')).toBe(talentIdOfName('Piercing Arrow'));
    expect(talentIdInText('Put the next 84 points into Book of the Wise (to 100)')).toBe(
      talentIdOfName('Book of the Wise'),
    );
    expect(talentIdInText('Collect 75 boss keys')).toBeNull();
  });
});

const preset = (over: Partial<BuildPresetView>): BuildPresetView => ({
  slot: 0,
  active: true,
  role: 'fighting',
  heading: 'Fighting preset',
  roleText: 'Hunter fighting build',
  buildTitle: 'Hunter build',
  unspent: 0,
  tabs: [
    {
      tab: 1,
      name: 'Tab 1',
      spent: 10,
      unspent: 0,
      rows: [
        {
          id: 1,
          label: 'Featherweight',
          current: 1,
          target: 10,
          max: 100,
          met: false,
          core: false,
          note: null,
        },
      ],
      others: [],
    },
  ],
  attackBar: null,
  next: [],
  ...over,
});

const hunter = (attackBar: BuildPresetView['attackBar']): BuildRoadmap => ({
  index: 1,
  classLabel: 'Hunter',
  level: 80,
  status: 'Attack bar',
  path: [{ class: 'Hunter', label: 'Hunter', state: 'now' }],
  nextClass: null,
  presets: [preset({ attackBar })],
  comingUp: [],
  note: null,
  quiet: null,
  stale: false,
  sources: [],
  entryIds: [],
});

describe('the attack bar', () => {
  it('draws every attack with its game icon, the monogram only where the game has none', () => {
    const bar = {
      set: ['Piercing Arrow', 'Kung Fu Kick', 'Homing Arrows'],
      recommended: ['Piercing Arrow', 'Kung Fu Kick', 'Homing Arrows', 'Magic Shortbow'],
      missing: ['Magic Shortbow'],
      text: 'Put Magic Shortbow on the attack bar',
    };
    window.history.replaceState(null, '', '/#build-1');
    const r: EngineResult = { ...fixture('mid-session'), builds: [hunter(bar)] };
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const atk = screen.getByRole('region', { name: /attack bar/i });
    const slots = [...atk.querySelectorAll('li.bd-atk-it')];
    expect(slots).toHaveLength(4);
    for (const li of slots) {
      const img = li.querySelector('img.g-art');
      expect(img, li.getAttribute('title') ?? '').not.toBeNull();
      expect(img?.getAttribute('src')).toMatch(/^\/game-art\/data\/UISkillIcon\d+\.webp$/);
      // No two-letter monogram where the icon exists.
      expect(li.textContent?.replace(/\s+/g, '')).not.toMatch(/^[A-Z]{2}/);
    }
    // Each attack's name shows under its icon (players can't tell a talent from its icon alone).
    expect(slots.map((li) => li.querySelector('.bd-atk-name')?.textContent)).toEqual([
      'Piercing Arrow',
      'Kung Fu Kick',
      'Homing Arrows',
      'empty slot, Wants Magic Shortbow',
    ]);
    expect(slots.map((li) => li.querySelector('img')?.getAttribute('src'))).toEqual(
      ['Piercing Arrow', 'Kung Fu Kick', 'Homing Arrows', 'Magic Shortbow'].map((n) =>
        gameArtSrc(talentArt(talentIdOfName(n))),
      ),
    );
  });

  it('keeps the monogram for a name the game has no icon for', () => {
    window.history.replaceState(null, '', '/#build-1');
    const bar = {
      set: ['Made Up Strike'],
      recommended: [],
      missing: [],
      text: 'The build wants no attacks here',
    };
    const r: EngineResult = { ...fixture('mid-session'), builds: [hunter(bar)] };
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const atk = screen.getByRole('region', { name: /attack bar/i });
    const li = atk.querySelector('li.bd-atk-it');
    expect(li?.querySelector('img')).toBeNull();
    expect(li?.textContent).toContain('MU');
  });
  // Build steps and talent lists draw the icon by id: build-view.test.tsx checks the book's sprites.
});
