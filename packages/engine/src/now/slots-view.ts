// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-T3: the Parallel Slots grid (the Timeline's `#slots` section). Owned by area T. Phase F
// declares the signature so the shell's view slot exists; it returns null until area T builds it.
import type { EngineResult } from '../result';
import type { NowView, SlotsView } from './view';

export function buildSlotsView(_result: EngineResult, _view: NowView): SlotsView | null {
  return null;
}
