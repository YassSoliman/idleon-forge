// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M12 US-4, TR-4 and TR-6.
import { describe, expect, it } from 'vitest';
import { buildInfo, knowledgeVersion, NO_KNOWLEDGE } from '../src/build-info.ts';
import type { Commit } from '../src/commits.ts';

const c = (date: string, files: string[]): Commit => ({
  sha: 'f'.repeat(40),
  date,
  subject: 'x',
  body: '',
  files,
});
const kb = ['packages/knowledge/entries/a.yaml'];
const app = ['apps/activeon/src/App.tsx'];
const UPSTREAM =
  'repo=https://github.com/YassSoliman/IdleonToolbox\ncommit=6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1\ncommitDate=2026-10-17\ntoolboxVersion=3.3.96\ngameVersion=2.3.540\n';

// Newest first: the second Knowledge Base merge of 2026-10-21 is the newest one.
const history = [
  c('2026-10-22T09:00:00Z', app),
  c('2026-10-21T18:00:00Z', kb),
  c('2026-10-21T08:00:00Z', kb),
  c('2026-10-20T08:00:00Z', kb),
];

describe('Knowledge Base version (TR-6, US-4)', () => {
  it('is the date of the newest KB merge, with .2 for the second one that day', () => {
    expect(knowledgeVersion(history)).toBe('2026.10.21.2');
  });
  it('has no suffix for the only KB merge that day', () => {
    expect(knowledgeVersion(history.slice(2))).toBe('2026.10.21');
  });
  it('is 0000.00.00 before any KB change', () => {
    expect(knowledgeVersion([c('2026-10-17T00:00:00Z', app)])).toBe(NO_KNOWLEDGE);
  });
  it('adds +pr57 on a Preview whose PR changes the Knowledge Base', () => {
    expect(knowledgeVersion(history, { prChangesKnowledge: 57 })).toBe('2026.10.21.2+pr57');
  });
  it('adds +local on a local build with uncommitted KB changes', () => {
    expect(knowledgeVersion(history, { localDirty: true })).toBe('2026.10.21.2+local');
  });
  it('is a pure function of history: same input, same version', () => {
    expect(knowledgeVersion(history)).toBe(knowledgeVersion([...history]));
  });
});

describe('BuildInfo (TR-4, US-4)', () => {
  const base = {
    commit: '3f9c2ab0000000000000000000000000000000ff',
    commitDate: '2026-10-21T14:05:09+02:00',
    knowledge: '2026.10.21.2',
    upstream: UPSTREAM,
  };
  it('carries every field Report this and Suggestions need', () => {
    const info = buildInfo({ ...base, channel: 'production' });
    expect(info).toEqual({
      schema: 1,
      app: '2026.10.21-3f9c2ab',
      commit: base.commit,
      builtFrom: '2026-10-21T12:05:09Z',
      channel: 'production',
      knowledge: '2026.10.21.2',
      parsers: {
        toolboxCommit: '6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1',
        toolboxVersion: '3.3.96',
        gameVersion: '2.3.540',
      },
    });
  });
  it('sets pr only on previews', () => {
    expect(buildInfo({ ...base, channel: 'preview', pr: 57 }).pr).toBe(57);
    expect(buildInfo({ ...base, channel: 'production', pr: 57 }).pr).toBeUndefined();
  });
  it('marks dirty local builds', () => {
    expect(buildInfo({ ...base, channel: 'local', dirty: true }).app).toBe('2026.10.21-3f9c2ab-dirty');
  });
  it('stays under 1 KB as version.json', () => {
    expect(JSON.stringify(buildInfo({ ...base, channel: 'preview', pr: 99999 })).length).toBeLessThan(1024);
  });
});
