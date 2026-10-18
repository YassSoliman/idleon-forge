// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Messages between the UI thread and the parsing Web Worker. Types only: the UI thread must never
// import the parser bundle at runtime (it is ~6 MB and patches built-in prototypes).
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import type { HistoryEntry } from '@idleon-forge/sync';
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

/**
 * What the engine needs besides the save (M10 TR-2, TR-6). Every parse carries the current Expected
 * Return, so the first result never flips on load.
 */
export interface EngineCall {
  expectedReturnSeconds: number;
  /** M1 `SaveHistory.sessionStart`; null in paste mode or without history. */
  sessionStartedAt: number | null;
  /** M1's learned Expected Return in seconds; null without enough history. */
  learnedExpectedReturnSeconds: number | null;
  /**
   * The earlier saves of this account, oldest first (M1 `SaveHistory.forEngine`): compact, bounded to
   * 30 days and `ENGINE_HISTORY_MAX_ENTRIES`, all saved before this save. Empty in paste mode (D2) and
   * without history. The worker drops any entry not saved before the parsed save.
   */
  history?: readonly HistoryEntry[];
  /** BuildInfo `knowledge` (the compiled Knowledge Base version once M11 ships its bundle). */
  knowledgeVersion: string;
}

/** The engine's output, or why it threw as a whole (FR-39). */
export type EngineOutcome = EngineResult | { error: string };

export interface ParseRequest {
  id: number;
  type: 'parse';
  input: ParseInput;
  /** The clock to parse at (epoch ms). */
  now: number;
  /** Run the engine after a clean parse (M10 TR-6). Without it, no engine runs. */
  engine?: EngineCall;
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

/** Re-run only the Expected-Return-dependent stage on the last clean parse (M10 TR-6). */
export interface RerunRequest {
  id: number;
  type: 'rerun';
  expectedReturnSeconds: number;
  now: number;
}

export type WorkerRequest = ParseRequest | WhatIfRequest | RerunRequest;

/** Why a save could not be read: bad paste, the parser gave up, the output changed shape, a crash or a hang. */
export type ParseFailureKind = 'input' | 'empty' | 'shape' | 'crash' | 'timeout' | 'updated';

/** A server build and save format (M1 FR-29). Either may be unknown. */
export interface BuildMark {
  serverBuild: number | null;
  saveVersion: number | null;
}

export type ParseResponse =
  | {
      id: number;
      ok: true;
      state: AccountState;
      historyState?: AccountState;
      /** The parser bundle's `verifiedBuilds`, for the patch rule (the UI can't import the bundle). */
      verifiedBuilds?: BuildMark;
      /** The engine's result for `state`, when the request asked for it (M10 TR-6). */
      result?: EngineOutcome;
      ms: number;
    }
  | {
      id: number;
      ok: false;
      kind: ParseFailureKind;
      message: string;
      /** The failed save's build, read from the raw save, when it got that far. */
      build?: BuildMark | null;
      verifiedBuilds?: BuildMark;
      ms: number;
    };

export type RerunResponse =
  | { id: number; ok: true; rerun: true; result: EngineOutcome; ms: number }
  | { id: number; ok: false; rerun: true; message: string; ms: number };

export type WorkerResponse = ParseResponse | RerunResponse;

/** What a parse resolves to on the UI thread: a response, or `superseded` when a newer save replaced it. */
export type ParseResult = ParseResponse | { superseded: true };
export type RerunResult = RerunResponse | { superseded: true };
