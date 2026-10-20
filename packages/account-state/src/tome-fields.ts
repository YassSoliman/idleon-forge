// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M26 FR-16's `account.tome` comes from (M1 TR-11). Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

export const TOME_FIELD_SOURCES: Record<string, string> = {
  'account.tome':
    'account.tome (tome[].name/index/tomeLvReq/quantity/points/maxPoints/color/requiredQuantities/x2, bonuses, totalPoints, top, nametagClaim), accountOptions[196], accountOptions[197]',
};

export const TOME_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {};

export const TOME_FIELD_SECTIONS: Record<string, string[]> = {
  'account.tome': ['tome'],
};
