// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-F9, TR-15: the copy and data audit. DS-18: a step is about 12 words (the `kb check` cap, with
// its allowlist) and never more than 14, except at most the five longest the copy pass kept. The golden
// copy scan: no hidden-token placeholder, no jargon and no coin-tier currency in any committed golden.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Entry } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { stepWords, templatesOf } from '../src/copy';
import { loadSource } from '../src/load';
import { GOLDEN_DIR } from '../src/paths';

/**
 * DS-18's five named exceptions, the longest the copy pass kept (each is also in copy-allowlist.yaml):
 * three "If you have time" quest lines whose in-game task is the whole instruction (no why surface yet),
 * and the Stamps Goal's count summary, which is not an instruction.
 */
const OVER_14 = new Set([
  'stamps.check.activeplay-wellington-3#text',
  'stamps.check.activeplay-crystalswine-3#text',
  'stamps.check.activeplay-snouts-3#text',
  'stamps.check.activeplay-cattleprod-2#text',
  'stamps.goal.collect#text',
]);

describe('M21 DS-18: a step is at most 14 words', () => {
  const steps = loadSource()
    .authored.flatMap((e) => templatesOf(e.value as Entry))
    .filter((t) => t.step);
  const long = steps.filter((t) => stepWords(t.template) > 14).map((t) => t.key);
  const words = new Map(steps.map((t) => [t.key, stepWords(t.template)]));

  it('names at most five exceptions', () => {
    expect(OVER_14.size).toBeLessThanOrEqual(5);
  });

  it('has no other step over 14 words', () => {
    expect(long.filter((k) => !OVER_14.has(k)).map((k) => `${k} (${words.get(k)} words)`)).toEqual([]);
  });
});

/** TR-15 golden copy scan. Coin-tier names are fine as gear names ("Dementia Helmet"), never as money. */
const BANNED: { re: RegExp; why: string }[] = [
  { re: /place not given/i, why: 'an unknown place is hidden (DS-3)' },
  { re: /\bAny character\b/, why: '"Any character" is hidden (DS-3)' },
  { re: /\btier 2\b/i, why: 'jargon on a card face (DS-16)' },
  {
    re: /\b(?:copper|silver|gold|platinum|dementia|void|lustre)\s+coins?\b/i,
    why: 'one coin format (DS-16)',
  },
  // Not "copper": "36 Copper Ore" is an item. Silver, platinum and dementia coins have no ore of that name.
  {
    re: /\b\d[\d,]*\s+(?:silver|platinum|dementia)\b(?!\s+(?:Helmet|Body|Shins|Boots|Pickaxe|Dicer|Rod|Net))/i,
    why: 'a coin tier as currency (DS-16)',
  },
];

describe('M21 TR-15: the golden copy scan', () => {
  const files = readdirSync(GOLDEN_DIR).filter((f) => f.endsWith('.md'));
  it.each(files)('%s says nothing banned', (file) => {
    const text = readFileSync(path.join(GOLDEN_DIR, file), 'utf8');
    // The findings table carries raw slots and field paths (diagnostic, never shown to a player).
    const shown = text.split('\n## Findings')[0] ?? text;
    const hits = BANNED.flatMap(({ re, why }) => {
      const m = re.exec(shown);
      return m ? [`"${m[0]}": ${why}`] : [];
    });
    expect(hits).toEqual([]);
  });

  it('the patterns catch what they are for', () => {
    const hit = (s: string) => BANNED.some(({ re }) => re.test(s));
    expect(hit('Buy it for 10 silver coins')).toBe(true);
    expect(hit('costs 1 dementia 57 platinum')).toBe(true);
    expect(hit('Who: Any character')).toBe(true);
    expect(hit('Dementia: 0 of 7 parts: craft Dementia Helmet')).toBe(false);
    expect(hit('Reach level 30 on any character')).toBe(false);
    expect(hit('157M coins')).toBe(false);
  });
});
