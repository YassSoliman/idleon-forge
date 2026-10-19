// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment jsdom
// Copyright (C) 2026 IdleOn Forge contributors.
// The sprite kit (M24, ADR 0009): every grid is 16x16 and uses only palette keys, overlays only paint
// where they may, aliases point at drawn sprites, and the renderers draw what the grid says.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bake, dotsOf, GRID, overlayOf } from '../src/art/sprites/bake';
import { SPRITE_ALIASES, SPRITE_GROUPS, SPRITES, spriteNames, spriteOf } from '../src/art/sprites/index';
import { INKS, MASK_KEYS, MATERIALS, OVERLAY_KEYS } from '../src/art/sprites/palette';
import { Sprite } from '../src/art/sprites/Sprite';
import { spriteSvg } from '../src/art/sprites/svg';

const entries = Object.entries(SPRITES);
const palette = new Set<string>([...Object.values(MATERIALS).flatMap((m) => m.ramp), ...Object.values(INKS)]);

describe('sprite kit', () => {
  it('has the kit: at least 140 drawn sprites, every name unique across groups', () => {
    const all = Object.values(SPRITE_GROUPS).flatMap((g) => Object.keys(g));
    expect(all.length).toBeGreaterThanOrEqual(140);
    expect(new Set(all).size).toBe(all.length);
    expect(entries.length).toBe(all.length);
  });

  it.each(entries)('%s: the mask is 16x16 of palette keys', (_name, def) => {
    expect(def.mask).toHaveLength(GRID);
    for (const row of def.mask) {
      expect(row).toHaveLength(GRID);
      for (const key of row) expect(MASK_KEYS.has(key), `mask key ${key}`).toBe(true);
    }
    expect(def.mask.some((row) => /[^.]/.test(row))).toBe(true);
  });

  it.each(entries)(
    '%s: the overlay is 16x16 of overlay keys, and tones only sit on drawn pixels',
    (_name, def) => {
      if (def.over) {
        expect(def.over).toHaveLength(GRID);
        for (const row of def.over) expect(row).toHaveLength(GRID);
      }
      for (const [x, y] of dotsOf(def.dots)) {
        expect(x).toBeLessThan(GRID);
        expect(y).toBeLessThan(GRID);
      }
      const over = overlayOf(def);
      over.forEach((row, y) => {
        row.forEach((key, x) => {
          expect(OVERLAY_KEYS.has(key), `overlay key ${key} at ${x},${y}`).toBe(true);
          if (/[1-4]/.test(key))
            expect(def.mask[y]?.[x], `tone ${key} on an empty pixel at ${x},${y}`).not.toBe('.');
        });
      });
    },
  );

  it.each(entries)('%s: bakes to 16x16 palette colours with a title', (_name, def) => {
    expect(def.title.trim()).not.toBe('');
    const px = bake(def);
    expect(px).toHaveLength(GRID);
    for (const row of px) {
      expect(row).toHaveLength(GRID);
      for (const c of row) if (c !== null) expect(palette.has(c), `colour ${c}`).toBe(true);
    }
  });

  it('every alias names a drawn sprite and shadows none', () => {
    for (const [alias, target] of Object.entries(SPRITE_ALIASES)) {
      expect(SPRITES[target], `${alias} -> ${target}`).toBeDefined();
      expect(SPRITES[alias], `${alias} is also drawn`).toBeUndefined();
    }
    for (const name of spriteNames()) expect(spriteOf(name)).toBeDefined();
  });

  it('house rules: a lone pixel gets its outline on all four sides, lit top-left', () => {
    const mask = Array.from({ length: GRID }, (_, y) => (y === 5 ? '.....gg.........' : '................'));
    const px = bake({ title: 't', mask });
    const [outline, , , hi] = MATERIALS.g.ramp;
    expect(px[4]?.[5]).toBe(outline);
    expect(px[6]?.[6]).toBe(outline);
    expect(px[5]?.[4]).toBe(outline);
    expect(px[5]?.[7]).toBe(outline);
    expect(px[4]?.[4]).toBeNull(); // corners stay soft (4-neighbour outline)
    expect(px[5]?.[5]).toBe(hi); // the left pixel is lit from the top-left
    expect(px[5]?.[6]).toBe(MATERIALS.g.ramp[1]); // the right one falls into shadow
  });

  it('spriteSvg draws one crisp, titled SVG per sprite, aliases included', () => {
    for (const name of spriteNames()) {
      const svg = spriteSvg(name, 48);
      expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 16 16"[^>]*width="48"/);
      expect(svg).toContain('shape-rendering="crispEdges"');
      expect(svg).toContain('<title>');
    }
    expect(() => spriteSvg('no-such-sprite')).toThrow();
  });

  it('<Sprite> renders an accessible SVG, or a hidden one when decorative', () => {
    const { container, rerender } = render(<Sprite name="place-map" size={24} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Map');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(container.querySelectorAll('path').length).toBeGreaterThan(2);
    expect(container.querySelector('[style]')).toBeNull();
    rerender(<Sprite name="gear-pickaxe" decorative />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('title')).toBeNull();
  });
});
