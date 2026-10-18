// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The CSS guard (M21 TR-15, DS-14, DS-15, DS-20) over every stylesheet in apps/activeon/src:
// - no font-size below 12 px outside `.legal`;
// - the pixel display face never below 16 px;
// - no letter-spacing on a pill;
// - the atoms' interactive base selectors carry min-height: var(--tap-min).
// The design system's own CSS (src/design/**) must be clean now. The places' CSS predates the rules:
// BASELINE names today's violations per file, and it may only shrink. Each area clears its own files
// as it moves onto the atoms (a file that gets cleaner must lower its count here, so the list never
// hides a regression), and Integration checks the list is empty (FR-I3).
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
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
    expect(violations('.x { font: var(--weight-bold) var(--text-md) / 1 var(--font-display); }')).toEqual([]);
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
