// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-C7: each tab's health for the Roster's one tab chip (G4), the Characters health matrix and the
// identity strip's badges. Read from the engine's own view data, so it adds no judgment: a count with
// its unit ("at least 215 points", "45 levels behind", "1 of 4 slots"). In the first load with
// character-tabs.ts (N's Roster chip reads it), so it is written small. It lives in now/ because
// bundle-guards keeps characters/ lazy. Severity order: fix, behind, empty, unknown, ok.
import type { NowView, TabHealth } from '@idleon-forge/engine/now';

type Health = (view: NowView, index: number) => TabHealth | null;

const n = (x: number) => x.toLocaleString('en-US');
/** "1 point", "3 points". */
const of = (x: number, one: string) => `${n(x)} ${one}${x === 1 ? '' : 's'}`;
const h = (level: TabHealth['level'], word: string, count?: number): TabHealth =>
  count === undefined ? { level, word } : { level, word, count };
const OK = h('ok', 'ok');

export const SEVERITY: Readonly<Record<TabHealth['level'], number>> = {
  fix: 0,
  behind: 1,
  empty: 2,
  unknown: 3,
  ok: 4,
};

/** Build: an empty preset first, then points known to be waiting (tabs 1–3), then star points. */
const build: Health = (view, index) => {
  const r = view.builds.find((b) => b.index === index);
  if (!r) return null;
  if (r.note) return h('unknown', 'no build yet');
  const ps = r.presets;
  const most = Math.max(0, ...ps.map((p) => p.unspent ?? 0));
  const word = `${ps.some((p) => p.tabs.some((t) => t.known?.kind === 'exact')) ? '' : 'at least '}${of(most, 'point')}`;
  if (most > 0)
    return ps.some((p) => p.tabs.length > 0 && p.tabs.every((t) => t.spent === 0))
      ? h('empty', `empty preset · ${word}`, most)
      : h('behind', word, most);
  const star = Math.max(
    0,
    ...ps.map((p) => (p.star?.known?.kind === 'exact' ? (p.star.known.points ?? 0) : 0)),
  );
  return star > 1 ? h('behind', of(star, 'star point'), star) : OK;
};

/** The skilling tools: the Gear tab shows them apart ("only while mining"), so its counts leave them out. */
const TOOLS: ReadonlySet<string> = new Set(['pickaxe', 'hatchet', 'rod', 'net']);

/**
 * Gear (M18): a better piece held, then empty slots, then the worst gap in levels. Armour, weapon and
 * jewellery only (M24 QA P2: counting the tools made the badge 11 against the page's "7 to replace" and
 * the Characters "3 empty slots" that were really tool slots).
 */
const gear: Health = (view, index) => {
  const s = view.gear?.characters
    .find((x) => x.index === index)
    ?.slots.filter((x) => x.state !== 'm20' && !TOOLS.has(x.slot));
  if (!s) return null;
  const count = (st: string) => s.filter((x) => x.state === st).length;
  const worst = Math.max(0, ...s.map((x) => (x.state === 'behind' ? (x.levelsBehind ?? 0) : 0)));
  // M24: the tab badge counts the slots that want something (a better piece held, empty, behind).
  const want = count('held-upgrade') + count('empty') + count('behind');
  if (count('held-upgrade')) return h('fix', `${of(count('held-upgrade'), 'better piece')} held`, want);
  if (count('empty')) return h('empty', of(count('empty'), 'empty slot'), want);
  if (worst) return h('behind', `${of(worst, 'level')} behind`, want);
  return s.every((x) => x.state === 'unknown') ? h('unknown', 'not known') : OK;
};

/**
 * Cards (M8): the wrong preset worn, then empty slots, then better cards owned. "Wrong preset" only when
 * the Cards tab itself says to switch: its AFK-target recommendation puts the cards in another preset.
 * An empty or mixed active preset that the tab fills in place is its empty slots or its swaps, never
 * "switch it" (M24 QA P1-11: `presetFits` is false for an empty preset too).
 */
const cards: Health = (view, index) => {
  const c = view.cards?.characters.find((x) => x.index === index);
  if (!c) return null;
  if (c.unknown) return h('unknown', 'not known');
  const afk = c.recommendations.find((r) => r.reason === 'afk-target');
  if (c.presetFits === false && afk?.preset != null && afk.preset !== c.activePreset)
    return h('fix', 'wrong preset');
  const slots = of(c.slotCount, 'slot');
  if (c.emptySlots > 0) return h('empty', `${n(c.emptySlots)} of ${slots} empty`, c.emptySlots);
  const swaps = c.recommendations.reduce((s, r) => s + (r.done ? 0 : r.swaps.length), 0);
  return swaps > 0 ? h('behind', of(swaps, 'better card'), swaps) : h('ok', `${n(c.slotCount)} of ${slots}`);
};

/** Signs (M16): the signs worn against the recommended ones. */
const signs: Health = (view, index) => {
  const c = view.starSigns?.characters.find((x) => x.index === index);
  if (!c?.activity) return null;
  // Nothing to swap to is fine, never a "0" badge (M24 QA, end-game save).
  return c.matches || c.recommended.length === 0
    ? OK
    : h('behind', `${of(c.recommended.length, 'sign')} to swap`, c.recommended.length);
};

/** Skills (M20): Parallel Slots this character could fill now. */
const skills: Health = (view, index) => {
  const s = view.skills.find((x) => x.index === index)?.slots ?? [];
  if (s.length === 0) return null;
  const filled = s.filter((x) => x.state === 'filled' || x.state === 'capped').length;
  const open = s.filter((x) => x.state !== 'locked' && x.state !== 'not-covered').length;
  const fillable = s.filter((x) => x.state === 'fillable').length;
  return fillable > 0
    ? h('behind', `${n(filled)} of ${of(open, 'slot')}`, fillable)
    : h('ok', `${n(filled)} of ${of(open, 'slot')}`);
};

/** Each tab's health by tab id (the tabs without one publish none). */
export const TAB_HEALTH: Readonly<Record<string, Health>> = { build, gear, cards, signs, skills };
