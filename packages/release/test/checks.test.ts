// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The PR title check (FR-25, FR-29), the budgets (TR-12) and the Wrangler floor (TR-13).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUDGETS, checkBudgets } from '../src/budgets.ts';
import { checkPr } from '../src/pr-title.ts';

describe('PR title check', () => {
  it.each([
    'feat(sync): live sign-in',
    'fix: a bug',
    'feat(ui)!: drop the old screen',
    'spec(M12): rulings',
    'chore(parsers): sync Toolbox to abc1234 (game 2.3.541)',
    'ci(deps): bump actions/checkout',
  ])('accepts %s', (title) => {
    expect(checkPr(title, "What's-new: none").errors).toEqual([]);
  });

  it.each(['Update stuff', 'feature: x', 'feat:missing space', 'Feat: x', 'feat(): x'])(
    'rejects %s',
    (title) => {
      expect(checkPr(title, '').errors).toHaveLength(1);
    },
  );

  it("fails a What's-new line over 120 characters", () => {
    expect(checkPr('feat: x', `What's-new: ${'a'.repeat(121)}`).errors[0]).toContain('121');
  });

  it("counts a wrapped What's-new value as one sentence", () => {
    const body = `What's-new: ${'a'.repeat(70)}\n${'b'.repeat(60)}\n\nNotes`;
    expect(checkPr('feat: x', body).errors[0]).toContain('131');
  });

  it("warns, without failing, on a feat or fix with no What's-new line (D2)", () => {
    const r = checkPr('feat: cards', 'no line here');
    expect(r.errors).toEqual([]);
    expect(r.warnings).toHaveLength(1);
    expect(checkPr('chore: tidy', '').warnings).toEqual([]);
  });
});

describe('budgets', () => {
  const ok = [
    { path: 'index.html', size: 1000 },
    { path: 'version.json', size: 400 },
    { path: 'whats-new.json', size: 2000 },
    { path: 'assets/index-AbC123.js', size: 900_000, gzip: 265 * 1024 },
    { path: 'assets/parse.worker-XyZ.js', size: 6_300_000 },
  ];
  it('passes slice 1 sized output', () => {
    expect(checkBudgets(ok)).toEqual([]);
  });
  it('fails an oversized main chunk, worker, file, feed and file count', () => {
    const bad = [
      ...ok.map((f) =>
        f.path.startsWith('assets/index')
          ? { ...f, gzip: BUDGETS.mainChunkGzip + 1 }
          : f.path.includes('worker')
            ? { ...f, size: BUDGETS.workerChunkRaw + 1 }
            : f,
      ),
      { path: 'big.json', size: BUDGETS.anyFile + 1 },
    ];
    bad[2] = { path: 'whats-new.json', size: BUDGETS.whatsNew + 1 };
    expect(checkBudgets(bad)).toHaveLength(4);
    const many = Array.from({ length: BUDGETS.fileCount + 1 }, (_, i) => ({ path: `f${i}`, size: 1 }));
    expect(checkBudgets([...ok, ...many]).some((p) => p.includes('files'))).toBe(true);
  });
});

describe('Wrangler', () => {
  it('resolves to at least 4.136.3, the first version with wrangler preview (TR-13)', () => {
    const req = createRequire(join(import.meta.dirname, '../../../apps/activeon/package.json'));
    const pkg = JSON.parse(readFileSync(req.resolve('wrangler/package.json'), 'utf8')) as { version: string };
    const [a = 0, b = 0, c = 0] = pkg.version.split('.').map(Number);
    expect(a * 1e6 + b * 1e3 + c).toBeGreaterThanOrEqual(4 * 1e6 + 136 * 1e3 + 3);
  });
});
