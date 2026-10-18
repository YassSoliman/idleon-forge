// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs: the Signs tab's one status line on the Characters grid, and the sign-list words the
// tab shares. Area C's (M21 §9). Moved out of SignsPanel.tsx (area S) in Phase F. It is its own small
// module, not part of SignsTab.tsx, because character-tabs.ts is in the first load and SignsTab.tsx is a
// lazy chunk (bundle-guards.ts LAZY_ONLY).
import type { NowView } from '@idleon-forge/engine/now';

export const list = (xs: readonly string[]) => (xs.length ? xs.join(' + ') : 'nothing');

/** M17 FR-13: the Signs tab's one status line on the Characters grid. */
export function signsStatus(view: NowView, index: number): string | null {
  const c = view.starSigns?.characters.find((x) => x.index === index);
  if (!c?.activity) return null;
  const wear = `wear ${list(c.recommended)}${c.matches ? ' ✓' : ''}`;
  if (c.canChange === true) return `${wear} · can change signs`;
  return c.killsToTelescope !== null
    ? `${wear} · Telescope in about ${c.killsToTelescope.toLocaleString('en-US')} kills`
    : wear;
}
