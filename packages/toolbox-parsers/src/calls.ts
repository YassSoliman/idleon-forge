// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Toolbox runtime functions the Account State needs beyond `parseData()`, gathered in one object so the
// parse worker can inject them (account-state never imports this package's runtime, ADR 0006). Each
// module appends its entries here; nothing in vendor/ is edited.
import { getMaxDamage } from '../vendor/parsers/damage';
import { frontierRates, onMap } from './frontier-rates';

export const toolboxCalls = {
  /** Toolbox damage, hit chance, survivability and kill rates for one character (vendor/parsers/damage.ts). */
  getMaxDamage,
  /** M2 TR-2: every character's kill rate on one map, through the clone. */
  frontierRates,
  /** M2 TR-2: the clone itself, for the identity contract test. */
  onMap,
};
