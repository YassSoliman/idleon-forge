// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The CLI commands other than golden and scrub.
import { readFileSync } from 'node:fs';
import { ENTRY_TYPES, type Entry } from '@idleon-forge/knowledge';
import { checkSource } from './check';
import { compile, writeCompiled } from './compile';
import { discoverDetectors } from './discover';
import {
  checkGenerated,
  committedGenerated,
  factDiff,
  formatFactDiff,
  generateAll,
  writeGenerated,
} from './generate';
import { runHarness } from './harness';
import { formatIssue, type Issue } from './issues';
import { loadSource } from './load';
import { BUDGET, DIST, rel } from './paths';
import { formatDrift, publicFixtureDrift, writePublicManifest } from './public-manifest';
import { structuralGate } from './scrub/gates';
import { writeScrubInputs } from './scrub/inputs';

export async function runGenerateCommand(opts: { check: boolean; only?: string }): Promise<number> {
  if (opts.check) {
    const r = await checkGenerated();
    for (const p of r.problems) console.error(p);
    if (r.ok) console.log('generated facts are up to date');
    return r.ok ? 0 : 1;
  }
  const before = committedGenerated();
  const result = await generateAll({ only: opts.only ? [opts.only] : undefined });
  for (const line of result.summary) console.log(line);
  for (const e of result.errors) console.error(e);
  writeGenerated(result, undefined, !opts.only);
  await writeScrubInputs();
  console.log(`\n${formatFactDiff(factDiff(before, result.files), result.held)}`);
  return result.errors.some((e) => !e.startsWith('patch notes')) ? 1 : 0;
}

export async function runCompileCommand(opts: { git?: boolean }): Promise<number> {
  const src = loadSource();
  const errors = (await checkSource(src)).filter((i) => i.level === 'error');
  if (errors.length > 0) {
    for (const e of errors) console.error(formatIssue(e));
    console.error(`kb compile: ${errors.length} errors; run pnpm kb check`);
    return 1;
  }
  const kb = await compile(src, opts.git === false ? { git: null } : {});
  const { bytes } = writeCompiled(kb);
  console.log(
    `${rel(DIST)}: ${kb.version.display} (#${kb.version.contentHash}), ${Object.keys(kb.entries).length} entries, ${Object.keys(kb.facts).length} fact tables, ${(bytes / 1024).toFixed(1)} KB`,
  );
  return checkBudget(bytes);
}

/** TR-17: the shipped bundle stays within +20 % of kb-budget.json. */
export function checkBudget(bytes: number): number {
  const budget = JSON.parse(readFileSync(BUDGET, 'utf8')) as { bundleBytes: number };
  if (bytes > budget.bundleBytes * 1.2) {
    console.error(
      `bundle is ${bytes} bytes, over +20 % of the ${budget.bundleBytes}-byte budget (${rel(BUDGET)})`,
    );
    return 1;
  }
  return 0;
}

export interface CheckReport {
  issues: Issue[];
  harness: ReturnType<typeof runHarness>;
}

/** Everything `kb check` runs, as data (the tests call this too). */
export async function fullCheck(opts: { examples?: boolean } = {}): Promise<CheckReport> {
  const src = loadSource();
  const regs = await discoverDetectors();
  const issues = await checkSource(src, regs);
  for (const line of formatDrift(publicFixtureDrift()))
    issues.push({
      level: 'error',
      file: 'packages/kb-tools/fixtures/public-manifest.json',
      line: 1,
      message: line,
    });
  for (const p of structuralGate())
    issues.push({ level: 'error', file: p.file, line: 1, message: p.message, code: 'privacy' });
  let harness: ReturnType<typeof runHarness> = [];
  if (opts.examples !== false) {
    const kb = issues.some((i) => i.level === 'error') ? null : await compile(src, { git: null }, regs);
    harness = runHarness({ ...regs.knowledge }, { kb });
  }
  return { issues, harness };
}

export async function runCheckCommand(opts: { strict: boolean; examples: boolean }): Promise<number> {
  const { issues, harness } = await fullCheck(opts);
  // --strict: the hand-copied-fact warning fails unless the PR acknowledges it (KB_ACK_LITERALS=1).
  const strictFail = opts.strict && !process.env.KB_ACK_LITERALS;
  let errors = 0;
  for (const i of issues) {
    const fatal = i.level === 'error' || (strictFail && i.code === 'literal-3-digits');
    if (fatal) errors++;
    if (i.code !== 'pending-detector' || process.env.KB_VERBOSE)
      console[fatal ? 'error' : 'log'](formatIssue(i));
  }
  const pending = issues.filter((i) => i.code === 'pending-detector').length;
  if (pending)
    console.log(
      `${pending} Detector ids used only by generated entries are not registered yet (warning; KB_VERBOSE=1 lists them)`,
    );
  const failed = harness.filter((h) => h.status === 'fail');
  const skipped = harness.filter((h) => h.status === 'skipped');
  for (const h of failed) console.error(`detector ${h.detector} ${h.example}: ${h.message}`);
  if (skipped.length) console.log(`${skipped.length} private examples skipped (fixture absent)`);
  errors += failed.length;
  console.log(
    `kb check: ${errors} errors, ${issues.filter((i) => i.level === 'warning').length} warnings, ${harness.filter((h) => h.status === 'pass').length} examples passed`,
  );
  return errors > 0 ? 1 : 0;
}

/** `kb facts <system>`: the generated entries and fact tables of a System. `--mentions <ver>`: entries a patch may touch. */
export async function runFactsCommand(args: string[]): Promise<number> {
  const src = loadSource();
  const mentions = args.indexOf('--mentions');
  if (mentions >= 0) {
    const ver = args[mentions + 1];
    if (!ver) {
      console.error('usage: kb facts --mentions <gameVersion> [--notes <file>]');
      return 2;
    }
    const { loadPatchNotesText, mentionedEntries } = await import('./staleness');
    const text = await loadPatchNotesText();
    for (const line of mentionedEntries(src, ver, text)) console.log(line);
    return 0;
  }
  const system = args[0];
  if (!system) {
    console.error('usage: kb facts <system>');
    return 2;
  }
  const gen = src.generated.filter((g) => g.value.system === system);
  const facts = src.facts.filter((f) => f.value.system === system);
  for (const g of gen) console.log(`${g.value.id}\t${g.value.type}\t${g.value.title}`);
  for (const f of facts) console.log(`${f.value.id}\tfact (${f.value.origin})\t${f.value.title}`);
  if (gen.length + facts.length === 0) console.log(`no generated facts for ${system}`);
  return 0;
}

const SOURCE_SKELETON = `    - url: https://github.com/Morta1/IdleonToolbox/blob/<40-char-sha>/<path>
      title: <what this Source says>
      tier: 1
      verified: <YYYY-MM-DD>
      gameVersion: <x.y.z>`;

/** `kb new <type> <system>/<slug>`: a schema-valid-shaped skeleton to fill in (TR-19 A4). */
export async function runNewCommand(args: string[]): Promise<number> {
  const [type, target] = args;
  if (
    !type ||
    !target ||
    !(ENTRY_TYPES as readonly string[]).includes(type) ||
    !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(target)
  ) {
    console.error(`usage: kb new <${ENTRY_TYPES.join('|')}> <system>/<slug>`);
    return 2;
  }
  const [system, slug] = target.split('/') as [string, string];
  const extra: Record<string, string> = {
    goal: '  scope: character\n  category: compounding\n  unit: <unit>\n  progress: { id: <system>/<detector> }\n  extends: <generated goal id>   # or milestones: [...]',
    contribution:
      '  activity: { afkType: FIGHTING }\n  goal: <goal id>\n  detector: { id: <system>/<detector> }\n  eta: none',
    check: '  subject: character\n  effect: next-action\n  detector: { id: <system>/<detector> }',
    priority: '  list: goals\n  stage: W2-late\n  tiers:\n    - [<entry id>]',
    build:
      '  classLine: <Class>\n  role: fighting\n  serves: [FIGHTING]\n  variant: afk\n  tags: [<TALENT>]\n  tabs:\n    - tab: 1\n      steps:\n        - { talent: <TALENT>, target: max }',
    acquisition: '  thing: { kind: item, rawName: <rawName> }\n  methods:\n    - how: <how>',
    metapath: '  part: slots\n  slots:\n    - { slot: 1, classLine: <Class> }',
  };
  console.log(`# SPDX-License-Identifier: GPL-3.0-only
# systems/${system}.yaml (append under entries:)
- id: ${system}.${type}.${slug}
  system: ${system}
  type: ${type}
  title: <title, at most 80 characters>
  text: <template with {slots}>
  why: <one line>
  sources:
${SOURCE_SKELETON}
  appliesTo: { stages: all }
  confidence: M
  status: active
${extra[type]}`);
  return 0;
}

export async function runFixturesCommand(opts: { pin: boolean }): Promise<number> {
  if (opts.pin) {
    const m = writePublicManifest();
    console.log(`pinned ${Object.keys(m.fixtures).length} public fixtures`);
    return 0;
  }
  const drift = formatDrift(publicFixtureDrift());
  for (const d of drift) console.log(d);
  if (drift.length === 0) console.log('every public fixture matches its pin');
  return drift.length ? 1 : 0;
}

export type { Entry };
