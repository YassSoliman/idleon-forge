// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The jitter guard. The shell (the header, the place navigation and the content column) has one width
// per breakpoint in every place, so it never moves when the player switches places, tabs or characters.
// jsdom has no layout, so this guards the CSS that caused the jitter: a shell width keyed on a place's
// content (`.app:has(.places):has(.n-now)` and friends widened some places to 980 px and left the
// Characters place and the Timeline at 480 px, and a place's loading frame narrow). The pixel check in a
// real browser is scripts/layout/jitter.mjs (header, nav and column bounding boxes across every place).
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.css') ? [join(dir, d.name)] : [],
  );

interface Rule {
  file: string;
  selector: string;
  body: string;
}
const rules: Rule[] = walk(SRC).flatMap((file) =>
  [
    ...readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(/([^{}]+)\{([^{}]*)\}/g),
  ].map((m) => ({ file: relative(SRC, file), selector: (m[1] ?? '').trim(), body: m[2] ?? '' })),
);

const sets = (body: string, prop: string) => new RegExp(`(?:^|;)\\s*${prop}\\s*:`).test(body);
/** The selectors in a rule that select the shell root (`.app`, `main.app`, `.app:has(...)`). */
const shellSelectors = (r: Rule) =>
  r.selector
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /(^|[\s>])(?:main)?\.app(?![\w-])/.test(s) && !/\.app(?![\w-])[^,]*\s+\S/.test(s));

describe('the shell width (layout jitter)', () => {
  it('never keys the shell width on a place, a tab or a page', () => {
    const keyed = rules.flatMap((r) =>
      sets(r.body, '(?:max-)?width') || sets(r.body, 'padding(?:-left|-right)?')
        ? shellSelectors(r)
            .filter((s) => (s.match(/:has\(/g) ?? []).length > (s.includes(':has(.places)') ? 1 : 0))
            .map((s) => `${r.file}: ${s}`)
        : [],
    );
    expect(keyed).toEqual([]);
  });

  it('sets one wide shell width, for every place, from 1000 px', () => {
    const shell = readFileSync(join(SRC, 'shell/shell.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const wide = /@media \(min-width: 1000px\)\s*\{\s*\.app:has\(\.places\)\s*\{([^}]*)\}/.exec(shell);
    expect(wide?.[1]).toMatch(/max-width:\s*min\(calc\(980px \+ 128px\), 100%\)/);
  });

  it('keeps the scrollbar gutter, so a short place and a tall one have the same width', () => {
    const root = rules.filter((r) => r.selector.split(',').some((s) => s.trim() === 'html'));
    expect(root.some((r) => /scrollbar-gutter\s*:\s*stable/.test(r.body))).toBe(true);
  });
});
