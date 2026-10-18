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
