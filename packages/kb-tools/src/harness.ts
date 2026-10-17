// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Detector example harness (M11 FR-11, FR-12, TR-4 rules, TR-5): runs every declared example on
// its fixture and checks the declared outcome, determinism (twice, deep-equal), purity (no Date,
// Math.random or performance), declared `reads` (a recording proxy) and defensiveness (a state with
// every optional field removed must never fire).
import { isDeepStrictEqual } from 'node:util';
import type { AccountState } from '@idleon-forge/account-state';
import { FIELD_SOURCES } from '@idleon-forge/account-state';
import {
  type AnyDetector,
  type AnyFinding,
  type CompiledKnowledge,
  type DetectorRegistry,
  type FixtureExample,
  makeContext,
  type Subject,
} from '@idleon-forge/knowledge';
import { fixtureById, stateOf } from './fixtures';

export interface HarnessResult {
  detector: string;
  example: string;
  status: 'pass' | 'fail' | 'skipped';
  message?: string;
}

// ---------- reads: the recording proxy ----------

const normalise = (p: string) => p.replace(/\[\d+\]/g, '[*]');

/** Whether an accessed path is covered by a declared `reads` pattern (ancestor or descendant of one). */
export function covered(accessed: string, reads: readonly string[]): boolean {
  const p = normalise(accessed);
  return reads.some((r0) => {
    const r = normalise(r0);
    return (
      p === r ||
      r.startsWith(`${p}.`) ||
      r.startsWith(`${p}[`) ||
      p.startsWith(`${r}.`) ||
      p.startsWith(`${r}[`)
    );
  });
}

/** Wraps `value` so every property path read through it is added to `seen` ("characters[*].afkType"). */
export function recording<T>(value: T, seen: Set<string>, base = ''): T {
  if (value === null || typeof value !== 'object') return value;
  const isArray = Array.isArray(value);
  return new Proxy(value as object, {
    get(target, prop, receiver) {
      const v = Reflect.get(target, prop, receiver);
      if (typeof prop === 'symbol') return v;
      let path: string;
      if (isArray) {
        if (/^\d+$/.test(prop)) path = `${base}[*]`;
        else {
          // length, map, filter...: reading the array itself. Methods run through this proxy, so the
          // elements they touch are recorded too.
          if (base) seen.add(base);
          return typeof v === 'function' ? v.bind(receiver) : v;
        }
      } else path = base ? `${base}.${prop}` : prop;
      seen.add(path);
      return recording(v, seen, path);
    },
    has(target, prop) {
      if (typeof prop === 'string') seen.add(isArray ? base || prop : base ? `${base}.${prop}` : prop);
      return Reflect.has(target, prop);
    },
    ownKeys(target) {
      if (base) seen.add(base);
      return Reflect.ownKeys(target);
    },
  }) as T;
}

// ---------- purity ----------

/** Runs `fn` with Date, Math.random and performance replaced by functions that throw (FR-12). */
export function withoutClock<T>(fn: () => T): T {
  const g = globalThis as Record<string, unknown>;
  const realDate = g.Date;
  const realRandom = Math.random;
  const realPerf = g.performance;
  const thrower = (what: string) => () => {
    throw new Error(`Detectors must not use ${what} (use ctx.now)`);
  };
  g.Date = new Proxy(() => {}, {
    construct: thrower('Date'),
    apply: thrower('Date'),
    get: (_t, prop) => (prop === 'now' ? thrower('Date.now') : undefined),
  });
  Math.random = thrower('Math.random');
  Object.defineProperty(globalThis, 'performance', {
    value: { now: thrower('performance.now') },
    configurable: true,
    writable: true,
  });
  try {
    return fn();
  } finally {
    g.Date = realDate;
    Math.random = realRandom;
    Object.defineProperty(globalThis, 'performance', { value: realPerf, configurable: true, writable: true });
  }
}

// ---------- the hollow state ----------

const KEEP = new Set(['index', 'name', 'class', 'level', 'schemaVersion', 'asOf', 'parserTarget']);

/** A copy of `state` with every optional field removed (null, or empty for lists) and reported unknown. */
export function hollow(state: AccountState): AccountState {
  const empty = (v: unknown, key: string): unknown => {
    if (KEEP.has(key)) return v;
    if (Array.isArray(v)) return [];
    if (v && typeof v === 'object')
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, empty(x, k)]));
    return null;
  };
  const characters = state.characters.map(
    (c) =>
      Object.fromEntries(
        Object.entries(c).map(([k, v]) => [k, empty(v, k)]),
      ) as unknown as AccountState['characters'][number],
  );
  const unknownFields = Object.keys(FIELD_SOURCES).flatMap((f) =>
    f.startsWith('characters[]')
      ? characters.map((c) => f.replace('characters[]', `characters[${c.index}]`))
      : [f],
  );
  return {
    ...state,
    account: empty(state.account, 'account') as AccountState['account'],
    characters,
    lastPlayedCharacterIndex: null,
    diagnostics: { ...state.diagnostics, unknownFields: unknownFields.sort() },
  };
}

// ---------- outcomes ----------

const sameSubject = (a: Subject, b: Subject) =>
  a.kind === b.kind && (a.kind === 'account' || (b.kind === 'character' && a.index === b.index));

type Outcome = 'fires' | 'silent' | 'unknown';

/** The outcome of one finding, in fires / silent / unknown terms, per Detector kind. */
export function outcomeOf(kind: AnyDetector['kind'], f: AnyFinding): Outcome | null {
  const x = f as Record<string, unknown>;
  switch (kind) {
    case 'check':
      return x.result === 'fires' ? 'fires' : x.result === 'unknown' ? 'unknown' : 'silent';
    case 'milestone':
      return x.reached === 'yes' ? 'fires' : x.reached === 'unknown' ? 'unknown' : 'silent';
    case 'contribution':
      return x.advances === 'yes' ? 'fires' : x.advances === 'unknown' ? 'unknown' : 'silent';
    case 'acquisition':
      return x.owned === 'yes' ? 'fires' : x.owned === 'unknown' ? 'unknown' : 'silent';
    case 'progress':
      return x.value === null ? 'unknown' : 'fires';
    default:
      return null;
  }
}

const matches = (actual: unknown, expected: unknown): boolean => {
  if (expected && typeof expected === 'object' && !Array.isArray(expected))
    return (
      !!actual &&
      typeof actual === 'object' &&
      Object.entries(expected).every(([k, v]) => matches((actual as Record<string, unknown>)[k], v))
    );
  return isDeepStrictEqual(actual, expected);
};

function judge(
  d: AnyDetector,
  want: Outcome,
  ex: FixtureExample,
  findings: readonly AnyFinding[],
): string | null {
  const relevant = ex.subject
    ? findings.filter((f) => sameSubject((f as { subject: Subject }).subject, ex.subject as Subject))
    : findings;
  const outcomes = relevant.map((f) => outcomeOf(d.kind, f));
  if (want === 'fires' && !outcomes.includes('fires'))
    return `expected it to fire, got ${outcomes.join(', ') || 'nothing'}`;
  if (want === 'silent' && (outcomes.includes('fires') || outcomes.includes('unknown')))
    return `expected silent, got ${outcomes.join(', ')}`;
  if (want === 'unknown' && !outcomes.includes('unknown'))
    return `expected unknown, got ${outcomes.join(', ') || 'nothing'}`;
  if (ex.expect) {
    const hit = relevant.find((f) => matches(f, ex.expect));
    if (!hit) return `no finding matches expect ${JSON.stringify(ex.expect)}`;
  }
  return null;
}

// ---------- the run ----------

export interface HarnessOptions {
  kb: Pick<CompiledKnowledge, 'entries' | 'facts'> | null;
  /** Report private examples as skipped even when the save is present (CI parity). */
  skipPrivate?: boolean;
}

const labelOf = (want: string, i: number, ex: FixtureExample) =>
  `${want}[${i}] ${ex.fixture}${ex.mutate ? ' (mutated)' : ''}`;

/** Declaration rules (FR-11, TR-5) that need no fixture. */
export function declarationProblems(d: AnyDetector): string[] {
  const p: string[] = [];
  const { fires, silent } = d.examples;
  if (d.kind === 'engine') return p;
  if (fires.length === 0) p.push(`detector ${d.id}: needs at least one fires example`);
  if (d.kind !== 'progress' && silent.length === 0)
    p.push(`detector ${d.id}: needs at least one silent example`);
  if (![...fires, ...silent].some((e) => !e.mutate))
    p.push(`detector ${d.id}: at least one fires or silent example must be a real save (no mutate)`);
  if (d.kind === 'progress' && !fires.some((e) => !e.mutate && e.expect && 'value' in e.expect))
    p.push(`detector ${d.id}: a progress Detector needs expect: { value } on at least one real fixture`);
  if (d.reads.length === 0) p.push(`detector ${d.id}: declares no reads`);
  return p;
}

/** Runs every example of every Detector in `registry`. */
export function runHarness(registry: DetectorRegistry, opts: HarnessOptions): HarnessResult[] {
  const results: HarnessResult[] = [];
  for (const d of Object.values(registry)) {
    for (const message of declarationProblems(d))
      results.push({ detector: d.id, example: 'declaration', status: 'fail', message });
    if (d.kind === 'engine') continue;
    let hollowDone = false;
    const groups: [Outcome, readonly FixtureExample[]][] = [
      ['fires', d.examples.fires],
      ['silent', d.examples.silent],
      ['unknown', d.examples.unknown ?? []],
    ];
    for (const [want, list] of groups) {
      list.forEach((ex, i) => {
        const example = labelOf(want, i, ex);
        const f = fixtureById(ex.fixture);
        if (!f || (opts.skipPrivate && f.kind === 'private')) {
          if (ex.fixture.startsWith('private:'))
            results.push({ detector: d.id, example, status: 'skipped', message: 'private fixture absent' });
          else
            results.push({
              detector: d.id,
              example,
              status: 'fail',
              message: `names a missing fixture ${ex.fixture}`,
            });
          return;
        }
        try {
          let state = stateOf(f);
          if (ex.mutate) state = ex.mutate(state);
          const params = d.params.parse(ex.params ?? {});
          const seen = new Set<string>();
          const ctx = makeContext(recording(state, seen), opts.kb, { now: f.now });
          const a = withoutClock(() => d.run(ctx, params));
          const b = withoutClock(() => d.run(makeContext(state, opts.kb, { now: f.now }), params));
          if (!isDeepStrictEqual(a, b))
            throw new Error('not deterministic: two runs on the same input differ');
          const undeclared = [...seen].filter((p) => !covered(p, d.reads)).sort();
          if (undeclared.length > 0)
            throw new Error(`reads undeclared paths: ${undeclared.slice(0, 5).join(', ')}`);
          for (const finding of a) {
            const s = d.slots.safeParse((finding as { slots?: unknown }).slots ?? {});
            if (!s.success)
              throw new Error(
                `a finding's slots don't match the slots schema: ${s.error.issues[0]?.message}`,
              );
          }
          const problem = judge(d, want, ex, a);
          if (problem) throw new Error(problem);
          if (!hollowDone && !ex.mutate) {
            hollowDone = true;
            const h = withoutClock(() =>
              d.run(makeContext(hollow(stateOf(f)), opts.kb, { now: f.now }), params),
            );
            if (h.some((x) => outcomeOf(d.kind, x) === 'fires'))
              throw new Error('fires on a state with every optional field removed (return unknown instead)');
          }
          results.push({ detector: d.id, example, status: 'pass' });
        } catch (e) {
          results.push({ detector: d.id, example, status: 'fail', message: (e as Error).message });
        }
      });
    }
  }
  return results;
}
