// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What a Suggestion carries besides the player's words (M13 TR-3, FR-9, FR-10, ADR 0008): build
// versions, the save's game build and age, the Stage, the screen, the class and level in question, and
// for Report this the advice's provenance. Never a name, the uid, an email or the save. Pure: the form
// rebuilds it at send time (TR-9) and the preview shows exactly this.
import { type AccountState, accountReportFields } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import type { BuildInfo } from '@idleon-forge/release';
import type {
  BrowserFamily,
  OutputKind,
  ReportContext,
  Screen,
  SuggestionContext,
  SuggestionText,
  SuggestionType,
} from '@idleon-forge/suggestions-worker/contract';
import { TEXT_LIMITS } from '@idleon-forge/suggestions-worker/contract';
import { anonymize, type NamedCharacter, scrubNames } from './scrub';

/** The output kinds the Now screen's Report this controls use (M10), mapped to M13's (TR-3). */
export type AppOutputKind =
  | 'next-action'
  | 'purpose'
  | 'higher-leverage'
  | 'spend-line'
  | 'verdict'
  | 'goal'
  | 'engine-error';

const KIND: Record<AppOutputKind, OutputKind | null> = {
  'next-action': 'next-action',
  purpose: 'purpose',
  'higher-leverage': 'higher-leverage',
  'spend-line': 'spend-plan-item',
  verdict: 'verdict-blocker',
  goal: 'goal',
  'engine-error': null,
};

/** One piece of advice a Report this came from, as the Now screen has it. */
export interface ReportSource {
  outputKind: AppOutputKind;
  entryIds: string[];
  /** Save field paths (Provenance.fields). */
  fields: string[];
  /** The advice as rendered, names included: anonymized before it is stored or sent. */
  text: string;
  stale: boolean;
  contested: boolean;
  detectorIds?: string[];
  optionId?: string;
  /** The numbers this advice used (FR-10), when the engine recorded them. */
  values?: Record<string, number | boolean | string>;
}

/** Where the form was opened: the screen, and the character in Focus, if any. */
export interface Scene {
  state: AccountState | null;
  /** Null while there is no advice, or when the engine failed. */
  result: EngineResult | null;
  characterIndex: number | null;
  screen: Screen;
  expectedReturnSeconds: number | null;
  now: number;
}

// The Worker's patterns (workers/suggestions/src/validate.ts). Anything else is dropped here, so a
// value that would be refused never reaches the request or the preview.
const ID = /^[A-Za-z0-9_.:/[\]-]{1,160}$/;
const FIELD_PATH = /^[A-Za-z0-9_.:/[\]*-]{1,160}$/;
const SHORT = /^[A-Za-z0-9_.:+/-]{1,80}$/;
const VALUE_STRING = /^[a-z0-9_.-]{1,40}$/;
const RENDERED_MAX = 1000;

const short = (v: string | undefined): string => {
  const s = (v ?? '').replace(/[^A-Za-z0-9_.:+/-]/g, '-').slice(0, 80);
  return SHORT.test(s) ? s : 'unknown';
};

export function browserFamily(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  const family: BrowserFamily = /Edg\//.test(ua)
    ? 'edge'
    : /Firefox\/|FxiOS\//.test(ua)
      ? 'firefox'
      : /Chrome\/|CriOS\//.test(ua)
        ? 'chrome'
        : /Safari\//.test(ua)
          ? 'safari'
          : 'other';
  return family;
}

export function namedCharacters(scene: Pick<Scene, 'result'>): NamedCharacter[] {
  return (scene.result?.characters ?? []).map((c) => ({
    name: c.name,
    classLabel: c.classLabel,
    level: c.level,
  }));
}

/** Every character name the scrub must catch: the Account State's and the engine's. */
export function accountNames(scene: Pick<Scene, 'state' | 'result'>): string[] {
  return [
    ...(scene.state?.characters ?? []).map((c) => c.name),
    ...(scene.result?.characters ?? []).map((c) => c.name),
  ].filter((n) => typeof n === 'string' && n.trim().length > 0);
}

/** FR-6: without the account's character names the scrub can't work, so nothing may be sent. */
export function namesUnavailable(state: AccountState | null): boolean {
  return state?.diagnostics?.failedSideReads?.includes('charNames') ?? false;
}

const cut = (s: string, max: number) => {
  const cps = [...s];
  return cps.length <= max ? s : `${cps.slice(0, max - 1).join('')}…`;
};

/** The report part of the context (FR-9, FR-10). `values` only when "Attach the numbers" is ticked. */
export function buildReport(
  src: ReportSource,
  characters: readonly NamedCharacter[],
  names: readonly string[],
  attachValues: boolean,
): ReportContext | null {
  const outputKind = KIND[src.outputKind];
  if (!outputKind) return null;
  const report: ReportContext = {
    outputKind,
    renderedText: cut(anonymize(src.text, characters, names), RENDERED_MAX),
    entryIds: [...new Set(src.entryIds)].filter((id) => ID.test(id)).slice(0, 50),
    detectorIds: [...new Set(src.detectorIds ?? [])].filter((id) => ID.test(id)).slice(0, 50),
    fieldPaths: [...new Set(src.fields)].filter((p) => FIELD_PATH.test(p)).slice(0, 100),
    stale: src.stale,
    contested: src.contested,
  };
  if (src.optionId && ID.test(src.optionId)) report.optionId = src.optionId;
  const values = attachValues ? cleanValues(src.values, names) : null;
  if (values) report.values = values;
  return report;
}

/** Report values as the Worker accepts them: ids for keys, finite numbers, booleans, enum-like strings. */
export function cleanValues(
  values: ReportSource['values'],
  names: readonly string[],
): Record<string, number | boolean | string> | null {
  if (!values) return null;
  const out: Record<string, number | boolean | string> = {};
  for (const [k, v] of Object.entries(values).slice(0, 40)) {
    if (!ID.test(k)) continue;
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string' && VALUE_STRING.test(v) && scrubNames(v, names) === v) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** FR-10 as narrowed by RT-16: ticked by default for Something's wrong only. */
export const attachByDefault = (type: SuggestionType) => type === 'wrong';

export function hasValues(src: ReportSource | null, names: readonly string[]): boolean {
  return cleanValues(src?.values, names) !== null;
}

/** The whole context (TR-3), rebuilt from the current save at send time (TR-9). */
export function buildContext(
  scene: Scene,
  build: BuildInfo,
  report: ReportContext | null,
  browser: BrowserFamily = browserFamily(),
): SuggestionContext {
  const fields = scene.state
    ? accountReportFields(scene.state, scene.characterIndex, scene.now)
    : { gameBuild: null, saveAgeSeconds: null, character: null };
  const ctx: SuggestionContext = {
    schema: 1,
    build: {
      app: short(build.app),
      commit: short(build.commit),
      channel: build.channel,
      knowledge: short(build.knowledge),
      parsers: {
        toolboxCommit: short(build.parsers.toolboxCommit),
        toolboxVersion: short(build.parsers.toolboxVersion),
        gameVersion: short(build.parsers.gameVersion),
      },
    },
    gameBuild:
      typeof fields.gameBuild === 'number' && Number.isInteger(fields.gameBuild) && fields.gameBuild >= 0
        ? fields.gameBuild
        : null,
    stage: scene.result ? short(scene.result.stage.id) : null,
    screen: scene.screen,
    saveAgeSeconds: fields.saveAgeSeconds,
    browser,
  };
  if (build.channel === 'preview' && build.pr) ctx.build.pr = build.pr;
  const ch = fields.character;
  if (
    ch &&
    typeof ch.class === 'string' &&
    SHORT.test(ch.class) &&
    Number.isInteger(ch.level) &&
    ch.level >= 0
  ) {
    ctx.character = { class: ch.class, level: ch.level };
    const verdict = scene.result?.characters.find((c) => c.index === scene.characterIndex)?.verdict.kind;
    if (verdict) ctx.character.verdict = verdict;
  }
  if (scene.expectedReturnSeconds !== null && scene.expectedReturnSeconds > 0) {
    ctx.expectedReturnHours = Math.min(720, Math.round((scene.expectedReturnSeconds / 3600) * 100) / 100);
  }
  if (report) ctx.report = report;
  return ctx;
}

/** The player's words after the scrub (FR-6): what the preview shows and the Worker receives. */
export function scrubText(text: SuggestionText, names: readonly string[]): SuggestionText {
  return {
    whenIm: scrubNames(text.whenIm, names),
    iWant: scrubNames(text.iWant, names),
    soThat: scrubNames(text.soThat, names),
    example: scrubNames(text.example, names),
  };
}

export const codePoints = (s: string): number => [...s].length;

/** FR-3: I want… is required (10..600 code points, not blank); the rest only have maximums. */
export function textProblem(text: SuggestionText): keyof SuggestionText | null {
  for (const k of ['whenIm', 'iWant', 'soThat', 'example'] as const) {
    const n = codePoints(text[k]);
    if (n > TEXT_LIMITS[k].max) return k;
  }
  if (codePoints(text.iWant) < TEXT_LIMITS.iWant.min || text.iWant.trim() === '') return 'iWant';
  return null;
}

export const EMPTY_TEXT: SuggestionText = { whenIm: '', iWant: '', soThat: '', example: '' };
