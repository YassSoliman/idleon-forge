// SPDX-License-Identifier: GPL-3.0-only
// The shared schema (M13 TR-3, FR-3, FR-6): strict keys, code-point limits, enum-like report values.

import { describe, expect, it } from 'vitest';
import {
  codePoints,
  validateDetailsRequest,
  validateMineRequest,
  validateSuggestionRequest,
} from '../src/validate';
import { suggestion } from './helpers';

const valid = () => ({ ...suggestion(), proof: 'a.b.c' });

describe('validateSuggestionRequest', () => {
  it('accepts a full request', () => {
    expect(validateSuggestionRequest(valid()).ok).toBe(true);
  });

  it('enforces the I want… minimum and every maximum (US-1)', () => {
    const r = valid();
    r.text.iWant = '123456789';
    expect(validateSuggestionRequest(r)).toEqual({ ok: false, field: 'text.iWant' });
    r.text.iWant = '          ';
    expect(validateSuggestionRequest(r)).toEqual({ ok: false, field: 'text.iWant' });
    for (const [k, max] of [
      ['whenIm', 280],
      ['iWant', 600],
      ['soThat', 400],
      ['example', 1500],
    ] as const) {
      const ok = valid();
      ok.text[k] = 'x'.repeat(max);
      expect(validateSuggestionRequest(ok).ok).toBe(true);
      const over = valid();
      over.text[k] = 'x'.repeat(max + 1);
      expect(validateSuggestionRequest(over)).toEqual({ ok: false, field: `text.${k}` });
    }
  });

  it('counts code points, not UTF-16 units', () => {
    expect(codePoints('🙂🙂')).toBe(2);
    const r = valid();
    r.text.iWant = '🙂'.repeat(600);
    expect(validateSuggestionRequest(r).ok).toBe(true);
  });

  it('rejects unknown keys at every level, so nothing unseen is sent', () => {
    expect(validateSuggestionRequest({ ...valid(), email: 'x' })).toEqual({ ok: false, field: 'email' });
    const r = valid() as unknown as { context: Record<string, unknown> };
    r.context.charNames = ['A'];
    expect(validateSuggestionRequest(r)).toEqual({ ok: false, field: 'context.charNames' });
  });

  it('requires a v4 UUID clientId and a known type', () => {
    expect(validateSuggestionRequest({ ...valid(), clientId: 'abc' })).toEqual({
      ok: false,
      field: 'clientId',
    });
    expect(validateSuggestionRequest({ ...valid(), type: 'bug' })).toEqual({ ok: false, field: 'type' });
  });

  it('accepts enum-like report values and rejects free-text ones', () => {
    const r = valid();
    r.context.report = {
      outputKind: 'higher-leverage',
      renderedText: 'Wizard lv 72: move to Bandit Bob',
      entryIds: ['leverage.check.move'],
      detectorIds: [],
      fieldPaths: ['account.characters[1].afkTarget'],
      stale: false,
      contested: true,
      optionId: 'move:1:w2.bandit-bob',
      values: { killsPerHour: 1234.5678, hasTalent: true, map: 'w2_bandit_bob' },
    };
    expect(validateSuggestionRequest(r).ok).toBe(true);
    const bad = structuredClone(r);
    if (bad.context.report?.values) bad.context.report.values.map = 'My Char Name';
    expect(validateSuggestionRequest(bad)).toEqual({ ok: false, field: 'context.report.values.map' });
    const many = structuredClone(r);
    if (many.context.report)
      many.context.report.values = Object.fromEntries([...Array(41)].map((_, i) => [`k${i}`, i]));
    expect(validateSuggestionRequest(many)).toEqual({ ok: false, field: 'context.report.values' });
  });

  it('accepts the field patterns Detectors declare, like characters[*].afkType', () => {
    const r = valid();
    r.context.report = {
      outputKind: 'verdict-blocker',
      renderedText: 'Squire lv 85: set an AFK target',
      entryIds: ['afk.check.no-afk-target'],
      detectorIds: ['afk/no-afk-target'],
      fieldPaths: ['characters[*].afkType', 'account.lastCloudSave'],
      stale: false,
      contested: false,
    };
    expect(validateSuggestionRequest(r).ok).toBe(true);
    if (r.context.report) r.context.report.entryIds = ['afk.check.*'];
    expect(validateSuggestionRequest(r)).toEqual({ ok: false, field: 'context.report.entryIds.0' });
  });

  it('rejects non-finite numbers and a wrong schema version', () => {
    const r = valid() as unknown as { context: Record<string, unknown> };
    r.context.schema = 2;
    expect(validateSuggestionRequest(r)).toEqual({ ok: false, field: 'context.schema' });
    const n = valid();
    n.context.saveAgeSeconds = -1;
    expect(validateSuggestionRequest(n)).toEqual({ ok: false, field: 'context.saveAgeSeconds' });
  });

  it('allows the broken-parse context (nulls, screen other)', () => {
    const r = valid();
    r.type = 'wrong';
    r.context = { ...r.context, gameBuild: null, stage: null, saveAgeSeconds: null, screen: 'other' };
    expect(validateSuggestionRequest(r).ok).toBe(true);
  });
});

describe('mine and details', () => {
  it('validates the small bodies', () => {
    expect(validateMineRequest({ proof: 'a.b.c' }).ok).toBe(true);
    expect(validateMineRequest({ proof: 'a.b.c', extra: 1 }).ok).toBe(false);
    const d = { clientId: crypto.randomUUID(), text: 'World 2', turnstileToken: 't', proof: 'p' };
    expect(validateDetailsRequest(d).ok).toBe(true);
    expect(validateDetailsRequest({ ...d, text: 'x'.repeat(1501) })).toEqual({ ok: false, field: 'text' });
    expect(validateDetailsRequest({ ...d, text: '' })).toEqual({ ok: false, field: 'text' });
  });
});
