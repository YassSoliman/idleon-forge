// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 area S: `@idleon-forge/engine/systems-ui`, the UI-thread entry of the Systems area's lazy parts (the
// hub's report card, the System page frame, the picture bodies). Pure view builders and words only, no
// worker module, so the lazy chunks that import it stay small and the first load doesn't grow (TR-12).
// M17's hub view lives here too: only the lazy hub builds it (M21 Integration, TR-12).
export { buildSystemsView } from '../now/systems-view';
export type { AnvilPageView, AnvilRowView } from './anvil-view';
export { ANVIL_PAGE_HOURS, buildAnvilPageView } from './anvil-view';
export type * from './gaps-types';
export type { IndexTileView, SystemsIndexView } from './hub-view';
export { buildSystemsHubView } from './hub-view';
export type { FrameTone, SystemFrameView } from './page-view';
export { buildSystemPageFrameView, picturesOf } from './page-view';
export type * from './types';
export type * from './w4-types';
export type * from './w23-types';
export * from './words';
