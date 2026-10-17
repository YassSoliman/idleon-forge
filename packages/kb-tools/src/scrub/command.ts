// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `pnpm kb scrub <raw.json> --id <id> [--now <iso>] [--owner <who>] [--consent <url>] [--description <text>] [--dry-run]`
// (M11 TR-14): policy walk, unknown-string scan, denylist gate, parse equivalence, then the fixture and
// its meta. Every check that fails stops the tool before anything is written.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { canonicalJson } from '@idleon-forge/knowledge';
import { loadSource } from '../load';
import { accountStateOfExport } from '../parse';
import { KNOWLEDGE, readPin, rel, SCRUBBED_FIXTURES } from '../paths';
import { parseEquivalence } from './equivalence';
import { appendDenylist, denyMatcher, policyHash, readDenylist, stringLeaves } from './gates';
import { readScrubInputs } from './inputs';
import { assertPolicy } from './policy';
import { lookupValues, normalisePath, type ScrubResult, scrubExport } from './scrub';

export const SCRUBBER_VERSION = 1;

export interface ScrubRun {
  result: ScrubResult;
  /** The scrubbed export as written (sorted keys). */
  text: string;
  meta: Record<string, unknown>;
  stops: string[];
}

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Non-blank leaf paths (normalised): what a scrub keeps, for the kept-fields diff (Final rulings RT-3). */
export function keptPaths(v: unknown, p = '', out = new Set<string>()): Set<string> {
  if (typeof v === 'string') {
    if (v !== '') out.add(normalisePath(p));
  } else if (typeof v === 'number' || typeof v === 'boolean') out.add(normalisePath(p));
  else if (Array.isArray(v)) for (const [i, x] of v.entries()) keptPaths(x, `${p}[${i}]`, out);
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) keptPaths(x, p ? `${p}.${k}` : k, out);
  return out;
}

/** The whole scrub, in memory. `stops` lists every reason not to write the fixture. */
export function scrub(
  raw: Record<string, unknown>,
  opts: {
    id: string;
    now?: number;
    owner?: string;
    consent?: string;
    description?: string;
    denylist?: readonly string[];
  },
): ScrubRun {
  assertPolicy();
  const src = loadSource(KNOWLEDGE);
  if (!src.lookups) throw new Error('generated/_lookups.json is missing: run pnpm kb generate');
  const result = scrubExport(raw, { lookups: src.lookups, inputs: readScrubInputs() });
  const stops: string[] = [...result.problems];
  for (const [p, values] of [...result.unknown].sort(([a], [b]) => a.localeCompare(b)))
    stops.push(
      `unexplained string at ${p} (${values.length} value${values.length === 1 ? '' : 's'}): add a value-checked rule or a lookup table`,
    );
  const text = `${canonicalJson(result.output, 2)}\n`;
  const written = JSON.parse(text) as Record<string, unknown>;

  // Denylist gate (step 5): every original name, plus the local denylist.
  const lookupSet = lookupValues(src.lookups);
  const lines = [...result.names.chars.keys(), ...result.names.others.keys(), ...(opts.denylist ?? [])];
  const guildId = (raw.guildData as { id?: unknown } | undefined)?.id;
  if (typeof guildId === 'string' && guildId) lines.push(guildId);
  const matcher = denyMatcher(lines, lookupSet);
  const hits = [...stringLeaves(written)].filter((s) => matcher.denied(s)).length;
  if (hits > 0) stops.push(`denylist gate: ${hits} string(s) of the output match a name or id from the save`);

  const now = opts.now ?? (typeof raw.lastUpdated === 'number' ? raw.lastUpdated : Number.NaN);
  if (!Number.isFinite(now)) stops.push('no --now and no lastUpdated in the export');
  if (stops.length === 0) {
    // Parse equivalence (step 6), on the file as written (keys sorted).
    const eq = parseEquivalence(raw, written, result, now);
    if (!eq.ok) stops.push(`parse equivalence failed; first differing paths: ${eq.differences.join(', ')}`);
  }

  const pin = readPin();
  const state = stops.length === 0 ? accountStateOfExport(written, now) : null;
  const meta = {
    id: opts.id,
    description: opts.description ?? '',
    now: Number.isFinite(now) ? new Date(now).toISOString() : '',
    exportedOn: typeof raw.lastUpdated === 'number' ? isoDate(raw.lastUpdated) : '',
    parserCommit: pin.commit,
    gameVersion: pin.gameVersion,
    scrubber: {
      version: SCRUBBER_VERSION,
      matchedPolicyHash: policyHash(result.matchedRules),
      matchedRules: [...result.matchedRules].sort(),
    },
    owner: opts.owner ?? '',
    consent: opts.consent ?? '',
    characters: (state?.characters ?? []).map((c, i) => ({
      label: `C${i + 1}`,
      class: c.class,
      level: c.level,
    })),
  };
  return { result, text, meta, stops };
}

/** Renders the golden of the original and of the scrubbed export; null when they are equal. */
export async function goldenEquivalence(
  original: Record<string, unknown>,
  scrubbed: Record<string, unknown>,
  now: number,
): Promise<string | null> {
  const { goldenContext, renderGolden } = await import('../golden');
  const { DEFAULT_EXPECTED_RETURN_MS } = await import('@idleon-forge/knowledge');
  const ctx = await goldenContext();
  const render = (raw: Record<string, unknown>) =>
    renderGolden(
      'scrub-check',
      {
        state: accountStateOfExport(raw, now),
        kb: ctx.kb,
        registries: ctx.registries,
        now,
        expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
      },
      ctx.engine,
      ctx.lookupSet,
    );
  const a = render(original);
  const b = render(scrubbed);
  if (a === b) return null;
  const line = a.split('\n').findIndex((l, i) => l !== b.split('\n')[i]);
  return `golden equivalence failed: the rendered goldens differ from line ${line + 1}`;
}

const option = (args: string[], name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

export async function runScrubCommand(args: string[]): Promise<number> {
  const input = args[0];
  const id = option(args, '--id');
  if (!input || input.startsWith('--') || !id || !/^scrubbed-[a-z0-9-]+$/.test(id)) {
    console.error(
      'usage: pnpm kb scrub fixtures/private/<name>.raw.json --id scrubbed-<id> [--now <iso>] [--owner <who>] [--consent <url>] [--description <text>] [--dry-run]',
    );
    return 2;
  }
  const file = path.resolve(process.env.INIT_CWD ?? process.cwd(), input);
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  const nowArg = option(args, '--now');
  const run = scrub(raw, {
    id,
    now: nowArg ? Date.parse(nowArg) : undefined,
    owner: option(args, '--owner'),
    consent: option(args, '--consent'),
    description: option(args, '--description'),
    denylist: readDenylist(),
  });
  // Step 2: seed the local denylist with every original name, so the pre-commit gate protects this save.
  const guildId = (raw.guildData as { id?: unknown } | undefined)?.id;
  const added = appendDenylist([
    ...run.result.names.chars.keys(),
    ...run.result.names.others.keys(),
    ...(typeof guildId === 'string' && guildId ? [guildId] : []),
  ]);
  if (added) console.log(`added ${added} names to the local denylist (fixtures/private/denylist.txt)`);
  for (const [p, values] of run.result.unknown)
    console.error(`  ${p}: ${values.map((v) => JSON.stringify(v.slice(0, 40))).join(', ')}`);
  if (run.stops.length === 0) {
    // The engine output, rendered as a golden, must be equal too (step 6).
    const problem = await goldenEquivalence(
      raw,
      JSON.parse(run.text) as Record<string, unknown>,
      Date.parse(String(run.meta.now)),
    );
    if (problem) run.stops.push(problem);
  }
  if (run.stops.length > 0) {
    for (const s of run.stops) console.error(`stop: ${s}`);
    return 1;
  }
  const out = path.join(SCRUBBED_FIXTURES, `${id}.json`);
  const metaOut = path.join(SCRUBBED_FIXTURES, `${id}.meta.json`);
  if (existsSync(out)) {
    const before = keptPaths(JSON.parse(readFileSync(out, 'utf8')));
    const after = keptPaths(JSON.parse(run.text));
    const added2 = [...after].filter((p) => !before.has(p)).sort();
    const removed = [...before].filter((p) => !after.has(p)).sort();
    console.log(`kept fields vs the previous scrub: +${added2.length} -${removed.length}`);
    for (const p of added2.slice(0, 50)) console.log(`  + ${p}`);
    if (added2.length)
      console.log(
        '  This re-scrub keeps something new: ask the owner for consent again (Final rulings RT-3).',
      );
  }
  if (args.includes('--dry-run')) {
    console.log('dry run: nothing written');
    return 0;
  }
  mkdirSync(SCRUBBED_FIXTURES, { recursive: true });
  writeFileSync(out, run.text);
  writeFileSync(metaOut, `${canonicalJson(run.meta, 2)}\n`);
  console.log(
    `wrote ${rel(out)} and ${rel(metaOut)} (${run.result.names.chars.size} characters, ${run.result.names.others.size} other players pseudonymised)`,
  );
  return 0;
}
