// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2 in the engine core: the Stage, the Priority List and the Visit Order hints reach EngineResult.
import type { CompiledKnowledge } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { runEngine } from '../../src';
import { buildNowView, DEFAULT_UI } from '../../src/now/build-now-view';
import { EMPTY_PREFS } from '../../src/now/prefs';
import { loadKb, NOW, PUBLIC, scrubbed, stateOf } from './helpers';

const kb = loadKb() as unknown as CompiledKnowledge;
const run = (file: string, withKb = true) =>
  runEngine({
    state: stateOf(file),
    history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
    knowledge: { version: 'test', coverage: () => [], kb: withKb ? kb : null },
    now: NOW,
    options: { expectedReturnSeconds: 8 * 3600 },
  });

describe('the meta-path module in the engine core', () => {
  it('emits the Stage label and what the next Stage needs', () => {
    const r = run(scrubbed('scrubbed-w3'));
    expect([r.stage.id, r.stage.label]).toEqual(['W3-early', 'World 3, early']);
    const v = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: NOW });
    expect(v).toBeDefined();
    expect(r.stage.needs).toEqual(['Build the Death Note to level 1', 'Finish Hoggindaz 5 on any character']);
  });

  it('applies the pool-after hint: the Worship Wizard visits after the characters it pools from', () => {
    const r = run(scrubbed('scrubbed-w3'));
    const wizard = r.characters.find((c) => c.classId === 'Wizard')?.index;
    expect(r.visitOrder[r.visitOrder.length - 1]).toBe(wizard);
  });

  it('beyond coverage adds a Worlds 5–7 gap', () => {
    const r = run(`${PUBLIC}highend.json`);
    expect(r.stage.id).toBe('W4-entry');
    expect(r.notCovered.map((n) => n.systemId)).toContain('worlds-5-7');
  });

  it('without a Knowledge Base the Stage stays not covered and nothing fails', () => {
    const r = run(scrubbed('scrubbed-w2'), false);
    expect(r.stage.id).toBe('not-covered');
    expect(r.diagnostics.failedDetectors).toEqual([]);
  });
});
