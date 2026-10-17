// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Golden snapshots (M11 TR-15, FR-26, FR-27, US-5, US-8, US-9). `kb golden` runs here in `pnpm test`:
// a committed golden that differs from the rendered one fails CI.
import { existsSync, readFileSync } from 'node:fs';
import { DEFAULT_EXPECTED_RETURN_MS, defineDetector, entryReportFields } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { listFixtures, stateOf } from '../src/fixtures';
import {
  findingRows,
  GoldenSlotError,
  goldenContext,
  goldenFile,
  lineDiff,
  renderFixture,
  STUB_ENGINE,
  subjectLabel,
  verdictLines,
} from '../src/golden';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });

describe.each(fixtures.map((f) => [f.id, f] as const))('golden %s', (_id, f) => {
  it('matches the committed file (run pnpm kb golden -u after a reviewed change)', () => {
    const file = goldenFile(f);
    expect(existsSync(file)).toBe(true);
    const committed = readFileSync(file, 'utf8');
    const rendered = renderFixture(f, ctx);
    expect(lineDiff(committed, rendered)).toEqual([]);
  });

  it('is deterministic and never shows the date version', () => {
    const a = renderFixture(f, ctx);
    expect(renderFixture(f, ctx)).toBe(a);
    const header = a.split('\n')[0] as string;
    expect(header).toMatch(
      /^# golden v1: \S+ · knowledge #[0-9a-f]{8} · parser [0-9a-f]{7} \(game \d+\.\d+\.\d+\) · now \S+ · return 8h · stage /,
    );
    expect(header).not.toMatch(/knowledge \d{4}\.\d{2}\.\d{2}/);
    expect(a).toContain('## Verdict changes\n\n## Now');
  });
});

describe('golden content', () => {
  const w2 = fixtures.find((f) => f.id === 'scrubbed-w2');

  it('lists unlocked W2 Systems with no entries under Not covered yet, not locked W3 ones (US-5, CI variant)', () => {
    if (!w2) throw new Error('scrubbed-w2 missing');
    const text = renderFixture(w2, ctx);
    const section = text.split('## Not covered yet\n')[1]?.split('\n\n')[0] ?? '';
    expect(section.split('\n')).toEqual(expect.arrayContaining(['Alchemy Pay 2 Win', 'Islands']));
    expect(section).not.toContain('Death Note');
    expect(section).not.toContain('Trapping');
  });

  it('labels characters C1…Cn in save order, never by name', () => {
    if (!w2) throw new Error('scrubbed-w2 missing');
    const state = stateOf(w2);
    const second = state.characters[1];
    expect(second && subjectLabel(state, { kind: 'character', index: second.index })).toBe('C2');
    expect(renderFixture(w2, ctx)).not.toMatch(/Char\d/);
  });

  it('fails a Detector that passes a free string from the save into a slot (FR-27 slot check)', () => {
    if (!w2) throw new Error('scrubbed-w2 missing');
    const leaky = defineDetector({
      id: 'test/leaky',
      kind: 'check',
      system: 'test',
      params: z.strictObject({}),
      slots: z.strictObject({ who: z.string() }),
      reads: ['characters[*].name'],
      examples: { fires: [], silent: [] },
      run: ({ state }) =>
        state.characters.map((c) => ({
          subject: { kind: 'character' as const, index: c.index },
          result: 'fires' as const,
          slots: { who: `Player_${c.name}` },
        })),
    });
    const kb = {
      ...ctx.kb,
      entries: {
        'test.check.leaky': {
          id: 'test.check.leaky',
          type: 'check',
          detector: { id: 'test/leaky', params: {} },
        } as never,
      },
    };
    expect(() =>
      findingRows(
        {
          state: stateOf(w2),
          kb,
          registries: { knowledge: { 'test/leaky': leaky }, engine: {} },
          now: w2.now,
          expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
        },
        ctx.lookupSet,
      ),
    ).toThrow(GoldenSlotError);
  });

  it('reads Verdict lines from the Now section, for the PR job summary (US-9)', () => {
    const before = '## Now\n### C4 · Shaman 44 · Ready\n### C1 · Blood_Berserker 60 · Ready\n';
    const after = '## Now\n### C4 · Shaman 44 · Fix before you leave\n### C1 · Blood_Berserker 60 · Ready\n';
    const a = verdictLines(before);
    const b = verdictLines(after);
    expect([...a.keys()].filter((k) => a.get(k) !== b.get(k))).toEqual(['C4']);
  });

  it('uses the M10 engine (packages/engine/src/golden.ts) now that it ships renderNowText', () => {
    expect(STUB_ENGINE.renderNow({} as never)).toBe('(engine not built)');
    expect(ctx.engine).not.toBe(STUB_ENGINE);
  });
});

describe('Report this leaks nothing (US-8)', () => {
  it('returns exactly the five keys, and no value matches any charNames entry of scrubbed-w2', () => {
    const w2 = fixtures.find((f) => f.id === 'scrubbed-w2');
    if (!w2) throw new Error('scrubbed-w2 missing');
    const raw = JSON.parse(readFileSync(w2.file, 'utf8')) as { charNames: string[] };
    const anyEntry = Object.keys(ctx.kb.entries)[0] ?? 'worlds.check.none';
    const out = entryReportFields({ entryIds: [anyEntry, ...raw.charNames] }, ctx.kb);
    expect(Object.keys(out).sort()).toEqual(['contested', 'detectorIds', 'entryIds', 'fieldPaths', 'stale']);
    const values = JSON.stringify(out);
    for (const n of raw.charNames) expect(values.includes(`"${n}"`)).toBe(false);
  });
});
