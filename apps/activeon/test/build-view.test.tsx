// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build view in the DOM (owner request 2026-10-18): the Builds overview and the Build chip on the
// Roster, the character page's tabs, the `#build-<index>` deep link and the roadmap's parts.
import type { BuildPresetView, BuildRoadmap, EngineResult } from '@idleon-forge/engine/result';
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { characterTabs, parseTabHash, tabHref } from '../src/now/character-tabs';
import { fixture, props, renderNow, saveOf } from './now-helpers';

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
    expect(tabHref('build', 4)).toBe('?c=4#build-4');
  });
});

describe('Build view', () => {
  it('the Roster lists every Build with its one-line status, and each row has a Build chip', () => {
    const r = withBuilds();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const overview = screen.getByRole('region', { name: 'Builds' });
    const links = within(overview).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#build-1', '#build-2']);
    expect(links[0]?.textContent).toContain('118+ unspent on the skilling preset · next: Book of the Wise');
    expect(screen.getByRole('link', { name: 'Birch: build' })).toBeTruthy();
  });

  it('the Build chip opens the character page on its Build tab, with the deep link', async () => {
    const r = withBuilds();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('link', { name: 'Birch: build' }));
    expect(window.location.hash).toBe('#build-1');
    const nav = screen.getByRole('navigation', { name: 'Character page' });
    expect(within(nav).getByRole('link', { current: 'page' }).textContent).toBe('Build');
    expect(screen.getByText('118+ unspent on the skilling preset · next: Book of the Wise')).toBeTruthy();
    expect(screen.getByText('Elite class: Bubonic Conjuror at Eliteus')).toBeTruthy();
    // Both presets, tabbed on a phone: the active one is selected first.
    const tabs = screen.getByRole('tablist', { name: 'Talent presets' });
    expect(
      within(tabs)
        .getAllByRole('tab')
        .map((t) => t.getAttribute('aria-selected')),
    ).toEqual(['true', 'false']);
    fireEvent.click(within(tabs).getByRole('tab', { name: 'Skilling preset' }));
    expect(screen.getByText('At least 118 points unspent')).toBeTruthy();
    expect(screen.getByText('Put the next 84 points into Book of the Wise (to 100)')).toBeTruthy();
    // Talent rows: current / target with a progress bar, inside their own scroll box.
    const bar = screen.getAllByRole('progressbar', { name: 'Book of the Wise: 16 of 100' })[0];
    expect(bar?.closest('.bv-scroll')).toBeTruthy();
    expect(screen.getByText(/Low-confidence build/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'IdleOn Wiki: Shaman' })).toBeTruthy();
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
    expect(window.location.hash).toBe('');
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
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const overview = screen.getByRole('region', { name: 'Builds' });
    expect(within(overview).queryAllByRole('link')).toHaveLength(0);
    expect(overview.textContent).toContain(
      "Builds cover World 1 to World 4 for now. Each character's Build tab shows its plain talent levels.",
    );
  });

  it('R5 QA P2-2: the overview is one folded row, below the Account, that opens from "Builds ↓"', () => {
    const r = withBuilds();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const overview = screen.getByRole('region', { name: 'Builds' });
    const fold = overview.querySelector('details');
    expect(fold?.open).toBe(false);
    expect(overview.querySelector('summary')?.textContent).toBe('Builds1 with unspent points›');
    // "Fix before you leave" in the Account is never below an optional overview.
    const account = screen.getByRole('region', { name: 'Account · any character' });
    expect(account.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    act(() => {
      window.history.replaceState(null, '', '/#builds');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(overview.querySelector('details')?.open).toBe(true);
  });

  it('a result without Builds shows no overview and no Build chip', () => {
    const r = fixture('mid-session');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.queryByRole('region', { name: 'Builds' })).toBeNull();
    expect(screen.queryByRole('link', { name: /: build$/ })).toBeNull();
  });
});
