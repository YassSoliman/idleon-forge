// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb check` (M11 TR-8, FR-2 to FR-10, FR-17, US-1, US-3) over throwaway Knowledge Base trees, and
// over the real one.
import { describe, expect, it } from 'vitest';
import { checkSource } from '../src/check';
import { fullCheck } from '../src/commands';
import { formatIssue, type Issue } from '../src/issues';
import { loadSource } from '../src/load';
import { loadYaml, YamlError } from '../src/yaml';
import { entry, file, kbTree, SRC1, SRC3, testRegistries } from './kb-tree';

const run = async (files: Record<string, string>, extra?: Record<string, unknown>) => {
  const issues = await checkSource(loadSource(kbTree(files)), testRegistries(extra));
  return issues;
};
const errors = (issues: Issue[]) => issues.filter((i) => i.level === 'error').map(formatIssue);
const has = (issues: Issue[], re: RegExp) => errors(issues).some((m) => re.test(m));

const blocker = (extra: Record<string, string> = {}) =>
  entry({
    id: 'afk.check.no-target',
    system: 'afk',
    type: 'check',
    subject: 'character',
    effect: 'blocker',
    detector: '{ id: afk/no-target }',
    text: '"Send it to {suggestion:name}"',
    ...extra,
  });

describe('kb check on a throwaway tree', () => {
  it('names the file, the line and the field when sources is empty (US-1)', async () => {
    const issues = await run({ 'systems/afk.yaml': file('afk', blocker({ sources: '[]' })) });
    const line = errors(issues).find((m) => m.includes('sources must have at least 1 item'));
    expect(line).toMatch(/systems\/afk\.yaml:\d+ afk\.check\.no-target: sources must have at least 1 item$/);
  });

  it('rejects a contested Verdict blocker (US-3, FR-6)', async () => {
    const sides = `{ sides: [{ position: A, sources: [${SRC3}] }, { position: B, sources: [${SRC3}] }] }`;
    const issues = await run({
      'systems/afk.yaml': file('afk', blocker({ status: 'contested', contested: sides })),
    });
    expect(has(issues, /a contested entry cannot be a Verdict blocker/)).toBe(true);
  });

  it('M26 FR-1: a draft is schema-checked and holds its id, but its Detector and references wait', async () => {
    const draft = (extra: Record<string, string> = {}) =>
      entry({
        id: 'alchemy.check.later',
        system: 'alchemy',
        type: 'check',
        subject: 'account',
        effect: 'next-action',
        confidence: 'M',
        status: 'draft',
        goal: 'alchemy.goal.not-yet',
        detector: '{ id: alchemy/not-built }',
        ...extra,
      });
    const ok = await run({ 'systems/alchemy.yaml': file('alchemy', draft()) });
    expect(errors(ok).filter((m) => !m.includes('orphan'))).toEqual([]);
    const bad = await run({ 'systems/alchemy.yaml': file('alchemy', draft({ effect: 'sometimes' })) });
    expect(errors(bad).length).toBeGreaterThan(0);
    const dup = await run({
      'systems/afk.yaml': file('afk', blocker()),
      'systems/alchemy.yaml': file('alchemy', draft({ id: 'afk.check.no-target', system: 'afk' })),
    });
    expect(has(dup, /afk\.check\.no-target: duplicate id/)).toBe(true);
  });

  it('M26 FR-1: a live entry may not depend on a draft', async () => {
    const g = entry({
      id: 'alchemy.goal.g',
      system: 'alchemy',
      type: 'goal',
      scope: 'account',
      category: 'nice',
      unit: 'x',
      status: 'draft',
      progress: '{ id: afk/no-target }',
      milestones: '[{ at: 5, reward: r }]',
    });
    const c = entry({
      id: 'alchemy.check.slot',
      system: 'alchemy',
      type: 'check',
      subject: 'character',
      effect: 'next-action',
      confidence: 'M',
      goal: 'alchemy.goal.g',
      detector: '{ id: afk/no-target }',
    });
    const issues = await run({ 'systems/alchemy.yaml': file('alchemy', c, g) });
    expect(has(issues, /references alchemy\.goal\.g, which is a draft/)).toBe(true);
  });

  it('passes a clean blocker and reports its Detector as used', async () => {
    const issues = await run({ 'systems/afk.yaml': file('afk', blocker()) });
    expect(errors(issues).filter((m) => !m.includes('orphan'))).toEqual([]);
    expect(has(issues, /afk\/no-target is not referenced/)).toBe(false);
  });

  it('fails a dangling reference and an unregistered or wrong-kind Detector (FR-5, FR-9)', async () => {
    const c = entry({
      id: 'alchemy.check.slot',
      system: 'alchemy',
      type: 'check',
      subject: 'character',
      effect: 'next-action',
      confidence: 'M',
      goal: 'alchemy.goal.missing',
      detector: '{ id: alchemy/nope }',
    });
    const g = entry({
      id: 'alchemy.goal.g',
      system: 'alchemy',
      type: 'goal',
      scope: 'account',
      category: 'nice',
      unit: 'x',
      progress: '{ id: afk/no-target }',
      milestones: '[{ at: 5, reward: r }]',
    });
    const issues = await run({ 'systems/alchemy.yaml': file('alchemy', c, g) });
    expect(has(issues, /references a missing entry alchemy\.goal\.missing/)).toBe(true);
    expect(has(issues, /detector alchemy\/nope is not registered/)).toBe(true);
    expect(has(issues, /afk\/no-target is a check Detector; goal\.progress needs progress/)).toBe(true);
  });

  it('validates params against the Detector and flags orphans (FR-9, FR-10)', async () => {
    const c = entry({
      id: 'alchemy.check.slot',
      system: 'alchemy',
      type: 'check',
      subject: 'character',
      effect: 'next-action',
      confidence: 'M',
      detector: '{ id: alchemy/slots, params: { min: oops } }',
      text: '"Slot {slot:int}"',
    });
    const issues = await run({ 'systems/alchemy.yaml': file('alchemy', c) });
    expect(has(issues, /params for alchemy\/slots/)).toBe(true);
    expect(has(issues, /detector death-note\/kills is not referenced by any entry \(orphan\)/)).toBe(true);
  });

  it('checks template slots and their formats (TR-6)', async () => {
    const c = entry({
      id: 'alchemy.check.slot',
      system: 'alchemy',
      type: 'check',
      subject: 'character',
      effect: 'next-action',
      confidence: 'M',
      detector: '{ id: alchemy/slots }',
      text: '"Slot {slot:name} for {nobody}"',
    });
    const issues = await run({ 'systems/alchemy.yaml': file('alchemy', c) });
    expect(has(issues, /\{slot:name\} needs a string slot; slot is a number/)).toBe(true);
    expect(has(issues, /template slot \{nobody\} is not provided/)).toBe(true);
  });

  it('fails a hand-copied fact and warns on a 3-digit literal (FR-17)', async () => {
    const gen = JSON.stringify({
      system: 'death-note',
      generator: 'death-note',
      entries: [
        {
          id: 'death-note.goal.poop-small',
          system: 'death-note',
          type: 'goal',
          origin: 'generated',
          title: 'Death Note: Poop',
          text: '{value:compact} Poop kills',
          why: 'Ranks add skulls.',
          values: { monster: 'poopSmall' },
          sources: [
            {
              url: 'https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/deathNote.ts',
              title: 'Toolbox',
              tier: 1,
              verified: '2026-10-17',
              gameVersion: '2.3.540',
            },
          ],
          appliesTo: { stages: 'all' },
          confidence: 'H',
          status: 'active',
          scope: 'account',
          category: 'compounding',
          unit: 'kills',
          progress: { id: 'death-note/kills', params: {} },
          milestones: [
            { at: 25000, reward: 'rank 1' },
            { at: 100000, reward: 'rank 2' },
          ],
          generatedBy: {
            generator: 'death-note',
            inputs: ['x'],
            commit: '6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1',
          },
        },
      ],
    });
    const g = entry({
      id: 'death-note.goal.w1',
      system: 'death-note',
      type: 'goal',
      scope: 'account',
      category: 'compounding',
      unit: 'kills',
      progress: '{ id: death-note/kills }',
      extends: 'death-note.goal.poop-small',
      text: '"Next rank at 100000 kills, stop at 750"',
    });
    const issues = await run({
      'systems/death-note.yaml': file('death-note', g),
      'generated/death-note.json': gen,
    });
    expect(has(issues, /hand-copied fact 100000; use a slot/)).toBe(true);
    expect(
      issues.some((i) => i.level === 'warning' && i.code === 'literal-3-digits' && i.message.includes('750')),
    ).toBe(true);
  });

  it('rejects include cycles, an item twice and byUrgency outside never-skip (TR-8)', async () => {
    const c = entry({
      id: 'alchemy.check.slot',
      system: 'alchemy',
      type: 'check',
      subject: 'character',
      effect: 'next-action',
      confidence: 'M',
      detector: '{ id: alchemy/slots }',
    });
    const blockA = entry({
      id: 'metapath.priority.a',
      system: 'metapath',
      type: 'priority',
      list: 'block',
      confidence: 'M',
      tiers: '[[{ include: metapath.priority.b }], [alchemy.check.slot]]',
    });
    const blockB = entry({
      id: 'metapath.priority.b',
      system: 'metapath',
      type: 'priority',
      list: 'block',
      confidence: 'M',
      tiers: '[[{ include: metapath.priority.a }]]',
    });
    const list = entry({
      id: 'metapath.priority.w2-late',
      system: 'metapath',
      type: 'priority',
      list: 'goals',
      stage: 'W2-late',
      confidence: 'M',
      appliesTo: '{ stages: [W2-late] }',
      tiers: '[[alchemy.check.slot], [{ ref: alchemy.check.slot, byUrgency: true }]]',
    });
    const issues = await run({
      'systems/alchemy.yaml': file('alchemy', c),
      'systems/metapath.yaml': file('metapath', blockA, blockB, list),
    });
    expect(has(issues, /include cycle/)).toBe(true);
    expect(has(issues, /alchemy\.check\.slot appears more than once after includes/)).toBe(true);
    expect(has(issues, /byUrgency is allowed only inside metapath\.priority\.never-skip/)).toBe(true);
  });

  it('a Priority List cannot reference a retired entry', async () => {
    const retired = entry({
      id: 'alchemy.check.slot',
      system: 'alchemy',
      type: 'check',
      subject: 'character',
      effect: 'next-action',
      confidence: 'M',
      detector: '{ id: alchemy/slots }',
      status: 'retired',
      retired: '{ reason: merged }',
    });
    const list = entry({
      id: 'metapath.priority.w2-late',
      system: 'metapath',
      type: 'priority',
      list: 'goals',
      stage: 'W2-late',
      confidence: 'M',
      appliesTo: '{ stages: [W2-late] }',
      tiers: '[[alchemy.check.slot]]',
    });
    const issues = await run({
      'systems/alchemy.yaml': file('alchemy', retired),
      'systems/metapath.yaml': file('metapath', list),
    });
    expect(has(issues, /cannot reference retired alchemy\.check\.slot/)).toBe(true);
  });

  it('rejects a Source newer than the parser pin (TR-11)', async () => {
    const newer = `[{ url: https://www.reddit.com/r/idleon/comments/1/, title: t, tier: 3, claimDate: 2026-10-01, verified: 2026-10-17, gameVersion: 2.3.999 }]`;
    const issues = await run({
      'systems/afk.yaml': file('afk', blocker({ sources: `[${SRC3.replace('tier: 3', 'tier: 2')}]` }), ''),
      'systems/alchemy.yaml': file(
        'alchemy',
        entry({
          id: 'alchemy.check.slot',
          system: 'alchemy',
          type: 'check',
          subject: 'character',
          effect: 'next-action',
          confidence: 'M',
          detector: '{ id: alchemy/slots }',
          sources: newer,
        }),
      ),
    });
    expect(has(issues, /Source game version 2\.3\.999 is newer than the parser pin/)).toBe(true);
  });

  it('warns, not fails, on an entry with no player-facing Source (#74)', async () => {
    const research = `{ url: https://github.com/YassSoliman/idleon-forge/blob/main/docs/research/x.md, title: dossier, tier: 4, verified: 2026-10-17, gameVersion: 2.3.540 }`;
    const toolboxOnly = await run({ 'systems/afk.yaml': file('afk', blocker()) });
    const noPlayer = (issues: Issue[]) =>
      issues.filter((i) => i.code === 'no-player-source' && i.id === 'afk.check.no-target');
    expect(noPlayer(toolboxOnly).map((i) => i.level)).toEqual(['warning']);
    expect(errors(toolboxOnly).filter((m) => !m.includes('orphan'))).toEqual([]);
    // A GitHub file is provenance, not a page a player reads, whatever its tier.
    const githubOnly = await run({
      'systems/afk.yaml': file('afk', blocker({ sources: `[${SRC1}, ${research}]` })),
    });
    expect(noPlayer(githubOnly)).toHaveLength(1);
    const withThread = await run({
      'systems/afk.yaml': file('afk', blocker({ sources: `[${SRC1}, ${SRC3}]` })),
    });
    expect(noPlayer(withThread)).toEqual([]);
  });

  it('a file must be named after its system', async () => {
    const issues = await run({ 'systems/wrong.yaml': file('afk', blocker()) });
    expect(has(issues, /system must be "wrong"/)).toBe(true);
  });
});

describe('safe YAML (TR-2 notes, TR-18)', () => {
  it('rejects anchors, aliases, custom tags and duplicate keys, with the line', () => {
    expect(() => loadYaml('x.yaml', 'a: &x 1\nb: *x\n')).toThrow(YamlError);
    expect(() => loadYaml('x.yaml', 'a: !thing 1\n')).toThrow(/custom tag|Unresolved tag/i);
    expect(() => loadYaml('x.yaml', 'a: 1\na: 2\n')).toThrow(/x\.yaml:2/);
    expect(() => loadYaml('x.yaml', `a: "${'x'.repeat(300 * 1024)}"\n`)).toThrow(/256 KB/);
  });

  it('maps a path to its line', () => {
    const y = loadYaml('x.yaml', 'entries:\n  - id: a\n    sources: []\n');
    expect(y.lineOf(['entries', 0, 'sources'])).toBe(3);
  });
});

describe('kb check on the real Knowledge Base', () => {
  it('has no errors, and every Detector example passes (private ones skip in CI)', async () => {
    const { issues, harness } = await fullCheck({ examples: true });
    expect(errors(issues)).toEqual([]);
    expect(harness.filter((h) => h.status === 'fail')).toEqual([]);
    // #74: every authored entry carries a Source a player can read.
    expect(issues.filter((i) => i.code === 'no-player-source').map(formatIssue)).toEqual([]);
    expect(harness.filter((h) => h.status === 'pass').length).toBeGreaterThan(0);
  });
});
