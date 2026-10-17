// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The provenance part of a "Report this" (M11 FR-29): exactly {entryIds, detectorIds, fieldPaths,
// stale, contested} and nothing else. Versions come from M12's BuildInfo, the Stage from M2, class and
// level from M1's accountReportFields(state); what leaves the device is only M13's SuggestionContext.
import type { CompiledKnowledge } from './version';

export interface EntryReportFields {
  entryIds: string[];
  detectorIds: string[];
  /** Account State field patterns the line's Detectors read (their `reads`), e.g. "characters[*].afkType". */
  fieldPaths: string[];
  stale: boolean;
  contested: boolean;
}

/** One piece of advice as the engine produced it: the entries behind it. */
export interface ReportableOutput {
  entryIds: readonly string[];
  /** Detector ids, when the engine knows them; otherwise taken from the compiled bundle. */
  detectorIds?: readonly string[];
}

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*[./#][a-z0-9./#-]+$/;
const PATH_RE = /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*|\[(?:\*|\d+)\])*$/;

/**
 * The whitelist payload for one output line. Only ids (lower-case kebab with `.`, `/`, `#`) and field
 * patterns ever appear, never a value from the save, so no name can enter it.
 */
export function entryReportFields(
  output: ReportableOutput,
  kb: Pick<CompiledKnowledge, 'entries' | 'detectorOf' | 'readsOf' | 'stale'>,
): EntryReportFields {
  const entryIds = [...new Set(output.entryIds)].filter((id) => ID_RE.test(id)).sort();
  const detectorIds = [
    ...new Set([
      ...(output.detectorIds ?? []),
      ...entryIds.flatMap((id) => kb.detectorOf[id.split('#')[0] ?? id] ?? []),
    ]),
  ]
    .filter((id) => ID_RE.test(id))
    .sort();
  const fieldPaths = [...new Set(detectorIds.flatMap((d) => kb.readsOf[d] ?? []))]
    .filter((p) => PATH_RE.test(p))
    .sort();
  const base = (id: string) => id.split('#')[0] ?? id;
  return {
    entryIds,
    detectorIds,
    fieldPaths,
    stale: entryIds.some((id) => kb.stale.includes(base(id))),
    contested: entryIds.some((id) => kb.entries[base(id)]?.status === 'contested'),
  };
}
