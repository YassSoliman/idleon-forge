// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-C7: each tab's health for the Characters health matrix, the identity strip's tab badges and
// the Roster tab chip (G4). Read from the engine's own view data, so it adds no judgment: a count with
// its unit ("at least 215 points", "45 levels behind", "1 of 4 slots"). Read by the lazy
// Characters place and, loaded on demand, by the identity strip (never in the first load: M12 TR-12).
// It lives in now/ beside character-tabs.ts. Severity order: fix, behind, empty, unknown, ok.
import type { NowView, TabHealth } from '@idleon-forge/engine/now';

const n = (x: number) => x.toLocaleString('en-US');
const plural = (x: number, one: string, many = `${one}s`) => `${n(x)} ${x === 1 ? one : many}`;

export const SEVERITY: Readonly<Record<TabHealth['level'], number>> = {
  fix: 0,
  behind: 1,
  empty: 2,
  unknown: 3,
  ok: 4,
};

/** Build: an empty preset first, then points known to be waiting (tabs 1–3, then the star tab). */
export function buildHealth(view: NowView, index: number): TabHealth | null {
  const r = view.builds.find((b) => b.index === index);
  if (!r) return null;
  if (r.note) return { level: 'unknown', word: 'no build yet' };
  const most = Math.max(0, ...r.presets.map((p) => p.unspent ?? 0));
  const exact = r.presets.some((p) => p.tabs.some((t) => t.known?.kind === 'exact'));
  const points = `${exact ? '' : 'at least '}${plural(most, 'point')}`;
  const empty = r.presets.some((p) => p.tabs.length > 0 && p.tabs.every((t) => t.spent === 0));
  if (empty && most > 0) return { level: 'empty', word: `empty preset · ${points}` };
  if (most > 0) return { level: 'behind', word: points };
  const star = Math.max(
    0,
    ...r.presets.map((p) => (p.star?.known?.kind === 'exact' ? (p.star.known.points ?? 0) : 0)),
  );
  if (star > 1) return { level: 'behind', word: `${plural(star, 'star point')}` };
  return { level: 'ok', word: 'ok' };
}

/** Gear (M18): a better piece held, then empty slots, then the worst gap in levels. */
export function gearHealth(view: NowView, index: number): TabHealth | null {
  const c = view.gear?.characters.find((x) => x.index === index);
  if (!c) return null;
  const slots = c.slots.filter((s) => s.state !== 'm20');
  const held = slots.filter((s) => s.state === 'held-upgrade').length;
  if (held) return { level: 'fix', word: `${plural(held, 'better piece')} held` };
  const empty = slots.filter((s) => s.state === 'empty').length;
  if (empty) return { level: 'empty', word: `${plural(empty, 'empty slot')}` };
  const worst = Math.max(0, ...slots.map((s) => (s.state === 'behind' ? (s.levelsBehind ?? 0) : 0)));
  if (worst > 0) return { level: 'behind', word: `${plural(worst, 'level')} behind` };
  if (slots.every((s) => s.state === 'unknown')) return { level: 'unknown', word: 'not known' };
  return { level: 'ok', word: 'ok' };
}

/** Cards (M8): the wrong preset worn, then empty slots, then better cards owned. */
export function cardsHealth(view: NowView, index: number): TabHealth | null {
  const c = view.cards?.characters.find((x) => x.index === index);
  if (!c) return null;
  if (c.unknown) return { level: 'unknown', word: 'not known' };
  if (c.presetFits === false) return { level: 'fix', word: 'wrong preset' };
  if (c.emptySlots > 0)
    return { level: 'empty', word: `${n(c.emptySlots)} of ${plural(c.slotCount, 'slot')} empty` };
  const swaps = c.recommendations.reduce((s, r) => s + (r.done ? 0 : r.swaps.length), 0);
  if (swaps > 0) return { level: 'behind', word: `${plural(swaps, 'better card')}` };
  return { level: 'ok', word: `${n(c.slotCount)} of ${plural(c.slotCount, 'slot')}` };
}

/** Signs (M16): the signs worn against the recommended ones. */
export function signsHealth(view: NowView, index: number): TabHealth | null {
  const c = view.starSigns?.characters.find((x) => x.index === index);
  if (!c?.activity) return null;
  if (!c.matches) return { level: 'behind', word: `${plural(c.recommended.length, 'sign')} to swap` };
  return { level: 'ok', word: 'ok' };
}

/** Skills (M20): Parallel Slots this character could fill now. */
export function skillsHealth(view: NowView, index: number): TabHealth | null {
  const c = view.skills.find((x) => x.index === index);
  if (!c || c.slots.length === 0) return null;
  const filled = c.slots.filter((s) => s.state === 'filled' || s.state === 'capped').length;
  const open = c.slots.filter((s) => s.state !== 'locked' && s.state !== 'not-covered').length;
  const word = `${n(filled)} of ${plural(open, 'slot')}`;
  if (c.slots.some((s) => s.state === 'fillable')) return { level: 'behind', word };
  return { level: 'ok', word };
}

/** The most severe of a set of healths, ties broken by the given order (tab order). */
export function worst<T extends { health: TabHealth }>(items: readonly T[]): T | null {
  let best: T | null = null;
  for (const x of items)
    if (x.health.level !== 'ok' && (!best || SEVERITY[x.health.level] < SEVERITY[best.health.level]))
      best = x;
  return best;
}

/** Each tab's health by tab id, in tab order (the tabs without one publish none). */
export const TAB_HEALTH: Readonly<Record<string, (view: NowView, index: number) => TabHealth | null>> = {
  build: buildHealth,
  gear: gearHealth,
  cards: cardsHealth,
  signs: signsHealth,
  skills: skillsHealth,
};
