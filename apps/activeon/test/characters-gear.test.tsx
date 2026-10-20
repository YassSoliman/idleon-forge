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

  it("#gear-<i> (M24): the Bowman Lv 60's next fix first, every slot names its piece and where, a path opens", async () => {
    window.history.replaceState(null, '', `/#gear-${bowman()}`);
    const { container } = renderNow(props(result, save()));
    const answer = screen.getByRole('region', { name: 'Next fix' });
    expect(within(answer).getByText('Equip the Gold Helmet from storage')).toBeTruthy();
    // One lit slot, labelled "Next" (never a ring).
    expect(container.querySelectorAll('.gd-slot[data-lit="yes"]')).toHaveLength(1);
    const helmet = screen.getByRole('button', { name: /^Helmet.*Equip the Gold Helmet from storage.*Next$/ });
    expect(helmet.getAttribute('aria-expanded')).toBe('false');
    // A slot behind names the piece and where it comes from; no "Lv 50 to wear" for a Lv 60 (M24 QA P3).
    const weapon = screen.getByRole('button', {
      name: /^Weapon · wearing Carrot LauncherGet Pharaoh BowUnlock Spiked Menace at the W2 Task Board \(Unlocks tab\)$/,
    });
    expect(screen.queryByText(/levels behind/)).toBeNull();
    fireEvent.click(weapon);
    const path = screen.getByRole('region', { name: 'Weapon: the whole path' });
    expect(within(path).getByText(/Pharaoh Bow \(Lv 50\)/)).toBeTruthy();
    expect(within(path).getByText(/Carrot Launcher · Lv 18/)).toBeTruthy();
    // The catching net's tile carries its tool ladder's next tier.
    expect(screen.getByText(/ at Catching \d+: /)).toBeTruthy();
    const a = await axe.run(container.querySelector('.gd') as HTMLElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(a.violations.map((v) => v.id)).toEqual([]);
  });

  it('publishes its tile line on the Characters place', () => {
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(result, save()));
    // M21 FR-C7: the health matrix's Gear cell, a 44 px link with a glyph and a word with a unit.
    expect(screen.getAllByRole('link', { name: /, Gear: \d+ better pieces? held$/ }).length).toBeGreaterThan(
      0,
    );
  });
});

describe('the Gear answer without a lit step (final QA P2)', () => {
  const withoutStep = (slotsBehind: boolean): EngineResult => {
    const i = bowman();
    const gear = result.gear;
    if (!gear) throw new Error('expected gear');
    return {
      ...result,
      gear: {
        ...gear,
        characters: gear.characters.map((c) =>
          c.index !== i
            ? c
            : {
                ...c,
                lit: null,
                step: null,
                why: null,
                status: slotsBehind ? 'Ring 49 levels behind' : 'ok',
                slots: c.slots.map((s) =>
                  slotsBehind || s.state === 'm20' ? s : { ...s, state: 'ok' as const, actionKey: null },
                ),
              },
        ),
      },
    };
  };

  it('is gold with a warning while slots still need replacing', () => {
    window.history.replaceState(null, '', `/#gear-${bowman()}`);
    renderNow(props(withoutStep(true), save()));
    const answer = screen.getByRole('region', { name: 'Gear' });
    expect(answer.getAttribute('data-tone')).toBe('gold');
    expect(within(answer).getByText(/49 levels behind/)).toBeTruthy();
  });

  it('is green with a check when every slot is OK', () => {
    window.history.replaceState(null, '', `/#gear-${bowman()}`);
    renderNow(props(withoutStep(false), save()));
    expect(screen.getByRole('region', { name: 'Gear' }).getAttribute('data-tone')).toBe('ok');
  });
});
