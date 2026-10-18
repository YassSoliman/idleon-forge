// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Cards view in the DOM (M8, owner request 2026-10-18): the Cards overview and the Cards chip on the
// Roster, the character page's Cards tab with its `#cards-<index>` deep link, presets as slots, the
// best preset as swaps, the grind list, and card Goals linking to the tab.
import type {
  CardChip,
  CardsView,
  CharacterCards,
  EngineResult,
  GrindItem,
} from '@idleon-forge/engine/result';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { characterTabs, parseTabHash } from '../src/now/character-tabs';
import { fixture, props, renderNow, saveOf } from './now-helpers';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

const card = (name: string, level: number, effect: string): CardChip => ({
  rawName: name.replace(/ /g, ''),
  name,
  effect,
  level,
  stars: Math.max(0, level - 1),
  passive: false,
});

const grind: GrindItem = {
  rawName: 'flake',
  name: 'Frost Flake',
  effect: '+7 Base STR per level',
  monster: 'Frost Flake',
  map: 'Snowfield Outskirts',
  mapIndex: 103,
  world: 3,
  skill: null,
  owned: 30,
  level: 2,
  stars: 1,
  next: { copies: 49, label: 'level 3' },
  missing: 19,
  chance: 0.008,
  chanceText: '1 in 130',
  kills: 2375,
  hours: 1.2,
  etaText: 'about 1.2 h at the base drop chance (likely sooner)',
  improves: 'fighting preset (card preset 1)',
  farmingNow: [],
  helps: [],
  fastest: null,
  quick: true,
};

const cedar: CharacterCards = {
  index: 2,
  who: 'Bowman 38',
  activity: 'fighting',
  unknown: null,
  slotCount: 4,
  presetsLocked: null,
  presets: [
    {
      n: 1,
      active: true,
      slots: [card('Bored Bean', 4, '+28 Base Damage'), card('Copper', 1, '+4 Base accuracy'), null, null],
      fits: ['fighting'],
      label: 'fits fighting',
      fitsTarget: true,
      set: { rawName: 'CardSet1', name: 'Yum Yum Desert', tier: 1, bonus: '+10% All Food Effect' },
    },
    {
      n: 2,
      active: false,
      slots: [null, null, null, null],
      fits: [],
      label: 'empty',
      fitsTarget: false,
      set: null,
    },
  ],
  activePreset: 1,
  emptySlots: 2,
  set: { rawName: 'CardSet1', name: 'Yum Yum Desert', tier: 1, bonus: '+10% All Food Effect' },
  recommendations: [
    {
      activity: 'fighting',
      reason: 'afk-target',
      preset: 1,
      where: 'In your active card preset 1',
      cards: [card('Carrotman', 3, '+12 Base AGI'), card('Bored Bean', 4, '+28 Base Damage')],
      swaps: [
        { from: null, to: card('Carrotman', 3, '+12 Base AGI'), text: 'Add Carrotman' },
        {
          from: card('Copper', 1, '+4 Base accuracy'),
          to: card('Mimic', 2, '+4% Total Drop Rate'),
          text: 'Swap Copper → Mimic',
        },
      ],
      done: false,
      set: { rawName: 'CardSet1', name: 'Yum Yum Desert', tier: 1, bonus: '+10% All Food Effect' },
      setNote: null,
    },
  ],
  grind: [grind],
  grindNote:
    "3 more cards on its list drop from bosses, crystal mobs or nodes ActiveOn can't place on a map yet",
  grindEmpty: 'No card on its list drops on a map it can reach yet.',
  overview: 'preset fits fighting ✓ · 2 empty slots · next grind: Frost Flake card (about 1.2 h)',
  presetFits: true,
};

const cards: CardsView = {
  characters: [
    cedar,
    {
      ...cedar,
      index: 1,
      who: 'Shaman 44',
      overview: 'active preset empty · 4 empty slots · nothing to grind in reach',
      grind: [],
    },
  ],
  account: { grind: [{ ...grind, helps: ['Bowman 38', 'Shaman 44'], fastest: 'Bowman 38' }] },
  caveats: ['Hours are an average at each card’s base drop chance.'],
  sources: [
    {
      label: 'IdleOn Wiki: Cards',
      url: 'https://idleon.wiki/wiki/Cards',
      tier: 2,
      verifiedOn: '2026-10-18',
      gameVersion: '2.3.540',
    },
  ],
};

const withCards = (): EngineResult => ({ ...fixture('mid-session'), cards });

async function noAxeViolations(container: HTMLElement) {
  const res = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([]);
}

describe('Cards tab', () => {
  it('is registered after Build and parses its deep link', () => {
    expect(characterTabs.map((t) => t.id)).toEqual(['now', 'build', 'cards']);
    expect(parseTabHash('#cards-2')).toEqual({ tab: 'cards', index: 2 });
    expect(parseTabHash('#cards')).toBeNull();
  });

  it('Characters lists every character in the Cards overview; each Roster row keeps a Cards chip', () => {
    const r = withCards();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByRole('link', { name: 'Cedar: cards' })).toBeTruthy();
    // M17 D-7: one "Builds and cards → Characters" link replaces "Builds ↓" and "Cards ↓".
    expect(screen.queryByRole('link', { name: 'Cards ↓' })).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Builds and cards → Characters' }));
    const overview = screen.getByRole('region', { name: 'Cards' });
    const links = within(overview)
      .getAllByRole('link')
      .filter((a) => a.classList.contains('bo-row'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#cards-2', '#cards-1']);
    expect(links[0]?.textContent).toContain('next grind: Frost Flake card (about 1.2 h)');
  });

  it('R5 QA P2-2: the Cards overview is one folded row with a count', () => {
    const r = withCards();
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const overview = screen.getByRole('region', { name: 'Cards' });
    expect(overview.querySelector('details')?.open).toBe(false);
    expect(overview.querySelector('summary')?.textContent).toBe('Cardsevery preset fits›');
  });

  it('the Cards chip opens the character page on its Cards tab: presets, swaps and grind', async () => {
    const r = withCards();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('link', { name: 'Cedar: cards' }));
    expect(window.location.hash).toBe('#cards-2');
    const nav = screen.getByRole('navigation', { name: 'Character page' });
    expect(within(nav).getByRole('link', { current: 'page' }).textContent).toBe('Cards');
    const slots = screen.getByRole('list', { name: 'Preset 1 slots' });
    expect(within(slots).getAllByRole('listitem')).toHaveLength(4);
    expect(within(slots).getAllByText('empty slot')).toHaveLength(2);
    expect(screen.getByText('in use')).toBeTruthy();
    expect(screen.getByText('In your active card preset 1')).toBeTruthy();
    expect(screen.getByText('Mimic')).toBeTruthy();
    expect(
      screen.getByText('about 1.2 h at the base drop chance (likely sooner)', { exact: false }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'IdleOn Wiki: Cards' })).toBeTruthy();
    await noAxeViolations(container);
  });

  it("a card Goal on the Now list sees its character's Cards tab (M17 FR-31, FR-23a)", () => {
    const r: EngineResult = {
      ...withCards(),
      systems: [
        {
          id: 'cards',
          name: 'Cards',
          kind: 'game',
          world: 0,
          scope: 'both',
          unlocked: 'yes',
          unlockBy: 'always',
          covered: true,
          unlock: null,
          wiki: null,
          checks: [],
        },
      ],
    };
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('button', { name: /Cedar/ }));
    const links = screen.getAllByRole('link', { name: 'See it: Cards' });
    expect(links[0]?.getAttribute('href')).toBe('#cards-2');
    fireEvent.click(links[0] as HTMLElement);
    expect(window.location.hash).toBe('#cards-2');
  });

  it('a result without the Cards view shows no overview and no Cards chip', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.queryByRole('region', { name: 'Cards' })).toBeNull();
    expect(screen.queryByRole('link', { name: /: cards$/ })).toBeNull();
  });
});
