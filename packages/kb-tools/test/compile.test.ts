// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb compile` (M11 TR-7, TR-12, TR-13, FR-21 to FR-23, TR-17).
import { canonicalJson, diffManifests, loadKnowledge, packKnowledge } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/compile';
import { loadSource } from '../src/load';
import { entry, file, kbTree, SRC1, testRegistries } from './kb-tree';

const regs = testRegistries();
const check = (id: string, extra: Record<string, string> = {}) =>
  entry({
    id,
    system: 'alchemy',
    type: 'check',
    subject: 'character',
    effect: 'next-action',
    confidence: 'M',
    detector: '{ id: alchemy/slots }',
    ...extra,
  });
const generated = (milestone2: number, url = 'parsers/world-3/deathNote.ts') =>
  JSON.stringify({
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
        values: {},
        sources: [
          {
            url: `https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/${url}`,
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
          { at: milestone2, reward: 'rank 2' },
        ],
        generatedBy: {
          generator: 'death-note',
          inputs: ['x'],
          commit: '6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1',
        },
      },
      {
        id: 'death-note.goal.dormant',
        system: 'death-note',
        type: 'goal',
        origin: 'generated',
        title: 'Death Note: Dormant',
        text: '{value:compact} kills',
        why: 'Ranks add skulls.',
        values: {},
        sources: [
          {
            url: `https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/${url}`,
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
        milestones: [{ at: 1, reward: 'rank 1' }],
        generatedBy: {
          generator: 'death-note',
          inputs: ['x'],
          commit: '6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1',
        },
      },
    ],
  });
const tree = (opts: { milestone2?: number; sourceUrl?: string; text?: string; retire?: boolean } = {}) =>
  kbTree({
    'systems/alchemy.yaml': file(
      'alchemy',
      check('alchemy.check.a', opts.text ? { text: `"${opts.text}"` } : {}),
      check('alchemy.check.b'),
      check(
        'alchemy.check.c',
        opts.retire ? { status: 'retired', retired: '{ reason: merged, replacedBy: alchemy.check.a }' } : {},
      ),
    ),
    'systems/metapath.yaml': file(
      'metapath',
      entry({
        id: 'metapath.priority.never-skip',
        system: 'metapath',
        type: 'priority',
        list: 'block',
        confidence: 'M',
        tiers: '[[alchemy.check.b], [{ ref: alchemy.check.c, byUrgency: true }]]',
        sources: `[${SRC1}]`,
      }),
      entry({
        id: 'metapath.priority.w2-late',
        system: 'metapath',
        type: 'priority',
        list: 'goals',
        stage: 'W2-late',
        confidence: 'M',
        appliesTo: '{ stages: [W2-late] }',
        tiers: '[[{ include: metapath.priority.never-skip }], [alchemy.check.a]]',
      }),
    ),
    'systems/death-note.yaml': file(
      'death-note',
      entry({
        id: 'death-note.goal.w1',
        system: 'death-note',
        type: 'goal',
        scope: 'account',
        category: 'compounding',
        unit: 'kills',
        progress: '{ id: death-note/kills }',
        extends: 'death-note.goal.poop-small',
      }),
    ),
    'generated/death-note.json': generated(opts.milestone2 ?? 100000, opts.sourceUrl),
  });

const build = async (root: string) => compile(loadSource(root), { git: null }, regs);

describe('kb compile on a throwaway tree', () => {
  it('is deterministic: same source, same bytes', async () => {
    const root = tree();
    expect(canonicalJson(await build(root))).toBe(canonicalJson(await build(root)));
  });

  it("expands an include as ONE position, a tie of all the block's items (TR-12)", async () => {
    const kb = await build(tree());
    const list = kb.lists['metapath.priority.w2-late'];
    expect(list?.positions.map((p) => p.map((i) => i.id))).toEqual([
      ['alchemy.check.b', 'alchemy.check.c'],
      ['alchemy.check.a'],
    ]);
    expect(list?.positions[0]?.find((i) => i.id === 'alchemy.check.c')).toMatchObject({
      byUrgency: true,
      via: 'metapath.priority.never-skip',
    });
    expect(kb.priorityByStage['W2-late']).toEqual({ goals: 'metapath.priority.w2-late' });
  });

  it('inlines an extended ladder and ships only referenced generated entries (D-5)', async () => {
    const kb = await build(tree());
    const g = kb.entries['death-note.goal.w1'];
    expect(g?.type === 'goal' && g.milestones?.map((m) => m.at)).toEqual([25000, 100000]);
    expect(kb.entries['death-note.goal.poop-small']).toBeDefined();
    expect(kb.entries['death-note.goal.dormant']).toBeUndefined();
  });

  it('keeps generated ids out of the manifest and derives affectsVerdict', async () => {
    const kb = await build(tree());
    expect(Object.keys(kb.manifest).some((id) => id.startsWith('death-note.goal.poop'))).toBe(false);
    expect(kb.manifest['death-note.goal.w1']).toMatch(/^[0-9a-f]{8}$/);
    const c = kb.entries['alchemy.check.a'];
    expect(c?.type === 'check' && c.affectsVerdict).toBe(false);
  });

  it('drops retired entries into the retired map (FR-21)', async () => {
    const kb = await build(tree({ retire: true }));
    expect(kb.entries['alchemy.check.c']).toBeUndefined();
    expect(kb.retired['alchemy.check.c']).toEqual({ title: 'A title', replacedBy: 'alchemy.check.a' });
  });

  it('a sync that moves no fact changes no hash; a moved fact changes the extending entry (FR-22, TR-13)', async () => {
    const a = await build(tree());
    const sameFacts = await build(tree({ sourceUrl: 'parsers/world-3/deathNote2.ts' }));
    expect(sameFacts.manifest).toEqual(a.manifest);
    const moved = await build(tree({ milestone2: 120000 }));
    expect(diffManifests(a.manifest, moved)).toEqual({
      added: [],
      changed: [{ id: 'death-note.goal.w1', title: 'A title' }],
      retired: [],
    });
  });

  it("What's new lists added, changed and retired between two bundles (US-7)", async () => {
    const a = await build(tree());
    const b = await build(tree({ text: 'Other text', retire: true }));
    const d = diffManifests(a.manifest, b);
    expect(d?.changed.map((x) => x.id)).toEqual(['alchemy.check.a']);
    expect(d?.retired.map((x) => x.id)).toEqual(['alchemy.check.c']);
  });

  it('round-trips through loadKnowledge', async () => {
    const kb = loadKnowledge(JSON.stringify(await build(tree())));
    expect(kb.version.display).toBe('knowledge 0000.00.00');
  });
});

describe('kb compile on the real Knowledge Base (TR-17 budgets)', () => {
  it('compiles within budget and the bundle loads', async () => {
    const t = performance.now();
    const kb = await compile(loadSource(), { git: null });
    expect(performance.now() - t).toBeLessThan(5_000);
    // The shipped (packed) form: repeated entry fields interned (M4's family expansions, pack.ts).
    const text = canonicalJson(packKnowledge(kb));
    // kb-budget.json's bundleBytes: 1 MB since release 4. The compiled Knowledge Base ships only in the
    // parse worker chunk (8 MB budget), never on the UI thread.
    expect(Buffer.byteLength(text)).toBeLessThan(1024 * 1024);
    const t2 = performance.now();
    const loaded = loadKnowledge(text);
    expect(performance.now() - t2).toBeLessThan(30);
    // Unpacking restores every entry exactly, minus the authors' notes (never shipped).
    const withoutNotes = Object.fromEntries(
      Object.entries(kb.entries).map(([id, e]) => [id, { ...e, notes: undefined }]),
    );
    expect(canonicalJson(loaded.entries)).toBe(canonicalJson(withoutNotes));
  });
});
