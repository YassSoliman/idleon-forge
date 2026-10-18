// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-9: the golden snapshots' `## Map` section, owned by area M (worlds, gates, frontier, markers).
// Phase F wires the section to this stub, so the goldens carry one stable line until area M builds it.
import type { MapView } from './view';

export const MAP_NOT_BUILT = 'Not built yet (M21 area M: the Map place).';

export function renderMapText(
  _view: MapView | null,
  _opts: { label: (index: number) => string; classOf: (index: number) => string },
): string {
  return MAP_NOT_BUILT;
}
