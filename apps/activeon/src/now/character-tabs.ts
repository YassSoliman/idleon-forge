// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The character page's tabs (owner request 2026-10-18). Focus is the character page: "Now" is
// today's Focus content, and every other tab registers here with ONE entry. A tab gets the Now view
// and the character's index, and renders whatever it likes from them. Its deep link is a bare
// `#<id>-<index>` anchor (`#build-3`, and `#now-3` for the Now tab; M17 TR-3), which the shell reads.
// M21 replaced the Characters tiles with the health matrix (FR-C7), so tabs no longer publish a status;
// each tab publishes `health` (FR-C7, now/tab-health.ts) for the Roster's one tab chip (G4), the
// Characters health matrix and the identity strip's badges.
//
// To add a tab: write a component taking `CharacterTabProps` in its own file, then add
// `{ id, label, Component: lazyPart(() => import('./MyTab'), (m) => m.MyTab) }` below. Every tab
// is its own lazy chunk (lazy-part.tsx): Focus renders it inside <Suspense>, so the main chunk only
// carries this list.
// The id must be lower-case letters only (it is the anchor prefix) and never `system`.
import type { NowView, TabHealth } from '@idleon-forge/engine/now';
import type { ComponentType } from 'react';
import { lazyPart } from '../lazy-part';

export interface CharacterTabProps {
  /** The whole Now view (the Build tab reads `view.builds`). */
  view: NowView;
  /** The character on the page (`CharacterState.index`). */
  index: number;
}

export interface CharacterTab {
  /** Anchor prefix and key: `build` gives `#build-<index>`. */
  id: string;
  label: string;
  /** Null only for "Now", which is Focus's own content. */
  Component: ComponentType<CharacterTabProps> | null;
  /** M21 FR-C7: the tab's health with a unit, or null when the tab has nothing to say. */
  health?: (view: NowView, index: number) => TabHealth | null;
}

export const NOW_TAB = 'now';

const TABS: readonly CharacterTab[] = [
  { id: NOW_TAB, label: 'Now', Component: null },
  {
    id: 'build',
    label: 'Build',
    Component: lazyPart(
      () => import('../characters/build/BuildView'),
      (m) => m.BuildTab,
    ),
  },
  // M18 F5 (FR-24): the Gear tab, `#gear-<index>`.
  {
    id: 'gear',
    label: 'Gear',
    Component: lazyPart(
      () => import('../gear/GearTab'),
      (m) => m.GearTab,
    ),
  },
  {
    id: 'cards',
    label: 'Cards',
    Component: lazyPart(
      () => import('./cards/CardsPanel'),
      (m) => m.CardsTab,
    ),
  },
  {
    id: 'signs',
    label: 'Signs',
    Component: lazyPart(
      () => import('./signs/SignsTab'),
      (m) => m.SignsTab,
    ),
  },
  // M20 F3 (FR-33): the Skills tab, `#skills-<index>`.
  {
    id: 'skills',
    label: 'Skills',
    Component: lazyPart(
      () => import('./SkillsTab'),
      (m) => m.SkillsTab,
    ),
  },
];

/** The tabs that publish health (FR-C7); their functions are in now/tab-health.ts. */
const HEALTH_TABS: ReadonlySet<string> = new Set(['build', 'gear', 'cards', 'signs', 'skills']);

// The health functions load as their own small chunk, started with this module, so they add nothing
// to the first load (M12 TR-12, owner budget). The first result arrives after the worker's parse,
// long after this tiny chunk; until it is in, a tab's health is null (no chip), never a wrong one.
let table: Readonly<Record<string, NonNullable<CharacterTab['health']>>> | null = null;
/** Resolves once the health functions are in (tests await it, like `preloadParts`). */
export const healthReady: Promise<void> = import('./tab-health').then(
  (m) => {
    table = m.TAB_HEALTH;
  },
  () => undefined,
);

/** The registered tabs, each with its health where it publishes one. */
export const characterTabs: readonly CharacterTab[] = TABS.map((t) =>
  HEALTH_TABS.has(t.id) ? { ...t, health: (view, index) => table?.[t.id]?.(view, index) ?? null } : t,
);

export const tabById = (id: string): CharacterTab | undefined => characterTabs.find((t) => t.id === id);

/** The deep link of a tab (M17 FR-7): `#now-<index>`, `#build-<index>` … (`?c=` is retired, D-2). */
export const tabHref = (id: string, index: number): string => `#${id}-${index}`;

/** `#build-3` -> { tab: 'build', index: 3 } when `build` is a registered tab other than Now; else null. */
export function parseTabHash(hash: string): { tab: string; index: number } | null {
  const m = /^#([a-z]+)-(\d+)$/.exec(hash);
  if (!m?.[1] || m[1] === NOW_TAB || !tabById(m[1])) return null;
  return { tab: m[1], index: Number(m[2]) };
}
