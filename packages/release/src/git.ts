// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The only module that shells out (M12 TR-3). It always reads history from origin/main, because
// pull_request and dispatch checkouts have no local main (RT-13).
import { execFileSync } from 'node:child_process';
import type { Commit } from './commits.ts';

const git = (cwd: string, args: string[]): string =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  });

const tryGit = (cwd: string, args: string[]): string | undefined => {
  try {
    return git(cwd, args);
  } catch {
    return undefined;
  }
};

export const isGitRepo = (cwd: string): boolean => tryGit(cwd, ['rev-parse', '--git-dir']) !== undefined;
export const isShallow = (cwd: string): boolean =>
  tryGit(cwd, ['rev-parse', '--is-shallow-repository'])?.trim() === 'true';

/** origin/main when it exists, else HEAD (a clone without the remote). */
export function mainRef(cwd: string): string {
  return tryGit(cwd, ['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/main'])
    ? 'origin/main'
    : 'HEAD';
}

/** Parses `git log` output in the format readHistory asks for. Exported for the smoke test. */
export function parseLog(out: string): Commit[] {
  const commits: Commit[] = [];
  for (const record of out.split('\x1e')) {
    if (!record.trim()) continue;
    const [sha, date, subject, body, rest] = record.split('\x1f');
    if (!sha || !date) continue;
    commits.push({
      sha: sha.trim(),
      date: date.trim(),
      subject: (subject ?? '').trim(),
      body: (body ?? '').trim(),
      files: (rest ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    });
  }
  return commits;
}

/** First-parent history of `ref`, newest first, with each commit's files against its first parent. */
export function readHistory(cwd: string, ref: string, upstreamPath: string): Commit[] {
  const out = git(cwd, [
    'log',
    '--first-parent',
    '--diff-merges=first-parent',
    '--no-renames',
    '--name-only',
    '--format=%x1e%H%x1f%cI%x1f%s%x1f%b%x1f',
    ref,
  ]);
  const commits = parseLog(out);
  for (const c of commits) {
    if (!c.files.includes(upstreamPath)) continue;
    c.upstream = {
      before: tryGit(cwd, ['show', `${c.sha}^1:${upstreamPath}`]),
      after: tryGit(cwd, ['show', `${c.sha}:${upstreamPath}`]),
    };
  }
  return commits;
}

export function headCommit(cwd: string): { sha: string; date: string } {
  const [sha, date] = git(cwd, ['log', '-1', '--format=%H%x1f%cI', 'HEAD']).trim().split('\x1f');
  return { sha: sha ?? '', date: date ?? '' };
}

/** Files the current branch changes against its merge base with `ref` (a Preview's own changes). */
export function changedSinceMergeBase(cwd: string, ref: string): string[] {
  const base = tryGit(cwd, ['merge-base', ref, 'HEAD'])?.trim();
  if (!base) return [];
  return git(cwd, ['diff', '--name-only', '--no-renames', base, 'HEAD']).split('\n').filter(Boolean);
}

/** Uncommitted changes, optionally limited to one path. */
export function dirtyFiles(cwd: string, path?: string): string[] {
  return git(cwd, ['status', '--porcelain', '--', ...(path ? [path] : [])])
    .split('\n')
    .filter(Boolean);
}

export const repoRoot = (cwd: string): string => git(cwd, ['rev-parse', '--show-toplevel']).trim();
