// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import type { SaveKind } from '@idleon-forge/sync';
import { render } from '@testing-library/react';
import { preloadParts } from '../src/lazy-part';
import { type NowSave, Shell as NowScreen, type ShellProps as NowScreenProps } from '../src/shell/Shell';

// The lazy views (tabs, places, System page bodies; lazy-part.tsx) render synchronously once loaded,
// so every test file that renders the shell loads them first.
await preloadParts();

// jsdom gives import.meta.url an http scheme; the file's directory is still known.
const FIXTURES = `${path.resolve(import.meta.dirname, '../../../packages/engine/test/now/fixtures')}/`;

/** A synthetic view fixture (packages/engine/test/now/fixtures), with its times moved to `now`. */
export function fixture(id: string, now = Date.now()): EngineResult {
  const r = JSON.parse(readFileSync(`${FIXTURES}${id}.json`, 'utf8')) as EngineResult;
  const shift = now - r.asOf;
  const move = (t: number | null) => (t === null ? null : t + shift);
  r.asOf = now;
  r.sessionStartedAt = move(r.sessionStartedAt);
  if (r.firstFill) r.firstFill.at += shift;
  for (const c of r.characters) {
    for (const d of c.doneThisSession) d.confirmedAt += shift;
    if (c.firstFill) c.firstFill.at += shift;
  }
  return r;
}

export const stateFor = (r: EngineResult, savedAgoMs = 30_000): AccountState =>
  ({
    asOf: r.asOf,
    account: {
      lastCloudSave: r.asOf - savedAgoMs,
      accountLevel: 200,
      gameVersion: { serverBuild: 142, saveVersion: 1, parserTarget: '2.3.540' },
    },
    characters: r.characters.map((c) => ({ index: c.index, name: c.name })),
    lastPlayedCharacterIndex: null,
    diagnostics: { unreadableCharacters: [] },
  }) as unknown as AccountState;

export function saveOf(
  r: EngineResult,
  seq: number,
  kind: SaveKind,
  slot: number | null,
  source: 'live' | 'paste' = 'live',
  savedAgoMs = 30_000,
): NowSave {
  return { state: stateFor(r, savedAgoMs), source, seq, kind, slot };
}

export function props(r: EngineResult, save: NowSave, over: Partial<NowScreenProps> = {}): NowScreenProps {
  return {
    result: r,
    save,
    namespace: 'activeon:test:',
    expectedReturnSeconds: r.expectedReturn.usedSeconds,
    setExpectedReturn: () => {},
    updating: false,
    connection: null,
    update: null,
    parserBehind: false,
    onReload: () => {},
    onFooter: () => {},
    ...over,
  };
}

export const renderNow = (p: NowScreenProps) => render(<NowScreen {...p} />);
