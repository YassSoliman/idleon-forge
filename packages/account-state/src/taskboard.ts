// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-26, the Task Board: Toolbox `tasksDescriptions[w][i]` (stat, level, breakpoints, x, filler2)
// for the 8 ranked tasks and the daily of Worlds 1-4 -> `account.taskBoard`. A tier is ready when the
// stat reaches its breakpoint; a claim at level L pays `1 + floor(L/5)` merits and `floor(x + w*L)` task
// points for world w (dossier M1, C1-C3: Toolbox tasks.ts#L12, the client's rank-up). Boards open with
// Grasslands Gary (W1), Desert Davey's quest (W2), Iceland Irwin's (W3) and Nebula Neddy's (W4).
import type { TaskBoardState, TaskBoardTask, TaskBoardWorld } from './gaps-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Merits a claim at level L pays (Toolbox `meritReward`). */
export const meritsAt = (level: number) => 1 + Math.floor(level / 5);
/** Task points a claim at level L pays on world w (1-based): `floor(x + w*L)`. */
export const pointsAt = (x: number, world: number, level: number) => Math.floor(x + world * level);

function task(t: Dict, index: number, world: number): TaskBoardTask | null {
  if (typeof t.name !== 'string') return null;
  const level = finite(t.level) ?? 0;
  const stat = finite(t.stat) ?? 0;
  const breakpoints = list(t.breakpoints).map((b) => finite(b) ?? Number.POSITIVE_INFINITY);
  const maxLevel = finite(t.maxLevel) ?? breakpoints.length;
  const x = finite(t.x) ?? 0;
  const flags = typeof t.filler2 === 'string' ? t.filler2.split('|') : [];
  const resetsOnClaim = flags[1] === '1';
  let ready = 0;
  let merits = 0;
  let points = 0;
  // A reset-on-claim task zeroes its progress when claimed, so at most one tier is ever waiting.
  const last = resetsOnClaim ? Math.min(maxLevel, level + 1) : maxLevel;
  for (let l = level; l < last && stat >= (breakpoints[l] ?? Number.POSITIVE_INFINITY); l++) {
    ready++;
    merits += meritsAt(l);
    points += pointsAt(x, world, l);
  }
  return {
    index,
    name: t.name,
    stat,
    level,
    maxLevel,
    next: level < maxLevel ? (breakpoints[level] ?? null) : null,
    ready,
    merits,
    points,
    resetsOnClaim,
  };
}

export function readTaskBoard(account: Dict, characters: readonly unknown[]): TaskBoardState | null {
  const desc = account.tasksDescriptions;
  if (!Array.isArray(desc)) return null;
  const chars = characters.filter(isDict);
  const dialog = (npc: string) =>
    chars.some((c) => isDict(c.npcDialog) && (finite(c.npcDialog[npc]) ?? 0) > 0);
  const quest = (q: string) => chars.some((c) => isDict(c.questComplete) && c.questComplete[q] === 1);
  const open = [
    dialog('Grasslands_Gary'),
    quest('Desert_Davey2'),
    quest('Iceland_Irwin1'),
    quest('Nebula_Neddy1'),
  ];
  const worlds: TaskBoardWorld[] = ([1, 2, 3, 4] as const).map((world) => {
    const rows = list(desc[world - 1]);
    const tasks = rows
      .slice(0, 8)
      .flatMap((t, i) => (isDict(t) ? [task(t, i, world)] : []))
      .filter((t): t is TaskBoardTask => t !== null);
    const daily = rows[8];
    return {
      world,
      open: open[world - 1] ?? false,
      tasks,
      daily:
        isDict(daily) && typeof daily.name === 'string'
          ? { name: daily.name, done: (finite(daily.level) ?? 0) >= 1 }
          : null,
    };
  });
  const meritText = list(account.meritsDescriptions)
    .slice(0, 4)
    .map((w) =>
      list(w).map((m) =>
        isDict(m) && typeof m.description === 'string'
          ? `${m.description} ${typeof m.descLine2 === 'string' && !/^(Blank|Descline2)$/i.test(m.descLine2) ? m.descLine2 : ''}`
              .replace(/_/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
          : '',
      ),
    );
  const tu = isDict(account.taskUnlocks) ? account.taskUnlocks : {};
  return {
    worlds,
    unlockPoints: {
      owned: finite(tu.unlockPointsOwned) ?? 0,
      bought: finite(tu.unlockedRecipes) ?? 0,
      progress: finite(tu.currentPoints) ?? 0,
      nextAt: finite(tu.pointsReq) ?? 0,
    },
    meritText,
  };
}
