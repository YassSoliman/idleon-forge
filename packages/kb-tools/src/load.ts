// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Loads the Knowledge Base source tree (systems.yaml, majors.yaml, systems/*.yaml, generated/*.json)
// and validates each file against the schema. Cross-entry rules run afterwards, in check.ts.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  type AuthoredEntryT,
  AuthoredFactsFile,
  AuthoredFile,
  type FactTableT,
  type GeneratedEntryT,
  GeneratedFactsFile,
  GeneratedFile,
  MajorsFile,
  type SystemDefT,
  SystemsFile,
} from '@idleon-forge/knowledge';
import type { z } from 'zod';
import { type Issue, zodIssues } from './issues';
import { KNOWLEDGE, REPO } from './paths';
import { loadYaml, YamlError } from './yaml';

export interface KbLayout {
  root: string;
  systemsYaml: string;
  majorsYaml: string;
  systemsDir: string;
  generatedDir: string;
  /** Game-client builds and excerpts (M26 FR-2b): the repo's docs/research/game-client, or <root>/game-client. */
  gameClientDir: string;
}

export const layoutOf = (root: string = KNOWLEDGE): KbLayout => ({
  root,
  systemsYaml: path.join(root, 'systems.yaml'),
  majorsYaml: path.join(root, 'majors.yaml'),
  systemsDir: path.join(root, 'systems'),
  generatedDir: path.join(root, 'generated'),
  gameClientDir:
    root === KNOWLEDGE ? path.join(REPO, 'docs/research/game-client') : path.join(root, 'game-client'),
});

export interface Located<T> {
  /** Repo-relative file. */
  file: string;
  value: T;
  /** Line of a path inside this item (relative to the item). */
  lineOf(path?: readonly (string | number)[]): number;
}

export interface Lookups {
  classes: string[];
  /** class -> the classes it promotes to, transitively (Squire -> Divine_Knight, Royal_Guardian, ...). */
  classTree: Record<string, string[]>;
  /** class -> talent rawNames on its tabs. */
  talentsByClass: Record<string, string[]>;
  talents: string[];
  items: string[];
  monsters: string[];
  maps: string[];
  cards: string[];
  [table: string]: unknown;
}

export interface Hold {
  generator: string;
  ids: string[];
  reason: string;
  issue: string;
  /** Parser commit at which the hold started. */
  since: string;
  /** Parser commit of the newest generate that kept the hold. */
  lastCommit: string;
  /** Number of syncs the hold has lived through (fails CI past 2). */
  syncs: number;
}

export interface KbSource {
  layout: KbLayout;
  systems: Located<SystemDefT>[];
  majors: z.infer<typeof MajorsFile>['majors'];
  authored: Located<AuthoredEntryT>[];
  /** `status: draft` entries (M26 FR-1): schema-checked, id-checked, never compiled or checked as live. */
  drafts: Located<AuthoredEntryT>[];
  generated: Located<GeneratedEntryT>[];
  facts: Located<FactTableT>[];
  patches: string[];
  lookups: Lookups | null;
  held: Hold[];
  issues: Issue[];
}

const relTo = (file: string) => path.relative(REPO, file);

function readYamlFile(file: string, issues: Issue[]) {
  try {
    return loadYaml(relTo(file), readFileSync(file, 'utf8'));
  } catch (e) {
    if (e instanceof YamlError)
      issues.push({
        level: 'error',
        file: e.file,
        line: e.line,
        message: e.message.replace(/^\S+:\d+ /, ''),
      });
    else throw e;
    return null;
  }
}

function readJson(file: string, issues: Issue[]): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    issues.push({
      level: 'error',
      file: relTo(file),
      line: 1,
      message: `invalid JSON: ${(e as Error).message}`,
    });
    return null;
  }
}

const listFiles = (dir: string, re: RegExp) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => re.test(f))
        .sort()
        .map((f) => path.join(dir, f))
    : [];

/** Loads and schema-validates every Knowledge Base file under `root`. Never throws on content errors. */
export function loadSource(root: string = KNOWLEDGE): KbSource {
  const layout = layoutOf(root);
  const issues: Issue[] = [];
  const src: KbSource = {
    layout,
    systems: [],
    majors: [],
    authored: [],
    drafts: [],
    generated: [],
    facts: [],
    patches: [],
    lookups: null,
    held: [],
    issues,
  };

  // systems.yaml
  if (existsSync(layout.systemsYaml)) {
    const y = readYamlFile(layout.systemsYaml, issues);
    if (y) {
      const r = SystemsFile.safeParse(y.value);
      if (!r.success)
        issues.push(
          ...zodIssues(
            r.error,
            y.file,
            y.lineOf,
            (p) => String((y.value as { systems?: { id?: string }[] })?.systems?.[Number(p[1])]?.id ?? ''),
            (p) => (p[0] === 'systems' ? 2 : 0),
          ),
        );
      else
        src.systems = r.data.systems.map((value, i) => ({
          file: y.file,
          value,
          lineOf: (p = []) => y.lineOf(['systems', i, ...p]),
        }));
    }
  } else
    issues.push({
      level: 'error',
      file: relTo(layout.systemsYaml),
      line: 1,
      message: 'missing System registry',
    });

  // majors.yaml
  if (existsSync(layout.majorsYaml)) {
    const y = readYamlFile(layout.majorsYaml, issues);
    if (y) {
      const r = MajorsFile.safeParse(y.value);
      if (!r.success)
        issues.push(
          ...zodIssues(
            r.error,
            y.file,
            y.lineOf,
            () => undefined,
            () => 0,
          ),
        );
      else src.majors = r.data.majors;
    }
  }

  // systems/<system>.yaml and systems/<system>.facts.yaml
  for (const file of listFiles(layout.systemsDir, /\.ya?ml$/)) {
    const y = readYamlFile(file, issues);
    if (!y) continue;
    const isFacts = /\.facts\.ya?ml$/.test(file);
    const stem = path.basename(file).replace(/(\.facts)?\.ya?ml$/, '');
    const raw = y.value as {
      system?: unknown;
      entries?: { id?: unknown }[];
      facts?: { id?: unknown }[];
    } | null;
    if (raw?.system !== stem)
      issues.push({
        level: 'error',
        file: y.file,
        line: y.lineOf(['system']),
        message: `system must be "${stem}" (the file name)`,
      });
    if (isFacts) {
      const r = AuthoredFactsFile.safeParse(y.value);
      if (!r.success) {
        issues.push(
          ...zodIssues(
            r.error,
            y.file,
            y.lineOf,
            (p) => String(raw?.facts?.[Number(p[1])]?.id ?? ''),
            (p) => (p[0] === 'facts' ? 2 : 0),
          ),
        );
        continue;
      }
      for (const [i, value] of r.data.facts.entries())
        src.facts.push({ file: y.file, value, lineOf: (p = []) => y.lineOf(['facts', i, ...p]) });
      continue;
    }
    const r = AuthoredFile.safeParse(y.value);
    if (!r.success) {
      issues.push(
        ...zodIssues(
          r.error,
          y.file,
          y.lineOf,
          (p) => (p[0] === 'entries' ? String(raw?.entries?.[Number(p[1])]?.id ?? '') : undefined),
          (p) => (p[0] === 'entries' ? 2 : 0),
        ),
      );
      continue;
    }
    r.data.entries.forEach((value, i) => {
      if ('generatedBy' in (raw?.entries?.[i] ?? {}) || 'origin' in (raw?.entries?.[i] ?? {}))
        issues.push({
          level: 'error',
          file: y.file,
          line: y.lineOf(['entries', i]),
          id: value.id,
          message: 'authored entries never set origin or generatedBy',
        });
      const located: Located<AuthoredEntryT> = {
        file: y.file,
        value,
        lineOf: (p = []) => y.lineOf(['entries', i, ...p]),
      };
      (value.status === 'draft' ? src.drafts : src.authored).push(located);
    });
  }

  // generated/*.json (entries), generated/*.facts.json (fact tables), and the _ files
  for (const file of listFiles(layout.generatedDir, /\.json$/)) {
    const base = path.basename(file);
    const json = readJson(file, issues);
    if (json === null) continue;
    if (base === '_patches.json') {
      src.patches = ((json as { patches?: string[] }).patches ?? []).slice();
      continue;
    }
    if (base === '_lookups.json') {
      src.lookups = json as Lookups;
      continue;
    }
    if (base === '_held.json') {
      src.held = ((json as { holds?: Hold[] }).holds ?? []).slice();
      continue;
    }
    if (base.startsWith('_')) continue;
    const relFile = relTo(file);
    if (base.endsWith('.facts.json')) {
      const r = GeneratedFactsFile.safeParse(json);
      if (!r.success) {
        issues.push(
          ...zodIssues(
            r.error,
            relFile,
            () => 1,
            (p) => String((json as { facts?: { id?: string }[] }).facts?.[Number(p[1])]?.id ?? ''),
            (p) => (p[0] === 'facts' ? 2 : 0),
          ),
        );
        continue;
      }
      for (const value of r.data.facts) src.facts.push({ file: relFile, value, lineOf: () => 1 });
      continue;
    }
    const r = GeneratedFile.safeParse(json);
    if (!r.success) {
      issues.push(
        ...zodIssues(
          r.error,
          relFile,
          () => 1,
          (p) => String((json as { entries?: { id?: string }[] }).entries?.[Number(p[1])]?.id ?? ''),
          (p) => (p[0] === 'entries' ? 2 : 0),
        ),
      );
      continue;
    }
    for (const value of r.data.entries) src.generated.push({ file: relFile, value, lineOf: () => 1 });
  }
  return src;
}
