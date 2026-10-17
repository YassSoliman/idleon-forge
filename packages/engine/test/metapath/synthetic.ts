// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Synthetic Account States for M2's rule-table tests (no real data). Characters are made from a class
// name and a level; the class index comes from classes.fact.class-tree.
import type { AccountState, AccountSummary, CharacterState, Frontier } from '@idleon-forge/account-state';
import { lookupOf } from '../../src/metapath';
import { classTree } from '../../src/metapath/knowledge';
import { loadKb } from './helpers';

const tree = () => classTree(lookupOf(loadKb()));

export function char(
  index: number,
  cls: string | null,
  level: number,
  extra: Partial<CharacterState> = {},
): CharacterState {
  const classIndex = cls === null ? null : (tree().byName.get(cls)?.classIndex ?? null);
  return {
    index,
    name: `C${index + 1}`,
    class: cls ?? 'Beginner',
    level,
    afkType: 'FIGHTING',
    afkTarget: null,
    currentMap: null,
    foodStacks: [],
    secondsSinceLastSave: 0,
    classIndex,
    npcDialog: {},
    nextPortal: null,
    ...extra,
  };
}

export function account(characters: CharacterState[], patch: Partial<AccountSummary> = {}): AccountState {
  const finished = patch.finishedWorlds ?? [];
  return {
    schemaVersion: 5,
    asOf: 0,
    account: {
      currentWorld: (finished.length ? Math.max(...finished) : 0) + 1,
      finishedWorlds: finished,
      lastCloudSave: 0,
      secondsSinceLastSave: 0,
      dailyResetInSeconds: null,
      gameVersion: { serverBuild: 1, saveVersion: 1, parserTarget: '2.3.540' },
      accountLevel: characters.reduce((s, c) => s + c.level, 0),
      buildings: { deathNote: 0, printer3d: 0, atomCollider: 0 },
      salts: [],
      gateQuests: {},
      worldCrystals: { desertTopaz: 0, glacierQuartz: 0, galaxialAmethyst: 0 },
      frontier: null,
      ...patch,
    },
    characters,
    lastPlayedCharacterIndex: null,
    diagnostics: {
      failedSections: [],
      failedSideReads: [],
      skippedCharacters: [],
      unreadableCharacters: [],
      unknownIds: { monsters: [], maps: [], items: [], classes: [] },
      unknownFields: [],
      unnamed: false,
      parserPin: { commit: 'pin', gameVersion: '2.3.540' },
      source: 'paste',
    },
    warnings: [],
  };
}

export const failSection = (s: AccountState, ...sections: string[]): AccountState => ({
  ...s,
  diagnostics: { ...s.diagnostics, failedSections: [...s.diagnostics.failedSections, ...sections] },
});

/** A frontier with one fight row per [index, finalKph, doorsCleared, killsLeft]. */
export function frontierOf(
  rows: Array<{
    i: number;
    kph: number;
    count: number;
    reaches?: boolean;
    killsLeft?: number;
    hit?: number;
    surv?: number;
    raw?: number;
  }>,
  of = 10,
): Frontier {
  return {
    world: 2,
    mapIndex: 64,
    mapName: 'Sands_of_Time',
    door: 0,
    kind: 'uncleared',
    requirement: 3000,
    routeCleared: rows.map((r) => ({
      characterIndex: r.i,
      count: r.count,
      of,
      reachesFrontier: r.reaches ?? true,
    })),
    fights: rows.map((r) => ({
      characterIndex: r.i,
      finalKillsPerHour: r.kph,
      killsPerHour: r.raw ?? r.kph,
      hitChance: r.hit ?? 100,
      survivability: r.surv ?? 100,
      killsLeft: r.killsLeft ?? 3000,
    })),
  };
}
