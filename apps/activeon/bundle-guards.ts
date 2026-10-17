// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Build-time guards over the production bundle; a violation fails `pnpm build` (and so CI).
// - TR-1 / R10: the UI thread's chunks never contain the parser runtime (~6 MB, patches prototypes);
//   only the parse worker does, and it is emitted under the name public/_headers locks down.
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
      const unique = [...new Set(problems)];
      if (unique.length) this.error(`Bundle guards failed:\n- ${unique.join('\n- ')}`);
    },
  };
}
