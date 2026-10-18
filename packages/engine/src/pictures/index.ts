// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-10: `@idleon-forge/engine/pictures` (area S). The module is worker-side only; the UI imports
// the picture types from here with `import type` (their runtime never reaches the UI thread).
export { printerPicture, stampsPicture, statuesPicture, vaultPicture } from './build';
export { createPicturesModule } from './module';
export type * from './types';
