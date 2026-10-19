// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The game sprites (ADR 0009 as amended 2026-10-19): one folder, its notice, copied from the pinned
// Toolbox commit, nothing else in it, and <GameIcon> falls back to our own art. The lookup is a
// template string; this test is where the file list is checked, so the app ships no list.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GAME_ART_DIR, type GameArt, gameArtSrc, stampArtOfRef } from '../src/art/game/game-art';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const ART = join(ROOT, 'apps/activeon/public/game-art');
const SRC = join(ROOT, 'apps/activeon/src');
const DATA = join(ROOT, 'packages/toolbox-parsers/vendor/data/website-data');
const manifest = JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8')) as {
  commit: string;
  files: Record<string, string[]>;
};
const pin = /^commit=(.+)$/m.exec(readFileSync(join(ROOT, 'packages/toolbox-parsers/UPSTREAM'), 'utf8'))?.[1];
const KIND_DIRS = Object.values(GAME_ART_DIR);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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

  it('was copied from the pinned Toolbox commit', () => {
    expect(manifest.commit).toBe(pin);
  });

  it('holds exactly the manifest: the kind folders, NOTICE.md and manifest.json, every file a PNG', () => {
    expect(readdirSync(ART).sort()).toEqual([...KIND_DIRS, 'NOTICE.md', 'manifest.json'].sort());
    for (const dir of KIND_DIRS) {
      const listed = (manifest.files[dir] ?? []).map((id) => `${id}.png`).sort();
      expect(readdirSync(join(ART, dir)).sort(), dir).toEqual(listed);
    }
    for (const dir of KIND_DIRS)
      for (const id of (manifest.files[dir] ?? []).slice(0, 5))
        expect(
          readFileSync(join(ART, dir, `${id}.png`))
            .subarray(0, 8)
            .equals(PNG),
          `${dir}/${id}`,
        ).toBe(true);
  });

  it('covers every card and nearly every item of the pinned game data', () => {
    if (!existsSync(join(DATA, 'cards.json'))) return; // vendor/data is rebuilt before `pnpm test`
    const cards = Object.keys(JSON.parse(readFileSync(join(DATA, 'cards.json'), 'utf8')));
    const items = Object.keys(JSON.parse(readFileSync(join(DATA, 'items.json'), 'utf8')));
    const have = (dir: string) => new Set(manifest.files[dir]);
    expect(cards.filter((c) => !have('cards').has(c))).toEqual([]);
    // Toolbox has no picture for a few dozen placeholder items; <GameIcon> falls back for those.
    expect(items.filter((i) => have('items').has(i)).length / items.length).toBeGreaterThan(0.97);
  });

  it('is reached only through the typed lookup (no hand-written /game-art/ paths in the app)', () => {
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(d, e.name)) : /\.(tsx?|css)$/.test(e.name) ? [join(d, e.name)] : [],
      );
    const users = walk(SRC).filter((f) => readFileSync(f, 'utf8').includes('/game-art/'));
    expect(users.map((f) => f.slice(SRC.length + 1))).toEqual(['art/game/game-art.ts']);
  });
});

describe('gameArtSrc', () => {
  it('turns ids into paths on our origin', () => {
    expect(gameArtSrc({ kind: 'item', id: 'EquipmentHats1' })).toBe('/game-art/items/EquipmentHats1.png');
    expect(gameArtSrc({ kind: 'card', id: 'mushG' })).toBe('/game-art/cards/mushG.png');
    expect(gameArtSrc({ kind: 'talent', id: 10 })).toBe('/game-art/talents/10.png');
    expect(gameArtSrc({ kind: 'bubble', id: 'aUpgradesG0' })).toBe('/game-art/bubbles/aUpgradesG0.png');
    expect(gameArtSrc({ kind: 'class', id: 1 })).toBe('/game-art/classes/1.png');
  });

  it('never builds a path from an id that is not a game identifier, or an empty slot', () => {
    const bad: GameArt[] = [
      { kind: 'item', id: '../index' },
      { kind: 'item', id: 'a/b' },
      { kind: 'item', id: '' },
      { kind: 'item', id: 'Blank' },
      { kind: 'talent', id: -1 },
      { kind: 'talent', id: 1.5 },
    ];
    for (const a of bad) expect(gameArtSrc(a), JSON.stringify(a)).toBeNull();
    expect(gameArtSrc(null)).toBeNull();
  });

  it('every path the lookup builds for a manifest id exists', () => {
    const kinds = Object.entries(GAME_ART_DIR) as [GameArt['kind'], string][];
    for (const [kind, dir] of kinds)
      for (const id of (manifest.files[dir] ?? []).slice(0, 50)) {
        const src = gameArtSrc({
          kind,
          id: kind === 'talent' || kind === 'vial' || kind === 'class' ? Number(id) : id,
        } as GameArt);
        expect(src && existsSync(join(ART, '..', src)), `${kind} ${id}`).toBe(true);
      }
  });

  it('draws a stamp from its Acquisition id', () => {
    expect(stampArtOfRef('stamps.acquisition.stamp-a4')).toEqual({ kind: 'item', id: 'StampA4' });
    expect(stampArtOfRef('stamps.acquisition.stamp-c12')).toEqual({ kind: 'item', id: 'StampC12' });
    expect(stampArtOfRef('upgrade-vault.acquisition.row-23')).toBeNull();
    expect(existsSync(join(ART, 'items/StampA4.png'))).toBe(true);
  });
});
