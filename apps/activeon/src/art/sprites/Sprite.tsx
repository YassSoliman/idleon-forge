// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// <Sprite>: one of the kit's 16x16 sprites as inline SVG. Fills are SVG presentation attributes (no
// inline style, so the CSP `style-src 'self'` holds). Bakes once per name.
import { type JSX, useMemo } from 'react';
import { bake, GRID, pathsOf } from './bake';
import { spriteOf } from './index';

export interface SpriteProps {
  name: string;
  /** Rendered size in px: 16, 24, 32, 48 or 64 (multiples of 16 are pixel-exact; 24 is 1.5x). */
  size?: 16 | 24 | 32 | 48 | 64;
  /** Overrides the sprite's own title (the accessible name). */
  title?: string;
  /** Beside its word: hidden from assistive tech. */
  decorative?: boolean;
  className?: string;
}

const cache = new Map<string, ReadonlyArray<{ fill: string; d: string }>>();
const pathsFor = (name: string) => {
  const hit = cache.get(name);
  if (hit) return hit;
  const def = spriteOf(name);
  const paths = def ? pathsOf(bake(def)) : [];
  cache.set(name, paths);
  return paths;
};

export function Sprite({ name, size = 32, title, decorative = false, className }: SpriteProps): JSX.Element {
  const paths = useMemo(() => pathsFor(name), [name]);
  const label = title ?? spriteOf(name)?.title ?? name;
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: the title is rendered below unless the sprite is decorative (then aria-hidden)
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${GRID} ${GRID}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={['spr-art', className].filter(Boolean).join(' ')}
      focusable="false"
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      {decorative ? null : <title>{label}</title>}
      {paths.map((p) => (
        <path key={p.fill} fill={p.fill} d={p.d} />
      ))}
    </svg>
  );
}
