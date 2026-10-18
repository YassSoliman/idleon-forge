// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The generic Detector suite (M11 TR-5, FR-11 to FR-13, US-10): every registered Detector's examples
// on real fixtures, plus the harness's own guarantees on deliberately broken Detectors.
import { type AnyDetector, defineDetector, withCharacter } from '@idleon-forge/knowledge';
import { detectors as globbed } from '@idleon-forge/knowledge/detectors';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { discoverDetectors } from '../src/discover';
import { fixtureById, stateOf } from '../src/fixtures';
import { covered, declarationProblems, hollow, recording, runHarness } from '../src/harness';

const regs = await discoverDetectors();

describe('the registry', () => {
  it('discovers the same Detectors on disk as the bundler does (import.meta.glob)', () => {
    expect(Object.keys(regs.knowledge).sort()).toEqual(Object.keys(globbed).sort());
  });
});

describe.each(Object.keys(regs.knowledge))('Detector %s', (id) => {
  it('passes every declared example (fires, silent, unknown), deterministically and purely', () => {
    const results = runHarness({ [id]: regs.knowledge[id] as AnyDetector }, { kb: null });
    const failed = results.filter((r) => r.status === 'fail');
    expect(failed).toEqual([]);
    for (const r of results.filter((x) => x.status === 'skipped'))
      console.log(`skipped: ${r.detector} ${r.example}`);
  });
});

const none = z.strictObject({});
const base = {
  kind: 'check' as const,
  system: 'test',
  params: none,
  slots: none,
  reads: ['characters[*].afkType', 'characters[*].index'] as const,
};

describe('the harness catches what the rules forbid', () => {
  it('needs a silent example (US-10)', () => {
    const d = defineDetector({
      ...base,
      id: 'test/no-silent',
      examples: { fires: [{ fixture: 'scrubbed-w2' }], silent: [] },
      run: () => [],
    });
    expect(declarationProblems(d)).toContain('detector test/no-silent: needs at least one silent example');
  });

  it('needs at least one example on a real save, not only mutations', () => {
    const d = defineDetector({
      ...base,
      id: 'test/only-mutations',
      examples: {
        fires: [{ fixture: 'highend', mutate: (s) => s }],
        silent: [{ fixture: 'highend', mutate: (s) => s }],
      },
      run: () => [],
    });
    expect(declarationProblems(d).join()).toMatch(/must be a real save/);
  });

  it('fails a Detector that reads the clock, Math.random or an undeclared path (FR-12)', () => {
    const clock = defineDetector({
      ...base,
      id: 'test/clock',
      examples: { fires: [], silent: [{ fixture: 'highend' }] },
      run: () => (Date.now() > 0 ? [] : []),
    });
    const sneaky = defineDetector({
      ...base,
      id: 'test/sneaky',
      examples: { fires: [], silent: [{ fixture: 'highend' }] },
      run: ({ state }) => (state.characters.some((c) => c.level > 9999) ? [] : []),
    });
    const r = runHarness({ 'test/clock': clock, 'test/sneaky': sneaky }, { kb: null });
    expect(r.find((x) => x.detector === 'test/clock' && x.example.startsWith('silent'))?.message).toMatch(
      /must not use Date/,
    );
    expect(r.find((x) => x.detector === 'test/sneaky' && x.example.startsWith('silent'))?.message).toMatch(
      /reads undeclared paths: characters\[\*\]\.level/,
    );
  });

  it('fails a Detector that fires when every optional field is removed (defensive by default)', () => {
    const naive = defineDetector({
      ...base,
      id: 'test/naive',
      examples: {
        fires: [{ fixture: 'highend', mutate: (s) => withCharacter(s, 0, { afkType: null }) }],
        silent: [{ fixture: 'highend' }],
      },
      run: ({ state }) =>
        state.characters
          .filter((c) => c.afkType === null)
          .map((c) => ({
            subject: { kind: 'character' as const, index: c.index },
            result: 'fires' as const,
            slots: {},
          })),
    });
    const r = runHarness({ 'test/naive': naive }, { kb: null });
    expect(r.some((x) => x.status === 'fail' && /every optional field removed/.test(x.message ?? ''))).toBe(
      true,
    );
  });

  it('fails an example naming a missing fixture, and skips absent private ones', () => {
    const d = defineDetector({
      ...base,
      id: 'test/missing',
      examples: { fires: [{ fixture: 'nope' }], silent: [{ fixture: 'private:not-here' }] },
      run: () => [],
    });
    const r = runHarness({ 'test/missing': d }, { kb: null });
    expect(r.find((x) => x.example.startsWith('fires'))?.message).toBe('names a missing fixture nope');
    expect(r.find((x) => x.example.startsWith('silent'))?.status).toBe('skipped');
  });
});

describe('performance (TR-17)', () => {
  // The 50 ms p95 budget holds on CI's runner. Locally the suite runs every package in parallel, so the
  // same loop can take 70-80 ms under that load (R3 QA P3-6): warm up first, and outside CI allow 3x.
  const budgetMs = process.env.CI ? 50 : 150;
  it(`runs every Detector on highend within ${budgetMs} ms p95 (per Detector over 5 ms is reported only)`, async () => {
    const { makeContext, runDetector } = await import('@idleon-forge/knowledge');
    const f = fixtureById('highend');
    if (!f) throw new Error('highend fixture missing');
    const ctx = makeContext(stateOf(f), null, { now: f.now });
    const all = Object.values(regs.knowledge);
    const params = (d: AnyDetector) => d.examples.fires[0]?.params ?? d.examples.silent[0]?.params ?? {};
    // Warm-up: JIT and lazily built fact indexes are not what the budget measures.
    for (let i = 0; i < 5; i++) for (const d of all) runDetector(d, ctx, params(d));
    const times: number[] = [];
    for (let i = 0; i < 40; i++) {
      const t = performance.now();
      for (const d of all) runDetector(d, ctx, params(d));
      times.push(performance.now() - t);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.95)]).toBeLessThan(budgetMs);
    for (const d of all) {
      const t = performance.now();
      runDetector(d, ctx, params(d));
      const ms = performance.now() - t;
      if (ms > 5) console.warn(`Detector ${d.id} took ${ms.toFixed(1)} ms on highend (budget 5 ms)`);
    }
  });
});

describe('harness helpers', () => {
  it('records the paths a Detector reads, with [*] for array items', () => {
    const seen = new Set<string>();
    const s = recording({ characters: [{ afkType: 'FIGHTING', index: 0 }] }, seen);
    void s.characters.map((c) => c.afkType);
    expect([...seen]).toEqual(
      expect.arrayContaining(['characters', 'characters[*]', 'characters[*].afkType']),
    );
    expect(covered('characters[*].afkType', ['characters[*].afkType'])).toBe(true);
    expect(covered('characters', ['characters[*].afkType'])).toBe(true);
    expect(covered('characters[*].level', ['characters[*].afkType'])).toBe(false);
  });

  it('hollows a real state: every optional field null or empty, and reported unknown', () => {
    const f = fixtureById('highend');
    if (!f) throw new Error('highend fixture missing');
    const h = hollow(stateOf(f));
    expect(h.characters.every((c) => c.afkType === null && c.foodStacks.length === 0)).toBe(true);
    expect(h.account.currentWorld).toBeNull();
    expect(h.diagnostics.unknownFields).toContain('account.currentWorld');
  });
});
