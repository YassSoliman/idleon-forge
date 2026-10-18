// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-9: the Map place's view, joining names on the UI thread (M4 TR-9). Owned by area M. Phase F
// declares the signature so the shell's view slot exists; it returns null until area M builds it.
import type { EngineResult } from '../result';
import type { MapView, NowView } from './view';

export function buildMapView(_result: EngineResult, _view: NowView): MapView | null {
  return null;
}
