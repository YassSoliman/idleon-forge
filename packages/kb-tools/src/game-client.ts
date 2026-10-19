// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Game-client Sources (ADR 0004 amendment, M26 FR-2b). A tier 1 Source may cite the game client's own
// script; the schema makes it carry `excerptSha256` and `clientBuild`. This checks what the schema can't:
// the excerpt is stored, small and unchanged, and the build is one we recorded and matched to a game
// version (`builds.json`, V43), the same version the Source claims.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { GAME_CLIENT_URL_RE } from '@idleon-forge/knowledge';
import type { Issue } from './issues';
import type { KbSource, Located } from './load';

/** An excerpt is a citation, not a copy of the client: at most this many bytes. */
export const EXCERPT_MAX_BYTES = 2048;

export interface ClientBuildRecord {
  url: string;
  sha256: string;
  bytes: number;
  lastModified: string;
  /** The game version the build was matched to; null while unmatched (its reads stay confidence M). */
  gameVersion: string | null;
  verified: string;
  evidence: string[];
}

interface SourceLike {
  url: string;
  tier: number;
  gameVersion: string;
  excerptSha256?: string;
  clientBuild?: { sha256: string; lastModified: string };
}

/** Every Source object under `v` (entries keep them at `sources`, facts on rows and contested sides). */
function sourcesIn(v: unknown, out: SourceLike[] = []): SourceLike[] {
  if (Array.isArray(v)) for (const x of v) sourcesIn(x, out);
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (k === 'sources' && Array.isArray(x))
        for (const s of x) if (s && typeof s === 'object' && 'url' in s) out.push(s as SourceLike);
      sourcesIn(x, out);
    }
  }
  return out;
}

export function readBuilds(dir: string): ClientBuildRecord[] {
  const file = path.join(dir, 'builds.json');
  if (!existsSync(file)) return [];
  return (JSON.parse(readFileSync(file, 'utf8')) as { builds?: ClientBuildRecord[] }).builds ?? [];
}

export function gameClientIssues(src: KbSource): Issue[] {
  const dir = src.layout.gameClientDir;
  const builds = new Map(readBuilds(dir).map((b) => [b.sha256, b]));
  const issues: Issue[] = [];
  const located: Located<unknown>[] = [...src.authored, ...src.drafts, ...src.facts];
  for (const e of located) {
    const id = (e.value as { id?: string }).id;
    for (const s of sourcesIn(e.value)) {
      if (!GAME_CLIENT_URL_RE.test(s.url) || !s.excerptSha256 || !s.clientBuild) continue;
      const err = (message: string) =>
        issues.push({ level: 'error', file: e.file, line: e.lineOf(['sources']), id, message });
      const file = path.join(dir, 'excerpts', `${s.excerptSha256}.txt`);
      if (!existsSync(file)) {
        err(
          `game-client excerpt ${s.excerptSha256.slice(0, 12)} is not stored in docs/research/game-client/excerpts`,
        );
      } else {
        const bytes = readFileSync(file);
        if (createHash('sha256').update(bytes).digest('hex') !== s.excerptSha256)
          err(`game-client excerpt ${s.excerptSha256.slice(0, 12)} does not match its hash`);
        if (bytes.length > EXCERPT_MAX_BYTES)
          err(`game-client excerpt ${s.excerptSha256.slice(0, 12)} is over ${EXCERPT_MAX_BYTES} bytes`);
      }
      const b = builds.get(s.clientBuild.sha256);
      if (!b) err(`client build ${s.clientBuild.sha256.slice(0, 12)} is not recorded in builds.json`);
      else {
        if (b.lastModified !== s.clientBuild.lastModified)
          err(
            `client build ${s.clientBuild.sha256.slice(0, 12)}: lastModified is ${b.lastModified} in builds.json`,
          );
        if (s.tier === 1 && b.gameVersion !== s.gameVersion)
          err(
            b.gameVersion === null
              ? `client build ${s.clientBuild.sha256.slice(0, 12)} is not matched to a game version (V43): tier 4 until it is`
              : `client build ${s.clientBuild.sha256.slice(0, 12)} is game ${b.gameVersion}, not ${s.gameVersion}`,
          );
      }
    }
  }
  return issues;
}
