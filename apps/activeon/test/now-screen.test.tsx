// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Now screen in the DOM (M10 §4 "screen" assertions, TR-14 semantics, TR-15 axe on each state).
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CantRead } from '../src/components/CantRead';
import { NowScreen as NowScreenWith } from '../src/now/NowScreen';
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

describe('US-1 / TR-14 Roster', () => {
  it('is an ordered list of buttons whose accessible names carry the whole row', () => {
    const r = fixture('mid-session');
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const list = container.querySelector('ol.roster') as HTMLElement;
    expect(list.tagName).toBe('OL');
    const buttons = within(list)
      .getAllByRole('button')
      .filter((b) => b.classList.contains('r-btn'));
    expect(buttons).toHaveLength(5);
    expect(buttons[0]?.getAttribute('aria-label')).toBe(
      '1., Dahlia, Barbarian level 51, Fishing Goldfish, Fishing Camp, Fix before you leave, Food runs out in about 2h',
    );
    expect(screen.queryByText(/Following the game/)).toBeNull(); // D8
  });
});

describe('Focus: opening, Back and keyboard focus (FR-6, FR-13, TR-5, TR-14)', () => {
  it('a row opens Focus with keyboard focus on its heading; Back returns focus to the row', () => {
    const r = fixture('mid-session');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const before = window.history.length;
    fireEvent.click(screen.getAllByRole('button').find((b) => b.dataset.index === '2') as HTMLElement);
    const h = screen.getByRole('heading', { level: 2, name: 'Cedar' });
    expect(document.activeElement).toBe(h);
    expect(window.location.search).toBe('?c=2');
    expect(window.history.length).toBe(before + 1);
    fireEvent.click(screen.getByRole('button', { name: '← All characters' }));
    expect(document.activeElement?.getAttribute('data-index')).toBe('2');
  });
  it('Esc closes Focus', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/?c=3');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByRole('heading', { level: 2, name: 'Dahlia' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('heading', { level: 2, name: 'Dahlia' })).toBeNull();
  });
  it('the Verdict strip is a nav of links with aria-current on the one in Focus', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/?c=4');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const nav = screen.getByRole('navigation', { name: 'Characters in Visit Order' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      '1 · Dahlia',
      '2 · Alder',
      '3 · Elm',
      '4 · Birch',
      '5 · Cedar',
    ]);
    expect(links[2]?.getAttribute('aria-current')).toBe('true');
    expect(links[0]?.getAttribute('aria-label')).toBe('Dahlia, Fix before you leave');
  });
});

describe('US-3 Focus follows the game (FR-14 as ruled on #38)', () => {
  it('a switch save marks "Left X ✓" and moves Focus to Next up, without a new history entry', () => {
    const r = fixture('mid-session');
    const view = render(<NowScreenRerender r={r} seq={1} kind="autosave" slot={3} />);
    // First load: the stamped character, fresh save: Focus opens on it.
    expect(screen.getByRole('heading', { level: 2, name: 'Dahlia' })).toBeTruthy();
    expect(screen.getByText(/you are on this character/)).toBeTruthy();
    const length = window.history.length;
    view.rerender(<NowScreenRerender r={r} seq={2} kind="switch-leave" slot={3} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Alder' })).toBeTruthy();
    expect(screen.getByText(/Left Dahlia ✓ 1 done · Fix before you leave/)).toBeTruthy();
    expect(screen.getByText(/Next up/)).toBeTruthy();
    expect(screen.getByText(/press Cloud Save in the game/)).toBeTruthy();
    expect(window.history.length).toBe(length);
  });
  it('the next autosave confirms Next up, or silently corrects it', () => {
    const r = fixture('mid-session');
    const view = render(<NowScreenRerender r={r} seq={1} kind="autosave" slot={3} />);
    view.rerender(<NowScreenRerender r={r} seq={2} kind="switch-leave" slot={3} />);
    view.rerender(<NowScreenRerender r={r} seq={3} kind="switch-leave" slot={1} />);
    // The player went to Birch instead: a save that stamps Birch as current wins.
    view.rerender(<NowScreenRerender r={r} seq={4} kind="autosave" slot={1} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Birch' })).toBeTruthy();
    expect(screen.getByText(/you are on this character/)).toBeTruthy();
  });
  it('a save with no stamped slot never moves the view', () => {
    const r = fixture('mid-session');
    const view = render(<NowScreenRerender r={r} seq={1} kind="first" slot={null} />);
    expect(screen.queryByRole('heading', { level: 2, name: /Dahlia|Alder|Birch|Cedar|Elm/ })).toBeNull();
    view.rerender(<NowScreenRerender r={r} seq={2} kind="switch-leave" slot={null} />);
    expect(screen.queryByRole('heading', { level: 2, name: /Dahlia|Alder|Birch|Cedar|Elm/ })).toBeNull();
  });
  it('mid-interaction the card stays and a "· go" chip appears; keyboard focus does not move', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/?c=2');
    const view = render(<NowScreenRerender r={r} seq={1} kind="first" slot={null} />);
    const skip = screen.getAllByRole('button', { name: 'Skip today' })[0] as HTMLElement;
    skip.focus();
    view.rerender(<NowScreenRerender r={r} seq={2} kind="autosave" slot={4} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Cedar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Now playing Elm · go' })).toBeTruthy();
    expect(document.activeElement).toBe(skip);
  });
  it('an old save (game closed) opens the Roster with no "● playing" marker', () => {
    const r = fixture('mid-session');
    renderNow(props(r, saveOf(r, 1, 'autosave', 3, 'live', 45 * 60_000)));
    expect(screen.queryByRole('heading', { level: 2, name: 'Dahlia' })).toBeNull();
    expect(screen.queryByText('● playing')).toBeNull();
  });
  it('paste mode never auto-opens', () => {
    const r = fixture('mid-session');
    renderNow(props(r, saveOf(r, 1, 'autosave', 3, 'paste')));
    expect(screen.queryByRole('heading', { level: 2, name: 'Dahlia' })).toBeNull();
  });
});

describe('US-6 Sources open in a new tab', () => {
  it('has target=_blank and rel=noopener noreferrer, and a non-https URL is plain text', () => {
    const r = fixture('stale');
    window.history.replaceState(null, '', '/?c=0');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const link = screen.getByRole('link', { name: 'wiki · 2.3.540 · Stale' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.queryByRole('link', { name: 'guide · 2.3.531' })).toBeNull();
    expect(screen.getByText('guide · 2.3.531')).toBeTruthy();
  });
});

describe('US-8 Expected Return chips', () => {
  it('render as a radio group with 8h checked; picking one re-runs the engine', () => {
    const r = fixture('all-set');
    const set = vi.fn();
    let chips: React.ReactNode = null;
    renderNow(
      props(r, saveOf(r, 1, 'first', null, 'paste'), {
        setExpectedReturn: set,
        renderChips: (n) => (chips = n),
      }),
    );
    const { getByRole } = render(<div>{chips}</div>);
    const group = getByRole('group', { name: 'Back in about' });
    const radios = within(group).getAllByRole('radio') as HTMLInputElement[];
    expect(radios.filter((x) => x.checked).map((x) => x.value)).toEqual([String(8 * 3600)]);
    fireEvent.click(radios[1] as HTMLElement);
    expect(set).toHaveBeenCalledWith(4 * 3600);
  });
});

describe('US-11 Skip today', () => {
  it('hides the Goal, shows "1 skipped · undo", and a second tab hides it on the storage event', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/?c=2');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByText('Spend 12 talent points on Bowman talents')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Skip today' })[0] as HTMLElement);
    expect(screen.queryByText('Spend 12 talent points on Bowman talents')).toBeNull();
    expect(screen.getByText(/1 skipped/)).toBeTruthy();
    // Another tab: same namespace, learns from the storage event.
    cleanup();
    localStorage.setItem('activeon:other:skips', localStorage.getItem('activeon:test:skips') ?? '{}');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste'), { namespace: 'activeon:other:' }));
    expect(screen.queryByText('Spend 12 talent points on Bowman talents')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'undo' }));
    expect(screen.getByText('Spend 12 talent points on Bowman talents')).toBeTruthy();
    act(() => {
      localStorage.setItem('activeon:other:skips', localStorage.getItem('activeon:test:skips') ?? '{}');
      window.dispatchEvent(new StorageEvent('storage', { key: 'activeon:other:skips' }));
    });
    expect(screen.queryByText('Spend 12 talent points on Bowman talents')).toBeNull();
  });
  it('Not for me lists the Goal under "Hidden until next patch"', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/?c=2');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getAllByRole('button', { name: 'Not for me' })[0] as HTMLElement);
    expect(screen.getByText('Hidden until next patch (1)')).toBeTruthy();
  });
});

describe('US-12 Report this', () => {
  it('two taps: the public notice, then the GitHub form link in a new tab', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/?c=2');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getAllByRole('button', { name: 'Report this' })[0] as HTMLElement);
    expect(screen.getByText(/This will be posted publicly on GitHub/)).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Open the report' });
    expect(link.getAttribute('href')).toMatch(
      /^https:\/\/github\.com\/YassSoliman\/idleon-forge\/issues\/new\?template=kb-correction\.yml/,
    );
    expect(link.getAttribute('target')).toBe('_blank');
    const body = new URL(link.getAttribute('href') as string).searchParams.get('body') ?? '';
    for (const c of r.characters) expect(body).not.toContain(c.name);
  });
});

describe('US-14 never advice from a broken save', () => {
  it("Can't read your save: no Verdict pill in the DOM", () => {
    const { container } = render(
      <CantRead
        failure={{ status: 'broken', kind: 'empty', message: 'no account', source: 'paste' }}
        lastGood={null}
        busy={false}
        onPaste={() => {}}
      />,
    );
    expect(screen.getByText("Can't read your save right now")).toBeTruthy();
    expect(container.querySelector('.pill')).toBeNull();
  });
});

describe('US-22 / D9 account stockpiles', () => {
  it('lead the Account section under "Fix before you leave"', () => {
    const r = fixture('account-stockpile');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const acct = screen.getByRole('region', { name: 'Account · any character' });
    expect(within(acct).getByRole('heading', { name: 'Fix before you leave' })).toBeTruthy();
    expect(screen.getByText('5 of 5 Ready · fix 2 in Account')).toBeTruthy();
  });
});

describe('the Spend Plan chip jumps to the Spend Plan (FR-4)', () => {
  it('opens the plan', () => {
    const r = fixture('spend-plan');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('button', { name: 'Spend here: 3 buys, ~4M → Spend Plan' }));
    expect((document.getElementById('spend-plan') as HTMLDetailsElement).open).toBe(true);
  });
});

describe('FR-34 tab title', () => {
  it('counts new Next Actions while the window is unfocused and resets on focus', () => {
    const r = fixture('mid-session');
    const view = render(<NowScreenRerender r={r} seq={1} kind="first" slot={null} source="paste" />);
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(document.title).toBe('ActiveOn');
    const more = fixture('mid-session');
    const c1 = more.characters.find((c) => c.index === 1);
    const extra = more.characters.find((c) => c.index === 2)?.goals[0];
    if (!c1 || !extra) throw new Error('fixture');
    c1.goals = [
      ...c1.goals,
      { ...extra, nextAction: { ...extra.nextAction, key: 'new@c1', text: 'A new thing' } },
    ];
    view.rerender(<NowScreenRerender r={more} seq={1} kind="first" slot={null} source="paste" />);
    expect(document.title).toBe('(1) ActiveOn');
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(document.title).toBe('ActiveOn');
  });
});

describe('axe on each state (TR-15)', () => {
  it.each([
    'mid-session',
    'all-set',
    'account-stockpile',
    'spend-plan',
    'contested',
    'no-purpose',
    'cannot-tell',
  ])('%s: Roster and Focus', async (id) => {
    const r = fixture(id);
    const { container, unmount } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    await noAxeViolations(container);
    unmount();
    window.history.replaceState(null, '', `/?c=${r.visitOrder[0]}`);
    const focus = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    await noAxeViolations(focus.container);
  });
});

function NowScreenRerender({
  r,
  seq,
  kind,
  slot,
  source = 'live',
}: {
  r: ReturnType<typeof fixture>;
  seq: number;
  kind: 'first' | 'autosave' | 'switch-leave';
  slot: number | null;
  source?: 'live' | 'paste';
}) {
  const p = props(r, saveOf(r, seq, kind, slot, source));
  return <NowScreenWith {...p} />;
}
