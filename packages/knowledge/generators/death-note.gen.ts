// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Death Note ladders (M4): one generated Goal per Death Note monster, its Milestones taken from
// Toolbox's exported rank tables. Normal monsters use DEATH_NOTE_RANKS (one global table, so a change
// to it shows in the fact diff as one grouped line); the miniboss list (ninjaExtraInfo[30]) uses
// MINI_BOSS_DEATH_NOTE_RANKS. Worlds are 1-based here (Toolbox data is 0-based). The eclipse-skull
// rule (ECLIPSE_SKULL_KILLS / _RANK, gated on a rift bonus) rides along in `data.eclipse`.
import type { GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

type RankTable = readonly (readonly [number, number])[];
interface DeathNoteRow {
  rawName: string;
  name: string;
  world: number;
}

export const DEATH_NOTE_FILE = 'parsers/world-3/deathNote.ts';

function ladder(table: RankTable) {
  return table.map(([at, rank]) => ({ at, reward: `rank ${rank}` }));
}

function readTable(value: unknown, name: string): RankTable {
  if (!Array.isArray(value) || value.length === 0)
    throw new Error(`death-note: ${name} is not a non-empty table`);
  return value.map((row, i) => {
    if (!Array.isArray(row) || typeof row[0] !== 'number' || typeof row[1] !== 'number')
      throw new Error(`death-note: ${name}[${i}] is not [kills, rank]`);
    return [row[0], row[1]] as const;
  });
}

const generator = defineGenerator({
  name: 'death-note',
  system: 'death-note',
  inputs: [
    `${DEATH_NOTE_FILE}#DEATH_NOTE_RANKS`,
    `${DEATH_NOTE_FILE}#MINI_BOSS_DEATH_NOTE_RANKS`,
    `${DEATH_NOTE_FILE}#ECLIPSE_SKULL_KILLS`,
    `${DEATH_NOTE_FILE}#ECLIPSE_SKULL_RANK`,
    'website-data/shared-data.json#deathNote',
    'website-data/shared-data.json#ninjaExtraInfo',
    'website-data/monsters.json',
  ],
  constants: {
    DEATH_NOTE_RANKS: DEATH_NOTE_FILE,
    MINI_BOSS_DEATH_NOTE_RANKS: DEATH_NOTE_FILE,
    ECLIPSE_SKULL_KILLS: DEATH_NOTE_FILE,
    ECLIPSE_SKULL_RANK: DEATH_NOTE_FILE,
  },
  run({ data, constants, pin }) {
    const ranks = readTable(constants.DEATH_NOTE_RANKS, 'DEATH_NOTE_RANKS');
    const miniRanks = readTable(constants.MINI_BOSS_DEATH_NOTE_RANKS, 'MINI_BOSS_DEATH_NOTE_RANKS');
    const eclipseAbove = constants.ECLIPSE_SKULL_KILLS;
    const eclipseRank = constants.ECLIPSE_SKULL_RANK;
    if (typeof eclipseAbove !== 'number' || typeof eclipseRank !== 'number')
      throw new Error('death-note: ECLIPSE_SKULL_KILLS / ECLIPSE_SKULL_RANK are not numbers');
    const rows = data.deathNote as DeathNoteRow[];
    const monsters = data.monsters as Record<string, { Name?: string }>;
    const minis = ((data.ninjaExtraInfo as unknown[])[30] ?? []) as string[];
    if (!Array.isArray(rows) || rows.length === 0)
      throw new Error('death-note: shared-data deathNote is empty');
    if (!Array.isArray(minis))
      throw new Error('death-note: ninjaExtraInfo[30] (the miniboss list) is not a list');
    const by = generatedBy(generator, pin);
    const source = generatedSource(pin, DEATH_NOTE_FILE, 'IdleOn Toolbox game data: DEATH_NOTE_RANKS');
    const miniSource = generatedSource(
      pin,
      DEATH_NOTE_FILE,
      'IdleOn Toolbox game data: MINI_BOSS_DEATH_NOTE_RANKS',
    );

    const entry = (
      id: string,
      rawName: string,
      display: string,
      world: number | null,
      table: RankTable,
      src: typeof source,
      why: string,
      eclipse: boolean,
    ): GeneratedEntryT => ({
      id,
      system: 'death-note',
      type: 'goal',
      origin: 'generated',
      title: `Death Note: ${display}`.slice(0, 80),
      text: `{value:compact} ${display} kills; next Death Note rank at {next:compact}`,
      why,
      values: world === null ? { monster: rawName } : { monster: rawName, world },
      sources: [src],
      appliesTo: { stages: 'all' },
      confidence: 'H',
      status: 'active',
      scope: 'account',
      category: 'compounding',
      unit: 'kills',
      progress: { id: 'death-note/kills-of-monster', params: { monster: rawName } },
      milestones: ladder(table),
      // Past `above` kills (strictly more), a normal mob's rank becomes `rank` once the Eclipse_Skulls
      // rift bonus is unlocked (deathNote.ts getDeathNoteRank). Not a ladder step: it depends on the rift.
      ...(eclipse
        ? { data: { eclipse: { above: eclipseAbove, rank: eclipseRank, needsRiftBonus: 'Eclipse_Skulls' } } }
        : {}),
      generatedBy: by,
    });

    const out: GeneratedEntryT[] = rows.map((r) => {
      const display = (monsters[r.rawName]?.Name ?? r.name).replace(/_/g, ' ');
      const world = r.world + 1;
      return entry(
        `death-note.goal.${slugify(r.rawName)}`,
        r.rawName,
        display,
        world,
        ranks,
        source,
        `Each Death Note rank adds to the World ${world} skull total.`,
        true,
      );
    });
    for (const raw of minis) {
      const display = (monsters[raw]?.Name ?? raw).replace(/_/g, ' ');
      out.push(
        entry(
          `death-note.goal.miniboss-${slugify(raw)}`,
          raw,
          display,
          null,
          miniRanks,
          miniSource,
          'Each miniboss Death Note rank adds to the miniboss skull total.',
          false,
        ),
      );
    }
    return { entries: out };
  },
});

export default generator;
