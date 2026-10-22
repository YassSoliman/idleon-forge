// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The truth rules registry (M22 TR-3): every rule, in the order they run. One file per rule.
import { affordableWithinWallet } from './affordable-within-wallet';
import { nextNotAtTarget } from './next-not-at-target';
import { noPointsVsUnspent } from './no-points-vs-unspent';
import { rawMatchesState } from './raw-matches-state';
import type { Rule } from './rule';
import { sameFactEverywhere } from './same-fact-everywhere';
import { starTotalFloor } from './star-total-floor';
import { talentTotalVsAnswerKey } from './talent-total-vs-answer-key';
import { vaultPlanWithinWallet } from './vault-plan-within-wallet';

export const RULES: readonly Rule[] = [
  rawMatchesState,
  sameFactEverywhere,
  starTotalFloor,
  talentTotalVsAnswerKey,
  nextNotAtTarget,
  noPointsVsUnspent,
  affordableWithinWallet,
  vaultPlanWithinWallet,
];

export type { Rule, RuleInput } from './rule';
