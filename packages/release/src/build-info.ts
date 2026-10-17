// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// BuildInfo and the Knowledge Base version (M12 TR-4, TR-6). Pure: no git, no network.
import { type Commit, parseUpstream, utcDay } from './commits.ts';
import type { BuildInfo, Channel } from './types.ts';

export const NO_KNOWLEDGE = '0000.00.00';
export const UNKNOWN = 'unknown';

export interface KnowledgeOptions {
  knowledgePath?: string;
  /** Preview: the PR number, when the PR changes the Knowledge Base against its merge base. */
  prChangesKnowledge?: number;
  /** Local: uncommitted changes under the Knowledge Base path. */
  localDirty?: boolean;
}

const dotted = (day: string): string => day.replaceAll('-', '.');

/**
 * YYYY.MM.DD of the newest main commit touching the Knowledge Base, with ".N" when it is the Nth
 * (N >= 2) such commit that UTC day. `commits` is first-parent main history, newest first.
 */
export function knowledgeVersion(commits: Commit[], opts: KnowledgeOptions = {}): string {
  const path = opts.knowledgePath ?? 'packages/knowledge/';
  const touching = commits.filter((c) => c.files.some((f) => f.startsWith(path)));
  let version = NO_KNOWLEDGE;
  const newest = touching[0];
  if (newest) {
    const day = utcDay(newest.date);
    const n = touching.filter((c) => utcDay(c.date) === day).length;
    version = n >= 2 ? `${dotted(day)}.${n}` : dotted(day);
  }
  if (opts.prChangesKnowledge !== undefined) version += `+pr${opts.prChangesKnowledge}`;
  else if (opts.localDirty) version += '+local';
  return version;
}

export interface BuildInfoInput {
  commit: string;
  /** Committer date of `commit`, ISO 8601. */
  commitDate: string;
  channel: Channel;
  pr?: number;
  dirty?: boolean;
  knowledge: string;
  upstream: string;
}

export function buildInfo(input: BuildInfoInput): BuildInfo {
  const up = parseUpstream(input.upstream);
  const builtFrom = new Date(input.commitDate).toISOString().replace(/\.\d{3}Z$/, 'Z');
  return {
    schema: 1,
    app: `${dotted(utcDay(input.commitDate))}-${input.commit.slice(0, 7)}${input.dirty ? '-dirty' : ''}`,
    commit: input.commit,
    builtFrom,
    channel: input.channel,
    ...(input.channel === 'preview' && input.pr !== undefined ? { pr: input.pr } : {}),
    knowledge: input.knowledge,
    parsers: {
      toolboxCommit: up.commit ?? '',
      toolboxVersion: up.toolboxVersion ?? '',
      gameVersion: up.gameVersion ?? '',
    },
  };
}
