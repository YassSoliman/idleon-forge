// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The package's type entry point (package.json "types"). The runtime is dist/index.js, bundled from
// src/index.ts, which pulls in the vendored parsers; consumers never typecheck those.
import type {
  ParsedSave,
  ParseOptions,
  RawSaveEnvelope,
  ToolboxCalls,
  UpstreamPin,
  VerifiedBuilds,
} from './types';

export { InvalidSaveInputError, normalizeEnvelope, parseEnvelopeText } from './envelope';
export { withFrozenClock } from './frozen-clock';
export type {
  AnvilSpeedTerms,
  MapKillRate,
  ParsedSave,
  ParseOptions,
  RawSaveEnvelope,
  SideReadName,
  SideReadReport,
  StampEvaluation,
  ToolboxBubba,
  ToolboxBubbaTables,
  ToolboxCalls,
  UpstreamPin,
  VaultCostRun,
  VaultPricedRow,
  VaultPricing,
  VerifiedBuilds,
} from './types';

/**
 * Runs Toolbox's `parseData()` over one envelope with the clock frozen at `options.now`.
 * Never throws for a bad save: like Toolbox, a failed parse returns an empty `account`, which
 * @idleon-forge/account-state turns into a hard error.
 */
export declare function parseSave(envelope: RawSaveEnvelope, options: ParseOptions): ParsedSave;

/** The Toolbox commit these parsers were vendored from. */
export declare const upstream: UpstreamPin;

/** The newest game builds this parser pin has parsed cleanly (see `VerifiedBuilds`). */
export declare const verifiedBuilds: VerifiedBuilds;

/** Toolbox runtime functions beyond `parseData()` (src/calls.ts). Worker only: the runtime patches prototypes. */
export declare const toolboxCalls: ToolboxCalls;
