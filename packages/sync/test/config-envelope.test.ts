// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { describe, expect, it } from 'vitest';
import { ENV, readSyncConfig } from '../src/config';
import { assembleEnvelope, type SideReads } from '../src/envelope';

const full = {
  [ENV.firebaseApiKey]: 'test-key',
  [ENV.firebaseAuthDomain]: 'example.firebaseapp.com',
  [ENV.firebaseDatabaseUrl]: 'example.firebaseio.com',
  [ENV.firebaseProjectId]: 'example',
  [ENV.googleClientId]: 'test-client',
  [ENV.googleClientSecret]: 'test-secret',
};

describe('readSyncConfig', () => {
  it('reads every value and normalizes the database URL', () => {
    const result = readSyncConfig(full);
    expect(result).toEqual({
      ok: true,
      config: {
        firebase: {
          apiKey: 'test-key',
          authDomain: 'example.firebaseapp.com',
          databaseURL: 'https://example.firebaseio.com',
          projectId: 'example',
        },
        google: { clientId: 'test-client', clientSecret: 'test-secret' },
      },
    });
  });

  it('lists what is missing, treating blanks as missing', () => {
    const result = readSyncConfig({
      ...full,
      [ENV.googleClientSecret]: '  ',
      [ENV.firebaseApiKey]: undefined,
    });
    expect(result).toEqual({ ok: false, missing: [ENV.firebaseApiKey, ENV.googleClientSecret] });
  });
});

describe('assembleEnvelope', () => {
  const reads: SideReads = {
    cloudsave: { Lv0_0: '[1]', Guild: '{"a":1}' },
    charNames: { 0: 'Alpha', 1: 'Beta' },
    serverVars: { GameVERSION: 141 },
    companion: { l: [] },
    guildId: 'g1',
    guild: { m: { x: { n: 'member' } }, p: 42 },
    tournamentUser: null,
    tournamentMatch: { r: 1 },
    tournamentGlobal: { S: 3 },
    accountCreateTime: 1_600_000_000_000,
    capturedAt: 1_800_000_000_000,
  };

  it('shapes side reads the way Toolbox passes them to parseData', () => {
    expect(assembleEnvelope(reads)).toEqual({
      data: reads.cloudsave,
      charNames: ['Alpha', 'Beta'],
      companion: { l: [] },
      guildData: { id: 'g1', stats: { a: 1 }, members: [{ n: 'member' }], points: 42 },
      serverVars: { GameVERSION: 141 },
      accountCreateTime: 1_600_000_000_000,
      tournament: { user: null, match: { r: 1 }, global: { S: 3 }, leaderboard: [] },
      lastUpdated: 1_800_000_000_000,
    });
  });

  it('tolerates missing side data', () => {
    const env = assembleEnvelope({
      ...reads,
      guildId: null,
      guild: null,
      serverVars: null,
      accountCreateTime: null,
    });
    expect(env.guildData).toEqual({ id: null, stats: { a: 1 }, members: [], points: undefined });
    expect(env).not.toHaveProperty('serverVars');
    expect(env).not.toHaveProperty('accountCreateTime');
  });
});
