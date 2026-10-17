// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
//
// STUB FOR M13 TO REPLACE. Report this and Suggest (M10 FR-30, FR-31, TR-10) before M13 ships: they
// open a pre-filled GitHub issue form in a new tab. M13 owns `ReportContext`, `SuggestionContext`,
// the name scrub and the issue-body renderer (`packages/suggestions`, M13 TR-1); when it lands, these
// builders give way to `openSuggestionForm(type, context)`. Until then the payload is the TR-10
// allow-list only: entry and field ids, versions, Stage, class and level, the rendered text with
// every character name replaced by "[character]". Never a name, uid, email or save data.
import type { BuildInfo } from '@idleon-forge/release';

export const REPO_ISSUES = 'https://github.com/YassSoliman/idleon-forge/issues/new';
/** GitHub rejects much longer new-issue URLs (TR-10). */
export const MAX_URL_BYTES = 7500;
export const PUBLIC_NOTICE = 'This will be posted publicly on GitHub';

export interface ReportInput {
  outputKind: 'next-action' | 'purpose' | 'higher-leverage' | 'spend-line' | 'verdict' | 'engine-error';
  entryIds: string[];
  fields: string[];
  text: string;
  stale: boolean;
  contested: boolean;
  screen: 'now' | 'character' | 'account';
  character: { classLabel: string; level: number } | null;
  stage: string;
  knowledge: string;
  gameBuild: number | null;
  build: BuildInfo;
}

/** M13 FR-6's rule, minimal: every account character name in free text becomes "[character]". */
export function scrubNames(text: string, names: readonly string[]): string {
  let out = text;
  for (const n of [...names].filter((x) => x.trim().length > 0).sort((a, b) => b.length - a.length))
    out = out.split(n).join('[character]');
  return out;
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
    `- Knowledge Base: ${knowledge}`,
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
