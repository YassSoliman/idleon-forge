#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-4: converts our own pixel art (docs/design-lab/art/*.svg, ADR 0009) into typed modules that
// <PixelArt> draws without any inline style (CSP `style-src 'self'`).
//
// The Lab authored its SVGs in five ways: rect runs with class fills in a <style> block; <g fill="var(..)">
// groups; <g style="fill:var(..)"> groups; per-colour <path> runs whose slot map (--p1:var(--mat-blob-1))
// sits in the root style attribute or an `svg{}` rule; and rects with their own style="fill:..". Frames
// are <g> groups animated by @keyframes. This script PARSES every <style> block and style attribute
// first (slot map, frame list, frame timing), then drops them. Anything it doesn't recognise fails the
// import: nothing passes silently.
//
// Output (all generated, committed, re-checked in CI by `--check`):
//   apps/activeon/src/design/art/names.ts       the ArtName union, each motif's grid and group
//   apps/activeon/src/design/art/core.ts        the first-screen motifs (TR-12)
//   apps/activeon/src/design/art/generated/*.ts one module per Lab group, minus the core motifs
//   apps/activeon/src/design/art/art.css        the generated block: slot fills and per-motif slot maps
//
// Usage: node scripts/art/import.mjs [--check] [--manifest]
//   --check     regenerate in memory and exit 1 if any generated file differs (CI, via the art guard test)
//   --manifest  rewrite docs/design-lab/art/MANIFEST.json (only when adding a drawing of our own)
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = join(ROOT, 'docs/design-lab/art');
const OUT = join(ROOT, 'apps/activeon/src/design/art');
const CHECK = process.argv.includes('--check');

/** The first-screen motifs (TR-12): they ship in the main chunk; every other motif is lazy. */
export const CORE = [
  // the five family chibis (two-frame blink)
  'now-blob-beginner',
  'now-blob-journeyman',
  'now-blob-warrior',
  'now-blob-archer',
  'now-blob-mage',
  // loading, All set (the counter at zero), a lazy part that failed. The screen-level empty and
  // can't-read mascots (sleeping blob, gremlin) and the Log off campfire load with the flows group the
  // first time they're drawn: rare states, kept out of the first load to hold it under 317 KB (TR-12).
  'flows-walking-blob',
  'now-campfire',
  'flows-cracked-gear',
  // nav
  'v2-map-nav-now',
  'v2-map-nav-chars',
  'v2-map-nav-systems',
  'v2-map-nav-timeline',
  'v2-map-nav-map',
  // Verdict stamps: ready, fix, unknown, skipped, stale
  'now-glyph-check',
  'now-glyph-wrench',
  'now-glyph-question',
  'now-glyph-stale',
  'cards-zz',
  // pill kinds and the action line's tokens
  'now-cap-anvil',
  'now-cap-trap',
  'now-cap-worship',
  'now-hourglass',
  'now-pin',
  // header theme toggle (owner addition) and the glyphs the latin font subsets lack (V-5)
  'ui-theme-sun',
  'ui-theme-moon',
  'ui-arrow-right',
  'ui-arrow-left',
  'ui-check',
];

/** A raw hex the Lab used where a token was meant; mapped explicitly, any other hex fails. */
const HEX_TOKENS = { '#1d2433': 'var(--px-ui-ink)' };

const groupOf = (id) => {
  const m = /^(now|cards|flows|ui)-/.exec(id) ?? /^v2-(character|map|systems|time)-/.exec(id);
  if (!m) throw new Error(`${id}: no group (expected now-, cards-, flows-, ui- or v2-<group>-)`);
  return m[1];
};

// ---------------------------------------------------------------------------------------------------
// XML: the tiny subset the Lab writes.

const ALLOWED = {
  svg: ['xmlns', 'viewBox', 'shape-rendering', 'class', 'style'],
  title: [],
  style: [],
  g: ['class', 'style', 'fill'],
  rect: ['x', 'y', 'width', 'height', 'class', 'style', 'fill'],
  path: ['d', 'class', 'style', 'fill'],
};

function parseXml(text, file) {
  const root = { tag: '#root', attrs: {}, children: [], text: '' };
  const stack = [root];
  for (const m of text.matchAll(/<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g)) {
    const tok = m[0];
    const top = stack[stack.length - 1];
    if (tok.startsWith('<!--')) continue;
    if (tok.startsWith('</')) {
      const tag = tok.slice(2, -1).trim();
      if (top.tag !== tag) throw new Error(`${file}: </${tag}> closes <${top.tag}>`);
      stack.pop();
      continue;
    }
    if (tok.startsWith('<')) {
      const tm = /^<([a-zA-Z]+)([\s\S]*?)(\/?)>$/.exec(tok);
      if (!tm) throw new Error(`${file}: can't read tag ${tok.slice(0, 40)}`);
      const [, tag, rest, selfClose] = tm;
      if (!ALLOWED[tag]) throw new Error(`${file}: unknown element <${tag}>`);
      const attrs = {};
      const leftover = rest.replace(/([\w:-]+)="([^"]*)"/g, (_, k, v) => {
        if (!ALLOWED[tag].includes(k)) throw new Error(`${file}: unknown attribute ${tag}.${k}`);
        attrs[k] = v;
        return '';
      });
      if (leftover.trim()) throw new Error(`${file}: can't read attributes "${leftover.trim()}"`);
      const node = { tag, attrs, children: [], text: '' };
      top.children.push(node);
      if (!selfClose) stack.push(node);
      continue;
    }
    if (tok.trim()) {
      if (top.tag !== 'title' && top.tag !== 'style') throw new Error(`${file}: stray text in <${top.tag}>`);
      top.text += tok;
    }
  }
  if (stack.length !== 1) throw new Error(`${file}: unclosed <${stack[stack.length - 1].tag}>`);
  const svg = root.children.filter((c) => c.tag === 'svg');
  if (svg.length !== 1) throw new Error(`${file}: expected one <svg>`);
  return svg[0];
}

const unescapeXml = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

// ---------------------------------------------------------------------------------------------------
// CSS: rules, @keyframes and the reduced-motion @media the Lab writes.

/** Splits `a:b;c:d(e;f)` on top-level semicolons into [prop, value] pairs. */
function parseDecls(text, where) {
  const out = [];
  let depth = 0;
  let cur = '';
  const push = () => {
    const s = cur.trim();
    cur = '';
    if (!s) return;
    const i = s.indexOf(':');
    if (i < 1) throw new Error(`${where}: can't read declaration "${s}"`);
    out.push([s.slice(0, i).trim(), s.slice(i + 1).trim()]);
  };
  for (const ch of text) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) push();
    else cur += ch;
  }
  push();
  return out;
}

/** Top-level blocks: [{ prelude, body }]. */
function blocks(text, where) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open < 0) {
      if (text.slice(i).trim()) throw new Error(`${where}: stray CSS "${text.slice(i).trim().slice(0, 40)}"`);
      break;
    }
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth++;
      if (text[j] === '}') depth--;
      j++;
    }
    if (depth !== 0) throw new Error(`${where}: unbalanced braces`);
    out.push({ prelude: text.slice(i, open).trim(), body: text.slice(open + 1, j - 1) });
    i = j;
  }
  return out;
}

const RULE_PROPS = new Set(['fill', 'visibility', 'opacity', 'animation', 'animation-delay']);

function parseCss(text, file) {
  const rules = [];
  const keyframes = {};
  for (const { prelude, body } of blocks(text, file)) {
    if (prelude.startsWith('@keyframes')) {
      const name = prelude.slice('@keyframes'.length).trim();
      const stops = [];
      for (const kf of blocks(body, `${file} @keyframes ${name}`)) {
        const decls = Object.fromEntries(parseDecls(kf.body, file));
        for (const sel of kf.prelude.split(',')) {
          const s = sel.trim();
          const pct = s === 'from' ? 0 : s === 'to' ? 100 : Number(s.replace('%', ''));
          if (!Number.isFinite(pct) || !/%$|^from$|^to$/.test(s))
            throw new Error(`${file}: keyframe stop "${s}"`);
          let visible = null;
          if ('visibility' in decls) visible = decls.visibility === 'visible';
          if ('opacity' in decls) visible = Number(decls.opacity) > 0;
          if (visible === null)
            throw new Error(`${file}: keyframe ${name} ${s} sets neither visibility nor opacity`);
          stops.push({ pct, visible });
        }
      }
      keyframes[name] = stops.sort((a, b) => a.pct - b.pct);
      continue;
    }
    if (prelude.startsWith('@media')) {
      if (!/^@media\s*\(prefers-reduced-motion:\s*reduce\)$/.test(prelude))
        throw new Error(`${file}: unknown @media "${prelude}"`);
      // The app's art.css owns reduced motion (frame 1, or the last frame of a celebration).
      continue;
    }
    if (prelude.startsWith('@')) throw new Error(`${file}: unknown at-rule "${prelude}"`);
    for (const sel of prelude.split(',').map((s) => s.trim())) {
      const decls = parseDecls(body, file);
      if (sel === 'svg') {
        for (const [p] of decls)
          if (!p.startsWith('--'))
            throw new Error(`${file}: svg{} sets "${p}", only custom properties are known`);
        rules.push({ svg: true, classes: [], decls });
        continue;
      }
      if (!/^(\.[\w-]+)+$/.test(sel)) throw new Error(`${file}: unknown selector "${sel}"`);
      for (const [p] of decls)
        if (!RULE_PROPS.has(p)) throw new Error(`${file}: unknown property "${p}" in ${sel}`);
      rules.push({ svg: false, classes: sel.slice(1).split('.'), decls });
    }
  }
  return { rules, keyframes };
}

// ---------------------------------------------------------------------------------------------------
// Colour expressions -> token expressions (hex fallbacks dropped: the app defines every token).

/** Reads `var(--a, fallback)` at the start of s; returns [name, fallback|null, rest]. */
function readVar(s, where) {
  if (!s.startsWith('var(')) return null;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    if (s[i] === ')') {
      depth--;
      if (depth === 0) {
        const inner = s.slice(4, i);
        const comma = inner.indexOf(',');
        const name = (comma < 0 ? inner : inner.slice(0, comma)).trim();
        const fallback = comma < 0 ? null : inner.slice(comma + 1).trim();
        if (!/^--[\w-]+$/.test(name)) throw new Error(`${where}: bad var name "${name}"`);
        return [name, fallback, s.slice(i + 1).trim()];
      }
    }
  }
  throw new Error(`${where}: unbalanced var() in "${s}"`);
}

function normalizeColor(value, where) {
  const v = value.trim();
  if (v === 'currentColor') return 'currentColor';
  if (/^#[0-9a-f]{3,8}$/i.test(v)) {
    const t = HEX_TOKENS[v.toLowerCase()];
    if (!t) throw new Error(`${where}: raw colour ${v} has no token mapping (HEX_TOKENS)`);
    return t;
  }
  const r = readVar(v, where);
  if (!r || r[2]) throw new Error(`${where}: unknown colour form "${v}"`);
  const [name, fallback] = r;
  if (fallback === null || /^#[0-9a-f]{3,8}$/i.test(fallback)) return `var(${name})`;
  return `var(${name}, ${normalizeColor(fallback, where)})`;
}

/** `var(--return-line, var(--accent))` -> "return-line--accent"; currentColor -> "cur". */
const slotKey = (expr) =>
  expr === 'currentColor'
    ? 'cur'
    : expr
        .replace(/var\(--/g, '')
        .replace(/[)\s]/g, '')
        .replace(/,/g, '--');

// ---------------------------------------------------------------------------------------------------
// Timing

function parseMs(v, locals, where) {
  const s = v.trim();
  const r = readVar(s, where);
  if (r) {
    const val = locals[r[0]];
    if (!val) throw new Error(`${where}: timing var ${r[0]} isn't defined`);
    return parseMs(val, locals, where);
  }
  const m = /^(-?[\d.]+)(ms|s)$/.exec(s);
  if (!m) throw new Error(`${where}: can't read time "${s}"`);
  return Number(m[1]) * (m[2] === 's' ? 1000 : 1);
}

/** `cdfr 500ms steps(1,end) 1 forwards` -> { name, ms, loop }. */
function parseAnimation(v, locals, where) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of v) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (cur) parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur) parts.push(cur);
  let name = null;
  let ms = null;
  let loop = false;
  for (const p of parts) {
    if (p === 'infinite') loop = true;
    else if (p === '1' || p === 'forwards' || p === 'none' || /^steps\(/.test(p)) continue;
    else if (/^(-?[\d.]+)(ms|s)$/.test(p) || p.startsWith('var(')) {
      if (ms === null) ms = parseMs(p, locals, where);
    } else if (/^[\w-]+$/.test(p)) name = p;
    else throw new Error(`${where}: can't read animation part "${p}"`);
  }
  if (!name || ms === null) throw new Error(`${where}: animation "${v}" needs a name and a duration`);
  return { name, ms, loop };
}

// ---------------------------------------------------------------------------------------------------
// One SVG -> one motif

function parsePathRects(d, where) {
  const rects = [];
  for (const sub of d
    .split(/z/i)
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^M\s*(\d+)[ ,](\d+)\s*h\s*(\d+)\s*v\s*(\d+)\s*h\s*-(\d+)$/.exec(sub);
    if (!m || m[3] !== m[5]) throw new Error(`${where}: path run "${sub}" isn't a rectangle`);
    rects.push({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] });
  }
  return rects;
}

export function importSvg(text, file) {
  const id = file.replace(/\.svg$/, '');
  const svg = parseXml(text, file);
  const vb = (svg.attrs.viewBox ?? '').split(/\s+/).map(Number);
  if (vb.length !== 4 || vb[0] !== 0 || vb[1] !== 0) throw new Error(`${file}: viewBox must be "0 0 w h"`);
  const [, , W, H] = vb;

  // 1. Parse every style source first.
  const css = { rules: [], keyframes: {} };
  let title = '';
  const walkMeta = (n) => {
    for (const c of n.children) {
      if (c.tag === 'style') {
        const p = parseCss(unescapeXml(c.text), file);
        css.rules.push(...p.rules);
        Object.assign(css.keyframes, p.keyframes);
      } else if (c.tag === 'title') title = unescapeXml(c.text).trim();
      else walkMeta(c);
    }
  };
  walkMeta(svg);
  if (!title) throw new Error(`${file}: no <title>`);

  /** Local custom properties: the root style attribute and svg{} rules (slot maps and timing). */
  const locals = {};
  for (const [p, v] of parseDecls(svg.attrs.style ?? '', file)) {
    if (!p.startsWith('--'))
      throw new Error(`${file}: root style sets "${p}", only custom properties are known`);
    locals[p] = v;
  }
  for (const r of css.rules) if (r.svg) for (const [p, v] of r.decls) locals[p] = v;

  /** Declarations a class list picks up from the rules, in source order. */
  const declsFor = (classes) => {
    const out = {};
    for (const r of css.rules)
      if (!r.svg && r.classes.every((c) => classes.includes(c))) for (const [p, v] of r.decls) out[p] = v;
    return out;
  };
  const usedLocals = new Set();
  const colorOf = (value, where) => {
    const expr = normalizeColor(value, where);
    for (const m of expr.matchAll(/var\((--[\w-]+)/g)) if (locals[m[1]] !== undefined) usedLocals.add(m[1]);
    return expr;
  };
  const ownFill = (node) => {
    const where = `${file} <${node.tag}>`;
    const style = Object.fromEntries(parseDecls(node.attrs.style ?? '', where));
    for (const p of Object.keys(style)) if (p !== 'fill') throw new Error(`${where}: style sets "${p}"`);
    if (style.fill) return colorOf(style.fill, where);
    const classes = (node.attrs.class ?? '').split(/\s+/).filter(Boolean);
    const d = declsFor(classes);
    if (d.fill) return colorOf(d.fill, where);
    if (node.attrs.fill) return colorOf(node.attrs.fill, where);
    return null;
  };

  // 2. Frames: <g> groups that carry an animation, ordered by when each first shows.
  const frameGroups = [];
  const findFrames = (n) => {
    for (const c of n.children) {
      if (c.tag !== 'g') continue;
      const classes = (c.attrs.class ?? '').split(/\s+/).filter(Boolean);
      const d = declsFor(classes);
      if (d.animation) {
        const a = parseAnimation(d.animation, locals, file);
        const delay = d['animation-delay'] ? parseMs(d['animation-delay'], locals, file) : 0;
        const stops = css.keyframes[a.name];
        if (!stops) throw new Error(`${file}: @keyframes ${a.name} is missing`);
        const first = stops.find((s) => s.visible);
        if (!first) throw new Error(`${file}: frame ${classes.join('.')} is never visible`);
        const start = ((((first.pct / 100) * a.ms + delay) % a.ms) + a.ms) % a.ms;
        frameGroups.push({ node: c, start, ms: a.ms, loop: a.loop });
      } else findFrames(c);
    }
  };
  findFrames(svg);
  frameGroups.sort((a, b) => a.start - b.start);
  if (new Set(frameGroups.map((f) => f.ms)).size > 1)
    throw new Error(`${file}: frames have different periods`);
  if (new Set(frameGroups.map((f) => f.loop)).size > 1) throw new Error(`${file}: frames mix loop and once`);
  const nFrames = Math.max(1, frameGroups.length);
  const period = frameGroups[0]?.ms ?? 0;
  const fps = frameGroups.length > 1 ? Math.round((1000 * nFrames) / period) : 0;
  const once = frameGroups.length > 1 && !frameGroups[0].loop;

  // 3. Rasterise in paint order (later paints win), per frame.
  const grids = Array.from({ length: nFrames }, () => new Array(W * H).fill(null));
  const slots = new Map(); // key -> expr, in first-paint order
  const paint = (frames, rect, expr, where) => {
    if (expr === null) throw new Error(`${where}: a shape has no fill`);
    if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > W || rect.y + rect.h > H)
      throw new Error(`${where}: shape outside the ${W}x${H} grid`);
    const key = slotKey(expr);
    if (slots.has(key) && slots.get(key) !== expr) throw new Error(`${where}: slot key clash ${key}`);
    slots.set(key, expr);
    for (const f of frames)
      for (let y = rect.y; y < rect.y + rect.h; y++)
        for (let x = rect.x; x < rect.x + rect.w; x++) grids[f][y * W + x] = key;
  };
  const allFrames = [...Array(nFrames).keys()];
  const walk = (n, inherited, frames) => {
    for (const c of n.children) {
      if (c.tag === 'title' || c.tag === 'style') continue;
      const fi = frameGroups.findIndex((f) => f.node === c);
      const fr = fi >= 0 ? [fi] : frames;
      const fill = ownFill(c) ?? inherited;
      const where = `${file} <${c.tag}>`;
      if (c.tag === 'g') walk(c, fill, fr);
      else if (c.tag === 'rect') {
        const r = { x: +c.attrs.x, y: +c.attrs.y, w: +c.attrs.width, h: +c.attrs.height };
        if (![r.x, r.y, r.w, r.h].every(Number.isInteger)) throw new Error(`${where}: non-integer rect`);
        paint(fr, r, fill, where);
      } else if (c.tag === 'path')
        for (const r of parsePathRects(c.attrs.d ?? '', where)) paint(fr, r, fill, where);
      else throw new Error(`${where}: unexpected element`);
    }
  };
  walk(svg, null, allFrames);

  // 4. Merge each frame's same-slot pixels into rectangles (row runs, then equal runs stacked).
  const frames = grids.map((g) => {
    const out = {};
    for (const key of slots.keys()) {
      const open = new Map(); // "x,w" -> rect being grown
      const rects = [];
      for (let y = 0; y < H; y++) {
        const rowRuns = [];
        for (let x = 0; x < W; x++) {
          if (g[y * W + x] !== key) continue;
          let e = x;
          while (e < W && g[y * W + e] === key) e++;
          rowRuns.push([x, e - x]);
          x = e - 1;
        }
        const next = new Map();
        for (const [x, w] of rowRuns) {
          const k = `${x},${w}`;
          const r = open.get(k);
          if (r && r.y + r.h === y) {
            r.h++;
            next.set(k, r);
          } else {
            const nr = { x, y, w, h: 1 };
            rects.push(nr);
            next.set(k, nr);
          }
        }
        open.clear();
        for (const [k, r] of next) open.set(k, r);
      }
      if (rects.length) out[key] = rects.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}z`).join('');
    }
    return out;
  });

  const vars = {};
  for (const name of [...usedLocals].sort()) {
    // A slot map entry: its value is a colour (timing vars aren't used by fills).
    vars[name] = normalizeColor(locals[name], `${file} ${name}`);
    for (const m of vars[name].matchAll(/var\((--[\w-]+)/g))
      if (locals[m[1]] !== undefined) throw new Error(`${file}: ${name} points at another local var`);
  }
  return {
    id,
    group: groupOf(id),
    motif: { id, title, grid: [W, H], fps, once, slots: Object.fromEntries(slots), frames },
    vars,
  };
}

// ---------------------------------------------------------------------------------------------------
// Emit

const HEADER = (what) =>
  `// SPDX-License-Identifier: GPL-3.0-only\n// Copyright (C) 2026 IdleOn Forge contributors.\n// Generated by scripts/art/import.mjs from docs/design-lab/art (our own art, ADR 0009). Do not edit.\n// ${what}\n`;

const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function motifTs(m) {
  // The runtime shape is lean (main-chunk budget, TR-12): the key is the id, and the slot colours live in
  // art.css (`.pxs-<slot>`), so neither is repeated here.
  const frames = m.frames
    .map(
      (f) =>
        `{ ${Object.entries(f)
          .map(([k, d]) => `${q(k)}: ${q(d)}`)
          .join(', ')} }`,
    )
    .join(', ');
  return `{ title: ${q(m.title)}, grid: [${m.grid[0]}, ${m.grid[1]}], fps: ${m.fps}${m.once ? ', once: true' : ''}, frames: [${frames}] }`;
}

function moduleTs(what, motifs, motifPath = './motif') {
  return `${HEADER(what)}import type { Motif } from '${motifPath}';\n\nexport const motifs: Record<string, Motif> = {\n${motifs
    .map((m) => `  ${q(m.id)}: ${motifTs(m)},`)
    .join('\n')}\n};\n`;
}

const CSS_START = '/* @generated art:start (scripts/art/import.mjs; do not edit by hand) */';
const CSS_END = '/* @generated art:end */';

function generatedCss(all) {
  const slots = new Map();
  for (const a of all) for (const [k, v] of Object.entries(a.motif.slots)) slots.set(k, v);
  const lines = [CSS_START];
  for (const [k, v] of [...slots].sort(([a], [b]) => a.localeCompare(b)))
    lines.push(`.pxs-${k} { fill: ${v}; }`);
  for (const a of all) {
    const entries = Object.entries(a.vars);
    if (entries.length) lines.push(`.px-${a.id} { ${entries.map(([k, v]) => `${k}: ${v};`).join(' ')} }`);
  }
  const counts = [...new Set(all.map((a) => a.motif.frames.length).filter((n) => n > 1))].sort(
    (a, b) => a - b,
  );
  const fpss = [...new Set(all.map((a) => a.motif.fps).filter(Boolean))].sort((a, b) => a - b);
  for (const f of fpss) lines.push(`.px-fps${f} { --px-fdur: ${Math.floor(1000 / f)}ms; }`);
  for (const n of counts) lines.push(`.px-n${n} { --px-n: ${n}; }`);
  lines.push('@media (prefers-reduced-motion: no-preference) {');
  for (const n of counts)
    for (let i = 0; i < n; i++)
      lines.push(`  .px-anim.px-n${n} .px-f${i} { animation-name: px-n${n}-${i}; }`);
  lines.push('}');
  for (const n of counts)
    for (let i = 0; i < n; i++) {
      const a = +((i / n) * 100).toFixed(3);
      const b = +(((i + 1) / n) * 100).toFixed(3);
      const stops = [];
      if (i > 0) stops.push(`0% { visibility: hidden; }`);
      stops.push(`${a}% { visibility: visible; }`);
      if (i < n - 1) stops.push(`${b}%, 100% { visibility: hidden; }`);
      else stops.push(`100% { visibility: visible; }`);
      lines.push(`@keyframes px-n${n}-${i} { ${stops.join(' ')} }`);
    }
  lines.push(CSS_END);
  return lines.join('\n');
}

function namesTs(all) {
  const rows = all.map((a) => `  ${q(a.id)}: [${a.motif.grid[0]}, ${a.motif.grid[1]}, ${q(a.group)}],`);
  // The runtime lookups PixelArt uses are small on purpose (main-chunk budget, TR-12): ART_INDEX is for
  // types and tests and is tree-shaken out of the bundle; grids that aren't 16 x 16 are listed by size,
  // and a lazy motif's group follows from its name.
  const bySize = new Map();
  for (const a of all) {
    const [w, h] = a.motif.grid;
    if (w === 16 && h === 16) continue;
    const key = `${w}x${h}`;
    bySize.set(key, [...(bySize.get(key) ?? []), a.id]);
  }
  for (const a of all) {
    const derived =
      a.group === 'core' ? null : a.id.startsWith('v2-') ? a.id.split('-')[1] : a.id.split('-')[0];
    if (derived !== null && derived !== a.group)
      throw new Error(`${a.id}: group ${a.group} doesn't follow from its name`);
  }
  const sizes = [...bySize]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, ids]) => `  ${q(k)}: ${q(ids.join(' '))},`)
    .join('\n');
  return `${HEADER('Every motif: its grid (width, height) and the module that holds it.')}import type { ArtGroup } from './motif';

export const ART_INDEX = {
${rows.join('\n')}
} as const satisfies Record<string, readonly [number, number, ArtGroup | 'core']>;

export type ArtName = keyof typeof ART_INDEX;

/** Core motifs ship in the main chunk (TR-12); every other group is a lazy chunk. */
export const CORE_NAMES: readonly ArtName[] = [
${CORE.map((c) => `  ${q(c)},`).join('\n')}
];

/** The motifs whose grid isn't 16 x 16, by size ("WxH": space-separated names). */
const GRIDS: Record<string, string> = {
${sizes}
};

/** A motif's grid, before its group has loaded (so a placeholder already has the right size). */
export function gridOf(name: string): readonly [number, number] {
  for (const [size, names] of Object.entries(GRIDS))
    if (\` \${names} \`.includes(\` \${name} \`)) {
      const [w = 16, h = 16] = size.split('x').map(Number);
      return [w, h];
    }
  return [16, 16];
}

/** The lazy group that holds a motif, from its name ("v2-systems-…" is systems, "cards-…" is cards). */
export const groupOf = (name: string): ArtGroup =>
  (name.startsWith('v2-') ? name.split('-')[1] : name.split('-')[0]) as ArtGroup;
`;
}

function biome(path, text) {
  const bin = join(ROOT, 'node_modules/.bin/biome');
  if (!existsSync(bin)) throw new Error('biome is missing: run pnpm install');
  const r = spawnSync(bin, ['format', `--stdin-file-path=${path}`], { input: text, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`biome format ${path} failed:\n${r.stderr}`);
  return r.stdout;
}

function main() {
  const files = readdirSync(SRC)
    .filter((f) => f.endsWith('.svg'))
    .sort();
  if (process.argv.includes('--manifest')) {
    // Only when a person adds a drawing of our own (ADR 0009): the art guard test checks every
    // generated motif against this list, so a file can't slip in through a plain import.
    const manifest = {
      note: 'Every SVG here is our own drawing (ADR 0009); the art guard test checks each generated motif against this list.',
      files: Object.fromEntries(
        files.map((f) => [
          f,
          createHash('sha256')
            .update(readFileSync(join(SRC, f)))
            .digest('hex'),
        ]),
      ),
    };
    writeFileSync(join(SRC, 'MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`art: wrote MANIFEST.json (${files.length} files)`);
  }
  const all = files.map((f) => importSvg(readFileSync(join(SRC, f), 'utf8'), f));
  const ids = new Set(all.map((a) => a.id));
  for (const c of CORE) if (!ids.has(c)) throw new Error(`core motif ${c} has no source SVG`);
  for (const a of all) if (CORE.includes(a.id)) a.group = 'core';

  const outputs = new Map();
  const core = CORE.map((c) => all.find((a) => a.id === c).motif);
  outputs.set('core.ts', moduleTs('The first-screen motifs (TR-12), in the main chunk.', core));
  const groups = [...new Set(all.filter((a) => a.group !== 'core').map((a) => a.group))].sort();
  for (const g of groups)
    outputs.set(
      `generated/${g}.ts`,
      moduleTs(
        `The "${g}" group's motifs, a lazy chunk.`,
        all.filter((a) => a.group === g).map((a) => a.motif),
        '../motif',
      ),
    );
  outputs.set('names.ts', namesTs(all));

  const cssPath = join(OUT, 'art.css');
  const cssNow = readFileSync(cssPath, 'utf8');
  const s = cssNow.indexOf(CSS_START);
  const e = cssNow.indexOf(CSS_END);
  if (s < 0 || e < 0) throw new Error('art.css has no generated markers');
  outputs.set('art.css', cssNow.slice(0, s) + generatedCss(all) + cssNow.slice(e + CSS_END.length));

  let stale = 0;
  for (const [rel, raw] of outputs) {
    const path = join(OUT, rel);
    const text = biome(path, raw);
    const before = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (before === text) continue;
    if (CHECK) {
      console.error(`art: ${rel} is out of date; run pnpm art`);
      stale++;
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
      console.log(`art: wrote ${rel}`);
    }
  }
  if (CHECK && stale) process.exit(1);
  console.log(
    `art: ${all.length} motifs (${core.length} core), ${groups.length} lazy groups${CHECK ? ', up to date' : ''}`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (err) {
    console.error(`art: ${err.message}`);
    process.exit(1);
  }
}
