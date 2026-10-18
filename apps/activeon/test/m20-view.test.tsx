// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 in the DOM: the Daily & Weekly Checklist section in the Account (rings with their text, bands, a
// glyph and a word per state, the Done tick), the character page's Skills tab with its `#skills-<index>`
// deep link, and the `#skills` route (X9).
import type { CharacterSkills, Checklist, EngineResult } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { characterTabs, parseTabHash } from '../src/now/character-tabs';
import { routeOfHash } from '../src/shell/route';
import { fixture, props, renderNow, saveOf } from './now-helpers';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

const src = [
  {
    label: 'IdleOn Wiki: Killroy',
    url: 'https://idleon.wiki/wiki/Killroy%27s_Slaughterhouse',
    tier: 2 as const,
    verifiedOn: '2026-10-18',
    claimDate: '2026-10-05',
    gameVersion: '2.3.540',
  },
];

function withM20(r: EngineResult): EngineResult {
  const at = r.asOf;
  const checklist: Checklist = {
    clocks: {
      daily: at + 12 * 3_600_000,
      accountWeek: at + 36 * 3_600_000,
      serverWeek: at + 100 * 3_600_000,
      ballotWeek: at + 50 * 3_600_000,
    },
    rings: { today: { done: 1, total: 3 }, week: { done: 0, total: 1 } },
    rows: [
      {
        id: 'spiketrap',
        band: 'no-bank',
        clock: 'daily',
        label: 'Spiketrap gems',
        state: 'todo',
        details: [],
        periodEnd: at + 12 * 3_600_000,
        availableAt: null,
        lostBeforeReturn: false,
        resetSinceSave: false,
        effortSeconds: 60,
        doneAt: null,
        manual: null,
        link: null,
        nextAction: 'Play Spiketrap for its gems',
        systemId: 'minigames',
        sources: src,
      },
      {
        id: 'guild-daily',
        band: 'no-bank',
        clock: 'daily',
        label: 'Guild daily tasks',
        state: 'todo',
        details: [],
        periodEnd: at + 12 * 3_600_000,
        availableAt: null,
        lostBeforeReturn: false,
        resetSinceSave: false,
        effortSeconds: 60,
        doneAt: null,
        manual: { key: 'checklist@guild-daily@20740', hint: '2 of 5 met' },
        link: null,
        nextAction: "Claim your guild's daily tasks",
        systemId: 'guild',
        sources: src,
      },
      {
        id: 'vial-attempts',
        band: 'no-bank',
        clock: 'daily',
        label: 'Vial attempts',
        state: 'done',
        details: ['0 of 17 left'],
        periodEnd: at + 12 * 3_600_000,
        availableAt: null,
        lostBeforeReturn: false,
        resetSinceSave: false,
        effortSeconds: 60,
        doneAt: null,
        manual: null,
        link: null,
        nextAction: 'Use your vial attempts',
        systemId: 'alchemy-vials',
        sources: src,
      },
      {
        id: 'killroy-skulls',
        band: 'weekly',
        clock: 'account-week',
        label: 'Spend 6 Killroy skulls',
        state: 'todo',
        details: ['4 skulls buy 10 Arcade balls: 50 of 50 packs left this week'],
        periodEnd: at + 36 * 3_600_000,
        availableAt: null,
        lostBeforeReturn: true,
        resetSinceSave: false,
        effortSeconds: 90,
        doneAt: null,
        manual: null,
        link: null,
        nextAction: 'Spend 6 Killroy skulls',
        systemId: 'killroy',
        sources: src,
      },
    ],
    gated: [{ band: 'no-bank', text: "Post Office orders: finish Postboy Pablob's quest" }],
    expanded: true,
  };
  const c = r.characters[0];
  const skills: CharacterSkills[] = c
    ? [
        {
          index: c.index,
          rows: [
            {
              skill: 'construction',
              level: 11,
              progress: 0.5,
              efficiency: null,
              accountBest: { level: 11, index: c.index },
              role: { id: 'construction-builder', active: true, from: 'W3' },
              specialty: false,
              locked: null,
              nextGate: { label: 'Decent cogs', atLevel: 15, levelsLeft: 4, scope: 'character' },
            },
          ],
          train: {
            skill: 'construction',
            text: 'Train: Construction · trains while it sits on the Cog Board',
            via: 'parallel-slot',
            linkKey: null,
          },
          slots: [{ kind: 'cog', state: 'filled', text: 'builds on the Cog Board', linkKey: null }],
        },
      ]
    : [];
  return { ...r, checklist, skills };
}

describe('the Daily & Weekly Checklist section', () => {
  it('shows both rings as text, the bands, a word per state and the folded done rows', async () => {
    const r = withM20(fixture('mid-session'));
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const section = document.getElementById('checklist');
    expect(section?.textContent).toContain('Today 1 of 3 · Week 0 of 1');
    expect(section?.textContent).toContain('daily reset in 12h');
    expect(section?.textContent).toContain('No bank: lost at the reset');
    expect(section?.textContent).toContain('To do');
    expect(section?.textContent).toContain('lost before you are back');
    expect(section?.textContent).toContain("Opens later: Post Office orders: finish Postboy Pablob's quest");
    expect(within(section as HTMLElement).getByRole('button', { name: '1 done · show' })).toBeTruthy();
    await axe
      .run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })
      .then((res) => expect(res.violations.map((v) => v.id)).toEqual([]));
  });

  it('the Done tick on a row the save can’t judge counts in the today ring', () => {
    const r = withM20(fixture('mid-session'));
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const section = document.getElementById('checklist') as HTMLElement;
    fireEvent.click(within(section).getByRole('button', { name: 'Done' }));
    expect(section.textContent).toContain('Today 2 of 3');
    fireEvent.click(within(section).getByRole('button', { name: '2 done · show' }));
    expect(within(section).getByRole('button', { name: 'Done ✓ · undo' })).toBeTruthy();
  });
});

describe('the Skills tab', () => {
  it('is registered, parses its deep link, and the #skills overview is a route (X9)', () => {
    expect(characterTabs.some((t) => t.id === 'skills' && t.label === 'Skills')).toBe(true);
    expect(parseTabHash('#skills-2')).toEqual({ tab: 'skills', index: 2 });
    expect(routeOfHash('#skills', { tabs: ['now'], systems: [], indexes: [], timeline: true })).toEqual({
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
