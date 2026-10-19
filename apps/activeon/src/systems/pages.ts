// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24: `FULL_PAGES`, the Systems whose whole page is their own (they render `SystemFrame` themselves),
// keyed by System id, each a lazy chunk under ./pages/. Every other System renders the thin page
// (frame/SimplePage.tsx) with its `SYSTEM_PAGES` body, below, until that body moves onto the template.
//
// M17 TR-7: the component map for dedicated System page bodies, keyed by the `page` ids of the
// engine's data-only `SYSTEM_HOMES` (packages/engine/src/now/system-homes.ts). A later module (M16,
// M18–M21) adds its picture with one `page` entry there and one component here, in its own PR. The
// generic header, Next Actions and Coverage sections stay; a body is drawn right after the Next Actions.
// Each body is a lazy chunk (lazy-part.tsx); SystemPage renders it inside <Suspense>.
import type { SystemPageView } from '@idleon-forge/engine/now';
import { type ComponentType, createElement, Fragment } from 'react';
import { lazyPart, retryable } from '../lazy-part';
import type { Session } from '../shell/session';
import type { FullPage } from './frame/SimplePage';

// Each chunk import is `retryable`, so a Retry after a failed fetch re-requests it (lazy-part.tsx).
const slotPictures = retryable(() => import('./SlotPictures'));
const gearPages = retryable(() => import('../gear/GearPages'));
const alchemyLab = retryable(() => import('../alchemy/AlchemyLab'));
const newPictures = retryable(() => import('./NewPictures'));
const starChart = retryable(() => import('./StarChartPage'));
const bubbaPage = retryable(() => import('../bubba/BubbaPage'));
const world4Pages = retryable(() => import('../world4/World4Pages'));

/** M24: a full System page's props: the session and the engine's page view with its frame. */
export interface FullPageProps {
  s: Session;
  page: FullPage;
}

const full = (load: () => Promise<{ default: ComponentType<FullPageProps> }>) => {
  const chunk = retryable(load);
  return lazyPart(() => chunk().then((m) => m.default));
};

/** M24: the Systems with their own page (boards after/sys/<Name>.dc.html). */
export const FULL_PAGES: Readonly<Record<string, ComponentType<FullPageProps>>> = {
  anvil: full(() => import('./pages/AnvilPage')),
  stamps: full(() => import('./pages/StampsPage')),
  'talent-presets': full(() => import('./pages/TalentPresetsPage')),
  'upgrade-vault': full(() => import('./pages/VaultPage')),
  gear: full(() => import('./pages/GearToolsPage')),
  minigames: full(() => import('./pages/MinigamesPage')),
  statues: full(() => import('./pages/StatuesPage')),
  'star-signs': full(() => import('./pages/StarSignsPage')),
};

export interface SystemPageBodyProps {
  s: Session;
  page: SystemPageView;
}

export const SYSTEM_PAGES: Readonly<Record<string, ComponentType<SystemPageBodyProps>>> = {
  // M16 (R6 QA): the account's Star Chart lives here and in the Account, not on every Signs tab.
  'star-signs': lazyPart(() => starChart().then((m) => m.StarSignsSystemBody)),
  // M20 TR-6: the Parallel Slot pictures.
  'cog-board': lazyPart(() => slotPictures().then((m) => m.CogBoardBody)),
  worship: lazyPart(() => slotPictures().then((m) => m.WorshipBody)),
  trapping: lazyPart(() => slotPictures().then((m) => m.TrappingBody)),
  'cauldron-seats': lazyPart(() => slotPictures().then((m) => m.CauldronSeatsBody)),
  // M18 FR-26, FR-27: the gear heat strip and the Smithy's set cards.
  gear: lazyPart(() => gearPages().then((m) => m.GearPageBody)),
  'armor-smithy': lazyPart(() => gearPages().then((m) => m.ArmorSmithyBody)),
  // M21 FR-S4, TR-10: the new System page pictures (area S's `pictures` engine step).
  stamps: lazyPart(() => newPictures().then((m) => m.StampsBody)),
  statues: lazyPart(() => newPictures().then((m) => m.StatuesBody)),
  'upgrade-vault': lazyPart(() => newPictures().then((m) => m.VaultBody)),
  printer: lazyPart(() => newPictures().then((m) => m.PrinterBody)),
  // M23 FR-3: the Bubba page, its own lazy chunk.
  bubba: lazyPart(() => bubbaPage().then((m) => m.default)),
  // M24: the read-only World 4 pages, one lazy chunk.
  laboratory: lazyPart(() => world4Pages().then((m) => m.LaboratoryPage)),
  cooking: lazyPart(() => world4Pages().then((m) => m.CookingPage)),
  breeding: lazyPart(() => world4Pages().then((m) => m.BreedingPage)),
  // M19 FR-18, TR-8: the Alchemy page, its pictures in their own lazy chunk, then M20's cauldron seats.
  'alchemy-lab': lazyPart(() =>
    Promise.all([alchemyLab(), slotPictures()]).then(
      ([lab, seats]) =>
        function AlchemyPage(p: SystemPageBodyProps) {
          return createElement(
            Fragment,
            null,
            createElement(lab.default, p),
            createElement(seats.CauldronSeatsBody, p),
          );
        },
    ),
  ),
};
