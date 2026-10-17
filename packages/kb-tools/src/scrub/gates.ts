// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The privacy gates (M11 FR-27, TR-14 step 5, TR-16):
// - the denylist gate (local): no string may equal a denylist line or contain it as a whole word;
// - the structural gate (CI): scrubbed fixtures have only pseudonyms where names were, no guild id, no
//   leaderboard, serverVars only for reviewed keys, a current policy hash and a consent link;
// - the id gate (CI): no uid- or guild-id-shaped string survives outside the lookup tables.
// `pnpm kb privacy` runs all three; the pre-commit hook runs it on staged files.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { ScrubbedMeta } from '../fixtures';
import { loadSource } from '../load';
import { DENYLIST, GOLDEN_DIR, KNOWLEDGE, REPO, rel, SCRUBBED_FIXTURES } from '../paths';
import { readScrubInputs } from './inputs';
import { PSEUDONYM, RULES, ruleSignature, SERVER_VARS_KEEP } from './policy';
import { lookupValues } from './scrub';

// ---------- the denylist ----------

export function readDenylist(file: string = DENYLIST): string[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#'));
}

/** Adds names to the local denylist (created if absent), once each. Never prints them. */
export function appendDenylist(names: Iterable<string>, file: string = DENYLIST): number {
  const have = new Set(readDenylist(file).map((l) => l.toLowerCase()));
  const add = [...new Set(names)].filter((n) => n.trim() !== '' && !have.has(n.toLowerCase()));
  if (add.length === 0) return 0;
  mkdirSync(path.dirname(file), { recursive: true });
  const header = existsSync(file)
    ? ''
    : '# Local denylist (gitignored): names, guild names, emails and ids that must never be committed.\n';
  appendFileSync(file, `${header}${add.join('\n')}\n`);
  return add.length;
}

/** Words of a string: split on non-alphanumerics, case changes and letter-digit boundaries ("Player_JosephHood" -> player, joseph, hood). */
export function wordsOf(s: string): string[] {
  return s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

const containsRun = (hay: string[], needle: string[]) => {
  if (needle.length === 0) return false;
  for (let i = 0; i + needle.length <= hay.length; i++)
    if (needle.every((w, j) => hay[i + j] === w)) return true;
  return false;
};

export interface DenyMatcher {
  /** Whether a string leaf is denied: equal to a line (case-insensitive), or containing it as a whole word run. */
  denied(leaf: string): boolean;
}

/** A line that is also a lookup value is matched as a whole leaf only, so a character named after an item doesn't block. */
export function denyMatcher(
  lines: readonly string[],
  lookupSet: ReadonlySet<string> = new Set(),
): DenyMatcher {
  const whole = new Set(lines.map((l) => l.toLowerCase()));
  const lowerLookups = new Set([...lookupSet].map((x) => x.toLowerCase()));
  const runs = lines
    .filter((l) => !lowerLookups.has(l.toLowerCase()))
    .map((l) => ({ line: l.toLowerCase(), words: wordsOf(l) }));
  return {
    denied(leaf: string) {
      const low = leaf.toLowerCase();
      // A leaf that is itself game data (an item, a monster...) is never a name.
      if (lowerLookups.has(low)) return false;
      if (whole.has(low)) return true;
      const w = wordsOf(leaf);
      return runs.some(
        (r) =>
          (r.words.length > 0 && containsRun(w, r.words)) || (r.words.length === 0 && low.includes(r.line)),
      );
    },
  };
}

/** Every string leaf of a JSON value, JSON-encoded strings decoded too. */
export function* stringLeaves(v: unknown): Generator<string> {
  if (typeof v === 'string') {
    yield v;
    if (v.startsWith('[') || v.startsWith('{')) {
      try {
        yield* stringLeaves(JSON.parse(v));
      } catch {
        /* not JSON */
      }
    }
  } else if (Array.isArray(v)) for (const x of v) yield* stringLeaves(x);
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) {
      yield k;
      yield* stringLeaves(x);
    }
}

/** Leaves of a text file: JSON leaves for .json, else each run of non-space, non-quote characters. */
export function leavesOfFile(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  if (file.endsWith('.json')) {
    try {
      return [...stringLeaves(JSON.parse(text))];
    } catch {
      /* fall through */
    }
  }
  return text.split(/[\s"'`|⟨⟩()[\]{},]+/).filter(Boolean);
}

/** Files and how many leaves the denylist hit in each (never the leaves themselves). */
export function denylistGate(
  files: readonly string[],
  matcher: DenyMatcher,
): { file: string; hits: number }[] {
  const out: { file: string; hits: number }[] = [];
  for (const f of files) {
    const hits = leavesOfFile(f).filter((l) => matcher.denied(l)).length;
    if (hits > 0) out.push({ file: rel(f), hits });
  }
  return out;
}

// ---------- ids ----------

const ID_SHAPED = /^[A-Za-z0-9_-]{20,40}$/;
/** uid- and guild-id-shaped strings (20–40 id characters, mixed case or digits) that aren't game data. */
export function idShaped(leaves: Iterable<string>, lookupSet: ReadonlySet<string>): number {
  let n = 0;
  for (const s of leaves)
    if (
      ID_SHAPED.test(s) &&
      /[A-Z]/.test(s) &&
      /[a-z]/.test(s) &&
      /\d/.test(s) &&
      !lookupSet.has(s) &&
      !s.includes('_')
    )
      n++;
  return n;
}

// ---------- the structural gate ----------

/** The policy hash of a set of matched rules: their current signatures, hashed (TR-14). */
export function policyHash(matched: Iterable<string>): string {
  const sigs = [...new Set(matched)].sort().map((id) => {
    const r = RULES.find((x) => x.id === id);
    return r ? ruleSignature(r) : `${id}@missing`;
  });
  return createHash('sha256').update(sigs.join('\n')).digest('hex').slice(0, 8);
}

export interface Problem {
  file: string;
  message: string;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const blankish = (v: unknown) =>
  v === '' ||
  v === 0 ||
  v === false ||
  v === null ||
  (Array.isArray(v) && v.length === 0) ||
  (isObj(v) && Object.keys(v).length === 0);

/** TR-14's CI structural gate over every fixtures/scrubbed/*.json. */
export function structuralGate(dir: string = SCRUBBED_FIXTURES): Problem[] {
  if (!existsSync(dir)) return [];
  const problems: Problem[] = [];
  const src = loadSource(KNOWLEDGE);
  const lookups = src.lookups ? lookupValues(src.lookups) : new Set<string>();
  const read = existsSync(path.join(REPO, 'packages/kb-tools/src/scrub/generated/scrub-inputs.json'))
    ? new Set(readScrubInputs().serverVarsRead)
    : new Set<string>();
  for (const f of readdirSync(dir)
    .filter((n) => n.endsWith('.json') && !n.endsWith('.meta.json'))
    .sort()) {
    const file = path.join(dir, f);
    const p = (message: string) => problems.push({ file: rel(file), message });
    const j = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    const names = Array.isArray(j.charNames) ? j.charNames : [];
    if (!names.every((n) => typeof n === 'string' && /^Char\d+$/.test(n))) p('charNames must all be Char<n>');
    const g = isObj(j.guildData) ? j.guildData : {};
    const members = Array.isArray(g.members) ? g.members : [];
    if (
      !members.every(
        (m) => !isObj(m) || typeof m.a !== 'string' || m.a === '' || /^(Member|Char)\d+$/.test(m.a),
      )
    )
      p('guildData.members[*].a must all be Member<n> (or Char<n> for own characters)');
    if (!blankish(g.id)) p('guildData.id must be empty');
    const t = isObj(j.tournament) ? j.tournament : {};
    if (t.leaderboard !== undefined && !blankish(t.leaderboard)) p('tournament.leaderboard must be empty');
    const sv = isObj(j.serverVars) ? j.serverVars : {};
    for (const [k, v] of Object.entries(sv))
      if (!blankish(v) && !(k in SERVER_VARS_KEEP && read.has(k)))
        p(`serverVars.${k} must be blank (not a reviewed SERVER_VARS_READ key)`);
    if (idShaped(stringLeaves(j), lookups) > 0)
      p('holds an id-shaped string (uid or guild id) that is not game data');
    for (const s of stringLeaves(j))
      if (/@[A-Za-z0-9-]+\.[A-Za-z]{2,}/.test(s)) {
        p('holds an email-shaped string');
        break;
      }
    const metaFile = path.join(dir, f.replace(/\.json$/, '.meta.json'));
    if (!existsSync(metaFile)) {
      p('has no .meta.json');
      continue;
    }
    const meta = JSON.parse(readFileSync(metaFile, 'utf8')) as ScrubbedMeta & {
      scrubber: { matchedRules?: string[] };
    };
    if (!/^https:\/\/\S+$/.test(meta.consent ?? ''))
      p("meta.consent must be a link to the owner's consent (D1)");
    const matched = meta.scrubber?.matchedRules ?? [];
    if (matched.length === 0) p('meta.scrubber.matchedRules is missing');
    else if (policyHash(matched) !== meta.scrubber.matchedPolicyHash)
      p('a policy rule that matched this fixture changed since it was scrubbed: the owner must re-scrub it');
    if (!meta.characters?.every((c) => /^C\d+$/.test(c.label))) p('meta.characters labels must be C<n>');
  }
  return problems;
}

// ---------- the command ----------

function stagedFiles(): string[] {
  try {
    return execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
      cwd: REPO,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
      .map((f) => path.join(REPO, f));
  } catch {
    return [];
  }
}

const listTree = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((f) => {
        const p = path.join(dir, f);
        return statSync(p).isDirectory() ? listTree(p) : [p];
      })
    : [];

/** `pnpm kb privacy [--staged] [files...]`. Exit 1 on any hit; prints counts, never the hits. */
export async function runPrivacyCommand(opts: { staged: boolean; files: string[] }): Promise<number> {
  let failed = 0;
  const structural = structuralGate();
  for (const p of structural) console.error(`${p.file}: ${p.message}`);
  failed += structural.length;

  const lines = [
    ...readDenylist(),
    ...(process.env.KB_DENYLIST ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
  ];
  const src = loadSource(KNOWLEDGE);
  const lookupSet = src.lookups ? lookupValues(src.lookups) : new Set<string>();
  const targets = opts.staged
    ? stagedFiles().filter(
        (f) => existsSync(f) && !f.includes(`${path.sep}fixtures${path.sep}private${path.sep}`),
      )
    : opts.files.length
      ? opts.files.map((f) => path.resolve(process.env.INIT_CWD ?? process.cwd(), f))
      : [
          ...listTree(SCRUBBED_FIXTURES),
          ...listTree(GOLDEN_DIR),
          ...listTree(path.join(KNOWLEDGE, 'systems')),
          ...listTree(path.join(KNOWLEDGE, 'detectors')),
        ];
  if (lines.length > 0) {
    const hits = denylistGate(targets, denyMatcher(lines, lookupSet));
    for (const h of hits) console.error(`${h.file}: ${h.hits} string(s) match the denylist`);
    failed += hits.length;
    console.log(`denylist gate: ${targets.length} files, ${hits.length} with hits`);
  } else console.log('denylist gate: skipped (no fixtures/private/denylist.txt and no KB_DENYLIST)');
  for (const f of targets.filter(
    (t) => t.endsWith('.json') && t.includes(`${path.sep}fixtures${path.sep}scrubbed${path.sep}`),
  )) {
    const n = idShaped(leavesOfFile(f), lookupSet);
    if (n > 0) {
      console.error(`${rel(f)}: ${n} id-shaped string(s)`);
      failed++;
    }
  }
  console.log(failed ? `privacy: ${failed} problem(s)` : 'privacy: clean');
  return failed ? 1 : 0;
}

export const isPseudonym = (s: string) => PSEUDONYM.test(s);
