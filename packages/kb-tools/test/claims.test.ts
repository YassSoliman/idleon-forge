// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-5: kb check on `claims`: a known System, and a warning while the owner hasn't claimed the key.
import { describe, expect, it } from 'vitest';
import { checkSource } from '../src/check';
import { loadSource } from '../src/load';
import { entry, file, kbTree, testRegistries } from './kb-tree';

const check = (id: string, system: string, claims: string) =>
  entry({
    id,
    system,
    type: 'check',
    subject: 'account',
    effect: 'next-action',
    confidence: 'M',
    status: 'draft',
    detector: '{ id: afk/not-built }',
    claims,
  });
const issues = async (files: Record<string, string>) =>
  (await checkSource(loadSource(kbTree(files)), testRegistries())).filter((i) => /claims /.test(i.message));

describe('claims in kb check (M26 FR-5)', () => {
  it('warns while only another System claims the key, and is quiet once the owner does', async () => {
    const other = check('afk.check.golden', 'afk', '[{ system: alchemy, key: golden-food }]');
    expect((await issues({ 'systems/afk.yaml': file('afk', other) })).map((i) => i.code)).toEqual([
      'claim-no-owner',
    ]);
    const owner = check('alchemy.check.golden', 'alchemy', '[{ system: alchemy, key: golden-food }]');
    expect(
      await issues({
        'systems/afk.yaml': file('afk', other),
        'systems/alchemy.yaml': file('alchemy', owner),
      }),
    ).toEqual([]);
  });
  it('fails a claim on a System that is not in the registry', async () => {
    const bad = check('afk.check.golden', 'afk', '[{ system: nowhere, key: golden-food }]');
    expect((await issues({ 'systems/afk.yaml': file('afk', bad) })).map((i) => i.level)).toContain('error');
  });
});
