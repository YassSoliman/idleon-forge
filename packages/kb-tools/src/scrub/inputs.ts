// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Scrub inputs generated at every sync (TR-14): SERVER_VARS_READ, the serverVars keys the vendored
// parsers (and the Account State adapter) read, and the OptLacc slots the parsers index. The policy
// keeps only reviewed keys and slots; a newly read one stops the scrub until a person reviews it.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { FIELD_SOURCES } from '@idleon-forge/account-state';
import { canonicalJson } from '@idleon-forge/knowledge';
import { rel, SCRUB_GENERATED, VENDOR_PARSERS, VENDOR_UTILITY } from '../paths';

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const f of readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) out.push(...sourceFiles(p));
    else if (/\.(ts|js|mjs)$/.test(f)) out.push(p);
  }
  return out;
}

// `serverVars?.X`, `serverVars.X`, `(serverVars as any)?.X`, `serverVars?.['X']`. Other access forms are
// caught by the scrub's parse-equivalence check, which is the safety net for this scan.
const SERVER_VAR_RE =
  /serverVars(?:\s+as\s+\w+\))?(?:\?\.|\.)([A-Za-z0-9_]+)|serverVars\??\.?\[['"]([^'"]+)['"]\]/g;
const OPTLACC_RE = /(?:accountOptions|OptLacc|optionsListAccount)\??\.?\[(\d+)\]/g;

export interface ScrubInputs {
  /** serverVars keys some parser or the adapter reads. */
  serverVarsRead: string[];
  /** OptLacc indices some parser reads, by number. */
  optLaccRead: number[];
}

/** Scans the vendored parsers (and the adapter's FIELD_SOURCES) for what they read. */
export function scanScrubInputs(): ScrubInputs {
  const vars = new Set<string>();
  const opts = new Set<number>();
  for (const file of [...sourceFiles(VENDOR_PARSERS), ...sourceFiles(VENDOR_UTILITY)]) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(SERVER_VAR_RE)) vars.add((m[1] ?? m[2]) as string);
    for (const m of text.matchAll(OPTLACC_RE)) opts.add(Number(m[1]));
  }
  // `const { a, b } = (accountData as any)?.serverVars || {}`
  for (const file of [...sourceFiles(VENDOR_PARSERS), ...sourceFiles(VENDOR_UTILITY)]) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/(?:const|let)\s*\{([^}]+)\}\s*=\s*[^;\n]*serverVars\b/g))
      for (const part of (m[1] as string).split(','))
        vars.add((part.split(':')[0] as string).replace(/=.*$/, '').trim());
  }
  vars.delete('');
  for (const toolboxPath of Object.values(FIELD_SOURCES)) {
    const m = /serverVars\.([A-Za-z0-9_]+)/.exec(toolboxPath);
    if (m) vars.add(m[1] as string);
  }
  return { serverVarsRead: [...vars].sort(), optLaccRead: [...opts].sort((a, b) => a - b) };
}

export const SCRUB_INPUTS_FILE = path.join(SCRUB_GENERATED, 'scrub-inputs.json');

export function readScrubInputs(): ScrubInputs {
  return JSON.parse(readFileSync(SCRUB_INPUTS_FILE, 'utf8')) as ScrubInputs;
}

/** Writes (or, with `check`, verifies) the generated scrub inputs. */
export async function writeScrubInputs(opts: { check?: boolean } = {}): Promise<{ problems: string[] }> {
  const content = `${canonicalJson(scanScrubInputs(), 2)}\n`;
  const old = existsSync(SCRUB_INPUTS_FILE) ? readFileSync(SCRUB_INPUTS_FILE, 'utf8') : null;
  if (opts.check)
    return {
      problems:
        old === content ? [] : [`${rel(SCRUB_INPUTS_FILE)}: ${old === null ? 'missing' : 'out of date'}`],
    };
  mkdirSync(SCRUB_GENERATED, { recursive: true });
  writeFileSync(SCRUB_INPUTS_FILE, content);
  return { problems: [] };
}
