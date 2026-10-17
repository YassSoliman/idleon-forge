// SPDX-License-Identifier: GPL-3.0-only
// Status and trusted-comment rules (M13 TR-8). They live in the Worker so the app never hard-codes
// label names.

import type { SuggestionStatus } from './contract';
import { LABEL, QUESTION_MARKER, REPLY_MARKER, stripMarkers } from './render';

export interface IssueState {
  state: 'open' | 'closed';
  /** GitHub's `state_reason`: completed, not_planned, reopened, duplicate or null. */
  stateReason: string | null;
  labels: readonly string[];
}

/** First match wins (TR-8). */
export function statusOf(issue: IssueState): SuggestionStatus {
  const has = (l: string) => issue.labels.includes(l);
  const closed = issue.state === 'closed';
  if (closed && issue.stateReason === 'completed') return 'done';
  if (closed && (issue.stateReason === 'not_planned' || issue.stateReason === 'duplicate')) return 'wontdo';
  if (has(LABEL.outcomeWontfix) || has(LABEL.outcomeDuplicate)) return 'wontdo';
  // GitHub closes as completed by default; an older close without a reason counts as done.
  if (closed) return 'done';
  if (has(LABEL.needsInfo)) return 'info';
  if (has(LABEL.needsDecision)) return 'decision';
  if (has(LABEL.outcomeSpec) || has(LABEL.outcomeKb) || has(LABEL.outcomeTicket)) return 'planned';
  if (has(LABEL.claimed) || has(LABEL.drafted)) return 'looking';
  return 'received';
}

export interface IssueComment {
  id: number;
  body: string;
  createdAt: string;
  /** Numeric GitHub id of the author; null for a deleted account. */
  authorId: number | null;
  authorLogin: string | null;
  /** True when GitHub reports the author as a Bot (an App), never a User named like one. */
  authorIsBot: boolean;
  lastEditedAt: string | null;
  editorId: number | null;
}

/** A maintainer comment: author's numeric id allow-listed, and never edited by anyone else (TR-8). */
export function isMaintainerComment(c: IssueComment, maintainerIds: ReadonlySet<number>): boolean {
  if (c.authorIsBot || c.authorId === null || !maintainerIds.has(c.authorId)) return false;
  if (c.lastEditedAt !== null && c.editorId !== c.authorId) return false;
  return true;
}

export function parseMaintainerIds(raw: string | undefined): Set<number> {
  const ids = new Set<number>();
  for (const part of (raw ?? '').split(/[\s,]+/)) {
    if (/^[0-9]{1,12}$/.test(part)) ids.add(Number(part));
  }
  return ids;
}

const newest = (a: IssueComment, b: IssueComment) => Date.parse(b.createdAt) - Date.parse(a.createdAt);

export function newestMarked(
  comments: readonly IssueComment[],
  marker: string,
  maintainerIds: ReadonlySet<number>,
): IssueComment | null {
  return (
    [...comments]
      .sort(newest)
      .find((c) => c.body.includes(marker) && isMaintainerComment(c, maintainerIds)) ?? null
  );
}

export function replyOf(
  comments: readonly IssueComment[],
  maintainerIds: ReadonlySet<number>,
): string | null {
  const c = newestMarked(comments, REPLY_MARKER, maintainerIds);
  return c ? stripMarkers(c.body) : null;
}

export function questionOf(
  comments: readonly IssueComment[],
  maintainerIds: ReadonlySet<number>,
): IssueComment | null {
  return newestMarked(comments, QUESTION_MARKER, maintainerIds);
}
