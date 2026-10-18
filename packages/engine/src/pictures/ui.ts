// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 area S: `@idleon-forge/engine/systems-ui`, the UI-thread entry of the Systems area's lazy parts (the
// hub's report card, the System page frame, the picture bodies). Pure view builders and words only, no
// worker module, so the lazy chunks that import it stay small and the first load doesn't grow (TR-12).
export { buildSystemsHubView } from './hub-view';
export { buildSystemPageFrameView, picturesOf } from './page-view';
export type * from './types';
export * from './words';
