// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Signs tab's and Star Chart section's view model (M16): M16's view with the player-facing Source
// picked (#74). The UI renders it as is. Pure; UI-thread safe.
import type { EngineResult } from '../result';
import { sourceView } from './build-now-view';
import type { StarSignsNowView } from './view';

/** The Signs tab's deep link for a character: a bare `#signs-<index>` anchor (character-tabs.ts). */
export const signsHref = (index: number) => `#signs-${index}`;

export function starSignsView(result: EngineResult): StarSignsNowView | null {
  const v = result.starSigns ?? null;
  if (!v) return null;
  return { ...v, source: v.sources.length ? sourceView(v.sources, false, 'star-signs.goal.signs') : null };
}
