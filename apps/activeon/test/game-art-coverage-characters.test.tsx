// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25 render guard, Characters area: on the worker's real result for the scrubbed W3-early save, every
// game thing a character view names wears the game's sprite (an <img class="g-art"> from /game-art/,
// ADR 0009 as amended 2026-10-19): class icons on the strip, the Characters list and the Gear doll;
// gear and tools; talent tabs; cards and card sets; star signs; skills. jsdom never loads images, so
// an <img> here is the game sprite the browser will fetch (our own sprite draws only after an error).

import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { classArtOf, classIndexOf, skillArt } from '../src/art/game/class-art';
import { healthReady } from '../src/now/character-tabs';
import { handleRequest } from '../src/worker/handle-request';
import { withM20 } from './helpers/m20-result';
import { fixture, props, renderNow, saveOf } from './now-helpers';

let result: EngineResult;
let state: AccountState;
beforeAll(async () => {
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
  await healthReady;
}, 120_000);
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

const save = () => ({ state, source: 'paste' as const, seq: 1, kind: 'first' as const, slot: null });
const bowman = () => state.characters.find((c) => c.class === 'Bowman' && c.level === 60)?.index ?? -1;
const at = async (hash: string, ready: string) => {
  window.history.replaceState(null, '', `/${hash}`);
  const r = renderNow(props(result, save()));
  // The tabs are lazy chunks: wait for the tab's body.
  for (let i = 0; i < 200 && !r.container.querySelector(ready); i++)
    await new Promise((x) => setTimeout(x, 20));
  return r.container;
};
const art = (root: ParentNode, sel: string) =>
  [...root.querySelectorAll(sel)].map((el) => el.querySelector('img.g-art')?.getAttribute('src') ?? null);

describe('class and skill icons by name', () => {
  it("map the game's class list", () => {
    expect(classIndexOf('Beginner')).toBe(1);
    expect(classIndexOf('Beast Master')).toBe(25);
    expect(classIndexOf('Bubonic Conjuror')).toBe(36);
    expect(classIndexOf('Mining')).toBeNull();
    expect(classArtOf('Bowman')).toEqual({ path: 'data/ClassIcons20' });
    expect(skillArt('smithing')).toEqual({ path: 'data/ClassIcons43' });
    expect(skillArt('catching')).toEqual({ path: 'data/ClassIcons47' });
    expect(skillArt('laboratory')).toEqual({ path: 'data/ClassIcons53' });
    expect(skillArt('Hunter')).toBeNull();
  });
});

describe('Characters views wear game sprites', () => {
  it('the Characters list: every character carries its class icon', async () => {
    const root = await at('#characters', '.cp-who');
    const rows = art(root, '.cp-who');
    expect(rows.length).toBe(state.characters.length);
    expect(rows.every((s) => s?.startsWith('/game-art/data/ClassIcons'))).toBe(true);
  });

  it('the character strip and the header carry the class icon; the Gear doll too', async () => {
    const root = await at(`#gear-${bowman()}`, '.gd-fig');
    const chips = art(root, '.cp-chip');
    expect(chips.length).toBe(state.characters.length);
    expect(chips.every((s) => s?.startsWith('/game-art/data/ClassIcons'))).toBe(true);
    expect(root.querySelector('.cp-blob img.g-art')?.getAttribute('src')).toBe(
      '/game-art/data/ClassIcons20.webp',
    );
    expect(root.querySelector('.gd-fig img.g-art')?.getAttribute('src')).toBe(
      '/game-art/data/ClassIcons20.webp',
    );
  });

  it('the Gear tab: every worn or targeted slot draws its item; tools draw theirs', async () => {
    const root = await at(`#gear-${bowman()}`, '.gd-slot');
    const slots = art(root, '.gd-slot');
    expect(slots.length).toBe(8);
    // Two slots (Shirt, Pants) only say "Equip the Copper Platebody from storage": the view has no id
    // for a held piece that isn't the Gear Plan target, so they keep our slot sprite.
    expect(slots.filter((s) => s?.startsWith('/game-art/data/')).length).toBeGreaterThanOrEqual(6);
    // The trap set and skull tiles draw their System's sprite (Cardboard Traps, Wax Skull).
    const tools = art(root, '.gd-tool');
    expect(tools.length).toBe(6);
    expect(tools.filter(Boolean).length).toBeGreaterThanOrEqual(5);
  });

  it('the Build tab: talents and the class tabs draw game icons', async () => {
    const root = await at(`#build-${bowman()}`, '.bd-segbtn');
    expect(root.querySelectorAll('.bd-segbtn img.g-art').length).toBeGreaterThanOrEqual(2);
    expect(root.querySelectorAll('img.g-art[src*="UISkillIcon"]').length).toBeGreaterThan(5);
  });

  it('the Cards tab: every equipped card and every card set draws its picture', async () => {
    const root = await at(`#cards-${bowman()}`, '.ct-chip');
    const chips = art(root, '.ct-chip:not(.ct-chip--empty)');
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.every((s) => s?.startsWith('/game-art/data/2Cards'))).toBe(true);
    const sets = art(root, '.ct-sets > li');
    expect(sets.every((s) => s?.startsWith('/game-art/data/CardSet'))).toBe(true);
  });

  it('the Signs tab: worn signs draw the game star sign', async () => {
    const root = await at(`#signs-${bowman()}`, '.ss-slot');
    const worn = art(root, '.ss-slot[data-empty="no"]');
    expect(worn.every((s) => s === '/game-art/data/SignStar1b.webp')).toBe(true);
  });

  it('the Skills tab: every skill and Parallel Slot draws its game icon', { timeout: 20_000 }, async () => {
    // The scrubbed save has no M20 skill rows; the Skills tests' own result does.
    const r = withM20(fixture('mid-session'));
    const i = r.characters[0]?.index ?? 0;
    const go = async (hash: string, ready: string) => {
      cleanup();
      window.history.replaceState(null, '', `/${hash}`);
      const v = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
      for (let k = 0; k < 200 && !v.container.querySelector(ready); k++)
        await new Promise((x) => setTimeout(x, 20));
      return v.container;
    };
    const root = await go(`#skills-${i}`, '.sk-tile');
    const tiles = art(root, '.sk-tile');
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.every((s) => s?.startsWith('/game-art/data/ClassIcons'))).toBe(true);
    const slots = art(root, '.sk-slot');
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s?.startsWith('/game-art/data/'))).toBe(true);
  });
});
