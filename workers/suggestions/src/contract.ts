// SPDX-License-Identifier: GPL-3.0-only
// The Suggestions Worker's public contract (M13 TR-3, TR-10, TR-22). Pure types and constants: the app
// imports this module (`@idleon-forge/suggestions-worker/contract`) and must get no runtime besides the
// constants below. What may leave the browser for a Suggestion is exactly this shape (ADR 0008).

export type SuggestionType = 'idea' | 'wrong' | 'confusing';

export const SUGGESTION_TYPES: readonly SuggestionType[] = ['idea', 'wrong', 'confusing'];

export interface SuggestionText {
  /** 0..280 code points. */
  whenIm: string;
  /** 10..600 code points, required. */
  iWant: string;
  /** 0..400 code points. */
  soThat: string;
  /** 0..1500 code points. */
  example: string;
}

export type OutputKind =
  | 'next-action'
  | 'verdict-blocker'
  | 'goal'
  | 'spend-plan-item'
  | 'purpose'
  | 'higher-leverage';

export const OUTPUT_KINDS: readonly OutputKind[] = [
  'next-action',
  'verdict-blocker',
  'goal',
  'spend-plan-item',
  'purpose',
  'higher-leverage',
];

export interface ReportContext {
  outputKind: OutputKind;
  /** Rendered with the anonymous renderer: characters as "<Class> lv <n>". */
  renderedText: string;
  /** Knowledge Base entry ids from the engine's provenance. */
  entryIds: string[];
  detectorIds: string[];
  /** Save field paths the Detectors read, never their raw blobs. */
  fieldPaths: string[];
  stale: boolean;
  contested: boolean;
  /** Higher-leverage line only: M5's option id. */
  optionId?: string;
  /** Present only while "Attach the numbers" is ticked; strings are enum-like ids, max 40 keys. */
  values?: Record<string, number | boolean | string>;
}

export type Screen = 'now' | 'character' | 'account' | 'suggestions' | 'settings' | 'other';
export type BrowserFamily = 'chrome' | 'edge' | 'firefox' | 'safari' | 'other';
export type BuildChannel = 'production' | 'preview' | 'local';

export interface SuggestionContext {
  schema: 1;
  /** M12 BuildInfo subset (M12 TR-4). */
  build: {
    app: string;
    commit: string;
    channel: BuildChannel;
    pr?: number;
    knowledge: string;
    parsers: { toolboxCommit: string; toolboxVersion: string; gameVersion: string };
  };
  /** The save's server build; never compared with a game version (M1 D3). */
  gameBuild: number | null;
  /** M2 Stage, e.g. "W2-mid". */
  stage: string | null;
  screen: Screen;
  character?: { class: string; level: number; verdict?: 'ready' | 'fix' | 'unknown' };
  expectedReturnHours?: number;
  saveAgeSeconds: number | null;
  browser: BrowserFamily;
  report?: ReportContext;
}

export interface SuggestionRequest {
  /** UUID v4, one per draft, reused on every retry. */
  clientId: string;
  type: SuggestionType;
  text: SuggestionText;
  context: SuggestionContext;
  turnstileToken: string;
  /** An expired Firebase ID token (M13 TR-4), never a live one. */
  proof: string;
}

export interface MineRequest {
  proof: string;
}

/** Add details (D4, TR-22): one answer to the newest approved question. */
export interface DetailsRequest {
  /** UUID v4, one per answer draft, reused on every retry. */
  clientId: string;
  /** 1..1500 code points, already name-scrubbed by the app. */
  text: string;
  turnstileToken: string;
  proof: string;
}

export type SuggestionStatus = 'received' | 'looking' | 'decision' | 'info' | 'planned' | 'done' | 'wontdo';

export interface MySuggestion {
  number: number;
  url: string;
  type: SuggestionType;
  iWant: string;
  createdAt: string;
  status: SuggestionStatus;
  reply?: string;
  /** The newest approved question, while `suggestion:needs-info` (D4). */
  question?: string;
  /** True until the player has answered that question. */
  canAddDetails?: boolean;
}

/** `201` for a new issue, `200` for an idempotent retry. A dry run (Preview origin) returns number 0. */
export interface CreateSuggestionResponse {
  number: number;
  url: string | null;
  dryRun?: true;
}

export interface MineResponse {
  items: MySuggestion[];
}

/** `201` when posted, `200` for an idempotent retry. */
export interface DetailsResponse {
  number: number;
  dryRun?: true;
}

export type SuggestionErrorCode =
  | 'invalid'
  | 'proof_missing'
  | 'proof_invalid'
  | 'live_token'
  | 'proof_too_old'
  | 'proof_unknown_key'
  | 'provider_not_allowed'
  | 'turnstile'
  | 'rate_limited'
  | 'daily_limit'
  | 'paused'
  | 'github_unavailable'
  | 'not_yours'
  | 'already_answered'
  | 'origin_not_allowed'
  | 'not_found';

export interface SuggestionError {
  error: SuggestionErrorCode;
  /** With `invalid`: the first field that failed, as a dotted path (e.g. "text.iWant"). */
  field?: string;
  /** With `rate_limited` and `daily_limit`. */
  retryAfterSeconds?: number;
}

/** Proof errors after which the app moves the draft to the outbox instead of asking to sign in (FR-15). */
export const OUTBOX_PROOF_ERRORS: readonly SuggestionErrorCode[] = [
  'proof_too_old',
  'proof_unknown_key',
  'live_token',
];

/** Field limits in Unicode code points (FR-3), shared by the app's form and the Worker. */
export const TEXT_LIMITS = {
  whenIm: { min: 0, max: 280 },
  iWant: { min: 10, max: 600 },
  soThat: { min: 0, max: 400 },
  example: { min: 0, max: 1500 },
  details: { min: 1, max: 1500 },
} as const;

/** Request body cap in bytes (TR-10). */
export const MAX_BODY_BYTES = 16 * 1024;

/** The request header that turns any request into a dry run (nothing is written to GitHub). */
export const DRY_RUN_HEADER = 'X-Suggestions-Dry-Run';

/** Turnstile action the widget must be rendered with (TR-5). */
export const TURNSTILE_ACTION = 'suggest';

export const PRODUCTION_ORIGIN = 'https://activeon.idleon.workers.dev';
export const PREVIEW_ORIGIN_PATTERN = /^https:\/\/pr-[0-9]{1,6}-activeon\.idleon\.workers\.dev$/;
