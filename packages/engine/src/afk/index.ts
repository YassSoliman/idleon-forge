// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 AFK Safety's engine surface (M3 TR-3): the Expected Return, the blocker pipeline, the Verdict
// composer and the engine module.
export {
  AFK_SAFETY_ENTRIES,
  type AfkSafetyInput,
  classify,
  evaluateAfkSafety,
  NOT_COVERED_AFK_TYPES,
} from './evaluate';
export {
  DEFAULT_EXPECTED_RETURN_MS,
  type ExpectedReturnInput,
  HOUR_MS,
  resolveExpectedReturn,
  returnAtOf,
} from './expected-return';
export { AFK_INFO_ENTRIES, afkInfoLines } from './info';
export {
  type AfkSafetyModuleDeps,
  createAfkSafetyModule,
  expectedReturnOf,
  toModuleOutput,
} from './module';
export type * from './types';
export { composeVerdict } from './verdict';
