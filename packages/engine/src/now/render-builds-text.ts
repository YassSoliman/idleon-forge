// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-8: the golden snapshots' `## Builds` section, owned by area C. For each character and preset
// it will list the tile badges and the first 4 path steps with their bands. Phase F wires the section
// to this stub, so the goldens carry one stable line until area C builds the path.
import type { EngineResult } from '../result';

export const BUILDS_NOT_BUILT = 'Not built yet (M21 area C: the Build path).';

export function renderBuildsText(
  _result: EngineResult,
  _opts: { label: (index: number) => string; classOf: (index: number) => string },
): string {
  return BUILDS_NOT_BUILT;
}
