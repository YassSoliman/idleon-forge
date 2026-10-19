// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25 guard (ADR 0009 as amended 2026-10-19): on the Map, Timeline, Now and Spend Plan, every game thing a
// row names wears its game sprite (an <img> from /game-art/), from the public save through the worker.
// A row that loses its sprite fails here before the owner sees our drawing in its place.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { MAP_WORDS } from '@idleon-forge/engine/map';
import type { EngineResult } from '@idleon-forge/engine/result';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleRequest } from '../src/worker/handle-request';
import { fixture, props, renderNow, saveOf } from './now-helpers';

const NOW = Date.UTC(2026, 9, 19, 12);
const text = readFileSync(
  path.resolve(import.meta.dirname, '../../../packages/account-state/fixtures/public/latest.json'),
  'utf8',
);
const res = handleRequest({
  type: 'parse',
  id: 1,
  now: NOW,
  input: { kind: 'text', text },
  engine: {
    expectedReturnSeconds: 8 * 3600,
    sessionStartedAt: null,
    learnedExpectedReturnSeconds: null,
    knowledgeVersion: 'k',
  },
} as never) as unknown as { ok: boolean; result: EngineResult; state: never };
if (!res.ok || !res.result) throw new Error('the public save did not parse');

beforeEach(() => window.history.replaceState(null, '', '/'));
afterEach(() => cleanup());

const open = (hash: string) => {
  window.history.replaceState(null, '', `/${hash}`);
  const save = { state: res.state, source: 'paste' as const, seq: 1, kind: 'first' as const, slot: null };
  return renderNow(props(res.result, save as never));
};
/** Every row matched by `sel` and how many of them carry a game sprite. */
const rows = (c: HTMLElement, sel: string) => {
  const all = [...c.querySelectorAll(sel)];
  return { all: all.length, art: all.filter((r) => r.querySelector('img.g-art[src^="/game-art/"]')).length };
};

describe('M25: game sprites on the Map', () => {
  it('the boss gates wear the boss and its key', () => {
    const { container } = open('#map');
    const gates = rows(container, '.map-boss');
    expect(gates.all).toBeGreaterThan(0);
    expect(gates.art).toBe(gates.all);
    const keys = rows(container, '.map-boss-k');
    expect(keys.art).toBe(keys.all);
    // The boss opens its IdleOn Wiki page.
    expect(container.querySelector('.map-boss a.g-wiki')?.getAttribute('href')).toMatch(
      /^https:\/\/idleon\.wiki\/wiki\//,
    );
  });

  it('every constellation, every Death Note row and every card wears its own picture', () => {
    const { container } = open('#map');
    act(() => fireEvent.click(screen.getByRole('tab', { name: new RegExp(MAP_WORDS.overlayStars) })));
    const stars = rows(container, '.ms-star');
    expect(stars.all).toBeGreaterThan(10);
    expect(stars.art).toBe(stars.all);

    act(() => fireEvent.click(screen.getByRole('tab', { name: new RegExp(MAP_WORDS.overlayDeathNote) })));
    const dn = rows(container, '.dn-row');
    expect(dn.art).toBe(dn.all);

    act(() => fireEvent.click(screen.getByRole('tab', { name: new RegExp(MAP_WORDS.overlayCards) })));
    const cards = rows(container, '.mc-card');
    expect(cards.all).toBeGreaterThan(10);
    expect(cards.art).toBe(cards.all);
  });
});

describe('M25: game sprites on the Timeline and the Spend Plan', () => {
  it('the parallel slots draw each System by its game sprite', () => {
    const { container } = open('#slots');
    const heads = rows(container, '.sg-col-h, th');
    expect(heads.art).toBeGreaterThan(0);
  });

  it('the Daily & Weekly rows that count a game thing wear its sprite', () => {
    const { container } = open('#daily');
    const list = rows(container, '.dw-jobr, .dw-wk');
    expect(list.all).toBeGreaterThan(0);
    expect(list.art).toBeGreaterThan(0);
  });

  it('every Spend Plan line wears what it buys', () => {
    // The public save has no Spend Plan yet; the synthetic spend-plan view fixture has one.
    window.history.replaceState(null, '', '/#spend');
    const r = fixture('spend-plan');
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const top = rows(container, '.ac-sl');
    const rest = rows(container, '.ac-rl');
    expect(top.all + rest.all).toBeGreaterThan(0);
    expect(top.art).toBe(top.all);
    expect(rest.art).toBe(rest.all);
  });
});
