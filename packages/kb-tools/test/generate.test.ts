// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb generate` (M11 FR-14 to FR-18, TR-10, US-4): freshness, the grouped fact diff, and holds.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  defineGenerator,
  type Generator,
  generatedBy,
  generatedSource,
} from '@idleon-forge/knowledge/generators';
import deathNote from '@idleon-forge/knowledge/generators/death-note.gen';
import { describe, expect, it } from 'vitest';
import { checkGenerated, factDiff, formatFactDiff, generateAll, stableJson } from '../src/generate';
import { readPin } from '../src/paths';
import { PIN, runOnSlice } from './generators/helpers';
import { entry, file, kbTree } from './kb-tree';

describe('the committed generated facts', () => {
  it('are up to date with the pinned Toolbox data (FR-15)', async () => {
    const r = await checkGenerated();
    expect(r.problems).toEqual([]);
  });
});

describe('the fact diff (FR-18, US-4)', () => {
  const ladderFile = (second: number, n = 104) =>
    stableJson({
      system: 'death-note',
      generator: 'death-note',
      entries: Array.from({ length: n }, (_, i) => ({
        id: `death-note.goal.mob-${i}`,
        title: `Death Note: Mob ${i}`,
        milestones: [{ at: 25000 }, { at: second }],
      })),
    });

  it('groups one shared-table change into one line: "104 entries: milestone 2, 100000 → 120000"', () => {
    const d = factDiff(
      new Map([['death-note.json', ladderFile(100000)]]),
      new Map([['death-note.json', ladderFile(120000)]]),
    );
    expect(formatFactDiff(d)).toContain('- 104 entries: milestones[1].at, 100000 → 120000');
  });

  it('moves every ladder when the rank table changes, from the generator itself, with no YAML edited', () => {
    const slice = {
      deathNote: [
        { rawName: 'poopSmall', name: 'Poop', world: 0 },
        { rawName: 'ratB', name: 'Rat', world: 0 },
      ],
      ninjaExtraInfo: Object.assign([], { 30: [] }),
      monsters: { poopSmall: { Name: 'Poop' }, ratB: { Name: 'Rat' } },
    };
    const consts = (second: number) => ({
      DEATH_NOTE_RANKS: [
        [25e3, 1],
        [second, 2],
      ],
      MINI_BOSS_DEATH_NOTE_RANKS: [[100, 1]],
      ECLIPSE_SKULL_KILLS: 1e9,
      ECLIPSE_SKULL_RANK: 20,
    });
    const asFile = (second: number) =>
      new Map([
        ['death-note.json', stableJson({ entries: runOnSlice(deathNote, slice, consts(second)).entries })],
      ]);
    const text = formatFactDiff(factDiff(asFile(1e5), asFile(1.2e5)));
    expect(text).toContain('- 2 entries: milestones[1].at, 100000 → 120000');
  });

  it('prints a possible rename when an id disappears and one with the same title appears', () => {
    const a = stableJson({ entries: [{ id: 'x.goal.old', title: 'Same' }] });
    const b = stableJson({ entries: [{ id: 'x.goal.new', title: 'Same' }] });
    expect(factDiff(new Map([['x.json', a]]), new Map([['x.json', b]])).renames).toEqual([
      'possible rename: x.goal.old → x.goal.new',
    ]);
  });
});

describe('holds: a failing generator never blocks the parser update (FR-18, TR-10, US-4)', () => {
  const pin = readPin();
  const goalEntry = (id: string) => ({
    id,
    system: 'death-note',
    type: 'goal',
    origin: 'generated',
    title: `Death Note: ${id}`,
    text: '{value:compact} kills',
    why: 'Ranks add skulls.',
    values: {},
    sources: [generatedSource(PIN, 'parsers/world-3/deathNote.ts', 'Toolbox')],
    appliesTo: { stages: 'all' },
    confidence: 'H',
    status: 'active',
    scope: 'account',
    category: 'compounding',
    unit: 'kills',
    progress: { id: 'death-note/kills', params: {} },
    milestones: [{ at: 10, reward: 'rank 1' }],
    generatedBy: generatedBy({ name: 'death-note', inputs: ['x'] }, pin),
  });
  const committed = stableJson({
    system: 'death-note',
    generator: 'death-note',
    entries: [goalEntry('death-note.goal.kept'), goalEntry('death-note.goal.used')],
  });
  const root = () =>
    kbTree({
      'generated/death-note.json': committed,
      'systems/death-note.yaml': file(
        'death-note',
        entry({
          id: 'death-note.goal.mine',
          system: 'death-note',
          type: 'goal',
          scope: 'account',
          category: 'compounding',
          unit: 'kills',
          progress: '{ id: death-note/kills }',
          extends: 'death-note.goal.used',
        }),
      ),
    });
  const fake = (run: Generator['run']) =>
    defineGenerator({
      name: 'death-note',
      system: 'death-note',
      inputs: ['website-data/shared-data.json#deathNote'],
      run,
    });

  it('keeps the last good output and records a hold when the generator throws', async () => {
    const r = await generateAll({
      root: root(),
      generators: [
        fake(() => {
          throw new Error('new data shape');
        }),
      ],
    });
    expect(r.files.get('death-note.json')).toBe(committed);
    expect(r.held).toMatchObject([
      { generator: 'death-note', reason: 'new data shape', since: pin.commit, syncs: 0 },
    ]);
    expect(formatFactDiff(factDiff(new Map(), new Map()), r.held)).toMatch(
      /## Held facts\n\n- death-note: 2 ids held/,
    );
  });

  it('keeps an id authored YAML still references when the new data drops it, and names the file', async () => {
    const r = await generateAll({
      root: root(),
      generators: [fake(() => ({ entries: [goalEntry('death-note.goal.kept')] }))],
    });
    const ids = (
      JSON.parse(r.files.get('death-note.json') as string) as { entries: { id: string }[] }
    ).entries.map((e) => e.id);
    expect(ids).toEqual(['death-note.goal.kept', 'death-note.goal.used']);
    expect(r.held[0]?.reason).toMatch(
      /death-note\.goal\.used \(.*systems\/death-note\.yaml:\d+ death-note\.goal\.mine\)/,
    );
  });

  it('counts the syncs a hold lives through (CI fails past 2)', async () => {
    const tree = root();
    const old = {
      holds: [
        {
          generator: 'death-note',
          ids: ['x'],
          reason: 'r',
          issue: '',
          since: 'a'.repeat(40),
          lastCommit: 'b'.repeat(40),
          syncs: 2,
        },
      ],
    };
    const { writeFileSync } = await import('node:fs');
    writeFileSync(path.join(tree, 'generated/_held.json'), stableJson(old));
    const r = await generateAll({
      root: tree,
      generators: [
        fake(() => {
          throw new Error('still broken');
        }),
      ],
    });
    expect(r.held[0]?.syncs).toBe(3);
  });
});

describe('the patch list (TR-11)', () => {
  it('is the deduplicated, normalised game versions, oldest first, with the pin last', () => {
    const p = JSON.parse(
      readFileSync(new URL('../../knowledge/generated/_patches.json', import.meta.url), 'utf8'),
    ) as { patches: string[] };
    expect(p.patches.at(-1)).toBe(readPin().gameVersion);
    expect(new Set(p.patches).size).toBe(p.patches.length);
    expect(p.patches).toContain('2.0.493');
    expect(p.patches.some((v) => /[a-z]/.test(v))).toBe(false);
  });
});
