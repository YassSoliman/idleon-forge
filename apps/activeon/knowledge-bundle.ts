// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Ships the compiled Knowledge Base (M11 TR-7, M10 FR-26) as the virtual module
// `virtual:activeon-knowledge`, whose default export is the bundle's JSON text. Only the parse worker
// imports it, so it lands in the worker chunk, never the main chunk (bundle-guards checks that).
// `pnpm kb compile` runs once per Vite (or Vitest) server, so the bundle always matches the YAML in
// the checkout; it needs no network and writes packages/knowledge/dist/knowledge.json (gitignored).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export const KNOWLEDGE_MODULE = 'virtual:activeon-knowledge';
const RESOLVED = `\0${KNOWLEDGE_MODULE}`;
const REPO = path.resolve(import.meta.dirname, '../..');
export const KNOWLEDGE_DIST = path.join(REPO, 'packages/knowledge/dist/knowledge.json');

/** Runs `kb compile` and returns the bundle text. Throws (failing the build) when it can't. */
export function compileKnowledge(): string {
  execFileSync('pnpm', ['--silent', 'kb', 'compile'], { cwd: REPO, stdio: ['ignore', 'pipe', 'inherit'] });
  return readFileSync(KNOWLEDGE_DIST, 'utf8');
}

export function knowledgeBundle(compile: () => string = compileKnowledge): Plugin {
  let text: string | null = null;
  return {
    name: 'activeon-knowledge-bundle',
    resolveId: (id) => (id === KNOWLEDGE_MODULE ? RESOLVED : null),
    load(id) {
      if (id !== RESOLVED) return null;
      text ??= compile();
      return `export default ${JSON.stringify(text)};`;
    },
  };
}
