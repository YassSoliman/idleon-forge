// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7: the Characters area's view words (area C).
import type { BuildKnownPoints, BuildPresetView, BuildRoadmap, BuildTabView } from '../../result';

const n = (x: number) => x.toLocaleString('en-US');

export const CHARACTERS_WORDS = {
  title: 'Characters',
  overviews: 'Every character',
  /** The health matrix (FR-C7). */
  matrix: {
    heading: 'Every character at a glance',
    hint: 'Tap a cell to open that tab.',
    fixFirst: 'fix first',
    level: { fix: 'fix', behind: 'behind', empty: 'empty', unknown: 'not known', ok: 'fine' },
  },
  /** The class tree block under the matrix (character.overview runner-up). */
  classTree: { heading: 'Your class tree', noOne: 'no one yet' },
  /**
   * The Build path (fix/build-points, M21 FR-C1, FR-C2). Tabs 1–3 only know a lower bound of unspent
   * points, so the marker says "at least" and "as of your last save", and a bound of 0 says no points
   * are known, never that none wait. The star tab's count is exact (FR-C10).
   */
  buildPath: {
    heading: 'Build steps',
    knownEnd: 'they end here',
    knownPrefix: 'As of your last save: at least',
    knownSuffix: 'points waiting',
    noneKnown: 'No unspent points known from your last save: the totals show where new points go',
    allSpent: 'All spent: the totals show where new points go',
    /** Exact class-tab counts (owner ruling 2026-10-18): no "at least". */
    exactSuffix: 'points waiting',
    asOf: 'as of your last save',
    fromTotals: "from your save's totals",
    exactNone: 'All spent: the totals show where new points go',
    stonksReturns: 'Stonks! returns more as it levels',
    band: {
      done: 'done',
      now: 'can add now',
      part: 'part now',
      next: 'next after these',
      later: 'later',
    },
    page: 'Page',
    alsoHas: 'Also has points',
    noPoints: 'No points in this tab.',
  },
  /** The tab grid (FR-C3) and the star tile (FR-C13). */
  grid: {
    label: 'Talent tabs',
    startHere: 'Start here',
    star: 'Star talents',
    spent: 'spent',
    presets: 'Talent presets',
    inUse: 'in use',
  },
  /** One step, then the rest (FR-C4). */
  nextHeading: 'Next points',
  classPath: 'Class path',
  attackBar: { heading: 'Attack bar', empty: 'empty slot', wants: 'wants' },
  comingUp: { heading: 'Coming up', here: 'you are here' },
  starKnown: {
    allSpent: 'all spent',
  },
} as const;

/** "As of your last save: at least 70 points waiting · they end here". */
export function buildKnownLine(points: number): string {
  const w = CHARACTERS_WORDS.buildPath;
  return `${w.knownPrefix} ${n(points)} ${w.knownSuffix} · ${w.knownEnd}`;
}

/** A "part now" step: "+20 of 100 now". */
export function buildPartLine(now: number, need: number): string {
  return `+${n(now)} of ${n(need)} now`;
}

/** FR-C10: the star tab's exact words. "40 unspent", "all spent", "over budget by about 201". */
export function starKnownWord(k: BuildKnownPoints): string | null {
  if (!k || typeof k !== 'object') return null;
  if (k.kind !== 'exact') return null;
  if (k.overBy !== null) return `over budget by about ${n(k.overBy)}`;
  return (k.points ?? 0) > 0 ? `${n(k.points ?? 0)} unspent` : CHARACTERS_WORDS.starKnown.allSpent;
}

/**
 * The tile badge (FR-C3, `character.build.unspent`): "at least 12" for tabs 1–3, the star words for
 * the star tab; null when nothing is known (zero shows nothing).
 */
export function tabBadge(t: Pick<BuildTabView, 'known' | 'unspent' | 'tab'>): string | null {
  if (!t || typeof t !== 'object') return null;
  const k = t.known ?? { kind: 'none', points: t.unspent, overBy: null };
  if (k.kind === 'exact' && t.tab === 0) return starKnownWord(k);
  if (!k.points || k.points <= 0) return null;
  // Exact class-tab counts (owner ruling, `feat/exact-talent-points`) drop "at least".
  return k.kind === 'exact'
    ? `${n(k.points)} ${k.points === 1 ? 'point' : 'points'}`
    : `at least ${n(k.points)}`;
}

/**
 * The marker between what the known points pay for and the rest (FR-C1): "As of your last save: at
 * least 118 points waiting · they end here", or for the star tab "40 unspent · they end here".
 */
export function pathMarker(t: Pick<BuildTabView, 'known' | 'path' | 'tab'>): string {
  if (!t || typeof t !== 'object') return '';
  const w = CHARACTERS_WORDS.buildPath;
  const k = t.known ?? { kind: 'none', points: null, overBy: null };
  const stonks = (t.path ?? []).some((s) => s.talentId === 622 && s.cumulative !== null);
  const tail = stonks ? ` (${w.stonksReturns})` : '';
  if (k.kind === 'exact' && t.tab !== 0)
    return (k.points ?? 0) > 0
      ? `${n(k.points ?? 0)} ${k.points === 1 ? 'point waiting' : w.exactSuffix} · ${w.knownEnd}`
      : w.exactNone;
  if (k.kind === 'exact') {
    if (k.overBy !== null) return `Over budget by about ${n(k.overBy)}: the totals show where new points go`;
    if ((k.points ?? 0) > 0) return `${n(k.points ?? 0)} unspent · ${w.knownEnd}${tail}`;
    return w.allSpent;
  }
  return (k.points ?? 0) > 0 ? `${buildKnownLine(k.points ?? 0)}${tail}` : w.noneKnown;
}

/** "+40 → Veins of the Infernal". */
export const cumulativeLine = (cumulative: number, label: string) => `+${n(cumulative)} → ${label}`;

/**
 * FR-C6 / FR-C14: the overview line of one character, from its lead tab only (D-14, never adding
 * totals across tabs): "Tab 2 · at least 118 · Book of the Wise +84 · Leaf Thief +184", plus a star
 * part when more than 1 point is unspent ("Star talents · 40 unspent · Stonks! +30").
 */
export function buildOverviewLine(r: Pick<BuildRoadmap, 'presets' | 'status' | 'note'>, steps = 4): string {
  if (!r || typeof r !== 'object' || !Array.isArray(r.presets)) return '';
  if (r.note) return r.status;
  const lead = leadTab(r.presets);
  const parts: string[] = [];
  if (lead) {
    const { tab } = lead;
    const badge = tabBadge(tab);
    const next = (tab.path ?? []).filter((s) => s.cumulative !== null).slice(0, steps);
    parts.push(
      [
        `Tab ${tab.tab}`,
        badge ?? 'no unspent points known',
        ...next.map((s) => `${s.label} +${n(s.cumulative ?? 0)}`),
      ].join(' · '),
    );
  }
  const star = r.presets
    .map((p) => p.star)
    .find((s) => s?.known?.kind === 'exact' && (s.known.points ?? 0) > 1);
  if (star) {
    const first = (star.path ?? []).find((s) => s.cumulative !== null);
    parts.push(
      [
        CHARACTERS_WORDS.grid.star,
        starKnownWord(star.known as BuildKnownPoints),
        ...(first ? [`${first.label} +${n(first.cumulative ?? 0)}`] : []),
      ].join(' · '),
    );
  }
  return parts.length ? parts.join(' · ') : r.status;
}

/**
 * The lead tab (FR-C3 "Start here"): the tab of the preset's first Next points line, else the tab with
 * the most known points, else the first tab with an unmet step. Presets in use come first.
 */
export function leadTab(
  presets: readonly BuildPresetView[],
): { preset: BuildPresetView; tab: BuildTabView } | null {
  if (typeof (presets as { sort?: unknown } | null)?.sort !== 'function') return null;
  const order = [...presets].sort(
    (a, b) => (b.unspent ?? 0) - (a.unspent ?? 0) || Number(b.active) - Number(a.active),
  );
  for (const p of order) {
    const first = p.next[0]?.tab;
    const t = p.tabs.find((x) => x.tab === first && (x.path?.length ?? 0) > 0);
    if (t) return { preset: p, tab: t };
  }
  for (const p of order) {
    const t = p.tabs.find((x) => (x.path ?? []).some((s) => s.cumulative !== null));
    if (t) return { preset: p, tab: t };
  }
  return null;
}
