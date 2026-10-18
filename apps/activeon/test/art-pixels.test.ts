// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 V-7: each generated motif draws exactly the pixels of its Lab SVG, frame by frame. This test
// rasterises the SOURCE independently of the importer (its own tag scan, paint order and frame groups)
// and compares it with the generated merged paths: the same painted pixels, and one generated slot per
// source fill (several source fills may share one token, never the other way round). 0 differing
// pixels, without a browser.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { motifs as core } from '../src/design/art/core';
import { motifs as cards } from '../src/design/art/generated/cards';
import { motifs as character } from '../src/design/art/generated/character';
import { motifs as flows } from '../src/design/art/generated/flows';
import { motifs as map } from '../src/design/art/generated/map';
import { motifs as now } from '../src/design/art/generated/now';
import { motifs as systems } from '../src/design/art/generated/systems';
import { motifs as time } from '../src/design/art/generated/time';
import type { Motif } from '../src/design/art/motif';

const ART = fileURLToPath(new URL('../../../docs/design-lab/art', import.meta.url));
const ALL: Record<string, Motif> = {
  ...core,
  ...cards,
  ...character,
  ...flows,
  ...map,
  ...now,
  ...systems,
  ...time,
};

const attr = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
const FRAME = /\b(?:f|cd-fr|fl-fr-i)(\d+)\b/;

/** Source pixels per frame: "x,y" -> the raw fill identity that painted it last. */
function rasterSource(svg: string): { w: number; h: number; frames: Map<string, string>[] } {
  const [, , w = 0, h = 0] = (attr(svg, 'viewBox') ?? '').split(/\s+/).map(Number);
  const body = svg.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<title>[\s\S]*?<\/title>/g, '');
  const ownFill = (tag: string) => {
    const style = attr(tag, 'style');
    const sf = style ? /fill:\s*([^;]+)/.exec(style)?.[1] : undefined;
    if (sf) return `style:${sf.trim()}`;
    const cls = attr(tag, 'class');
    if (cls && !FRAME.test(cls) && !/^lab-px-art$/.test(cls))
      return `class:${cls
        .split(/\s+/)
        .filter((c) => !/^(f|cd-fr|fl-fr|fl-fr-n\d+|lab-px-art)$/.test(c))
        .join('.')}`;
    const f = attr(tag, 'fill');
    return f ? `fill:${f}` : null;
  };
  // Pass 1: the frame groups, in their index order.
  const frameIdx: number[] = [];
  for (const m of body.matchAll(/<g\b[^>]*>/g)) {
    const fm = FRAME.exec(attr(m[0], 'class') ?? '');
    if (fm) frameIdx.push(Number(fm[1]));
  }
  const order = [...new Set(frameIdx)].sort((a, b) => a - b);
  const n = Math.max(1, order.length);
  const frames = Array.from({ length: n }, () => new Map<string, string>());
  const stack: { fill: string | null; frame: number | null }[] = [{ fill: null, frame: null }];
  const paint = (x: number, y: number, rw: number, rh: number, fill: string, frame: number | null) => {
    for (const fi of frame === null ? [...frames.keys()] : [frame])
      for (let yy = y; yy < y + rh; yy++)
        for (let xx = x; xx < x + rw; xx++) frames[fi]?.set(`${xx},${yy}`, fill);
  };
  for (const m of body.matchAll(/<\/g>|<(g|rect|path)\b[^>]*?\/?>/g)) {
    const tag = m[0];
    const top = stack[stack.length - 1] ?? { fill: null, frame: null };
    if (tag === '</g>') {
      stack.pop();
      continue;
    }
    const fill = ownFill(tag) ?? top.fill;
    if (m[1] === 'g') {
      const fm = FRAME.exec(attr(tag, 'class') ?? '');
      const frame = fm ? order.indexOf(Number(fm[1])) : top.frame;
      if (!tag.endsWith('/>')) stack.push({ fill, frame });
      continue;
    }
    if (!fill) throw new Error(`no fill on ${tag.slice(0, 60)}`);
    if (m[1] === 'rect') {
      paint(
        Number(attr(tag, 'x')),
        Number(attr(tag, 'y')),
        Number(attr(tag, 'width')),
        Number(attr(tag, 'height')),
        fill,
        top.frame,
      );
    } else
      for (const r of (attr(tag, 'd') ?? '').matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-\d+z/g))
        paint(Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4]), fill, top.frame);
  }
  return { w, h, frames };
}

function rasterMotif(id: string, m: Motif): Map<string, string>[] {
  return m.frames.map((f) => {
    const px = new Map<string, string>();
    for (const [slot, d] of Object.entries(f)) {
      const runs = [...d.matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)z/g)];
      expect(runs.map((r) => r[0]).join('')).toBe(d); // the d holds nothing but rectangles
      for (const r of runs) {
        const [x, y, w, h] = [r[1], r[2], r[3], r[4]].map(Number) as [number, number, number, number];
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            const k = `${xx},${yy}`;
            expect(px.has(k), `${id}: ${k} painted twice`).toBe(false);
            px.set(k, slot);
          }
      }
    }
    return px;
  });
}

const files = readdirSync(ART).filter((f) => f.endsWith('.svg'));

describe('V-7: generated motifs are pixel-identical to their Lab SVGs', () => {
  it('covers every SVG', () => {
    expect(Object.keys(ALL).sort()).toEqual(files.map((f) => f.replace(/\.svg$/, '')).sort());
  });

  it.each(files)('%s', (file) => {
    const id = file.replace(/\.svg$/, '');
    const motif = ALL[id];
    if (!motif) throw new Error(`${id} not generated`);
    const src = rasterSource(readFileSync(join(ART, file), 'utf8'));
    expect(motif.grid).toEqual([src.w, src.h]);
    const gen = rasterMotif(id, motif);
    expect(gen.length).toBe(src.frames.length);
    const fillToSlot = new Map<string, string>();
    gen.forEach((g, i) => {
      const s = src.frames[i] ?? new Map();
      expect([...g.keys()].sort()).toEqual([...s.keys()].sort());
      for (const [k, fill] of s) {
        const slot = g.get(k) ?? '';
        const seen = fillToSlot.get(fill);
        if (seen === undefined) fillToSlot.set(fill, slot);
        else expect(slot, `${id} frame ${i} ${k}: ${fill}`).toBe(seen);
      }
    });
  });
});
