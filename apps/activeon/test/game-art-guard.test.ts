// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25 guard: a game thing is drawn with the game's sprite (<GameIcon>, ADR 0009 as amended
// 2026-10-19), never with our own kit sprite alone. Our kit's game-thing sprites (`sys-*`, `item-*`,
// `class-*`, `skill-*`, liquids and cauldrons, written out in full) may appear in a view only as a
// <GameIcon> fallback (any name containing "fallback"), or
// through <KitSprite> (which upgrades a System to its game sprite), or in ALLOW with the reason the
// game has no picture for it. The per-view render guards (game-art-coverage-*.test.tsx) check that
// the rows themselves carry a game sprite.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
/** A kit name for a game thing, as a string literal or the head of a template. */
const GAME_KIT =
  /['"`]((sys|item|class|skill)-[a-z0-9-]*|liquid-(water|nitrogen|seawater|mercury)|cauldron-(power|quicc|high-iq|kazam))['"`]/g;

/**
 * file -> the kit names it may still draw on their own, each with why. Keep this short: anything here
 * is a place the owner sees our drawing instead of the game's.
 */
const ALLOW: Readonly<Record<string, readonly string[]>> = {
  // A character's level-up row: the game draws no picture for "level up", so our star stays.
  'now/place/Pauses.tsx': ['item-star'],
};

const walk = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : /\.tsx?$/.test(e.name) ? [join(d, e.name)] : [],
  );

describe('game things wear game sprites', () => {
  it('no view draws a game thing with only our kit sprite', () => {
    const offences: string[] = [];
    for (const file of walk(SRC)) {
      const rel = file.slice(SRC.length + 1);
      // The art modules themselves (kit, lookup, KitSprite) and the kit's own catalogue are exempt.
      if (rel.startsWith('art/') || rel.startsWith('design/art/') || rel === 'systems/glyphs.ts') continue;
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        for (const m of line.matchAll(GAME_KIT)) {
          const name = m[1] ?? '';
          // A fallback, a KitSprite, or a lookup key is fine; a bare drawing is not.
          if (/fallback|KitSprite/i.test(line)) continue;
          if (ALLOW[rel]?.includes(name)) continue;
          offences.push(`${rel}:${i + 1} ${name}`);
        }
      });
    }
    expect(offences).toEqual([]);
  });

  it('a talent monogram ("PA") is drawn only as a game icon fallback', () => {
    const offences: string[] = [];
    for (const file of walk(SRC)) {
      const rel = file.slice(SRC.length + 1);
      // goals-model's monogram is a System's (no game picture for a Goal group), drawn as a fallback too.
      if (rel.startsWith('art/') || rel === 'account/goals-model.ts') continue;
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (!/\bmonogram\(/.test(line) || /function monogram/.test(line)) return;
        const near = lines.slice(Math.max(0, i - 4), i + 1).join('\n');
        if (!/fallback/i.test(near)) offences.push(`${rel}:${i + 1}`);
      });
    }
    expect(offences).toEqual([]);
  });
});
