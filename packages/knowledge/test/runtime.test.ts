// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The runtime surface (M11 TR-6, TR-7, TR-9, TR-11, TR-13, FR-19 to FR-24, FR-29): templates,
// staleness, coverage, versions, manifests, report fields, loadKnowledge and the Detector registry.
import { readFileSync } from 'node:fs';
import type { AccountState } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildRegistry, detectors } from '../detectors/index';
import {
  type CompiledKnowledge,
  coinTiers,
  coverage,
  defineDetector,
  diffManifests,
  type Entry,
  entryReportFields,
  formatAgo,
  formatCoins,
  formatCompact,
  formatDuration,
  formatIn,
  isStale,
  KnowledgeUnavailableError,
  knowledgeVersion,
  loadKnowledge,
  makeContext,
  patchIndex,
  playerVisible,
  render,
  runDetector,
  STAGES,
  type SystemDefT,
  stagesBetween,
  TemplateError,
} from '../src/index';
import { check, contribution, goal, tier1, tier3 } from './examples';

const patches = (
  JSON.parse(readFileSync(new URL('../generated/_patches.json', import.meta.url), 'utf8')) as {
    patches: string[];
  }
).patches;

describe('templates (TR-6)', () => {
  it('formats numbers, names and durations', () => {
    expect(render('{value:compact} of {next:int}', { value: 13021, next: 100000 })).toBe('13k of 100,000');
    expect(formatCompact(1500)).toBe('1.5k');
    expect(formatCompact(1_234_567)).toBe('1.2M');
    expect(render('{map:name}', { map: 'Poopy_Sewers' })).toBe('Poopy Sewers');
    expect(render('{p:pct}', { p: 12.4 })).toBe('12%');
    expect(formatDuration(35 * 60_000)).toBe('about 35m');
    expect(formatDuration(3 * 3_600_000 + 20 * 60_000)).toBe('about 3h');
    expect(formatDuration(150 * 3_600_000)).toBe('about 6d');
    expect(formatCoins(1_234_567)).toBe('1.2M coins');
    expect(formatCoins(157_000_000)).toBe('157M coins');
    expect(coinTiers(1_234_567)).toEqual([
      { q: 1, name: 'platinum' },
      { q: 23, name: 'gold' },
    ]);
  });

  // M21 FR-F6: one time language. A moment is "in 14h 04m", an age "8h 30m ago", effort "about 10m".
  it.each([
    ['{t:in}', 14 * 3_600_000 + 4 * 60_000, 'in 14h 04m'],
    ['{t:in}', 45 * 60_000, 'in 45m'],
    ['{t:in}', 50 * 3_600_000, 'in 2d 2h'],
    ['{t:in}', 0, 'now'],
    ['{t:in}', -5, 'now'],
    ['{t:ago}', 8 * 3_600_000 + 30 * 60_000, '8h 30m ago'],
    ['{t:ago}', 0, 'just now'],
    ['{t:duration}', 10 * 60_000, 'about 10m'],
  ])('%s of %d ms reads "%s"', (template, t, out) => {
    expect(render(template, { t })).toBe(out);
  });

  it('formatIn and formatAgo never print a non-finite time', () => {
    expect(formatIn(Number.NaN)).toBe('now');
    expect(formatAgo(Number.POSITIVE_INFINITY)).toBe('just now');
    expect(() => render('{t:in}', { t: 'soon' })).toThrow(/needs a number/);
  });

  it('resolves slots from the scopes in order: finding, built-ins, values, facts', () => {
    expect(render('{x}', { x: 'finding' }, { x: 'builtin' }, { x: 'value' })).toBe('finding');
    expect(render('{x}', undefined, { x: 'builtin' })).toBe('builtin');
  });

  it('throws on a missing slot, an unknown format or a type mismatch, so "{x}" never reaches a player', () => {
    expect(() => render('{missing}', {})).toThrow(TemplateError);
    expect(() => render('{x:bold}', { x: 1 })).toThrow(/unknown format/);
    expect(() => render('{x:name}', { x: 1 })).toThrow(/needs a string/);
  });

  it('renders a plain string with no markup', () => {
    expect(render('{a} & {b}', { a: 'x', b: 'y' })).toBe('x & y');
  });
});

describe('Stages (M2 owns the rules; M11 ships the ids)', () => {
  it('has the 10 Stage ids in order', () => {
    expect(STAGES).toHaveLength(10);
    expect(stagesBetween('W2-late', 'W3-mid')).toEqual(['W2-late', 'W3-early', 'W3-mid']);
  });
});

describe('staleness (FR-19, FR-20, TR-11, US-2)', () => {
  const at = (v: string) => ({ ...check, sources: [{ ...tier3, gameVersion: v }] }) as Entry;
  const cur = '2.3.540';
  const back = (n: number) => patches[patches.indexOf(cur) - n] as string;

  it('is Stale 10 or more versions behind on the deduplicated patch list, fresh at 9', () => {
    expect(patches).not.toContain('2.0.493a');
    expect(isStale(at(back(10)), cur, patches)).toBe(true);
    expect(isStale(at(back(9)), cur, patches)).toBe(false);
  });

  it('is fresh again once re-verified with a Source on the current version (US-2)', () => {
    const old = at(back(12));
    expect(isStale(old, cur, patches)).toBe(true);
    expect(
      isStale({ ...old, sources: [...old.sources, { ...tier1, gameVersion: cur }] } as Entry, cur, patches),
    ).toBe(false);
  });

  it('indexes an unlisted version at the newest listed one at or below it', () => {
    expect(patchIndex('2.3.535', patches)).toBe(patches.indexOf('2.3.531'));
  });

  it('counts contested sides, never inherited Sources, and never ages a generated entry', () => {
    const sides = {
      sides: [
        { position: 'A', sources: [{ ...tier3, gameVersion: cur }] },
        { position: 'B', sources: [tier3] },
      ],
    };
    expect(isStale({ ...at(back(12)), status: 'contested', contested: sides } as Entry, cur, patches)).toBe(
      false,
    );
    const generated = { ...at(back(20)), origin: 'generated' } as unknown as Entry;
    expect(isStale(generated, cur, patches)).toBe(false);
  });

  it('is Stale when the staleness pass flagged it', () => {
    const flagged = {
      ...at(cur),
      stale: { flaggedAt: cur, reason: 'patch touched it', pr: 'https://github.com/x/y/pull/1' },
    };
    expect(isStale(flagged as Entry, cur, patches)).toBe(true);
  });
});

describe('versions and the manifest (FR-22, FR-23, TR-13, US-6, US-7)', () => {
  it('displays the date version from injected git metadata, and the hash without git', () => {
    const v = knowledgeVersion('3f9a1c2e', { newestCommitDate: '2026-10-17T15:00:00Z', ordinal: 2 });
    expect(v.display).toBe('knowledge 2026.10.17.2');
    expect(v.id).toBe('2026.10.17.2+3f9a1c2e');
    expect(
      knowledgeVersion('3f9a1c2e', { newestCommitDate: '2026-10-17T15:00:00Z', ordinal: 1 }).display,
    ).toBe('knowledge 2026.10.17');
    expect(knowledgeVersion('3f9a1c2e', null).id).toBe('0000.00.00+3f9a1c2e');
  });

  it('diffManifests lists added, changed and retired authored entries with titles (US-7)', () => {
    const next = {
      manifest: { x: 'b', y: 'c' },
      entries: { x: { title: 'X' }, y: { title: 'Y' } } as unknown as Record<string, Entry>,
      retired: { z: { title: 'Z' } },
    };
    expect(diffManifests({ x: 'a', z: 'd' }, next)).toEqual({
      added: [{ id: 'y', title: 'Y' }],
      changed: [{ id: 'x', title: 'X' }],
      retired: [{ id: 'z', title: 'Z' }],
    });
    expect(diffManifests(null, next)).toBeNull();
  });

  it('hashes player-visible fields only, never provenance', () => {
    const a = playerVisible(check as Entry);
    const b = playerVisible({
      ...check,
      sources: [{ ...tier1, verified: '2026-11-01' }],
      notes: 'x',
    } as Entry);
    expect(a).toEqual(b);
    expect(playerVisible({ ...check, text: 'Other' } as Entry)).not.toEqual(a);
  });
});

describe('loadKnowledge (TR-7, states table)', () => {
  it('throws KnowledgeUnavailableError on a broken bundle: no partial advice', () => {
    expect(() => loadKnowledge('{not json')).toThrow(KnowledgeUnavailableError);
    expect(() => loadKnowledge({ version: {} })).toThrow(KnowledgeUnavailableError);
  });
});

// ---- coverage and report fields over a synthetic state ----

const state = (world: number | null): AccountState =>
  ({
    schemaVersion: 2,
    asOf: 0,
    account: {
      currentWorld: world,
      finishedWorlds: [],
      lastCloudSave: 0,
      secondsSinceLastSave: 0,
      dailyResetInSeconds: null,
      accountLevel: null,
      gameVersion: { serverBuild: 1, saveVersion: 1, parserTarget: '2.3.540' },
    },
    characters: [],
    lastPlayedCharacterIndex: null,
    diagnostics: {
      failedSections: [],
      failedSideReads: [],
      skippedCharacters: [],
      unreadableCharacters: [],
      unknownIds: { monsters: [], maps: [], items: [], classes: [] },
      unknownFields: world === null ? ['account.currentWorld'] : [],
      unnamed: false,
      parserPin: { commit: 'x', gameVersion: '2.3.540' },
      source: 'paste',
    },
    warnings: [],
  }) as AccountState;

const sys = (id: string, name: string, world: number): SystemDefT => ({
  id,
  name,
  world,
  scope: 'account',
  dossier: 'https://example.org',
  unlocked: { id: 'worlds/reached', params: { world } },
});

describe('coverage: "Not covered yet" (FR-24, TR-9, US-5)', () => {
  const systems = [
    sys('trapping', 'Trapping', 3),
    sys('post-office', 'Post Office', 5),
    sys('death-note', 'Death Note', 3),
  ];
  const generatedOnly = {
    ...goal,
    id: 'death-note.goal.poop-small',
    origin: 'generated',
  } as unknown as Entry;
  const kb = { systems, facts: {}, entries: { [generatedOnly.id]: generatedOnly } };

  it('lists unlocked Systems with no active entry, and never locked ones (US-5)', () => {
    expect(coverage(state(3), kb, [detectors]).map((s) => s.name)).toEqual(['Death Note', 'Trapping']);
  });

  it('does not count generated facts as coverage (D-5), and counts an authored entry', () => {
    const covered = {
      ...kb,
      entries: { ...kb.entries, t: { ...check, id: 'trapping.check.x', system: 'trapping' } as Entry },
    };
    expect(coverage(state(3), covered, [detectors]).map((s) => s.name)).toEqual(['Death Note']);
  });

  it('treats an unknown unlock as unlocked, which errs toward listing', () => {
    expect(coverage(state(null), kb, [detectors]).map((s) => s.name)).toEqual([
      'Death Note',
      'Trapping',
      'Post Office',
    ]);
  });
});

describe('entryReportFields (FR-29, US-8)', () => {
  const kb = {
    entries: {
      'alchemy.check.empty-big-bubble-slot': check as Entry,
      'a.check.b': { ...check, status: 'contested' } as Entry,
    },
    detectorOf: { 'alchemy.check.empty-big-bubble-slot': ['alchemy/empty-big-bubble-slot'] },
    readsOf: { 'alchemy/empty-big-bubble-slot': ['characters[*].afkType', 'characters[*].name'] },
    stale: [],
  } as unknown as CompiledKnowledge;

  it('returns exactly the five provenance keys, ids and field patterns only', () => {
    const out = entryReportFields(
      { entryIds: ['alchemy.check.empty-big-bubble-slot', 'Some Player Name'] },
      kb,
    );
    expect(Object.keys(out).sort()).toEqual(['contested', 'detectorIds', 'entryIds', 'fieldPaths', 'stale']);
    expect(out.entryIds).toEqual(['alchemy.check.empty-big-bubble-slot']);
    expect(out.detectorIds).toEqual(['alchemy/empty-big-bubble-slot']);
    expect(out.fieldPaths).toEqual(['characters[*].afkType', 'characters[*].name']);
    expect(out).toMatchObject({ stale: false, contested: false });
    expect(entryReportFields({ entryIds: ['a.check.b'] }, kb).contested).toBe(true);
  });
});

describe('the Detector registry (TR-4): discovered, never hand-edited', () => {
  it('discovers every detectors/<system>/<name>.ts', () => {
    expect(Object.keys(detectors)).toContain('worlds/reached');
  });

  const d = (id: string, kind = 'milestone') =>
    defineDetector({
      id,
      kind: kind as 'milestone',
      system: id.split('/')[0] as string,
      params: z.strictObject({}),
      slots: z.strictObject({}),
      reads: ['account'],
      examples: { fires: [], silent: [] },
      run: () => [],
    });

  it('rejects an id that is not its path, a system that is not its folder, and engine Detectors', () => {
    expect(() => buildRegistry({ './a/b.ts': { default: d('a/c') } })).toThrow(/must be "a\/b"/);
    expect(() => buildRegistry({ './a/b.ts': { default: { ...d('a/b'), system: 'z' } } })).toThrow(
      /must match the folder/,
    );
    expect(() => buildRegistry({ './a/b.ts': { default: d('a/b', 'engine') } }, 'knowledge')).toThrow(
      /engine Detectors live/,
    );
    expect(() => buildRegistry({ './a/b.ts': {} })).toThrow(/not a Detector/);
    expect(Object.keys(buildRegistry({ './a/b.ts': { default: d('a/b') }, './a/b.test.ts': {} }))).toEqual([
      'a/b',
    ]);
  });

  it('isolates a throwing Detector: unknown for that entry, never a crash (FR-13)', () => {
    const boom = {
      ...d('x/y'),
      run: () => {
        throw new Error('boom');
      },
    };
    const run = runDetector(boom, makeContext(state(1), null, { now: 0 }), {});
    expect(run).toEqual({ ok: false, error: 'boom', detectorId: 'x/y' });
  });
});

describe('contributions example sanity', () => {
  it('uses a goal', () => {
    expect(contribution.goal).toBe('death-note.goal.w1-skulls');
  });
});
