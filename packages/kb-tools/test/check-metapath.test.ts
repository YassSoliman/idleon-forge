// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb check` for M2's schema additions: a `detector` on `metapath` entries, engine Detectors as Goal
// progress, and Priority Lists that name entries their owner module hasn't shipped yet (pending-entry).
import { defineDetector } from '@idleon-forge/knowledge';
import { buildRegistry } from '@idleon-forge/knowledge/detectors-registry';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { checkSource } from '../src/check';
import { formatIssue, type Issue } from '../src/issues';
import { loadSource } from '../src/load';
import { entry, file, kbTree, testRegistries } from './kb-tree';

const engine = (id: string) =>
  defineDetector({
    id,
    kind: 'engine',
    system: 'metapath',
    params: z.strictObject({}),
    slots: z.strictObject({}),
    reads: ['account.finishedWorlds'],
    examples: { fires: [], silent: [] },
    run: () => [],
  });

const registries = () => ({
  ...testRegistries(),
  engine: buildRegistry(
    {
      './metapath/stage.ts': { default: engine('metapath/stage') },
      './metapath/push-step.ts': { default: engine('metapath/push-step') },
    },
    'engine',
  ),
});
const run = async (files: Record<string, string>) => checkSource(loadSource(kbTree(files)), registries());
// The test registries' unused Detectors are orphans in these small trees; that rule is tested elsewhere.
const errors = (issues: Issue[]) =>
  issues.filter((i) => i.level === 'error' && !i.message.includes('(orphan)')).map(formatIssue);

const stages = entry({
  id: 'metapath.metapath.stages',
  system: 'metapath',
  type: 'metapath',
  part: 'stages',
  detector: '{ id: metapath/stage }',
  stages: '[{ id: W1-early, rule: w1-early }]',
});
const push = (progress = 'metapath/push-step') =>
  entry({
    id: 'metapath.goal.push',
    system: 'metapath',
    type: 'goal',
    scope: 'character',
    category: 'compounding',
    unit: 'step',
    progress: `{ id: ${progress} }`,
    milestones: '[{ at: 1, reward: Done }]',
  });

describe('M2 schema additions', () => {
  it('a metapath entry may name its engine Detector, and a Goal may use one for progress', async () => {
    const issues = await run({ 'systems/metapath.yaml': file('metapath', stages, push()) });
    expect(errors(issues)).toEqual([]);
  });

  it('a Goal still cannot use a check Detector for progress', async () => {
    const issues = await run({ 'systems/metapath.yaml': file('metapath', stages, push('afk/no-target')) });
    expect(
      errors(issues).some((m) =>
        /afk\/no-target is a check Detector; goal\.progress needs progress or engine/.test(m),
      ),
    ).toBe(true);
  });

  it('a Priority List naming an entry not shipped yet is a pending-entry warning, not an error', async () => {
    const list = entry({
      id: 'metapath.priority.w1-early',
      system: 'metapath',
      type: 'priority',
      appliesTo: '{ stages: [W1-early] }',
      list: 'goals',
      stage: 'W1-early',
      tiers: '[[metapath.goal.push], [later.check.not-yet]]',
    });
    const issues = await run({ 'systems/metapath.yaml': file('metapath', stages, push(), list) });
    expect(errors(issues)).toEqual([]);
    expect(issues.some((i) => i.code === 'pending-entry' && i.message.includes('later.check.not-yet'))).toBe(
      true,
    );
  });
});
