// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-4: the Rift is stored as Rift[0] and shown as Rift[0] + 1, through riftLabel() only.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { riftLabel, riftText } from '../../src';

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));

describe('riftLabel (M26 FR-4)', () => {
  it('shows one more than the stored level, at each bonus the spec names', () => {
    expect([5, 15, 25, 35, 40, 45].map(riftText)).toEqual([
      'Rift 6',
      'Rift 16',
      'Rift 26',
      'Rift 36',
      'Rift 41',
      'Rift 46',
    ]);
    expect(riftLabel(0)).toBe(1);
  });

  it('no source file prints a Rift number except through riftLabel()', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = path.join(dir, f);
        if (statSync(p).isDirectory()) {
          if (f !== 'node_modules' && f !== 'generated' && f !== 'dist') walk(p);
        } else if (/\.(ts|tsx)$/.test(f)) files.push(p);
      }
    };
    for (const d of [
      'packages/engine/src',
      'packages/knowledge/src',
      'packages/knowledge/detectors',
      'apps/activeon/src',
    ])
      walk(path.join(REPO, d));
    const bad: string[] = [];
    for (const f of files) {
      if (f.endsWith(path.join('world4', 'rift-label.ts'))) continue;
      readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/^\s*(\/\/|\*)/.test(line)) return;
          if (/['"`][^'"`]*\bRift\s+(\d|\$\{(?!riftLabel\())/.test(line))
            bad.push(`${path.relative(REPO, f)}:${i + 1}`);
        });
    }
    expect(bad).toEqual([]);
  });
});
