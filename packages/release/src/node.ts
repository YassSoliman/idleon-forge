// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Node entry: generate version.json and whats-new.json for one app and return its BuildInfo
// (M12 TR-3). Used by bin/generate.ts and by apps/<app>/vite.config.ts, so the compiled-in
// __BUILD_INFO__ and the served version.json can never disagree.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { buildInfo, knowledgeVersion, UNKNOWN } from './build-info.ts';
import {
  changedSinceMergeBase,
  dirtyFiles,
  headCommit,
  isGitRepo,
  isShallow,
  mainRef,
  readHistory,
  repoRoot,
} from './git.ts';
import type { BuildInfo, Channel, WhatsNewFeed } from './types.ts';
import { whatsNewFeed } from './whats-new.ts';

export { checkBudgets, type DistFile } from './budgets.ts';
export { checkPr } from './pr-title.ts';
export type { BuildInfo, WhatsNewFeed } from './types.ts';

export interface GenerateOptions {
  /** The app directory, e.g. apps/activeon (absolute or relative to cwd). */
  appDir: string;
  channel?: Channel;
  pr?: number;
  knowledgePath?: string;
  upstreamPath?: string;
  /** Write public/version.json and public/whats-new.json (default true). */
  write?: boolean;
  log?: (message: string) => void;
}

export interface Generated {
  buildInfo: BuildInfo;
  feed: WhatsNewFeed;
  warnings: string[];
}

/** Channel and PR number from the build environment (VITE_DEPLOY_CHANNEL, VITE_PR_NUMBER). */
export function channelFromEnv(env: NodeJS.ProcessEnv = process.env): { channel: Channel; pr?: number } {
  const c = env.VITE_DEPLOY_CHANNEL;
  const channel: Channel = c === 'production' || c === 'preview' ? c : 'local';
  const n = Number(env.VITE_PR_NUMBER);
  return channel === 'preview' && Number.isInteger(n) && n > 0 ? { channel, pr: n } : { channel };
}

export function generate(opts: GenerateOptions): Generated {
  const log = opts.log ?? ((m: string) => console.warn(`[release] ${m}`));
  const fromEnv = channelFromEnv();
  const channel = opts.channel ?? fromEnv.channel;
  const pr = opts.pr ?? fromEnv.pr;
  const knowledgePath = opts.knowledgePath ?? 'packages/knowledge/';
  const upstreamPath = opts.upstreamPath ?? 'packages/toolbox-parsers/UPSTREAM';
  const warnings: string[] = [];

  const cwd = opts.appDir;
  const gitOk = isGitRepo(cwd);
  const root = gitOk ? repoRoot(cwd) : join(cwd, '../..');
  const upstreamFile = join(root, upstreamPath);
  const upstream = existsSync(upstreamFile) ? readFileSync(upstreamFile, 'utf8') : '';

  let info: BuildInfo;
  let feed: WhatsNewFeed = { schema: 1, entries: [] };
  if (!gitOk || isShallow(root)) {
    // A contributor's --depth=1 clone or a source tarball: never fail a local build (§6).
    warnings.push('shallow or missing git history: knowledge version "unknown", empty What\'s new feed');
    const head = gitOk ? headCommit(root) : { sha: '0'.repeat(40), date: new Date(0).toISOString() };
    info = buildInfo({ commit: head.sha, commitDate: head.date, channel, pr, knowledge: UNKNOWN, upstream });
  } else {
    const ref = mainRef(root);
    const history = readHistory(root, ref, upstreamPath);
    const head = headCommit(root);
    const dirty = channel === 'local' && dirtyFiles(root).length > 0;
    const prChangesKnowledge =
      channel === 'preview' &&
      pr !== undefined &&
      changedSinceMergeBase(root, ref).some((f) => f.startsWith(knowledgePath))
        ? pr
        : undefined;
    const knowledge = knowledgeVersion(history, {
      knowledgePath,
      prChangesKnowledge,
      localDirty: channel === 'local' && dirtyFiles(root, knowledgePath).length > 0,
    });
    info = buildInfo({ commit: head.sha, commitDate: head.date, channel, pr, dirty, knowledge, upstream });
    const result = whatsNewFeed(history, { knowledgePath, upstreamPath });
    feed = result.feed;
    warnings.push(...result.warnings);
  }

  if (opts.write !== false) {
    const pub = join(opts.appDir, 'public');
    mkdirSync(pub, { recursive: true });
    writeFileSync(join(pub, 'version.json'), `${JSON.stringify(info)}\n`);
    writeFileSync(join(pub, 'whats-new.json'), `${JSON.stringify(feed)}\n`);
    log(
      `wrote ${relative(root, pub)}/version.json (${info.app}, knowledge ${info.knowledge}) and whats-new.json (${feed.entries.length} entries)`,
    );
  }
  for (const w of warnings) log(`warning: ${w}`);
  return { buildInfo: info, feed, warnings };
}
