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
      others: [{ id: 11, label: 'Gilded Sword', level: 5 }],
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

/** M24: the Characters place's square for one tab of one character (the Roster's tab chips are gone). */
function openSquare(tab: string, index: number) {
  act(() => {
    window.history.replaceState(null, '', '/#characters');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  const grid = document.querySelector('.cp-grid') as HTMLElement;
  fireEvent.click(grid.querySelector(`a[href="#${tab}-${index}"]`) as HTMLElement);
}

describe('Build view', () => {
  it('Characters has a Talent points square for every Build, each a link to its Build tab (M24)', () => {
    const r = withBuilds();
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.queryByRole('region', { name: 'Builds' })).toBeNull();
    const grid = document.querySelector('.cp-grid') as HTMLElement;
    const links = [...grid.querySelectorAll<HTMLAnchorElement>('a[href^="#build-"]')];
    expect(links.map((a) => a.getAttribute('href')).sort()).toEqual(['#build-1', '#build-2']);
    expect(grid.querySelector('a[href="#build-1"]')?.getAttribute('aria-label')).toMatch(
      /, Build: at least 118 points$/,
    );
  });

  it('the Build chip opens the character page on its Build tab, with the deep link', async () => {
    const r = withBuilds();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    openSquare('build', 1);
    expect(window.location.hash).toBe('#build-1');
    const nav = screen.getByRole('navigation', { name: 'Character page' });
    // The strip has the view now (M21 Integration), so each tab carries its health badge (FR-C7).
    expect(within(nav).getByRole('link', { current: 'page' }).textContent).toBe(
      'Build118behind: at least 118 points',
    );
    // M24: the class path sits in the header, the next class's gate read out to a screen reader.
    const path = screen.getByRole('list', { name: 'Class path' });
    expect(path.textContent).toContain('Shaman');
    expect(path.textContent).toContain('(Elite class: Bubonic Conjuror at Eliteus)');
    // M25: the two presets are tabs, Fighting then Skilling; the one in use is tagged and open first,
    // and each tab says what is waiting in it (gold when points are waiting).
    const list = screen.getByRole('tablist', { name: 'Talent presets' });
    const tabs = within(list).getAllByRole('tab');
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(tabs[0]?.textContent).toBe('Fightingin useevery point placed');
    expect(tabs[1]?.textContent).toBe('Skillingat least 44 talent points to spend');
    expect(tabs[1]?.querySelector('.bd-ptab-sub.is-open .a-pip--gold')).toBeTruthy();
    const panel = screen.getByRole('tabpanel', { name: /^Fighting/ });
    expect(panel.querySelector('.a-frame')?.textContent).toContain('Every point is placed');
    expect(screen.getByRole('group', { name: 'Fighting preset: talent tabs (talent points)' })).toBeTruthy();
    // Arrow keys move to the Skilling tab and open it: its answer becomes the frame.
    fireEvent.keyDown(tabs[0] as HTMLElement, { key: 'ArrowRight' });
    const after = within(screen.getByRole('tablist', { name: 'Talent presets' })).getAllByRole('tab');
    expect(after.map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    expect(document.activeElement).toBe(after[1]);
    const skilling = screen.getByRole('tabpanel', { name: /^Skilling/ });
    expect(skilling.querySelector('.a-frame')?.textContent).toContain(
      'Spend at least 44 talent points, starting with Book of the Wise',
    );
    expect(screen.getByRole('group', { name: 'Skilling preset: talent tabs (talent points)' })).toBeTruthy();
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
      talentId: key.charCodeAt(0),
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
    openSquare('build', 1);
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/No points waiting/);
    expect(text).not.toMatch(/can't/i);
    // M25: the preset in use opens first; the Skilling tab opens the one with known points. Its ladder
    // lists every step in spend order, each with its band in words, and the gold line where they end.
    expect(document.getElementById('bv-1-p0-t1')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /^Skilling/ }));
    const skilling = document.getElementById('bv-1-p1-t1') as HTMLElement;
    const bands = [...skilling.querySelectorAll('.bd-step')].map((li) => li.getAttribute('data-band'));
    expect(bands).toEqual(['now', 'part', 'next', 'later']);
    const cut = skilling.querySelector('.bd-cut') as HTMLElement;
    expect(cut.textContent).toMatch(
      /^At least 70 Calm Basics tab points end here · 80 more points finish step 2 · as of your last save \((just now|.+ ago)\)$/,
    );
    expect(cut.previousElementSibling?.textContent).toContain('Mana Booster');
    expect(cut.nextElementSibling?.textContent).toContain('Health Booster');
    expect(skilling.textContent).toContain('Add 50 now');
    expect(skilling.textContent).toContain('Add 20 now · 80 more points to finish');
    // Running totals: points in by each step.
    const totals = [...skilling.querySelectorAll('.bd-step')].map(
      (li) => li.querySelector('.bd-cum')?.textContent,
    );
    expect(totals).toEqual(['50points in', '150points in', '250points in', '']);
    // The book: order numbers on the talents the Build names; the selected talent's panel.
    const book = screen.getByRole('list', { name: 'Calm Basics tab talents' });
    expect(within(book).getByRole('button', { name: '2. Mana Booster: +20 of 100' })).toBeTruthy();
    const side = screen.getByRole('region', { name: 'Selected' });
    expect(side.textContent).toContain('Mana Booster');
    expect(side.textContent).toContain('20 of 100 points');
    // No known points (the fighting preset): the line sits where the open steps start, in the engine's words.
    fireEvent.click(screen.getByRole('tab', { name: /^Fighting/ }));
    const fighting = document.getElementById('bv-1-p0-t1') as HTMLElement;
    expect(fighting.querySelector('.bd-cut')?.textContent).toContain(
      'No unspent points known from your last save: the totals show where new points go',
    );
    const rows = [...fighting.querySelectorAll('.bd-step')].map((li) => [
      li.getAttribute('data-band'),
      li.querySelector('.bd-step-name')?.textContent,
    ]);
    expect(rows).toEqual([
      ['done', 'Gilded Sword'],
      ['next', 'Idle Shooting'],
      ['next', 'Mana Booster'],
    ]);
    expect(fighting.querySelector('.bd-cut')?.nextElementSibling?.textContent).toContain('Idle Shooting');
    await noAxeViolations(container);
  });

  it('M24: points that cover the whole build say "Build complete", never "end here" under the last step', () => {
    const s = (key: string, label: string, cumulative: number): BuildPathStepView => ({
      key,
      talentId: key.charCodeAt(0),
      label,
      page: null,
      current: 0,
      goal: 100,
      need: 100,
      cumulative,
      band: 'now',
      partNow: null,
      core: false,
      condition: null,
      note: null,
    });
    const tab = {
      tab: 1,
      name: 'Calm Basics',
      spent: 0,
      unspent: 366,
      rows: [],
      others: [],
      known: { kind: 'exact' as const, points: 366, overBy: null, verified: true },
      path: [s('a', 'Elusive Efficiency', 100), s('b', 'Broken Time', 200), s('c', 'Book of the Wise', 300)],
    };
    const r: EngineResult = {
      ...fixture('mid-session'),
      builds: [{ ...shaman, presets: [preset(0, {}), preset(1, { unspent: 366, tabs: [tab] })] }],
    };
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    openSquare('build', 1);
    fireEvent.click(screen.getByRole('tab', { name: /^Skilling/ }));
    const ladder = document.getElementById('bv-1-p1-t1') as HTMLElement;
    const cut = ladder.querySelector('.bd-cut-t')?.textContent ?? '';
    expect(cut).toMatch(/^Build complete at 300 · 66 points have no talent in this build yet/);
    expect(cut).not.toMatch(/end here/);
    expect(document.body.textContent).toContain('Talent points: 366 across 1 tab');
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

  it('M26: the preset names its Build with the confidence label and the Sources, said once', () => {
    const conf = {
      level: 'L' as const,
      sourceCount: 1,
      text: 'Community build · one source',
      label: 'one source',
    };
    const r: EngineResult = {
      ...fixture('mid-session'),
      builds: [
        {
          ...shaman,
          presets: shaman.presets.map((p) => ({
            ...p,
            confidence: conf,
            sources: shaman.sources,
            entryId: 'talents.build.shaman-skilling',
          })),
        },
      ],
    };
    window.history.replaceState(null, '', `/#build-${shaman.index}`);
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const prov = document.querySelector('.bd-prov') as HTMLElement;
    expect(prov).not.toBeNull();
    expect(within(prov).getByText('Community build · one source')).toBeTruthy();
    expect(within(prov).getByRole('link', { name: 'IdleOn Wiki: Shaman' }).getAttribute('href')).toBe(
      'https://idleon.wiki/wiki/Shaman',
    );
    // The footer keeps the quiet note but not a second copy of the link.
    expect(screen.getAllByRole('link', { name: 'IdleOn Wiki: Shaman' })).toHaveLength(1);
  });

  it('an end-game character with no Build still shows its talent tabs and levels (M24 QA P1-9)', () => {
    const tab = (
      t: number,
      name: string,
      spent: number,
      others: { id: number; label: string; level: number }[],
    ) => ({
      tab: t,
      name,
      spent,
      unspent: null,
      rows: [],
      others,
      known: { kind: 'none' as const, points: null, overBy: null },
      path: [],
    });
    const plain: BuildRoadmap = {
      ...noBuild,
      classLabel: 'Siege Breaker',
      level: 1291,
      note: 'No build for this stage yet (builds cover World 1 to World 4): these are your talent levels',
      presets: [
        preset(0, {
          active: false,
          role: null,
          heading: 'Other preset',
          tabs: [tab(1, 'Calm Basics', 0, [])],
        }),
        preset(1, {
          active: true,
          role: null,
          heading: 'Current preset',
          tabs: [
            tab(1, 'Calm Basics', 1146, [
              { id: 1, label: 'Quickness Boots', level: 820 },
              { id: 2, label: 'Featherweight', level: 326 },
            ]),
            tab(2, 'Archer', 208, [{ id: 3, label: 'Some Archer Talent', level: 208 }]),
          ],
        }),
      ],
    };
    window.history.replaceState(null, '', '/#build-2');
    const r: EngineResult = { ...fixture('mid-session'), builds: [shaman, plain] };
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByText(plain.note ?? '')).toBeTruthy();
    // The preset in use opens first (M25 tabs); the empty one says so.
    const presets = screen.getByRole('tablist', { name: 'Talent presets' });
    expect(within(presets).getByRole('tab', { selected: true }).textContent).toBe(
      'Preset 2in use1,354 points in',
    );
    expect(within(presets).getByRole('tab', { selected: false }).textContent).toBe('Preset 1empty');
    // The talent tabs, the one shown pressed, and its talents with their levels.
    const tabs = screen.getByRole('group', { name: 'Preset 2: talent tabs' });
    expect(within(tabs).getByRole('button', { pressed: true }).textContent).toBe('Calm Basics');
    const book = screen.getByRole('list', { name: 'Calm Basics tab talents' });
    expect(
      within(book)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Quickness BootsLevel 820', 'FeatherweightLevel 326']);
    // Each talent wears its game sprite (ADR 0009, 2026-10-19), by its skillIndex.
    expect([...book.querySelectorAll('img')].map((i) => i.getAttribute('src'))).toEqual([
      '/game-art/data/UISkillIcon1.webp',
      '/game-art/data/UISkillIcon2.webp',
    ]);
    fireEvent.click(within(tabs).getByRole('button', { name: /Archer/ }));
    expect(
      within(screen.getByRole('list', { name: 'Archer tab talents' })).getByText('Some Archer Talent'),
    ).toBeTruthy();
    // No build: no points to spend, no gold dot on the Build tab.
    expect(screen.queryByText(/Spend /)).toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Character page' });
    expect(within(nav).getByRole('link', { current: 'page' }).textContent).toBe('Build');
  });

  it('the same note on every character is one account-level line (#70 A5)', () => {
    const note =
      'No build for this stage yet (builds cover World 1 to World 4): these are your talent levels';
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
    // M24: no Builds overview; each character's Talent points square says it plainly.
    const grid = document.querySelector('.cp-grid') as HTMLElement;
    const squares = [...grid.querySelectorAll<HTMLAnchorElement>('a[href^="#build-"]')];
    expect(squares).toHaveLength(3);
    for (const a of squares) expect(a.textContent).toContain('No build yet');
  });

  it('#builds opens Characters at its Talent points column (M17 FR-7, M24)', () => {
    const r = withBuilds();
    window.history.replaceState(null, '', '/#builds');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByRole('heading', { level: 2, name: 'Characters' })).toBeTruthy();
    expect(document.getElementById('builds')?.textContent).toBe('Talent points');
    // The Account is on Now only.
    expect(screen.queryByRole('region', { name: 'Account' })).toBeNull();
  });

  it('a result without Builds shows no overview and no Build chip', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.queryByRole('region', { name: 'Builds' })).toBeNull();
    expect(screen.queryByRole('link', { name: /: build$/ })).toBeNull();
  });
});
