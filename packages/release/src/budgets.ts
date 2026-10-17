// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Build budgets over dist/ (M12 TR-12). A budget is raised only by a PR that changes it and says why.

export const BUDGETS = {
  mainChunkGzip: 320 * 1024,
  workerChunkRaw: 8 * 1024 * 1024,
  anyFile: 20 * 1024 * 1024,
  fileCount: 5000,
  whatsNew: 64 * 1024,
} as const;

export interface DistFile {
  /** Path relative to dist/, forward slashes. */
  path: string;
  size: number;
  /** Gzipped size; needed for the main chunk only. */
  gzip?: number;
}

const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;

/** The entry chunk index.html loads: assets/index-<hash>.js. */
export const isMainChunk = (p: string): boolean => /^assets\/index-[\w-]+\.js$/.test(p);
export const isWorkerChunk = (p: string): boolean => /^assets\/parse\.worker-[\w-]+\.js$/.test(p);

export function checkBudgets(files: DistFile[]): string[] {
  const problems: string[] = [];
  if (files.length > BUDGETS.fileCount)
    problems.push(`dist/ has ${files.length} files (budget ${BUDGETS.fileCount})`);
  for (const f of files) {
    if (f.size > BUDGETS.anyFile)
      problems.push(`${f.path} is ${kb(f.size)} (budget ${kb(BUDGETS.anyFile)} per file)`);
    if (isMainChunk(f.path) && (f.gzip ?? 0) > BUDGETS.mainChunkGzip)
      problems.push(`${f.path} is ${kb(f.gzip ?? 0)} gzipped (budget ${kb(BUDGETS.mainChunkGzip)})`);
    if (isWorkerChunk(f.path) && f.size > BUDGETS.workerChunkRaw)
      problems.push(`${f.path} is ${kb(f.size)} (budget ${kb(BUDGETS.workerChunkRaw)})`);
    if (f.path === 'whats-new.json' && f.size > BUDGETS.whatsNew)
      problems.push(`whats-new.json is ${kb(f.size)} (budget ${kb(BUDGETS.whatsNew)})`);
  }
  if (!files.some((f) => isMainChunk(f.path))) problems.push('no main chunk assets/index-<hash>.js in dist/');
  if (!files.some((f) => f.path === 'version.json')) problems.push('no version.json in dist/');
  return problems;
}
