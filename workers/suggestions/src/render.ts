// SPDX-License-Identifier: GPL-3.0-only
// Issue rendering and the label names (M13 TR-7). Player text is always inside a fenced code block whose
// fence is longer than any backtick run in it, so mentions, links, images, HTML and cross-references
// render as plain text and ping no one. The marker is the body's exact last line and is only ever parsed
// from issues the bot created.

import type { SuggestionContext, SuggestionRequest, SuggestionType } from './contract';

export const LABEL = {
  suggestion: 'suggestion',
  new: 'suggestion:new',
  needsInfo: 'suggestion:needs-info',
  report: 'report',
  claimed: 'listener:claimed',
  drafted: 'story:drafted',
  needsDecision: 'needs-decision',
  outcomeSpec: 'outcome:spec',
  outcomeKb: 'outcome:kb',
  outcomeTicket: 'outcome:ticket',
  outcomeWontfix: 'outcome:wontfix',
  outcomeDuplicate: 'outcome:duplicate',
} as const;

export function typeLabel(type: SuggestionType): string {
  return `suggestion:${type}`;
}

export function typeFromLabels(labels: readonly string[]): SuggestionType | null {
  for (const t of ['idea', 'wrong', 'confusing'] as const) if (labels.includes(typeLabel(t))) return t;
  return null;
}

/** Labels for a new Suggestion issue (FR-13). */
export function issueLabels(req: Pick<SuggestionRequest, 'type' | 'context'>): string[] {
  const labels = [LABEL.suggestion, typeLabel(req.type), LABEL.new];
  if (req.context.report) labels.push(LABEL.report);
  return labels;
}

const TITLE_PREFIX: Record<SuggestionType, string> = {
  idea: '[Idea]',
  wrong: "[Something's wrong]",
  confusing: '[Confusing]',
};

export const TITLE_MAX = 72;

// C0/C1 controls, DEL, line and paragraph separators, bidi overrides and zero-width joiners.
// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the point
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/gu;

/** `[Idea] <I want…>`, built from already-scrubbed text, control characters removed, ≤ 72 code points. */
export function issueTitle(type: SuggestionType, iWant: string): string {
  const prefix = `${TITLE_PREFIX[type]} `;
  const clean = iWant.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
  const room = TITLE_MAX - [...prefix].length;
  const chars = [...clean];
  if (chars.length <= room) return prefix + clean;
  const cut = chars.slice(0, room - 1).join('');
  const space = cut.lastIndexOf(' ');
  const head = space > room / 3 ? cut.slice(0, space) : cut;
  return `${prefix + head.trimEnd()}…`;
}

/** A fence longer than the longest backtick run in `s` (at least 3). */
export function fenceFor(s: string): string {
  let longest = 0;
  for (const run of s.match(/`+/g) ?? []) longest = Math.max(longest, run.length);
  return '`'.repeat(Math.max(3, longest + 1));
}

export function fenced(s: string, info: string): string {
  const f = fenceFor(s);
  return `${f}${info}\n${s.replace(/\r\n?/g, '\n')}\n${f}`;
}

export const MARKER_RE = /^<!-- activeon-suggestion v1 m:([a-z2-7]{16}) cid:([0-9a-f-]{36}) -->$/;
export const DETAILS_MARKER_RE = /^<!-- activeon-details v1 cid:([0-9a-f-]{36}) -->$/;
export const REPLY_MARKER = '<!-- activeon:reply -->';
export const QUESTION_MARKER = '<!-- activeon:question -->';

export function markerLine(m: string, clientId: string): string {
  return `<!-- activeon-suggestion v1 m:${m} cid:${clientId} -->`;
}

function field(heading: string, value: string): string {
  return value.trim() === ''
    ? `### ${heading}\n\n_(not given)_`
    : `### ${heading}\n\n${fenced(value, 'text')}`;
}

export function issueBody(
  req: { text: SuggestionRequest['text']; context: SuggestionContext },
  m: string,
  clientId: string,
): string {
  const json = JSON.stringify(req.context, null, 2);
  return [
    '_Sent from ActiveOn. Player text is shown exactly as written, as plain text._',
    field('When I’m…', req.text.whenIm),
    field('I want…', req.text.iWant),
    field('So that…', req.text.soThat),
    field('Game example', req.text.example),
    `<details><summary>Context</summary>\n\n${fenced(json, 'json')}\n\n</details>`,
    markerLine(m, clientId),
  ].join('\n\n');
}

export function detailsComment(text: string, clientId: string): string {
  return [
    '**The player added details:**',
    fenced(text, 'text'),
    `<!-- activeon-details v1 cid:${clientId} -->`,
  ].join('\n\n');
}

function lastLine(body: string): string {
  const lines = body.replace(/\s+$/, '').split('\n');
  return (lines[lines.length - 1] ?? '').trim();
}

/** The marker from a bot-created issue's last line, or null. */
export function parseMarker(body: string | null | undefined): { m: string; cid: string } | null {
  const match = MARKER_RE.exec(lastLine(body ?? ''));
  return match ? { m: match[1] as string, cid: match[2] as string } : null;
}

export function parseDetailsMarker(body: string | null | undefined): string | null {
  return DETAILS_MARKER_RE.exec(lastLine(body ?? ''))?.[1] ?? null;
}

/** The I want… text from a body this module rendered. */
export function parseIWant(body: string | null | undefined): string | null {
  const b = (body ?? '').replace(/\r\n?/g, '\n');
  const at = b.indexOf('### I want…\n\n');
  if (at < 0) return null;
  const rest = b.slice(at + '### I want…\n\n'.length);
  const open = /^(`{3,})text\n/.exec(rest);
  if (!open?.[1]) return null;
  const close = rest.indexOf(`\n${open[1]}\n`, open[0].length - 1);
  const closeEnd = close >= 0 ? close : rest.indexOf(`\n${open[1]}`, open[0].length - 1);
  if (closeEnd < 0) return null;
  return rest.slice(open[0].length, closeEnd);
}

/** Maintainer comment text for display: the marker lines removed. Shown as plain text by the app. */
export function stripMarkers(body: string): string {
  return body.split(REPLY_MARKER).join('').split(QUESTION_MARKER).join('').trim();
}
