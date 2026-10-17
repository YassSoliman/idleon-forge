// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The release data contracts (M12 TR-4, TR-7). Apps import these with `import type` only.

export type Channel = 'production' | 'preview' | 'local';

export interface BuildInfo {
  schema: 1;
  /** Human build id, e.g. "2026.10.21-3f9c2ab"; "-dirty" suffix on local builds with changes. */
  app: string;
  /** Full commit SHA the build was made from. For previews, the PR head commit. */
  commit: string;
  /** ISO 8601 UTC, the commit's committer date (not wall-clock), so rebuilds are reproducible. */
  builtFrom: string;
  channel: Channel;
  /** Set only when channel === 'preview'. */
  pr?: number;
  /** Knowledge Base version (TR-6): YYYY.MM.DD[.N][+prN|+local], "0000.00.00" or "unknown". */
  knowledge: string;
  parsers: {
    /** UPSTREAM commit= */
    toolboxCommit: string;
    /** UPSTREAM toolboxVersion= */
    toolboxVersion: string;
    /** UPSTREAM gameVersion=; M1 compares this with the save's version. */
    gameVersion: string;
  };
}

export type WhatsNewSection = 'advice' | 'game-patch' | 'app';

export interface WhatsNewEntry {
  /** The first-parent commit SHA (merge commit). Stable, unique, sortable via the feed's order. */
  id: string;
  /** ISO date (YYYY-MM-DD) of the commit, UTC. */
  date: string;
  pr?: number;
  section: WhatsNewSection;
  /** Player-facing, one line, at most 120 chars, no trailing period, no Markdown. */
  text: string;
}

export interface WhatsNewFeed {
  schema: 1;
  /** Newest first; at most 100 entries. */
  entries: WhatsNewEntry[];
}
