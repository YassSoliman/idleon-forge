// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26's rules for class Builds past the third class (TR-8 style, run by `check.ts`):
// - every step's talent sits on the class's own talent tab of that number (Symbols of Beyond and The
//   Family Guy repeat across elite tabs, so "on some tab of the line" is not enough);
// - `inherits` names a class Build of the class this one promotes from (a master Build takes its elite
//   Build's tabs), and the inheriting Build lists only the tabs it adds;
// - a skilling variant `talents.build.<class>-skilling-<afk>` serves that AFK Target skill;
// - a master-class Build carries a `stageHint` (master classes open in World 6).
import type { AFK_TYPES, FactTable as FactTableT } from '@idleon-forge/knowledge';
import type { KbSource, Located } from './load';

export interface BuildIssue {
  file: string;
  line: number;
  id: string;
  message: string;
}

interface ClassTreeRow {
  class: string;
  promotesFrom: string | null;
  tier: string;
  talentTabs?: string[];
}
interface TalentRow {
  rawName: string;
  tabs: string[];
}

const VARIANT_RE = /^talents\.build\.([a-z0-9-]+)-skilling-([a-z]+)$/;

/** The M26 Build issues; empty when the class tree or the talent table is missing (other rules report that). */
export function buildIssues(src: KbSource, facts: ReadonlyMap<string, Located<FactTableT>>): BuildIssue[] {
  const tree = facts.get('classes.fact.class-tree')?.value;
  const table = facts.get('talents.fact.talents')?.value;
  if (!tree || !('rows' in tree) || !table || !('rows' in table)) return [];
  const classes = new Map(((tree.rows as unknown as ClassTreeRow[]) ?? []).map((r) => [r.class, r] as const));
  const tabsOf = new Map(
    ((table.rows as unknown as TalentRow[]) ?? []).map((r) => [r.rawName, r.tabs] as const),
  );
  const builds = new Map<string, { classLine: string; tabs: number[] }>();
  for (const e of src.authored)
    if (e.value.type === 'build' && e.value.variant === 'afk')
      builds.set(e.value.id, { classLine: e.value.classLine, tabs: e.value.tabs.map((t) => t.tab) });

  const out: BuildIssue[] = [];
  for (const e of src.authored) {
    const v = e.value;
    if (v.type !== 'build' || v.variant !== 'afk') continue;
    const at = (path: (string | number)[], message: string) =>
      out.push({ file: e.file, line: e.lineOf(path), id: v.id, message });
    const row = classes.get(v.classLine);
    if (!row) continue; // the lookups rule reports an unknown class
    const own = row.talentTabs ?? [];
    for (const [i, t] of v.tabs.entries()) {
      const tabName = own[t.tab - 1];
      if (tabName === undefined) {
        at(['tabs', i, 'tab'], `${v.classLine} has no talent tab ${t.tab}`);
        continue;
      }
      for (const [j, s] of t.steps.entries()) {
        const tabs = tabsOf.get(s.talent);
        if (tabs && !tabs.includes(tabName))
          at(['tabs', i, 'steps', j, 'talent'], `talent ${s.talent} is not on tab ${t.tab} (${tabName})`);
      }
    }
    if (v.inherits !== undefined) {
      const base = builds.get(v.inherits);
      if (!base) at(['inherits'], `inherits ${v.inherits}, which is not a class Build`);
      else {
        if (base.classLine !== row.promotesFrom)
          at(
            ['inherits'],
            `inherits a ${base.classLine} Build; ${v.classLine} promotes from ${row.promotesFrom}`,
          );
        const dup = v.tabs.filter((t) => base.tabs.includes(t.tab)).map((t) => t.tab);
        if (dup.length) at(['tabs'], `lists tab ${dup.join(', ')} that ${v.inherits} already has`);
      }
    }
    const variant = VARIANT_RE.exec(v.id);
    if (variant) {
      const afk = (variant[2] ?? '').toUpperCase() as (typeof AFK_TYPES)[number];
      if (v.role !== 'skilling') at(['role'], 'a skilling variant has role skilling');
      if (!v.serves.includes(afk)) at(['serves'], `a skilling variant for ${afk} serves ${afk}`);
    }
    if (row.tier === 'master' && v.stageHint === undefined)
      at(['classLine'], 'a master-class Build needs a stageHint (master classes open in World 6)');
  }
  return out;
}
