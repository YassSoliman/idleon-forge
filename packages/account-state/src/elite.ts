// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-17: `characters[].eliteStep` from the character's class and its raw quest records
// (`QuestComplete_i.Eliteus1/2`, `QuestStatus_i.Eliteus1`). Called from adapter.ts.
//
// V44 (game client, `_event_CLASSADVANCE`): Eliteus's class picker opens only for classes 8, 9, 20, 21,
// 32 and 33 (Barbarian, Squire, Bowman, Hunter, Wizard, Shaman), once `Eliteus2` is accepted or done, and
// tests no level. V8: the Greenie Gang counter is `QuestStatus_i.Eliteus1[0]`, done at 10 (quests.json
// `customArray` "Defeat_the_Greenie_Gang:" 10). A promoted character can keep `Eliteus2` at 0 (re-entry
// resets it), so the class, not the quest, says `done`.

import type { EliteStep } from './elite-types';
import type { CharacterState } from './types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const json = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

/** The six subclasses Eliteus serves and the elite each becomes (Toolbox classPromotions.json). */
export const ELITE_OF_SUBCLASS: Readonly<Record<string, string>> = {
  Barbarian: 'Blood_Berserker',
  Squire: 'Divine_Knight',
  Bowman: 'Siege_Breaker',
  Hunter: 'Beast_Master',
  Wizard: 'Elemental_Sorcerer',
  Shaman: 'Bubonic_Conjuror',
};

/** The elites and the classes they promote to (classPromotions.json): any of these is `done`. */
export const ELITE_OR_LATER: Readonly<Record<string, string>> = {
  Blood_Berserker: 'Blood_Berserker',
  Death_Bringer: 'Blood_Berserker',
  Divine_Knight: 'Divine_Knight',
  Royal_Guardian: 'Divine_Knight',
  Siege_Breaker: 'Siege_Breaker',
  Beast_Master: 'Beast_Master',
  Wind_Walker: 'Beast_Master',
  Elemental_Sorcerer: 'Elemental_Sorcerer',
  Spiritual_Monk: 'Elemental_Sorcerer',
  Bubonic_Conjuror: 'Bubonic_Conjuror',
  Arcane_Cultist: 'Bubonic_Conjuror',
};

/** Greenie Gang kills that finish Eliteus's first quest. */
export const GREENIE_GANG_KILLS = 10;

/** One character's Eliteus step from its class and raw quest records; null when they can't be read. */
export function eliteStepOf(cls: string, questComplete: unknown, questStatus: unknown): EliteStep | null {
  const done = ELITE_OR_LATER[cls];
  if (done) return { step: 'done', elite: done, gangKills: null };
  const elite = ELITE_OF_SUBCLASS[cls];
  if (!elite) return { step: 'none', elite: null, gangKills: null };
  const qc = json(questComplete);
  const qs = json(questStatus);
  if (!isDict(qc) || !isDict(qs)) return null;
  if (finite(qc.Eliteus1) === 1) return { step: 'pick', elite, gangKills: null };
  const row = Array.isArray(qs.Eliteus1) ? qs.Eliteus1 : [];
  const kills = Math.max(0, Math.min(GREENIE_GANG_KILLS, finite(row[0]) ?? 0));
  return { step: 'gang', elite, gangKills: kills };
}

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

/** M26 FR-17: `characters[].eliteStep`, written onto the states in place. */
export function readElite(input: { data: Dict; states: CharacterState[] }, c: Collector): void {
  for (const st of input.states) {
    const at = `characters[${st.index}].eliteStep`;
    st.eliteStep = null;
    if (!c.checkRaw('characters[].eliteStep', at, st.index)) continue;
    const step = eliteStepOf(
      st.class,
      input.data[`QuestComplete_${st.index}`],
      input.data[`QuestStatus_${st.index}`],
    );
    if (step === null) c.unknown(at);
    st.eliteStep = step;
  }
}
