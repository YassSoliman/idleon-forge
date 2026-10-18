// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-F5 (moved verbatim from now/Roster.tsx in Phase F): today's Verdict pill. The new TR-5 `Pill`
// atom (urgency, glyph, verb) lives in Pill.tsx; this one stays until the areas move onto it and
// Integration removes it (FR-I3). now/Roster.tsx re-exports it as `Pill`.
import type { RosterRow } from '@idleon-forge/engine/now';

export function LegacyPill({ pill }: { pill: Pick<RosterRow['pill'], 'kind' | 'text'> }) {
  return <span className={`pill ${pill.kind}`}>{pill.text}</span>;
}
