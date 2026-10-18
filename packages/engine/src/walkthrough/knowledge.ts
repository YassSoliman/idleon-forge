// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What M14 reads from the compiled Knowledge Base: the generated item and quest Acquisitions, the map
// graph, the authored fact tables and the entries whose `values` carry every word a step uses.
import type { Entry, FactTable } from '@idleon-forge/knowledge';
import { aboutDuration, render, type SlotValue } from '@idleon-forge/knowledge';
import { slugify } from '@idleon-forge/knowledge/generators';
import type { SourceRef } from '../result';

export interface WalkthroughKnowledge {
  entries: Readonly<Record<string, Entry>>;
  facts: Readonly<Record<string, FactTable>>;
}

export const ENTRY = {
  assign: 'walkthrough.check.assign',
  printer: 'printer.check.slot-plan',
} as const;
export const FACT = {
  maps: 'maps.fact.maps',
  nodes: 'skills.fact.nodes',
  tabs: 'anvil.fact.recipe-tabs',
  presetFit: 'walkthrough.fact.preset-fit',
} as const;

export interface ItemDrop {
  monster: string;
  monsterName: string;
  afkType: string | null;
  maps: number[];
  world: number | null;
  chance: number;
  quantity: number;
  table: boolean;
  printable: boolean;
  wiki: string | null;
}
export interface ItemData {
  rawName: string;
  name: string;
  typeGen: string | null;
  wiki: string | null;
  recipe: { lvReqToCraft: number; materials: { rawName: string; amount: number; ref: string }[] } | null;
  forge: { ore: string; ref: string } | null;
  anvil: { index: number; requiredAmount: number; levelReq: number } | null;
  liquidShop: { index: number; x1: number; x2: number } | null;
  shops: { town: string; mapIndex: number | null }[];
  node: { skill: string; maps: number[] } | null;
  drops: ItemDrop[];
}
export interface QuestRequirement {
  rawName: string;
  name: string;
  amount: number;
  ref?: string;
}
export interface QuestData {
  npc: string;
  questKey: string;
  questOrder: number;
  questName: string;
  title: string;
  questType: string | null;
  world: number | null;
  map: number | null;
  consumes: boolean;
  inventorySpacesNeeded: number;
  requires: QuestRequirement[];
}
export interface MapRow {
  index: number;
  name: string;
  world: number;
  afkType: string | null;
  target: string | null;
  listed: boolean;
  doors: { requirement: number; destination: number | null }[];
}
export interface SkillNodeRow {
  item: string;
  skill: string;
  maps: number[];
  target: string;
  minEfficiency: number;
}
export interface PresetFit {
  talents: { skillingAt: number; skilling: string[] };
  cards: Record<string, string[]>;
}

export const itemId = (rawName: string) => `items.acquisition.${slugify(rawName)}`;

export function itemOf(kb: WalkthroughKnowledge, rawName: string, ref?: string): ItemData | null {
  const e = kb.entries[ref ?? itemId(rawName)];
  if (e?.type !== 'acquisition' || !('data' in e) || !e.data) return null;
  return e.data as unknown as ItemData;
}

export function questOf(kb: WalkthroughKnowledge, id: string): QuestData | null {
  const e = kb.entries[id];
  if (e?.type !== 'acquisition' || !('data' in e) || !e.data) return null;
  const d = e.data as unknown as QuestData;
  return typeof d.npc === 'string' && Array.isArray(d.requires) ? d : null;
}

export function sourcesOf(kb: WalkthroughKnowledge, id: string): SourceRef[] {
  const e = kb.entries[id];
  return (e?.sources ?? []).map((s) => ({
    label: s.title,
    url: s.url,
    tier: s.tier,
    verifiedOn: s.verified,
    ...(s.claimDate ? { claimDate: s.claimDate } : {}),
    gameVersion: s.gameVersion,
  }));
}

const rows = <T>(kb: WalkthroughKnowledge, id: string): T | null =>
  (kb.facts[id]?.rows as T | undefined) ?? null;

export function mapGraph(kb: WalkthroughKnowledge): Map<number, MapRow> {
  return new Map((rows<MapRow[]>(kb, FACT.maps) ?? []).map((r) => [r.index, r]));
}
export const skillNodes = (kb: WalkthroughKnowledge): SkillNodeRow[] =>
  rows<SkillNodeRow[]>(kb, FACT.nodes) ?? [];
export const recipeTabs = (kb: WalkthroughKnowledge): Record<string, number> =>
  rows<Record<string, number>>(kb, FACT.tabs) ?? {};
export const presetFit = (kb: WalkthroughKnowledge): PresetFit | null => rows<PresetFit>(kb, FACT.presetFit);

/** A judgment value of an M14 entry (`values`), or the fallback when the entry isn't shipped. */
export function numberValue(
  kb: WalkthroughKnowledge,
  entryId: string,
  key: string,
  fallback: number,
): number {
  const v = kb.entries[entryId]?.values[key];
  return typeof v === 'number' ? v : fallback;
}

/** A step template from an M14 entry's `values`, rendered; null when the entry or template is missing. */
export function say(
  kb: WalkthroughKnowledge,
  entryId: string,
  template: string,
  slots: Record<string, SlotValue>,
): string | null {
  const t = kb.entries[entryId]?.values[template];
  if (typeof t !== 'string') return null;
  try {
    return render(t, slots);
  } catch {
    return null;
  }
}

/** "Megalodon_Tooth" / "The_Mimic_Hole" -> spaced, for template slots. */
export const human = (s: string) => s.replace(/_/g, ' ').trim();

/** "about 3h", "about 40m", "about 4d": the app's one duration format (#111 follow-up). Display only. */
export const hoursText = (seconds: number): string => aboutDuration(seconds);

/** "21.2%" (a 0..1 chance), "0.0068%" for small ones. */
export function chanceText(c: number): string {
  const p = c * 100;
  if (p >= 1) return `${(Math.round(p * 10) / 10).toString()}%`;
  return `${Number(p.toPrecision(2)).toString()}%`;
}
