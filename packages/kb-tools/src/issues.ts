// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Problems found by `kb check` and friends, printed as `path:line id: message` (TR-8).
import type { z } from 'zod';

export interface Issue {
  level: 'error' | 'warning';
  /** Repo-relative file. */
  file: string;
  line: number;
  id?: string;
  message: string;
  /** Stable code for tests and for `--strict` acknowledgements, e.g. 'hand-copied-fact'. */
  code?: string;
}

export const formatIssue = (i: Issue): string =>
  `${i.level === 'warning' ? 'warning: ' : ''}${i.file}:${i.line}${i.id ? ` ${i.id}` : ''}: ${i.message}`;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** A zod issue as one readable line: "sources must have at least 1 item". */
export function zodMessage(issue: z.core.$ZodIssue, fieldPath: readonly PropertyKey[]): string {
  const field = fieldPath.map(String).join('.') || 'entry';
  switch (issue.code) {
    case 'too_small':
      if (issue.origin === 'array')
        return `${field} must have at least ${plural(Number(issue.minimum), 'item')}`;
      if (issue.origin === 'string') return `${field} must not be empty`;
      return `${field} is too small (minimum ${String(issue.minimum)})`;
    case 'too_big':
      if (issue.origin === 'string') return `${field} must be at most ${String(issue.maximum)} characters`;
      if (issue.origin === 'array')
        return `${field} must have at most ${plural(Number(issue.maximum), 'item')}`;
      return `${field} is too big (maximum ${String(issue.maximum)})`;
    case 'invalid_type':
      return issue.input === undefined ? `${field} is required` : `${field}: ${issue.message}`;
    case 'unrecognized_keys':
      return `${field}: unknown key${issue.keys.length === 1 ? '' : 's'} ${issue.keys.map((k) => `"${k}"`).join(', ')}`;
    case 'invalid_union':
      if ('discriminator' in issue && issue.discriminator)
        return `${field}: type must be one of goal, contribution, check, priority, build, acquisition, metapath`;
      return `${field}: ${issue.message}`;
    default:
      return `${field}: ${issue.message}`;
  }
}

/** Flattens a zod error into Issues located by `lineOf`. */
export function zodIssues(
  error: z.ZodError,
  file: string,
  lineOf: (path: readonly (string | number)[]) => number,
  idOf: (path: readonly PropertyKey[]) => string | undefined,
  /** Leading path segments to drop from the field name (e.g. ['entries', 3]). */
  prefixLength: (path: readonly PropertyKey[]) => number,
): Issue[] {
  const out: Issue[] = [];
  const walk = (issues: readonly z.core.$ZodIssue[], base: readonly PropertyKey[]) => {
    for (const issue of issues) {
      const path = [...base, ...issue.path];
      const n = prefixLength(path);
      out.push({
        level: 'error',
        file,
        line: lineOf(path.filter((p): p is string | number => typeof p !== 'symbol')),
        id: idOf(path),
        message: zodMessage(issue, path.slice(n)),
      });
    }
  };
  walk(error.issues, []);
  // One line per (line, message): unions repeat themselves.
  const seen = new Set<string>();
  return out.filter((i) => {
    const k = `${i.line}|${i.message}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
