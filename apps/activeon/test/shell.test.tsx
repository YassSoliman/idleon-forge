// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 Views in the DOM (TR-14 component tests): the place navigation (US-1), deep links and the ?c=
// rewrite (US-2), Back (US-3), following the game inside the shell (US-4), the hub and a System page
// with "See it" (US-5, US-8, US-12), the same truth everywhere (FR-33), the TR-9 provenance check on
// the new views, and axe on every place.
import type { EngineResult, SystemSummary } from '@idleon-forge/engine/result';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Shell } from '../src/shell/Shell';
import { fixture, props, renderNow, saveOf } from './now-helpers';

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

const sys = (id: string, name: string, world: number, over: Partial<SystemSummary> = {}): SystemSummary => ({
  id,
  name,
  kind: 'game',
  world,
  scope: 'account',
  unlocked: 'yes',
  unlockBy: world === 0 ? 'always' : 'world',
  covered: true,
  unlock: world === 0 ? null : { text: `Opens on reaching World ${world}`, world, stale: false, sources: [] },
  wiki: world === 0 ? null : `https://idleon.wiki/wiki/${name.replace(/ /g, '_')}`,
  checks: [],
  ...over,
});

/** mid-session with a registry: Dahlia's AFK blocker is ActiveOn's own; the rest are game Systems. */
function withSystems(over: Partial<EngineResult> = {}): EngineResult {
  const r = fixture('mid-session');
  r.characters = r.characters.map((c) =>
    c.index === 3
      ? {
          ...c,
          goals: c.goals.map((g) => (g.system === 'anvil' ? { ...g, category: 'blocker' as const } : g)),
          verdict: {
            ...c.verdict,
            blockerKeys: [...c.verdict.blockerKeys, 'anvil.check.spend-points@c3'],
          },
        }
      : c,
  );
  return {
    ...r,
    systems: [
      sys('afk', 'AFK safety', 0, { kind: 'activeon' }),
      sys('talents', 'Talents', 0),
      sys('cards', 'Cards', 0),
      sys('obols', 'Obols', 0),
      sys('gem-shop', 'Gem Shop', 0),
      sys('minigames', 'Minigames', 0),
      sys('stamps', 'Stamps', 1),
      sys('anvil', 'Anvil', 1, {
        checks: [{ entryId: 'anvil.check.spend-points', title: 'Unspent anvil points', fired: true }],
      }),
      sys('boss-keys', 'Boss keys', 1),
      sys('post-office', 'Post Office', 1, {
        unlocked: 'no',
        unlockBy: 'own',
        unlock: { text: 'Opens once a character reaches class Lv 50', world: 2, stale: false, sources: [] },
      }),
      sys('alchemy-bubbles', 'Alchemy bubbles', 2),
      sys('equinox', 'Equinox', 2, { covered: false }),
      sys('lab', 'Laboratory', 3, { unlocked: 'no' }),
    ],
    behindSystems: [],
    unknownFindings: [],
    ...over,
  };
}

const places = () => screen.getByRole('navigation', { name: 'Places' });
const go = (name: string | RegExp) => fireEvent.click(within(places()).getByRole('link', { name }));

describe('US-1 the place navigation', () => {
  it('lists Now, Characters, Systems and Timeline (no Map), Now current, with word-named badges', async () => {
    const r = withSystems();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const links = within(places()).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['1Now', 'Characters', '1Systems', 'Timeline']);
    expect(links[0]?.getAttribute('aria-current')).toBe('page');
    expect(links[0]?.getAttribute('aria-label')).toBe('Now, 1 to fix before you leave');
    expect(links[2]?.getAttribute('aria-label')).toBe('Systems, 1 wasting');
    // FR-5: the Timeline carries no badge.
    expect(links[3]?.getAttribute('aria-label')).toBeNull();
    expect(screen.queryByText('Map')).toBeNull();
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
    expect(screen.getByRole('heading', { level: 2, name: 'Cedar' })).toBeTruthy();
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
    expect(screen.getByRole('heading', { level: 2, name: 'Dahlia' })).toBeTruthy();
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
      expect(document.querySelector('ol.roster')).toBeTruthy();
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
    go('Systems, 1 wasting');
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
    expect(document.querySelector('ol.roster')).toBeTruthy();
  });

  it('"← back" on a Character page opened by a deep link returns to Now', () => {
    window.history.replaceState(null, '', '/#build-1');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('button', { name: '← All characters' }));
    expect(document.querySelector('ol.roster')).toBeTruthy();
    expect(window.location.hash).toBe('#now');
  });

  it('a Character page opened from the Characters grid belongs to Characters, and "← back" returns there', () => {
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    go('Characters');
    fireEvent.click(
      screen.getAllByRole('link').find((a) => a.getAttribute('href') === '#now-2') as HTMLElement,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Cedar' })).toBeTruthy();
    expect(within(places()).getByRole('link', { current: true }).textContent).toBe('Characters');
    fireEvent.click(screen.getByRole('button', { name: '← back' }));
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
    expect(screen.getByRole('heading', { level: 2, name: 'Elm' })).toBeTruthy();
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
    expect(screen.getByRole('heading', { level: 2, name: 'Cedar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Now playing Elm · go' })).toBeTruthy();
  });

  it('a switch seen from Systems still counts as visited back on Now (FR-10)', () => {
    window.history.replaceState(null, '', '/#systems');
    const r = withSystems();
    const view = render(<Live r={r} seq={1} kind="first" slot={null} />);
    view.rerender(<Live r={r} seq={2} kind="autosave" slot={3} />);
    go(/^Now/);
    fireEvent.click(screen.getAllByRole('button').find((b) => b.dataset.index === '0') as HTMLElement);
    // Dahlia (index 3) was played: "Next" never points back at her.
    expect(screen.getByRole('button', { name: /^Next: switch to/ }).textContent).not.toContain('Dahlia');
  });
});

describe('US-5, US-8, US-9 the hub and System pages', () => {
  it('shows each tile with a glyph and a word, a locked tile with how it opens, and "Needs you"', async () => {
    window.history.replaceState(null, '', '/#systems');
    const r = withSystems();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const anvil = screen.getByRole('link', { name: /^Anvil,/ });
    expect(anvil.getAttribute('aria-label')).toBe('Anvil, Wasting, 1 to fix before you leave');
    expect(anvil.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    expect(screen.getByRole('link', { name: /^Post Office,/ }).getAttribute('aria-label')).toBe(
      'Post Office, Locked, Opens once a character reaches class Lv 50 · 1 to do',
    );
    const needs = screen.getByRole('region', { name: 'Needs you' });
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
      'Needs you',
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

describe('US-12 "See it" from Now', () => {
  it('a Next Action sees its System page, outlined there; a Cards Goal sees its Cards tab', () => {
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getAllByRole('button').find((b) => b.dataset.index === '0') as HTMLElement);
    fireEvent.click(screen.getByRole('link', { name: 'See it: Alchemy bubbles' }));
    expect(window.location.hash).toBe('#system-alchemy-bubbles');
    expect(document.querySelector('.na.lit')?.getAttribute('data-na-key')).toBe(
      'alchemy-bubbles.check.fill-slot@c0',
    );
    act(() => {
      window.history.replaceState(null, '', '/#now-2');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    fireEvent.click(screen.getByRole('link', { name: 'See it: Cards' }));
    expect(window.location.hash).toBe('#cards-2');
  });

  it('"Not covered yet" ends with "→ Systems"', () => {
    const r = withSystems({ notCovered: [{ systemId: 'equinox', label: 'Equinox' }] });
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('link', { name: '→ Systems' }));
    expect(window.location.hash).toBe('#systems');
  });
});
