// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Messages between the UI thread and the parsing Web Worker. Types only: the UI thread must never
// import the parser bundle at runtime (it is ~6 MB and patches built-in prototypes).
import type { AccountState } from '@idleon-forge/account-state';
import type { RawSaveEnvelope } from '@idleon-forge/toolbox-parsers';

export type ParseInput =
  /** An envelope assembled by the live listener. */
  | { kind: 'envelope'; envelope: RawSaveEnvelope }
  /** Text pasted by the player (Toolbox's "Copy for support" JSON, or a bare save). */
  | { kind: 'text'; text: string };

export interface ParseRequest {
  id: number;
  input: ParseInput;
  /** The clock to parse at (epoch ms). */
  now: number;
}

/** Why a save could not be read: bad paste, the parser gave up, or the output changed shape. */
export type ParseFailureKind = 'input' | 'empty' | 'shape' | 'crash';

export type ParseResponse =
  | { id: number; ok: true; state: AccountState; ms: number }
  | { id: number; ok: false; kind: ParseFailureKind; message: string };
