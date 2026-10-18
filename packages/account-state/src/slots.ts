// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 (docs/specs/M20-skills-parallel-slots.md TR-2): Toolbox output -> the skill, Parallel Slot and
// reset-item fields. Called from adapter.ts; like it, the only place that knows these Toolbox paths.
// Every field is null when its parser section, raw key or the worker's Toolbox call is missing.
// Player cogs carry character names; they are matched to indices here and never kept (TR-2 privacy).
import {
  type CharacterSlots,
  type CogBoardState,
  type CogSquare,
  type GuildTasksState,
  type KillroyClass,
  type KillroyState,
  type LiquidState,
  type PetTournamentState,
  type RandomEventsState,
  SKILL_IDS,
  type SkillId,
  type SkillState,
  type SlotsAccountFields,
  type TaskBoardDaily,
  type WorshipTotem,
} from './slots-types';
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

/** Toolbox `SPARE_START_INDEX`: save slots 96–107 are the Cog Shelf, 108–227 the cog inventory (F-d). */
export const COG_SHELF_START = 96;
export const COG_INVENTORY_START = 108;
export const COG_BOARD_SIZE = 96;
/** F-g: the four liquids open at the account's highest Alchemy level. */
export const LIQUID_UNLOCK_LEVELS = [1, 20, 35, 80] as const;
/** OLA indices M20 reads (F-a to F-c, FR-2, FR-16; resets dossier). */
export const OLA = {
  weeklyOffset: 39,
  skulls: 105,
  roomsDone: 113,
  randomEventDone: 137,
  weeklyBest: 189,
  raidReset: 190,
  serverWeek: 191,
  thirdRoom: 227,
  ballotWeek: 309,
  arcadePacks: 417,
  tournamentRegistered: 511,
} as const;
/** Random Events kept ahead of the save (TR-2). */
export const RANDOM_EVENT_WINDOW_MS = 48 * 3_600_000;

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

interface Calls {
  killroyWeeks(account: unknown, characters: unknown[], rooms: number): { classes: string[] }[];
  randomEventSchedule(account: unknown): { at: number; map: string; event: string; world: number }[];
}

export interface SlotsInputs {
  account: Dict;
  characters: unknown[];
  states: CharacterState[];
  withData: number[];
  failedSections: readonly string[];
  finishedWorlds: number[];
  calls: Calls | null;
  withFrozenClock: (<T>(now: number, f: () => T) => T) | null;
  asOf: number;
}

const round2 = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100);
/** The W1–W3 totems (Toolbox `getTotems` order); later ones are out of scope. */
export const W1_W3_TOTEMS = 4;

const KILLROY: readonly string[] = ['Beginner', 'Warrior', 'Archer', 'Mage'];

function readSkills(raw: Dict): Partial<Record<SkillId, SkillState>> | null {
  if (!isDict(raw.skillsInfo)) return null;
  const out: Partial<Record<SkillId, SkillState>> = {};
  for (const k of SKILL_IDS) {
    const s = raw.skillsInfo[k];
    if (!isDict(s)) continue;
    const level = finite(s.level);
    if (level === null) continue;
    // Whole EXP points: the tab shows progress, and M1 TR-16's size cap counts every digit.
    out[k] = { level, exp: Math.round(finite(s.exp) ?? 0), expReq: Math.round(finite(s.expReq) ?? 0) };
  }
  return out;
}

/** The tool of one type a character has equipped (rawName prefix), null when none. */
function toolOf(raw: Dict, prefix: string): string | null | undefined {
  if (!Array.isArray(raw.tools)) return undefined;
  for (const t of raw.tools) {
    const name = isDict(t) && typeof t.rawName === 'string' ? t.rawName : '';
    if (name.startsWith(prefix)) return name;
  }
  return null;
}

/** Player cog save slots -> character index, by the cog's name (`Player_<name>`). */
function playerCogs(account: Dict, states: CharacterState[]): Map<number, number> | null {
  const c = account.construction;
  if (!isDict(c) || !Array.isArray(c.baseBoard)) return null;
  const byName = new Map(states.map((s) => [`Player_${s.name}`, s.index]));
  const out = new Map<number, number>();
  c.baseBoard.forEach((sq, i) => {
    const name = isDict(sq) && isDict(sq.cog) ? sq.cog.name : null;
    const index = typeof name === 'string' ? byName.get(name) : undefined;
    if (index !== undefined) out.set(i, index);
  });
  for (const sp of Array.isArray(c.spareCogs) ? c.spareCogs : []) {
    if (!isDict(sp)) continue;
    const index = typeof sp.name === 'string' ? byName.get(sp.name) : undefined;
    const slot = finite(sp.originalIndex);
    if (index !== undefined && slot !== null) out.set(slot, index);
  }
  return out;
}

function readCogBoard(account: Dict, cogs: Map<number, number>): CogBoardState | null {
  const c = account.construction;
  if (!isDict(c) || !Array.isArray(c.baseBoard) || c.baseBoard.length < COG_BOARD_SIZE) return null;
  const squares: CogSquare[] = c.baseBoard.slice(0, COG_BOARD_SIZE).map((sq) => {
    if (!isDict(sq)) return 'locked';
    const cur = finite(sq.currentAmount) ?? 0;
    const req = finite(sq.requiredAmount) ?? Number.POSITIVE_INFINITY;
    if (cur < req) return 'locked';
    const name = isDict(sq.cog) && typeof sq.cog.name === 'string' ? sq.cog.name : '';
    if (name.startsWith('Player_')) return 'character';
    return name === '' || name === 'Blank' ? 'open' : 'cog';
  });
  const characterAt = [...cogs].sort(([a], [b]) => a - b).map(([square, index]) => ({ square, index }));
  return {
    squares,
    characterAt,
    buildRate: finite(c.totalBuildRate) ?? 0,
    expRate: finite(c.totalExpRate) ?? 0,
    flaggyRate: finite(c.totalFlaggyRate) ?? 0,
  };
}

function characterSlots(
  raw: Dict,
  st: CharacterState,
  account: Dict,
  cogs: Map<number, number> | null,
  failed: readonly string[],
): CharacterSlots {
  const place = cogs ? [...cogs].find(([, i]) => i === st.index)?.[0] : undefined;
  const cogPlace =
    place === undefined
      ? null
      : {
          kind:
            place < COG_SHELF_START
              ? ('board' as const)
              : place < COG_INVENTORY_START
                ? ('shelf' as const)
                : ('inventory' as const),
          slot: place,
        };
  const quests = isDict(raw.questComplete) ? raw.questComplete : null;
  const activities = isDict(account.alchemy) ? account.alchemy.activities : null;
  const act = Array.isArray(activities) ? activities[st.index] : undefined;
  const skull = toolOf(raw, 'WorshipSkull');
  const trap = toolOf(raw, 'TrapBoxSet');
  return {
    cogPlace,
    constructionSpeed: failed.includes('construction') ? null : round2(finite(raw.constructionSpeed)),
    constructionExpPerHour: failed.includes('construction')
      ? null
      : round2(finite(raw.constructionExpPerHour)),
    skull: skull === undefined ? null : skull,
    trapSet: trap === undefined ? null : trap,
    trappingStarted: quests ? quests.Lord_of_the_Hunt1 === 1 : null,
    cauldron: failed.includes('alchemy') ? null : isDict(act) ? finite(act.activity) : null,
  };
}

function readLiquids(account: Dict, bestAlchemy: number | null): LiquidState[] | null {
  const a = account.alchemy;
  if (!isDict(a) || !Array.isArray(a.liquids) || !Array.isArray(a.liquidCauldrons) || bestAlchemy === null)
    return null;
  const out: LiquidState[] = [];
  for (const i of [0, 1, 2, 3] as const) {
    const cur = finite(a.liquids[i]);
    const cap = a.liquidCauldrons[i];
    const max = isDict(cap) ? finite(cap.maxLiquid) : null;
    if (cur === null || max === null) return null;
    out.push({ index: i, unlocked: bestAlchemy >= LIQUID_UNLOCK_LEVELS[i], current: cur, max });
  }
  return out;
}

/** An OLA entry; one past the save's array is 0 (the game pads OptionsListAccount with zeros on load). */
const opt = (account: Dict, i: number): number | null => {
  const o = account.accountOptions;
  if (!Array.isArray(o)) return null;
  return i >= o.length ? 0 : finite(o[i]);
};

function readKillroy(i: SlotsInputs): KillroyState | null {
  const { account, characters, calls, withFrozenClock, asOf, finishedWorlds } = i;
  if (!calls || !withFrozenClock) return null;
  const done = opt(account, OLA.roomsDone);
  const skulls = opt(account, OLA.skulls);
  const packs = opt(account, OLA.arcadePacks);
  if (done === null || skulls === null || packs === null) return null;
  const third = opt(account, OLA.thirdRoom) === 1;
  const w3 = finishedWorlds.includes(3);
  const roomsOpen: 1 | 2 | 3 = w3 ? (third ? 3 : 2) : 1;
  const weeks = withFrozenClock(asOf, () => calls.killroyWeeks(account, characters, third ? 3 : 2));
  const cls = (w: { classes: string[] } | undefined): KillroyClass[] =>
    (w?.classes ?? [])
      .slice(0, roomsOpen)
      .map((c) => (KILLROY.includes(c) ? (c as KillroyClass) : 'Beginner'));
  const now = cls(weeks[0]);
  const next = cls(weeks[1]);
  if (now.length !== roomsOpen || next.length !== roomsOpen) return null;
  return { roomsOpen, doneCode: done, roomClasses: [now, next], skulls, arcadePacksBought: packs };
}

function readRandomEvents(i: SlotsInputs): RandomEventsState | null {
  const { account, calls, withFrozenClock, asOf } = i;
  const done = opt(i.account, OLA.randomEventDone);
  if (!calls || !withFrozenClock || done === null) return null;
  const schedule = withFrozenClock(asOf, () => calls.randomEventSchedule(account))
    .filter((e) => e.at + 3_600_000 > asOf && e.at < asOf + RANDOM_EVENT_WINDOW_MS)
    .map((e) => ({ at: e.at, map: e.map, event: e.event, world: e.world }));
  return { doneToday: done === 1, schedule };
}

function readTournament(account: Dict): PetTournamentState | null {
  const t = account.tournament;
  const through = opt(account, OLA.tournamentRegistered);
  if (!isDict(t) || through === null) return null;
  const day = finite(t.tournamentDay);
  if (day === null) return null;
  const global = isDict(t.global) ? t.global : {};
  const list =
    isDict(account.companions) && Array.isArray(account.companions.list) ? account.companions.list : [];
  return {
    registeredThroughDay: through,
    day,
    registrationClosed: global.C === true,
    petsOwned: list.filter((x) => isDict(x) && x.acquired === true).length,
  };
}

function readTaskDailies(account: Dict, characters: unknown[], withData: number[]): TaskBoardDaily[] | null {
  const tasks = account.tasks;
  if (!Array.isArray(tasks) || !Array.isArray(tasks[1])) return null;
  const desc = Array.isArray(account.tasksDescriptions) ? account.tasksDescriptions : [];
  const chars = withData.map((s) => characters[s]).filter(isDict);
  const dialog = (npc: string) =>
    chars.some((c) => isDict(c.npcDialog) && (finite(c.npcDialog[npc]) ?? 0) > 0);
  const quest = (q: string) => chars.some((c) => isDict(c.questComplete) && c.questComplete[q] === 1);
  const open = [dialog('Grasslands_Gary'), quest('Desert_Davey2'), quest('Iceland_Irwin1')];
  return ([1, 2, 3] as const).map((world) => {
    const row = tasks[1][world - 1];
    const ninth = Array.isArray(desc[world - 1]) ? desc[world - 1][8] : null;
    return {
      world,
      unlocked: open[world - 1] ?? false,
      taskName: isDict(ninth) && typeof ninth.name === 'string' ? ninth.name : '',
      done: Array.isArray(row) ? (finite(row[8]) ?? 0) >= 1 : false,
    };
  });
}

function readGuild(account: Dict): GuildTasksState | null {
  const g = account.guild;
  if (!isDict(g)) return null;
  // The guild id, or the guild name in OLA[37] (Toolbox's guild alert gate); neither is kept.
  const name = Array.isArray(account.accountOptions) ? account.accountOptions[37] : null;
  const member = (typeof g.id === 'string' && g.id !== '') || (typeof name === 'string' && name !== '');
  const tasks = isDict(g.guildTasks) ? g.guildTasks : {};
  const met = (list: unknown) =>
    (Array.isArray(list) ? list : []).filter(isDict).map((t) => ({
      met: (finite(t.progress) ?? 0) >= (finite(t.requirement) ?? Number.POSITIVE_INFINITY),
    }));
  return member
    ? { member, daily: met(tasks.daily), weekly: met(tasks.weekly) }
    : { member, daily: [], weekly: [] };
}

function readTotems(account: Dict): WorshipTotem[] | null {
  if (!Array.isArray(account.totems)) return null;
  return account.totems
    .slice(0, W1_W3_TOTEMS)
    .filter(isDict)
    .map((t) => ({
      name: typeof t.name === 'string' ? t.name : '',
      map: typeof t.map === 'string' ? t.map : '',
      levelReq: finite(t.skillReq) ?? 0,
      maxWave: finite(t.maxWave) ?? 0,
      expReward: Math.round(finite(t.expReward) ?? 0),
    }));
}

/** "All_your_characters_deal_}x_more_damage" with bonus 25 -> "All your characters deal 1.25x more damage". */
export function ballotText(template: string, bonus: number): string {
  const multi = Math.round((1 + bonus / 100) * 100) / 100;
  return template
    .replace(/\}/g, String(multi))
    .replace(/\{/g, String(Math.round(bonus * 100) / 100))
    .replace(/_/g, ' ')
    .trim();
}

function readBallot(account: Dict): SlotsAccountFields['ballot'] {
  const week = opt(account, OLA.ballotWeek);
  if (week === null) return null;
  const v = account.voteBallot;
  const sel = isDict(v) && isDict(v.selectedBonus) ? v.selectedBonus : null;
  const index = sel ? finite(sel.index) : null;
  const text = sel && typeof sel['0'] === 'string' ? ballotText(sel['0'], finite(sel.bonus) ?? 0) : null;
  return { votedWeek: week, winner: index !== null && text ? { index, text } : null };
}

/** The M20 account fields; also sets each character's `skills` and `slots` on `states`. */
export function readSlotFields(i: SlotsInputs, c: Collector): SlotsAccountFields {
  const { account, characters, states, withData, failedSections: failed } = i;
  const s = withData;
  const field = <T>(path: string, read: () => T | null, sections: string[] = []): T | null => {
    if (sections.some((x) => failed.includes(x)) || !c.checkRaw(path, path, null, s)) {
      c.unknown(path);
      return null;
    }
    const v = attempt(read);
    if (v === null) c.unknown(path);
    return v;
  };

  const cogs = failed.includes('construction') ? null : attempt(() => playerCogs(account, states));
  for (const st of states) {
    const raw = characters[st.index];
    const at = `characters[${st.index}]`;
    if (!isDict(raw)) continue;
    st.skills = c.checkRaw('characters[].skills', `${at}.skills`, st.index) ? readSkills(raw) : null;
    if (st.skills === null) c.unknown(`${at}.skills`);
    st.slots = c.checkRaw('characters[].slots', `${at}.slots`, st.index)
      ? attempt(() => characterSlots(raw, st, account, cogs, failed))
      : null;
    if (st.slots === null) c.unknown(`${at}.slots`);
  }
  const levels = states.map((st) => st.skills?.alchemy?.level ?? null);
  const bestAlchemy =
    levels.some((l) => l === null) || levels.length === 0 ? null : Math.max(...(levels as number[]));

  return {
    cogBoard: cogs
      ? field('account.cogBoard', () => readCogBoard(account, cogs), ['construction'])
      : unknownOf(c, 'account.cogBoard'),
    liquids: field('account.liquids', () => readLiquids(account, bestAlchemy), ['alchemy']),
    resets: field('account.resets', () =>
      Array.isArray(account.accountOptions)
        ? { weeklyOffsetDays: opt(account, OLA.weeklyOffset), serverWeekOfSave: opt(account, OLA.serverWeek) }
        : null,
    ),
    // Without the worker's Toolbox functions these two are not computed (null, like M3's facts).
    killroy: i.calls ? field('account.killroy', () => readKillroy(i), ['killroy']) : null,
    weeklyBattle: field('account.weeklyBattle', () => {
      const best = opt(account, OLA.weeklyBest);
      const reset = opt(account, OLA.raidReset);
      return best === null || reset === null
        ? null
        : { bestDifficulty: best, raidResetUsedToday: reset !== 0 };
    }),
    ballot: field('account.ballot', () => readBallot(account), ['voteBallot']),
    randomEvents: i.calls ? field('account.randomEvents', () => readRandomEvents(i)) : null,
    petTournament: field('account.petTournament', () => readTournament(account), [
      'tournament',
      'companions',
    ]),
    taskBoardDailies: field('account.taskBoardDailies', () => readTaskDailies(account, characters, s), [
      'tasks',
    ]),
    guildTasks: field('account.guildTasks', () => readGuild(account), ['guild']),
    totems: field('account.totems', () => readTotems(account), ['totems']),
  };
}

function unknownOf(c: Collector, path: string): null {
  c.unknown(path);
  return null;
}
