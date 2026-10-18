// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 F3, Next family-level unlock (docs/specs/M15-account-depth.md FR-14 to FR-19, TR-8): the lowest
// family-level gate above the current family level, among the next character slot
// (metapath.fact.family-slots) and the next family obol slot (M8's generated obols.fact.slots), both
// read from the gate tables, never from the save's lock flags (FR-14, FR-18). The ETA is plain
// arithmetic on the player's own save history (ADR 0005). Pure: no clock, no storage.
import type { AccountState } from '@idleon-forge/account-state';
import type { Entry, FactTable } from '@idleon-forge/knowledge';
import { familySlots } from './knowledge';
import type { FactLookup, RosterResult, StageResult } from './types';

export const FAMILY_UNLOCK_ID = 'metapath.goal.family-unlock';
/** M8's generated slot table: `rows.family` holds each family obol slot's shape and family-level gate. */
export const OBOL_SLOTS_FACT = 'obols.fact.slots';
/** The Obol Altar quest (M8 FR-20): family obols are equipped there (FR-14's altar note). */
export const OBOL_ALTAR_QUEST = 'quests.acquisition.obol-altar1';

const DAY_MS = 24 * 3600 * 1000;
/** FR-16: the pace window, the minimum history span, and the longest ETA we state. */
export const PACE_WINDOW_MS = 7 * DAY_MS;
export const MIN_HISTORY_MS = DAY_MS;
export const MAX_ETA_DAYS = 90;
/** FR-19: past slot 10 the character slots are W5+ content on a `beyond` account (P2). */
const LAST_COVERED_SLOT = 10;

/** One family-level gate: what opens there. */
export interface FamilyGate {
  familyLevel: number;
  /** The character slot that opens, or null. */
  characterSlot: number | null;
  /** Family obol slot shapes that open, in table order ("Hexagon", "Circle"). */
  obolShapes: string[];
}

export type FamilyEta = { kind: 'days'; days: number } | { kind: 'no-history' } | { kind: 'too-long' };

export interface FamilyUnlock {
  familyLevel: number;
  next: FamilyGate;
  gap: number;
  /** The subclass line the next character should take (M2 FR-8), when `next` is that character's slot. */
  line: string | null;
  /** Whether the Obol Altar is done; null when the quest data can't be read. */
  altarDone: boolean | null;
  /** The gate after `next`, for the why line; null past the last gate. */
  after: FamilyGate | null;
  eta: FamilyEta;
  /** Family level gained per day over the window; null without enough history. */
  perDay: number | null;
}

/** A save the pace can read: when it was saved, its family level and character count (TR-8). */
export interface FamilyPoint {
  at: number;
  familyLevel: number | null;
  characters: number;
}

function obolGates(kb: FactLookup): { familyLevel: number; shape: string }[] {
  const f = kb.get(OBOL_SLOTS_FACT) as FactTable | undefined;
  const rows = (f && 'rows' in f ? (f.rows as { family?: unknown }).family : undefined) as
    | { levelReq: number; shape: string; slot: number }[]
    | undefined;
  if (!Array.isArray(rows)) return [];
  return [...rows]
    .sort((a, b) => a.levelReq - b.levelReq || a.slot - b.slot)
    .map((r) => ({ familyLevel: r.levelReq, shape: r.shape }));
}

/** Every family-level gate in order (character slots and family obol slots merged by level). */
export function familyGates(kb: FactLookup, opts: { beyond: boolean }): FamilyGate[] {
  const byLevel = new Map<number, FamilyGate>();
  const at = (lv: number) => {
    let g = byLevel.get(lv);
    if (!g) {
      g = { familyLevel: lv, characterSlot: null, obolShapes: [] };
      byLevel.set(lv, g);
    }
    return g;
  };
  for (const s of familySlots(kb))
    if (!(opts.beyond && s.slot > LAST_COVERED_SLOT)) at(s.familyLevel).characterSlot = s.slot;
  for (const o of obolGates(kb)) at(o.familyLevel).obolShapes.push(o.shape);
  return [...byLevel.values()].sort((a, b) => a.familyLevel - b.familyLevel);
}

/** Whether the Obol Altar quest is done on any character; null when it can't be told. */
export function obolAltarDone(state: AccountState, kb: FactLookup): boolean | null {
  const e = kb.get(OBOL_ALTAR_QUEST) as Entry | undefined;
  const data = (e && 'data' in e ? e.data : undefined) as { npc?: string; questKey?: string } | undefined;
  if (!data?.npc || !data.questKey) return null;
  const { npc, questKey } = data;
  if (state.characters.some((c) => c.quests?.[npc]?.[questKey] === 1)) return true;
  return state.characters.every((c) => c.quests != null) ? false : null;
}

/**
 * FR-16, TR-8: family level per day between the oldest and newest save in the last 7 days, counting only
 * saves with today's character count (a new character's own level is not pace). Needs a span of 24 h.
 */
export function familyPace(points: readonly FamilyPoint[], current: FamilyPoint, now: number): number | null {
  if (current.familyLevel === null) return null;
  const same = [...points, current]
    .filter(
      (p): p is FamilyPoint & { familyLevel: number } =>
        p.familyLevel !== null && p.characters === current.characters && p.at <= now,
    )
    .sort((a, b) => a.at - b.at);
  const newest = same[same.length - 1];
  if (!newest) return null;
  const window = same.filter((p) => newest.at - p.at <= PACE_WINDOW_MS);
  const oldest = window[0];
  if (!oldest || newest.at - oldest.at < MIN_HISTORY_MS) return null;
  const perDay = ((newest.familyLevel - oldest.familyLevel) / (newest.at - oldest.at)) * DAY_MS;
  return perDay > 0 ? perDay : null;
}

export function familyEta(gap: number, perDay: number | null): FamilyEta {
  if (perDay === null) return { kind: 'no-history' };
  const days = gap / perDay;
  if (days > MAX_ETA_DAYS) return { kind: 'too-long' };
  return { kind: 'days', days: Math.max(1, Math.round(days)) };
}

/**
 * FR-14 to FR-19: the next family unlock, or null (unknown family level, no Stage, or no gate left).
 * `roster` gives the class line for a character slot (M2 FR-8): named only when the closed slot is the
 * one the roster's next character would take.
 */
export function familyUnlock(
  state: AccountState,
  kb: FactLookup,
  stage: Pick<StageResult, 'id' | 'coverage'>,
  roster: Pick<RosterResult, 'nextCharacter'>,
  history: readonly FamilyPoint[],
  now: number,
): FamilyUnlock | null {
  const familyLevel = state.account.accountLevel;
  if (familyLevel === null || familyLevel === undefined || stage.id === null) return null;
  const gates = familyGates(kb, { beyond: stage.coverage === 'beyond' }).filter(
    (g) => g.characterSlot !== null || g.obolShapes.length > 0,
  );
  const i = gates.findIndex((g) => g.familyLevel > familyLevel);
  const next = gates[i];
  if (i < 0 || !next) return null;
  const n = roster.nextCharacter;
  const line =
    next.characterSlot !== null && n && !n.slotOpen && n.slotNumber === next.characterSlot ? n.line : null;
  const gap = next.familyLevel - familyLevel;
  const current: FamilyPoint = {
    at: state.account.lastCloudSave ?? now,
    familyLevel,
    characters: state.characters.length + state.diagnostics.unreadableCharacters.length,
  };
  const perDay = familyPace(history, current, now);
  return {
    familyLevel,
    next,
    gap,
    line,
    altarDone: next.obolShapes.length > 0 ? obolAltarDone(state, kb) : null,
    after: gates[i + 1] ?? null,
    eta: familyEta(gap, perDay),
    perDay,
  };
}
