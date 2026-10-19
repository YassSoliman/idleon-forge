// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-4: the Rift label lint over player text (live entries and drafts), never over Sources or notes.
import { describe, expect, it } from 'vitest';
import { checkSource } from '../src/check';
import { loadSource } from '../src/load';
import { entry, file, kbTree, testRegistries } from './kb-tree';

const check = (text: string, extra: Record<string, string> = {}) =>
  entry({
    id: 'afk.check.rift-x',
    system: 'afk',
    type: 'check',
    subject: 'account',
    effect: 'next-action',
    confidence: 'M',
    status: 'draft',
    detector: '{ id: afk/not-built }',
    text: `"${text}"`,
    ...extra,
  });
const codes = async (e: string) =>
  (await checkSource(loadSource(kbTree({ 'systems/afk.yaml': file('afk', e) })), testRegistries()))
    .filter((i) => i.code === 'rift-label')
    .map((i) => i.message);

describe('the Rift label lint (M26 FR-4)', () => {
  it('fails a typed number after Rift in text, values or a draft', async () => {
    expect(await codes(check('Reach Rift 26 for Stamp Mastery'))).toHaveLength(1);
    expect(await codes(check('Reach {rift}', { values: '{ gate: "Opens at Rift 16" }' }))).toHaveLength(1);
  });
  it('passes a slot, and ignores notes', async () => {
    expect(await codes(check('Reach Rift {rift} for Stamp Mastery'))).toEqual([]);
    expect(await codes(check('Reach Rift {rift}', { notes: '"stored 25, the game shows Rift 26"' }))).toEqual(
      [],
    );
  });
});
