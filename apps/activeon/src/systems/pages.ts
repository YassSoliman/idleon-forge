// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 TR-7: the component map for dedicated System page bodies, keyed by the `page` ids of the
// engine's data-only `SYSTEM_HOMES` (packages/engine/src/now/system-homes.ts). A later module (M16,
// M18–M21) adds its picture with one `page` entry there and one component here, in its own PR. The
// generic header, Next Actions and Coverage sections stay; a body is drawn right after the Next Actions.
import type { SystemPageView } from '@idleon-forge/engine/now';
import { type ComponentType, createElement, Fragment, lazy } from 'react';
import { StarSignsSystemBody } from '../now/signs/SignsPanel';
import type { Session } from '../shell/session';
import { CauldronSeatsBody, CogBoardBody, TrappingBody, WorshipBody } from './SlotPictures';

/** M19 TR-8: the pictures load on first open; the seats (already in this chunk) follow them. */
const AlchemyLab = lazy(() => import('../alchemy/AlchemyLab'));
function AlchemyPage(p: SystemPageBodyProps) {
  return createElement(Fragment, null, createElement(AlchemyLab, p), createElement(CauldronSeatsBody, p));
}

export interface SystemPageBodyProps {
  s: Session;
  page: SystemPageView;
}

export const SYSTEM_PAGES: Readonly<Record<string, ComponentType<SystemPageBodyProps>>> = {
  // M16 (R6 QA): the account's Star Chart lives here and in the Account, not on every Signs tab.
  'star-signs': StarSignsSystemBody,
  // M20 TR-6: the Parallel Slot pictures.
  'cog-board': CogBoardBody,
  worship: WorshipBody,
  trapping: TrappingBody,
  'cauldron-seats': CauldronSeatsBody,
  // M19 FR-18, TR-8: the Alchemy page, its pictures in their own lazy chunk, then M20's cauldron seats.
  'alchemy-lab': AlchemyPage,
};
