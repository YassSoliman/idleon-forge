// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 F3 (docs/specs/M18-gear-tools.md FR-14 to FR-16, TR-6): the path to a piece, its first open step,
// whether the whole of it can be done now (every recipe available or unlockable with an unspent point on
// an open Task Board, every anvil tab owned, the Smithing level reached, every material held), and the
// inline Walkthrough root M14 expands. Holdings and unlock points are pools: a line that commits takes
// its share, so a later line sees what is left (FR-8, FR-15).
import { type AccountState, type CharacterState, isKnown } from '@idleon-forge/account-state';
import type { SlotValue } from '@idleon-forge/knowledge';
import type { WalkthroughRoot } from '../result';
import { holdingsKnown, holdingsOf, totalOf } from '../walkthrough/holdings';
import { recipeState } from './judge';
import { ENTRY, type GearFacts, type GearKnowledge, int, type Piece, say } from './kb';

/**
 * V9 (settled from N.js `TaskStuff("UnlockColumnsOpened")`, game 2.3.540): a world's Unlocks column
 * opens once the account owns that world's anvil tab and has unlocked this many recipes in all.
 */
export const COLUMN_UNLOCKS: Readonly<Record<number, number>> = { 2: 7, 3: 22 };

export class Pool {
  private readonly left: Map<string, number>;
  constructor(
    private readonly state: AccountState,
    left?: Map<string, number>,
  ) {
    this.left = left ?? new Map();
  }
  available(rawName: string): number {
    if (!this.left.has(rawName)) this.left.set(rawName, totalOf(holdingsOf(this.state, rawName)));
    return this.left.get(rawName) as number;
  }
  take(rawName: string, need: number): number {
    const got = Math.min(this.available(rawName), need);
    this.left.set(rawName, this.available(rawName) - got);
    return got;
  }
  clone(): Pool {
    return new Pool(this.state, new Map(this.left));
  }
}

export interface Ctx {
  state: AccountState;
  facts: GearFacts;
  kb: GearKnowledge;
  pool: Pool;
  /** Unlock points left and recipes unlocked so far (this run's unlocks included). */
  points: { left: number; bought: number };
  /** Smithy sets not registered, by part rawName -> set name ("Copper"). */
  unregistered: ReadonlyMap<string, string>;
  /** Days until the Smithy can be hired (null once it can, or unknown). */
  smithyDays: number | null;
}

export const cloneCtx = (c: Ctx): Ctx => ({ ...c, pool: c.pool.clone(), points: { ...c.points } });
export const commit = (into: Ctx, from: Ctx) => {
  into.pool = from.pool;
  into.points = from.points;
};

export type StepKind =
  | 'unlock'
  | 'open'
  | 'points'
  | 'merit'
  | 'drop'
  | 'craft-first'
  | 'unknown'
  | 'tab'
  | 'smithing'
  | 'previous'
  | 'material'
  | 'craft';

export interface Step {
  kind: StepKind;
  text: string;
  doable: boolean;
  want?: { kind: 'task-unlock' | 'merit'; world: number; what: string };
}

export interface Path {
  piece: Piece;
  count: number;
  steps: Step[];
  doable: boolean;
  /** The first step that isn't done yet (FR-14), or the craft step. */
  first: Step;
  /** Every step, own and the earlier pieces', with its depth (0 = this piece). */
  all: Array<Step & { depth: number }>;
  /** Worn pieces this path consumes (FR-15: "uses the Copper Helmet it is wearing"). */
  usesWorn: string[];
  /** Gear pieces the account already owns (worn or held) that this path consumes (FR-18). */
  consumes: string[];
  /** Steps that still need materials ("Get 3 more Nuget Cake"). */
  short: Array<{ rawName: string; missing: number; held: number }>;
}

const N = ENTRY.next;
const t = (ctx: Ctx, key: string, slots: Record<string, SlotValue>) => say(ctx.kb, N, key, slots);

export function maxSmithing(state: AccountState): number | null {
  const known = state.characters.filter((c) => isKnown(state, `characters[${c.index}].smithingLevel`));
  if (known.length === 0) return null;
  return Math.max(...known.map((c) => c.smithingLevel ?? 0));
}

const meritLevel = (ctx: Ctx, world: number): number | null => {
  const slot = ctx.facts.meritSlot.get(world);
  const w = ctx.state.account.merits?.find((m) => m.world === world);
  const r = slot === undefined ? undefined : w?.rows.find((x) => x.index === slot);
  return r ? r.level : null;
};

const SET_NAME = (set: string) =>
  set.replace(/_SET$/, '').charAt(0) + set.replace(/_SET$/, '').slice(1).toLowerCase();

/** The unlock step of a locked recipe (FR-14 step 1). It consumes an unlock point when doable. */
function unlockStep(ctx: Ctx, piece: Piece): Step {
  const r = ctx.facts.recipes.get(piece.rawName);
  const item = piece.name;
  if (!r) return { kind: 'unknown', text: t(ctx, 'step-unknown', { item }), doable: false };
  if (r.from === 'task' && piece.unlock) {
    const w = piece.unlock.world;
    const want = { kind: 'task-unlock' as const, world: w, what: item };
    const tabs = ctx.state.account.anvilTabsOwned ?? null;
    const need = COLUMN_UNLOCKS[w];
    if (w >= 2 && (tabs === null || tabs < w))
      return { kind: 'open', text: t(ctx, 'step-open-tab', { tab: w, world: w }), doable: false, want };
    if (need !== undefined && ctx.points.bought < need)
      return {
        kind: 'open',
        text: t(ctx, 'step-open-count', { n: need - ctx.points.bought, world: w }),
        doable: false,
        want,
      };
    if (ctx.points.left < 1)
      return { kind: 'points', text: t(ctx, 'step-no-points', { item }), doable: false, want };
    ctx.points.left -= 1;
    ctx.points.bought += 1;
    return { kind: 'unlock', text: t(ctx, 'step-unlock', { item, world: w }), doable: true, want };
  }
  if (r.from === 'merit' && r.world && r.purchase) {
    const lv = meritLevel(ctx, r.world) ?? 0;
    return {
      kind: 'merit',
      text: t(ctx, 'step-merit', {
        n: Math.max(1, r.purchase - lv),
        set: piece.set ? SET_NAME(piece.set) : item,
        world: r.world,
      }),
      doable: false,
      want: { kind: 'merit', world: r.world, what: item },
    };
  }
  if (r.from === 'drop' && r.by)
    return { kind: 'drop', text: t(ctx, 'step-drop', { item, by: r.by }), doable: false };
  if (r.from === 'craft' && r.after) {
    const before = ctx.facts.ladder.get(r.after);
    return {
      kind: 'craft-first',
      text: t(ctx, 'step-craft-first', { item: before?.name ?? r.after }),
      doable: false,
    };
  }
  return { kind: 'unknown', text: t(ctx, 'step-unknown', { item }), doable: false };
}

/**
 * FR-14: the path to `count` copies of `piece`. `worn` is what the receivers wear that a recipe may
 * consume (rawName -> copies); it is used up as the path consumes it. Mutates `ctx`'s pools: evaluate on
 * a clone (`cloneCtx`) and `commit` it only for a line that is shown.
 */
export function pathTo(ctx: Ctx, piece: Piece, count: number, worn: Map<string, number>, depth = 0): Path {
  const steps: Step[] = [];
  const all: Path['all'] = [];
  const usesWorn: string[] = [];
  const consumes: string[] = [];
  const short: Path['short'] = [];
  const own = (st: Step) => {
    steps.push(st);
    all.push({ ...st, depth });
  };
  const r = ctx.facts.recipes.get(piece.rawName);
  const state = recipeState(ctx.state, ctx.facts, piece.rawName);
  if (!r) {
    // Not an anvil recipe at all (a drop, a shop buy): never "craft now".
    own({ kind: 'unknown', text: t(ctx, 'step-unknown', { item: piece.name }), doable: false });
  } else {
    if (state === -1) own(unlockStep(ctx, piece));
    else if (state === null)
      own({ kind: 'unknown', text: t(ctx, 'step-unknown', { item: piece.name }), doable: false });
    const tabs = ctx.state.account.anvilTabsOwned ?? null;
    if (r.tab > 1 && (tabs === null || tabs < r.tab))
      own({ kind: 'tab', text: t(ctx, 'step-tab', { tab: r.tab }), doable: false });
    const best = maxSmithing(ctx.state);
    if (best === null || best < r.lv)
      own({ kind: 'smithing', text: t(ctx, 'step-smithing', { lv: r.lv, best: best ?? 0 }), doable: false });
  }
  // FR-14 step 4, FR-15: the previous piece, worn by a receiver, held, or crafted first.
  for (const q of piece.consumes) {
    let need = q.amount * count;
    const fromWorn = Math.min(worn.get(q.rawName) ?? 0, need);
    if (fromWorn > 0) {
      worn.set(q.rawName, (worn.get(q.rawName) ?? 0) - fromWorn);
      usesWorn.push(q.rawName);
      consumes.push(q.rawName);
      need -= fromWorn;
    }
    const fromPool = ctx.pool.take(q.rawName, need);
    if (fromPool > 0) consumes.push(q.rawName);
    need -= fromPool;
    if (need <= 0) continue;
    const prev = ctx.facts.ladder.get(q.rawName);
    if (prev && ctx.facts.recipes.has(q.rawName) && depth < 4) {
      const sub = pathTo(ctx, prev, need, worn, depth + 1);
      consumes.push(...sub.consumes);
      usesWorn.push(...sub.usesWorn);
      short.push(...sub.short);
      all.push(...sub.all);
      steps.push({
        kind: 'previous',
        text: sub.doable ? t(ctx, 'step-previous', { item: prev.name }) : sub.first.text,
        doable: sub.doable,
        ...(sub.first.want && !sub.doable ? { want: sub.first.want } : {}),
      });
    } else
      own({
        kind: 'previous',
        text: t(ctx, 'step-get-previous', { item: prev?.name ?? q.rawName }),
        doable: false,
      });
  }
  // FR-14 step 5: the scarcest material.
  if (!holdingsKnown(ctx.state))
    own({ kind: 'unknown', text: t(ctx, 'step-unknown', { item: piece.name }), doable: false });
  else {
    let scarce: { rawName: string; name: string; missing: number; held: number; ratio: number } | null = null;
    for (const m of piece.materials) {
      const need = m.amount * count;
      const got = ctx.pool.take(m.rawName, need);
      if (got >= need) continue;
      const name = materialName(ctx, m.rawName, m.ref);
      short.push({ rawName: m.rawName, missing: need - got, held: got });
      const ratio = got / need;
      if (!scarce || ratio < scarce.ratio)
        scarce = { rawName: m.rawName, name, missing: need - got, held: got, ratio };
    }
    if (scarce)
      own({
        kind: 'material',
        text: t(ctx, 'step-material', { missing: scarce.missing, item: scarce.name, held: scarce.held }),
        doable: false,
      });
  }
  const craft: Step = {
    kind: 'craft',
    text: t(ctx, 'step-craft', { item: piece.name, tab: r?.tab ?? 1 }),
    doable: true,
  };
  own(craft);
  const doable = all.every((x) => x.doable);
  // The first open step: a recipe unlock first (the earliest piece's, so a prerequisite's comes first),
  // then an anvil tab, the Smithing level, a piece to get, then the scarcest material, then the craft.
  const pickFirst = (kinds: readonly StepKind[], undoneOnly: boolean) =>
    all
      .filter((x) => kinds.includes(x.kind) && (!undoneOnly || !x.doable))
      .sort((a, b) => b.depth - a.depth)[0];
  const strip = (x: Step & { depth: number }): Step => {
    const { depth: _d, ...rest } = x;
    return rest;
  };
  const found =
    pickFirst(['unlock', 'open', 'points', 'merit', 'drop', 'craft-first', 'unknown'], false) ??
    pickFirst(['tab'], true) ??
    pickFirst(['smithing'], true) ??
    pickFirst(['previous'], true) ??
    pickFirst(['material'], true);
  const first = found ? strip(found) : craft;
  return { piece, count, steps, all, doable, first, usesWorn, consumes, short };
}

/** A material's display name: its generated Acquisition's, or the rawName spaced out. */
export function materialName(ctx: Pick<Ctx, 'kb'>, rawName: string, ref?: string): string {
  const v = ref ? ctx.kb.entries[ref]?.values.name : undefined;
  return typeof v === 'string' ? v : rawName.replace(/_/g, ' ');
}

/** The recipe gate's label and state for a Walkthrough root (TR-6). */
function gateOf(ctx: Ctx, piece: Piece): WalkthroughRoot['gate'] {
  const r = ctx.facts.recipes.get(piece.rawName);
  const s = recipeState(ctx.state, ctx.facts, piece.rawName);
  if (!r) return null;
  if (s === null) return { label: t(ctx, 'gate-unknown', {}), met: null };
  if (s >= 0) return null;
  const item = piece.name;
  const label =
    r.from === 'task' && piece.unlock
      ? t(ctx, 'gate-task', { item, world: piece.unlock.world })
      : r.from === 'merit' && r.world && r.purchase
        ? t(ctx, 'gate-merit', { set: piece.set ? SET_NAME(piece.set) : item, n: r.purchase, world: r.world })
        : r.from === 'drop' && r.by
          ? t(ctx, 'gate-drop', { by: r.by })
          : r.from === 'craft' && r.after
            ? t(ctx, 'gate-craft', { item: ctx.facts.ladder.get(r.after)?.name ?? r.after })
            : t(ctx, 'gate-unknown', {});
  return { label, met: false };
}

/** TR-6, X3: the inline root M14 expands for `count` copies, `worn` copies of each piece already in hand. */
export function rootOf(
  ctx: Ctx,
  piece: Piece,
  count: number,
  worn: ReadonlyMap<string, number>,
  id: string,
  depth = 0,
): WalkthroughRoot {
  const r = ctx.facts.recipes.get(piece.rawName);
  return {
    id,
    rawName: piece.rawName,
    name: piece.name,
    need: count,
    worn: Math.min(count, worn.get(piece.rawName) ?? 0),
    tab: r?.tab ?? null,
    smithingLv: r?.lv ?? null,
    gate: gateOf(ctx, piece),
    materials: piece.materials.map((m) => ({ rawName: m.rawName, amount: m.amount, ref: m.ref })),
    pieces:
      depth >= 4
        ? []
        : piece.consumes.flatMap((q) => {
            const prev = ctx.facts.ladder.get(q.rawName);
            return prev
              ? [
                  {
                    amount: q.amount,
                    root: rootOf(ctx, prev, count * q.amount, worn, `${id}>${q.rawName}`, depth + 1),
                  },
                ]
              : [];
          }),
  };
}

/** FR-16: the wearer crafts when it has the Smithing level, else the highest-Smithing character that has. */
export function crafterOf(state: AccountState, receiver: CharacterState, lv: number): CharacterState | null {
  if ((receiver.smithingLevel ?? 0) >= lv) return receiver;
  const able = state.characters
    .filter((c) => (c.smithingLevel ?? 0) >= lv)
    .sort((a, b) => (b.smithingLevel ?? 0) - (a.smithingLevel ?? 0) || a.index - b.index);
  return able[0] ?? null;
}

/** FR-18: the set-warning why lines for the Smithy parts a path consumes. */
export function setWarnings(ctx: Ctx, path: Path, stonesOf: (rawName: string) => number): string[] {
  const out: string[] = [];
  for (const raw of [...new Set(path.consumes)]) {
    const set = ctx.unregistered.get(raw);
    if (!set) continue;
    const item = ctx.facts.ladder.get(raw)?.name ?? raw;
    out.push(
      ctx.smithyDays !== null && ctx.smithyDays > 0
        ? t(ctx, 'why-set-wait', { item, days: ctx.smithyDays, set })
        : t(ctx, 'why-set', { item, set }),
    );
    const stones = stonesOf(raw);
    if (stones > 0) out.push(t(ctx, 'why-stones', { n: stones, item }));
  }
  return out;
}

export { int };
