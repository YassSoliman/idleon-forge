// SPDX-License-Identifier: GPL-3.0-only
// The one schema for Suggestion requests (M13 TR-1, TR-3, TR-11). Strict: unknown keys are rejected at
// every level, so nothing reaches the Worker that the app's "What gets sent" preview did not show, and
// any field over its limit is rejected, never trimmed. Lengths are Unicode code points.

import {
  type DetailsRequest,
  type MineRequest,
  OUTPUT_KINDS,
  type ReportContext,
  SUGGESTION_TYPES,
  type SuggestionContext,
  type SuggestionRequest,
  TEXT_LIMITS,
} from './contract';

export type Validation<T> = { ok: true; value: T } | { ok: false; field: string };

class Invalid extends Error {
  constructor(readonly field: string) {
    super(`invalid ${field}`);
  }
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
/** String `values` in a report: enum-like ids only (FR-6). */
const VALUE_STRING = /^[a-z0-9_.-]{1,40}$/;
/** Ids and save field paths: game-data identifiers, never free text. */
const ID = /^[A-Za-z0-9_.:/[\]-]{1,160}$/;
const SHORT = /^[A-Za-z0-9_.:+/-]{1,80}$/;

export function codePoints(s: string): number {
  let n = 0;
  for (const _ of s) n++;
  return n;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function obj(v: unknown, field: string, required: readonly string[], optional: readonly string[] = []) {
  if (!isObject(v)) throw new Invalid(field);
  for (const k of Object.keys(v)) {
    if (!required.includes(k) && !optional.includes(k)) throw new Invalid(field ? `${field}.${k}` : k);
  }
  for (const k of required) if (!(k in v)) throw new Invalid(field ? `${field}.${k}` : k);
  return v;
}

function text(v: unknown, field: string, min: number, max: number): string {
  if (typeof v !== 'string') throw new Invalid(field);
  const n = codePoints(v);
  if (n < min || n > max) throw new Invalid(field);
  if (min > 0 && v.trim() === '') throw new Invalid(field);
  return v;
}

function pattern(v: unknown, field: string, re: RegExp): string {
  if (typeof v !== 'string' || !re.test(v)) throw new Invalid(field);
  return v;
}

function oneOf<T extends string>(v: unknown, field: string, options: readonly T[]): T {
  if (typeof v !== 'string' || !options.includes(v as T)) throw new Invalid(field);
  return v as T;
}

function int(v: unknown, field: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) throw new Invalid(field);
  return v;
}

function num(v: unknown, field: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Invalid(field);
  return v;
}

function bool(v: unknown, field: string): boolean {
  if (typeof v !== 'boolean') throw new Invalid(field);
  return v;
}

function ids(v: unknown, field: string, max: number): string[] {
  if (!Array.isArray(v) || v.length > max) throw new Invalid(field);
  return v.map((x, i) => pattern(x, `${field}.${i}`, ID));
}

function report(v: unknown, field: string): ReportContext {
  const r = obj(
    v,
    field,
    ['outputKind', 'renderedText', 'entryIds', 'detectorIds', 'fieldPaths', 'stale', 'contested'],
    ['optionId', 'values'],
  );
  const out: ReportContext = {
    outputKind: oneOf(r.outputKind, `${field}.outputKind`, OUTPUT_KINDS),
    renderedText: text(r.renderedText, `${field}.renderedText`, 0, 1000),
    entryIds: ids(r.entryIds, `${field}.entryIds`, 50),
    detectorIds: ids(r.detectorIds, `${field}.detectorIds`, 50),
    fieldPaths: ids(r.fieldPaths, `${field}.fieldPaths`, 100),
    stale: bool(r.stale, `${field}.stale`),
    contested: bool(r.contested, `${field}.contested`),
  };
  if (r.optionId !== undefined) out.optionId = pattern(r.optionId, `${field}.optionId`, ID);
  if (r.values !== undefined) {
    if (!isObject(r.values)) throw new Invalid(`${field}.values`);
    const entries = Object.entries(r.values);
    if (entries.length > 40) throw new Invalid(`${field}.values`);
    const values: Record<string, number | boolean | string> = {};
    for (const [k, x] of entries) {
      const f = `${field}.values.${k}`;
      if (!ID.test(k)) throw new Invalid(`${field}.values`);
      if (typeof x === 'number') values[k] = num(x, f, -Number.MAX_VALUE, Number.MAX_VALUE);
      else if (typeof x === 'boolean') values[k] = x;
      else values[k] = pattern(x, f, VALUE_STRING);
    }
    out.values = values;
  }
  return out;
}

function context(v: unknown): SuggestionContext {
  const c = obj(
    v,
    'context',
    ['schema', 'build', 'gameBuild', 'stage', 'screen', 'saveAgeSeconds', 'browser'],
    ['character', 'expectedReturnHours', 'report'],
  );
  if (c.schema !== 1) throw new Invalid('context.schema');
  const b = obj(c.build, 'context.build', ['app', 'commit', 'channel', 'knowledge', 'parsers'], ['pr']);
  const p = obj(b.parsers, 'context.build.parsers', ['toolboxCommit', 'toolboxVersion', 'gameVersion']);
  const out: SuggestionContext = {
    schema: 1,
    build: {
      app: pattern(b.app, 'context.build.app', SHORT),
      commit: pattern(b.commit, 'context.build.commit', SHORT),
      channel: oneOf(b.channel, 'context.build.channel', ['production', 'preview', 'local'] as const),
      knowledge: pattern(b.knowledge, 'context.build.knowledge', SHORT),
      parsers: {
        toolboxCommit: pattern(p.toolboxCommit, 'context.build.parsers.toolboxCommit', SHORT),
        toolboxVersion: pattern(p.toolboxVersion, 'context.build.parsers.toolboxVersion', SHORT),
        gameVersion: pattern(p.gameVersion, 'context.build.parsers.gameVersion', SHORT),
      },
    },
    gameBuild: c.gameBuild === null ? null : int(c.gameBuild, 'context.gameBuild', 0, 1e9),
    stage: c.stage === null ? null : pattern(c.stage, 'context.stage', SHORT),
    screen: oneOf(c.screen, 'context.screen', [
      'now',
      'character',
      'account',
      'suggestions',
      'settings',
      'other',
    ] as const),
    saveAgeSeconds:
      c.saveAgeSeconds === null ? null : int(c.saveAgeSeconds, 'context.saveAgeSeconds', 0, 1e10),
    browser: oneOf(c.browser, 'context.browser', ['chrome', 'edge', 'firefox', 'safari', 'other'] as const),
  };
  if (b.pr !== undefined) out.build.pr = int(b.pr, 'context.build.pr', 1, 1e7);
  if (c.character !== undefined) {
    const ch = obj(c.character, 'context.character', ['class', 'level'], ['verdict']);
    out.character = {
      class: pattern(ch.class, 'context.character.class', SHORT),
      level: int(ch.level, 'context.character.level', 0, 10000),
    };
    if (ch.verdict !== undefined) {
      out.character.verdict = oneOf(ch.verdict, 'context.character.verdict', [
        'ready',
        'fix',
        'unknown',
      ] as const);
    }
  }
  if (c.expectedReturnHours !== undefined) {
    out.expectedReturnHours = num(c.expectedReturnHours, 'context.expectedReturnHours', 0, 24 * 30);
  }
  if (c.report !== undefined) out.report = report(c.report, 'context.report');
  return out;
}

function run<T>(fn: () => T): Validation<T> {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, field: e.field };
    throw e;
  }
}

const TOKEN = (v: unknown, field: string) => text(v, field, 1, 4096);

export function validateSuggestionRequest(v: unknown): Validation<SuggestionRequest> {
  return run(() => {
    const r = obj(v, '', ['clientId', 'type', 'text', 'context', 'turnstileToken', 'proof']);
    const t = obj(r.text, 'text', ['whenIm', 'iWant', 'soThat', 'example']);
    const L = TEXT_LIMITS;
    return {
      clientId: pattern(r.clientId, 'clientId', UUID_V4),
      type: oneOf(r.type, 'type', SUGGESTION_TYPES),
      text: {
        whenIm: text(t.whenIm, 'text.whenIm', L.whenIm.min, L.whenIm.max),
        iWant: text(t.iWant, 'text.iWant', L.iWant.min, L.iWant.max),
        soThat: text(t.soThat, 'text.soThat', L.soThat.min, L.soThat.max),
        example: text(t.example, 'text.example', L.example.min, L.example.max),
      },
      context: context(r.context),
      turnstileToken: TOKEN(r.turnstileToken, 'turnstileToken'),
      proof: TOKEN(r.proof, 'proof'),
    };
  });
}

export function validateMineRequest(v: unknown): Validation<MineRequest> {
  return run(() => {
    const r = obj(v, '', ['proof']);
    return { proof: TOKEN(r.proof, 'proof') };
  });
}

export function validateDetailsRequest(v: unknown): Validation<DetailsRequest> {
  return run(() => {
    const r = obj(v, '', ['clientId', 'text', 'turnstileToken', 'proof']);
    return {
      clientId: pattern(r.clientId, 'clientId', UUID_V4),
      text: text(r.text, 'text', TEXT_LIMITS.details.min, TEXT_LIMITS.details.max),
      turnstileToken: TOKEN(r.turnstileToken, 'turnstileToken'),
      proof: TOKEN(r.proof, 'proof'),
    };
  });
}
