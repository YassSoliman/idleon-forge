// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 in the DOM, area S (M21 §9), on the worker's real result for the scrubbed W3-early save: the Gear
// and Armor-set Smithy System pages. Class and level only. Split from m18-view.test.tsx.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
const _bowman = () => state.characters.find((c) => c.class === 'Bowman' && c.level === 60)?.index ?? -1;

describe('the Gear and Smithy pages', () => {
  it('#system-gear: the heat strip, one cell lit (the Bowman Lv 60 helmet), and the phone list', () => {
    window.history.replaceState(null, '', '/#system-gear');
    const { container } = renderNow(props(result, save()));
    expect(screen.getByRole('heading', { level: 2, name: 'Gear & Tools' })).toBeTruthy();
    const table = container.querySelector('.gd-heat-table') as HTMLTableElement;
    expect(table.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(table.querySelectorAll('thead th')).toHaveLength(10);
    const lit = table.querySelectorAll('td.is-now');
    expect(lit).toHaveLength(1);
    expect(lit[0]?.closest('tr')?.querySelector('th')?.textContent).toContain('Bowman 60');
    expect(lit[0]?.textContent).toContain('better one held');
    const list = container.querySelector('.gd-worst') as HTMLElement;
    expect(list.querySelectorAll('li')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'show all 6' }));
    expect(list.querySelectorAll('li')).toHaveLength(6);
  });

  it('#system-armor-smithy: the countdown and nine set cards', () => {
    window.history.replaceState(null, '', '/#system-armor-smithy');
    const { container } = renderNow(props(result, save()));
    expect(screen.getByText('Opens in 25 days, or once 2,000 gems were bought')).toBeTruthy();
    expect(container.querySelectorAll('.gd-set')).toHaveLength(9);
    expect(screen.getByText('1 of 4 parts: the Iron Pickaxe in storage')).toBeTruthy();
  });
});
