// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F2 Parallel Slots (docs/specs/M20-skills-parallel-slots.md FR-17 to FR-32): the slot Goals (who fills
// each free slot), the slot pips per character, and the System page pictures for Construction, Worship,
// Trapping and Alchemy. Pure: a function of the Account State, the Knowledge Base, M2's result, `now`
// and the Expected Return.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { STAGES, type StageId } from '@idleon-forge/knowledge';
import type { ModuleGoal } from '../core/module';
import type { MetaPathResult } from '../metapath/types';
import type { GoalDetail } from '../result';
import { amount, ENTRY, FACT, goalOf, type M20Knowledge, numberValue, rowsOf, say, who } from './kb';
import type { SlotKind, SlotPip, StationId, SystemPicture } from './types';

const W3_EARLY = STAGES.indexOf('W3-early');
const SHELF_SIZE = 12;
export const CAULDRONS = ['Power', 'Quicc', 'High-IQ', 'Kazam'] as const;
export const LIQUIDS = ['Water Droplets', 'Liquid Nitrogen', 'Trench Seawater', 'Toxic Mercury'] as const;
const STATIONS: StationId[] = [
  'power',
  'quicc',
  'high-iq',
  'kazam',
  'water',
  'nitrogen',
  'trench',
  'mercury',
];
const TRAP_SET_PREFIX = 'TrapBoxSet';

export interface SlotsBuilt {
  /** In fill order (FR-29), capped: at most `maxGoals`, the last carrying "Also free" details. */
  goals: ModuleGoal[];
  /** Every slot Goal that fired, uncapped, in fill order (for pips, pictures and the Skill Grid). */
  fired: {
    entryId: string;
    key: string;
    targets: { index: number; skill: string }[];
    /** The free square a seat Goal fills first. */
    square?: number;
    /** The liquid (0–3) a liquid Goal staffs. */
    liquid?: number;
  }[];
  pips: Map<number, SlotPip[]>;
  pictures: SystemPicture[];
}

/** Whether the account is at or past W3-early and inside coverage (FR-19). */
export function slotsOpen(meta: MetaPathResult | null): boolean {
  const id = meta?.stage.id;
  if (!id || meta?.stage.coverage === 'beyond') return false;
  return STAGES.indexOf(id as StageId) >= W3_EARLY;
}

const activeRole = (meta: MetaPathResult | null, index: number, role: string) =>
  meta?.roles[index]?.some((r) => r.active && r.role === role) ?? false;
const ownsActive = (meta: MetaPathResult | null, index: number, owns: string) =>
  meta?.roles[index]?.some((r) => r.active && r.afkType === owns) ?? false;

function heldTrapSet(c: CharacterState): string | null {
  for (const k of Object.keys(c.inventoryItems ?? {}).sort())
    if (k.startsWith(TRAP_SET_PREFIX) && (c.inventoryItems?.[k] ?? 0) > 0) return k;
  return null;
}

interface Capacity {
  rawName: string;
  traps: number;
}

export function buildSlots(
  state: AccountState,
  kb: M20Knowledge,
  meta: MetaPathResult | null,
  now: number,
  expectedReturnMs: number,
): SlotsBuilt {
  const open = slotsOpen(meta);
  const chars = [...state.characters].sort((a, b) => a.index - b.index);
  const world = state.account.currentWorld ?? 0;
  const fired: SlotsBuilt['fired'] = [];
  const candidates: { entryId: string; goal: ModuleGoal; short: string }[] = [];

  // ---- the Cog Board seat (FR-20, FR-21) ----
  const board = state.account.cogBoard;
  const seatKey = `${ENTRY.seat}@account`;
  let seatSquares = new Map<number, number>();
  if (open && board && chars.every((c) => c.slots)) {
    const free = board.squares.flatMap((s, i) => (s === 'open' ? [i] : []));
    const notOnBoard = chars.filter((c) => c.slots?.cogPlace && c.slots.cogPlace.kind !== 'board');
    const ranked = [...notOnBoard].sort(
      (a, b) =>
        Number(
          activeRole(meta, b.index, 'construction-builder') ||
            activeRole(meta, b.index, 'construction-builder-2nd'),
        ) -
          Number(
            activeRole(meta, a.index, 'construction-builder') ||
              activeRole(meta, a.index, 'construction-builder-2nd'),
          ) ||
        (b.slots?.constructionSpeed ?? 0) - (a.slots?.constructionSpeed ?? 0) ||
        (b.slots?.constructionExpPerHour ?? 0) - (a.slots?.constructionExpPerHour ?? 0) ||
        a.index - b.index,
    );
    const seats = free
      .slice(0, ranked.length)
      .map((square, i) => ({ square, c: ranked[i] as CharacterState }));
    seatSquares = new Map(seats.map((s) => [s.c.index, s.square]));
    const onShelf = chars.filter((c) => c.slots?.cogPlace?.kind === 'shelf').length;
    const shelfRoom = Math.max(0, SHELF_SIZE - onShelf);
    const toShelf = chars
      .filter((c) => c.slots?.cogPlace?.kind === 'inventory' && !seatSquares.has(c.index))
      .slice(0, shelfRoom);
    const items = [
      ...toShelf.map((c) => ({ c, text: say(kb, ENTRY.seat, 'shelf', { who: who(c) }), why: 'why-shelf' })),
      ...seats.map((s) => ({
        c: s.c,
        text: say(kb, ENTRY.seat, 'seat', { who: who(s.c) }),
        why: 'why-seat',
      })),
    ];
    const first = items[0];
    if (first) {
      const details: GoalDetail[] = items.slice(1).map((x) => ({ subject: `c${x.c.index}`, text: x.text }));
      const goal = goalOf(kb, ENTRY.seat, seatKey, first.text, say(kb, ENTRY.seat, first.why), details, [
        'account.cogBoard',
        'characters[*].slots',
      ]);
      if (goal) {
        candidates.push({ entryId: ENTRY.seat, goal: { goal }, short: first.text });
        fired.push({
          entryId: ENTRY.seat,
          key: seatKey,
          targets: items.map((x) => ({ index: x.c.index, skill: 'construction' })),
          ...(seats[0] ? { square: seats[0].square } : {}),
        });
      }
    }
  }

  // ---- worship skulls (FR-22) ----
  const skullKey = `${ENTRY.skull}@account`;
  if (open && world >= 3 && chars.every((c) => c.slots)) {
    const without = chars
      .filter((c) => c.slots?.skull === null)
      .sort((a, b) => {
        const full = (c: CharacterState) =>
          c.afk?.worship && c.afk.worship.charge >= c.afk.worship.max ? 1 : 0;
        return full(b) - full(a) || a.index - b.index;
      });
    if (without.length > 0) {
      const max = Math.max(...without.map((c) => c.afk?.worship?.max ?? 50));
      const text =
        without.length === 1
          ? say(kb, ENTRY.skull, 'one', { who: who(without[0] as CharacterState) })
          : say(kb, ENTRY.skull, 'many', { n: without.length });
      const details: GoalDetail[] = without.map((c) => {
        const w = c.afk?.worship;
        const full = w && w.charge >= w.max;
        return {
          subject: `c${c.index}`,
          text: w
            ? say(kb, ENTRY.skull, full ? 'detail-full' : 'detail', {
                who: who(c),
                charge: w.charge,
                max: w.max,
              })
            : who(c),
        };
      });
      const goal = goalOf(kb, ENTRY.skull, skullKey, text, say(kb, ENTRY.skull, 'why', { max }), details, [
        'characters[*].slots',
        'characters[*].afk',
      ]);
      if (goal) {
        candidates.push({ entryId: ENTRY.skull, goal: { goal }, short: text });
        fired.push({
          entryId: ENTRY.skull,
          key: skullKey,
          targets: without.map((c) => ({ index: c.index, skill: 'worship' })),
        });
      }
    }
  }

  // ---- Trapping (FR-24, FR-25; V2: a trap set is the gate, the quest gives the first one) ----
  const started =
    chars.some((c) => c.slots?.trappingStarted === true || c.slots?.trapSet || heldTrapSet(c)) ||
    Object.keys(state.account.storageItems ?? {}).some(
      (k) => k.startsWith(TRAP_SET_PREFIX) && (state.account.storageItems?.[k] ?? 0) > 0,
    );
  const startKey = `${ENTRY.trapStart}@account`;
  const setKey = `${ENTRY.trapSet}@account`;
  const trapsKnown = chars.every((c) => c.slots && c.slots.trappingStarted !== null);
  if (open && world >= 3 && trapsKnown) {
    if (!started) {
      const text = say(kb, ENTRY.trapStart, 'text');
      const goal = goalOf(
        kb,
        ENTRY.trapStart,
        startKey,
        text,
        say(kb, ENTRY.trapStart, 'why'),
        [],
        ['characters[*].slots', 'characters[*].quests'],
      );
      if (goal) {
        candidates.push({
          entryId: ENTRY.trapStart,
          goal: { goal },
          short: say(kb, ENTRY.trapStart, 'short'),
        });
        fired.push({ entryId: ENTRY.trapStart, key: startKey, targets: [] });
      }
    } else {
      const need = chars.filter((c) => !c.slots?.trapSet);
      if (need.length > 0) {
        const text =
          need.length === 1
            ? say(kb, ENTRY.trapSet, 'one', { who: who(need[0] as CharacterState) })
            : say(kb, ENTRY.trapSet, 'many', { n: need.length });
        const details: GoalDetail[] = need.map((c) => ({
          subject: `c${c.index}`,
          text: say(kb, ENTRY.trapSet, heldTrapSet(c) ? 'held' : 'buy', { who: who(c) }),
        }));
        const goal = goalOf(kb, ENTRY.trapSet, setKey, text, say(kb, ENTRY.trapSet, 'why'), details, [
          'characters[*].slots',
          'characters[*].inventoryItems',
        ]);
        if (goal) {
          candidates.push({ entryId: ENTRY.trapSet, goal: { goal }, short: text });
          fired.push({
            entryId: ENTRY.trapSet,
            key: setKey,
            targets: need.map((c) => ({ index: c.index, skill: 'trapping' })),
          });
        }
      }
    }
  }

  // ---- the idle liquid (FR-27) ----
  const liquidKey = `${ENTRY.liquid}@account`;
  const liquids = state.account.liquids;
  const seats = chars.map((c) => ({ c, at: c.slots?.cauldron ?? null }));
  if (liquids && (state.account.currentWorld ?? 0) >= 2 && seats.every((s) => s.at !== null)) {
    const onLiquid = (i: number) => seats.some((s) => s.at === 4 + i);
    const idle = liquids.find((l) => l.unlocked && l.current < l.max / 2 && !onLiquid(l.index));
    const counts = [0, 1, 2, 3].map((k) => seats.filter((s) => s.at === k).length);
    const most = Math.max(...counts);
    if (idle && most >= 2) {
      const pool = seats
        .filter(
          (s) =>
            s.at !== null &&
            s.at < 4 &&
            counts[s.at] === most &&
            !ownsActive(meta, s.c.index, 'parallel:cauldron'),
        )
        .sort(
          (a, b) =>
            (a.c.skills?.alchemy?.level ?? 0) - (b.c.skills?.alchemy?.level ?? 0) ||
            (a.at as number) - (b.at as number) ||
            a.c.index - b.c.index,
        );
      const pick = pool[0];
      if (pick) {
        const slots = {
          who: who(pick.c),
          from: CAULDRONS[pick.at as number] ?? '',
          liquid: LIQUIDS[idle.index],
          current: amount(idle.current),
          max: idle.max,
        };
        const text = say(kb, ENTRY.liquid, 'text', slots);
        const goal = goalOf(
          kb,
          ENTRY.liquid,
          liquidKey,
          text,
          say(kb, ENTRY.liquid, 'why', slots),
          [],
          ['account.liquids', 'characters[*].slots'],
        );
        if (goal) {
          candidates.push({
            entryId: ENTRY.liquid,
            goal: { goal },
            short: say(kb, ENTRY.liquid, 'short', slots),
          });
          fired.push({
            entryId: ENTRY.liquid,
            key: liquidKey,
            targets: [{ index: pick.c.index, skill: 'alchemy' }],
            liquid: idle.index,
          });
        }
      }
    }
  }

  // ---- FR-29: at most `maxGoals`, the last shown one carrying the rest as "Also free" ----
  const maxGoals = numberValue(kb, ENTRY.fillOrder, 'maxGoals', 2);
  const shown = candidates.slice(0, maxGoals);
  const rest = candidates.slice(maxGoals);
  const last = shown[shown.length - 1];
  if (last && rest.length > 0) {
    const also = say(kb, ENTRY.fillOrder, 'also', { list: rest.map((r) => r.short).join('; ') });
    if (also)
      last.goal = {
        ...last.goal,
        goal: {
          ...last.goal.goal,
          details: [...(last.goal.goal.details ?? []), { subject: 'account', text: also }],
        },
      };
  }

  const goalsOut = shown.map((s) => s.goal);
  const shownKeys = new Set(goalsOut.map((g) => g.goal.nextAction.key));
  const linkOf = (entryId: string, index: number) => {
    const f = fired.find((x) => x.entryId === entryId && x.targets.some((t) => t.index === index));
    return f && shownKeys.has(f.key) ? f.key : null;
  };

  const pips = new Map(chars.map((c) => [c.index, pipsOf(state, c, open, started, linkOf)]));
  const pictures = picturesOf(state, kb, chars, fired, seatSquares, now, expectedReturnMs);
  return { goals: goalsOut, fired, pips, pictures };
}

function pipsOf(
  state: AccountState,
  c: CharacterState,
  open: boolean,
  trappingStarted: boolean,
  linkOf: (entryId: string, index: number) => string | null,
): SlotPip[] {
  const out: SlotPip[] = [];
  const pip = (kind: SlotKind, s: SlotPip['state'], text: string, linkKey: string | null = null) =>
    out.push({ kind, state: s, text, linkKey });
  const slots = c.slots;
  const w3 = 'Opens in W3';
  // Cog Board
  if (!open) pip('cog', 'locked', w3);
  else if (!slots) pip('cog', 'unknown', "can't tell");
  else if (!slots.cogPlace) pip('cog', 'unfillable', 'no player cog');
  else if (slots.cogPlace.kind === 'board') pip('cog', 'filled', 'builds on the Cog Board');
  else if (slots.cogPlace.kind === 'shelf')
    pip('cog', 'filled', 'on the shelf: makes cogs', linkOf(ENTRY.seat, c.index));
  else pip('cog', 'fillable', 'in the cog inventory: earns nothing', linkOf(ENTRY.seat, c.index));
  // Worship
  const w = c.afk?.worship;
  if (!open) pip('worship', 'locked', w3);
  else if (!w || !slots) pip('worship', 'unknown', "can't tell");
  else {
    const text =
      slots.skull === null
        ? `no skull (max ${Math.round(w.max)})`
        : `${Math.round(w.charge)} of ${Math.round(w.max)} charge`;
    pip(
      'worship',
      w.charge >= w.max ? 'capped' : 'filled',
      text,
      slots.skull === null ? linkOf(ENTRY.skull, c.index) : null,
    );
  }
  // Traps
  if (!open) pip('trap', 'locked', w3);
  else if (!slots) pip('trap', 'unknown', "can't tell");
  else if (!slots.trapSet)
    pip(
      'trap',
      'unfillable',
      trappingStarted ? 'needs a trap set' : "needs Lord of the Hunt's quest",
      trappingStarted ? linkOf(ENTRY.trapSet, c.index) : null,
    );
  else {
    const placed = c.afk?.traps?.placed.length ?? 0;
    pip(
      'trap',
      placed > 0 ? 'filled' : 'fillable',
      placed > 0 ? `${placed} traps placed` : 'no traps placed',
    );
  }
  // Cauldron
  const at = slots?.cauldron ?? null;
  if ((state.account.currentWorld ?? 0) < 2) pip('cauldron', 'locked', 'Opens in W2');
  else if (at === null) pip('cauldron', 'unknown', "can't tell");
  else if (at < 0) pip('cauldron', 'fillable', 'not brewing');
  else if (at < 4) pip('cauldron', 'filled', `brews (${CAULDRONS[at]})`);
  else if (at < 8) pip('cauldron', 'filled', `on ${LIQUIDS[at - 4]}`, linkOf(ENTRY.liquid, c.index));
  else pip('cauldron', 'filled', 'on a sigil');
  // 3D Printer (M14's facts; the plan is M14's)
  const pr = state.account.printer;
  if (!open) pip('printer', 'locked', w3);
  else if (!pr) pip('printer', 'unknown', "can't tell");
  else {
    const mine = pr.characters.find((x) => x.characterIndex === c.index);
    const order = [...state.characters]
      .sort((a, b) => a.index - b.index)
      .findIndex((x) => x.index === c.index);
    if (mine && mine.active.length > 0) pip('printer', 'filled', 'prints');
    else if (order >= pr.level) pip('printer', 'unfillable', `past the printer's level ${pr.level}`);
    else pip('printer', 'fillable', 'no sample printing');
  }
  return out;
}

function picturesOf(
  state: AccountState,
  kb: M20Knowledge,
  chars: CharacterState[],
  fired: SlotsBuilt['fired'],
  seatSquares: Map<number, number>,
  now: number,
  expectedReturnMs: number,
): SystemPicture[] {
  const out: SystemPicture[] = [];
  const keyOf = (entryId: string) => fired.find((f) => f.entryId === entryId)?.key ?? null;
  const seatKey = keyOf(ENTRY.seat);
  const board = state.account.cogBoard;
  if (board) {
    const where = new Map(board.characterAt.map((x) => [x.square, x.index]));
    const freeSquares = new Set(seatSquares.values());
    const best = [...chars].sort(
      (a, b) =>
        (b.skills?.construction?.level ?? 0) - (a.skills?.construction?.level ?? 0) || a.index - b.index,
    )[0];
    const gates =
      rowsOf<Record<string, { level: number; label: string }[]>>(kb, FACT.gates)?.construction ?? [];
    const lvl = best?.skills?.construction?.level ?? 0;
    const next = gates.find((g) => g.level > lvl) ?? null;
    out.push({
      systemId: 'construction',
      kind: 'cog-board',
      cols: 12,
      rows: 8,
      squares: board.squares.map((s, i) => {
        const ci = where.get(i);
        return {
          id: `square-${i}`,
          actionKey: freeSquares.has(i) ? seatKey : null,
          state: s,
          ...(ci !== undefined && s === 'character' ? { characterIndex: ci } : {}),
        };
      }),
      shelf: chars
        .filter((c) => c.slots?.cogPlace?.kind === 'shelf')
        .map((c) => ({
          id: `shelf-${c.index}`,
          actionKey: seatSquares.has(c.index) ? seatKey : null,
          index: c.index,
        })),
      inventory: chars
        .filter((c) => c.slots?.cogPlace?.kind === 'inventory')
        .map((c) => ({ id: `inventory-${c.index}`, actionKey: seatKey, index: c.index })),
      buildRate: board.buildRate,
      expRate: board.expRate,
      bestConstructor: best
        ? { index: best.index, level: lvl, nextTier: next ? { name: next.label, atLevel: next.level } : null }
        : null,
      note:
        !board.squares.includes('open') && !chars.some((c) => c.slots?.cogPlace?.kind === 'inventory')
          ? say(kb, ENTRY.seat, 'board-full')
          : null,
    });
  }

  const totems = state.account.totems;
  if (totems && chars.some((c) => c.afk?.worship)) {
    const skullKey = keyOf(ENTRY.skull);
    const usable = (t: { levelReq: number }) =>
      chars.filter((c) => (c.skills?.worship?.level ?? 0) >= t.levelReq).map((c) => c.index);
    const spendAt = (c: CharacterState): string | null => {
      const lv = c.skills?.worship?.level ?? 0;
      const t = [...totems]
        .filter((x) => x.levelReq <= lv && x.maxWave > 0)
        .sort((a, b) => b.expReward - a.expReward)[0];
      return t ? `${t.name.replace(/_/g, ' ')}, ${t.map.replace(/_/g, ' ')}` : null;
    };
    out.push({
      systemId: 'worship',
      kind: 'worship',
      tanks: chars.flatMap((c) => {
        const w = c.afk?.worship;
        if (!w) return [];
        const fullAt =
          w.charge >= w.max
            ? state.asOf
            : w.ratePerHour > 0
              ? state.asOf + ((w.max - w.charge) / w.ratePerHour) * 3_600_000
              : null;
        return [
          {
            id: `tank-${c.index}`,
            actionKey: c.slots?.skull === null ? skullKey : null,
            index: c.index,
            charge: w.charge,
            max: w.max,
            fullAt,
            skull: c.slots?.skull ?? null,
            spendAt: spendAt(c),
          },
        ];
      }),
      totems: totems.map((t, i) => ({
        id: `totem-${i}`,
        actionKey: null,
        name: t.name.replace(/_/g, ' '),
        map: t.map.replace(/_/g, ' '),
        levelReq: t.levelReq,
        maxWave: t.maxWave,
        usableBy: usable(t),
      })),
    });
  }

  if (chars.some((c) => c.slots)) {
    const caps = rowsOf<{ rawName: string; traps: number }[]>(kb, FACT.trapCapacity) ?? [];
    const trapKey = keyOf(ENTRY.trapSet) ?? keyOf(ENTRY.trapStart);
    out.push({
      systemId: 'trapping',
      kind: 'traps',
      returnAt: now + expectedReturnMs,
      rows: chars.map((c) => {
        const set = c.slots?.trapSet ?? null;
        return {
          id: `trap-${c.index}`,
          actionKey: set ? null : trapKey,
          index: c.index,
          started: c.slots?.trappingStarted === true,
          set: set
            ? ((caps.find((x) => x.rawName === set) as (Capacity & { name?: string }) | undefined)?.name ??
              set)
            : null,
          allowed: set ? (caps.find((x) => x.rawName === set)?.traps ?? null) : null,
          traps: (c.afk?.traps?.placed ?? []).map((t) => ({ critter: t.critter, endsAt: t.endsAt })),
        };
      }),
    });
  }

  const liquids = state.account.liquids;
  if (liquids && chars.some((c) => c.slots?.cauldron != null)) {
    const liquidKey = keyOf(ENTRY.liquid);
    const target = fired.find((f) => f.entryId === ENTRY.liquid);
    out.push({
      systemId: 'alchemy',
      kind: 'cauldron-seats',
      stations: STATIONS.map((station, i) => {
        const brewers = chars.filter((c) => c.slots?.cauldron === i).map((c) => c.index);
        const l = i >= 4 ? liquids[i - 4] : undefined;
        const movesHere = target?.liquid !== undefined && target.liquid === i - 4;
        return {
          id: `station-${station}`,
          actionKey: movesHere ? liquidKey : null,
          station,
          locked: i >= 4 ? !l?.unlocked : false,
          liquid: l ? { current: l.current, max: l.max } : null,
          brewers,
        };
      }),
      unassigned: chars.filter((c) => c.slots?.cauldron === -1).map((c) => c.index),
    });
  }
  return out;
}
