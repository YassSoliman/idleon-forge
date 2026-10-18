// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The character page's tabs (owner request 2026-10-18). Focus is the character page: "Now" is
// today's Focus content, and every other tab registers here with ONE entry. A tab gets the Now view
// and the character's index, and renders whatever it likes from them. Its deep link is a bare
// `#<id>-<index>` anchor (`#build-3`); `NowScreen` reads it on load and on `hashchange`.
//
// To add a tab: write a component taking `CharacterTabProps`, then add `{ id, label, Component }`
// below. The id must be lower-case letters only (it is the anchor prefix).
import type { NowView } from '@idleon-forge/engine/now';
import type { ComponentType } from 'react';
import { BuildTab } from './BuildView';

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
}

export const NOW_TAB = 'now';

export const characterTabs: readonly CharacterTab[] = [
  { id: NOW_TAB, label: 'Now', Component: null },
  { id: 'build', label: 'Build', Component: BuildTab },
];

export const tabById = (id: string): CharacterTab | undefined => characterTabs.find((t) => t.id === id);

/** The deep link of a tab: `?c=<index>` for Now, `?c=<index>#<id>-<index>` for the others. */
export const tabHref = (id: string, index: number): string =>
  id === NOW_TAB ? `?c=${index}` : `?c=${index}#${id}-${index}`;

/** `#build-3` -> { tab: 'build', index: 3 } when `build` is a registered tab; else null. */
export function parseTabHash(hash: string): { tab: string; index: number } | null {
  const m = /^#([a-z]+)-(\d+)$/.exec(hash);
  if (!m?.[1] || m[1] === NOW_TAB || !tabById(m[1])) return null;
  return { tab: m[1], index: Number(m[2]) };
}
