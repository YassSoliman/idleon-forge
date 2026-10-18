// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Build budgets over dist/ (M12 TR-12). A budget is raised only by a PR that changes it and says why.

export const BUDGETS = {
  // perf/lazy-tabs (M18 step 0): the character tabs, the Characters and Systems places and the System
  // pages became lazy chunks; the main chunk went from 304.2 KB to about 281 KB gzipped.
  mainChunkGzip: 320 * 1024,
  // The JavaScript a first visit runs before anything renders: the main chunk plus every chunk it
  // imports statically (index.html's modulepreload links). Rolldown moves modules shared by the main
  // chunk and a lazy chunk into small common chunks, so the main chunk alone can shrink while the first
  // load doesn't; this budget keeps that honest. 313.1 KB before the lazy tabs, about 308 KB after.
  initialJsGzip: 320 * 1024,
  // Lowered from 8 MiB in release 7 (perf/kb-slim): the worker went from 7.6 MiB to 4.7 MiB.
  workerChunkRaw: 6 * 1024 * 1024,
  anyFile: 20 * 1024 * 1024,
  fileCount: 5000,
  whatsNew: 64 * 1024,
  // M21 TR-12: the font files the first screen downloads (FR-F2's five latin faces: Atkinson
  // Hyperlegible Next 400 and 700, JetBrains Mono 400, Pixelify Sans 500 and 600). Measured at 60.8 KB
  // in Phase F (2026-10-18); capped at that + 10 KB. Today's first paint was 4 files, about 64 KB.
  firstPaintFontsRaw: 71 * 1024,
  // M21 TR-12: the main stylesheet, gzipped: Phase F's measured 14.2 KB (7.5 KB before: the tokens, the
  // atoms and the art's ramps and frames) + 12 KB. Reported from F, enforced from Integration
  // (MAIN_CSS_ENFORCED), once the areas had moved onto the atoms and the old styles were gone.
  mainCssGzip: 26.2 * 1024,
} as const;

/** On since M21 Integration (TR-12, FR-I3): the main stylesheet is held to `mainCssGzip`. */
export const MAIN_CSS_ENFORCED = true;

/** The first screen's font files (FR-F2), by their emitted names. */
export const FIRST_PAINT_FONTS: readonly RegExp[] = [
  /^assets\/atkinson-hyperlegible-next-latin-400-normal-[\w-]+\.woff2$/,
  /^assets\/atkinson-hyperlegible-next-latin-700-normal-[\w-]+\.woff2$/,
  /^assets\/jetbrains-mono-latin-400-normal-[\w-]+\.woff2$/,
  /^assets\/pixelify-sans-latin-500-normal-[\w-]+\.woff2$/,
  /^assets\/pixelify-sans-latin-600-normal-[\w-]+\.woff2$/,
];

/** The entry stylesheet index.html links: assets/index-<hash>.css. */
export const isMainCss = (p: string): boolean => /^assets\/index-[\w-]+\.css$/.test(p);

/** Raw bytes of the first screen's font files. */
export const firstPaintFontsRaw = (files: readonly DistFile[]): number =>
  files.reduce((n, f) => n + (FIRST_PAINT_FONTS.some((re) => re.test(f.path)) ? f.size : 0), 0);

/** Gzipped bytes of the main stylesheet. */
export const mainCssGzip = (files: readonly DistFile[]): number =>
  files.reduce((n, f) => n + (isMainCss(f.path) ? (f.gzip ?? 0) : 0), 0);

export interface DistFile {
  /** Path relative to dist/, forward slashes. */
  path: string;
  size: number;
  /** Gzipped size; needed for the initial chunks and the main stylesheet only. */
  gzip?: number;
  /** The main chunk or a chunk index.html modulepreloads (a first visit runs it). */
  initial?: boolean;
}

const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;

/** The entry chunk index.html loads: assets/index-<hash>.js. */
export const isMainChunk = (p: string): boolean => /^assets\/index-[\w-]+\.js$/.test(p);
export const isWorkerChunk = (p: string): boolean => /^assets\/parse\.worker-[\w-]+\.js$/.test(p);

/** Gzipped bytes of the main chunk and the chunks it imports statically. */
export const initialJsGzip = (files: readonly DistFile[]): number =>
  files.reduce((n, f) => n + (f.initial || isMainChunk(f.path) ? (f.gzip ?? 0) : 0), 0);

/** The chunks index.html preloads next to the main chunk: `<link rel="modulepreload" href="/assets/…">`. */
export const preloadedChunks = (html: string): string[] =>
  [...html.matchAll(/<link\s+rel="modulepreload"[^>]*href="\/?(assets\/[\w.-]+\.js)"/g)].map(
    (m) => m[1] ?? '',
  );

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
  const fonts = firstPaintFontsRaw(files);
  if (fonts > BUDGETS.firstPaintFontsRaw)
    problems.push(`the first screen's fonts are ${kb(fonts)} (budget ${kb(BUDGETS.firstPaintFontsRaw)})`);
  const css = mainCssGzip(files);
  if (MAIN_CSS_ENFORCED && css > BUDGETS.mainCssGzip)
    problems.push(`the main stylesheet is ${kb(css)} gzipped (budget ${kb(BUDGETS.mainCssGzip)})`);
  const initial = initialJsGzip(files);
  if (initial > BUDGETS.initialJsGzip)
    problems.push(
      `the first load runs ${kb(initial)} of JavaScript gzipped (budget ${kb(BUDGETS.initialJsGzip)})`,
    );
  if (!files.some((f) => isMainChunk(f.path))) problems.push('no main chunk assets/index-<hash>.js in dist/');
  if (!files.some((f) => f.path === 'version.json')) problems.push('no version.json in dist/');
  return problems;
}
