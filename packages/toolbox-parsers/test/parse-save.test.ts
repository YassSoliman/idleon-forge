// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  InvalidSaveInputError,
  normalizeEnvelope,
  parseEnvelopeText,
  parseSave,
  upstream,
  verifiedBuilds,
  withFrozenClock,
} from '@idleon-forge/toolbox-parsers';
import { describe, expect, it, vi } from 'vitest';
import { finalFailures, truncateMessage } from '../src/section-outcomes';

const fixture = (name: string): unknown =>
  JSON.parse(
    readFileSync(
      fileURLToPath(new URL(`../../account-state/fixtures/public/${name}`, import.meta.url)),
      'utf8',
    ),
  );
const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const NOW = Date.UTC(2026, 9, 17, 12);

describe('upstream pin', () => {
  it('is baked into the bundle from the UPSTREAM file', () => {
    const file = readFileSync(fileURLToPath(new URL('../UPSTREAM', import.meta.url)), 'utf8');
    expect(file).toContain(`commit=${upstream.commit}`);
    expect(upstream.gameVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('parseSave', () => {
  const envelope = normalizeEnvelope(fixture('fresh.json'));

  it('parses a public save into a non-empty account', () => {
    const parsed = parseSave(envelope, { now: NOW });
    expect(Object.keys(parsed.account).length).toBeGreaterThan(50);
    expect(parsed.characters.length).toBeGreaterThan(0);
    expect(parsed.failedSections).toEqual([]);
    expect(parsed.error).toBeNull();
    expect(parsed.meta.now).toBe(NOW);
  });

  it('is deterministic for the same save and the same now', () => {
    expect(hash(parseSave(envelope, { now: NOW }))).toBe(hash(parseSave(envelope, { now: new Date(NOW) })));
  });

  it('freezes the clock: a different now changes time-based output', () => {
    expect(hash(parseSave(envelope, { now: NOW }))).not.toBe(
      hash(parseSave(envelope, { now: NOW + 3_600_000 })),
    );
  });

  it('restores the real Date afterwards', () => {
    const RealDate = Date;
    parseSave(envelope, { now: NOW });
    expect(Date).toBe(RealDate);
    expect(Date.now()).not.toBe(NOW);
  });

  it('does not throw on a save it cannot read', () => {
    const parsed = parseSave(
      { data: { CharacterClass_0: 'not a class', PlayerAwayTime_0: {} } },
      { now: NOW },
    );
    expect(parsed.characters.filter((c) => c.class)).toEqual([]);
  });

  it('rejects an invalid now', () => {
    expect(() => parseSave(envelope, { now: Number.NaN })).toThrow(TypeError);
  });
});

describe('failed sections', () => {
  const base = normalizeEnvelope(fixture('first.json'));
  const withData = (patch: Record<string, unknown>) => ({ ...base, data: { ...base.data, ...patch } });

  it('lists a section that fails in every pass once (alchemy runs in all three passes)', () => {
    const parsed = parseSave(withData({ CauldronInfo: 5 }), { now: NOW });
    expect(parsed.failedSections).toEqual(['alchemy']);
  });

  it('lists a one-pass section once (obols)', () => {
    const parsed = parseSave(withData({ ObolEqO1: 5 }), { now: NOW });
    expect(parsed.failedSections).toEqual(['obols']);
  });

  it('keeps the section messages, which dump the error, out of the console', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      parseSave(withData({ CauldronInfo: 5 }), { now: NOW });
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('reports a section only when its last run failed', () => {
    expect(
      finalFailures([
        ['recovers', false],
        ['always', false],
        ['fine', true],
        ['recovers', true],
        ['always', false],
        ['recovers', true],
        ['always', false],
      ]),
    ).toEqual(['always']);
    expect(
      finalFailures([
        ['late', true],
        ['late', true],
        ['late', false],
      ]),
    ).toEqual(['late']);
  });
});

describe('console hygiene (TR-23)', () => {
  it('truncates passed-through messages to 200 characters of text', () => {
    expect(truncateMessage('x'.repeat(500))).toHaveLength(200);
    expect(truncateMessage(new Error('boom'))).toBe('boom');
    expect(truncateMessage({ save: 'secret' })).toBe('[object Object]');
  });

  it('truncates the top-level parse error', () => {
    const save = normalizeEnvelope(fixture('first.json'));
    const { EquipOrder_0: _drop, ...data } = save.data;
    const parsed = parseSave({ ...save, data }, { now: NOW });
    expect(parsed.error).toEqual(expect.any(String));
    expect(parsed.error?.length).toBeLessThanOrEqual(200);
  });
});

describe('verifiedBuilds', () => {
  it('matches the public fixtures that parse cleanly at this pin (re-run scripts/verified-builds.mjs)', () => {
    let serverBuild = 0;
    let saveVersion = 0;
    for (const name of readdirSync(
      fileURLToPath(new URL('../../account-state/fixtures/public/', import.meta.url)),
    )) {
      if (!name.endsWith('.json')) continue;
      const env = normalizeEnvelope(fixture(name));
      const parsed = parseSave(env, { now: NOW });
      if (parsed.failedSections.length || parsed.error || !Object.keys(parsed.account).length) continue;
      serverBuild = Math.max(serverBuild, Number(env.serverVars?.GameVERSION) || 0);
      saveVersion = Math.max(saveVersion, parsed.meta.saveVersion ?? 0);
    }
    expect(verifiedBuilds).toEqual({ serverBuild, saveVersion });
    expect(serverBuild).toBeGreaterThan(0);
  });

  it('names the parser commit in every parse', () => {
    const parsed = parseSave(normalizeEnvelope(fixture('fresh.json')), { now: NOW });
    expect(parsed.meta.parserCommit).toBe(upstream.commit);
  });
});

describe('withFrozenClock', () => {
  it('freezes new Date(), Date.now() and Date(), but not explicit dates', () => {
    withFrozenClock(NOW, () => {
      expect(Date.now()).toBe(NOW);
      // biome-ignore lint/complexity/useDateNow: testing the constructor path on purpose.
      expect(new Date().getTime()).toBe(NOW);
      expect(Date()).toBe(new Date(NOW).toString());
      expect(new Date(0).getTime()).toBe(0);
      expect(new Date() instanceof Date).toBe(true);
    });
  });
});

describe('normalizeEnvelope', () => {
  it('accepts a full "Copy for support" envelope', () => {
    const env = normalizeEnvelope(fixture('toolbox-raw.json'));
    expect(env.charNames?.length).toBeGreaterThan(0);
    expect(env.serverVars).toBeDefined();
    expect(typeof env.lastUpdated).toBe('number');
  });

  it('wraps a bare save', () => {
    const bare = (fixture('fresh.json') as { data: Record<string, unknown> }).data;
    expect(normalizeEnvelope(bare)).toEqual({ data: bare });
  });

  it.each([null, [], 'save', {}, { data: {} }])('rejects %j', (input) => {
    expect(() => normalizeEnvelope(input)).toThrow(InvalidSaveInputError);
  });

  it('gives a readable error for text that is not JSON', () => {
    expect(() => parseEnvelopeText('{oops')).toThrow('not valid JSON');
  });
});
