// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 Redesign (TR-3, FR-F10): Toolbox output and the raw save -> each preset's star point total, door
// kills on every map, and statue levels. Called from adapter.ts; like it, the only place that knows
// these Toolbox paths. `starTotal` arrives injected from the parse worker (ADR 0006); without it the
// star totals are null.
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import { killsLeftTable } from './frontier';
import { STAR_TOTAL_SECTIONS } from './redesign-fields';
import type { RedesignAccountFields, StatueState } from './redesign-types';
import type { CharacterState } from './types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const attempt = <T>(f: () => T | null): T | null => {
  try {
    return f();
  } catch {
    return null;
  }
};
const json = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

export interface RedesignInputs {
  account: Dict;
  characters: unknown[];
  /** The raw save (`envelope.data`), for `KLA_<i>`, `StuG` and `StatueLevels_<i>`. */
  data: Dict;
  states: CharacterState[];
  failedSections: readonly string[];
  calls: ToolboxCalls | null;
  withFrozenClock: (<T>(now: number, f: () => T) => T) | null;
  asOf: number;
}

/**
 * One character's `KLA_<i>`, indexed by map: each door's kills left, ceiled like M4's `portalKillsLeft`
 * and clamped at 0 (a cleared door reads 0, however far past it the character went). Stored as a dense
 * array, not an object keyed by map, so 300+ maps per character stay inside the history cap (M1 TR-16).
 * A map whose row isn't an array reads []. null when the table is unreadable.
 */
export function doorKillsOf(table: unknown[] | null): Record<number, number[]> | null {
  if (table === null) return null;
  const out: number[][] = [];
  for (const row of table) {
    const doors: number[] = [];
    if (Array.isArray(row))
      for (const v of row) {
        const n = finite(v);
        if (n === null) return null;
        doors.push(Math.max(0, Math.ceil(n)));
      }
    out.push(doors);
  }
  return out;
}

function readStatues(input: RedesignInputs): StatueState[] | null {
  const grades = json(input.data.StuG);
  const statues = input.account.statues;
  if (input.failedSections.includes('statues') || !Array.isArray(grades) || !Array.isArray(statues))
    return null;
  // Each character's own table: [[level, progress], ...] per statue slot (V-4).
  const tables = input.states.map((st) => {
    const t = json(input.data[`StatueLevels_${st.index}`]);
    return Array.isArray(t) ? t : null;
  });
  const perCharacter = tables.length > 0 && tables.every((t) => t !== null);
  const out: StatueState[] = [];
  for (const s of statues) {
    if (!isDict(s) || typeof s.name !== 'string') return null;
    const index = finite(s.statueIndex);
    const level = finite(s.level);
    if (index === null || level === null) return null;
    let byCharacter: number[] | null = null;
    if (perCharacter) {
      byCharacter = [];
      for (const t of tables) {
        const row = t?.[index];
        // A slot past the end of a character's table: that character never levelled it.
        const lv = row === undefined ? 0 : Array.isArray(row) ? finite(row[0]) : null;
        if (lv === null) {
          byCharacter = null;
          break;
        }
        byCharacter.push(Math.max(0, Math.floor(lv)));
      }
    }
    out.push({
      index,
      name: s.name,
      level: Math.max(0, Math.floor(level)),
      grade: finite(grades[index]) ?? 0,
      byCharacter,
    });
  }
  return out;
}

/** The M21 fields: per character written onto the states in place, the account ones returned. */
export function readRedesign(input: RedesignInputs, c: Collector): RedesignAccountFields {
  const { account, characters, data, states, failedSections, calls, withFrozenClock, asOf } = input;
  const frozen = <T>(f: () => T): T => (withFrozenClock ? withFrozenClock(asOf, f) : f());
  const starKnown = !STAR_TOTAL_SECTIONS.some((s) => failedSections.includes(s));
  for (const st of states) {
    const at = `characters[${st.index}]`;
    if (c.checkRaw('characters[].doorKillsLeft', `${at}.doorKillsLeft`, st.index)) {
      st.doorKillsLeft = doorKillsOf(killsLeftTable(data, st.index));
      if (st.doorKillsLeft === null) c.unknown(`${at}.doorKillsLeft`);
    } else st.doorKillsLeft = null;

    const raw = characters[st.index];
    if (!st.talents) continue;
    const total = (preset: 'active' | 'other'): number | null =>
      calls && starKnown && isDict(raw)
        ? attempt(() => frozen(() => calls.starTotal(raw, account, preset)))
        : null;
    st.talents.starPoints = {
      active: total('active'),
      other: st.talents.other ? total('other') : null,
    };
  }
  const known = c.checkRaw('account.statues', 'account.statues', null);
  const statues = known ? readStatues(input) : null;
  if (known && statues === null && !failedSections.includes('statues')) c.unknown('account.statues');
  return { statues };
}
