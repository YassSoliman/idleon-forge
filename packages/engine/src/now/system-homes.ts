// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 TR-7: where a System lives, as data the golden harness can read. A System's home is its entry
// here, otherwise its generic System page (FR-23a). An entry can point a System at a Character page
// tab (`tab`, an id registered in apps/activeon/src/now/character-tabs.ts) or at a dedicated page
// component (`page`, mapped to a React component in apps/activeon/src/systems/pages.ts by a later
// module's own PR). Hub membership comes from the registry's `kind`, not from this table.

export interface SystemHome {
  /** A Character page tab: "See it" opens that character's tab. */
  tab?: string;
  /** A dedicated page component id (a later module's picture). */
  page?: string;
  /** Phase 2: the Timeline. */
  timeline?: true;
}

export const SYSTEM_HOMES: Readonly<Record<string, SystemHome>> = {
  talents: { tab: 'build' },
  'talent-presets': { tab: 'build' },
  'talent-resets': { tab: 'build' },
  cards: { tab: 'cards' },
};

/** The Character page tab a System's home is, or null for its System page. */
export const tabHomeOf = (systemId: string): string | null => SYSTEM_HOMES[systemId]?.tab ?? null;
