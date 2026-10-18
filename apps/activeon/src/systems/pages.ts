// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 TR-7: the component map for dedicated System page bodies, keyed by the `page` ids of the
// engine's data-only `SYSTEM_HOMES` (packages/engine/src/now/system-homes.ts). A later module (M16,
// M18–M21) adds its picture with one `page` entry there and one component here, in its own PR. The
// generic header, Next Actions and Coverage sections stay; a body is drawn right after the Next Actions.
// Each body is a lazy chunk (lazy-part.tsx); SystemPage renders it inside <Suspense>.
import type { SystemPageView } from '@idleon-forge/engine/now';
import { type ComponentType, createElement, Fragment } from 'react';
import { lazyPart } from '../lazy-part';
import { StarSignsSystemBody } from '../now/signs/SignsPanel';
import type { Session } from '../shell/session';

const slotPictures = () => import('./SlotPictures');
const gearPages = () => import('../gear/GearPages');

export interface SystemPageBodyProps {
  s: Session;
  page: SystemPageView;
}

export const SYSTEM_PAGES: Readonly<Record<string, ComponentType<SystemPageBodyProps>>> = {
  // M16 (R6 QA): the account's Star Chart lives here and in the Account, not on every Signs tab.
  'star-signs': StarSignsSystemBody,
  // M20 TR-6: the Parallel Slot pictures.
  'cog-board': lazyPart(() => slotPictures().then((m) => m.CogBoardBody)),
  worship: lazyPart(() => slotPictures().then((m) => m.WorshipBody)),
  trapping: lazyPart(() => slotPictures().then((m) => m.TrappingBody)),
  'cauldron-seats': lazyPart(() => slotPictures().then((m) => m.CauldronSeatsBody)),
  // M18 FR-26, FR-27: the gear heat strip and the Smithy's set cards.
  gear: lazyPart(() => gearPages().then((m) => m.GearPageBody)),
  'armor-smithy': lazyPart(() => gearPages().then((m) => m.ArmorSmithyBody)),
  // M19 FR-18, TR-8: the Alchemy page, its pictures in their own lazy chunk, then M20's cauldron seats.
  'alchemy-lab': lazyPart(() =>
    Promise.all([import('../alchemy/AlchemyLab'), slotPictures()]).then(
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
