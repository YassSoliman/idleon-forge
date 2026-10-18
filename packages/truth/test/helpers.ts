// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Hand-built saves, Account States and engine results for the truth rules. Only the fields the rules
// read are set; everything else is cast. No real save, no names.
import type { AccountState, CharacterState, PresetTalents } from '@idleon-forge/account-state';
import type { BuildPresetView, BuildRoadmap, EngineResult } from '@idleon-forge/engine/result';
import { TALENT_ORDER } from '../src/game-data';

/** Class 9 (Squire): tabs from classes 6 (Rage Basics), 7 (Warrior), 9 (Squire). */
export const SQUIRE = 9;
export const tabIds = (classId: number) => TALENT_ORDER.slice(15 * (classId - 1), 15 * classId);

export interface CharSpec {
  index: number;
  classId?: number;
  level?: number;
  selected?: 0 | 1;
  live: Record<number, number>;
  other?: Record<number, number>;
  skills?: number[];
  money?: number;
}

/** A raw envelope: JSON-text values like the real Firestore document. */
export function envelopeOf(chars: CharSpec[], extra: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = {
    CYTalentPoints: [0, 0, 0, 0, 0, 0],
    AchieveReg: JSON.stringify(new Array(320).fill(0)),
    MoneyBANK: 1000,
    ChestOrder: ['Copper', 'Blank', 'Iron'],
    ChestQuantity: [10, 0, 5],
    ...extra,
  };
  for (const c of chars) {
    const lv = c.level ?? 40;
    data[`CharacterClass_${c.index}`] = c.classId ?? SQUIRE;
    data[`Lv0_${c.index}`] = [lv, ...(c.skills ?? [0, 0, 0, 0, 0, 0, 0, 0, 0])];
    data[`PlayerStuff_${c.index}`] = JSON.stringify([50, c.selected ?? 0, 0]);
    data[`SL_${c.index}`] = JSON.stringify(c.live);
    if (c.other) data[`SLpre_${c.index}`] = JSON.stringify(c.other);
    data[`SM_${c.index}`] = JSON.stringify({});
    data[`Money_${c.index}`] = c.money ?? 500;
    data[`InventoryOrder_${c.index}`] = ['Copper', 'Blank'];
    data[`ItemQTY_${c.index}`] = [3, 0];
  }
  return { data };
}

/** Toolbox-shaped preset talents for the Account State, from a level map, for a class's tabs. */
export function presetTalents(levels: Record<number, number>, classes: number[]): PresetTalents {
  return {
    tabs: classes.map((cls, i) => ({
      tab: (i + 1) as 1 | 2 | 3,
      tabName: `class ${cls}`,
      talents: tabIds(cls).map((id) => ({ id, base: levels[id] ?? 0, max: 100 })),
    })),
    star: [],
    attackBar: null,
  };
}

export function stateOf(chars: CharSpec[]): AccountState {
  const classes = [6, 7, 9];
  const characters = chars.map(
    (c) =>
      ({
        index: c.index,
        name: `Character ${c.index + 1}`,
        class: 'Squire',
        level: c.level ?? 40,
        money: c.money ?? 500,
        inventoryItems: { Copper: 3 },
        talents: {
          classIndex: c.classId ?? SQUIRE,
          selectedPreset: c.selected ?? 0,
          active: presetTalents(c.live, classes),
          other: c.other ? presetTalents(c.other, classes) : null,
        },
      }) as unknown as CharacterState,
  );
  return {
    asOf: 0,
    account: { bankCoins: 1000, storageItems: { Copper: 10, Iron: 5 } },
    characters,
  } as unknown as AccountState;
}

export function presetView(
  slot: 0 | 1,
  active: boolean,
  partial: Partial<BuildPresetView> = {},
): BuildPresetView {
  return {
    slot,
    active,
    role: 'fighting',
    heading: active ? 'Fighting preset' : 'Skilling preset',
    roleText: '',
    buildTitle: 'Squire fighting build',
    unspent: null,
    tabs: [],
    attackBar: null,
    next: [],
    ...partial,
  };
}

export function resultOf(builds: BuildRoadmap[], extra: Partial<EngineResult> = {}): EngineResult {
  return {
    characters: builds.map((b) => ({ index: b.index, classId: 'Squire', level: b.level, goals: [] })),
    account: { goals: [], spendPlan: null },
    builds,
    ...extra,
  } as unknown as EngineResult;
}

export function roadmap(index: number, presets: BuildPresetView[], level = 40): BuildRoadmap {
  return {
    index,
    classLabel: 'Squire',
    level,
    status: 'next: Power Strike',
    path: [],
    nextClass: null,
    presets,
    comingUp: [],
    note: null,
    quiet: null,
    stale: false,
    sources: [],
    entryIds: [],
  };
}
