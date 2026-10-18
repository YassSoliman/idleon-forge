// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F1 (docs/specs/M20-skills-parallel-slots.md FR-2 to FR-7, FR-10, FR-16): each checklist row's state
// at `now`, from the save only (FR-14), with every clock projected (FR-3). One reader per row id of
// `checklist.fact.rows`; M6's rows read M6's Account State fields and never run M6's Detectors. Pure.
import type { AccountState, CharacterState, KillroyClass } from '@idleon-forge/account-state';
import { classTree, lookupOf } from '../metapath/knowledge';
import type { MetaPathResult } from '../metapath/types';
import { ENTRY, type M20Knowledge, say, who } from '../slots/kb';
import {
  accountWeekEnd,
  accountWeeksSinceSave,
  ballotWeekEnd,
  ballotWeekOf,
  DAY_MS,
  dailyResetAfter,
  resetsSinceSave,
  serverWeekEnd,
  serverWeekOf,
  WEEK_MS,
} from './clocks';
import type { ResetClock, RowBand, RowState } from './types';

export interface RowDef {
  id: string;
  band: RowBand;
  clock: ResetClock;
  label: string;
  system: string;
  entries: string[];
  effortSeconds: number;
  wiki: string;
}

/** What a reader says about one row. `gated` hides it behind "Opens later"; `hidden` leaves it out. */
export interface RowRead {
  state: RowState;
  details: string[];
  periodEnd: number | null;
  availableAt: number | null;
  resetSinceSave: boolean;
  /** For `banks` rows (FR-7): a banked item passes its 3-day cap before the return. */
  losesBanked?: boolean;
  manual?: { hint: string };
  /** The row's own one-line text, when it has slots ("Spend 6 Killroy skulls"). */
  text?: string;
}
export type RowResult = RowRead | { gated: string } | { hidden: true };

export interface RowCtx {
  state: AccountState;
  kb: M20Knowledge;
  meta: MetaPathResult | null;
  now: number;
  expectedReturnMs: number;
  /** Earlier saves, oldest first (M1 history). */
  history: readonly { lastCloudSave: number; state: AccountState }[];
}

const KEY_NAMES: Record<string, string> = {
  'forest-villa': 'Forest Villa',
  efaunt: "Efaunt's Tomb",
  chizoar: "Chizoar's Cavern",
};
const TICKET_NAMES = ['Typhoon', 'Centurion', 'Lonely Hunter'];
const BANK_DAYS = 3;
const unknown = (periodEnd: number | null = null): RowRead => ({
  state: 'unknown',
  details: [],
  periodEnd,
  availableAt: null,
  resetSinceSave: false,
});

/** FR-10: who runs a Killroy room of `cls`: the highest-level character of that class line, not the pusher unless alone. */
export function killroyRunner(
  state: AccountState,
  kb: M20Knowledge,
  meta: MetaPathResult | null,
  cls: KillroyClass,
): CharacterState | null {
  let isA: (c: string, a: string) => boolean;
  try {
    const t = classTree(lookupOf(kb));
    isA = (c, a) => t.isA(c, a);
  } catch {
    isA = (c, a) => c === a;
  }
  const fits = state.characters
    .filter((c) => isA(c.class, cls))
    .sort((a, b) => b.level - a.level || a.index - b.index);
  const pusher = meta?.pusher?.index ?? null;
  return fits.find((c) => c.index !== pusher) ?? fits[0] ?? null;
}

/** OLA[113] per-digit (F-c): room r is done when the code's digits contain r. */
export const killroyRoomDone = (code: number, room: number) =>
  String(Math.trunc(code)).includes(String(room));

export function readRow(def: RowDef, x: RowCtx): RowResult {
  const { state, now, expectedReturnMs: er } = x;
  const a = state.account;
  const world = a.currentWorld ?? 0;
  const daily = dailyResetAfter(state, now);
  const resets = resetsSinceSave(state, now);
  const rolled = (resets ?? 0) >= 1;
  const dailyRead = (done: boolean | null, details: string[] = [], extra: Partial<RowRead> = {}): RowRead =>
    done === null
      ? unknown(daily)
      : {
          state: done && !rolled ? 'done' : 'todo',
          details,
          periodEnd: daily,
          availableAt: null,
          resetSinceSave: rolled,
          ...extra,
        };

  switch (def.id) {
    case 'pet-pull': {
      const p = a.pets;
      if (!p) return p === null || p === undefined ? { hidden: true } : unknown();
      const readyAt = p.freeClaimAnchor + 594_000_000;
      return readyAt <= now
        ? { state: 'todo', details: [], periodEnd: null, availableAt: null, resetSinceSave: false }
        : { state: 'waiting', details: [], periodEnd: null, availableAt: readyAt, resetSinceSave: false };
    }
    case 'pet-mart': {
      const pm = a.petMart;
      if (pm === null || pm === undefined) return unknown();
      if (!pm.unlocked || !pm.gemsOffered || pm.currentShopDay < 1) return { hidden: true };
      const done = pm.lastClaimedShopDay >= pm.currentShopDay;
      return {
        state: done ? 'done' : 'todo',
        details: [],
        periodEnd: null,
        availableAt: null,
        resetSinceSave: false,
      };
    }
    case 'pet-tournament': {
      const t = a.petTournament;
      if (t === null || t === undefined) return unknown();
      if (t.petsOwned < 1) return { gated: 'Pet Tournament: own a pet' };
      const done = t.registeredThroughDay > t.day;
      if (!done && t.registrationClosed)
        return {
          state: 'waiting',
          details: [say(x.kb, ENTRY.tournament, 'closed')],
          periodEnd: null,
          availableAt: null,
          resetSinceSave: false,
        };
      return {
        state: done ? 'done' : 'todo',
        details: [],
        periodEnd: null,
        availableAt: null,
        resetSinceSave: false,
      };
    }
    case 'random-event': {
      const r = a.randomEvents;
      if (!r) return unknown(daily);
      if (r.doneToday && !rolled)
        return { state: 'done', details: [], periodEnd: daily, availableAt: null, resetSinceSave: false };
      const reachable = r.schedule.filter((e) => e.world >= 1 && e.world <= Math.max(1, world));
      const live = reachable.find((e) => e.at <= now && now < e.at + 3_600_000);
      const next = reachable.find((e) => e.at > now);
      const human = (s: string) => s.replace(/_/g, ' ');
      if (live)
        return {
          state: 'todo',
          details: [say(x.kb, ENTRY.randomEvent, 'live', { map: human(live.map), event: human(live.event) })],
          periodEnd: daily,
          availableAt: null,
          resetSinceSave: rolled,
        };
      return {
        state: 'waiting',
        details: [
          next
            ? say(x.kb, ENTRY.randomEvent, 'next', { map: human(next.map), event: human(next.event) })
            : say(x.kb, ENTRY.randomEvent, 'none'),
        ],
        periodEnd: daily,
        availableAt: next?.at ?? null,
        resetSinceSave: rolled,
      };
    }
    case 'minigame-plays': {
      const m = a.minigames;
      if (!m) return unknown(daily);
      return dailyRead(m.plays === 0, rolled ? [] : [`${m.plays} ${m.plays === 1 ? 'play' : 'plays'} left`]);
    }
    case 'spiketrap': {
      const m = a.minigames;
      if (!m) return unknown(daily);
      return dailyRead(!m.spiketrap.gemsAvailableToday);
    }
    case 'vial-attempts': {
      if (world < 2) return { gated: 'Vial attempts: reach World 2' };
      const al = a.alchemy;
      if (!al) return unknown(daily);
      if (!al.vialAttemptsUsable && !rolled)
        return {
          state: 'cannot',
          details: ['no vial ingredient held'],
          periodEnd: daily,
          availableAt: null,
          resetSinceSave: false,
        };
      const left = rolled ? al.vialAttempts.max : al.vialAttempts.current;
      return dailyRead(left === 0, [`${left} of ${al.vialAttempts.max} left`]);
    }
    case 'liquid-shop-gem': {
      // M19 FR-16: done when today's count of One Measly Gem (and, from Trench Seawater, A Pair of Gems)
      // is at least 1 (CauldronInfo[10]; N.js resets it in the daily-reset block, V5).
      if (world < 2) return { gated: 'Liquid Shop gem: reach World 2' };
      const p = a.alchemyPlan;
      if (!p) return unknown(daily);
      const trench = a.liquids?.find((l) => l.index === 2)?.unlocked === true;
      const one = (p.liquidShopBought[3] ?? 0) >= 1;
      const pair = !trench || (p.liquidShopBought[12] ?? 0) >= 1;
      return dailyRead(one && pair, [trench ? '5 Water, and A Pair of Gems' : '5 Water']);
    }
    case 'post-office': {
      const po = a.postOffice;
      if (!po) return unknown(daily);
      if (!po.unlocked) return { gated: "Post Office orders: finish Postboy Pablob's quest" };
      return dailyRead(po.companiesNotDoneToday === 0, [
        `${po.companiesNotDoneToday} ${po.companiesNotDoneToday === 1 ? 'company' : 'companies'} without an order today`,
      ]);
    }
    case 'daily-tasks': {
      const tb = a.taskBoardDailies;
      if (!tb) return unknown(daily);
      const open = tb.filter((t) => t.unlocked);
      if (open.length === 0) return { gated: 'Daily tasks: talk to Grasslands Gary in W1 town' };
      const details = open.map(
        (t) =>
          `${say(x.kb, ENTRY.tasks, 'detail', { world: t.world, task: t.taskName.replace(/_/g, ' ') || 'daily task' })}${
            t.done && !rolled ? ' ✓' : ''
          }`,
      );
      return dailyRead(
        open.every((t) => t.done),
        details,
      );
    }
    case 'guild-daily':
    case 'guild-weekly': {
      const g = a.guildTasks;
      if (!g) return unknown();
      if (!g.member) return { gated: 'Guild tasks: join a guild' };
      const list = def.id === 'guild-daily' ? g.daily : g.weekly;
      const weekly = def.id === 'guild-weekly';
      const end = weekly ? accountWeekEnd(state, now) : daily;
      const since = weekly ? (accountWeeksSinceSave(state, now) ?? 0) : (resets ?? 0);
      const met = since > 0 ? 0 : list.filter((t) => t.met).length;
      const entry = weekly ? ENTRY.guildWeekly : ENTRY.guildDaily;
      return {
        state: 'todo',
        details: [],
        periodEnd: end,
        availableAt: null,
        resetSinceSave: since > 0,
        manual: { hint: say(x.kb, entry, 'hint', { met, total: list.length }) },
      };
    }
    case 'boss-keys':
    case 'tickets': {
      const isKeys = def.id === 'boss-keys';
      const raw = isKeys ? a.keys : a.colosseumTickets;
      if (!raw) return unknown(daily);
      const items = isKeys
        ? (a.keys ?? [])
            .filter((k) => k.perDay > 0)
            .map((k) => ({ name: KEY_NAMES[k.id] ?? k.name, days: k.daysSincePickup }))
        : (a.colosseumTickets ?? [])
            .filter((t) => t.reachable)
            .map((t) => ({ name: TICKET_NAMES[t.npc] ?? 'Colosseum', days: t.daysSincePickup }));
      if (items.length === 0) return { hidden: true };
      if (items.some((i) => i.days === null)) return unknown(daily);
      const atReturn = resetsSinceSave(state, now + er) ?? 0;
      // FR-5: one detail per item with something banked ("Typhoon: 3 days banked, 1 lost").
      const details = items.flatMap((i) => {
        const d = (i.days as number) + (resets ?? 0);
        if (d < 1) return [];
        const lost = Math.max(0, d - BANK_DAYS);
        const kept = Math.min(d, BANK_DAYS);
        return [`${i.name}: ${kept} ${kept === 1 ? 'day' : 'days'} banked${lost ? `, ${lost} lost` : ''}`];
      });
      const anyBanked = items.some((i) => (i.days as number) + (resets ?? 0) >= 1);
      return {
        state: anyBanked ? 'todo' : 'done',
        details,
        periodEnd: daily,
        availableAt: null,
        resetSinceSave: rolled,
        losesBanked: items.some((i) => (i.days as number) + atReturn > BANK_DAYS),
      };
    }
    case 'killroy-rooms': {
      if (world < 2) return { gated: 'Killroy: reach World 2' };
      const k = a.killroy;
      if (!k) return unknown();
      const end = accountWeekEnd(state, now);
      const weeks = accountWeeksSinceSave(state, now) ?? 0;
      const classes = weeks === 0 ? k.roomClasses[0] : weeks === 1 ? k.roomClasses[1] : null;
      const details: string[] = [];
      let todo = 0;
      let cannot = 0;
      for (let r = 1; r <= k.roomsOpen; r++) {
        const cls = classes?.[r - 1] ?? null;
        if (weeks === 0 && killroyRoomDone(k.doneCode, r)) {
          details.push(say(x.kb, ENTRY.killroyRoom, 'room-done', { class: cls ?? `Room ${r}` }));
          continue;
        }
        if (!cls) {
          todo++;
          continue;
        }
        const runner = killroyRunner(state, x.kb, x.meta, cls);
        if (runner) {
          todo++;
          details.push(say(x.kb, ENTRY.killroyRoom, 'room', { class: cls, who: who(runner) }));
        } else {
          cannot++;
          details.push(say(x.kb, ENTRY.killroyRoom, 'room-cannot', { class: cls }));
        }
      }
      const s: RowState = todo > 0 ? 'todo' : cannot > 0 ? 'cannot' : 'done';
      return { state: s, details, periodEnd: end, availableAt: null, resetSinceSave: weeks > 0 };
    }
    case 'killroy-skulls': {
      if (world < 2) return { hidden: true };
      const k = a.killroy;
      if (!k) return { hidden: true };
      const end = accountWeekEnd(state, now);
      const weeks = accountWeeksSinceSave(state, now) ?? 0;
      if (weeks > 0) return { hidden: true };
      if (k.skulls > 0) {
        const left = Math.max(0, 50 - k.arcadePacksBought);
        return {
          state: 'todo',
          details: left > 0 ? [say(x.kb, ENTRY.killroySkulls, 'packs', { left })] : [],
          periodEnd: end,
          availableAt: null,
          resetSinceSave: false,
          text: say(x.kb, ENTRY.killroySkulls, 'row', { n: k.skulls }),
        };
      }
      // Spent this week: the row stays done until the week ends, when an earlier save this week had skulls.
      const start = end === null ? null : end - WEEK_MS;
      const had = x.history.some(
        (h) => start !== null && h.lastCloudSave > start && (h.state.account.killroy?.skulls ?? 0) > 0,
      );
      return had
        ? {
            state: 'done',
            details: [],
            periodEnd: end,
            availableAt: null,
            resetSinceSave: false,
            text: say(x.kb, ENTRY.killroySkulls, 'row-done'),
          }
        : { hidden: true };
    }
    case 'weekly-battle': {
      if (world < 2) return { gated: 'Weekly Battle: reach World 2' };
      const wb = a.weeklyBattle;
      const savedWeek = a.resets?.serverWeekOfSave ?? null;
      if (!wb || savedWeek === null) return unknown(serverWeekEnd(now));
      const thisWeek = savedWeek === serverWeekOf(now);
      const best = thisWeek ? wb.bestDifficulty : 0;
      const details = [say(x.kb, ENTRY.weeklyBattle, 'best', { best })];
      if (best < 5 && best > 0) details.push(say(x.kb, ENTRY.weeklyBattle, 'retry'));
      return {
        state: best >= 1 ? 'done' : 'todo',
        details,
        periodEnd: serverWeekEnd(now),
        availableAt: null,
        resetSinceSave: !thisWeek,
      };
    }
    case 'ballot': {
      if (world < 2) return { gated: 'Bonus Ballot: reach World 2' };
      const b = a.ballot;
      if (!b) return unknown(ballotWeekEnd(now));
      const saved = a.lastCloudSave ?? now;
      return {
        state: b.votedWeek === ballotWeekOf(now) ? 'done' : 'todo',
        details: b.winner ? [say(x.kb, ENTRY.ballot, 'leading', { bonus: b.winner.text })] : [],
        periodEnd: ballotWeekEnd(now),
        availableAt: null,
        resetSinceSave: ballotWeekOf(saved) !== ballotWeekOf(now),
      };
    }
    default:
      return { hidden: true };
  }
}

/** The length of a row's period, for "done at" (FR-14); null for clocks with no fixed period. */
export function periodLength(clock: ResetClock): number | null {
  return clock === 'daily'
    ? DAY_MS
    : clock === 'account-week' || clock === 'server-week' || clock === 'ballot-week'
      ? WEEK_MS
      : null;
}
