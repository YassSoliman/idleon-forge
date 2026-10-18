// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build view in the DOM (owner request 2026-10-18): the Builds overview and the Build chip on the
// Roster, the character page's tabs, the `#build-<index>` deep link and the roadmap's parts.
import type {
  BuildPathStepView,
  BuildPresetView,
  BuildRoadmap,
  EngineResult,
} from '@idleon-forge/engine/result';
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { characterTabs, healthReady, parseTabHash, tabHref } from '../src/now/character-tabs';
import { fixture, props, renderNow, saveOf } from './now-helpers';

beforeAll(() => healthReady);
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

const preset = (slot: 0 | 1, over: Partial<BuildPresetView>): BuildPresetView => ({
  slot,
  active: slot === 0,
  role: slot === 0 ? 'fighting' : 'skilling',
  heading: slot === 0 ? 'Fighting preset' : 'Skilling preset',
  roleText: slot === 0 ? 'Shaman fighting build' : 'Shaman alchemy and choppin build',
  buildTitle: 'Shaman build',
  unspent: 0,
  tabs: [
    {
      tab: 1,
      name: 'Savvy Basics',
      spent: 216,
      unspent: slot === 1 ? 44 : 0,
      rows: [
        {
          id: 1,
          label: 'Smart Efficiency',
          current: 100,
          target: 100,
          max: 100,
          met: true,
          core: false,
          note: null,
        },
        {
          id: 2,
          label: 'Book of the Wise',
          current: 16,
          target: 100,
          max: 100,
          met: false,
          core: false,
          note: null,
        },
      ],
      others: [{ label: 'Gilded Sword', level: 5 }],
    },
  ],
  attackBar: null,
  next: [],
  ...over,
});

const shaman: BuildRoadmap = {
  index: 1,
  classLabel: 'Shaman',
  level: 44,
  status: '118+ unspent on the skilling preset · next: Book of the Wise',
  path: [
    { class: 'Beginner', label: 'Beginner', state: 'done' },
    { class: 'Mage', label: 'Mage', state: 'done' },
    { class: 'Shaman', label: 'Shaman', state: 'now' },
    { class: 'Bubonic_Conjuror', label: 'Bubonic Conjuror', state: 'next' },
  ],
  nextClass: 'Elite class: Bubonic Conjuror at Eliteus',
  presets: [
    preset(0, {}),
    preset(1, {
      unspent: 118,
      next: [
        {
          key: 'n1',
          tab: 1,
          label: 'Book of the Wise',
          text: 'Put the next 84 points into Book of the Wise (to 100)',
          points: 84,
        },
      ],
    }),
  ],
  comingUp: ['Elite talent builds are not covered yet'],
  note: null,
  quiet: 'Low-confidence build, put together from community builds. Check it against the Sources.',
  stale: false,
  sources: [
    {
      label: 'IdleOn Wiki: Shaman',
      url: 'https://idleon.wiki/wiki/Shaman',
      tier: 2,
      verifiedOn: '2026-10-17',
      gameVersion: '2.3.540',
    },
  ],
  entryIds: ['talents.build.shaman-skilling'],
};

const noBuild: BuildRoadmap = {
  ...shaman,
  index: 2,
  classLabel: 'Bowman',
  level: 38,
  status: 'No build yet for this class',
  note: 'No build yet for this class',
  quiet: null,
  sources: [],
  presets: [preset(0, { role: null, heading: 'Current preset', roleText: 'No build to compare', tabs: [] })],
  comingUp: [],
};

const withBuilds = (): EngineResult => ({ ...fixture('mid-session'), builds: [shaman, noBuild] });

async function noAxeViolations(container: HTMLElement) {
  const res = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([]);
}

describe('character tabs registry', () => {
  it('has Now first and Build, and parses only registered tab anchors', () => {
    expect(characterTabs.map((t) => t.id).slice(0, 2)).toEqual(['now', 'build']);
    expect(parseTabHash('#build-3')).toEqual({ tab: 'build', index: 3 });
    expect(parseTabHash('#now-3')).toBeNull();
    expect(parseTabHash('#builds')).toBeNull();
    expect(parseTabHash('#nope-1')).toBeNull();
    // M17 FR-7, D-2: bare anchors only; `?c=` is retired.
    expect(tabHref('build', 4)).toBe('#build-4');
    expect(tabHref('now', 4)).toBe('#now-4');
  });
});

describe('Build view', () => {
  it('Characters lists every Build with its one-line status; each Roster row keeps a Build chip (M17 D-7)', () => {
    const r = withBuilds();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.queryByRole('region', { name: 'Builds' })).toBeNull();
    expect(screen.getByRole('link', { name: /^Birch: build/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Builds and cards → Characters' }));
    expect(window.location.hash).toBe('#characters');
    const overview = screen.getByRole('region', { name: 'Builds' });
    const links = within(overview).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#build-1', '#build-2']);
    expect(links[0]?.textContent).toContain('118+ unspent on the skilling preset · next: Book of the Wise');
  });

  it('the Build chip opens the character page on its Build tab, with the deep link', async () => {
    const r = withBuilds();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('link', { name: /^Birch: build/ }));
    expect(window.location.hash).toBe('#build-1');
    const nav = screen.getByRole('navigation', { name: 'Character page' });
    expect(within(nav).getByRole('link', { current: 'page' }).textContent).toBe('Build');
    expect(screen.getByText('118+ unspent on the skilling preset · next: Book of the Wise')).toBeTruthy();
    expect(screen.getByText('Elite class: Bubonic Conjuror at Eliteus')).toBeTruthy();
    // Both presets, a segmented choice on a phone (M21 FR-C3): the active one is selected first.
    const presets = screen.getByRole('group', { name: 'Talent presets' });
    expect(
      within(presets)
        .getAllByRole('radio')
        .map((t) => (t as HTMLInputElement).checked),
    ).toEqual([true, false]);
    fireEvent.click(within(presets).getByRole('radio', { name: 'Skilling preset' }));
    // One step, then the rest (FR-C4), above the game-tab grid (FR-C3) with its tiles as buttons.
    expect(screen.getByText('Put the next 84 points into Book of the Wise (to 100)')).toBeTruthy();
    const grid = screen.getByRole('list', { name: 'Talent tabs' });
    expect(within(grid).getByRole('button', { name: /Savvy Basics/ })).toBeTruthy();
    expect(screen.getByText(/Low-confidence build/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'IdleOn Wiki: Shaman' })).toBeTruthy();
    await noAxeViolations(container);
  });

  it('fix/build-points: every Build step shows, banded, with the marker where known points end', async () => {
    const step = (
      key: string,
      label: string,
      band: BuildPathStepView['band'],
      current: number,
      goal: number,
      cumulative: number | null,
      partNow: number | null = null,
    ): BuildPathStepView => ({
      key,
      talentId: key.length,
      label,
      page: null,
      current,
      goal,
      need: goal - current,
      cumulative,
      band,
      partNow,
      core: false,
      condition: band === 'later' ? 'from World 3, early' : null,
      note: null,
    });
    const tab = (known: number, path: BuildPathStepView[]) => ({
      tab: 1,
      name: 'Calm Basics',
      spent: 250,
      unspent: known,
      rows: [],
      others: [],
      known: { kind: 'lower-bound' as const, points: known, overBy: null },
      path,
    });
    const r: EngineResult = {
      ...fixture('mid-session'),
      builds: [
        {
          ...shaman,
          presets: [
            preset(0, {
              tabs: [
                tab(0, [
                  step('a', 'Gilded Sword', 'done', 100, 100, null),
                  step('b', 'Idle Shooting', 'next', 50, 100, 50),
                  step('c', 'Mana Booster', 'next', 0, 100, 150),
                ]),
              ],
            }),
            preset(1, {
              unspent: 70,
              tabs: [
                tab(70, [
                  step('d', 'Idle Shooting', 'now', 50, 100, 50),
                  step('e', 'Mana Booster', 'part', 0, 100, 150, 20),
                  step('f', 'Health Booster', 'next', 0, 100, 250),
                  step('g', 'Refinery Throttle', 'later', 0, 100, null),
                ]),
              ],
            }),
          ],
        },
      ],
    };
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('link', { name: /^Birch: build/ }));
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/No points waiting/);
    expect(text).not.toMatch(/can't/i);
    // The preset with known points leads (FR-C3 "Start here"): can add now, part now, the marker,
    // then next and later. Each row says its band in words (TR-17) beside its glyph and colour.
    const skillingPath = () => document.getElementById('bv-1-p1-t1') as HTMLElement;
    const skilling = skillingPath();
    expect(
      within(skilling).getByText('As of your last save: at least 70 points waiting · they end here'),
    ).toBeTruthy();
    const bands = [...skilling.querySelectorAll('.bv-ps')].map((li) => li.getAttribute('data-band'));
    expect(bands).toEqual(['now', 'part', 'next', 'later']);
    expect(skilling.textContent).toContain('+20 of 100 now');
    expect(skilling.textContent).toContain('+150 → Mana Booster');
    expect(skilling.textContent).toContain('next after these');
    const marker = skilling.querySelector('.bv-marker');
    expect(marker?.previousElementSibling?.textContent).toContain('Mana Booster');
    expect(marker?.nextElementSibling?.textContent).toContain('Health Booster');
    // No known points (the fighting preset): the marker leads and every unmet step is "next after
    // these" with its running total.
    fireEvent.click(screen.getByRole('radio', { name: 'Fighting preset' }));
    expect(
      screen.getByText('No unspent points known from your last save: the totals show where new points go'),
    ).toBeTruthy();
    const fighting = document.getElementById('bv-1-p0-t1') as HTMLElement;
    const rows = [...fighting.querySelectorAll('.bv-ps')].map((li) => [
      li.getAttribute('data-band'),
      li.querySelector('.bv-ps-name')?.textContent,
      li.querySelector('.bv-ps-total')?.textContent ?? null,
    ]);
    expect(rows).toEqual([
      ['done', 'Gilded Sword', null],
      ['next', 'Idle Shooting', '+50 → Idle Shooting'],
      ['next', 'Mana Booster', '+150 → Mana Booster'],
    ]);
    expect(fighting.querySelector('.bv-marker')?.nextElementSibling?.textContent).toContain('Gilded Sword');
    await noAxeViolations(container);
  });

  it('opens straight on the Build tab from a bare #build-<index> link, and Now goes back to the card', () => {
    window.history.replaceState(null, '', '/#build-2');
    const r = withBuilds();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getAllByText('No build yet for this class').length).toBeGreaterThan(0);
    expect(screen.queryByRole('tablist', { name: 'Talent presets' })).toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Character page' });
    fireEvent.click(within(nav).getByRole('link', { name: 'Now' }));
    expect(window.location.hash).toBe('#now-2');
    expect(screen.queryByText('No build yet for this class')).toBeNull();
  });

  it('the same note on every character is one account-level line (#70 A5)', () => {
    const note = 'Builds cover World 1 to World 4 for now; these are your plain talent levels';
    const r: EngineResult = {
      ...fixture('mid-session'),
      builds: [0, 1, 2].map((index) => ({
        ...noBuild,
        index,
        note,
        status: 'Builds cover World 1 to World 4 for now',
      })),
    };
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const overview = screen.getByRole('region', { name: 'Builds' });
    expect(within(overview).queryAllByRole('link')).toHaveLength(0);
    expect(overview.textContent).toContain(
      "Builds cover World 1 to World 4 for now. Each character's Build tab shows its plain talent levels.",
    );
  });

  it('R5 QA P2-2: the overview is one folded row in Characters, and #builds opens it there (M17 FR-7)', () => {
    const r = withBuilds();
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const overview = screen.getByRole('region', { name: 'Builds' });
    const fold = overview.querySelector('details');
    expect(fold?.open).toBe(false);
    expect(overview.querySelector('summary')?.textContent).toBe('Builds1 with unspent points');
    // The Account is on Now, never under the optional overviews.
    expect(screen.queryByRole('region', { name: 'Account' })).toBeNull();
    act(() => {
      window.history.replaceState(null, '', '/#builds');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('region', { name: 'Builds' }).querySelector('details')?.open).toBe(true);
  });

  it('a result without Builds shows no overview and no Build chip', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.queryByRole('region', { name: 'Builds' })).toBeNull();
    expect(screen.queryByRole('link', { name: /: build$/ })).toBeNull();
  });
});
