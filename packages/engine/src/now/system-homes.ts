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
  'star-signs': { tab: 'signs', page: 'star-signs' },
  // Phase 2: ActiveOn's own AFK concept lives on the Timeline (FR-31).
  afk: { timeline: true },
  // M20 TR-6: the Parallel Slot pictures, and the Skills tab (M17 FR-23a, X9).
  construction: { page: 'cog-board' },
  worship: { page: 'worship' },
  trapping: { page: 'trapping' },
  // M19 FR-18: the four Alchemy Systems share one page; M20's cauldron seats are a part of it.
  alchemy: { page: 'alchemy-lab' },
  'alchemy-bubbles': { page: 'alchemy-lab' },
  'alchemy-vials': { page: 'alchemy-lab' },
  'alchemy-p2w': { page: 'alchemy-lab' },
  skills: { tab: 'skills' },
  // M18 TR-7: Gear & Tools is a Character page tab with an account page (the heat strip); the Smithy a page.
  gear: { tab: 'gear', page: 'gear' },
  'armor-smithy': { page: 'armor-smithy' },
};

/** The Character page tab a System's home is, or null for its System page. */
export const tabHomeOf = (systemId: string): string | null => SYSTEM_HOMES[systemId]?.tab ?? null;

/** Whether a System's home is the Timeline (FR-31: `afk` Next Actions link there). */
export const timelineHome = (systemId: string): boolean => SYSTEM_HOMES[systemId]?.timeline === true;
