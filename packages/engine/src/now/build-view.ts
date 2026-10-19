// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build view's view model (owner request 2026-10-18): M9's roadmaps with each character's name and
// the player-facing Source picked (#74). The UI renders it as is. Pure; UI-thread safe.
import type { EngineResult } from '../result';
import { sourceView } from './build-now-view';
import type { BuildRoadmapView } from './view';

/** The Build tab's deep link for a character: a bare `#build-<index>` anchor. */
export const buildHref = (index: number) => `#build-${index}`;

/** One view per roadmap, in save order; empty when the result carries no roadmaps. */
export function buildsView(result: EngineResult): BuildRoadmapView[] {
  return (result.builds ?? []).map((r) => {
    const c = result.characters.find((x) => x.index === r.index);
    const { sources, presets, ...rest } = r;
    return {
      ...rest,
      presets: presets.map(({ sources: ps, ...p }) => ({
        ...p,
        source: ps?.length ? sourceView(ps, r.stale, p.entryId) : null,
      })),
      name: c?.name ?? `Character ${r.index + 1}`,
      href: buildHref(r.index),
      source: sources.length ? sourceView(sources, r.stale, r.entryIds[0]) : null,
    };
  });
}
