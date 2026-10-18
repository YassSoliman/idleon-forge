// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Preset role classification (M9 FR-1, TR-6): where a preset's points sit, against the role-tagged
// talents of the class line's two Builds. Arithmetic on save data only (ADR 0005).
import type { PresetTalents } from '@idleon-forge/account-state';
import { type PresetRole, type ResolvedBuild, ROLES } from './knowledge';

export type PresetClass = PresetRole | 'empty' | 'incomplete' | 'unclassified';

/** TR-6: the role needs at least this many times the other role's tagged points ... */
export const ROLE_MARGIN = 2;
/** ... and the two together cover at least this share of the preset's spend. */
export const ROLE_COVERAGE = 0.5;

/** Points bought in one tab (0 when the preset has no such tab). */
export const tabSpent = (p: PresetTalents, tab: number): number =>
  p.tabs.find((t) => t.tab === tab)?.talents.reduce((n, x) => n + x.base, 0) ?? 0;

/** Points bought in tabs 1–3 (`spent(P)`, TR-6). */
export const spent = (p: PresetTalents): number => tabSpent(p, 1) + tabSpent(p, 2) + tabSpent(p, 3);

/** Base level of one talent on tabs 1–3 (a shared Basics talent is counted once). */
export function levelOf(p: PresetTalents, id: number): number {
  for (const t of p.tabs) {
    if (t.tab > 3) continue;
    const x = t.talents.find((y) => y.id === id);
    if (x) return x.base;
  }
  return 0;
}

/** The save's max level of one talent on tabs 1–3; 0 when the preset doesn't have it. */
export function maxOf(p: PresetTalents, id: number): number {
  for (const t of p.tabs) {
    if (t.tab > 3) continue;
    const x = t.talents.find((y) => y.id === id);
    if (x) return x.max;
  }
  return 0;
}

/** `tagged(P, B)`: the preset's points in the Build's tagged talents. */
export function tagged(p: PresetTalents, b: ResolvedBuild | null): number {
  if (!b) return 0;
  let n = 0;
  for (const id of b.tags) n += levelOf(p, id);
  return n;
}

/** FR-1 / TR-6. `builds` are the class line's fighting and skilling Builds (either may be missing). */
export function classifyPreset(
  p: PresetTalents,
  builds: Readonly<Record<PresetRole, ResolvedBuild | null>>,
): PresetClass {
  const total = spent(p);
  if (total === 0) return 'empty';
  if (tabSpent(p, 1) === 0 && tabSpent(p, 2) === 0) return 'incomplete';
  const f = tagged(p, builds.fighting);
  const s = tagged(p, builds.skilling);
  if (f + s < ROLE_COVERAGE * total) return 'unclassified';
  for (const role of ROLES) {
    const mine = role === 'fighting' ? f : s;
    const theirs = role === 'fighting' ? s : f;
    if (builds[role] && mine > 0 && mine >= ROLE_MARGIN * theirs) return role;
  }
  return 'unclassified';
}
