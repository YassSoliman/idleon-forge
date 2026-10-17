// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// "The game updated and our save reader hasn't caught up yet" (M1 FR-29, D3 option b): loud only when
// it hurts. A save is "new" when its server build or save format is newer than every build this
// parser pin has parsed cleanly: the `verifiedBuilds` shipped with the bundle plus the clean builds
// recorded in save history. A new save that also read badly shows the banner; a new save that read
// cleanly only gets a quiet footer note. The server build (142) and the parser's game version
// (2.3.540) are different numbering schemes and are never compared.
import type { AccountState } from '@idleon-forge/account-state';

/** A server build and save format seen together. Either may be unknown. */
export interface BuildMark {
  serverBuild: number | null;
  saveVersion: number | null;
}

/**
 * How well one save read. `failed` is a hard failure (no Account State). `partial` has failed parser
 * sections, unknown fields or an unreadable character. A missing server build on its own (the `_vars`
 * side read failed) is not a sign that the parser is behind, so it doesn't count.
 */
export type SaveOutcome = 'clean' | 'partial' | 'failed';

const SERVER_BUILD_PATH = 'account.gameVersion.serverBuild';

export function saveOutcome(state: AccountState): SaveOutcome {
  const d = state.diagnostics;
  const unknown = d.unknownFields.filter((f) => f !== SERVER_BUILD_PATH);
  return d.failedSections.length > 0 || unknown.length > 0 || d.unreadableCharacters.length > 0
    ? 'partial'
    : 'clean';
}

/** The build a state was read on. */
export const buildOf = (state: AccountState): BuildMark => ({
  serverBuild: state.account.gameVersion.serverBuild,
  saveVersion: state.account.gameVersion.saveVersion,
});

export interface PatchStatus {
  /** The save's build or format is newer than any this parser pin parsed cleanly. */
  newer: boolean;
  /** Show the banner: newer, and the save read badly or not at all. */
  parserBehind: boolean;
}

export const PATCH_BANNER = "The game updated and our save reader hasn't caught up yet.";
export const PATCH_FOOTER_NOTE = 'newer than our save reader was checked on, and it reads cleanly';

const highest = (marks: BuildMark[], key: keyof BuildMark): number | null => {
  const values = marks.map((m) => m[key]).filter((v): v is number => v !== null && Number.isFinite(v));
  return values.length > 0 ? Math.max(...values) : null;
};

const above = (value: number | null, known: number | null) =>
  value !== null && known !== null && value > known;

export function patchStatus(input: {
  build: BuildMark | null;
  outcome: SaveOutcome;
  /** `verifiedBuilds` from the parser bundle. */
  verified: BuildMark | null;
  /** Clean builds this browser's history recorded at the same parser pin. */
  cleanBuilds?: BuildMark[];
}): PatchStatus {
  const known = [...(input.verified ? [input.verified] : []), ...(input.cleanBuilds ?? [])];
  const b = input.build;
  const newer =
    b !== null &&
    (above(b.serverBuild, highest(known, 'serverBuild')) ||
      above(b.saveVersion, highest(known, 'saveVersion')));
  return { newer, parserBehind: newer && input.outcome !== 'clean' };
}
