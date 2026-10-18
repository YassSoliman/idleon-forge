// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 F2 (docs/specs/M18-gear-tools.md FR-1 to FR-6, FR-11, FR-12): who can wear what, when one item is
// better than another without a formula (dominance), each slot's Gear Plan target and state, and the
// hand-out of held gear. Pure: no clock, no randomness, no I/O.
import {
  type AccountState,
  type CharacterState,
  GEAR_TYPES,
  type GearItem,
  type GearSlotId,
  type HeldGear,
  type WornSlot,
} from '@idleon-forge/account-state';
import { STAGES, type StageId } from '@idleon-forge/knowledge';
import type { GearFacts, Piece, PlanRow, SlotFamily } from './kb';

export type Family = 'WARRIOR' | 'ARCHER' | 'MAGE' | 'BEGINNER';
export type MainStat = 'str' | 'agi' | 'wis' | 'luk';

export const ARMOUR: readonly GearSlotId[] = ['helmet', 'shirt', 'pants', 'shoes'];
export const TOOLS: readonly GearSlotId[] = ['pickaxe', 'hatchet', 'rod', 'net'];
/** FR-6's slot order for hand-outs (the AFK tool comes last, added per character). */
export const HANDOUT_ORDER: readonly GearSlotId[] = [
  'weapon',
  'helmet',
  'shirt',
  'pants',
  'shoes',
  'pendant',
  'ring1',
  'ring2',
];
/** A gathering tool slot -> its skill (Toolbox `skillsInfo` key) and the AFK type that uses it. */
export const TOOL_SKILL: Readonly<
  Record<string, { skill: 'mining' | 'chopping' | 'fishing' | 'catching'; afk: string }>
> = {
  pickaxe: { skill: 'mining', afk: 'MINING' },
  hatchet: { skill: 'chopping', afk: 'CHOPPIN' },
  rod: { skill: 'fishing', afk: 'FISHING' },
  net: { skill: 'catching', afk: 'CATCHING' },
};

export const familyOfSlot = (slot: GearSlotId): SlotFamily =>
  slot === 'ring1' || slot === 'ring2' ? 'ring' : (slot as SlotFamily);

/** FR-2: M2's class tree line -> the item Class family; null for a class the tree doesn't know. */
export function familyOf(facts: GearFacts, c: Pick<CharacterState, 'class'>): Family | null {
  if (!facts.lines.has(c.class)) return null;
  const line = facts.lines.get(c.class);
  return line === 'Warrior'
    ? 'WARRIOR'
    : line === 'Archer'
      ? 'ARCHER'
      : line === 'Mage'
        ? 'MAGE'
        : 'BEGINNER';
}

export const MAIN_STAT: Readonly<Record<Family, MainStat>> = {
  WARRIOR: 'str',
  ARCHER: 'agi',
  MAGE: 'wis',
  BEGINNER: 'luk',
};

/** The AFK tool slot of a character AFK on a gathering skill, else null. */
export function afkToolSlot(c: Pick<CharacterState, 'afkType'>): GearSlotId | null {
  for (const [slot, t] of Object.entries(TOOL_SKILL)) if (t.afk === c.afkType) return slot as GearSlotId;
  return null;
}

/** The level that gates wearing an item in this slot: the class level, or the tool's skill level (F-b). */
export function gateLevel(c: CharacterState, slot: GearSlotId): number | null {
  const t = TOOL_SKILL[slot];
  if (!t) return c.level;
  const v = c.skillLevels?.[t.skill];
  return typeof v === 'number' ? v : null;
}

/**
 * The next tool tier to work toward, shared by the Now tab's tool line and the Gear tab's ladder (R9 QA
 * P2-2): the best tier above the worn one that the skill level allows (else the next level gate). With
 * no tool worn, it steps down through the tier each recipe consumes to the one that can be crafted from
 * scratch: a Gold Fishing Rod's recipe takes an Iron Fishing Rod, so with no rod the next rod is Iron.
 * `tiers` is the tool's ladder, lowest first.
 */
export function nextToolTier<T extends Pick<Piece, 'rawName' | 'lvReq' | 'consumes'>>(
  tiers: readonly T[],
  worn: { rawName: string; lvReq: number } | null,
  level: number,
): T | null {
  const above = tiers.filter((t) => t.lvReq > (worn?.lvReq ?? 0) && t.rawName !== worn?.rawName);
  let next = above.filter((t) => t.lvReq <= level).at(-1) ?? above.find((t) => t.lvReq > level) ?? null;
  for (let guard = 0; next && !worn && guard < tiers.length; guard++) {
    const prev = next.consumes.map((q) => above.find((t) => t.rawName === q.rawName)).find(Boolean);
    if (!prev) break;
    next = prev;
  }
  return next;
}

export interface Stats {
  cls: string;
  lvReq: number;
  def: number;
  wp: number;
  str: number;
  agi: number;
  wis: number;
  luk: number;
  pct: Array<{ txt: string; val: number }>;
}

/** FR-2: its Class is ALL or the character's family, and its level gate is met. */
export function wearable(
  item: Pick<Stats, 'cls' | 'lvReq'>,
  c: CharacterState,
  family: Family,
  slot: GearSlotId,
): boolean {
  if (item.cls !== 'ALL' && item.cls !== family) return false;
  const lv = gateLevel(c, slot);
  return lv !== null && item.lvReq <= lv;
}

/** Defence for armour, Weapon Power for weapons and tools (pendants and rings use both, FR-3). */
export const primaryOf = (s: Pick<Stats, 'def' | 'wp'>, slot: GearSlotId): number => {
  const f = familyOfSlot(slot);
  return f === 'weapon' || TOOL_SKILL[f] ? s.wp : s.def;
};

/**
 * FR-3: X is better than E when E is empty, or X dominates E: at least as much of the slot's primary
 * stat (pendants and rings: Defence and Weapon Power, each on its own) and of the main stat, every % line
 * E has at the same value or more, and strictly more of one of those stats. A trade is never better.
 */
export function better(x: Stats, e: Stats | null, slot: GearSlotId, main: MainStat): boolean {
  if (e === null) return true;
  const f = familyOfSlot(slot);
  const pctOk = e.pct.every((p) => x.pct.some((q) => q.txt === p.txt && q.val >= p.val));
  if (!pctOk) return false;
  const pairs: Array<[number, number]> =
    f === 'pendant' || f === 'ring'
      ? [
          [x.def, e.def],
          [x.wp, e.wp],
          [x[main], e[main]],
        ]
      : [
          [primaryOf(x, slot), primaryOf(e, slot)],
          [x[main], e[main]],
        ];
  return pairs.every(([a, b]) => a >= b) && pairs.some(([a, b]) => a > b);
}

/** The account's Stage for the Gear Plan: M2's, or the start of the current world without one. */
export function planStage(stageId: string | null | undefined, currentWorld: number | null): StageId | null {
  if (stageId && (STAGES as readonly string[]).includes(stageId)) return stageId as StageId;
  if (currentWorld === null) return null;
  return currentWorld >= 4 ? 'W4-entry' : (`W${Math.max(1, currentWorld)}-early` as StageId);
}
export const reached = (stage: StageId, from: StageId) => STAGES.indexOf(stage) >= STAGES.indexOf(from);

const TOOL_WORLD: Readonly<Record<string, StageId>> = {
  COPPER_SET: 'W1-early',
  IRON_SET: 'W1-early',
  GOLD_SET: 'W2-early',
  PLATINUM_SET: 'W2-early',
  DEMENTIA_SET: 'W3-early',
  VOID_SET: 'W3-early',
};

/** The Gear Plan rows of a slot family for a class family, in order (FR-11; tools from the ladder). */
export function planRows(facts: GearFacts, slot: SlotFamily, family: Family): PlanRow[] {
  if (TOOL_SKILL[slot]) {
    return [...facts.ladder.values()]
      .filter((p) => p.slot === slot && p.set && TOOL_WORLD[p.set])
      .sort((a, b) => a.lvReq - b.lvReq || (a.rawName < b.rawName ? -1 : 1))
      .map((p) => ({
        slot,
        from: TOOL_WORLD[p.set as string] as StageId,
        piece: p.rawName,
        cite: 8,
        confidence: 'M' as const,
      }));
  }
  return facts.plan.filter((r) => r.slot === slot && (slot !== 'weapon' || r.family === family));
}

/** A recipe's state (F-c): -1 locked, 0 available, 1 crafted; null when unknown or not an anvil recipe. */
export function recipeState(state: AccountState, facts: GearFacts, rawName: string): number | null {
  const r = facts.recipes.get(rawName);
  const tab = r ? state.account.anvilRecipes?.[r.tab - 1] : undefined;
  const v = r && tab ? tab[r.n - 1] : undefined;
  return typeof v === 'number' ? v : null;
}

export interface Target {
  piece: Piece;
  /** Index of the row in this character's plan list for the slot. */
  index: number;
  row: PlanRow;
}

/** FR-11: the latest reached row whose piece the character can wear; null when none. */
export function targetOf(
  state: AccountState,
  facts: GearFacts,
  stage: StageId,
  c: CharacterState,
  family: Family,
  slot: GearSlotId,
): Target | null {
  const rows = planRows(facts, familyOfSlot(slot), family);
  let best: Target | null = null;
  rows.forEach((row, index) => {
    const piece = facts.ladder.get(row.piece);
    if (!piece || !reached(stage, row.from) || !wearable(piece, c, family, slot)) return;
    if (row.needsRecipe && (recipeState(state, facts, row.piece) ?? -1) < 0) return;
    best = { piece, index, row };
  });
  return best;
}

export interface SlotJudgement {
  slot: GearSlotId;
  item: GearItem | null;
  unknown: boolean;
  /** Before the hand-out. */
  state: 'empty' | 'ok' | 'behind' | 'unknown';
  target: Target | null;
  levelsBehind: number | null;
  /** Gear Plan tiers between the worn piece and the target, for a behind slot with no level gap (R9 QA). */
  tiersBehind: number | null;
  /** The worn item is off the Gear Plan and the target doesn't dominate it. */
  trade: boolean;
}

/** FR-4, FR-12: one slot's state before the hand-out. */
export function judgeSlot(
  state: AccountState,
  facts: GearFacts,
  stage: StageId | null,
  c: CharacterState,
  family: Family | null,
  worn: WornSlot,
): SlotJudgement {
  const base = {
    slot: worn.slot,
    item: worn.item,
    target: null,
    levelsBehind: null,
    tiersBehind: null,
    trade: false,
  };
  if (worn.unknown || family === null || stage === null || gateLevel(c, worn.slot) === null)
    return { ...base, unknown: true, state: 'unknown' };
  const target = targetOf(state, facts, stage, c, family, worn.slot);
  if (!worn.item) return { ...base, unknown: false, state: 'empty', target };
  if (!target) return { ...base, unknown: false, state: 'ok' };
  const rows = planRows(facts, familyOfSlot(worn.slot), family);
  const at = rows.findIndex((r) => r.piece === worn.item?.rawName);
  const gap = Math.max(0, target.piece.lvReq - worn.item.lvReq);
  if (at >= 0) {
    const behind = at < target.index && worn.item.rawName !== target.piece.rawName;
    return {
      ...base,
      unknown: false,
      state: behind ? 'behind' : 'ok',
      target,
      levelsBehind: behind ? gap : null,
      tiersBehind: behind ? target.index - at : null,
    };
  }
  const dominated = better(target.piece, worn.item, worn.slot, MAIN_STAT[family]);
  return {
    ...base,
    unknown: false,
    state: dominated ? 'behind' : 'ok',
    target,
    levelsBehind: dominated ? gap : null,
    tiersBehind: dominated ? 1 : null,
    trade: !dominated,
  };
}

export interface HandOut {
  index: number;
  slot: GearSlotId;
  item: HeldGear;
  place: HeldGear['places'][number]['place'];
  /** FR-20: a tool for a skill the character doesn't AFK: shown on the Gear tab only. */
  freeStats: boolean;
}

/**
 * FR-6: held items handed out in two passes (empty slots, then replacements), characters in order
 * (the pusher, then higher class level, then lower index), slots in HANDOUT_ORDER then the AFK tool.
 * The best held item that is wearable and better goes there (highest primary stat, then main stat,
 * then rawName) and its count drops by one. A third pass lists free stats for other tool slots.
 */
export function handOut(
  _state: AccountState,
  facts: GearFacts,
  order: readonly CharacterState[],
  worn: ReadonlyMap<number, WornSlot[]>,
  held: readonly HeldGear[],
): HandOut[] {
  const left = held.map((h) => ({ h, places: h.places.map((p) => ({ ...p })) }));
  const out: HandOut[] = [];
  const pass = (empty: boolean | 'tools') => {
    for (const c of order) {
      const family = familyOf(facts, c);
      const w = worn.get(c.index);
      if (!family || !w) continue;
      const afk = afkToolSlot(c);
      const slots =
        empty === 'tools' ? TOOLS.filter((s) => s !== afk) : [...HANDOUT_ORDER, ...(afk ? [afk] : [])];
      for (const slot of slots) {
        const ws = w.find((x) => x.slot === slot);
        if (!ws || ws.unknown || out.some((o) => o.index === c.index && o.slot === slot)) continue;
        if (empty === true && ws.item) continue;
        if (empty === false && !ws.item) continue;
        if (empty === 'tools' && ws.item) continue;
        const fam = familyOfSlot(slot);
        const main = MAIN_STAT[family];
        const fits = left.filter(
          (x) =>
            x.places.some((p) => p.count > 0) &&
            GEAR_TYPES[x.h.type] === fam &&
            wearable(x.h, c, family, slot) &&
            better(x.h, ws.item, slot, main),
        );
        fits.sort(
          (a, b) =>
            primaryOf(b.h, slot) - primaryOf(a.h, slot) ||
            (fam === 'ring' || fam === 'pendant' ? b.h.wp - a.h.wp : 0) ||
            b.h[main] - a.h[main] ||
            (a.h.rawName < b.h.rawName ? -1 : a.h.rawName > b.h.rawName ? 1 : 0),
        );
        const pick = fits[0];
        if (!pick) continue;
        // Storage first, then the character's own bag, then other bags (lowest index first).
        const own = `inv:c${c.index}`;
        const from =
          pick.places.find((p) => p.place === 'storage' && p.count > 0) ??
          pick.places.find((p) => p.place === own && p.count > 0) ??
          pick.places.find((p) => p.count > 0);
        if (!from) continue;
        from.count -= 1;
        out.push({ index: c.index, slot, item: pick.h, place: from.place, freeStats: empty === 'tools' });
      }
    }
  };
  pass(true);
  pass(false);
  pass('tools');
  return out;
}

/** FR-6's character order: the pusher, then higher class level, then lower index. */
export function handOutOrder(characters: readonly CharacterState[], pusher: number | null): CharacterState[] {
  return [...characters].sort(
    (a, b) =>
      Number(b.index === pusher) - Number(a.index === pusher) || b.level - a.level || a.index - b.index,
  );
}
