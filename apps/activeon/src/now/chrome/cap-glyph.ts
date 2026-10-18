// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// A cap pill's kind as our own glyph (DS-5: glyph = kind), from its label: the anvil, worship, traps;
// and the `expanded` id that keeps a cap pill open across the Roster and Focus (R-PILL-1).
import type { ArtName } from '../../design/art/names';

export function capGlyph(label: string): ArtName {
  if (/anvil/i.test(label)) return 'now-cap-anvil';
  if (/worship|prayer/i.test(label)) return 'now-cap-worship';
  if (/trap/i.test(label)) return 'now-cap-trap';
  return 'now-hourglass';
}

/** The `expanded` id that keeps a cap pill open across the Roster and Focus (R-PILL-1). */
export const capOpenId = (key: string) => `cap:${key}`;
