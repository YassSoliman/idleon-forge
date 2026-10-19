// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the read-only pages' module and data (EngineResult.world4).
import type { EngineResult } from '../result';

export { SOURCES as WORLD4_SOURCES } from './facts';
export { createWorld4Module } from './module';
export type * from './types';
export { buildWorld4View, WORLD4_PAGES } from './view';

/**
 * Whether a System has a read-only World 4 page for this account (the Systems index shows it as a page,
 * not "not covered yet"). True for `lab`, `cooking` and `breeding` once World 4 is reached.
 */
export const isWorld4ReadOnly = (result: Pick<EngineResult, 'world4'>, systemId: string): boolean =>
  result.world4?.readOnlyPages.includes(systemId) ?? false;
