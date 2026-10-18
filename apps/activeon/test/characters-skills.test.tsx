// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 in the DOM, area C (M21 §9): the character page's Skills tab with its `#skills-<index>` deep link,
// and the `#skills` route (X9). Split from m20-view.test.tsx.
import { cleanup, screen } from '@testing-library/react';
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

  it('shows the Train line, the Role badge, the next gate and the slot pips', () => {
    const r = withM20(fixture('mid-session'));
    const i = r.characters[0]?.index ?? 0;
    window.history.replaceState(null, '', `/#skills-${i}`);
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByText('Train: Construction · trains while it sits on the Cog Board')).toBeTruthy();
    expect(screen.getByText('Decent cogs at Construction 15 (4 levels)')).toBeTruthy();
    expect(screen.getByText('Role')).toBeTruthy();
    expect(screen.getByText('filled: builds on the Cog Board')).toBeTruthy();
  });
});
