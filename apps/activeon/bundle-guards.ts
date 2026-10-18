// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Build-time guards over the production bundle; a violation fails `pnpm build` (and so CI).
// - TR-1 / R10: the UI thread's chunks never contain the parser runtime (~6 MB, patches prototypes);
//   only the parse worker does, and it is emitted under the name public/_headers locks down.
// - M12 TR-12 (perf/lazy-tabs): the views that are lazy chunks (lazy-part.tsx) stay out of the first
//   load: no module of theirs is in the main chunk or in a chunk it imports statically.
// - TR-21 / RT-3: no Firebase write API is reachable from the bundle. Checked on what the bundler
//   actually kept (each Firebase entry module's rendered exports), not by grepping text: `set(`
//   matches Map.set, and an import alias gets past a grep.
import type { Plugin } from 'vite';

/** Firebase APIs that write, by the entry module that exports them. */
export const FIREBASE_WRITE_APIS: Record<string, readonly string[]> = {
  firestore: [
    'setDoc',
    'updateDoc',
    'addDoc',
    'deleteDoc',
    'writeBatch',
    'runTransaction',
    'executeWrite',
    'deleteField',
  ],
  database: [
    'set',
    'update',
    'push',
    'remove',
    'setWithPriority',
    'setPriority',
    'runTransaction',
    'onDisconnect',
  ],
};

/** The parser bundle's licence banner (packages/toolbox-parsers/scripts/build.mjs). */
export const PARSER_BANNER = 'IdleOn Forge toolbox-parsers';
/** Where the parse worker must land; public/_headers gives this path `connect-src 'none'`. */
export const WORKER_FILE = /^assets\/parse\.worker-[\w-]+\.js$/;

/** Lazy-only views: the character tabs, the places but Now, the System pages and their bodies. */
export const LAZY_ONLY: readonly RegExp[] = [
  /activeon[\\/]src[\\/]now[\\/]BuildView\.tsx$/,
  /activeon[\\/]src[\\/]now[\\/]cards[\\/]CardsPanel\.tsx$/,
  /activeon[\\/]src[\\/]now[\\/]signs[\\/]SignsTab\.tsx$/,
  /activeon[\\/]src[\\/]now[\\/]SkillsTab\.tsx$/,
  /activeon[\\/]src[\\/]characters[\\/]/,
  /activeon[\\/]src[\\/]systems[\\/](SystemsHub|SystemPage|SlotPictures)\.tsx$/,
  /activeon[\\/]src[\\/]timeline[\\/]/,
  /activeon[\\/]src[\\/]gear[\\/]/,
  /activeon[\\/]src[\\/]alchemy[\\/]/,
];

/** Problems with the first load: the entry chunk and every chunk it imports statically. */
export function checkFirstLoad(chunks: Array<{ fileName: string; moduleIds: string[] }>): string[] {
  const problems: string[] = [];
  for (const c of chunks)
    for (const id of c.moduleIds)
      if (LAZY_ONLY.some((re) => re.test(id)))
        problems.push(
          `${c.fileName} loads ${id.replace(/.*[\\/]src[\\/]/, 'src/')} on first load; it is a lazy view`,
        );
  return problems;
}

export interface ChunkInfo {
  fileName: string;
  code: string;
  modules: Record<string, { renderedExports: string[] }>;
}

const firebaseEntry = (id: string): string | null => {
  const m =
    /[\\/]@?firebase[\\/](firestore|database|functions)[\\/]dist[\\/](?:esm[\\/])?index\.[\w.]+$/.exec(id);
  return m?.[1] ?? null;
};

/** Problems with one UI-thread chunk. */
export function checkChunk(chunk: ChunkInfo): string[] {
  const problems: string[] = [];
  if (chunk.code.includes(PARSER_BANNER))
    problems.push(`${chunk.fileName} contains the parser runtime; import it only inside src/worker/`);
  for (const [id, info] of Object.entries(chunk.modules)) {
    if (id.includes('virtual:activeon-knowledge'))
      problems.push(`${chunk.fileName} bundles the Knowledge Base; it belongs in the parse worker`);
    if (/[\\/]toolbox-parsers[\\/](dist|vendor)[\\/]/.test(id))
      problems.push(`${chunk.fileName} bundles ${id}; the parser runtime belongs in the worker`);
    const entry = firebaseEntry(id);
    if (entry === 'functions')
      problems.push(`${chunk.fileName} bundles firebase/functions (callable = a write path)`);
    const banned = entry ? (FIREBASE_WRITE_APIS[entry] ?? []) : [];
    for (const name of info.renderedExports)
      if (banned.includes(name))
        problems.push(`${chunk.fileName} keeps the Firebase write API ${entry}.${name}`);
  }
  return problems;
}

/** Problems with the emitted file names. */
export function checkFiles(fileNames: string[], codeOf: (name: string) => string): string[] {
  const problems: string[] = [];
  const workers = fileNames.filter((n) => /parse\.worker/.test(n));
  if (workers.length !== 1 || !workers.every((n) => WORKER_FILE.test(n)))
    problems.push(
      `expected one parse worker at assets/parse.worker-<hash>.js, got ${JSON.stringify(workers)}`,
    );
  for (const name of workers) {
    if (!codeOf(name).includes(PARSER_BANNER)) problems.push(`${name} does not contain the parser bundle`);
  }
  return problems;
}

export function bundleGuards(): Plugin {
  return {
    name: 'idleon-forge-bundle-guards',
    apply: 'build',
    generateBundle(_options, bundle) {
      const problems: string[] = [];
      for (const out of Object.values(bundle)) {
        if (out.type !== 'chunk') continue;
        problems.push(
          ...checkChunk({
            fileName: out.fileName,
            code: out.code,
            modules: Object.fromEntries(
              Object.entries(out.modules).map(([id, m]) => [id, { renderedExports: [...m.renderedExports] }]),
            ),
          }),
        );
      }
      problems.push(
        ...checkFiles(Object.keys(bundle), (name) => {
          const out = bundle[name];
          if (!out) return '';
          return out.type === 'chunk'
            ? out.code
            : typeof out.source === 'string'
              ? out.source
              : new TextDecoder().decode(out.source);
        }),
      );
      // The first load: the UI entry chunk and its static imports, transitively.
      const first = new Set<string>();
      const visit = (name: string) => {
        const out = bundle[name];
        if (first.has(name) || out?.type !== 'chunk') return;
        first.add(name);
        for (const dep of out.imports) visit(dep);
      };
      for (const out of Object.values(bundle))
        if (out.type === 'chunk' && out.isEntry && !WORKER_FILE.test(out.fileName)) visit(out.fileName);
      problems.push(
        ...checkFirstLoad(
          [...first].map((name) => {
            const out = bundle[name];
            return { fileName: name, moduleIds: out?.type === 'chunk' ? Object.keys(out.modules) : [] };
          }),
        ),
      );
      const unique = [...new Set(problems)];
      if (unique.length) this.error(`Bundle guards failed:\n- ${unique.join('\n- ')}`);
    },
  };
}
