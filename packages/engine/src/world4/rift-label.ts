// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Rift's number (M26 FR-4, MASTER X1). The save stores the completed level count, `Rift[0]`; the
// game and the wiki show the level being played, one more. ActiveOn stores and compares `Rift[0]`
// (`account.rift.level`) and prints only through `riftLabel()`, so the two can't mix. It lives in
// account-state (rift.ts), so the Detectors use the same function; this re-exports it.
import { riftLabel } from '@idleon-forge/account-state';

export { riftLabel };

/** "Rift 26" for a stored 25 (Stamp Mastery). */
export const riftText = (level: number): string => `Rift ${riftLabel(level)}`;
