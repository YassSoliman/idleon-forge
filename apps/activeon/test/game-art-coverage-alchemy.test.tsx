// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25 guard (ADR 0009 as amended 2026-10-19): on the Alchemy, Bubba and World 4 pages every game thing a
// row names wears its game sprite (an `img.g-art` from /game-art/), on real public saves through the
// worker. Counts, not "at least one": a row that loses its sprite fails here. Also checks the copied
// name tables (alchemy-art.ts, w4-art.ts) against Toolbox's data at the pin and that every sprite
// they name ships.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { EngineResult } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { alchemySections } from '../src/alchemy/AlchemyTabs';
import { cauldronArt, liquidArt, VIAL_ITEMS, vialItemArt, vialJarArt } from '../src/art/game/alchemy-art';
import { boonArt, bubbaUpgradeArt, megafleshArt } from '../src/art/game/bubba-art';
import { type GameArt, gameArtSrc } from '../src/art/game/game-art';
import {
  CHIP_NAMES,
  CLASS_NAMES,
  chipArt,
  classArtOfName,
  eggArt,
  JEWEL_NAMES,
  jewelArt,
  labBonusArt,
  MEAL_NAMES,
  mealArt,
  petUpgradeArt,
  spiceArt,
} from '../src/art/game/w4-art';
import { bubbaSections } from '../src/bubba/BubbaTabs';
import type { SystemPageBodyProps } from '../src/systems/pages';
import { handleRequest } from '../src/worker/handle-request';
import { BreedingPage, CookingPage, LaboratoryPage } from '../src/world4/World4Pages';

afterEach(() => cleanup());
// Each save runs the whole worker (parser + engine) once.
vi.setConfig({ testTimeout: 120_000 });

const ROOT = path.resolve(import.meta.dirname, '../../..');
const DATA = path.join(ROOT, 'packages/toolbox-parsers/vendor/data/website-data');
const shipped = new Set(
  (
    JSON.parse(readFileSync(path.join(ROOT, 'apps/activeon/public/game-art/manifest.json'), 'utf8')) as {
      files: string[];
    }
  ).files,
);
const ships = (a: GameArt | null) => {
  const src = gameArtSrc(a);
  return src !== null && shipped.has(decodeURIComponent(src.slice('/game-art/'.length)));
};

const cache = new Map<string, EngineResult>();
function parse(name: string): EngineResult {
  const hit = cache.get(name);
  if (hit) return hit;
  const text = readFileSync(path.join(ROOT, `packages/account-state/fixtures/public/${name}.json`), 'utf8');
  const res = handleRequest({
    type: 'parse',
    id: 1,
    now: Date.UTC(2026, 9, 17, 12),
    input: { kind: 'text', text },
    engine: {
      expectedReturnSeconds: 8 * 3600,
      sessionStartedAt: null,
      learnedExpectedReturnSeconds: null,
      knowledgeVersion: 'k',
    },
  } as never) as { result?: EngineResult };
  if (!res.result) throw new Error(`no result for ${name}`);
  cache.set(name, res.result);
  return res.result;
}

const props = (result: EngineResult, tile = 'alchemy') =>
  ({
    s: {
      result,
      view: { roster: result.characters.map((c) => ({ index: c.index, classLabel: 'Mage', level: 1 })) },
      toSpend: () => {},
      navigate: () => {},
      now: Date.UTC(2026, 9, 17, 12),
    },
    page: { highlight: null, goals: [], tile: { id: tile }, wiki: null },
  }) as unknown as SystemPageBodyProps;

/** Every `sel` element under `root`, each holding exactly one game sprite. */
const eachHasArt = (root: ParentNode, sel: string) => {
  const rows = [...root.querySelectorAll(sel)];
  const bare = rows.filter((r) => r.querySelectorAll('img.g-art').length === 0);
  return { rows: rows.length, bare: bare.map((r) => r.textContent?.slice(0, 40)) };
};
const gameImgs = (root: ParentNode) =>
  [...root.querySelectorAll('img.g-art')].map((i) => i.getAttribute('src') ?? '');

describe('Alchemy wears the game sprites', () => {
  const alch = (tab: string, save = 'first') => {
    const t = alchemySections(props(parse(save)))?.tabs.find((x) => x.id === tab);
    if (!t) throw new Error(`no ${tab} tab`);
    return render(t.render()).container;
  };

  it('Cauldrons: four cauldrons and every listed bubble', () => {
    const c = alch('cauldrons');
    expect(eachHasArt(c, '.al2-pot')).toMatchObject({ rows: 4, bare: [] });
    const a = parse('first').alchemy;
    const lit = a?.pots.find((p) => p.rows.length) ?? null;
    const rows = c.querySelectorAll('ol.w-hair > li');
    expect(rows.length).toBeGreaterThan(0);
    // Each planned bubble row and each bubble in "the rest" line draws its bubble.
    expect(c.querySelectorAll('img[src*="/game-art/data/aUpgrades"]').length).toBeGreaterThanOrEqual(
      lit?.rows.length ?? 0,
    );
  });

  it('Bubbles: every found bubble, in all four cauldrons', () => {
    const c = alch('bubbles');
    const a = parse('first').alchemy;
    const found = (['power', 'quicc', 'high-iq', 'kazam'] as const).reduce(
      (t, k) => t + (a?.column[k] ?? []).filter((x) => x.unlocked).length,
      0,
    );
    expect(found).toBeGreaterThan(0);
    expect(eachHasArt(c, '.al2-bubbles > li')).toEqual({ rows: found, bare: [] });
    expect(c.querySelectorAll('img[src*="/game-art/data/aJarB"]')).toHaveLength(4);
    // A bubble's sprite opens its IdleOn Wiki page.
    expect(c.querySelector('.al2-bubbles a.g-wiki')?.getAttribute('href')).toMatch(
      /^https:\/\/idleon\.wiki\/wiki\//,
    );
  });

  it('Vials: every vial you can try and every missing one shows its jar and its item', () => {
    const c = alch('vials');
    const t = parse('first').alchemy?.vialTries;
    expect((t?.tryable.length ?? 0) + (t?.missing.length ?? 0)).toBeGreaterThan(0);
    const tryRows = [...c.querySelectorAll('.vt-row')];
    expect(tryRows).toHaveLength(t?.tryable.length ?? 0);
    for (const r of tryRows) expect(r.querySelectorAll('img.g-art')).toHaveLength(2);
    expect(eachHasArt(c, '.vt-tile')).toEqual({ rows: t?.missing.length ?? 0, bare: [] });
    for (const v of [...(t?.tryable ?? []), ...(t?.missing ?? [])])
      expect(gameImgs(c)).toContain(gameArtSrc(vialItemArt(v.index)));
  });

  it('Liquids and Pay 2 Win: each liquid, each cauldron row', () => {
    const l = alch('liquids');
    expect(eachHasArt(l, 'li.a-tile')).toMatchObject({ rows: 4, bare: [] });
    cleanup();
    const p = alch('p2w');
    expect(eachHasArt(p, 'tbody th[scope=row]')).toEqual({ rows: 4, bare: [] });
  });

  it('the vial table matches Toolbox and every Alchemy sprite ships', () => {
    const vials = JSON.parse(readFileSync(path.join(DATA, 'vials.json'), 'utf8')) as Record<
      string,
      { mainItem: string; itemReq: { name?: string }[] }
    >;
    expect(VIAL_ITEMS).toEqual(Object.keys(vials).map((k) => vials[k]?.mainItem));
    // The engine's tryable item names are the catalogue's, so index -> item agrees with what the row says.
    for (const v of parse('first').alchemy?.vialTries?.tryable ?? [])
      expect(vials[String(v.index)]?.itemReq[0]?.name?.replace(/_/g, ' ').toLowerCase()).toBe(
        v.item.toLowerCase(),
      );
    for (const c of ['power', 'quicc', 'high-iq', 'kazam']) expect(ships(cauldronArt(c)), c).toBe(true);
    for (let i = 0; i < 4; i++) expect(ships(liquidArt(i)), `liquid ${i}`).toBe(true);
    for (let l = 0; l <= 13; l++) expect(ships(vialJarArt(l)), `jar ${l}`).toBe(true);
    const missing = VIAL_ITEMS.map((_, i) => i).filter((i) => !ships(vialItemArt(i)));
    expect(missing).toEqual([]);
  });
});

describe('Bubba wears the game sprites', () => {
  const b = parse('latest').bubba;
  const tab = (id: string) => {
    const t = bubbaSections({ ...props(parse('latest'), 'bubba') })?.tabs.find((x) => x.id === id);
    if (!t) throw new Error(`no ${id} tab`);
    return render(t.render()).container;
  };

  it('every Boon bonus, Megaflesh and next buy', () => {
    expect(b?.bonuses.length).toBe(7);
    const ids = bubbaSections(props(parse('latest'), 'bubba'))?.tabs.map((t) => t.id) ?? [];
    const all = document.createElement('div');
    for (const id of ids) all.append(tab(id));
    expect(eachHasArt(all, '.bb2-bonus')).toEqual({ rows: 7, bare: [] });
    expect(eachHasArt(all, '.bb-mf')).toEqual({ rows: b?.megaflesh.rows.length ?? -1, bare: [] });
    expect(eachHasArt(all, '.bb-buys > li')).toEqual({ rows: b?.run.nextBuys.length ?? -1, bare: [] });
  });

  it('every Bubba sprite ships', () => {
    for (const k of [
      'buildRate',
      'critterGain',
      'soulGain',
      'totalDamage',
      'allKills',
      'expMulti',
      'atomCost',
    ])
      expect(ships(boonArt(k)), k).toBe(true);
    for (let r = 1; r <= 12; r++) expect(ships(megafleshArt(r)), `MF ${r}`).toBe(true);
    for (const x of b?.run.nextBuys ?? []) expect(ships(bubbaUpgradeArt(x.index)), x.name).toBe(true);
  });
});

describe('World 4 wears the game sprites', () => {
  const w4 = parse('latest').world4 as NonNullable<EngineResult['world4']>;
  const wprops = { s: { result: { world4: w4 }, navigate: () => {} }, page: { goals: [] } } as never;

  it('Laboratory: classes, bonuses, chips in slots, jewels, the weekly shop', () => {
    const { container } = render(<LaboratoryPage {...(wprops as SystemPageBodyProps)} />);
    const lab = w4.lab;
    if (!lab || !('board' in lab)) throw new Error('no lab');
    expect(eachHasArt(container, '.w4-board__char')).toEqual({ rows: lab.board.characters.length, bare: [] });
    expect(eachHasArt(container, 'ol[aria-label^="Mainframe bonuses"] > li')).toEqual({
      rows: lab.nodes.length,
      bare: [],
    });
    expect(eachHasArt(container, 'aside .w4-rows > li')).toEqual({ rows: lab.characters.length, bare: [] });
    fireEvent.click(screen.getByRole('tab', { name: /Chips/ }));
    const filled = lab.chipsBySlot.reduce((t, c) => t + c.slots.filter(Boolean).length, 0);
    expect(eachHasArt(container, 'td.w4-slot.is-full')).toEqual({ rows: filled, bare: [] });
    expect(eachHasArt(container, '.w4-slots th[scope=row]')).toEqual({
      rows: lab.chipsBySlot.length,
      bare: [],
    });
    expect(eachHasArt(container, '.w4-card')).toEqual({ rows: lab.openers.length, bare: [] });
    fireEvent.click(screen.getByRole('tab', { name: /Jewels/ }));
    expect(eachHasArt(container, '.w4-row')).toEqual({ rows: lab.jewels.length, bare: [] });
    fireEvent.click(screen.getByRole('tab', { name: /shop/i }));
    expect(eachHasArt(container, 'ul[aria-label^="This week"] > li')).toEqual({
      rows: lab.shop?.rows.length ?? -1,
      bare: [],
    });
  });

  it('Cooking: kitchens, meals and spices', () => {
    const { container } = render(<CookingPage {...(wprops as SystemPageBodyProps)} />);
    const ck = w4.cooking;
    if (!ck || !('kitchens' in ck)) throw new Error('no cooking');
    expect(eachHasArt(container, '.w4-kitchen')).toEqual({ rows: ck.kitchens.length, bare: [] });
    fireEvent.click(screen.getByRole('tab', { name: /Meals/ }));
    expect(eachHasArt(container, '.w4-table tbody tr')).toEqual({
      rows: Math.min(ck.meals.length, 12),
      bare: [],
    });
    expect(eachHasArt(container, 'ol.w4-cards > li')).toEqual({ rows: ck.nextMeals.length, bare: [] });
    fireEvent.click(screen.getByRole('tab', { name: /Spices/ }));
    expect(eachHasArt(container, '.w4-rows > li')).toEqual({ rows: ck.spices.length, bare: [] });
    for (const m of ck.meals) expect(ships(mealArt(m.key)), m.key).toBe(true);
  });

  it('Breeding: the nest, territories and upgrades', () => {
    const { container } = render(<BreedingPage {...(wprops as SystemPageBodyProps)} />);
    const br = w4.breeding;
    if (!br || !('nest' in br)) throw new Error('no breeding');
    expect(eachHasArt(container, '.w4-egg')).toEqual({ rows: br.nest.length, bare: [] });
    fireEvent.click(screen.getByRole('tab', { name: /Territor/ }));
    expect(eachHasArt(container, 'ol[aria-label="Territories in order"] > li')).toEqual({
      rows: br.territories.length,
      bare: [],
    });
    fireEvent.click(screen.getByRole('tab', { name: /Upgrades/ }));
    expect(eachHasArt(container, 'ol[aria-label="Breeding upgrades"] > li')).toEqual({
      rows: br.upgrades.length,
      bare: [],
    });
  });

  it('the name tables match Toolbox and every World 4 sprite ships', () => {
    const sd = JSON.parse(readFileSync(path.join(DATA, 'shared-data.json'), 'utf8')) as {
      classes: string[];
      cookingMenu: { name: string }[];
      chips: { name: string }[];
      jewels: { name: string }[];
      petUpgrades: { name: string }[];
    };
    expect(CLASS_NAMES).toEqual(sd.classes);
    expect(MEAL_NAMES).toEqual(sd.cookingMenu.map((m) => m.name));
    expect(CHIP_NAMES).toEqual(sd.chips.map((c) => c.name));
    expect(JEWEL_NAMES).toEqual(sd.jewels.map((j) => j.name));
    expect(sd.petUpgrades[1]?.name.startsWith('Gene_Splicing')).toBe(true);
    for (const n of MEAL_NAMES) expect(ships(mealArt(n)), n).toBe(true);
    for (const n of CHIP_NAMES) expect(ships(chipArt(n)), n).toBe(true);
    for (const [i, n] of JEWEL_NAMES.entries()) expect(ships(jewelArt(i)), n).toBe(true);
    for (let i = 0; i < 10; i++) expect(ships(spiceArt(i)), `spice ${i}`).toBe(true);
    for (let i = 0; i < 18; i++) expect(ships(labBonusArt(i)), `bonus ${i}`).toBe(true);
    for (let i = 1; i < 10; i++) expect(ships(petUpgradeArt(i)), `upgrade ${i}`).toBe(true);
    expect(ships(eggArt())).toBe(true);
    for (const c of ['Beginner', 'Bubonic_Conjuror', 'Divine_Knight', 'Beast_Master'])
      expect(ships(classArtOfName(c)), c).toBe(true);
  });
});
