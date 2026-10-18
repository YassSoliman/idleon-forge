// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `EngineResult.systems` (M17 TR-1, TR-2): every System of the M11 registry with its unlock state
// (M11 `systemUnlocked`), its coverage (`coveredSystems`), how it opens (the `systems.fact.unlocks`
// row, FR-34) and the Checks that ran this run. Built in the worker by the engine core, never on the
// UI thread: it runs Detectors. It decides no advice; the Systems hub reads it (M17 TR-5).
import type { AccountState } from '@idleon-forge/account-state';
import {
  type CompiledKnowledge,
  coveredSystems,
  type DetectorRegistry,
  patchIndex,
  type SourceT,
  STALE_AFTER_VERSIONS,
  type SystemDefT,
  type SystemUnlockRowT,
  systemKind,
  systemUnlocked,
} from '@idleon-forge/knowledge';
import type { EngineResult, SourceRef, SystemSummary } from '../result';

const WIKI = /^https:\/\/idleon\.wiki\/wiki\//;

const sourceRef = (s: SourceT): SourceRef => ({
  label: s.title,
  url: s.url,
  tier: s.tier,
  verifiedOn: s.verified,
  ...(s.claimDate ? { claimDate: s.claimDate } : {}),
  gameVersion: s.gameVersion,
});

/** The rows of a `systems.fact.unlocks`-shaped table, keyed by System id. Malformed rows are skipped. */
function unlockRows(kb: Pick<CompiledKnowledge, 'facts'>, factId: string): Map<string, SystemUnlockRowT> {
  const rows = kb.facts[factId]?.rows;
  const out = new Map<string, SystemUnlockRowT>();
  if (!Array.isArray(rows)) return out;
  for (const r of rows as unknown[]) {
    const row = r as Partial<SystemUnlockRowT> | null;
    if (row && typeof row.system === 'string' && typeof row.text === 'string' && Array.isArray(row.sources))
      out.set(row.system, row as SystemUnlockRowT);
  }
  return out;
}

/** Fills `{level}` from the town-unlocks fact the row names (FR-34: reference, never repeat). */
function unlockText(kb: Pick<CompiledKnowledge, 'facts'>, row: SystemUnlockRowT): string | null {
  if (!row.level) return row.text;
  const rows = kb.facts[row.level.fact]?.rows as Record<string, unknown> | undefined;
  const level = rows?.[row.level.key];
  return typeof level === 'number' ? row.text.replace('{level}', String(level)) : null;
}

/** M11 TR-11's age rule for one row: 10 or more patches behind the bundle's game version. */
function rowStale(kb: Pick<CompiledKnowledge, 'patches' | 'builtFrom'>, gameVersion: string): boolean {
  const cur = patchIndex(kb.builtFrom.gameVersion, kb.patches);
  if (cur < 0) return false;
  return cur - patchIndex(gameVersion, kb.patches) >= STALE_AFTER_VERSIONS;
}

const unlockBy = (s: SystemDefT): SystemSummary['unlockBy'] =>
  s.unlocked === 'always' ? 'always' : s.unlocked.id === 'worlds/reached' ? 'world' : 'own';

/** Every entry id a module's output names this run: the Checks that fired. */
function firedEntries(result: Omit<EngineResult, 'systems'>): Set<string> {
  const ids = new Set<string>();
  const goals = [...result.characters.flatMap((c) => c.goals), ...result.account.goals];
  for (const g of goals) {
    ids.add(g.nextAction.entryId);
    for (const id of g.nextAction.provenance.entryIds) ids.add(id);
  }
  for (const c of result.characters) {
    for (const l of c.info ?? []) ids.add(l.key.split('@')[0] ?? l.key);
    if (c.verdict.suggestion) ids.add(c.verdict.suggestion.entryId);
  }
  return ids;
}

export interface SystemsInput {
  state: AccountState;
  kb: CompiledKnowledge;
  registries: readonly DetectorRegistry[];
  now: number;
}

/** M17 TR-2: the registry as `SystemSummary`s, in registry order. */
export function systemSummaries(input: SystemsInput, result: Omit<EngineResult, 'systems'>): SystemSummary[] {
  const { state, kb, registries, now } = input;
  const covered = coveredSystems(kb);
  const fired = firedEntries(result);
  const failed = new Set([
    ...result.diagnostics.failedDetectors.flatMap((f) => f.entryIds),
    ...(result.unknownFindings ?? []).filter((u) => u.reason === 'detector-failed').map((u) => u.entryId),
  ]);
  const tables = new Map<string, Map<string, SystemUnlockRowT>>();
  const rowOf = (s: SystemDefT) => {
    if (!s.unlockFact) return null;
    let t = tables.get(s.unlockFact);
    if (!t) {
      t = unlockRows(kb, s.unlockFact);
      tables.set(s.unlockFact, t);
    }
    return t.get(s.id) ?? null;
  };
  const checksBy = new Map<string, SystemSummary['checks']>();
  for (const id of kb.byType.check ?? []) {
    const e = kb.entries[id];
    if (e?.type !== 'check' || ('origin' in e && e.origin === 'generated')) continue;
    if (failed.has(id)) continue;
    const list = checksBy.get(e.system) ?? [];
    list.push({ entryId: id, title: e.title, fired: fired.has(id) });
    checksBy.set(e.system, list);
  }
  return kb.systems.map((s) => {
    let unlocked: SystemSummary['unlocked'];
    try {
      unlocked = systemUnlocked(s, state, kb, registries, { now });
    } catch {
      unlocked = 'unknown';
    }
    const row = rowOf(s);
    const text = row ? unlockText(kb, row) : null;
    const sources = row ? row.sources.map(sourceRef) : [];
    const wiki = sources.find((x) => WIKI.test(x.url))?.url ?? null;
    return {
      id: s.id,
      name: s.name,
      kind: systemKind(s),
      world: s.world,
      scope: s.scope,
      unlocked,
      unlockBy: unlockBy(s),
      covered: covered.has(s.id),
      unlock:
        row && text !== null
          ? { text, world: row.world, stale: rowStale(kb, row.gameVersion), sources }
          : null,
      wiki,
      checks: (checksBy.get(s.id) ?? []).sort((a, b) => (a.entryId < b.entryId ? -1 : 1)),
    };
  });
}
