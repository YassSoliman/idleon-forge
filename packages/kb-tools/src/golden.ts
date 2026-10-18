// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Golden snapshots (M11 TR-15, FR-26, FR-27): one Markdown-flavoured text file per fixture,
// packages/knowledge/golden/<fixture>.md (private fixtures: fixtures/private/golden/<id>.md).
//
// Sections: header; `## Verdict changes` (empty in committed files, filled only in the PR job summary
// by --diff-base); `## Now` (M10's renderNowText output); `## Not covered yet`; `## Findings` (every
// Detector finding, sorted). Until M10 ships its engine, `## Now` comes from a stub that prints
// "(engine not built)" and the header's stage is "(engine not built)": see GoldenEngine below.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AccountState } from '@idleon-forge/account-state';
import {
  type AnyDetector,
  type AnyFinding,
  type CompiledKnowledge,
  coverage,
  DEFAULT_EXPECTED_RETURN_MS,
  type DetectorRegistry,
  findDetector,
  makeContext,
  runDetector,
  type Subject,
} from '@idleon-forge/knowledge';
import { toolboxCalls } from '@idleon-forge/toolbox-parsers';
import { checkSource, detectorRefsOf } from './check';
import { compile } from './compile';
import { discoverDetectors } from './discover';
import { type FixtureInfo, listFixtures, stateOf } from './fixtures';
import { loadSource } from './load';
import { ENGINE, GOLDEN_DIR, PRIVATE_GOLDEN, REPO, readPin, rel } from './paths';
import { denyMatcher, readDenylist } from './scrub/gates';
import { lookupValues } from './scrub/scrub';

export const GOLDEN_FORMAT = 'golden v1';
export const RETURN_LABEL = '8h';

/**
 * What M10's engine provides to the harness. Until packages/engine/src/golden.ts exists and exports
 * `goldenEngine`, the stub below is used: no Stage, and "(engine not built)" for the Now section.
 */
export interface GoldenEngine {
  stage(input: GoldenInput): string | null;
  /** M10's renderNowText(buildNowView(engine(fixture), emptyPrefs, { focus: null })) (M10 TR-15). */
  renderNow(input: GoldenInput): string;
  /** M17 TR-10: the Systems hub as text; the `## Systems` section is left out without it. */
  renderSystems?(input: GoldenInput): string;
  /** M17 TR-10 (Phase 2): the Timeline as text; the `## Timeline` section is left out without it. */
  renderTimeline?(input: GoldenInput): string;
  /** M19 TR-10: the Alchemy page as text; the `## Alchemy` section is left out without it. */
  renderAlchemy?(input: GoldenInput): string;
}

export interface GoldenInput {
  state: AccountState;
  kb: CompiledKnowledge;
  registries: { knowledge: DetectorRegistry; engine: DetectorRegistry };
  now: number;
  expectedReturnMs: number;
  /** M19 TR-1: Toolbox's pure functions the worker hands the engine (bubble costs). */
  toolbox?: { bubbleCost(rawName: string, bubbleIndex: number, level: number, baseCost: number): number };
}

export const STUB_ENGINE: GoldenEngine = {
  stage: () => null,
  renderNow: () => '(engine not built)',
};

export const ENGINE_GOLDEN_MODULE = path.join(ENGINE, 'src/golden.ts');

export async function loadGoldenEngine(): Promise<GoldenEngine> {
  if (!existsSync(ENGINE_GOLDEN_MODULE)) return STUB_ENGINE;
  const mod = (await import(pathToFileURL(ENGINE_GOLDEN_MODULE).href)) as { goldenEngine?: GoldenEngine };
  return mod.goldenEngine ?? STUB_ENGINE;
}

/** C1…Cn in save order (the order of `state.characters`), never a name. */
export function subjectLabel(state: AccountState, s: Subject): string {
  if (s.kind === 'account') return 'account';
  const i = state.characters.findIndex((c) => c.index === s.index);
  return i >= 0 ? `C${i + 1}` : `C?${s.index}`;
}

function resultOf(d: AnyDetector, f: AnyFinding): string {
  const x = f as Record<string, unknown>;
  switch (d.kind) {
    case 'check':
      return x.result === 'unknown' ? `unknown (${x.reason})` : String(x.result);
    case 'milestone':
      return `reached ${x.reached}`;
    case 'contribution':
      return `advances ${x.advances}${typeof x.etaMs === 'number' ? ` eta ${Math.round(x.etaMs / 60000)}m` : ''}`;
    case 'progress':
      return x.value === null ? `unknown (${x.reason})` : `value ${x.value}`;
    case 'acquisition':
      return `owned ${x.owned}, requirements ${x.requirementsMet}`;
    default:
      return 'engine';
  }
}

export class GoldenSlotError extends Error {
  override name = 'GoldenSlotError';
}

const SAFE_STRING = /^C\d+$|^(Char|Member|Opponent|Friend)\d+$/;

export interface FindingRow {
  entry: string;
  detector: string;
  subject: string;
  result: string;
  slots: string;
}

/** Every Detector finding of the shipped entries and the System unlocks, sorted (section 5). */
export function findingRows(input: GoldenInput, lookupSet: ReadonlySet<string>): FindingRow[] {
  const { state, kb, registries, now, expectedReturnMs } = input;
  const ctx = makeContext(state, kb, { now, expectedReturnMs });
  const rows: FindingRow[] = [];
  const runOne = (entry: string, id: string, params: unknown, quiet = false) => {
    const d = findDetector(id, registries.knowledge, registries.engine);
    if (!d || d.kind === 'engine') return;
    const run = runDetector(d, ctx, params);
    if (!run.ok) {
      rows.push({ entry, detector: id, subject: '—', result: 'throws', slots: '' });
      return;
    }
    if (run.findings.length === 0 && !quiet)
      rows.push({ entry, detector: id, subject: '—', result: 'silent', slots: '' });
    for (const f of run.findings) {
      const finding = f as AnyFinding & { subject: Subject; slots?: Record<string, number | string> };
      const slots = Object.entries(finding.slots ?? {})
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([k, v]) => {
          if (typeof v === 'string' && v !== '' && !lookupSet.has(v) && !SAFE_STRING.test(v))
            throw new GoldenSlotError(
              `${id} on ${entry}: string slot "${k}" is not a lookup value, a pseudonym or C<n> (FR-27)`,
            );
          return `${k}=${v}`;
        })
        .join(' ');
      rows.push({
        entry,
        detector: id,
        subject: subjectLabel(state, finding.subject),
        result: resultOf(d, f),
        slots,
      });
    }
  };
  for (const e of Object.values(kb.entries)) {
    // Generated ladders are game facts, not findings (their progress Detectors are M4's inputs).
    if ('origin' in e && e.origin === 'generated') continue;
    // M4 TR-4: a concrete Contribution's Detector gets its Goal (the engine passes it the same way);
    // most are silent on any one save, so only the ones that match an activity are listed.
    const contribution = e.type === 'contribution' && e.goal !== undefined;
    for (const r of detectorRefsOf(e))
      runOne(e.id, r.id, contribution ? { ...r.params, goal: e.goal } : r.params, contribution);
  }
  for (const s of kb.systems)
    if (s.unlocked !== 'always') runOne(`systems.yaml#${s.id}`, s.unlocked.id, s.unlocked.params);
  const key = (r: FindingRow) =>
    `${r.entry}\u0000${r.detector}\u0000${r.subject}\u0000${r.result}\u0000${r.slots}`;
  return rows.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

const esc = (s: string) => s.replace(/\|/g, '\\|');

/** The golden text for one fixture. Deterministic; never contains a name (C1…Cn, pseudonyms). */
export function renderGolden(
  fixtureId: string,
  input: GoldenInput,
  engine: GoldenEngine,
  lookupSet: ReadonlySet<string>,
): string {
  const pin = readPin();
  const stage = engine.stage(input);
  const stale = input.kb.stale.length;
  const shipped = Object.keys(input.kb.entries).length;
  const header = [
    `# ${GOLDEN_FORMAT}: ${fixtureId}`,
    `knowledge #${input.kb.version.contentHash}`,
    `parser ${pin.commit.slice(0, 7)} (game ${pin.gameVersion})`,
    `now ${new Date(input.now).toISOString().replace('.000Z', 'Z')}`,
    `return ${RETURN_LABEL}`,
    `stage ${stage ?? '(engine not built)'}`,
    ...(stale > 0 ? [`stale: ${stale} of ${shipped}`] : []),
  ].join(' · ');
  const notCovered = coverage(input.state, input.kb, [input.registries.knowledge, input.registries.engine], {
    now: input.now,
    expectedReturnMs: input.expectedReturnMs,
  }).map((s) => s.name);
  const rows = findingRows(input, lookupSet);
  return [
    header,
    '',
    '## Verdict changes',
    '',
    '## Now',
    engine.renderNow(input).trimEnd(),
    '',
    '## Not covered yet',
    notCovered.length ? notCovered.join('\n') : '(none)',
    '',
    ...(engine.renderSystems ? ['## Systems', engine.renderSystems(input).trimEnd(), ''] : []),
    ...(engine.renderTimeline ? ['## Timeline', engine.renderTimeline(input).trimEnd(), ''] : []),
    ...(engine.renderAlchemy ? ['## Alchemy', engine.renderAlchemy(input).trimEnd(), ''] : []),
    '## Findings',
    '| entry | detector | subject | result | slots |',
    '|---|---|---|---|---|',
    ...rows.map(
      (r) => `| ${esc(r.entry)} | ${esc(r.detector)} | ${r.subject} | ${esc(r.result)} | ${esc(r.slots)} |`,
    ),
    '',
  ].join('\n');
}

export const goldenFile = (f: FixtureInfo) =>
  f.kind === 'private'
    ? path.join(PRIVATE_GOLDEN, `${f.id.replace(/^private:/, '')}.md`)
    : path.join(GOLDEN_DIR, `${f.id}.md`);

export interface GoldenContext {
  kb: CompiledKnowledge;
  registries: { knowledge: DetectorRegistry; engine: DetectorRegistry };
  engine: GoldenEngine;
  lookupSet: ReadonlySet<string>;
}

/** Compiles the Knowledge Base and loads the engine, once per run. */
export async function goldenContext(): Promise<GoldenContext> {
  const src = loadSource();
  const registries = await discoverDetectors();
  const errors = (await checkSource(src, registries)).filter((i) => i.level === 'error');
  if (errors.length)
    throw new Error(`kb golden: the Knowledge Base has ${errors.length} errors; run pnpm kb check`);
  const kb = await compile(src, { git: null }, registries);
  return {
    kb,
    registries,
    engine: await loadGoldenEngine(),
    lookupSet: src.lookups ? lookupValues(src.lookups) : new Set(),
  };
}

export function renderFixture(f: FixtureInfo, ctx: GoldenContext, state: AccountState = stateOf(f)): string {
  return renderGolden(
    f.id,
    {
      state,
      kb: ctx.kb,
      registries: ctx.registries,
      now: f.now,
      expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
      toolbox: { bubbleCost: toolboxCalls.bubbleCost },
    },
    ctx.engine,
    ctx.lookupSet,
  );
}

/** A minimal unified diff: the changed lines with their line numbers. */
export function lineDiff(a: string, b: string): string[] {
  const x = a.split('\n');
  const y = b.split('\n');
  const out: string[] = [];
  for (let i = 0; i < Math.max(x.length, y.length); i++)
    if (x[i] !== y[i]) {
      if (x[i] !== undefined) out.push(`-${i + 1}: ${x[i]}`);
      if (y[i] !== undefined) out.push(`+${i + 1}: ${y[i]}`);
    }
  return out;
}

/** "### C4 · Shaman 44 · Fix before you leave" lines of a golden's Now section, by subject. */
export function verdictLines(golden: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const line of golden.split('\n')) {
    const hit = /^### (C\d+|Account) · (.*)$/.exec(line);
    if (hit) m.set(hit[1] as string, hit[2] as string);
  }
  return m;
}

/** `## Verdict changes` for the PR job summary: base goldens (git show) vs the rendered ones. */
export function verdictChanges(rendered: Map<string, string>, baseRef: string): string[] {
  const out: string[] = [];
  for (const [id, text] of rendered) {
    if (id.startsWith('private:')) continue;
    let base = '';
    try {
      base = execFileSync(
        'git',
        ['show', `${baseRef}:${path.relative(REPO, path.join(GOLDEN_DIR, `${id}.md`))}`],
        {
          cwd: REPO,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        },
      );
    } catch {
      out.push(`- ${id}: new fixture`);
      continue;
    }
    const a = verdictLines(base);
    const b = verdictLines(text);
    for (const k of new Set([...a.keys(), ...b.keys()]))
      if (a.get(k) !== b.get(k)) out.push(`- ${id} ${k}: ${a.get(k) ?? '(none)'} → ${b.get(k) ?? '(none)'}`);
  }
  return out;
}

export async function runGoldenCommand(opts: {
  update: boolean;
  only?: string;
  diffBase?: string;
}): Promise<number> {
  const ctx = await goldenContext();
  const fixtures = listFixtures().filter(
    (f) => !opts.only || f.id === opts.only || f.id === `private:${opts.only}`,
  );
  if (fixtures.length === 0) {
    console.error(`no fixture ${opts.only}`);
    return 2;
  }
  const deny = readDenylist();
  const matcher = deny.length ? denyMatcher(deny, ctx.lookupSet) : null;
  const rendered = new Map<string, string>();
  let failed = 0;
  for (const f of fixtures) {
    let text: string;
    try {
      text = renderFixture(f, ctx);
    } catch (e) {
      console.error(`${f.id}: ${(e as Error).message}`);
      failed++;
      continue;
    }
    rendered.set(f.id, text);
    if (f.kind !== 'private' && matcher && text.split(/[\s|⟨⟩()[\],]+/).some((w) => matcher.denied(w))) {
      console.error(`${f.id}: the golden contains a denylisted string`);
      failed++;
      continue;
    }
    const file = goldenFile(f);
    const old = existsSync(file) ? readFileSync(file, 'utf8') : null;
    if (old === text) continue;
    if (opts.update) {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
      console.log(`updated ${f.kind === 'private' ? f.id : rel(file)}`);
    } else {
      failed++;
      console.error(
        `${f.kind === 'private' ? f.id : rel(file)}: ${old === null ? 'missing' : 'differs'} (run pnpm kb golden -u)`,
      );
      if (old !== null && f.kind !== 'private')
        for (const l of lineDiff(old, text).slice(0, 40)) console.error(`  ${l}`);
    }
  }
  if (opts.diffBase) {
    const changes = verdictChanges(rendered, opts.diffBase);
    const summary = [
      '## Verdict changes',
      '',
      ...(changes.length ? changes : ['No Verdict changed on any fixture.']),
      '',
    ].join('\n');
    console.log(summary);
    if (process.env.GITHUB_STEP_SUMMARY)
      writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, { flag: 'a' });
  }
  const skipped = listFixtures().length - listFixtures({ private: false }).length;
  console.log(
    `kb golden: ${rendered.size} fixtures${skipped ? ` (${skipped} private)` : ''}, ${failed} failing`,
  );
  return failed ? 1 : 0;
}
