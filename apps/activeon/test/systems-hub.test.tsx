// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 Views in the DOM, area S (M21 §9), M24's index and page template: the hub and the System pages
// (US-5, US-8, US-9), the same truth everywhere (FR-33) and the TR-9 provenance check.

import { EMPTY_PREFS } from '@idleon-forge/engine/now';
import { buildSystemsHubView, buildSystemsView, INDEX_WORDS } from '@idleon-forge/engine/systems-ui';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Tabs } from '../src/systems/frame/SystemFrame';
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
    // M24: "Wasting now" is the screen's frame: each wasting System's first step and a link to it.
    const needs = screen.getByRole('region', { name: 'Wasting now' });
    expect(needs.classList.contains('a-frame')).toBe(true);
    expect(
      within(needs)
        .getAllByRole('link')
        .map((a) => a.getAttribute('aria-label')),
    ).toEqual(['See the fix: Anvil']);
    // The filters (M25: toggles, combinable): Wasting now shows only the wasting tiles.
    fireEvent.click(screen.getByRole('button', { name: /^Wasting now/ }));
    expect(screen.getByRole('link', { name: /^Anvil,/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /^Post Office,/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Wasting now/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Locked/ }));
    expect(screen.getByRole('link', { name: /^Post Office,/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /^Anvil,/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /^AFK safety/ })).toBeNull();
    await noAxeViolations(container);
  });

  it('a System page lists its Next Actions with who, its coverage, and Skip acts everywhere (FR-33)', async () => {
    window.history.replaceState(null, '', '/#system-anvil');
    const r = withSystems();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    // M24: who a step is for is the class and level, never the name; the checks tile says the check fired.
    expect((await screen.findAllByText('Barbarian 51')).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Dahlia/)).toBeNull();
    const checks = screen.getByRole('complementary', { name: 'What ActiveOn checks' });
    expect(checks.textContent).toContain('Unspent anvil points');
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
    expect(screen.getByText("ActiveOn doesn't check Equinox yet")).toBeTruthy();
    expect(screen.getByRole('link', { name: 'IdleOn Wiki: Equinox ↗' }).getAttribute('href')).toBe(
      'https://idleon.wiki/wiki/Equinox',
    );
    expect(screen.queryByText('Nothing to fix')).toBeNull();
  });

  it('the template: one frame, the back link to its world and the wiki link', async () => {
    window.history.replaceState(null, '', '/#system-stamps');
    const r = withSystems();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    await screen.findByRole('heading', { level: 2, name: 'Stamps' });
    expect(container.querySelectorAll('.a-frame')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /^IdleOn Wiki: / })).toBeTruthy();
    expect(screen.getByRole('link', { name: /^Systems · World 1/ })).toBeTruthy();
  });

  it('the template tabs: one tab stop, arrow keys move and open, the panel follows', () => {
    render(
      <Tabs
        name="Anvil"
        tabs={[
          { id: 'a', label: 'Point split', render: () => <p>split body</p> },
          { id: 'b', label: 'What each anvil makes', badge: 6, render: () => <p>makes body</p> },
        ]}
      />,
    );
    const list = screen.getByRole('tablist', { name: 'Anvil sections' });
    const [a, b] = within(list).getAllByRole('tab');
    expect(a?.getAttribute('aria-selected')).toBe('true');
    expect(b?.getAttribute('tabindex')).toBe('-1');
    expect(screen.getByRole('tabpanel').textContent).toBe('split body');
    fireEvent.keyDown(a as HTMLElement, { key: 'ArrowRight' });
    expect(b?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(b);
    expect(screen.getByRole('tabpanel').textContent).toBe('makes body');
    fireEvent.keyDown(b as HTMLElement, { key: 'Home' });
    expect(a?.getAttribute('aria-selected')).toBe('true');
  });

  it('TR-9: every text the hub shows is a builder string, a view word, a count or a registry name', () => {
    window.history.replaceState(null, '', '/#systems');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const hub = document.querySelector('.systems-hub') as HTMLElement;
    const prefs = EMPTY_PREFS;
    const ui = { now: r.asOf, lastCloudSave: null };
    const ix = buildSystemsHubView(r, prefs, ui, buildSystemsView(r, prefs, ui)).index;
    const words = (o: unknown): string[] =>
      typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(words) : [];
    const allowed = new Set([
      ...(r.systems ?? []).map((s) => s.name),
      'Systems',
      ...words(INDEX_WORDS),
      INDEX_WORDS.seeFix,
      ix.summary,
      ...ix.wasting.flatMap((w) => [
        w.step?.text ?? w.name,
        w.sub,
        [w.step?.who?.label, w.sub].filter(Boolean).join(' · '),
      ]),
      ...ix.worlds.flatMap((w) => [w.heading, w.sub, w.how ?? '']),
      ...ix.behind.flatMap((b) => [b.name, b.by ?? '', b.step?.text ?? '']),
      ' →',
      ' ›',
      ' ',
      '›',
    ]);
    const texts: string[] = [];
    const walk = document.createTreeWalker(hub, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) if (walk.currentNode.textContent) texts.push(walk.currentNode.textContent);
    expect(texts.filter((t) => !allowed.has(t) && !/^\d+$/.test(t))).toEqual([]);
  });
});
