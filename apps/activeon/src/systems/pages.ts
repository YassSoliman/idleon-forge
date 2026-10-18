// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 TR-7: the component map for dedicated System page bodies, keyed by the `page` ids of the
// engine's data-only `SYSTEM_HOMES` (packages/engine/src/now/system-homes.ts). A later module (M16,
// M18–M21) adds its picture with one `page` entry there and one component here, in its own PR. The
// generic header, Next Actions and Coverage sections stay; a body replaces only what is between them.
import type { SystemPageView } from '@idleon-forge/engine/now';
import type { ComponentType } from 'react';
import type { Session } from '../shell/session';

export interface SystemPageBodyProps {
  s: Session;
  page: SystemPageView;
}

export const SYSTEM_PAGES: Readonly<Record<string, ComponentType<SystemPageBodyProps>>> = {};
