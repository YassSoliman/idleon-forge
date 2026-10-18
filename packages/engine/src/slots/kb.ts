// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What M20 reads from the compiled Knowledge Base (docs/specs/M20-skills-parallel-slots.md TR-3, TR-4): its
// entries' `values` (every word M20 shows) and its fact tables. Shared by the slots and checklist parts.
import type { CharacterState } from '@idleon-forge/account-state';
import { type Entry, type FactTable, render, type SlotValue } from '@idleon-forge/knowledge';
import { classLabel } from '../core/labels';
import type { Goal, GoalDetail, SourceRef } from '../result';

export interface M20Knowledge {
  entries: Readonly<Record<string, Entry>>;
  facts: Readonly<Record<string, FactTable>>;
}

export const ENTRY = {
  seat: 'construction.check.cog-seat-free',
  skull: 'worship.check.no-skull',
  trapStart: 'trapping.check.start',
  trapSet: 'trapping.check.no-trap-set',
  liquid: 'alchemy.check.liquid-unstaffed',
  fillOrder: 'slots.priority.fill-order',
  randomEvent: 'random-events.check.today',
  killroyRoom: 'killroy.check.room',
  killroySkulls: 'killroy.check.skulls',
  weeklyBattle: 'weekly-battles.check.raid',
  ballot: 'ballot.check.vote',
  tournament: 'pet-tournament.check.register',
  tasks: 'task-board.check.daily',
  guildDaily: 'guild.check.daily',
  guildWeekly: 'guild.check.weekly',
} as const;

export const FACT = {
  rows: 'checklist.fact.rows',
  clocks: 'checklist.fact.clocks',
  specialty: 'skills.fact.specialty',
  gates: 'skills.fact.gates',
  trapCapacity: 'trapping.fact.trap-set-capacity',
  skulls: 'worship.fact.skulls',
} as const;

/** A fact table's rows, or null when it isn't shipped. */
export function rowsOf<T>(kb: M20Knowledge, id: string): T | null {
  return (kb.facts[id]?.rows as T | undefined) ?? null;
}

export function sourcesOf(kb: M20Knowledge, id: string): SourceRef[] {
  return (kb.entries[id]?.sources ?? []).map((s) => ({
    label: s.title,
    url: s.url,
    tier: s.tier,
    verifiedOn: s.verified,
    ...(s.claimDate ? { claimDate: s.claimDate } : {}),
    gameVersion: s.gameVersion,
  }));
}

/** A template from an entry's `values`, rendered; '' when the entry, the value or a slot is missing. */
export function say(
  kb: M20Knowledge,
  id: string,
  key: string,
  slots: Record<string, SlotValue> = {},
): string {
  const t = kb.entries[id]?.values[key];
  if (typeof t !== 'string') return '';
  try {
    return render(t, slots);
  } catch {
    return '';
  }
}

export function numberValue(kb: M20Knowledge, id: string, key: string, fallback: number): number {
  const v = kb.entries[id]?.values[key];
  return typeof v === 'number' ? v : fallback;
}

/** "Squire Lv 85": class and level only, never a name (M4 TR-9). */
export const who = (c: Pick<CharacterState, 'class' | 'level'>) => `${classLabel(c)} Lv ${c.level}`;

/** "Liquid Nitrogen, Squire" style joins: "a, b and c". */
export const joinAnd = (xs: readonly string[]) =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

/** 0.076 -> "0.08", 12.3 -> "12", 92.7 -> "93": a liquid amount as the game shows it. */
export const amount = (n: number) => (n < 10 ? String(Math.round(n * 100) / 100) : String(Math.round(n)));

/** One Goal of an M20 entry, the M16 shape: text and why already rendered. */
export function goalOf(
  kb: M20Knowledge,
  id: string,
  key: string,
  text: string,
  why: string,
  details: GoalDetail[],
  fields: string[],
): Goal | null {
  const e = kb.entries[id];
  if (e?.type !== 'check' || !text) return null;
  return {
    id,
    title: e.title,
    system: e.system,
    category: e.category ?? 'nice',
    nextAction: {
      key,
      entryId: id,
      text,
      why,
      sources: sourcesOf(kb, id),
      stale: false,
      contested: null,
      confidence: e.confidence,
      provenance: { entryIds: [id], fields },
    },
    milestone: null,
    ...(details.length ? { details } : {}),
  };
}
