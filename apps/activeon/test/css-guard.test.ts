// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The CSS guard (M21 TR-15, DS-14, DS-15, DS-20) over every stylesheet in apps/activeon/src:
// - no font-size below 12 px outside `.legal`;
// - the pixel display face never below 16 px, and Pixelify Sans (--font-display) never below 20 px nor
//   at a weight other than the display weight (the pixel "c" QA, below);
// - no letter-spacing on a pill;
// - the atoms' interactive base selectors carry min-height: var(--tap-min).
// The design system's own CSS (src/design/**) must be clean now. The places' CSS predates the rules:
// BASELINE names today's violations per file, and it may only shrink. Each area clears its own files
// as it moves onto the atoms (a file that gets cleaner must lower its count here, so the list never
// hides a regression), and Integration checks the list is empty (FR-I3).
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

/**
 * Violations allowed per file. Phase F started it at 17 rules in 7 files; the areas cleared theirs and
 * Integration checks it is empty (FR-I3, test below). Never add a file to it.
 */
const BASELINE: Record<string, number> = {};

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.css') ? [join(dir, d.name)] : [],
  );

const tokens = readFileSync(join(SRC, 'design/tokens.css'), 'utf8');
const TEXT_PX: Record<string, number> = Object.fromEntries(
  [...tokens.matchAll(/--(text-[\w-]+|pixel-label-size[\w-]*):\s*(\d+)px/g)].map((m) => [m[1], Number(m[2])]),
);

interface Rule {
  selector: string;
  body: string;
}
const rulesOf = (css: string): Rule[] =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: (m[1] ?? '').trim(),
    body: m[2] ?? '',
  }));

/** The rule's font size in px, from font-size or the font shorthand; null when it doesn't set one. */
function fontPx(body: string): number | null {
  const decl =
    /(?:^|;)\s*font-size\s*:\s*([^;]+)/.exec(body)?.[1] ?? /(?:^|;)\s*font\s*:\s*([^;]+)/.exec(body)?.[1];
  if (!decl) return null;
  const v = /var\(--(text-[\w-]+|pixel-label-size[\w-]*)\)/.exec(decl);
  if (v) return TEXT_PX[v[1] as string] ?? null;
  const px = /(\d+(?:\.\d+)?)px/.exec(decl);
  if (px) return Number(px[1]);
  const rem = /(\d*\.?\d+)rem/.exec(decl);
  return rem ? Number(rem[1]) * 16 : null;
}

const PIXEL_FACE =
  /var\(--(display|font-display|ff-pixel[\w-]*|font-label)\)|Pixelify|Silkscreen|Jersey|Tiny5|VT323/;

/**
 * Pixel "c" QA (2026-10-18): Pixelify Sans draws the mouth of "c", "C" and "e" one art pixel tall
 * (an art pixel is 1/11 em). Below 20 px that slit is under 2 device pixels on a 1x screen and, for most
 * sizes, falls across two pixel rows and antialiases shut: "Account" read "Aooount" at 18 px. Measured
 * on the 400 master in Chromium at 1x, 1.25x, 1.5x and 2x: open at every size from 20 to 40 px.
 */
const DISPLAY_FACE = /var\(--(font-display|ff-pixel-display)\)|Pixelify/;
export const PIXEL_DISPLAY_MIN_PX = 20;

/** The rule's font weight, from font-weight or the font shorthand's first word; null when unset. */
function fontWeight(body: string): string | null {
  const long = /(?:^|;)\s*font-weight\s*:\s*([^;]+)/.exec(body)?.[1]?.trim();
  if (long) return long;
  const short = /(?:^|;)\s*font\s*:\s*([^;]+)/.exec(body)?.[1]?.trim();
  const first = short?.split(/\s+/)[0];
  return first && /^(\d{3}|var\(--(weight-[\w-]+|display-weight)\)|bold|normal)$/.test(first) ? first : null;
}

export function violations(css: string): string[] {
  const out: string[] = [];
  for (const r of rulesOf(css)) {
    if (r.selector.startsWith('@')) continue;
    const size = fontPx(r.body);
    if (size !== null && size < 12 && !/\.legal\b/.test(r.selector))
      out.push(`${r.selector}: font-size ${size}px`);
    const family = /(?:^|;)\s*font(?:-family)?\s*:\s*([^;]+)/.exec(r.body)?.[1] ?? '';
    if (PIXEL_FACE.test(family) && size !== null && size < 16)
      out.push(`${r.selector}: pixel face at ${size}px`);
    if (DISPLAY_FACE.test(family)) {
      if (size !== null && size < PIXEL_DISPLAY_MIN_PX)
        out.push(`${r.selector}: Pixelify at ${size}px (min ${PIXEL_DISPLAY_MIN_PX})`);
      const weight = fontWeight(r.body);
      if (weight !== null && !/^(var\(--display-weight\)|400|normal)$/.test(weight))
        out.push(`${r.selector}: Pixelify at weight ${weight} (use var(--display-weight))`);
    }
    const spacing = /letter-spacing\s*:\s*([^;]+)/.exec(r.body)?.[1]?.trim();
    if (/\.(a-)?pill\b/.test(r.selector) && spacing && !/^(0|0em|0px|normal)$/.test(spacing))
      out.push(`${r.selector}: letter-spacing on a pill`);
  }
  return out;
}

const files = walk(SRC).map((abs) => relative(SRC, abs).split(sep).join('/'));
const byFile = Object.fromEntries(files.map((f) => [f, violations(readFileSync(join(SRC, f), 'utf8'))]));

describe('CSS guard (TR-15)', () => {
  it('finds the rules it is meant to', () => {
    expect(violations('.x { font-size: 11px; }')).toHaveLength(1);
    expect(violations('.legal { font-size: 11px; }')).toEqual([]);
    expect(violations('.x { font: 600 10px / 1 var(--body); }')).toHaveLength(1);
    expect(violations('.x { font-family: var(--display); font-size: 14px; }')).toHaveLength(1);
    expect(violations('.x { font: var(--display-weight) var(--text-xl) / 1 var(--font-display); }')).toEqual(
      [],
    );
    expect(
      violations('.x { font: var(--display-weight) var(--text-lg) / 1 var(--font-display); }'),
    ).toHaveLength(1);
    expect(violations('.x { font-family: var(--font-display); font-size: 18px; }')).toHaveLength(1);
    expect(
      violations('.x { font: var(--weight-bold) var(--text-xl) / 1 var(--font-display); }'),
    ).toHaveLength(1);
    expect(violations('.x { font-family: var(--font-display); font-weight: 600; }')).toHaveLength(1);
    expect(violations('.x { font-family: var(--font-body); font-size: 18px; font-weight: 700; }')).toEqual(
      [],
    );
    expect(violations('.a-pill { letter-spacing: 0.06em; }')).toHaveLength(1);
    expect(violations('.pill { letter-spacing: 0; }')).toEqual([]);
  });

  it('the design system CSS is clean', () => {
    const design = Object.entries(byFile).filter(([f]) => f.startsWith('design/'));
    expect(design.length).toBeGreaterThan(0);
    expect(design.filter(([, v]) => v.length > 0)).toEqual([]);
  });

  it('the baseline is empty: every stylesheet meets the rules (Integration, FR-I3)', () => {
    expect(BASELINE).toEqual({});
  });

  it('no stylesheet has more violations than its baseline, and the baseline only shrinks', () => {
    const over = Object.entries(byFile)
      .filter(([f, v]) => v.length > (BASELINE[f] ?? 0))
      .map(([f, v]) => `${f}: ${v.length} (baseline ${BASELINE[f] ?? 0})\n  ${v.join('\n  ')}`);
    expect(over).toEqual([]);
    const stale = Object.entries(BASELINE)
      .filter(([f, n]) => (byFile[f]?.length ?? 0) < n)
      .map(([f, n]) => `${f}: now ${byFile[f]?.length ?? 0}, lower its baseline from ${n}`);
    expect(stale).toEqual([]);
  });

  it("the atoms' interactive base selectors carry the 44 px minimum (DS-15)", () => {
    const atoms = rulesOf(readFileSync(join(SRC, 'design/atoms/atoms.css'), 'utf8'));
    const tap = atoms.filter((r) => /min-height:\s*var\(--tap-min\)/.test(r.body)).map((r) => r.selector);
    const covered = tap.flatMap((s) => s.split(',').map((x) => x.trim()));
    for (const sel of [
      '.a-btn',
      '.a-icon-btn',
      '.a-link-row',
      '.a-chip',
      '.a-pill--filter',
      '.a-seg__option',
      '.a-tab',
    ])
      expect(covered).toContain(sel);
  });
});

/** R11 QA: the rules that would turn ligatures back on (Pixelify draws "fi"/"ffi" as "A"). */
export function ligatureViolations(css: string): string[] {
  const out: string[] = [];
  for (const r of rulesOf(css)) {
    if (r.selector.startsWith('@')) continue;
    const lig = /(?:^|;)\s*font-variant-ligatures\s*:\s*([^;]+)/.exec(r.body)?.[1]?.trim();
    const feat = /(?:^|;)\s*font-feature-settings\s*:\s*([^;]+)/.exec(r.body)?.[1]?.trim();
    if (lig && !/^(none|var\(--font-ligatures\))$/.test(lig)) out.push(`${r.selector}: ligatures ${lig}`);
    if (feat && feat !== 'var(--font-features)') out.push(`${r.selector}: font-feature-settings ${feat}`);
    // The font shorthand resets font-variant-ligatures, so it must set both longhands again.
    const short = /(?:^|;)\s*font\s*:\s*([^;]+)/.exec(r.body)?.[1]?.trim();
    if (short && short !== 'inherit' && (!lig || !feat))
      out.push(`${r.selector}: font shorthand without the ligature longhands`);
  }
  return out;
}

describe('Pixelify ligatures off (R11 QA)', () => {
  it('the tokens set no ligatures on html, from the --font-ligatures / --font-features tokens', () => {
    expect(tokens).toMatch(/--font-ligatures:\s*none;/);
    expect(tokens).toMatch(/--font-features:\s*"liga" 0, "clig" 0;/);
    const html = rulesOf(tokens).find((r) => r.selector === 'html');
    expect(html?.body).toMatch(/font-variant-ligatures:\s*var\(--font-ligatures\)/);
    expect(html?.body).toMatch(/font-feature-settings:\s*var\(--font-features\)/);
  });

  it('finds the rules that would turn ligatures back on', () => {
    expect(ligatureViolations('.x { font: 600 16px / 1 var(--font-display); }')).toHaveLength(1);
    expect(ligatureViolations('.x { font-variant-ligatures: common-ligatures; }')).toHaveLength(1);
    expect(ligatureViolations('.x { font: inherit; }')).toEqual([]);
    expect(
      ligatureViolations(
        '.x { font: 600 16px / 1 var(--font-display); font-variant-ligatures: var(--font-ligatures); font-feature-settings: var(--font-features); }',
      ),
    ).toEqual([]);
  });

  it('no stylesheet turns ligatures back on', () => {
    const bad = files.flatMap((f) =>
      ligatureViolations(readFileSync(join(SRC, f), 'utf8')).map((v) => `${f}: ${v}`),
    );
    expect(bad).toEqual([]);
  });
});

/** The last class of each selector part (".cs-strip[data-shrunk] .cs-name" -> "cs-name"). */
const lastClasses = (selector: string): string[] =>
  selector.split(',').flatMap((part) => {
    const m = /\.([\w-]+)[^.\s>+~]*\s*$/.exec(part.trim());
    return m?.[1] ? [m[1]] : [];
  });

const familyOf = (body: string): string => /(?:^|;)\s*font(?:-family)?\s*:\s*([^;]+)/.exec(body)?.[1] ?? '';

/**
 * Pixel "c" QA: a rule that shrinks a pixel heading without naming the family (a modifier, a media
 * query) inherits Pixelify all the same. Classes whose rule sets the display face anywhere are pixel
 * classes; no other rule may size them below the minimum.
 */
export function inheritedPixelViolations(sheets: string[]): string[] {
  const all = sheets.flatMap((css) => rulesOf(css)).filter((r) => !r.selector.startsWith('@'));
  const pixel = new Set(
    all.filter((r) => DISPLAY_FACE.test(familyOf(r.body))).flatMap((r) => lastClasses(r.selector)),
  );
  const out: string[] = [];
  for (const r of all) {
    if (!lastClasses(r.selector).some((c) => pixel.has(c))) continue;
    const size = fontPx(r.body);
    const family = familyOf(r.body);
    if (size !== null && size < PIXEL_DISPLAY_MIN_PX && (family === '' || DISPLAY_FACE.test(family)))
      out.push(`${r.selector}: Pixelify inherited at ${size}px (min ${PIXEL_DISPLAY_MIN_PX})`);
  }
  return out;
}

/** The code points a WOFF 1.0 font maps, from its cmap's format 4 subtables. Node's zlib only. */
function woffCodePoints(file: string): Set<number> {
  const buf = readFileSync(file);
  let cmap: Buffer | null = null;
  for (let i = 0; i < buf.readUInt16BE(12); i++) {
    const at = 44 + i * 20;
    if (buf.toString('latin1', at, at + 4) !== 'cmap') continue;
    const offset = buf.readUInt32BE(at + 4);
    const compLength = buf.readUInt32BE(at + 8);
    const raw = buf.subarray(offset, offset + compLength);
    cmap = compLength < buf.readUInt32BE(at + 12) ? inflateSync(raw) : raw;
  }
  if (!cmap) throw new Error(`${file}: no cmap`);
  const points = new Set<number>();
  for (let i = 0; i < cmap.readUInt16BE(2); i++) {
    const sub = cmap.readUInt32BE(4 + i * 8 + 4);
    if (cmap.readUInt16BE(sub) !== 4) continue;
    const segX2 = cmap.readUInt16BE(sub + 6);
    const ends = sub + 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const ranges = deltas + segX2;
    for (let s = 0; s < segX2; s += 2) {
      const end = cmap.readUInt16BE(ends + s);
      const start = cmap.readUInt16BE(starts + s);
      const delta = cmap.readUInt16BE(deltas + s);
      const rangeOffset = cmap.readUInt16BE(ranges + s);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        const g = rangeOffset === 0 ? c : cmap.readUInt16BE(ranges + s + rangeOffset + (c - start) * 2);
        if (g !== 0 && ((g + delta) & 0xffff) !== 0) points.add(c);
      }
    }
  }
  return points;
}

describe('Pixel "c" QA: Pixelify Sans renders on its grid (2026-10-18)', () => {
  const fontsTs = readFileSync(join(SRC, 'design/fonts.ts'), 'utf8');

  it('self-hosts Pixelify Sans at its 400 master only', () => {
    const imports = [...fontsTs.matchAll(/^import '@fontsource\/pixelify-sans\/([\w-]+)\.css';/gm)].map(
      (m) => m[1],
    );
    expect(imports).toEqual(['latin-400']);
  });

  it('the latin subset it loads covers all of Basic Latin, so no heading letter falls back', () => {
    const css = createRequire(import.meta.url).resolve('@fontsource/pixelify-sans/latin-400.css');
    const face = readFileSync(css, 'utf8');
    // No unicode-range that would send part of Basic Latin to another face.
    expect(face).not.toMatch(/unicode-range/);
    const woff = /url\(\.\/(files\/[\w-]+\.woff)\)/.exec(face)?.[1];
    expect(woff).toBeTruthy();
    const points = woffCodePoints(join(dirname(css), woff as string));
    const missing: string[] = [];
    for (let c = 0x20; c <= 0x7e; c++) if (!points.has(c)) missing.push(String.fromCharCode(c));
    expect(missing).toEqual([]);
  });

  it('the display weight is the master weight and weight synthesis is off', () => {
    const field = rulesOf(tokens).find((r) => r.selector === '[data-direction="field"]');
    expect(field?.body).toMatch(/--display-weight:\s*400;/);
    const html = rulesOf(tokens).find((r) => r.selector === 'html');
    expect(html?.body).toMatch(/font-synthesis-weight:\s*none/);
  });

  it('finds a pixel heading shrunk by a rule that does not name the family', () => {
    const css =
      '.p { font-family: var(--font-display); font-size: var(--text-xl); } .m .p { font-size: 16px; }';
    expect(inheritedPixelViolations([css])).toHaveLength(1);
    const other = '.p { font-family: var(--font-display); } .q { font-size: 16px; }';
    expect(inheritedPixelViolations([other])).toEqual([]);
  });

  it('no stylesheet shrinks a pixel heading below 20 px', () => {
    expect(inheritedPixelViolations(files.map((f) => readFileSync(join(SRC, f), 'utf8')))).toEqual([]);
  });
});
