// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where everything lives. Every path is absolute and derived from this file, so the CLI and the tests
// behave the same from any working directory.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const KB_TOOLS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = path.resolve(KB_TOOLS, '../..');
export const KNOWLEDGE = path.join(REPO, 'packages/knowledge');
export const ENGINE = path.join(REPO, 'packages/engine');
export const PARSERS = path.join(REPO, 'packages/toolbox-parsers');
export const ACCOUNT_STATE = path.join(REPO, 'packages/account-state');

export const SYSTEMS_YAML = path.join(KNOWLEDGE, 'systems.yaml');
export const MAJORS_YAML = path.join(KNOWLEDGE, 'majors.yaml');
export const SYSTEMS_DIR = path.join(KNOWLEDGE, 'systems');
export const GENERATED_DIR = path.join(KNOWLEDGE, 'generated');
export const GENERATORS_DIR = path.join(KNOWLEDGE, 'generators');
export const DETECTORS_DIR = path.join(KNOWLEDGE, 'detectors');
export const ENGINE_DETECTORS_DIR = path.join(ENGINE, 'detectors');
export const GOLDEN_DIR = path.join(KNOWLEDGE, 'golden');
export const DIST = path.join(KNOWLEDGE, 'dist/knowledge.json');
export const BUDGET = path.join(KNOWLEDGE, 'kb-budget.json');

export const PUBLIC_FIXTURES = path.join(ACCOUNT_STATE, 'fixtures/public');
// Kept outside fixtures/public/: the parser sync deletes every *.json there, and the Account State
// contract tests read every *.json there as a save (M11 TR-15 named that folder; see the PR notes).
export const PUBLIC_MANIFEST = path.join(KB_TOOLS, 'fixtures/public-manifest.json');
export const SCRUBBED_FIXTURES = path.join(REPO, 'fixtures/scrubbed');
export const PRIVATE_FIXTURES = path.join(REPO, 'fixtures/private');
export const PRIVATE_GOLDEN = path.join(PRIVATE_FIXTURES, 'golden');
export const DENYLIST = path.join(PRIVATE_FIXTURES, 'denylist.txt');

export const UPSTREAM = path.join(PARSERS, 'UPSTREAM');
export const VENDOR_PARSERS = path.join(PARSERS, 'vendor/parsers');
export const VENDOR_UTILITY = path.join(PARSERS, 'vendor/utility');
export const WEBSITE_DATA = path.join(PARSERS, 'vendor/data/website-data');
export const PARSER_BUNDLE = path.join(PARSERS, 'dist/index.js');

/** kb-tools' own gitignored cache: Toolbox patch notes at the pin, parsed fixtures. */
export const CACHE = path.join(KB_TOOLS, '.cache');
export const SCRUB_GENERATED = path.join(KB_TOOLS, 'src/scrub/generated');

export interface UpstreamPin {
  repo: string;
  commit: string;
  commitDate: string;
  toolboxVersion: string;
  gameVersion: string;
}

/** The parser pin, from packages/toolbox-parsers/UPSTREAM. */
export function readPin(): UpstreamPin {
  const kv = Object.fromEntries(
    readFileSync(UPSTREAM, 'utf8')
      .trim()
      .split('\n')
      .map((line) => line.split(/=(.*)/s).slice(0, 2) as [string, string]),
  );
  for (const k of ['repo', 'commit', 'commitDate', 'toolboxVersion', 'gameVersion'])
    if (!kv[k]) throw new Error(`UPSTREAM is missing ${k}`);
  return kv as unknown as UpstreamPin;
}

export const rel = (p: string): string => path.relative(REPO, p) || '.';
export const exists = (p: string): boolean => existsSync(p);
