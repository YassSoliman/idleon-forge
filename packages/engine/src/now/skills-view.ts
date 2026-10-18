// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Skills tab's and the Skill Grid's view model (M20 FR-31 to FR-38): M20's per-character skills with
// the name, class, level and deep link joined here (names never leave the UI thread's view), and each
// row's gate, best and Role in words. Pure; UI-thread safe.
import type { EngineResult, SkillGrid } from '../result';
import type { SkillGridView, SkillRowView, SkillsTabView } from './view';

/** The Skills tab's deep link: a bare `#skills-<index>` anchor (character-tabs.ts). */
export const skillsHref = (index: number) => `#skills-${index}`;

const NAMES: Record<SkillGrid['skills'][number], string> = {
  mining: 'Mining',
  smithing: 'Smithing',
  chopping: 'Choppin',
  fishing: 'Fishing',
  alchemy: 'Alchemy',
  catching: 'Catching',
  trapping: 'Trapping',
  construction: 'Construction',
  worship: 'Worship',
};

export function skillsView(result: EngineResult): SkillsTabView[] {
  return (result.skills ?? []).map((cs) => {
    const c = result.characters.find((x) => x.index === cs.index);
    const rows: SkillRowView[] = cs.rows.map((r) => {
      const name = NAMES[r.skill];
      const g = r.nextGate;
      return {
        ...r,
        name,
        gateText: g
          ? `${g.label} at ${g.scope === 'account' ? "the account's best " : ''}${name} ${g.atLevel} (${g.levelsLeft} ${g.levelsLeft === 1 ? 'level' : 'levels'})`
          : null,
        bestText: r.accountBest
          ? r.accountBest.index === cs.index
            ? 'your best'
            : `best ${r.accountBest.level}`
          : null,
        roleText: r.role ? (r.role.active ? 'Role' : `Role from ${r.role.from ?? 'later'}`) : null,
      };
    });
    const best = rows.filter((r) => r.accountBest?.index === cs.index).map((r) => r.name);
    return {
      index: cs.index,
      name: c?.name ?? `Character ${cs.index + 1}`,
      classLabel: c?.classLabel ?? '',
      level: c?.level ?? 0,
      href: skillsHref(cs.index),
      train: cs.train,
      rows,
      slots: cs.slots,
      status: cs.train?.text ?? (best.length ? `Best at ${best.join(', ')}` : 'No skill line yet'),
    };
  });
}

export function skillGridView(result: EngineResult): SkillGridView | null {
  const g = result.skillGrid ?? null;
  if (!g) return null;
  return {
    ...g,
    who: g.rows.map((r) => {
      const c = result.characters.find((x) => x.index === r.index);
      return {
        index: r.index,
        name: c?.name ?? `Character ${r.index + 1}`,
        classLabel: c?.classLabel ?? '',
        level: c?.level ?? 0,
      };
    }),
    names: NAMES,
  };
}
