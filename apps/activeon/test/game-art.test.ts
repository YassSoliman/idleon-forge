// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The game sprites (ADR 0009 as amended 2026-10-19): one folder mirroring IdleOn Toolbox's whole image
// set at the pinned commit with Toolbox's own path scheme, as lossless WebP; its notice; under the
// Workers static-asset file limit; reached only through the typed lookup. This test is where the file
// list is checked, so the app ships no list.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cardArt } from '../src/art/game/card-art';
import {
  bubbleArt,
  classArt,
  GAME_ART_DIRS,
  type GameArt,
  gameArtSrc,
  itemArt,
  monsterArt,
  stampArtOfRef,
  talentArt,
  vialArt,
} from '../src/art/game/game-art';
import { SYSTEM_ART } from '../src/art/game/system-art';
import { wikiHref, wikiLabel } from '../src/art/game/wiki';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const ART = join(ROOT, 'apps/activeon/public/game-art');
const SRC = join(ROOT, 'apps/activeon/src');
const DATA = join(ROOT, 'packages/toolbox-parsers/vendor/data/website-data');
const manifest = JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8')) as {
  commit: string;
  bytesBefore: number;
  bytesAfter: number;
  files: string[];
};
const pin = /^commit=(.+)$/m.exec(readFileSync(join(ROOT, 'packages/toolbox-parsers/UPSTREAM'), 'utf8'))?.[1];
const shipped = new Set(manifest.files);
/** The file a lookup names, relative to the game-art folder. */
const fileOf = (art: GameArt | null) => {
  const src = gameArtSrc(art);
  return src ? decodeURIComponent(src.slice('/game-art/'.length)) : null;
};
const has = (art: GameArt | null) => {
  const f = fileOf(art);
  return f !== null && shipped.has(f);
};
const WEBP = (b: Buffer) =>
  b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP';

describe('game-art folder', () => {
  it('carries the notice that keeps it out of the GPL', () => {
    const notice = readFileSync(join(ART, 'NOTICE.md'), 'utf8');
    expect(notice).toContain(
      "Legends of IdleOn art © LavaFlame2. Not covered by this repository's GPL-3.0 licence. Used as IdleOn\nToolbox does, for a fan-made, read-only companion tool.",
    );
    const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
    expect(readme).toContain('apps/activeon/public/game-art/');
    expect(readme).toContain('not covered by this repository');
  });

  it('was mirrored from the pinned Toolbox commit, smaller than the source', () => {
    expect(manifest.commit).toBe(pin);
    expect(manifest.files.length).toBeGreaterThan(18_000);
    expect(manifest.bytesAfter).toBeLessThan(manifest.bytesBefore);
  });

  it("holds exactly the manifest, in Toolbox's folders, every picture a WebP or GIF", () => {
    expect(readdirSync(ART).sort()).toEqual(
      [
        ...GAME_ART_DIRS.filter((d) => manifest.files.some((f) => f.startsWith(`${d}/`))),
        'NOTICE.md',
        'manifest.json',
      ].sort(),
    );
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name).slice(ART.length + 1)],
      );
    const onDisk = GAME_ART_DIRS.flatMap((d) => (existsSync(join(ART, d)) ? walk(join(ART, d)) : [])).sort();
    expect(onDisk).toEqual([...manifest.files].sort());
    expect(manifest.files.every((f) => /\.(webp|gif)$/.test(f))).toBe(true);
    for (const f of manifest.files.filter((x) => x.endsWith('.webp')).slice(0, 200))
      expect(WEBP(readFileSync(join(ART, f))), f).toBe(true);
  });

  it("stays under Cloudflare's static-asset limits (Workers Free: 20,000 files a version, 25 MiB a file)", () => {
    // The app's own build output adds about a hundred files; keep 200 spare for it.
    expect(manifest.files.length + 2).toBeLessThanOrEqual(19_800);
    for (const f of manifest.files.slice(0, 500))
      expect(statSync(join(ART, f)).size).toBeLessThan(25 * 2 ** 20);
  });

  it('covers every card, every bubble, every vial and nearly every item of the pinned game data', () => {
    if (!existsSync(join(DATA, 'cards.json'))) return; // vendor/data is rebuilt before `pnpm test`
    const cards = Object.keys(JSON.parse(readFileSync(join(DATA, 'cards.json'), 'utf8')));
    const items = Object.keys(JSON.parse(readFileSync(join(DATA, 'items.json'), 'utf8')));
    expect(cards.filter((c) => !has(cardArt(c)))).toEqual([]);
    // Toolbox has no picture for a few dozen placeholder items; <GameIcon> falls back for those.
    expect(items.filter((i) => has(itemArt(i))).length / items.length).toBeGreaterThan(0.97);
    for (const c of 'GOPY')
      for (let i = 0; i < 30; i++) expect(has(bubbleArt(`aUpgrades${c}${i}`)), `${c}${i}`).toBe(true);
    for (let l = 1; l <= 13; l++) expect(has(vialArt(l)), `vial ${l}`).toBe(true);
    for (let c = 0; c < 40; c++) expect(has(classArt(c)), `class ${c}`).toBe(true);
    expect(has(monsterArt('mushG'))).toBe(true);
    expect(has(talentArt(10))).toBe(true);
  });

  it('every System sprite in SYSTEM_ART exists', () => {
    expect(Object.entries(SYSTEM_ART).filter(([, art]) => !has(art))).toEqual([]);
  });

  it('is reached only through the typed lookup (no hand-written /game-art/ paths in the app)', () => {
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(d, e.name)) : /\.(tsx?|css)$/.test(e.name) ? [join(d, e.name)] : [],
      );
    const users = walk(SRC).filter((f) => /[`'"]\/game-art\//.test(readFileSync(f, 'utf8')));
    expect(users.map((f) => f.slice(SRC.length + 1))).toEqual(['art/game/game-art.ts']);
  });
});

describe('gameArtSrc', () => {
  it("turns Toolbox paths into paths on our origin, in Toolbox's scheme", () => {
    expect(gameArtSrc(itemArt('EquipmentHats1'))).toBe('/game-art/data/EquipmentHats1.webp');
    expect(gameArtSrc(cardArt('mushG'))).toBe('/game-art/data/2CardsA0.webp');
    expect(gameArtSrc(talentArt(10))).toBe('/game-art/data/UISkillIcon10.webp');
    expect(gameArtSrc(bubbleArt('aUpgradesG0'))).toBe('/game-art/data/aUpgradesG0.webp');
    expect(gameArtSrc(vialArt(3))).toBe('/game-art/data/aVials3.webp');
    expect(gameArtSrc(classArt(1))).toBe('/game-art/data/ClassIcons1.webp');
    expect(gameArtSrc(monsterArt('mushG'))).toBe('/game-art/monsters/mushG/static.webp');
    expect(gameArtSrc({ path: 'afk_targets/Bronze_Chest(W1)' })).toBe(
      '/game-art/afk_targets/Bronze_Chest(W1).webp',
    );
  });

  it('never builds a path from a name that is not a game file name, or an empty slot', () => {
    const bad: GameArt[] = [
      { path: 'data/../index' },
      { path: 'data/a/../../x' },
      { path: 'data/' },
      { path: 'data/Blank' },
      { path: 'src/x' },
      { path: 'data/a<b' },
      { path: 'data/ space' },
    ];
    for (const a of bad) expect(gameArtSrc(a), JSON.stringify(a)).toBeNull();
    expect(gameArtSrc(null)).toBeNull();
    expect(talentArt(-1)).toBeNull();
    expect(talentArt(1.5)).toBeNull();
    expect(vialArt(0)).toBeNull();
    expect(cardArt('NoSuchCard')).toBeNull();
    expect(itemArt('a/b')).toBeNull();
  });

  it('draws a stamp from its Acquisition id', () => {
    expect(stampArtOfRef('stamps.acquisition.stamp-a4')).toEqual({ path: 'data/StampA4' });
    expect(stampArtOfRef('stamps.acquisition.stamp-c12')).toEqual({ path: 'data/StampC12' });
    expect(stampArtOfRef('upgrade-vault.acquisition.row-23')).toBeNull();
    expect(has(stampArtOfRef('stamps.acquisition.stamp-a4'))).toBe(true);
  });
});

describe('IdleOn Wiki links', () => {
  it('title the page by the display name, spaces as underscores', () => {
    expect(wikiHref('Sword Stamp')).toBe('https://idleon.wiki/wiki/Sword_Stamp');
    expect(wikiHref('Green_Mushroom')).toBe('https://idleon.wiki/wiki/Green_Mushroom');
    expect(wikiHref("Bored Bean's Card")).toBe("https://idleon.wiki/wiki/Bored_Bean's_Card");
    expect(wikiHref('  ')).toBeNull();
    expect(wikiLabel('Power_Statue')).toBe('Open Power Statue on the IdleOn Wiki');
  });
});
