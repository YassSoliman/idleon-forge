// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The two-Source rule for judgment (M26 FR-2c): an active Priority List, Build or Meta Path entry needs
// at least two independent, dated, post-patch Sources. Independent: different sites (the author is not
// recorded, so the site stands in for it). Dated and post-patch: a tier 2 or 3 Source whose claimDate is
// on or after the newest major patch in majors.yaml. Tier 1 data supplies facts, not orderings, so it
// does not count; nor do this project's own notes (they are not a second opinion).
//
// The entries that failed when the rule landed are listed in packages/knowledge/two-source-debt.json.
// The list only shrinks: a new failure is an error, and a listed entry that now passes, or no longer
// exists, is an error too until it is taken off the list.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Issue } from './issues';
import type { KbSource } from './load';
import { REPO } from './paths';

export const JUDGMENT_TYPES = ['priority', 'build', 'metapath'] as const;
const OWN = /^https:\/\/github\.com\/YassSoliman\/idleon-forge\//;

export const debtFile = (src: KbSource) => path.join(src.layout.root, 'two-source-debt.json');

export function readDebt(src: KbSource): string[] {
  const f = debtFile(src);
  return existsSync(f) ? ((JSON.parse(readFileSync(f, 'utf8')) as { ids?: string[] }).ids ?? []) : [];
}

/** The newest major patch's date, or null without majors.yaml rows. */
export function currentMajorDate(src: KbSource): string | null {
  const dates = src.majors.map((m) => m.date).sort();
  return dates.at(-1) ?? null;
}

interface SourceLike {
  url: string;
  tier: number;
  claimDate?: string;
}

/** The independent, dated, post-patch sites behind one entry. */
export function supportingSites(sources: readonly SourceLike[], since: string | null): string[] {
  const sites = new Set<string>();
  for (const s of sources) {
    if (s.tier !== 2 && s.tier !== 3) continue;
    if (!s.claimDate || (since !== null && s.claimDate < since) || OWN.test(s.url)) continue;
    sites.add(new URL(s.url).hostname.replace(/^www\./, ''));
  }
  return [...sites].sort();
}

/** Active judgment entries that fail the rule, by id. */
export function twoSourceFailures(src: KbSource): Map<string, (typeof src.authored)[number]> {
  const since = currentMajorDate(src);
  const out = new Map<string, (typeof src.authored)[number]>();
  for (const e of src.authored) {
    const v = e.value;
    if (v.status !== 'active' || !(JUDGMENT_TYPES as readonly string[]).includes(v.type)) continue;
    if (supportingSites(v.sources, since).length < 2) out.set(v.id, e);
  }
  return out;
}

export function twoSourceIssues(src: KbSource): Issue[] {
  const fails = twoSourceFailures(src);
  const debt = new Set(readDebt(src));
  const ids = new Set(src.authored.map((e) => e.value.id));
  const issues: Issue[] = [];
  for (const [id, e] of fails)
    if (!debt.has(id))
      issues.push({
        level: 'error',
        file: e.file,
        line: e.lineOf(['sources']),
        id,
        message:
          'an active Priority, Build or Meta Path entry needs two independent, dated, post-patch Sources (M26 FR-2c); ship it display only or Contested',
        code: 'two-source',
      });
  for (const id of debt)
    if (!fails.has(id))
      issues.push({
        level: 'error',
        file: path.relative(REPO, debtFile(src)),
        line: 1,
        id,
        message: ids.has(id)
          ? `${id} passes the two-Source rule now: take it off two-source-debt.json`
          : `${id} is not in the Knowledge Base: take it off two-source-debt.json`,
        code: 'two-source-debt',
      });
  return issues;
}
