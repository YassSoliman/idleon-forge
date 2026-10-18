// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The packed bundle codec (pack.ts, M11 TR-17): lossless, deterministic, and fail-closed.
import { describe, expect, it } from 'vitest';
import {
  canonicalJson,
  KnowledgeUnavailableError,
  loadKnowledge,
  packKnowledge,
  unpackKnowledge,
} from '../src';

const SOURCE = {
  tier: 2,
  title: 'IdleOn Wiki: Alchemy, brewing',
  url: 'https://idleon.wiki/wiki/Alchemy#Brewing',
  verified: '2026-10-17',
};
const entry = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: 'check',
  system: 'alchemy',
  title: 'A repeated title',
  detector: { id: 'alchemy/slots', params: { min: 0, ratio: 0.5 } },
  sources: [SOURCE, { ...SOURCE, tier: 1, url: `https://example.org/${id}` }],
  ...extra,
});
const kb = () => ({
  version: { contentHash: 'abcd1234', display: 'knowledge 0000.00.00' },
  entries: {
    'alchemy.check.b': entry('alchemy.check.b', { notes: 'authoring only', values: { 10: 'ten', 2: 'two' } }),
    'alchemy.check.a': entry('alchemy.check.a', {
      values: { tricky: [0, 1, 2, [3, 'x'], {}, [], null, true, false, -0.25, 'é ✓ "quoted" \\'] },
    }),
    'alchemy.goal.c': {
      id: 'alchemy.goal.c',
      type: 'goal',
      system: 'alchemy',
      progress: { id: 'alchemy/level' },
      milestones: [],
      skip: undefined,
    },
  },
  facts: { 'alchemy.fact.t': { id: 'alchemy.fact.t', rows: { b: [1, 2], a: { x: 'A repeated title' } } } },
  byType: { stale: 'rebuilt by the loader' },
  detectorOf: { stale: ['rebuilt by the loader'] },
  lists: {},
  stale: [],
  builtFrom: { parserCommit: 'x', gameVersion: '2.3.540', toolboxVersion: '1' },
  patches: [],
  systems: [],
  priorityByStage: {},
  manifest: { 'alchemy.check.a': 'abcd1234' },
  retired: {},
  readsOf: {},
});

const expected = () => {
  const k = kb();
  const entries = Object.fromEntries(
    Object.entries(k.entries).map(([id, e]) => [id, { ...e, notes: undefined }]),
  );
  return { ...k, entries };
};

describe('packKnowledge / unpackKnowledge', () => {
  it('round-trips every field exactly, minus the authors notes', () => {
    const out = unpackKnowledge(JSON.parse(canonicalJson(packKnowledge(kb()))));
    const { byType, detectorOf, ...rest } = out;
    const { byType: _b, detectorOf: _d, ...want } = expected();
    expect(canonicalJson(rest)).toBe(canonicalJson(want));
    expect((out.entries as Record<string, { notes?: string }>)['alchemy.check.b']?.notes).toBeUndefined();
    // Integer-like keys come back in JavaScript's own order, as JSON.parse would give them.
    const values = (out.entries as Record<string, { values: object }>)['alchemy.check.b']?.values;
    expect(Object.keys(values ?? {})).toEqual(['2', '10']);
    // The indexes are rebuilt from the entries, not shipped.
    expect(byType).toMatchObject({ check: ['alchemy.check.a', 'alchemy.check.b'], goal: ['alchemy.goal.c'] });
    expect(detectorOf).toEqual({
      'alchemy.check.a': ['alchemy/slots'],
      'alchemy.check.b': ['alchemy/slots'],
      'alchemy.goal.c': ['alchemy/level'],
    });
  });

  it('stores repeated strings and subtrees once', () => {
    const p = packKnowledge(kb());
    expect(p.strings.filter((s) => s === 'A repeated title')).toHaveLength(1);
    expect(p.trees.length).toBeGreaterThan(0);
    expect(JSON.stringify(p).split('idleon.wiki/wiki/Alchemy').length - 1).toBe(1);
  });

  it('gives no two entries one shared object', () => {
    const out = unpackKnowledge(JSON.parse(JSON.stringify(packKnowledge(kb())))) as {
      entries: Record<string, { sources: object[]; detector: object }>;
    };
    const a = out.entries['alchemy.check.a'];
    const b = out.entries['alchemy.check.b'];
    expect(a?.detector).toEqual(b?.detector);
    expect(a?.detector).not.toBe(b?.detector);
    expect(a?.sources[0]).not.toBe(b?.sources[0]);
  });

  it('is deterministic whatever order the keys were built in', () => {
    const k = kb();
    const reversed = { ...k, entries: Object.fromEntries(Object.entries(k.entries).reverse()) };
    expect(canonicalJson(packKnowledge(reversed))).toBe(canonicalJson(packKnowledge(kb())));
  });

  it('passes a bundle that is not packed through unchanged', () => {
    const plain = { entries: {}, version: { contentHash: 'x', display: 'y' } };
    expect(unpackKnowledge(plain)).toBe(plain);
  });

  it('loads through loadKnowledge, and a corrupt packed bundle is KnowledgeUnavailableError', () => {
    const p = packKnowledge(kb());
    expect(loadKnowledge(JSON.stringify(p)).version.display).toBe('knowledge 0000.00.00');
    const corrupt = JSON.parse(JSON.stringify(p));
    corrupt.strings = [];
    corrupt.trees = [];
    expect(() => loadKnowledge(corrupt)).toThrow(KnowledgeUnavailableError);
    expect(() => loadKnowledge({ ...p, shapes: [] })).toThrow(KnowledgeUnavailableError);
  });
});
