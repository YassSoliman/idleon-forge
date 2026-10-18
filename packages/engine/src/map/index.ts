// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-9: `@idleon-forge/engine/map` (area M). The worker's `map` module, and the Map place's view and
// words for the lazy Map chunk (kept out of the `now` barrel so they stay out of the first load, TR-12).
export { buildMap, createMapModule, LAST_MAP_WORLD, MAP_FACT } from './module';
export {
  buildMapView,
  MAP_OVERLAYS,
  type MapBandView,
  type MapFrontierView,
  type MapGateView,
  type MapNodeState,
  type MapNodeView,
  type MapOverlay,
  type MapOverlayView,
  type MapPlaceView,
  type MapSheetDoorRow,
  type MapSheetView,
  type MapViewOptions,
  type MapWho,
} from './view';
export { MAP_WORDS } from './words';
