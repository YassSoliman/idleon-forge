// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// "Game updated, parser not caught up" (M1 FR-29, D3 option b, US-9).
import type { AccountState } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { patchStatus, saveOutcome } from '../src';

const verified = { serverBuild: 142, saveVersion: 34.05 };
const build = (serverBuild: number | null, saveVersion: number | null = 34.05) => ({
  serverBuild,
  saveVersion,
});

describe('patchStatus (US-9)', () => {
  it('build 143 with failed sections: the banner shows', () => {
    expect(patchStatus({ build: build(143), outcome: 'partial', verified })).toEqual({
      newer: true,
      parserBehind: true,
    });
  });

  it('build 142 with a failed section on a fresh browser: no banner (the build is not new)', () => {
    expect(patchStatus({ build: build(142), outcome: 'partial', verified, cleanBuilds: [] })).toEqual({
      newer: false,
      parserBehind: false,
    });
  });

  it('build 143 that parses cleanly: no banner, only the footer note', () => {
    expect(patchStatus({ build: build(143), outcome: 'clean', verified })).toEqual({
      newer: true,
      parserBehind: false,
    });
  });

  it('a hard failure on a newer build shows the banner', () => {
    expect(patchStatus({ build: build(143), outcome: 'failed', verified }).parserBehind).toBe(true);
  });

  it('a newer save format counts too', () => {
    expect(patchStatus({ build: build(142, 35.01), outcome: 'partial', verified }).parserBehind).toBe(true);
  });

  it('a build this browser already parsed cleanly at this pin is not new', () => {
    const r = patchStatus({ build: build(143), outcome: 'partial', verified, cleanBuilds: [build(143)] });
    expect(r.newer).toBe(false);
  });

  it('an unknown build is never new', () => {
    expect(patchStatus({ build: build(null, null), outcome: 'failed', verified }).newer).toBe(false);
    expect(patchStatus({ build: null, outcome: 'failed', verified }).newer).toBe(false);
  });
});

describe('saveOutcome', () => {
  const diag = (over: Partial<AccountState['diagnostics']>) =>
    ({
      diagnostics: {
        failedSections: [],
        unknownFields: [],
        unreadableCharacters: [],
        ...over,
      },
    }) as unknown as AccountState;

  it('is partial for failed sections, unknown fields or an unreadable character', () => {
    expect(saveOutcome(diag({}))).toBe('clean');
    expect(saveOutcome(diag({ failedSections: ['obols'] }))).toBe('partial');
    expect(saveOutcome(diag({ unknownFields: ['characters[0].afkTarget'] }))).toBe('partial');
    expect(saveOutcome(diag({ unreadableCharacters: [2] }))).toBe('partial');
  });

  it('ignores a missing server build (a failed side read, not a parser problem)', () => {
    expect(saveOutcome(diag({ unknownFields: ['account.gameVersion.serverBuild'] }))).toBe('clean');
  });
});
