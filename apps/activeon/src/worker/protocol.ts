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

/**
 * Reserved for M5 (#16): run a Toolbox function on a modified copy of a character from the last clean
 * parse (e.g. getMaxDamage with another map or target). Defined by M5's spec; M1 only reserves it.
 */
export interface WhatIfQuery {
  kind: string;
  [key: string]: unknown;
}

export interface ParseRequest {
  id: number;
  type: 'parse';
  input: ParseInput;
  /** The clock to parse at (epoch ms). */
  now: number;
  /**
   * Also parse at `now = lastCloudSave` and return that state as `historyState`, for save history
   * (M1 FR-21): the account as it was at that save, independent of when a tab parsed it. Set it only
   * for a live save that is new to history; it costs a second parse.
   */
  withHistory?: boolean;
}

export interface WhatIfRequest {
  id: number;
  type: 'what-if';
  query: WhatIfQuery;
  now: number;
}

export type WorkerRequest = ParseRequest | WhatIfRequest;

/** Why a save could not be read: bad paste, the parser gave up, the output changed shape, a crash or a hang. */
export type ParseFailureKind = 'input' | 'empty' | 'shape' | 'crash' | 'timeout';

export type ParseResponse =
  | { id: number; ok: true; state: AccountState; historyState?: AccountState; ms: number }
  | { id: number; ok: false; kind: ParseFailureKind; message: string; ms: number };

/** What a parse resolves to on the UI thread: a response, or `superseded` when a newer save replaced it. */
export type ParseResult = ParseResponse | { superseded: true };
