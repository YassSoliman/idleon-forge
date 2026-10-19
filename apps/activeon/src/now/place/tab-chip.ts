// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// G4 (M21): the one tab chip a character card keeps, the most useful one. With TabHealth, only a tab
// that is fix, behind or empty, the most severe first, then tab order; without it, Build or Cards.
// Moved from the M21 Roster (M24: the Roster became the character cards).
import type { NowView, TabHealth } from '@idleon-forge/engine/now';
import { type CharacterTab, characterTabs } from '../character-tabs';

type HealthTab = CharacterTab & { health?: (view: NowView, index: number) => TabHealth | null };
const SEVERITY = ['fix', 'behind', 'empty'] as const;

export function rowTabChip(
  view: NowView,
  index: number,
): { id: string; label: string; word: string | null } | null {
  const tabs = characterTabs.filter((t) => t.Component !== null) as HealthTab[];
  const withHealth = tabs.filter((t) => typeof t.health === 'function');
  if (withHealth.length > 0) {
    let best: { id: string; label: string; word: string; rank: number } | null = null;
    for (const t of withHealth) {
      const h = t.health?.(view, index);
      const rank = h ? SEVERITY.indexOf(h.level as (typeof SEVERITY)[number]) : -1;
      if (h && rank >= 0 && (best === null || rank < best.rank))
        best = { id: t.id, label: t.label, word: h.word, rank };
    }
    return best ? { id: best.id, label: best.label, word: best.word } : null;
  }
  if (view.builds.some((b) => b.index === index)) return { id: 'build', label: 'Build', word: null };
  if (view.cards?.characters.some((c) => c.index === index))
    return { id: 'cards', label: 'Cards', word: null };
  return null;
}
