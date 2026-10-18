// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The commit model the pure generators work on, and the parsing they share with the PR title check.

/** One first-parent commit on main, newest first in every list. */
export interface Commit {
  sha: string;
  /** Committer date, ISO 8601 (any offset). */
  date: string;
  subject: string;
  body: string;
  /** Paths changed against the first parent. */
  files: string[];
  /** Contents of packages/toolbox-parsers/UPSTREAM before and after, when the commit changed it. */
  upstream?: { before?: string; after?: string };
}

export const CONVENTIONAL_TYPES = [
  'feat',
  'fix',
  'perf',
  'refactor',
  'docs',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
  'spec',
] as const;
export type ConventionalType = (typeof CONVENTIONAL_TYPES)[number];

export interface ConventionalTitle {
  type: ConventionalType;
  scope?: string;
  breaking: boolean;
  description: string;
}

const TITLE = /^([a-z]+)(?:\(([^()\s]+)\))?(!)?: (\S.*)$/;

/** Parses `type(scope)!: description`; null when it isn't a Conventional Commit we accept. */
export function parseTitle(title: string): ConventionalTitle | null {
  const m = TITLE.exec(title.trim());
  if (!m) return null;
  const type = m[1] as ConventionalType;
  if (!CONVENTIONAL_TYPES.includes(type)) return null;
  return { type, scope: m[2], breaking: m[3] === '!', description: (m[4] ?? '').trim() };
}

export type WhatsNewLine = { kind: 'none' } | { kind: 'text'; text: string };

// `What's-new:` with a straight or curly apostrophe, any case, CRLF tolerated (TR-7 rule 4).
const WHATS_NEW = /^[ \t]*what['’]s-new:[ \t]*(.*?)[ \t]*$/i;

// A line that starts another trailer (`Key: value`), a heading or a list item ends a wrapped value.
const NEXT_TRAILER = /^[ \t]*[A-Za-z][A-Za-z0-9'’-]*:(?:[ \t]|$)/;
const BLOCK_START = /^[ \t]*(?:#|[-*+][ \t]|<!--|```)/;

/**
 * The PR body's `What's-new:` line. A value that wraps onto the next lines is joined up to the next
 * blank line or the next `Key:` trailer. An empty value counts as absent (TR-19).
 */
export function parseWhatsNewLine(body: string): WhatsNewLine | null {
  const lines = body.split(/\r?\n/).map((l) => l.replace(/\r$/, ''));
  for (let i = 0; i < lines.length; i++) {
    const m = WHATS_NEW.exec(lines[i] ?? '');
    if (!m) continue;
    const parts = [(m[1] ?? '').trim()];
    if (!parts[0]) continue;
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j] ?? '';
      if (next.trim() === '' || NEXT_TRAILER.test(next) || BLOCK_START.test(next)) break;
      parts.push(next.trim());
    }
    const text = parts.join(' ').replace(/\s+/g, ' ').trim();
    // "none", optionally followed by a note: "none (spec only)", "none - docs" (not shown to players).
    if (/^none\b(?:[\s.:;,(–—-].*)?$/i.test(text)) return { kind: 'none' };
    return { kind: 'text', text };
  }
  return null;
}

/** PR number and title from a merge commit (TR-7 rules 1 and 2). */
export function prOf(commit: Pick<Commit, 'subject' | 'body'>): { pr?: number; title: string } {
  const old = /^Merge pull request #(\d+) from /.exec(commit.subject);
  if (old) {
    const first = commit.body.split(/\r?\n/).find((l) => l.trim() !== '');
    return { pr: Number(old[1]), title: (first ?? '').trim() };
  }
  const m = /^(.*\S)\s+\(#(\d+)\)$/.exec(commit.subject);
  if (m) return { pr: Number(m[2]), title: m[1] ?? '' };
  return { title: commit.subject.trim() };
}

/** Key/value lines of an UPSTREAM file. */
export function parseUpstream(text: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of (text ?? '').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

/** YYYY-MM-DD in UTC. */
export function utcDay(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}
