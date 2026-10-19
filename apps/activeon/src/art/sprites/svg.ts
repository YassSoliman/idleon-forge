// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// A sprite as a standalone SVG string (for a data URL, a CSS background or a build-time sheet).
import { bake, GRID, pathsOf } from './bake';
import { spriteOf } from './index';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** The sprite `name` as an SVG string `size` px square (a whole multiple of 16 keeps it crisp). */
export function spriteSvg(name: string, size = 32, title?: string): string {
  const def = spriteOf(name);
  if (!def) throw new Error(`no sprite named ${name}`);
  const label = esc(title ?? def.title);
  const paths = pathsOf(bake(def))
    .map((p) => `<path fill="${p.fill}" d="${p.d}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID} ${GRID}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="${label}"><title>${label}</title>${paths}</svg>`;
}
