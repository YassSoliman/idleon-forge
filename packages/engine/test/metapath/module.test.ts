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
const run = (file: string, withKb = true, rates = false) =>
  runEngine({
    state: stateOf(file, rates ? { rates: 'toolbox' } : {}),
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

  it('S3: the push Goal reads "Kill 14,981 more on Thermonuclear Climb to open the next portal"', () => {
    const r = run(scrubbed('scrubbed-w3'), true, true);
    const squire = r.characters.find((c) => c.classId === 'Squire' && c.level === 85);
    const push = squire?.goals.find((g) => g.id === 'metapath.goal.push');
    expect(push?.title).toBe('Push World 3');
    expect(push?.nextAction.text).toBe('Kill 14,981 more on Thermonuclear Climb to open the next portal');
    expect(push?.milestone).toMatchObject({ current: 19, next: 15000 });
    const tutorial = squire?.goals.find((g) => g.id === 'metapath.goal.world-tutorial-w3');
    expect(tutorial?.nextAction.text).toBe('Finish Hoggindaz 1 (Turn ON for what???)');
  });

  it("S3: on W2-late, Open World 3: finish Djonnut's quest 2 on the Barbarian 60", () => {
    const r = run(scrubbed('scrubbed-w2'), true, true);
    const barb = r.characters.find((c) => c.classId === 'Barbarian');
    const push = barb?.goals.find((g) => g.id === 'metapath.goal.push');
    expect([push?.title, push?.nextAction.text]).toEqual(['Open World 3', "Finish Djonnut's quest 2"]);
  });

  it('S4: with family level 300 the account gets Make a Hunter', () => {
    const state = stateOf(scrubbed('scrubbed-w2'));
    const r = runEngine({
      state: { ...state, account: { ...state.account, accountLevel: 300 } },
      history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
      knowledge: { version: 'test', coverage: () => [], kb },
      now: NOW,
      options: { expectedReturnSeconds: 8 * 3600 },
    });
    expect(r.account.goals.map((g) => g.nextAction.text)).toContain(
      'Make a Hunter: pick Archer at level 10, then Hunter at Speccius',
    );
  });

  it('beyond coverage adds a Worlds 5–7 gap', () => {
    const r = run(`${PUBLIC}highend.json`);
    expect(r.stage.id).toBe('W4-late');
    expect(r.notCovered.map((n) => n.systemId)).toContain('worlds-5-7');
  });

  it('without a Knowledge Base the Stage stays not covered and nothing fails', () => {
    const r = run(scrubbed('scrubbed-w2'), false);
    expect(r.stage.id).toBe('not-covered');
    expect(r.diagnostics.failedDetectors).toEqual([]);
  });
});
