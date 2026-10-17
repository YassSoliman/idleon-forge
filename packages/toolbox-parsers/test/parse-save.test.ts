// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  InvalidSaveInputError,
  normalizeEnvelope,
  parseEnvelopeText,
  parseSave,
  upstream,
  withFrozenClock,
} from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';

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
