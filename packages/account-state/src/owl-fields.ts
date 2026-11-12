// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M26 FR-51's `account.owl` comes from (M1 TR-11). Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

export const OWL_FIELD_SOURCES: Record<string, string> = {
  'account.owl':
    'account.owl (upgrades[].name/level/cost/x3/unlocked, bonuses[].bonus, feathers, progress, nextLvReq, featherRate, restartMulti), accountOptions[253..264]',
};

/** Not required: a save from before Orion has no accountOptions[263..264] (the field is then null). */
export const OWL_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {};

export const OWL_FIELD_SECTIONS: Record<string, string[]> = {
  'account.owl': ['owl'],
};
