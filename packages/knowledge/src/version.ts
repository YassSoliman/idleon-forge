// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The compiled bundle's shape, its version and the manifest that drives "What's new: advice changes"
// (M11 FR-22, FR-23, TR-7, TR-13).
import type { Entry, EntryTypeName, FactTable, SystemDefT } from './schema';
import type { StageId } from './stages';

export interface KnowledgeVersion {
  /** "knowledge 2026.10.17.2". Computed only in the deploy build; goldens never show it. */
  display: string;
  /** "2026.10.17.2+3f9a1c2e". */
  id: string;
  /** First 8 hex digits of the sha256 of the compiled entries. */
  contentHash: string;
}

/** A compiled Priority List position item, after `include`s are expanded (TR-12). */
export interface CompiledListItem {
  /** Entry id, or `${listId}#${item}` for a Spend Plan item. */
  id: string;
  /** The block it came in through, if any. */
  via?: string;
  byUrgency?: boolean;
  carryForward?: boolean;
  /** True when the item is contested (a contested entry, or an item with verification: contested). */
  contested?: boolean;
}

export interface CompiledPriorityList {
  id: string;
  list: 'goals' | 'spend' | 'leverage' | 'block' | 'order';
  stage: StageId | null;
  /** Ordered positions; each a tie. An include is one position (a tie of all the block's items). */
  positions: CompiledListItem[][];
}

export interface CompiledKnowledge {
  version: KnowledgeVersion;
  builtFrom: { parserCommit: string; gameVersion: string; toolboxVersion: string };
  /** Ordered game versions, oldest first (from generated/_patches.json). */
  patches: string[];
  systems: SystemDefT[];
  /** Active and contested entries only, with `include`s, `extends` and `goalFamily` resolved. */
  entries: Record<string, Entry>;
  /** Fact tables referenced by a shipped entry or Detector (TR-2a). */
  facts: Record<string, FactTable>;
  byType: Record<EntryTypeName, string[]>;
  /** Priority Lists with includes expanded, by id. */
  lists: Record<string, CompiledPriorityList>;
  priorityByStage: Partial<Record<StageId, { goals?: string; spend?: string; leverage?: string }>>;
  /** Authored id -> sha256(canonical player-visible fields)[0..8] (FR-22). Generated ids never appear. */
  manifest: Record<string, string>;
  /** Retired authored entries, for What's new and "Not for me". */
  retired: Record<string, { title: string; replacedBy?: string }>;
  /** Detector ids an entry's line came from, by entry id (for `entryReportFields` and provenance). */
  detectorOf: Record<string, string[]>;
  /** Field paths each Detector declares in `reads`, by Detector id. */
  readsOf: Record<string, string[]>;
  /** Entries whose Stale flag is set at the pin (FR-19), precomputed by `kb compile`. */
  stale: string[];
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/**
 * The Knowledge Base version (TR-13): the UTC date of the newest commit touching packages/knowledge/,
 * `.n` its ordinal among that day's such commits (omitted for 1), then `+hash`. Without git metadata
 * (a tarball build) the date is `0000.00.00`.
 */
export function knowledgeVersion(
  contentHash: string,
  git: { newestCommitDate: string | Date; ordinal: number } | null,
): KnowledgeVersion {
  let date = '0000.00.00';
  let n = '';
  if (git) {
    const d =
      typeof git.newestCommitDate === 'string' ? new Date(git.newestCommitDate) : git.newestCommitDate;
    date = `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
    n = git.ordinal > 1 ? `.${git.ordinal}` : '';
  }
  return { display: `knowledge ${date}${n}`, id: `${date}${n}+${contentHash}`, contentHash };
}

export interface ManifestDiffItem {
  id: string;
  title: string;
}
export interface ManifestDiff {
  added: ManifestDiffItem[];
  changed: ManifestDiffItem[];
  retired: ManifestDiffItem[];
}

/**
 * What changed in the advice between the manifest the app stored at the last visit and this bundle
 * (FR-23, TR-13). Authored entries only. Returns null when there is no stored manifest (first visit,
 * cleared storage): "What's new: advice changes" is then skipped, not shown as "everything changed".
 */
export function diffManifests(
  prev: Readonly<Record<string, string>> | null | undefined,
  next: Pick<CompiledKnowledge, 'manifest' | 'entries' | 'retired'>,
): ManifestDiff | null {
  if (!prev) return null;
  const title = (id: string) => next.entries[id]?.title ?? next.retired[id]?.title ?? id;
  const byId = (a: ManifestDiffItem, b: ManifestDiffItem) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const added: ManifestDiffItem[] = [];
  const changed: ManifestDiffItem[] = [];
  const retired: ManifestDiffItem[] = [];
  for (const [id, hash] of Object.entries(next.manifest)) {
    if (!(id in prev)) added.push({ id, title: title(id) });
    else if (prev[id] !== hash) changed.push({ id, title: title(id) });
  }
  for (const id of Object.keys(prev)) if (!(id in next.manifest)) retired.push({ id, title: title(id) });
  return { added: added.sort(byId), changed: changed.sort(byId), retired: retired.sort(byId) };
}

/** Fields a content hash covers: what a player sees, never provenance (FR-22). */
export const PLAYER_VISIBLE_KEYS = [
  'title',
  'text',
  'why',
  'values',
  'milestones',
  'tiers',
  'contested',
  'status',
  'stopHere',
  'slots',
  'roles',
  'stages',
  'pusherRule',
  'gateChain',
  'expectations',
  'tabs',
  'tags',
  'attacks',
  'onePointOk',
  'methods',
  'effect',
  'appliesTo',
  'activePlay',
  'category',
] as const;

/**
 * The canonical player-visible view of an entry that its manifest hash covers (FR-22), including the
 * facts it extends (so a fact that moved at a sync changes the authored entry's hash) but not
 * `verified` dates, Source URLs or `generatedBy`.
 */
export function playerVisible(entry: Entry, extended?: Entry): Record<string, unknown> {
  const pick = (e: Entry) => {
    const out: Record<string, unknown> = {};
    for (const k of PLAYER_VISIBLE_KEYS) {
      const v = (e as Record<string, unknown>)[k];
      if (v !== undefined) out[k] = v;
    }
    if ('rates' in e && e.rates !== undefined) out.rates = e.rates;
    if ('data' in e && e.data !== undefined) out.data = e.data;
    return out;
  };
  const out = pick(entry);
  if (extended) out.extends = pick(extended);
  return out;
}

/** JSON with sorted keys at every level: the input of every hash and of the compiled bundle. */
export function canonicalJson(value: unknown, indent?: number): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      return Object.fromEntries(
        Object.keys(o)
          .sort()
          .filter((k) => o[k] !== undefined)
          .map((k) => [k, sort(o[k])]),
      );
    }
    return v;
  };
  return JSON.stringify(sort(value), null, indent);
}
