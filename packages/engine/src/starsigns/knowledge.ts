// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What M16 reads from the compiled Knowledge Base (docs/specs/M16-star-signs.md TR-3, TR-4): its three
// authored fact tables, the map graph, and the entries whose `values` carry every word and judgment value.
import type { Entry, FactTable } from '@idleon-forge/knowledge';
import { render, type SlotValue } from '@idleon-forge/knowledge';
import type { SourceRef } from '../result';

export interface StarKnowledge {
  entries: Readonly<Record<string, Entry>>;
  facts: Readonly<Record<string, FactTable>>;
}

export const ENTRY = {
  telescope: 'star-signs.goal.telescope',
  constellation: 'star-signs.goal.constellation',
  signs: 'star-signs.goal.signs',
  challenge: 'star-signs.check.activeplay-challenge',
} as const;
export const FACT = {
  constellations: 'star-signs.fact.constellations',
  chart: 'star-signs.fact.chart',
  rules: 'star-signs.fact.rules',
  maps: 'maps.fact.maps',
} as const;

export type ConstellationKind = 'visit' | 'level' | 'afk' | 'task' | 'challenge';
export interface ConstellationFact {
  name: string;
  rawIndex: number;
  mapIndex: number;
  world: number;
  /** N.js StarQuests type: 0 reach, 1 level, 3 AFK hours, 4 game event. */
  type: number;
  min: number;
  max: number;
  players: number;
  points: number;
  requirement: string;
  kind: ConstellationKind;
  enter?: { key?: string; arena?: number; ticket?: number };
  anchor: string;
}
export interface ChartNode {
  node: number;
  /** The game's StarSigns id (Toolbox starSigns catalog index). */
  id: number;
  sign: string;
  parent: string | null;
  cost: number;
  chart: 'chronus' | 'hydron' | 'seraph';
}
export interface StarRules {
  chartGates: { hydron: number; seraph: number; countedNodes: number };
  cosmos: { sign: string; slots: number }[];
  starters: string[];
  telescope: {
    mapIndex: number;
    npc: string;
    questKey: string;
    bagSlots: number;
    rewards: Record<string, number>;
  };
  route: { mapIndex: number; door: number }[];
  candies: { rawName: string; hours: number }[];
  noCandy: string[];
  /** Boss key item names (Toolbox items.json displayName). */
  keys: Record<string, string>;
  classLines: Record<'archer' | 'mage' | 'beginner', { min: number; max: number }>;
}
export interface MapRow {
  index: number;
  name: string;
  world: number;
  afkType: string | null;
  listed: boolean;
  doors: { requirement: number; destination: number | null }[];
}

const rowsOf = <T>(kb: StarKnowledge, id: string): T | null => (kb.facts[id]?.rows as T | undefined) ?? null;

export const constellationFacts = (kb: StarKnowledge): ConstellationFact[] =>
  rowsOf<{ constellations: ConstellationFact[] }>(kb, FACT.constellations)?.constellations ?? [];
export const chartNodes = (kb: StarKnowledge): ChartNode[] =>
  rowsOf<{ nodes: ChartNode[] }>(kb, FACT.chart)?.nodes ?? [];
export const starRules = (kb: StarKnowledge): StarRules | null => rowsOf<StarRules>(kb, FACT.rules);
export const mapRows = (kb: StarKnowledge): Map<number, MapRow> =>
  new Map((rowsOf<MapRow[]>(kb, FACT.maps) ?? []).map((r) => [r.index, r]));

/** Whether every table and entry M16 needs is shipped (FR-20: never advice from a partial bundle). */
export function knowledgeReady(kb: StarKnowledge): boolean {
  return (
    constellationFacts(kb).length > 0 &&
    chartNodes(kb).length > 0 &&
    starRules(kb) !== null &&
    Object.values(ENTRY).every((id) => kb.entries[id] !== undefined)
  );
}

export function sourcesOf(kb: StarKnowledge, id: string): SourceRef[] {
  return (kb.entries[id]?.sources ?? []).map((s) => ({
    label: s.title,
    url: s.url,
    tier: s.tier,
    verifiedOn: s.verified,
    ...(s.claimDate ? { claimDate: s.claimDate } : {}),
    gameVersion: s.gameVersion,
  }));
}

/** A string value of an entry, raw. */
export function stringValue(kb: StarKnowledge, id: string, key: string): string | null {
  const v = kb.entries[id]?.values[key];
  return typeof v === 'string' ? v : null;
}

/** A numeric judgment value of an entry, or the fallback. */
export function numberOf(kb: StarKnowledge, id: string, key: string, fallback: number): number {
  const v = kb.entries[id]?.values[key];
  return typeof v === 'number' ? v : fallback;
}

/** A comma-separated list value (the chart order, the fit lists). */
export function listOf(kb: StarKnowledge, id: string, key: string): string[] {
  return (stringValue(kb, id, key) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** A template from an entry's `values`, rendered; '' when missing or a slot is missing. */
export function say(
  kb: StarKnowledge,
  id: string,
  key: string,
  slots: Record<string, SlotValue> = {},
): string {
  const t = stringValue(kb, id, key);
  if (t === null) return '';
  try {
    return render(t, slots);
  } catch {
    return '';
  }
}

/** "The_Fuzzy_Dice" -> "The Fuzzy Dice". */
export const human = (s: string) => s.replace(/_/g, ' ').trim();

/** "A-2" before "A-10" (FR-7 natural order). */
export function naturalName(a: string, b: string): number {
  const [la, na] = [a[0] ?? '', Number(a.slice(2))];
  const [lb, nb] = [b[0] ?? '', Number(b.slice(2))];
  return la === lb ? na - nb : la < lb ? -1 : 1;
}
