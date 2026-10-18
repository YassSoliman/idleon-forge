// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The runtime surface of the Knowledge Base (M11 TR-1, TR-7): loadKnowledge(), render(), isStale(),
// coverage(), diffManifests(), entryReportFields(). It imports nothing that needs Node or a bundler,
// so it runs in the parser Web Worker (ADR 0006), in Vitest and in the kb CLI alike. The Detector
// registry is a separate entry point (`@idleon-forge/knowledge/detectors`), discovered by the bundler.
import { unpackKnowledge } from './pack';
import type { CompiledKnowledge } from './version';

export { coverage, coveredSystems, systemUnlocked } from './coverage';
export { familyMembers } from './family';
export * from './helpers';
export { packKnowledge, unpackKnowledge } from './pack';
export { isPlayerSource, playerSources, type SourceLike } from './player-sources';
export { type EntryReportFields, entryReportFields, type ReportableOutput } from './report';
export {
  type ContextOptions,
  DEFAULT_EXPECTED_RETURN_MS,
  type DetectorRun,
  findDetector,
  makeContext,
  runDetector,
} from './run';
export * from './schema';
export { STAGE_DEFINITIONS, STAGES, type StageDefinition, stageIndex, stagesBetween } from './stages';
export {
  compareGameVersions,
  isStale,
  newestVersion,
  ownSources,
  patchIndex,
  STALE_AFTER_VERSIONS,
} from './stale';
export {
  aboutDuration,
  BUILTIN_SLOTS,
  coinTiers,
  compact,
  FORMAT_TYPE,
  FORMATS,
  type Format,
  formatCoins,
  formatCompact,
  formatDate,
  formatDuration,
  formatInt,
  formatName,
  formatPct,
  formatValue,
  inSpan,
  parseTemplate,
  render,
  shortDuration,
  span,
  TemplateError,
  type TemplatePart,
} from './template';
export {
  TOOLBOX_ENTRY_PAGES,
  TOOLBOX_PAGES,
  TOOLBOX_SITE,
  type ToolboxPage,
  toolboxPage,
} from './toolbox-site';
export * from './types';
export {
  type CompiledKnowledge,
  type CompiledListItem,
  type CompiledPriorityList,
  canonicalJson,
  diffManifests,
  type KnowledgeVersion,
  knowledgeVersion,
  type ManifestDiff,
  type ManifestDiffItem,
  PLAYER_VISIBLE_KEYS,
  playerVisible,
} from './version';

/** The compiled bundle didn't load (corrupt chunk, failed deploy). M10 shows "Advice is unavailable right now". */
export class KnowledgeUnavailableError extends Error {
  override name = 'KnowledgeUnavailableError';
}

const REQUIRED: (keyof CompiledKnowledge)[] = [
  'version',
  'builtFrom',
  'patches',
  'systems',
  'entries',
  'facts',
  'byType',
  'lists',
  'priorityByStage',
  'manifest',
  'retired',
  'detectorOf',
  'readsOf',
  'stale',
];

/**
 * Loads the compiled bundle (`dist/knowledge.json`, as parsed JSON or as text). It was validated at
 * build time, so only its outline is checked here (TR-1: the runtime never re-parses with zod). Throws
 * `KnowledgeUnavailableError` when the outline is wrong: no partial advice.
 */
export function loadKnowledge(input: unknown): CompiledKnowledge {
  let data = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch {
      throw new KnowledgeUnavailableError('the Knowledge Base bundle is not valid JSON');
    }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data))
    throw new KnowledgeUnavailableError('the Knowledge Base bundle is not an object');
  let kb: Record<string, unknown>;
  try {
    kb = unpackKnowledge(data as Record<string, unknown>);
  } catch (err) {
    throw new KnowledgeUnavailableError(err instanceof Error ? err.message : String(err));
  }
  const missing = REQUIRED.filter((k) => kb[k] === undefined || kb[k] === null);
  if (missing.length > 0)
    throw new KnowledgeUnavailableError(`the Knowledge Base bundle lacks ${missing.join(', ')}`);
  const version = kb.version as Record<string, unknown>;
  if (typeof version.contentHash !== 'string' || typeof version.display !== 'string')
    throw new KnowledgeUnavailableError('the Knowledge Base bundle has no version');
  return Object.freeze(kb) as unknown as CompiledKnowledge;
}
