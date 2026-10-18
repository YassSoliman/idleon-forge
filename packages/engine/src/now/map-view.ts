// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-9: the Map place's view, as the `now` barrel and the golden see it (area M). The real view lives
// in `../map/view.ts` and ships only in the lazy Map place's chunk (`@idleon-forge/engine/map`): the
// barrel is in the first load, so anything it reaches statically would land there too (TR-12). Importing
// `@idleon-forge/engine/map` (the golden does, through `./map`) registers it here; until then this
// returns null, which every caller already handles.
import type { MapPlaceView, MapViewOptions } from '../map/view';
import type { EngineResult } from '../result';
import type { NowView } from './view';

type Impl = (result: EngineResult, view: NowView, opts?: MapViewOptions) => MapPlaceView | null;
let impl: Impl | null = null;

/** Called once by `@idleon-forge/engine/map`. */
export function registerMapView(f: Impl): void {
  impl = f;
}

export function buildMapView(
  result: EngineResult,
  view: NowView,
  opts: MapViewOptions = {},
): MapPlaceView | null {
  return impl ? impl(result, view, opts) : null;
}
