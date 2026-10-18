// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// WCAG contrast for the design tokens (M21 TR-15, M10 TR-14): every text pair at 4.5:1 and the non-text
// pairs (rules, bars, rings, the focus ring) at 3:1, in all three directions x light and dark. Also
// checks that each direction's two dark copies (the Dark choice and the System media query) agree, and
// that every direction defines every semantic colour token.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('../src/design/tokens.css', import.meta.url)), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

interface Rule {
  selectors: string[];
  media: string | null;
  decls: Record<string, string>;
}

/** Flat rules with their enclosing @media (one level, which is all tokens.css uses). */
function parse(text: string): Rule[] {
  const rules: Rule[] = [];
  let i = 0;
  const readBlock = (from: number): [string, number] => {
    let depth = 0;
    for (let j = from; j < text.length; j++) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') {
        depth--;
        if (depth === 0) return [text.slice(from + 1, j), j + 1];
      }
    }
    throw new Error('unbalanced braces in tokens.css');
  };
  const pushRule = (prelude: string, body: string, media: string | null) => {
    const decls: Record<string, string> = {};
    for (const m of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g))
      decls[m[1] as string] = (m[2] as string).trim();
    rules.push({ selectors: prelude.split(',').map((s) => s.trim().replace(/\s+/g, ' ')), media, decls });
  };
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open < 0) break;
    const prelude = text.slice(i, open).trim();
    const [body, next] = readBlock(open);
    if (prelude.startsWith('@media')) {
      let k = 0;
      while (k < body.length) {
        const o = body.indexOf('{', k);
        if (o < 0) break;
        const close = body.indexOf('}', o);
        pushRule(body.slice(k, o).trim(), body.slice(o + 1, close), prelude);
        k = close + 1;
      }
    } else pushRule(prelude, body, null);
    i = next;
  }
  return rules;
}

const rules = parse(css);
const DIRECTIONS = ['field', 'quest', 'board'] as const;
const DARK_MEDIA = '@media (prefers-color-scheme: dark)';

const block = (pred: (r: Rule) => boolean): Record<string, string> => {
  const found = rules.filter(pred);
  if (found.length !== 1) throw new Error(`expected one matching rule, found ${found.length}`);
  return (found[0] as Rule).decls;
};
const root = block((r) => r.media === null && r.selectors.length === 1 && r.selectors[0] === ':root');

/** A direction's light scope: every top-level rule on exactly `[data-direction="d"]` (board has two). */
const lightOf = (d: string): Record<string, string> =>
  Object.assign(
    {},
    ...rules
      .filter(
        (r) => r.media === null && r.selectors.length === 1 && r.selectors[0] === `[data-direction="${d}"]`,
      )
      .map((r) => r.decls),
  );
const darkChoiceOf = (d: string) =>
  block((r) => r.media === null && r.selectors.includes(`:root[data-theme="dark"][data-direction="${d}"]`));
const darkSystemOf = (d: string) =>
  block(
    (r) =>
      r.media === DARK_MEDIA &&
      r.selectors.includes(`:root:not([data-theme="light"])[data-direction="${d}"]`),
  );

/** A token's hex, following var() chains through the scope and then :root. */
function hex(name: string, scope: Record<string, string>): string {
  let v = scope[name] ?? root[name];
  for (let hops = 0; v?.startsWith('var(') && hops < 8; hops++) {
    const ref = /var\(--([\w-]+)/.exec(v)?.[1] ?? '';
    v = scope[ref] ?? root[ref];
  }
  if (!v || !/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v)) throw new Error(`--${name} is not a hex colour (${v})`);
  return v.length === 4 ? `#${[...v.slice(1)].map((c) => c + c).join('')}` : v.toLowerCase();
}

const luminance = (h: string) => {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const v = Number.parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const SURFACES = ['bg', 'surface', 'sunk'] as const;
const STATUS = ['accent', 'ok', 'warn', 'bad', 'unk', 'info'] as const;

/** Text pairs (4.5:1): fg and muted on every surface; each status on every surface and its own -soft;
 *  each filled button's on- colour on its fill; the speech box. */
const TEXT_PAIRS: [string, string][] = [
  ...SURFACES.flatMap((s) => [['fg', s] as [string, string], ['muted', s] as [string, string]]),
  ...STATUS.flatMap((c) => [
    ...SURFACES.map((s) => [c, s] as [string, string]),
    [c, `${c}-soft`] as [string, string],
  ]),
  ...['accent', 'ok', 'warn', 'bad', 'unk', 'info'].map((c) => [`on-${c}`, c] as [string, string]),
  ['speech-fg', 'speech'],
  ['muted', 'unk-soft'],
];

/** The cauldron colours (owner addition): each base is a non-text fill on the page, 3:1. */
const CAULDRONS = ['power', 'quicc', 'highiq', 'kazam'] as const;

/** Non-text pairs (3:1): control borders, the focus ring, the Timeline's lines, against the page. */
const NON_TEXT_PAIRS: [string, string][] = [
  ...['line-strong', 'focus', 'now-line', 'return-line', ...CAULDRONS.map((c) => `cauldron-${c}-3`)].flatMap(
    (c) => (['bg', 'surface'] as const).map((s) => [c, s] as [string, string]),
  ),
];

const rootDark = block(
  (r) => r.media === null && r.selectors.length === 1 && r.selectors[0] === ':root[data-theme="dark"]',
);

const themes = DIRECTIONS.flatMap((d) => {
  const light = lightOf(d);
  return [
    [d, 'light', light],
    [d, 'dark', { ...rootDark, ...light, ...darkChoiceOf(d) }],
  ] as const;
});

describe('token sets', () => {
  it.each(DIRECTIONS)('%s: the Dark choice and the System dark media query carry the same values', (d) => {
    expect(darkSystemOf(d)).toEqual(darkChoiceOf(d));
  });

  it.each(DIRECTIONS)('%s defines every semantic colour token in light', (d) => {
    const light = lightOf(d);
    const needed = [
      'fg',
      'muted',
      'line',
      'line-strong',
      'focus',
      'speech',
      'speech-fg',
      ...SURFACES,
      ...STATUS,
    ];
    for (const c of STATUS) needed.push(`${c}-soft`, `on-${c}`);
    expect(needed.filter((n) => !(n in light))).toEqual([]);
  });

  it('world accents and cauldrons: the Dark choice and the System dark media query agree', () => {
    const choice = rootDark;
    const system = block(
      (r) => r.media === DARK_MEDIA && r.selectors[0] === ':root:not([data-theme="light"])',
    );
    expect(system).toEqual(choice);
  });
});

describe.each(themes)('%s %s', (_d, _mode, scope) => {
  it.each(TEXT_PAIRS)('text --%s on --%s passes 4.5:1', (fg, bg) => {
    expect(ratio(hex(fg, scope), hex(bg, scope))).toBeGreaterThanOrEqual(4.5);
  });
  it.each(NON_TEXT_PAIRS)('non-text --%s on --%s passes 3:1', (fg, bg) => {
    expect(ratio(hex(fg, scope), hex(bg, scope))).toBeGreaterThanOrEqual(3);
  });
});
