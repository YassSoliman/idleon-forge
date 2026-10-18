// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
//
// The GitHub-issue fallback for Report this and Suggest (M10 FR-30, FR-31, TR-10). Since M13 the app
// sends Suggestions in-app through the Suggestions Worker (src/suggestions/); these pre-filled GitHub
// issue links remain for players who aren't signed in (paste mode, D6) and for builds without the
// Worker configured. The payload is the TR-10 allow-list only: entry and field ids, versions, Stage,
// class and level, the rendered text with every character name replaced by "[character]". Never a
// name, uid, email or save data.
import type { BuildInfo } from '@idleon-forge/release';
import type {
  SuggestionContext,
  SuggestionText,
  SuggestionType,
} from '@idleon-forge/suggestions-worker/contract';
import { scrubNames } from '../suggestions/scrub';

export { scrubNames };

export const REPO_ISSUES = 'https://github.com/YassSoliman/idleon-forge/issues/new';
/** GitHub rejects much longer new-issue URLs (TR-10). */
export const MAX_URL_BYTES = 7500;
export const PUBLIC_NOTICE = 'This will be posted publicly on GitHub';

export interface ReportInput {
  outputKind:
    | 'next-action'
    | 'purpose'
    | 'higher-leverage'
    | 'spend-line'
    | 'verdict'
    | 'goal'
    | 'engine-error';
  entryIds: string[];
  fields: string[];
  text: string;
  stale: boolean;
  contested: boolean;
  /** Detector ids and the numbers the advice used, when the engine records them (M13 FR-9, FR-10). */
  detectorIds?: string[];
  optionId?: string;
  values?: Record<string, number | boolean | string>;
  screen: 'now' | 'character' | 'account';
  character: { classLabel: string; level: number } | null;
  stage: string;
  knowledge: string;
  gameBuild: number | null;
  build: BuildInfo;
}

const bytes = (s: string) => new TextEncoder().encode(s).length;

function issueUrl(
  params: Record<string, string>,
  body: (textBudget: number) => string,
  text: string,
): string {
  const build = (t: string) => {
    const q = new URLSearchParams({ ...params, body: body(t.length) });
    return `${REPO_ISSUES}?${q.toString()}`;
  };
  let url = build(text);
  // The action text is truncated first (TR-10).
  let keep = text.length;
  while (bytes(url) > MAX_URL_BYTES && keep > 0) {
    keep = Math.max(0, keep - Math.max(50, Math.ceil(keep / 4)));
    url = build(text.slice(0, keep));
  }
  return url;
}

const versionsOf = (b: BuildInfo, knowledge: string, gameBuild: number | null) =>
  [
    `- ActiveOn: ${b.app} (${b.commit.slice(0, 12)}, ${b.channel}${b.pr ? ` #${b.pr}` : ''})`,
    // The bundle's display reads "knowledge 2026.10.17.2"; the label already says Knowledge Base.
    `- Knowledge Base: ${knowledge.replace(/^knowledge /, '')}`,
    `- Game build: ${gameBuild ?? 'unknown'}`,
    `- Parser: ${b.parsers.toolboxCommit.slice(0, 12)} (game ${b.parsers.gameVersion})`,
  ].join('\n');

/** The pre-filled `kb-correction` issue for Report this. */
export function reportUrl(r: ReportInput, names: readonly string[]): string {
  const text = scrubNames(r.text, names);
  const body = (keep: number) =>
    [
      '### What looks wrong',
      '',
      '<!-- Say what you expected instead. -->',
      '',
      '### What ActiveOn said',
      '',
      `> ${text.slice(0, keep)}`,
      '',
      '### Context (no names, no save data)',
      '',
      `- Output: ${r.outputKind}`,
      `- Entry: ${r.entryIds.join(', ') || 'none'}`,
      `- Fields: ${r.fields.join(', ') || 'none'}`,
      `- Screen: ${r.screen}`,
      `- Character: ${r.character ? `${r.character.classLabel} lv ${r.character.level}` : 'none'}`,
      `- Stage: ${r.stage}`,
      `- Stale: ${r.stale ? 'yes' : 'no'} · Contested: ${r.contested ? 'yes' : 'no'}`,
      versionsOf(r.build, r.knowledge, r.gameBuild),
    ].join('\n');
  const title = `Advice correction: ${r.entryIds[0] ?? r.outputKind}`;
  return issueUrl({ template: 'kb-correction.yml', labels: 'kb-correction', title }, body, text);
}

/** The pre-filled `idea` issue for Suggest (type Idea) and "Something confusing here?" (Confusing). */
export function suggestUrl(
  type: 'idea' | 'confusing',
  ctx: {
    screen: 'now' | 'character' | 'account';
    character: { classLabel: string; level: number } | null;
    stage: string;
    knowledge: string;
    gameBuild: number | null;
    build: BuildInfo;
  },
): string {
  const body = () =>
    [
      type === 'confusing' ? '### What was confusing' : '### Your idea',
      '',
      '',
      '### Context (no names, no save data)',
      '',
      `- Screen: ${ctx.screen}`,
      `- Character: ${ctx.character ? `${ctx.character.classLabel} lv ${ctx.character.level}` : 'none'}`,
      `- Stage: ${ctx.stage}`,
      versionsOf(ctx.build, ctx.knowledge, ctx.gameBuild),
    ].join('\n');
  return issueUrl(
    {
      template: 'idea.yml',
      labels: type === 'confusing' ? 'idea,confusing' : 'idea',
      title: type === 'confusing' ? 'Something confusing: ' : 'Idea: ',
    },
    body,
    '',
  );
}

const TYPE_TITLE: Record<SuggestionType, string> = {
  idea: 'Idea',
  wrong: "Something's wrong",
  confusing: 'Confusing',
};

/**
 * The in-app form's words as a pre-filled GitHub issue, for a player who can't send in-app (signed out
 * or paste mode, M13 D6). Text is already scrubbed; the context is the same JSON the preview shows.
 */
export function fallbackIssueUrl(
  type: SuggestionType,
  text: SuggestionText,
  context: SuggestionContext,
): string {
  const json = JSON.stringify(context, null, 2);
  const body = (keep: number) =>
    [
      "### When I'm…",
      '',
      text.whenIm || '_(empty)_',
      '',
      '### I want…',
      '',
      text.iWant.slice(0, keep) || '_(empty)_',
      '',
      '### So that…',
      '',
      text.soThat || '_(empty)_',
      '',
      '### Game example',
      '',
      text.example || '_(empty)_',
      '',
      '<details><summary>Context (no names, no save data)</summary>',
      '',
      '```json',
      json,
      '```',
      '',
      '</details>',
    ].join('\n');
  const title = `[${TYPE_TITLE[type]}] ${text.iWant.replace(/\s+/g, ' ').trim().slice(0, 72)}`;
  return issueUrl({ labels: context.report ? 'suggestion,report' : 'suggestion', title }, body, text.iWant);
}
