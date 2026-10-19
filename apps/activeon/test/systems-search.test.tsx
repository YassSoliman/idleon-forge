// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25: the Systems hub search in the DOM: the combobox keyboard (APG), the filters, the fragment that
// keeps the view, and the empty state.

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HubSearch } from '../src/systems/HubSearch';
import { type SearchItem, searchSystems } from '../src/systems/hub-search';
import { noAxeViolations, withSystems } from './helpers/views';
import { props, renderNow, saveOf } from './now-helpers';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

const ITEMS: SearchItem[] = [
  { id: 'alchemy', name: 'Alchemy cauldrons and liquids', world: 2 },
  { id: 'alchemy-bubbles', name: 'Alchemy bubbles', world: 2 },
  { id: 'alchemy-vials', name: 'Alchemy vials', world: 2 },
  { id: 'anvil', name: 'Anvil', world: 1 },
];

function Harness({ onOpen }: { onOpen(id: string): void }) {
  const [q, setQ] = useState('');
  return (
    <>
      <button type="button">elsewhere</button>
      <HubSearch query={q} onQuery={setQ} results={searchSystems(q, ITEMS)} onOpen={onOpen} />
    </>
  );
}

describe('the search combobox (ARIA APG)', () => {
  it('"/" focuses it, typing opens the list, arrows move, Enter opens, Escape clears', () => {
    const onOpen = vi.fn();
    render(<Harness onOpen={onOpen} />);
    const box = screen.getByRole('combobox', { name: 'Search Systems' });
    expect(box.getAttribute('aria-expanded')).toBe('false');

    screen.getByRole('button', { name: 'elsewhere' }).focus();
    fireEvent.keyDown(document, { key: '/' });
    expect(document.activeElement).toBe(box);

    fireEvent.change(box, { target: { value: 'alchmy' } });
    expect(box.getAttribute('aria-expanded')).toBe('true');
    const list = screen.getByRole('listbox', { name: 'Matching Systems' });
    const opts = within(list).getAllByRole('option');
    expect(opts).toHaveLength(3);
    expect(box.getAttribute('aria-controls')).toBe(list.id);
    expect(box.hasAttribute('aria-activedescendant')).toBe(false);
    // Matched letters are marked.
    expect(opts[0]?.querySelectorAll('mark').length).toBeGreaterThan(0);
    expect(screen.getByRole('status').textContent).toBe('3 Systems match');

    fireEvent.keyDown(box, { key: 'ArrowDown' });
    expect(box.getAttribute('aria-activedescendant')).toBe(opts[0]?.id);
    expect(opts[0]?.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    expect(box.getAttribute('aria-activedescendant')).toBe(opts[1]?.id);
    fireEvent.keyDown(box, { key: 'ArrowUp' });
    fireEvent.keyDown(box, { key: 'ArrowUp' });
    // Wraps to the last option; focus never leaves the field.
    expect(box.getAttribute('aria-activedescendant')).toBe(opts[2]?.id);
    expect(document.activeElement).toBe(box);
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledWith(searchSystems('alchmy', ITEMS)[2]?.id);

    fireEvent.keyDown(box, { key: 'Escape' });
    expect((box as HTMLInputElement).value).toBe('');
    expect(box.getAttribute('aria-expanded')).toBe('false');
  });

  it('Enter with nothing active opens the best match; "/" while typing types a slash', () => {
    const onOpen = vi.fn();
    render(<Harness onOpen={onOpen} />);
    const box = screen.getByRole('combobox');
    box.focus();
    fireEvent.change(box, { target: { value: 'anv' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledWith('anvil');
    const ev = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    box.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });

  it('a click on an option opens it', () => {
    const onOpen = vi.fn();
    render(<Harness onOpen={onOpen} />);
    const box = screen.getByRole('combobox');
    box.focus();
    fireEvent.change(box, { target: { value: 'vials' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: /Alchemy vials/ }));
    expect(onOpen).toHaveBeenCalledWith('alchemy-vials');
  });
});

describe('the hub with search and filters', () => {
  it('a link with a query and filters reopens the same view; the filters write the fragment', async () => {
    window.history.replaceState(null, '', '/#systems?q=anvl');
    const r = withSystems();
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const box = screen.getByRole('combobox', { name: 'Search Systems' });
    expect((box as HTMLInputElement).value).toBe('anvl');
    // Narrowed: the answer row steps aside and the grid shows the matches only.
    expect(screen.queryByRole('region', { name: 'Wasting now' })).toBeNull();
    expect(screen.getByRole('link', { name: /^Anvil,/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /^Post Office,/ })).toBeNull();

    fireEvent.change(box, { target: { value: '' } });
    expect(window.location.hash).toBe('#systems');
    expect(screen.getByRole('region', { name: 'Wasting now' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Locked/ }));
    expect(window.location.hash).toBe('#systems?s=locked');
    expect(screen.getByRole('link', { name: /^Post Office,/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /^Anvil,/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'World 1' }));
    expect(screen.getByRole('button', { name: 'World 1' }).getAttribute('aria-pressed')).toBe('true');
    expect(window.location.hash).toBe('#systems?w=1&s=locked');
    await noAxeViolations(container);
  });

  it('an empty result says what to change, and its buttons put things back', () => {
    window.history.replaceState(null, '', '/#systems?q=qqqqq&s=fine');
    const r = withSystems();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText(/No System matches "qqqqq"\./)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear all' }).at(-1) as HTMLElement);
    expect(window.location.hash).toBe('#systems?q=qqqqq');
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear the search' }).at(-1) as HTMLElement);
    expect(window.location.hash).toBe('#systems');
    expect(screen.queryByText('Nothing here')).toBeNull();
  });
});
