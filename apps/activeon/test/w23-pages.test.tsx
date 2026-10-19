// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 in the DOM, on the worker's real result for the scrubbed W3 save: the World 2 and 3 System pages
// draw their sections as tabs (boards after/Alchemy*, after/Bubba, after/sys/*), each System of the
// shared Alchemy page opens on its own tab, and a tab shows its panel. Class and level only.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FULL_PAGES } from '../src/systems/pages';
import { handleRequest } from '../src/worker/handle-request';
import { props, renderNow } from './now-helpers';

let result: EngineResult;
let state: AccountState;
beforeAll(() => {
  const raw = JSON.parse(
    readFileSync(path.resolve(import.meta.dirname, '../../../fixtures/scrubbed/scrubbed-w3.json'), 'utf8'),
  ) as { data: Record<string, unknown> };
  const ta = raw.data.TimeAway;
  const now = Math.round(
    ((typeof ta === 'string' ? JSON.parse(ta) : ta) as { GlobalTime: number }).GlobalTime * 1000,
  );
  const res = handleRequest({
    type: 'parse',
    id: 1,
    now,
    input: { kind: 'text', text: JSON.stringify(raw) },
    engine: {
      expectedReturnSeconds: 8 * 3600,
      sessionStartedAt: null,
      learnedExpectedReturnSeconds: null,
      knowledgeVersion: 'k',
    },
  } as never);
  if (!('state' in res) || !res.ok || !res.result || 'error' in res.result)
    throw new Error('expected a result');
  result = res.result;
  state = res.state;
}, 120_000);
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

const save = () => ({ state, source: 'paste' as const, seq: 1, kind: 'first' as const, slot: null });
const open = async (id: string) => {
  window.history.replaceState(null, '', `/#system-${id}`);
  renderNow(props(result, save()));
  return screen.findByRole('tablist', {}, { timeout: 5000 });
};
const tabNames = (list: HTMLElement) =>
  within(list)
    .getAllByRole('tab')
    .map((t) => t.querySelector('span')?.textContent);
const selected = (list: HTMLElement) =>
  within(list)
    .getAllByRole('tab')
    .find((t) => t.getAttribute('aria-selected') === 'true')
    ?.querySelector('span')?.textContent;

describe('the World 2 and 3 System pages (M24)', () => {
  it('registers Refinery, Prayers and Shrines pages', () => {
    for (const id of ['refinery', 'prayers', 'shrines']) expect(FULL_PAGES[id]).toBeTruthy();
  });

  it('Alchemy: six sections; each Alchemy System opens on its own tab', async () => {
    const list = await open('alchemy');
    expect(tabNames(list)).toEqual(['Cauldrons', 'Bubbles', 'Vials', 'Liquids', 'Pay 2 Win', 'Seats']);
    expect(selected(list)).toBe('Cauldrons');
    cleanup();
    expect(selected(await open('alchemy-vials'))).toBe('Vials');
    cleanup();
    const p2w = await open('alchemy-p2w');
    expect(selected(p2w)).toBe('Pay 2 Win');
    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('a tab click shows its panel', async () => {
    const list = await open('alchemy');
    fireEvent.click(within(list).getByRole('tab', { name: /Liquids/ }));
    expect(screen.getByRole('tabpanel').textContent).toContain('Water');
  });

  it.each([
    ['construction', ['Cog Board', 'Build slots', 'Buildings']],
    ['worship', ['Charge', 'Totems']],
    ['trapping', ['Traps', 'Trap sets']],
    ['printer', ['Printing', 'Stored samples']],
    ['armor-smithy', ['Sets', 'Registered']],
    ['refinery', ['Salts', 'Storage']],
    ['prayers', ['Equipped', 'All prayers']],
    ['shrines', ['On your maps', 'All shrines']],
  ])('%s draws its sections as tabs on the template', async (id, tabs) => {
    expect(tabNames(await open(id))).toEqual(tabs);
    // The template: the header with the System's name, one framed answer, no empty side column.
    expect(document.querySelector('#system-h')?.textContent).toBeTruthy();
    expect(document.querySelectorAll('.a-frame')).toHaveLength(1);
    expect(document.querySelector('.sy-frame__side')).toBeNull();
  });

  it('Bubba: the bonuses, the run, Charisma, pats and gifts', async () => {
    if (result.bubba?.state !== 'ok') return;
    expect(tabNames(await open('bubba'))).toEqual([
      'Bonuses to your account',
      'This run',
      'Charisma',
      'Pats & gifts',
    ]);
  });

  it('Refinery: Redox Salts with its rank bar and fuel', async () => {
    await open('refinery');
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByRole('heading', { name: 'Redox Salts' })).toBeTruthy();
    expect(panel.textContent).toContain('Spore Cap');
  });

  it('Prayers: Big Brain Time with its bonus and curse, no character names', async () => {
    const list = await open('prayers');
    fireEvent.click(within(list).getByRole('tab', { name: /All prayers/ }));
    const panel = screen.getByRole('tabpanel');
    expect(panel.textContent).toContain('Big Brain Time');
    expect(panel.textContent).toContain('Class EXP');
    for (const c of state.characters) if (c.name) expect(document.body.textContent).not.toContain(c.name);
  });
});
