// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 Views in the DOM, area S (M21 §9): the hub and the System pages (US-5, US-8, US-9), the same truth
// everywhere (FR-33) and the TR-9 provenance check. Split from shell.test.tsx.

import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { noAxeViolations, places, withSystems } from './helpers/views';
import { props, renderNow, saveOf } from './now-helpers';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

describe('US-5, US-8, US-9 the hub and System pages', () => {
  it('shows each tile with a glyph and a word, a locked tile with how it opens, and "Wasting now"', async () => {
    window.history.replaceState(null, '', '/#systems');
    const r = withSystems();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const anvil = screen.getByRole('link', { name: /^Anvil,/ });
    expect(anvil.getAttribute('aria-label')).toBe('Anvil, Wasting, 1 to fix before you leave');
    expect(anvil.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    expect(screen.getByRole('link', { name: /^Post Office,/ }).getAttribute('aria-label')).toBe(
      'Post Office, Locked, Opens once a character reaches class Lv 50 · 1 to do',
    );
    // M21 FR-S1: "Needs you" became the "Wasting now" strip (behind Systems sit on the report card).
    const needs = screen.getByRole('region', { name: 'Wasting now' });
    expect(
      within(needs)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Anvil']);
    expect(screen.queryByRole('link', { name: /^AFK safety/ })).toBeNull();
    await noAxeViolations(container);
  });

  it('a System page lists its Next Actions with who, its coverage, and Skip acts everywhere (FR-33)', async () => {
    window.history.replaceState(null, '', '/#system-anvil');
    const r = withSystems();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByText('Dahlia · Barbarian lv 51')).toBeTruthy();
    expect(screen.getByText(/Unspent anvil points/).textContent).toContain('checked: see above');
    expect(screen.queryByRole('link', { name: /^See it/ })).toBeNull();
    await noAxeViolations(container);
    fireEvent.click(screen.getByRole('button', { name: 'Skip today' }));
    expect(screen.getByText(/1 skipped ·/)).toBeTruthy();
    // The hub's count and the badge drop in the same render.
    expect(within(places()).getByRole('link', { name: 'Systems' })).toBeTruthy();
  });

  it("an uncovered System says ActiveOn doesn't check it, with its wiki link", () => {
    window.history.replaceState(null, '', '/#system-equinox');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByText(/ActiveOn doesn't check Equinox yet\./)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'IdleOn Wiki page' }).getAttribute('href')).toBe(
      'https://idleon.wiki/wiki/Equinox',
    );
    expect(screen.queryByText('Nothing to fix')).toBeNull();
  });

  it('TR-9: every text the hub shows is a builder segment, a fact or a view word', () => {
    window.history.replaceState(null, '', '/#systems');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const hub = document.querySelector('.systems-hub') as HTMLElement;
    const allowed = new Set([
      ...(r.systems ?? []).map((s) => s.name),
      'Systems',
      // M21 FR-S1, FR-S2: the report card, the Wasting strip and the bands' once-per-band lines.
      'Wasting now',
      'What did I skip',
      '1 System wasting',
      'Nothing behind for your Stage.',
      'All Systems',
      '1 needs you',
      "1 here isn't covered yet",
      'Across worlds',
      'World 1 · Blunder Hills',
      'World 2 · Yum-Yum Desert',
      'World 3 · Frostbite Tundra',
      'Opens in World 3 · Frostbite Tundra',
      'Wasting',
      'Locked',
      'Behind',
      "Can't tell",
      'Not covered yet',
      'Nothing to fix',
      ' · ',
      '1 to fix before you leave',
      'Opens once a character reaches class Lv 50',
      "Can't tell from the save",
      'Later worlds: 1 Systems',
    ]);
    const texts: string[] = [];
    const walk = document.createTreeWalker(hub, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) if (walk.currentNode.textContent) texts.push(walk.currentNode.textContent);
    expect(texts.filter((t) => !allowed.has(t) && !/^\d+ to do$/.test(t))).toEqual([]);
  });
});
