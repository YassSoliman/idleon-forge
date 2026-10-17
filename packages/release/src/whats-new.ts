// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// whats-new.json from first-parent main history (M12 TR-7). Pure: no git, no network.
import { type Commit, parseTitle, parseUpstream, parseWhatsNewLine, prOf, utcDay } from './commits.ts';
import type { WhatsNewEntry, WhatsNewFeed, WhatsNewSection } from './types.ts';

export const MAX_ENTRIES = 100;
export const MAX_TEXT = 120;

export interface FeedOptions {
  knowledgePath?: string;
  upstreamPath?: string;
}

/** Plain, one-line text: no backticks, Markdown links reduced to their label, no trailing period. */
export function plainText(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.+$/, '');
}

const upperFirst = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** One feed entry for a commit, or null when it is skipped. Warnings are pushed to `warnings`. */
export function entryFor(commit: Commit, warnings: string[], opts: FeedOptions = {}): WhatsNewEntry | null {
  const knowledgePath = opts.knowledgePath ?? 'packages/knowledge/';
  const upstreamPath = opts.upstreamPath ?? 'packages/toolbox-parsers/UPSTREAM';
  const { pr, title } = prOf(commit);
  const base = { id: commit.sha, date: utcDay(commit.date), ...(pr !== undefined ? { pr } : {}) };
  const finish = (section: WhatsNewSection, raw: string): WhatsNewEntry => {
    let text = plainText(raw);
    if (text.length > MAX_TEXT) {
      warnings.push(
        `What's new text for ${pr ? `PR #${pr}` : commit.sha.slice(0, 7)} is over ${MAX_TEXT} characters; truncated`,
      );
      text = `${text.slice(0, MAX_TEXT - 1)}…`;
    }
    return { ...base, section, text };
  };

  // Rule 3, game patch first (RT-12): a changed gameVersion= always announces itself.
  const touchedUpstream = commit.files.includes(upstreamPath);
  const before = parseUpstream(commit.upstream?.before);
  const after = parseUpstream(commit.upstream?.after);
  if (touchedUpstream && after.gameVersion && before.gameVersion !== after.gameVersion) {
    return finish('game-patch', `Reads saves from game version ${after.gameVersion}`);
  }

  // Rule 4.
  const line = parseWhatsNewLine(commit.body);
  if (line?.kind === 'none') return null;

  const parsed = parseTitle(title);
  const touchesKnowledge = commit.files.some((f) => f.startsWith(knowledgePath));
  const section: WhatsNewSection = parsed?.scope === 'kb' || touchesKnowledge ? 'advice' : 'app';

  // Rule 5.
  if (line?.kind === 'text') return finish(section, line.text);
  if (parsed && (parsed.type === 'feat' || parsed.type === 'fix' || parsed.type === 'perf')) {
    return finish(section, upperFirst(parsed.description));
  }
  if (touchedUpstream && touchesKnowledge) {
    // RT-27: a sync that keeps the game version but refreshes generated Knowledge Base facts.
    return finish('advice', `Game facts refreshed from Toolbox ${after.toolboxVersion ?? ''}`.trim());
  }
  return null;
}

/** The feed, newest first, at most MAX_ENTRIES. `commits` must be newest first. */
export function whatsNewFeed(
  commits: Commit[],
  opts: FeedOptions = {},
): { feed: WhatsNewFeed; warnings: string[] } {
  const warnings: string[] = [];
  const entries: WhatsNewEntry[] = [];
  for (const c of commits) {
    if (entries.length >= MAX_ENTRIES) break;
    const e = entryFor(c, warnings, opts);
    if (e) entries.push(e);
  }
  return { feed: { schema: 1, entries }, warnings };
}
