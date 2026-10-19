// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The surface guard (M21.1 refresh, 2026-10-18): the "AI tells" stay out of every stylesheet.
// Hierarchy comes from tonal background steps, hairline row dividers (a 1 px box-shadow line) and type
// size and weight; the one framed element per screen is the notched pixel frame (.a-frame). So:
// 1. no accent stripe on a card's edge: no `border-left` (or right), and no inset box-shadow stripe on
//    a side (`inset 3px 0 0 …`);
// 2. no border on a container: a border is allowed only on form inputs (input, textarea, select);
//    focus rings are outlines;
// 3. no soft radius: border-radius at most 4 px, except the phone dock and the pixel frame;
// 4. no pill: never 999 px / var(--radius-pill), never a percentage radius;
// 5. no ring around a container (R12 QA, 2026-10-18): a ring is a border by another name, so no
//    `box-shadow: [inset] 0 0 0 Npx` spread ring and no solid, dashed or dotted `outline`. Allowed:
//    focus rings (a :focus selector) and the game's own drawings, listed by name in DRAWINGS below.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.css') ? [join(dir, d.name)] : [],
  );

const tokens = readFileSync(join(SRC, 'design/tokens.css'), 'utf8');
/** The radius tokens' px values, followed through var() chains on :root and the field direction. */
const RADIUS: Record<string, string> = Object.fromEntries(
  [...tokens.matchAll(/--(radius-[\w-]+):\s*([^;]+);/g)].map((m) => [
    m[1] as string,
    (m[2] as string).trim(),
  ]),
);

interface Rule {
  selector: string;
  body: string;
}
const rulesOf = (css: string): Rule[] =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => ({ selector: (m[1] ?? '').trim(), body: m[2] ?? '' }))
    .filter((r) => !r.selector.startsWith('@') && !r.selector.startsWith('--'));

const decls = (body: string, prop: RegExp): string[] =>
  body
    .split(';')
    .map((d) => d.trim())
    .filter((d) => prop.test(d.split(':')[0]?.trim() ?? ''))
    .map((d) => d.slice(d.indexOf(':') + 1).trim());

/** A radius value's largest px, or Infinity for a pill or a percentage. */
export function radiusPx(value: string): number {
  let worst = 0;
  for (const part of value.split(/\s+|\//).filter(Boolean)) {
    let v = part;
    for (let hops = 0; v.startsWith('var(') && hops < 6; hops++) {
      const name = /var\(--([\w-]+)/.exec(v)?.[1] ?? '';
      v = RADIUS[name] ?? '0';
    }
    if (/%$/.test(v)) return Number.POSITIVE_INFINITY;
    if (/^calc\(/.test(v)) {
      const inner = /var\(--([\w-]+)/.exec(v)?.[1];
      v = inner ? (RADIUS[inner] ?? '0') : '0';
    }
    const px = /^(\d+(?:\.\d+)?)px$/.exec(v);
    if (px) worst = Math.max(worst, Number(px[1]));
  }
  return worst;
}

/** A border declaration's width is more than zero. */
const hasWidth = (value: string): boolean =>
  !/^(0|0px|none|hidden|transparent)$/.test(value.trim()) &&
  /(\d*\.?\d+px|var\(--border-width\)|thin|medium|thick)/.test(value);

const FORM = /\b(input|textarea|select)\b/;
const FOCUS = /:focus(-visible|-within)?\b/;

/**
 * Game drawings that may keep a ring or a dashed outline, because the ring is part of the pixel
 * drawing itself, not a box around content. Each entry is the selector prefix and why.
 */
export const DRAWINGS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\.px-/, 'pixel-art sprites (the art library)'],
  [/\.(bb-pip|dw-pip|cl-pip)\b/, 'pips: one game tick each, drawn as a filled or hollow square'],
  [/\.al-(pot|glass|rise|tube|vial)\b/, 'alchemy pots, vials and tubes: game objects'],
  [/\.map-(dot|stop)\b/, 'map nodes: the town dots on the world map'],
  [/\.sg-g\b/, 'Parallel Slots state glyphs (the per-cell icon)'],
  [
    /\.tl-(rail|hatch|bar-g|key)\b|\.tl-bar\.untimed::before/,
    'Timeline bar drawings and their legend swatches',
  ],
  [/\.sy-tank__glass\b/, 'the slot picture tanks: game objects'],
  [/\.a-meter\b/, 'meter fills (the bar drawing, not a box)'],
  [
    /\.(map-key|ms-star|ms-key|mc-face|mc-key)\b/,
    'M24 Map drawings: door keys, constellation stars and card frames',
  ],
  [/\.tl-mk\b/, "M24 Timeline lane marks: a limit's square on the rail (hollow: can't tell when)"],
];

/** The widest spread ring among a box-shadow's layers: `[inset] 0 0 0 Npx <color> [inset]`. */
const ringPx = (value: string): number => {
  let worst = 0;
  for (const layer of value.split(/,(?![^(]*\))/)) {
    const m = /^(?:inset\s+)?0(?:px)?\s+0(?:px)?\s+0(?:px)?\s+(\d*\.?\d+)px/.exec(layer.trim());
    // Only px spreads: a 100vmax spread is a full-bleed band, not a ring.
    if (m) worst = Math.max(worst, Number(m[1]));
  }
  return worst;
};
const RADIUS_OK = /\.places\b|\.a-frame\b/;

export function surfaceViolations(css: string): string[] {
  const out: string[] = [];
  for (const r of rulesOf(css)) {
    // 1. Stripes on a side.
    for (const v of decls(r.body, /^border-(left|right)(-width)?$/))
      if (hasWidth(v)) out.push(`${r.selector}: side stripe (border ${v})`);
    for (const v of decls(r.body, /^box-shadow$/))
      if (/inset\s+-?[1-9]\d*px\s+0(px)?\s+0/.test(v))
        out.push(`${r.selector}: side stripe (box-shadow ${v})`);
    // 2. Borders on containers.
    if (!FORM.test(r.selector))
      for (const v of decls(r.body, /^border(-top|-bottom)?(-width)?$/))
        if (hasWidth(v)) out.push(`${r.selector}: border ${v}`);
    // A border style alone draws the UA's medium (3 px) border.
    if (!FORM.test(r.selector))
      for (const v of decls(r.body, /^border(-(top|bottom|left|right))?-style$/))
        if (!/^(none|hidden)$/.test(v)) out.push(`${r.selector}: border-style ${v}`);
    // 5. Rings: a spread box-shadow or an outline around a container.
    // Every selector in the list must be a focus ring or a drawing, so a container can't hide in a list.
    const allowed = r.selector
      .split(',')
      .every((part) => FOCUS.test(part) || DRAWINGS.some(([re]) => re.test(part.trim())));
    if (!allowed) {
      for (const v of decls(r.body, /^box-shadow$/))
        if (ringPx(v) > 0) out.push(`${r.selector}: ring (box-shadow ${v.replace(/\s+/g, ' ')})`);
      for (const v of decls(r.body, /^outline(-style)?$/))
        if (/\b(solid|dashed|dotted|double)\b/.test(v)) out.push(`${r.selector}: outline ${v}`);
    }
    // 3 and 4. Radii.
    if (!RADIUS_OK.test(r.selector))
      for (const v of decls(r.body, /^border(-[a-z]+)*-radius$/)) {
        const px = radiusPx(v);
        if (px === Number.POSITIVE_INFINITY) out.push(`${r.selector}: pill or round radius ${v}`);
        else if (px > 4) out.push(`${r.selector}: radius ${v} (${px}px, max 4)`);
      }
  }
  return out;
}

const files = walk(SRC).map((abs) => relative(SRC, abs).split(sep).join('/'));

describe('surface guard (M21.1 refresh: no AI tells)', () => {
  it('finds the tells it is meant to', () => {
    expect(surfaceViolations('.c { border-left: 4px solid var(--accent); }')).toHaveLength(1);
    expect(surfaceViolations('.c { box-shadow: inset 3px 0 0 var(--accent); }')).toHaveLength(1);
    expect(surfaceViolations('.c { box-shadow: 0 1px 0 var(--line); }')).toEqual([]);
    expect(surfaceViolations('.c { border: 1px solid var(--line); }')).toHaveLength(1);
    expect(surfaceViolations('.c { border-top: var(--border-width) solid var(--line); }')).toHaveLength(1);
    expect(surfaceViolations('.c { border: 0; }')).toEqual([]);
    expect(surfaceViolations('.c { border-style: dashed; }')).toHaveLength(1);
    expect(surfaceViolations('.c input { border: 1px solid var(--line-strong); }')).toEqual([]);
    expect(surfaceViolations('.c { border-radius: 10px; }')).toHaveLength(1);
    expect(surfaceViolations('.c { border-radius: 999px; }')).toHaveLength(1);
    expect(surfaceViolations('.c { border-radius: var(--radius-pill); }')).toHaveLength(1);
    expect(surfaceViolations('.c { border-radius: 50%; }')).toHaveLength(1);
    expect(surfaceViolations('.c { border-radius: 4px; }')).toEqual([]);
    expect(surfaceViolations('.c { border-radius: 0; }')).toEqual([]);
    expect(surfaceViolations('.places .x { border-radius: 8px; }')).toEqual([]);
  });

  it('finds rings and outlines on containers, but not focus rings or game drawings', () => {
    expect(surfaceViolations('.c { box-shadow: inset 0 0 0 2px var(--warn); }')).toHaveLength(1);
    expect(surfaceViolations('.c { box-shadow: 0 0 0 2px var(--accent); }')).toHaveLength(1);
    expect(surfaceViolations('.c { box-shadow: 0 2px 0 var(--ink), inset 0 0 0 1px red; }')).toHaveLength(1);
    expect(surfaceViolations('.c { outline: 2px dashed var(--line-strong); }')).toHaveLength(1);
    expect(surfaceViolations('.c { outline: 1px solid var(--fam); }')).toHaveLength(1);
    expect(surfaceViolations('.c { outline: none; }')).toEqual([]);
    expect(surfaceViolations('.c { box-shadow: 0 1px 0 var(--line); }')).toEqual([]);
    expect(surfaceViolations('.c { box-shadow: 2px 2px 0 var(--ink); }')).toEqual([]);
    expect(surfaceViolations('.c:focus-visible { outline: 3px solid var(--focus); }')).toEqual([]);
    expect(surfaceViolations('.c:focus-visible { box-shadow: inset 0 0 0 3px var(--focus); }')).toEqual([]);
    expect(surfaceViolations('.bb-pip { box-shadow: inset 0 0 0 2px var(--line-strong); }')).toEqual([]);
    expect(surfaceViolations('.map-dot::before { outline: 2px dashed var(--line); }')).toEqual([]);
    expect(surfaceViolations('.c, .bb-pip { box-shadow: inset 0 0 0 2px red; }')).toHaveLength(1);
  });

  it('the shared radius tokens are square', () => {
    for (const t of ['radius-card', 'radius-control', 'radius-chip'])
      expect(radiusPx(`var(--${t})`), t).toBeLessThanOrEqual(4);
  });

  it('no stylesheet has a side stripe, a container border or ring, a soft radius or a pill', () => {
    const bad = files.flatMap((f) =>
      surfaceViolations(readFileSync(join(SRC, f), 'utf8')).map((v) => `${f}: ${v}`),
    );
    expect(bad).toEqual([]);
  });
});
