// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 in the DOM, area C (M21 §9): the character page's Skills tab with its `#skills-<index>` deep link,
// and the `#skills` route (X9). Split from m20-view.test.tsx.
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { characterTabs, parseTabHash } from '../src/now/character-tabs';
import { routeOfHash } from '../src/shell/route';
import { withM20 } from './helpers/m20-result';
import { fixture, props, renderNow, saveOf } from './now-helpers';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

describe('the Skills tab', () => {
  it('is registered, parses its deep link, and the #skills overview is a route (X9)', () => {
    expect(characterTabs.some((t) => t.id === 'skills' && t.label === 'Skills')).toBe(true);
    expect(parseTabHash('#skills-2')).toEqual({ tab: 'skills', index: 2 });
    expect(
      routeOfHash('#skills', {
        tabs: ['now'],
        systems: [],
        indexes: [],
        timeline: true,
        maps: [],
        map: false,
      }),
    ).toEqual({
      place: 'characters',
      section: 'skills',
    });
  });

  it('M24: the Role answer first, a tile per skill, the slots as tiles in one state', () => {
    const r = withM20(fixture('mid-session'));
    const i = r.characters[0]?.index ?? 0;
    window.history.replaceState(null, '', `/#skills-${i}`);
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const answer = screen.getByRole('region', { name: "This character's Role · Construction" });
    expect(
      within(answer).getByText('Train: Construction · trains while it sits on the Cog Board'),
    ).toBeTruthy();
    expect(within(answer).getByText('Next: Decent cogs at Construction 15 (4 levels)')).toBeTruthy();
    const tiles = screen.getByRole('list', { name: 'Skills' });
    expect(within(tiles).getByText('Role')).toBeTruthy();
    expect(within(tiles).getByText('11')).toBeTruthy();
    expect(within(tiles).getByRole('meter', { name: 'Construction: 50% through level 11' })).toBeTruthy();
    const slots = screen.getByRole('list', { name: 'Parallel Slots' });
    expect(within(slots).getByText('Builds on the Cog Board')).toBeTruthy();
    expect(screen.getByText('1 of 1 filled · they earn beside the AFK job')).toBeTruthy();
  });

  it('M24 (red team #5): a shut Role slot shows its prerequisite as step 1, never "train it" alone', () => {
    const base = withM20(fixture('mid-session'));
    const t = base.skills?.[0];
    if (!t?.train) throw new Error('no train line');
    const r = {
      ...base,
      skills: [
        {
          ...t,
          train: {
            ...t.train,
            blocked: {
              text: 'needs the quest',
              step: 'Start it: do the quest',
              why: 'The quest is in town.',
            },
          },
          slots: [
            { kind: 'cog' as const, state: 'unfillable' as const, text: 'needs the quest', linkKey: null },
          ],
        },
      ],
    };
    window.history.replaceState(null, '', `/#skills-${t.index}`);
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const answer = screen.getByRole('region', { name: "This character's Role · Construction" });
    expect(within(answer).getByText('Start it: do the quest')).toBeTruthy();
    const steps = within(answer).getAllByRole('listitem');
    expect(steps[0]?.textContent).toContain('The quest is in town.');
    expect(steps[1]?.textContent).toContain('Then train Construction');
    expect(screen.getByText('Role · locked until step 1')).toBeTruthy();
    expect(screen.getByText('Not yet · step 1 above opens it')).toBeTruthy();
  });
});
