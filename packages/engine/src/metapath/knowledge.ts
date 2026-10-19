// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Typed reads of the Knowledge Base entries and fact tables M2 uses (M2 TR-7). Every game fact comes
// from a fact table by id and every judgment from a Meta Path entry; nothing here is typed in. A missing
// table throws `MetaPathKnowledgeError`, which the Detector runner turns into `unknown` (M11 FR-13).
import type { RouteDoor } from '@idleon-forge/account-state';
import type { Entry, FactTable, StageId } from '@idleon-forge/knowledge';
import type { FactLookup, MetaPathKnowledge } from './types';

export class MetaPathKnowledgeError extends Error {
  override name = 'MetaPathKnowledgeError';
}

export const FACT = {
  classTree: 'classes.fact.class-tree',
  worldRoutes: 'portals.fact.world-routes',
  gateQuests: 'quests.fact.gate-quests',
  worldGates: 'metapath.fact.world-gates',
  salts: 'refinery.fact.salts',
  familySlots: 'metapath.fact.family-slots',
  townUnlocks: 'metapath.fact.town-unlocks',
  obolAltar: 'obols.fact.obol-altar',
  maps: 'maps.fact.maps',
} as const;

export const ENTRY = {
  stages: 'metapath.metapath.stages',
  slotPlan: 'metapath.metapath.slot-plan',
  pusherRule: 'metapath.metapath.pusher-rule',
  gateChain: (world: number) => `metapath.metapath.gate-chain-w${world}`,
  rolePrefix: 'metapath.metapath.role-',
} as const;

/** A FactLookup over a compiled bundle (the same lookup `makeContext` gives Detectors). */
export function lookupOf(kb: Pick<MetaPathKnowledge, 'entries' | 'facts'>): FactLookup {
  return { get: (id) => kb.entries[id] ?? kb.facts[id] };
}

function fact(kb: FactLookup, id: string): unknown {
  const f = kb.get(id) as FactTable | undefined;
  if (!f || !('rows' in f)) throw new MetaPathKnowledgeError(`fact table ${id} is not in the Knowledge Base`);
  return f.rows;
}

function entry<T extends Entry['type']>(kb: FactLookup, id: string, type: T): Extract<Entry, { type: T }> {
  const e = kb.get(id) as Entry | undefined;
  if (!e || !('type' in e) || e.type !== type)
    throw new MetaPathKnowledgeError(`entry ${id} is not in the Knowledge Base`);
  return e as Extract<Entry, { type: T }>;
}

export type MetaPathEntryT = Extract<Entry, { type: 'metapath' }>;
export const metaPathEntry = (kb: FactLookup, id: string): MetaPathEntryT => entry(kb, id, 'metapath');

// ---- classes.fact.class-tree ----
export interface ClassRow {
  class: string;
  classIndex: number;
  line: string | null;
  promotesFrom: string | null;
  promotesTo: string[];
  swapSibling: string | null;
  tier: 'beginner' | 'base' | 'subclass' | 'elite' | 'master';
}

export interface ClassTree {
  byIndex: ReadonlyMap<number, ClassRow>;
  byName: ReadonlyMap<string, ClassRow>;
  /** The subclass a class descends from (Divine_Knight -> Squire); Maestro's line is "Journeyman". */
  subclassLineOf(cls: string): string | null;
  /** Whether `cls` is `ancestor` or promotes from it (Royal_Guardian is a Squire). */
  isA(cls: string, ancestor: string): boolean;
}

export function classTree(kb: FactLookup): ClassTree {
  const rows = fact(kb, FACT.classTree) as ClassRow[];
  const byIndex = new Map(rows.map((r) => [r.classIndex, r]));
  const byName = new Map(rows.map((r) => [r.class, r]));
  const isA = (cls: string, ancestor: string): boolean => {
    let at: string | null = cls;
    for (let guard = 0; at && guard < 10; guard++) {
      if (at === ancestor) return true;
      at = byName.get(at)?.promotesFrom ?? null;
    }
    return false;
  };
  const subclassLineOf = (cls: string): string | null => {
    let row = byName.get(cls);
    for (let guard = 0; row && guard < 10; guard++) {
      if (row.tier === 'subclass') return row.line === 'Journeyman' ? 'Journeyman' : row.class;
      if (row.tier === 'base' || row.tier === 'beginner') return null;
      row = row.promotesFrom ? byName.get(row.promotesFrom) : undefined;
    }
    return null;
  };
  return { byIndex, byName, subclassLineOf, isA };
}

// ---- portals.fact.world-routes ----
interface RouteRow {
  world: number;
  town: number;
  paths: Record<string, Array<{ mapIndex: number; door: number | null; requirement: number }>>;
}

/** Map index -> Toolbox map name, from maps.fact.maps when shipped; else the index as text. */
function mapNames(kb: FactLookup): (i: number) => string {
  const f = kb.get(FACT.maps) as FactTable | undefined;
  const rows = (f && 'rows' in f ? f.rows : []) as Array<{ index: number; name: string }>;
  const names = new Map(rows.map((r) => [r.index, r.name]));
  return (i) => names.get(i) ?? `map-${i}`;
}

/** The door-by-door path from the world's town to `destination` (TR-7), or null when there is none. */
export function routeTo(kb: FactLookup, world: number, destination: number): RouteDoor[] | null {
  const rows = fact(kb, FACT.worldRoutes) as RouteRow[];
  const path = rows.find((r) => r.world === world)?.paths[String(destination)];
  if (!path) return null;
  const name = mapNames(kb);
  return path.map((s) => ({
    mapIndex: s.mapIndex,
    mapName: name(s.mapIndex),
    door: s.door ?? -1,
    requirement: s.requirement,
  }));
}

/**
 * The door out of `mapName` on `world`'s route (M26 FR-3 band doors), or null when no path of that
 * world passes through it. The map name comes from the Meta Path `stages` entry's values.
 */
export function routeDoorOutOf(kb: FactLookup, world: number, mapName: string): RouteDoor | null {
  const rows = fact(kb, FACT.worldRoutes) as RouteRow[];
  const row = rows.find((r) => r.world === world);
  if (!row) return null;
  const name = mapNames(kb);
  for (const path of Object.values(row.paths))
    for (const s of path)
      if (s.door !== null && s.requirement > 0 && name(s.mapIndex) === mapName)
        return { mapIndex: s.mapIndex, mapName, door: s.door, requirement: s.requirement };
  return null;
}

// ---- quests.fact.gate-quests ----
export interface GateQuestStep {
  questName: string;
  title: string;
  npc: string;
  map: number;
  questOrder: number;
}

export function gateQuestSteps(kb: FactLookup, npc: string): GateQuestStep[] {
  const rows = fact(kb, FACT.gateQuests) as Record<string, { steps: GateQuestStep[] } | undefined>;
  return rows[npc]?.steps ?? [];
}

export function gateQuest(kb: FactLookup, questName: string): GateQuestStep | null {
  const rows = fact(kb, FACT.gateQuests) as Record<string, { steps: GateQuestStep[] } | undefined>;
  for (const v of Object.values(rows)) {
    const hit = v?.steps.find((s) => s.questName === questName);
    if (hit) return hit;
  }
  return null;
}

// ---- metapath.fact.world-gates ----
export interface WorldGate {
  world: number;
  gatekeeper: string | null;
  crystal: string | null;
  crystalName: string | null;
}
export const worldGates = (kb: FactLookup): WorldGate[] => fact(kb, FACT.worldGates) as WorldGate[];

// ---- authored tier-2 tables ----
export function familySlots(kb: FactLookup): Array<{ slot: number; familyLevel: number }> {
  return [...(fact(kb, FACT.familySlots) as Array<{ slot: number; familyLevel: number }>)].sort(
    (a, b) => a.slot - b.slot,
  );
}

export function townUnlock(kb: FactLookup, key: 'stamps' | 'tasks' | 'post-office'): number {
  const v = (fact(kb, FACT.townUnlocks) as Record<string, number>)[key];
  if (typeof v !== 'number') throw new MetaPathKnowledgeError(`${FACT.townUnlocks} has no ${key}`);
  return v;
}

export function obolAltarLevel(kb: FactLookup): number {
  const v = (fact(kb, FACT.obolAltar) as { level?: number }).level;
  if (typeof v !== 'number') throw new MetaPathKnowledgeError(`${FACT.obolAltar} has no level`);
  return v;
}

// ---- Meta Path entries ----
export interface StageRow {
  id: StageId;
  rule: string;
  needs: string[];
  factRefs: string[];
}

export function stageRows(kb: FactLookup): { rows: StageRow[]; values: Record<string, number | string> } {
  const e = metaPathEntry(kb, ENTRY.stages);
  return { rows: (e.stages ?? []) as StageRow[], values: e.values };
}

export function pusherMargin(kb: FactLookup): number {
  const m = metaPathEntry(kb, ENTRY.pusherRule).pusherRule?.margin;
  if (typeof m !== 'number') throw new MetaPathKnowledgeError(`${ENTRY.pusherRule} has no margin`);
  return m;
}

export interface GateStep {
  kind: 'route' | 'quest' | 'boss' | 'crystal' | 'gatekeeper';
  ref?: string;
}

export function gateChain(kb: FactLookup, world: number): GateStep[] | null {
  const e = kb.get(ENTRY.gateChain(world)) as Entry | undefined;
  if (e?.type !== 'metapath') return null;
  return e.gateChain?.find((c) => c.world === world)?.steps ?? null;
}

export interface RoleDef {
  id: string;
  classLine: string;
  does: string;
  activeFrom: StageId;
  owns: string[];
  visitHint?: 'pool-after' | 'cooldown' | 'skip-trap-stop';
  entryId: string;
}

/** Every Role entry's Roles, keyed by the entry's subclass line (the entry id's slug). */
export function roleDefs(kb: MetaPathKnowledge | FactLookup): RoleDef[] {
  const ids =
    'entries' in kb
      ? Object.keys(kb.entries).filter((id) => id.startsWith(ENTRY.rolePrefix))
      : ROLE_LINES.map((l) => `${ENTRY.rolePrefix}${l.toLowerCase()}`);
  const lookup = 'entries' in kb ? lookupOf(kb) : kb;
  return ids.sort().flatMap((id) => {
    const e = lookup.get(id) as Entry | undefined;
    if (e?.type !== 'metapath' || e.status === 'retired') return [];
    return (e.roles ?? []).map((r) => ({ ...r, entryId: id }) as RoleDef);
  });
}

/** The seven class lines with Role entries, in the #15 slot order, then Journeyman. */
export const ROLE_LINES = [
  'Barbarian',
  'Squire',
  'Bowman',
  'Hunter',
  'Shaman',
  'Wizard',
  'Journeyman',
] as const;

export interface SlotDef {
  slot: number | { from: number; to: number };
  classLine: string;
  status: 'active' | 'contested';
}

export function slotPlan(kb: FactLookup): SlotDef[] {
  return (metaPathEntry(kb, ENTRY.slotPlan).slots ?? []) as SlotDef[];
}
