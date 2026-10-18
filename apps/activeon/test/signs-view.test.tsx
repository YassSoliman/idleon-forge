// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 in the DOM: the character page's Signs tab (worn, recommended, can it change signs) with its
// `#signs-<index>` deep link, and the Star Chart section in the Account.
import type { EngineResult, StarSignsView } from '@idleon-forge/engine/result';
import { cleanup, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { characterTabs, parseTabHash } from '../src/now/character-tabs';
import { fixture, props, renderNow, saveOf } from './now-helpers';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

const starSigns: StarSignsView = {
  points: 3,
  unlockedNodes: 4,
  hydronAt: 24,
  slots: 1,
  questDone: true,
  milestone: '21 points ready, 19 needed for Chronus Cosmos (2 signs on every character)',
  plan: 'Bank your points: after A-7 and B-1 you can unlock up to All Rounder in one trip',
  next: [
    {
      name: 'A-7',
      text: 'Winding Willows, AFK 2 h on 2 characters',
      points: 3,
      effortSeconds: 480,
      shown: true,
    },
    {
      name: 'B-4',
      text: 'Slamabam Straightaway, reach the star on 4 characters',
      points: 5,
      effortSeconds: 720,
      shown: false,
    },
  ],
  later: ['Later: B-3, AFK 4 h in The Grandioso Canyon on 2 more characters (1 of 3)'],
  nextCharacter: null,
  characters: [
    {
      index: 2,
      activity: 'Fighting',
      slots: 1,
      worn: ['Flexo Bendo'],
      recommended: ['The Fuzzy Dice'],
      afterCosmos: ['Pirate Booty', 'All Rounder'],
      onceUnlocked: null,
      matches: false,
      canChange: false,
      killsToTelescope: 10437,
      line: 'Bowman Lv 38 (Fighting): wear The Fuzzy Dice (wearing Flexo Bendo; it can change signs after about 10,437 kills to reach the Telescope) · after Chronus Cosmos: Pirate Booty + All Rounder',
    },
  ],
  sources: [
    {
      label: 'IdleOn Wiki: Star Signs',
      url: 'https://idleon.wiki/wiki/Star_Signs',
      tier: 2,
      verifiedOn: '2026-10-18',
      claimDate: '2026-10-05',
      gameVersion: '2.3.540',
    },
  ],
};

const withSigns = (): EngineResult => ({ ...fixture('mid-session'), starSigns });

/** Two characters with the same recommendation, as on most early accounts. */
const twoAlike = (): EngineResult => {
  const [c] = starSigns.characters;
  if (!c) throw new Error('fixture has a character');
  const other = { ...c, index: 4, line: c.line.replace('Bowman Lv 38', 'Shaman Lv 30') };
  return { ...fixture('mid-session'), starSigns: { ...starSigns, characters: [c, other] } };
};

describe('Signs tab', () => {
  it('is registered and parses its deep link', () => {
    expect(characterTabs.some((t) => t.id === 'signs' && t.label === 'Signs')).toBe(true);
    expect(parseTabHash('#signs-2')).toEqual({ tab: 'signs', index: 2 });
  });

  it('shows the worn and recommended signs and whether the character can change signs', async () => {
    window.history.replaceState(null, '', '/?c=2#signs-2');
    const r = withSigns();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const nav = screen.getByRole('navigation', { name: 'Character page' });
    expect(within(nav).getByRole('link', { current: 'page' }).textContent).toBe('Signs');
    expect(screen.getByText('Flexo Bendo')).toBeTruthy();
    expect(screen.getAllByText('The Fuzzy Dice').length).toBeGreaterThan(0);
    expect(screen.getByText('needs about 10,437 kills to reach the Telescope')).toBeTruthy();
    expect(screen.getAllByText('Pirate Booty + All Rounder').length).toBeGreaterThan(0);
    await axe
      .run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })
      .then((res) => expect(res.violations.map((v) => v.id)).toEqual([]));
  });

  it('the Account has a Star Chart section with points, unlocked signs and the next constellations', () => {
    const r = withSigns();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const section = document.getElementById('star-chart');
    expect(section?.textContent).toContain('3 points · 4 signs unlocked · next: A-7');
    expect(section?.textContent).toContain('21 points ready, 19 needed for Chronus Cosmos');
    expect(section?.textContent).toContain('Slamabam Straightaway');
  });

  it('the Signs tab links to the Star Chart in one line instead of repeating it on every character', () => {
    window.history.replaceState(null, '', '/?c=2#signs-2');
    const r = withSigns();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const tab = document.querySelector('.ss') as HTMLElement;
    expect(tab.textContent).toContain('Star Chart: 3 points · see it');
    expect(tab.textContent).not.toContain('Next constellations');
    expect(tab.textContent).not.toContain('Slamabam Straightaway');
    expect(within(tab).getByRole('link', { name: 'see it' }).getAttribute('href')).toContain('star-signs');
  });

  it('says a recommendation shared by several characters once, with each one under "show details"', () => {
    const r = twoAlike();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const section = document.getElementById('star-chart') as HTMLElement;
    expect(section.textContent).toContain('wear The Fuzzy Dice · 2 characters');
    expect(section.textContent?.match(/wear The Fuzzy Dice · 2 characters/g)).toHaveLength(1);
    expect(within(section).getByText('show details').tagName).toBe('SUMMARY');
    expect(within(section).getAllByRole('link', { hidden: true }).length).toBeGreaterThanOrEqual(2);
  });
});
