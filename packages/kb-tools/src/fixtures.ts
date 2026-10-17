// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The fixture registry: public Toolbox saves (pinned by sha256 in the public manifest), committed
// scrubbed fixtures, and local-only private saves (`private:<stem>` for fixtures/private/<stem>.raw.json).
// Parsed Account States are cached on disk, keyed by everything that can change them (TR-16).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import { accountStateOfExport } from './parse';
import {
  ACCOUNT_STATE,
  CACHE,
  PARSER_BUNDLE,
  PRIVATE_FIXTURES,
  PUBLIC_FIXTURES,
  PUBLIC_MANIFEST,
  SCRUBBED_FIXTURES,
  UPSTREAM,
} from './paths';

export type FixtureKind = 'public' | 'scrubbed' | 'private';

export interface FixtureInfo {
  id: string;
  kind: FixtureKind;
  file: string;
  /** The fixture's `now` (epoch ms): scrubbed meta `now`, else the export's `lastUpdated`. */
  now: number;
  /** Only for scrubbed fixtures: their meta. */
  meta?: ScrubbedMeta;
}

export interface ScrubbedMeta {
  id: string;
  description: string;
  now: string;
  exportedOn: string;
  parserCommit: string;
  gameVersion: string;
  scrubber: { version: number; matchedPolicyHash: string };
  owner: string;
  consent: string;
  characters: { label: string; class: string; level: number }[];
}

export interface PublicManifest {
  description: string;
  fixtures: Record<string, { file: string; upstream: string; sha256: string }>;
}

export const sha256 = (data: string | Buffer): string => createHash('sha256').update(data).digest('hex');

export function readPublicManifest(): PublicManifest {
  return JSON.parse(readFileSync(PUBLIC_MANIFEST, 'utf8')) as PublicManifest;
}

const lastUpdatedOf = (file: string): number => {
  const j = JSON.parse(readFileSync(file, 'utf8')) as { lastUpdated?: number };
  if (typeof j.lastUpdated !== 'number') throw new Error(`${file}: no lastUpdated to use as now`);
  return j.lastUpdated;
};

/** Every fixture available here: public and scrubbed always, private only when present locally. */
export function listFixtures(opts: { private?: boolean } = {}): FixtureInfo[] {
  const out: FixtureInfo[] = [];
  if (existsSync(PUBLIC_MANIFEST)) {
    for (const [id, f] of Object.entries(readPublicManifest().fixtures).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const file = path.join(PUBLIC_FIXTURES, f.file);
      out.push({ id, kind: 'public', file, now: lastUpdatedOf(file) });
    }
  }
  if (existsSync(SCRUBBED_FIXTURES)) {
    for (const f of readdirSync(SCRUBBED_FIXTURES)
      .filter((n) => n.endsWith('.json') && !n.endsWith('.meta.json'))
      .sort()) {
      const id = f.replace(/\.json$/, '');
      const metaFile = path.join(SCRUBBED_FIXTURES, `${id}.meta.json`);
      const meta = existsSync(metaFile)
        ? (JSON.parse(readFileSync(metaFile, 'utf8')) as ScrubbedMeta)
        : undefined;
      const file = path.join(SCRUBBED_FIXTURES, f);
      out.push({ id, kind: 'scrubbed', file, now: meta ? Date.parse(meta.now) : lastUpdatedOf(file), meta });
    }
  }
  if (opts.private !== false && existsSync(PRIVATE_FIXTURES)) {
    for (const f of readdirSync(PRIVATE_FIXTURES)
      .filter((n) => n.endsWith('.raw.json'))
      .sort()) {
      const file = path.join(PRIVATE_FIXTURES, f);
      out.push({
        id: `private:${f.replace(/\.raw\.json$/, '')}`,
        kind: 'private',
        file,
        now: lastUpdatedOf(file),
      });
    }
  }
  return out;
}

export function fixtureById(id: string): FixtureInfo | undefined {
  return listFixtures().find((f) => f.id === id);
}

let codeKey: string | null = null;
/** Hash of everything that changes a parse: UPSTREAM, the parser bundle, the Account State adapter. */
function parseCodeKey(): string {
  if (codeKey) return codeKey;
  const h = createHash('sha256');
  h.update(readFileSync(UPSTREAM));
  if (existsSync(PARSER_BUNDLE)) h.update(readFileSync(PARSER_BUNDLE));
  const src = path.join(ACCOUNT_STATE, 'src');
  for (const f of readdirSync(src).sort()) h.update(readFileSync(path.join(src, f)));
  h.update(readFileSync(new URL('./parse.ts', import.meta.url)));
  codeKey = h.digest('hex').slice(0, 16);
  return codeKey;
}

const memory = new Map<string, AccountState>();

/** The fixture's Account State at its own `now`, parsed deterministically (cached in memory and on disk). */
export function stateOf(f: FixtureInfo): AccountState {
  const bytes = readFileSync(f.file);
  const key = `${f.id.replace(/[^a-z0-9-]/gi, '_')}-${sha256(bytes).slice(0, 16)}-${parseCodeKey()}-${f.now}`;
  const hit = memory.get(key);
  if (hit) return structuredClone(hit);
  // Private states never touch the disk cache: they hold real names.
  const cacheFile = f.kind === 'private' ? null : path.join(CACHE, 'states', `${key}.json`);
  let state: AccountState;
  if (cacheFile && existsSync(cacheFile)) state = JSON.parse(readFileSync(cacheFile, 'utf8')) as AccountState;
  else {
    state = accountStateOfExport(JSON.parse(bytes.toString('utf8')), f.now);
    if (cacheFile) {
      mkdirSync(path.dirname(cacheFile), { recursive: true });
      writeFileSync(cacheFile, JSON.stringify(state));
    }
  }
  memory.set(key, state);
  return structuredClone(state);
}
