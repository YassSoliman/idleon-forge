// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 Views in the DOM, area M (M21 §9): the place navigation (US-1), deep links and the ?c= rewrite
// (US-2), Back (US-3) and following the game inside the shell (US-4). Split from shell.test.tsx.

import type { EngineResult } from '@idleon-forge/engine/result';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Shell } from '../src/shell/Shell';
import { go, noAxeViolations, places, withSystems } from './helpers/views';
import { props, renderNow, saveOf } from './now-helpers';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

describe('US-1 the place navigation', () => {
  it('lists the five places in order, Now current, badges on Now and Timeline only (FR-M6, US-10)', async () => {
    const r = withSystems();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const links = within(places()).getAllByRole('link');
    expect(links.map((l) => l.textContent?.replace(/\d+$/, ''))).toEqual([
      'Now',
      'Characters',
      'Systems',
      'Timeline',
      'Map',
    ]);
    expect(links[0]?.getAttribute('aria-current')).toBe('page');
    expect(links[0]?.getAttribute('aria-label')).toBe('Now, 1 to fix before you leave');
    // D-7: the Systems badge is gone (the wasting count lives in the hub's report card).
    expect(links[2]?.getAttribute('aria-label')).toBeNull();
    expect(links[2]?.textContent).toBe('Systems');
    // The Timeline's badge counts limits before you're back, named in words, or is absent.
    const tl = links[3]?.getAttribute('aria-label');
    if (tl !== null && tl !== undefined) expect(tl).toMatch(/^Timeline, \d+ limits? before you're back$/);
    expect(links[4]?.getAttribute('aria-label')).toBeNull();
    expect(links[4]?.getAttribute('href')).toBe('#map');
    // Each place is a pixel glyph plus a word; the glyph is hidden from assistive tech.
    for (const l of links) expect(l.querySelector('.glyph-wrap svg, .glyph-wrap .px')).toBeTruthy();
    // TR-13: the skip link comes before the navigation.
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip.compareDocumentPosition(places()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.title).toBe('Now · ActiveOn');
    await noAxeViolations(container);
  });

  it('a place move is one history entry, focuses the place heading and retitles the tab (FR-8, FR-11)', () => {
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const before = window.history.length;
    go('Characters');
    expect(window.location.hash).toBe('#characters');
    expect(window.history.length).toBe(before + 1);
    expect(document.activeElement?.id).toBe('characters-h');
    expect(document.title).toBe('Characters · ActiveOn');
    expect(within(places()).getByRole('link', { current: 'page' }).textContent).toBe('Characters');
  });
});

describe('US-2 deep links that survive a reload', () => {
  it('#system-<id> opens that System page under Systems', () => {
    window.history.replaceState(null, '', '/#system-anvil');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByRole('heading', { level: 2, name: 'Anvil' })).toBeTruthy();
    expect(within(places()).getByRole('link', { current: true }).textContent).toContain('Systems');
    expect(document.title).toBe('Systems · ActiveOn');
  });

  it('#cards-2 opens the Cards tab, marked under Now (a deep link, FR-4)', () => {
    window.history.replaceState(null, '', '/#cards-2');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByRole('heading', { level: 2, name: 'Bowman 38' })).toBeTruthy();
    expect(within(places()).getByRole('link', { current: true }).textContent).toContain('Now');
  });

  it('?c=3 becomes #now-3 by replaceState, the history length unchanged', () => {
    window.history.replaceState(null, '', '/?c=3');
    const before = window.history.length;
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('#now-3');
    expect(window.history.length).toBe(before);
    expect(screen.getByRole('heading', { level: 2, name: 'Barbarian 51' })).toBeTruthy();
  });

  it('?c=1#build-1 becomes #build-1', () => {
    window.history.replaceState(null, '', '/?c=1#build-1');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(window.location.search + window.location.hash).toBe('#build-1');
  });

  it('an unknown System, a missing character or an in-page anchor opens Now, URL untouched', () => {
    for (const hash of ['#system-nonsense', '#build-99', '#spend-plan']) {
      window.history.replaceState(null, '', `/${hash}`);
      const r = withSystems();
      const view = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
      expect(document.querySelector('.n-now')).toBeTruthy();
      expect(window.location.hash).toBe(hash);
      view.unmount();
    }
  });

  it('a live save under 5 minutes old never overrides a deep link with first-load auto-open (FR-9)', () => {
    window.history.replaceState(null, '', '/#system-anvil');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'autosave', 3)));
    expect(screen.getByRole('heading', { level: 2, name: 'Anvil' })).toBeTruthy();
    expect(window.location.hash).toBe('#system-anvil');
  });
});

describe('US-3 Back goes back', () => {
  it('Now → Systems → a System page → Characters, then Back three times', () => {
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    go('Systems');
    fireEvent.click(screen.getByRole('link', { name: /^Alchemy bubbles,/ }));
    go('Characters');
    const back = (hash: string) =>
      act(() => {
        window.history.replaceState(window.history.state, '', `/${hash}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    back('#system-alchemy-bubbles');
    expect(screen.getByRole('heading', { level: 2, name: 'Alchemy bubbles' })).toBeTruthy();
    back('#systems');
    expect(screen.getByRole('heading', { level: 2, name: 'Systems' })).toBeTruthy();
    back('');
    expect(document.querySelector('.n-now')).toBeTruthy();
  });

  it('"Back" on a Character page opened by a deep link returns to Now', () => {
    window.history.replaceState(null, '', '/#build-1');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    // M24: no "All characters" button; Esc goes back.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('.n-now')).toBeTruthy();
    expect(window.location.hash).toBe('#now');
  });

  it('a Character page opened from the Characters grid belongs to Characters, and "Back" returns there', () => {
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    go('Characters');
    fireEvent.click(
      screen.getAllByRole('link').find((a) => a.getAttribute('href') === '#now-2') as HTMLElement,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Bowman 38' })).toBeTruthy();
    expect(within(places()).getByRole('link', { current: true }).textContent).toBe('Characters');
    // M24: no in-page back button (the strip and the places move); Esc goes back to where it came from.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(window.location.hash).toBe('#characters');
  });
});

function Live({
  r,
  seq,
  kind,
  slot,
}: {
  r: EngineResult;
  seq: number;
  kind: 'autosave' | 'switch-leave' | 'first';
  slot: number | null;
}) {
  return <Shell {...props(r, saveOf(r, seq, kind, slot))} />;
}

describe('US-4 following the game where it helps, never where it would yank me', () => {
  it('on Now a switch opens the newly played character, and Now stays current', () => {
    const r = withSystems();
    const view = render(<Live r={r} seq={1} kind="first" slot={null} />);
    view.rerender(<Live r={r} seq={2} kind="autosave" slot={4} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Wizard 40' })).toBeTruthy();
    expect(within(places()).getByRole('link', { current: true }).textContent).toContain('Now');
  });

  it('on the Systems hub the view stays and a "· go" chip offers the move (one pushState)', () => {
    window.history.replaceState(null, '', '/#systems');
    const r = withSystems();
    const view = render(<Live r={r} seq={1} kind="first" slot={null} />);
    const active = document.activeElement;
    view.rerender(<Live r={r} seq={2} kind="autosave" slot={4} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Systems' })).toBeTruthy();
    expect(document.activeElement).toBe(active);
    const before = window.history.length;
    fireEvent.click(screen.getByRole('button', { name: 'Now playing Elm · go' }));
    expect(window.location.hash).toBe('#now-4');
    expect(window.history.length).toBe(before + 1);
  });

  it('on a Build tab the view stays too', () => {
    window.history.replaceState(null, '', '/#build-2');
    const r = withSystems();
    const view = render(<Live r={r} seq={1} kind="first" slot={null} />);
    view.rerender(<Live r={r} seq={2} kind="autosave" slot={4} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Bowman 38' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Now playing Elm · go' })).toBeTruthy();
  });

  it('a switch seen from Systems still counts as visited back on Now (FR-10)', () => {
    window.history.replaceState(null, '', '/#systems');
    const r = withSystems();
    const view = render(<Live r={r} seq={1} kind="first" slot={null} />);
    view.rerender(<Live r={r} seq={2} kind="autosave" slot={3} />);
    go(/^Now/);
    fireEvent.click(document.querySelector('[data-index="0"]') as HTMLElement);
    // Dahlia (index 3) was played: "Next" never points back at her.
    expect(screen.getByRole('button', { name: /^Next: / }).textContent).not.toContain('Dahlia');
  });
});

/** A small W2 map for the DOM: town, two fighting maps, the frontier on the second; Barbarian 51 pushes. */
function withMap(): EngineResult {
  const r = withSystems();
  r.map = {
    worlds: [
      {
        world: 1,
        state: 'done',
        cleared: 3,
        total: 3,
        gate: {
          boss: 'Amarok',
          bossMap: 29,
          keysHeld: 2,
          keysPerDay: 1,
          crystal: { item: 'Desert_Topaz', held: 0, need: 1 },
        },
        maps: [
          { mapIndex: 1, name: 'Spore_Meadows', kind: 'fight', doors: [{ destination: 2, requirement: 21 }] },
        ],
      },
      {
        world: 2,
        state: 'open',
        cleared: 1,
        total: 2,
        gate: { boss: 'Efaunt', bossMap: 66, keysHeld: null, keysPerDay: null, crystal: null },
        maps: [
          { mapIndex: 50, name: 'YumYum_Grotto', kind: 'town', doors: [] },
          { mapIndex: 51, name: 'Jar_Bridge', kind: 'fight', doors: [{ destination: 52, requirement: 300 }] },
          {
            mapIndex: 52,
            name: 'The_Mimic_Hole',
            kind: 'fight',
            doors: [{ destination: 53, requirement: 500 }],
          },
        ],
      },
    ],
    frontier: {
      mapIndex: 52,
      door: 0,
      requirement: 500,
      best: { characterIndex: 3, killsLeft: 380, etaMs: 7_200_000 },
    },
    markers: [
      { characterIndex: 3, mapIndex: 52 },
      { characterIndex: 0, mapIndex: 1 },
    ],
    doors: {
      51: [{ characterIndex: 3, door: 0, done: 300, requirement: 300 }],
      52: [{ characterIndex: 3, door: 0, done: 120, requirement: 500 }],
    },
    overlays: { route: [51, 52], constellations: { 51: ['B-1'] }, deathNote: {}, cards: {} },
  };
  return r;
}

describe('US-9 the Map place (FR-M1, FR-M2, FR-M5)', () => {
  it('#map opens the Map under the Map place: the bands, the frontier ring and every map as a button', async () => {
    window.history.replaceState(null, '', '/#map');
    const r = withMap();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByRole('heading', { level: 2, name: 'Map' })).toBeTruthy();
    expect(within(places()).getByRole('link', { current: 'page' }).textContent).toBe('Map');
    expect(document.title).toBe('Map · ActiveOn');
    expect(screen.getByText('2 of 2 worlds open · 5 characters')).toBeTruthy();
    // M24: the next door first, in the one frame: the pusher's kills against the door, with the time.
    const front = container.querySelector('.map-hero.a-frame') as HTMLElement;
    expect(front.textContent).toContain('Kill 380 more here');
    expect(front.textContent).toContain('120');
    // QA P3: "in about 2h 00m", never "about in 2h 00m".
    expect(front.textContent).toContain('is there · in about 2h 00m at its kill rate');
    expect(container.querySelectorAll('.map-place .a-frame')).toHaveLength(1);
    // TR-17: the map's nodes are buttons named in words (map, state, who, door).
    expect(
      screen.getAllByRole('button', {
        name: 'The Mimic Hole, next door, Here: Barbarian 51, 500 kills for its door',
      }).length,
    ).toBeGreaterThan(0);
    // M24: four tabs, Route first, that switch the content.
    const tabs = screen.getByRole('tablist', { name: 'Map views' });
    expect(
      within(tabs)
        .getAllByRole('tab')
        .map((t) => t.textContent),
    ).toEqual(['Route', 'Constellations', 'Death Note', 'Cards']);
    await noAxeViolations(container);
  });

  it('M24: the tabs switch the content: Death Note replaces the route, Route brings it back', () => {
    window.history.replaceState(null, '', '/#map');
    const r = withMap();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(container.querySelectorAll('.map-tile').length).toBe(2);
    fireEvent.click(screen.getByRole('tab', { name: /^Death Note/ }));
    expect(container.querySelectorAll('.map-tile')).toHaveLength(0);
    expect(screen.getByText('No Death Note kills in your save yet.')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /^Route/ }));
    expect(container.querySelectorAll('.map-tile').length).toBe(2);
  });

  it('a tap opens the map sheet at #map-<n>, in the FR-M2 order; Esc closes it back to #map', () => {
    window.history.replaceState(null, '', '/#map');
    const r = withMap();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const node = screen.getAllByRole('button', { name: /^The Mimic Hole, next door/ })[0] as HTMLElement;
    fireEvent.click(node);
    expect(window.location.hash).toBe('#map-52');
    const dialog = screen.getByRole('dialog', { name: 'The Mimic Hole' });
    const heads = within(dialog)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(heads).toEqual(['Who is here', 'Door 1']);
    expect(dialog.textContent).toContain('120 of 500 kills');
    expect(dialog.textContent).toContain('in 2h 00m');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(window.location.hash).toBe('#map');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('#map-<n> for a map not in the facts opens the Map with no sheet', () => {
    window.history.replaceState(null, '', '/#map-9999');
    const r = withMap();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByRole('heading', { level: 2, name: 'Map' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('without map data the place says what it needs, and the nav still shows it (D-6: never locked)', () => {
    window.history.replaceState(null, '', '/#map');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByText('The map shows once your save names a current world.')).toBeTruthy();
  });
});
