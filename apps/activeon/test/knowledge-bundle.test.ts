// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The compiled Knowledge Base ships to the parse worker (M10 FR-26): it loads, the engine sees its
// version and its coverage(), and a broken bundle degrades to "no Knowledge Base", never a crash.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkChunk } from '../bundle-guards';
import { knowledgeBundle } from '../knowledge-bundle';
import { frontierOf, handleRequest, knowledgeOf, shippedKnowledge } from '../src/worker/handle-request';

const NOW = Date.UTC(2026, 9, 17, 12);
const save = readFileSync(
  fileURLToPath(new URL('../../../fixtures/scrubbed/scrubbed-w2.json', import.meta.url)),
  'utf8',
);
const call = {
  expectedReturnSeconds: 8 * 3600,
  sessionStartedAt: null,
  learnedExpectedReturnSeconds: null,
  knowledgeVersion: 'buildinfo',
};

const w3 = readFileSync(
  fileURLToPath(new URL('../../../fixtures/scrubbed/scrubbed-w3.json', import.meta.url)),
  'utf8',
);

describe('the frontier step in the parse worker (M2 TR-2)', () => {
  it('computes the frontier with Toolbox kill rates for the current save', () => {
    const res = handleRequest({ type: 'parse', id: 2, now: NOW, input: { kind: 'text', text: w3 } });
    if (!res.ok) throw new Error(res.message);
    const f = res.state.account.frontier;
    expect([f?.mapName, f?.kind]).toEqual(['Thermonuclear_Climb', 'uncleared']);
    expect(Math.max(...(f?.fights ?? []).map((x) => x.finalKillsPerHour))).toBe(1065);
  });

  it('is null without a Knowledge Base', () => {
    const res = handleRequest({ type: 'parse', id: 3, now: NOW, input: { kind: 'text', text: w3 } });
    if (!res.ok) throw new Error(res.message);
    expect(frontierOf({ ...res.state, account: {}, characters: [] } as never, { data: {} }, null)).toBeNull();
  });
});

describe('the shipped Knowledge Base', () => {
  it('loads, with the Meta Path entries and fact tables', () => {
    const { kb, error } = shippedKnowledge();
    expect(error).toBeNull();
    expect(kb?.entries['metapath.metapath.stages']).toBeDefined();
    expect(kb?.facts['portals.fact.world-routes']).toBeDefined();
  });

  it('feeds the engine its version and coverage()', () => {
    const res = handleRequest({
      type: 'parse',
      id: 1,
      now: NOW,
      input: { kind: 'text', text: save },
      engine: call,
    });
    if (!res.ok || !res.result || 'error' in res.result) throw new Error('no engine result');
    expect(res.result.versions.knowledge).toBe(shippedKnowledge().kb?.version.display);
    const gaps = res.result.notCovered.map((n) => n.systemId);
    expect(gaps).toContain('owl');
    expect(gaps).not.toContain('metapath');
  });

  it('without a bundle the engine still runs, on the BuildInfo version with no coverage', () => {
    const port = knowledgeOf(call, null);
    expect([port.version, port.kb]).toEqual(['buildinfo', null]);
  });

  it('the plugin serves the bundle text; a UI chunk that bundles it fails the build', async () => {
    const plugin = knowledgeBundle(() => '{"x":1}');
    const id = (plugin.resolveId as (s: string) => string | null)('virtual:activeon-knowledge');
    const code = (plugin.load as (s: string) => string | null)(id as string);
    expect(code).toBe(`export default ${JSON.stringify('{"x":1}')};`);
    const problems = checkChunk({
      fileName: 'assets/index-x.js',
      code: '',
      modules: { '\0virtual:activeon-knowledge': { renderedExports: ['default'] } },
    });
    expect(problems.join()).toMatch(/Knowledge Base/);
  });
});
