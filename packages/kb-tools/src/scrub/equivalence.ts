// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Parse equivalence (TR-14 step 6): Toolbox's FULL parseData output of the original and of the
// scrubbed export, with the same `now`, seeded Math.random and TZ=UTC, must be deep-equal after
// applying the pseudonym map, outside the declared SCRUBBED_OUTPUT_PATHS. An Account State contract
// test (test/scrub.test.ts) fails if any Account State field is derived from a path on that list.
import { parseExport } from '../parse';
import { OPTLACC_STRING_KEEP, SERVER_VARS_KEEP } from './policy';
import type { NameMaps, ScrubResult } from './scrub';

const keptVars = Object.keys(SERVER_VARS_KEEP).join('|');
const keptSlots = Object.entries(OPTLACC_STRING_KEEP)
  .filter(([, p]) => p !== 'blank')
  .map(([i]) => i)
  .join('|');

/**
 * Output paths where a difference is the scrub doing its job: identities and third-party text Toolbox
 * copies into its output. Each is a regex over output paths (`account.x.y[3]`).
 */
export const SCRUBBED_OUTPUT_PATHS: readonly RegExp[] = [
  /^account\.guild\.(id|name)$/, // guild identity
  /^account\.guild\.members\[\d+\]\.b$/, // member free text
  /^account\.tournament\.leaderboard(\[|$)/, // other players
  // Blanked serverVars keys and OptLacc slots (never a reviewed one); narrowed per export in allowedPaths.
  new RegExp(`^account\\.serverVars\\.(?!(?:${keptVars})(?:\\.|\\[|$))`),
  new RegExp(`^account\\.accountOptions\\[(?!(?:${keptSlots})\\])\\d+\\]$`),
];

/** The declared paths, narrowed to what this scrub actually blanked. */
export function allowedPaths(result: Pick<ScrubResult, 'blanked'>): RegExp[] {
  const vars = result.blanked.serverVars.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const opts = result.blanked.optLacc;
  return [
    ...SCRUBBED_OUTPUT_PATHS.slice(0, 3),
    ...(vars.length ? [new RegExp(`^account\\.serverVars\\.(${vars.join('|')})(\\.|\\[|$)`)] : []),
    ...(opts.length ? [new RegExp(`^account\\.accountOptions\\[(${opts.join('|')})\\]$`)] : []),
  ];
}

/** The original parse with every name replaced by its pseudonym (exact strings and `Player_<name>`). */
export function applyNames(v: unknown, names: NameMaps): unknown {
  const map = (s: string): string => {
    const hit = names.chars.get(s) ?? names.others.get(s);
    if (hit) return hit;
    if (s.startsWith('Player_')) {
      const inner = names.chars.get(s.slice(7)) ?? names.others.get(s.slice(7));
      if (inner) return `Player_${inner}`;
    }
    return s;
  };
  // Whole tokens of delimited strings too: Toolbox copies names into CSV (cogstruction cogData), the
  // friend list (`stat,level,name;...`) and JSON-encoded tournament records.
  if (typeof v === 'string')
    return /[,;\n"]/.test(v)
      ? v
          .split(/([,;\n"])/)
          .map(map)
          .join('')
      : map(v);
  if (Array.isArray(v)) return v.map((x) => applyNames(x, names));
  if (v && typeof v === 'object')
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [map(k), applyNames(x, names)]));
  return v;
}

/** Every path where `a` and `b` differ (leaves, or a type/shape mismatch), at most `limit`. */
export function diffPaths(a: unknown, b: unknown, path = '', out: string[] = [], limit = 200): string[] {
  if (out.length >= limit) return out;
  if (Object.is(a, b)) return out;
  if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return out;
  const bothArrays = Array.isArray(a) && Array.isArray(b);
  const bothObjects =
    !!a && !!b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b);
  if (bothArrays) {
    const x = a as unknown[];
    const y = b as unknown[];
    if (x.length !== y.length) out.push(`${path} (length ${x.length} vs ${y.length})`);
    for (let i = 0; i < Math.min(x.length, y.length); i++) diffPaths(x[i], y[i], `${path}[${i}]`, out, limit);
    return out;
  }
  if (bothObjects) {
    const x = a as Record<string, unknown>;
    const y = b as Record<string, unknown>;
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)]))
      diffPaths(x[k], y[k], path ? `${path}.${k}` : k, out, limit);
    return out;
  }
  out.push(path);
  return out;
}

export interface Equivalence {
  ok: boolean;
  /** Differing output paths outside the declared list (first ones). */
  differences: string[];
  /** Differing paths the declared list allowed. */
  allowed: number;
}

/** Parses both exports at `now` and compares them (TR-14 step 6). */
export function parseEquivalence(
  original: Record<string, unknown>,
  scrubbed: Record<string, unknown>,
  result: Pick<ScrubResult, 'names' | 'blanked'>,
  now: number,
): Equivalence {
  const a = parseExport(original, now);
  const b = parseExport(scrubbed, now);
  const expected = applyNames(
    { account: a.account, characters: a.characters, failedSections: a.failedSections, error: a.error },
    result.names,
  );
  const actual = {
    account: b.account,
    characters: b.characters,
    failedSections: b.failedSections,
    error: b.error,
  };
  const allow = allowedPaths(result);
  const all = diffPaths(expected, actual, '', [], 5000).map((p) => p.replace(/ \(length.*$/, ''));
  const differences = all.filter((p) => !allow.some((r) => r.test(p)));
  return {
    ok: differences.length === 0,
    differences: differences.slice(0, 20),
    allowed: all.length - differences.length,
  };
}
