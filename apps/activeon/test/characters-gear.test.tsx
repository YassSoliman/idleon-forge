// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 in the DOM, area C (M21 §9), on the worker's real result for the scrubbed W3-early save: the Gear
// tab with its `#gear-<index>` deep link (the paper doll, one lit square, the step, a square's sheet, the
// tool ladder) and the Characters tile line. Class and level only. Split from m18-view.test.tsx.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { characterTabs, parseTabHash } from '../src/now/character-tabs';
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
const bowman = () => state.characters.find((c) => c.class === 'Bowman' && c.level === 60)?.index ?? -1;

describe('the Gear tab', () => {
  it('is registered after Build and parses its deep link', () => {
    expect(characterTabs.map((t) => t.id).slice(0, 3)).toEqual(['now', 'build', 'gear']);
    expect(parseTabHash('#gear-2')).toEqual({ tab: 'gear', index: 2 });
  });

  it("#gear-<i>: the Bowman Lv 60's doll lights the helmet, says the step, and opens a sheet", async () => {
    window.history.replaceState(null, '', `/#gear-${bowman()}`);
    const { container } = renderNow(props(result, save()));
    const helmet = screen.getByRole('button', { name: /^Helmet: nothing, empty · one held, next$/ });
    expect(helmet.className).toContain('lit');
    expect(container.querySelectorAll('.gs.lit')).toHaveLength(1);
    expect(screen.getByText('Equip the Gold Helmet from storage')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Shoes: nothing, empty$/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Weapon: Carrot Launcher, 32 levels behind$/ }));
    const sheet = document.getElementById('gear-sheet') as HTMLElement;
    expect(within(sheet).getByText(/Pharaoh Bow \(Lv 50\)/)).toBeTruthy();
    expect(within(sheet).getByText(/Carrot Launcher · Lv 18/)).toBeTruthy();
    // The tool ladder for the catching net it wears.
    expect(screen.getByText(/ at Catching \d+: /)).toBeTruthy();
    const a = await axe.run(container.querySelector('.gd') as HTMLElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(a.violations.map((v) => v.id)).toEqual([]);
  });

  it('publishes its tile line on the Characters place', () => {
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(result, save()));
    expect(screen.getAllByText('2 empty · better gear held').length).toBeGreaterThan(0);
  });
});
