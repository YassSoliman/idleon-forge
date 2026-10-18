// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 Integration (spec §9 "I") in the DOM: the AFK strip on Now (FR-I1), "See it on the map" (FR-M7),
// the shell's Esc leaving an open dialog alone, and StateGlyph drawing no SVG text (DS-20).
import type { EngineResult, MapResult, TimelineBar } from '@idleon-forge/engine/result';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StateGlyph } from '../src/design/atoms';
import { constellationMap, onMap, SeeOnMap } from '../src/map/SeeOnMap';
import { type NowActions, NowActionsContext } from '../src/now/context';
import { fixture, props, renderNow, saveOf } from './now-helpers';

const H = 3_600_000;

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

async function noAxeViolations(container: HTMLElement) {
  const res = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([]);
}

const bar = (entryId: string, subject: string, over: Partial<TimelineBar> = {}): TimelineBar => ({
  barId: `${entryId}@${subject}`,
  key: `${entryId}@${subject}`,
  entryId,
  system: entryId.split('.')[0] ?? entryId,
  subject: subject as TimelineBar['subject'],
  kind: 'storage',
  what: 'anvil',
  at: Date.now() + H,
  untimed: false,
  effect: 'blocker',
  fixHolds: true,
  ...over,
});

/** mid-session with two limits that bind before Back and one after it. */
function withLimits(): EngineResult {
  const r = fixture('mid-session');
  const now = Date.now();
  return {
    ...r,
    returnAt: now + 8 * H,
    timeline: [
      bar('afk.check.health-food-runs-out', 'c3', { kind: 'food', what: 'health food', at: now + 2 * H }),
      bar('anvil.check.caps-before-return', 'c0', { at: now + 3 * H }),
      bar('anvil.check.caps-before-return', 'c1', { at: now + 20 * H }),
    ],
  };
}

describe('FR-I1: the compact AFK strip on Now', () => {
  it('sits between the pause control and its content, as one link to the Timeline', async () => {
    const r = withLimits();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const strip = container.querySelector('a.afk-strip') as HTMLAnchorElement;
    expect(strip).toBeTruthy();
    expect(strip.getAttribute('href')).toBe('#timeline');
    expect(strip.getAttribute('aria-label')).toMatch(/limits? binds? before you're back/);
    // Placement (FR-N1 step 6): right after the pause control, before the Roster.
    const now = container.querySelector('.n-now') as HTMLElement;
    const order = [...now.querySelectorAll('.n-pause, .afk-strip, .n-roster')].map((e) => e.className);
    expect(order).toEqual(['n-pause', 'afk-strip', 'n-roster']);
    await noAxeViolations(container);
    fireEvent.click(strip);
    expect(window.location.hash).toBe('#timeline');
  });

  it('draws nothing without a Timeline (no M3 return)', () => {
    const r = fixture('mid-session');
    const { container } = renderNow(
      props({ ...r, returnAt: undefined }, saveOf(r, 1, 'first', null, 'paste')),
    );
    expect(container.querySelector('.afk-strip')).toBeNull();
  });
});

describe('the shell leaves Esc to an open dialog (area N)', () => {
  it('on a Character page, Esc goes back only when no dialog is open', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/#now-3');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(window.location.hash).toBe('#now-3');
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.append(dialog);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(window.location.hash).toBe('#now-3');
    dialog.remove();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(window.location.hash).toBe('#now');
  });
});

describe('FR-M7: "See it on the map"', () => {
  const map = {
    worlds: [
      {
        world: 3,
        state: 'open',
        cleared: 0,
        total: 1,
        gate: null,
        maps: [{ mapIndex: 52, name: 'Thermonuclear Climb', kind: 'fight', doors: [] }],
      },
    ],
    frontier: null,
    markers: [],
    doors: {},
    overlays: { route: [], constellations: { 52: ['Grandfrogger'] }, deathNote: {}, cards: {} },
  } as unknown as MapResult;
  const result = { ...fixture('mid-session'), map } as EngineResult;
  const moves: unknown[] = [];
  const actions = { result, navigate: (to: unknown) => moves.push(to) } as unknown as NowActions;
  const inContext = (node: React.ReactNode) =>
    render(<NowActionsContext.Provider value={actions}>{node}</NowActionsContext.Provider>);

  it('links #map-<n> for a map the Map place knows, and opens it on a tap', async () => {
    const { container } = inContext(<SeeOnMap mapIndex={52} label="Thermonuclear Climb" />);
    const link = screen.getByRole('link', { name: 'See it on the map: Thermonuclear Climb' });
    expect(link.getAttribute('href')).toBe('#map-52');
    expect(link.textContent).toBe('See it on the map');
    fireEvent.click(link);
    expect(moves.at(-1)).toEqual({ place: 'map', mapIndex: 52 });
    await noAxeViolations(container);
  });

  it('draws nothing for a map the Map place has no sheet for, or with no map at all', () => {
    const { container } = inContext(
      <>
        <SeeOnMap mapIndex={9999} />
        <SeeOnMap mapIndex={null} />
      </>,
    );
    expect(container.querySelector('a')).toBeNull();
    expect(onMap({ ...result, map: undefined } as EngineResult, 52)).toBe(false);
  });

  it("finds a constellation's map from the Map's constellations overlay", () => {
    expect(constellationMap(result, 'Grandfrogger')).toBe(52);
    expect(constellationMap(result, 'Nobody')).toBeNull();
  });
});

describe('DS-20: StateGlyph draws every state as a path, never as SVG text', () => {
  it('the unknown "?" is a path and a dot, not 10 px text', () => {
    for (const state of ['ok', 'behind', 'held-upgrade', 'empty', 'unknown']) {
      const { container } = render(<StateGlyph state={state} />);
      expect(container.querySelector('text')).toBeNull();
      expect(container.querySelector('svg')?.getAttribute('width')).toBe('12');
      cleanup();
    }
  });
});
