// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// IdleOn Toolbox's public website page for each System (#74, owner ruling 2026-10-17, follow-up): when no
// wiki or guide covers an item, the Source link goes to the page of the tool the number comes from,
// never to its code. The muted "Calculated by IdleOn Toolbox" credit links to the same page.
//
// Authored table. Every route was checked on 2026-10-17 at the parser pin (Toolbox 3.3.96, commit
// 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1):
//   1. the route is a file under Toolbox's `pages/` (Next.js file routing), and that page or the component
//      it renders shows the feature (e.g. pages/account/misc/general.jsx renders Currencies: boss keys
//      and Colosseum tickets, and the Minigame highscores);
//   2. https://idleontoolbox.com/<route> answers 200, and its __NEXT_DATA__ "page" is that route (an
//      unknown route answers 404). The site is a client-rendered SPA, so the page body itself is empty.
// Pure and dependency-free: the Now view model imports it on the UI thread.

export const TOOLBOX_SITE = 'https://idleontoolbox.com';

export interface ToolboxPage {
  /** Route on TOOLBOX_SITE, e.g. "/account/world-1/anvil". */
  path: string;
  /** The page's name in Toolbox's navigation, e.g. "Anvil". */
  name: string;
}

const page = (path: string, name: string): ToolboxPage => ({ path, name });
const CHARACTERS = page('/characters', 'Characters');
const GENERAL = page('/account/misc/general', 'General');

/** By System id (systems.yaml). Systems Toolbox doesn't compute (metapath, portals, spend) are absent. */
export const TOOLBOX_PAGES: Readonly<Record<string, ToolboxPage>> = {
  afk: CHARACTERS,
  classes: CHARACTERS,
  talents: CHARACTERS,
  'talent-presets': CHARACTERS,
  skills: CHARACTERS,
  cards: CHARACTERS,
  'post-office': CHARACTERS,
  'upgrade-vault': page('/account/misc/upgrade-vault', 'Upgrade Vault'),
  'gem-shop': page('/account/prem-currency/gem-shop', 'Gem Shop'),
  pets: page('/account/prem-currency/pets', 'Pets'),
  'merit-shop': page('/account/task-board/merits', 'Merits'),
  'task-unlocks': page('/account/task-board/unlocks', 'Unlocks'),
  minigames: GENERAL,
  obols: GENERAL,
  statues: GENERAL,
  shrines: GENERAL,
  'boss-keys': GENERAL,
  colosseum: GENERAL,
  quests: page('/account/misc/quests', 'Quests'),
  stamps: page('/account/world-1/stamps', 'Stamps'),
  anvil: page('/account/world-1/anvil', 'Anvil'),
  forge: page('/account/world-1/forge', 'Forge'),
  bribes: page('/account/world-1/bribes', 'Bribes'),
  owl: page('/account/clickers/owl', 'Owl'),
  poppy: page('/account/clickers/kangaroo', 'Poppy the Kangaroo'),
  alchemy: page('/account/world-2/cauldrons', 'Cauldrons'),
  'alchemy-bubbles': page('/account/world-2/bubbles', 'Bubbles'),
  'alchemy-vials': page('/account/world-2/vials', 'Vials'),
  arcade: page('/account/world-2/arcade-shop', 'Arcade Shop'),
  islands: page('/account/world-2/islands', 'Islands'),
  refinery: page('/account/world-3/refinery', 'Refinery'),
  construction: page('/account/world-3/construction', 'Construction'),
  printer: page('/account/world-3/printer', 'Printer'),
  worship: page('/account/world-3/worship', 'Worship'),
  trapping: page('/account/world-3/traps', 'Traps'),
  'death-note': page('/account/world-3/death-note', 'Death Note'),
  'salt-lick': page('/account/world-3/salt-lick', 'Salt Lick'),
  prayers: page('/account/world-3/prayers', 'Prayers'),
  equinox: page('/account/world-3/equinox', 'Equinox'),
  'atom-collider': page('/account/world-3/atom-collider', 'Atom Collider'),
  lab: page('/account/world-4/laboratory', 'Laboratory'),
  cooking: page('/account/world-4/cooking', 'Cooking'),
  breeding: page('/account/world-4/breeding', 'Breeding'),
};

/** Entries whose number comes from a different page than their System's. */
export const TOOLBOX_ENTRY_PAGES: Readonly<Record<string, ToolboxPage>> = {
  // pages/account/misc/tournament.jsx renders PetMart (parsers/world-7/tournament.ts).
  'pets.check.mart-gems': page('/account/misc/tournament', 'Tournament'),
};

/** The Toolbox page for an entry id (`<system>.<type>.<slug>`), or null when Toolbox has none. */
export function toolboxPage(entryId: string): { url: string; title: string } | null {
  const p = TOOLBOX_ENTRY_PAGES[entryId] ?? TOOLBOX_PAGES[entryId.split('.')[0] ?? ''];
  return p ? { url: `${TOOLBOX_SITE}${p.path}`, title: `IdleOn Toolbox: ${p.name}` } : null;
}
