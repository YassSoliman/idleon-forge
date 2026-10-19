// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-11: Toolbox `account.rift` (`getRift`: `currentRift` = raw `Rift[0]`, `currentProgress` =
// `Rift[1]`, `chars` = `Rift[2]`, `list` = `riftInfo`) plus Toolbox `account.quests` (the Rift Ripper)
// and raw `AFKtarget_i` -> `account.rift`. Called from adapter.ts; the only place that knows these paths.
//
// The task of each level and its quota are read from Toolbox's `riftInfo` text, which states them
// ("KILL_200000_MONSTERS_WHILE_AFK"). V1 (2026-10-19) checked that reading against the game client's own
// tables, `RiftStuff[4]` (task per level) and `RiftStuff[5]` (quota per task): they agree on every level
// (test/rift.test.ts holds both lists). The client also settles the rest of V1:
// - `RiftCompleted` is `Rift[1] >= quota`, and `RiftTaskProgress` adds nothing once it holds, so kills
//   past the quota are lost;
// - `Rift[0]` only moves when a character walks into the portal in The Rift after the task is done
//   ("Rift_Completed._You_may_proceed..."; the portal sets `Rift[0] + 1` and zeroes `Rift[1]`, `Rift[2]`):
//   it never advances by itself.
import type { RiftBonus, RiftQuestItem, RiftState, RiftTask, RiftTaskKind } from './rift-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);

/**
 * The Rift number the game shows for a stored `Rift[0]`: one more (M26 FR-4). The one place the offset
 * lives; the engine re-exports it, and every player string gets its Rift number from it.
 */
export const riftLabel = (level: number): number => level + 1;

/** The Rift's last real level: `riftInfo` rows 65..69 read "you cannot progress further". */
export const RIFT_MAX_LEVEL = 65;
/** How many levels the "Coming up" strip shows after the current one. */
export const RIFT_UPCOMING = 10;
/** The raw AFK target of The Rift (Toolbox `character.ts` `riftAll`). */
export const RIFT_AFK_TARGET = 'riftAll';

/**
 * The elite each score task is played on, and the classes that count as it: the elite and what it
 * promotes to (Toolbox `classPromotions.json`: Divine Knight -> Royal Guardian, Elemental Sorcerer ->
 * Spiritual Monk; Siege Breaker promotes to nothing). A later class keeps its elite's talents.
 */
export const RIFT_SCORE_ELITES: Readonly<Record<string, readonly string[]>> = {
  Divine_Knight: ['Divine_Knight', 'Royal_Guardian'],
  Siege_Breaker: ['Siege_Breaker'],
  Elemental_Sorcerer: ['Elemental_Sorcerer', 'Spiritual_Monk'],
};

/** "KILL_200000_MONSTERS_WHILE_AFK._YOU'VE_KILLED_{_SO_FAR..." -> its task clause, before "._". */
const clause = (task: string) => task.split('._')[0] ?? task;

/** A level's task from its `riftInfo` row. */
export function riftTaskOf(level: number, row: unknown): RiftTask | null {
  if (!isDict(row)) return null;
  const raw = str(row.task);
  if (raw === null) return null;
  const text = clause(raw);
  const monster = str(row.monsterName) ?? '';
  const n = /(\d+)/.exec(text);
  const quota = n ? Number(n[1]) : null;
  let kind: RiftTaskKind;
  let elite: string | null = null;
  if (/CANNOT_PROGRESS/.test(text)) kind = 'end';
  else if (/WHILE_AFK/.test(text)) kind = 'afk';
  else {
    elite = Object.keys(RIFT_SCORE_ELITES).find((e) => text.endsWith(`_ON_YOUR_${e.toUpperCase()}`)) ?? null;
    if (elite) kind = 'score';
    else if (/_ON_\d+_CHAR/.test(text)) kind = 'characters';
    else kind = 'active';
  }
  // The character tasks name their count after the feat ("ON_4_CHARS"): that count is the quota.
  const chars = /_ON_(\d+)_CHAR/.exec(text);
  return {
    level,
    kind,
    quota: kind === 'end' ? null : kind === 'characters' && chars ? Number(chars[1]) : quota,
    elite,
    text,
    monster,
    icon: str(row.icon) ?? '',
  };
}

export interface RiftInputs {
  account: Dict;
  characters: unknown[];
  data: Dict;
}

/** The Rift Ripper's quest in Toolbox `account.quests` (worlds -> NPCs -> `npcQuests`). */
function ripperQuest(quests: unknown): Dict | null {
  if (!isDict(quests)) return null;
  for (const world of Object.values(quests))
    for (const npc of list(world))
      for (const q of isDict(npc) ? list(npc.npcQuests) : [])
        if (isDict(q) && q.QuestName === 'Rift_Ripper1') return q;
  return null;
}

class Unreadable extends Error {}

/** `account.rift`; throws when Toolbox's Rift is missing or unreadable (the caller marks it unknown). */
export function readRift(input: RiftInputs): RiftState {
  const rift = input.account.rift;
  if (!isDict(rift) || !Array.isArray(rift.list)) throw new Unreadable();
  const level = finite(rift.currentRift);
  if (level === null) throw new Unreadable();
  const progress = finite(rift.currentProgress) ?? 0;
  const rows = rift.list;
  const task = riftTaskOf(level, rows[level]);
  const upcoming: RiftTask[] = [];
  for (let l = level + 1; l <= Math.min(RIFT_MAX_LEVEL, level + RIFT_UPCOMING); l++) {
    const t = riftTaskOf(l, rows[l]);
    if (t && t.kind !== 'end') upcoming.push(t);
  }
  const bonuses = rows.flatMap((row, i): RiftBonus[] => {
    const name = isDict(row) ? str(row.riftBonus) : null;
    if (name === null || name === 'Rift_Guy') return [];
    return [{ name, level: i, unlocked: level >= i }];
  });
  const quest = ripperQuest(input.account.quests);
  const questItems = list(quest?.itemReq).flatMap((r): RiftQuestItem[] => {
    if (!isDict(r)) return [];
    const rawName = str(r.rawName);
    const amount = finite(r.amount);
    return rawName === null || amount === null ? [] : [{ rawName, name: str(r.name) ?? rawName, amount }];
  });
  const questDone = list(quest?.progress).some((p) => isDict(p) && p.status === 1);
  const counted = typeof rift.chars === 'string' ? rift.chars.split(',').filter((s) => s !== '').length : 0;
  const slots = input.characters.map((ch, i) => (isDict(ch) ? (finite(ch.playerId) ?? i) : i));
  const afkOnRift = slots.filter((i) => input.data[`AFKtarget_${i}`] === RIFT_AFK_TARGET);
  const elites: Record<string, number[]> = {};
  for (const [elite, classes] of Object.entries(RIFT_SCORE_ELITES))
    elites[elite] = input.characters.flatMap((ch, i) =>
      isDict(ch) && typeof ch.class === 'string' && classes.includes(ch.class) ? [slots[i] as number] : [],
    );
  return {
    unlocked: questDone || level > 0 || progress > 0,
    questItems,
    level,
    progress,
    complete: task?.quota != null && progress >= task.quota,
    countedChars: counted,
    afkOnRift,
    task,
    upcoming,
    bonuses,
    elites,
  };
}
