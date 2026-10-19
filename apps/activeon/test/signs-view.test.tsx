// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 in the DOM: the character page's Signs tab (worn, recommended, can it change signs) with its
// `#signs-<index>` deep link, and the Star Chart section in the Account.
import type { EngineResult, StarSignsView } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { characterTabs, parseTabHash } from '../src/now/character-tabs';
import { withSystems } from './helpers/views';
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
  cosmos: {
    have: 3,
    need: 19,
    onTheWay: [
      'Dwarfo Beardus',
      'Hipster Logger',
      'Pack Mule',
      'Pirate Booty',
      'All Rounder',
      'Fatty Doodoo',
      'Robinhood',
      'Ned Kelly',
    ],
    cost: 3,
  },
  plan: 'Bank your points: after A-7 and B-1, unlock up to All Rounder at once',
  next: [
    {
      name: 'A-7',
      text: 'Winding Willows, AFK 2h on 2 characters',
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
  later: ['Later: B-3, AFK 4h in The Grandioso Canyon, 2 more characters (1 of 3)'],
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
      line: 'Bowman Lv 38 (Fighting): wear The Fuzzy Dice (wearing Flexo Bendo; about 10,437 kills until it can reach the Telescope) · after Chronus Cosmos: Pirate Booty + All Rounder',
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
/** The star-signs System page needs the registry entry (D-9: the chart's home is that page). */
const onPage = (r: EngineResult): EngineResult => {
  const base = withSystems().systems ?? [];
  const page = {
    ...(base[1] as NonNullable<EngineResult['systems']>[number]),
    id: 'star-signs',
    name: 'Star Signs',
  };
  return { ...r, systems: [...base, page] };
};

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

  it('M24: the swap first, the slots as tiles, then how to get slot 2 with the whole 19-point path', async () => {
    window.history.replaceState(null, '', '/?c=2#signs-2');
    const r = withSigns();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const nav = screen.getByRole('navigation', { name: 'Character page' });
    expect(within(nav).getByRole('link', { current: 'page' }).textContent).toBe(
      'Signs1behind: 1 sign to swap',
    );
    const answer = screen.getByRole('region', { name: 'Swap a sign · for fighting' });
    expect(
      within(answer).getByText('At the Telescope: wear The Fuzzy Dice instead of Flexo Bendo'),
    ).toBeTruthy();
    expect(within(answer).getByText('About 10,437 kills to reach the Telescope')).toBeTruthy();
    expect(screen.getByText('Flexo Bendo')).toBeTruthy();
    expect(screen.getByText('Second slot')).toBeTruthy();
    // 19 is the whole path; Chronus Cosmos itself is 3 of it (the wiki's number).
    expect(screen.getByRole('meter', { name: 'Star Chart points: 3 of 19' })).toBeTruthy();
    expect(container.textContent).toContain('19 points buy the 8 signs on the way');
    expect(container.textContent).toContain('and Chronus Cosmos itself, 3 points');
    expect(screen.getByText('Pirate Booty')).toBeTruthy();
    expect(screen.getByText('All Rounder')).toBeTruthy();
    await axe
      .run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })
      .then((res) => expect(res.violations.map((v) => v.id)).toEqual([]));
  });

  it('the Account keeps one Star Chart line (D-9); the chart itself is on its System page', async () => {
    const r = withSigns();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const line = (await waitFor(() => {
      const el = document.getElementById('star-chart');
      if (!el) throw new Error('no line yet');
      return el;
    })) as HTMLElement;
    expect(line.textContent).toContain('Star Chart: 3 points · 4 signs unlocked');
    expect(line.textContent).not.toContain('Slamabam Straightaway');
    expect(within(line).getByRole('link', { name: 'see it' }).getAttribute('href')).toContain('star-signs');
    cleanup();
    window.history.replaceState(null, '', '/#system-star-signs');
    const rp = onPage(r);
    renderNow(props(rp, saveOf(rp, 1, 'first', null, 'paste')));
    // M24: the Star Chart is the page's third tab.
    fireEvent.click(await screen.findByRole('tab', { name: /^Star Chart/ }));
    const page = (await screen.findByRole('region', { name: 'Star Chart' })) as HTMLElement;
    expect(page.textContent).toContain('21 points ready, 19 needed for Chronus Cosmos');
    expect(page.textContent).toContain('Slamabam Straightaway');
  });

  it('the Signs tab links to the Star Chart in one line instead of repeating it on every character', () => {
    window.history.replaceState(null, '', '/?c=2#signs-2');
    const r = withSigns();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const tab = document.querySelector('.ss') as HTMLElement;
    expect(tab.textContent).not.toContain('Next constellations');
    expect(tab.textContent).not.toContain('Slamabam Straightaway');
    expect(
      within(tab)
        .getByRole('link', { name: /^Star Chart3 points · open/ })
        .getAttribute('href'),
    ).toContain('star-signs');
  });

  it('says a recommendation shared by several characters once, with each one under "show details"', async () => {
    const r = onPage(twoAlike());
    window.history.replaceState(null, '', '/#system-star-signs');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(await screen.findByRole('tab', { name: /^Star Chart/ }));
    const section = (await screen.findByRole('region', { name: 'Star Chart' })) as HTMLElement;
    expect(section.textContent).toContain('wear The Fuzzy Dice · 2 characters');
    expect(section.textContent?.match(/wear The Fuzzy Dice · 2 characters/g)).toHaveLength(1);
    expect(within(section).getByText('show details').tagName).toBe('SUMMARY');
    expect(within(section).getAllByRole('link', { hidden: true }).length).toBeGreaterThanOrEqual(2);
  });
});
