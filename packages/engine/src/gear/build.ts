// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 `buildGear` (docs/specs/M18-gear-tools.md): slot states -> the hand-out (FR-6) -> per character, in
// FR-6's order, the AFK tool (FR-19), empty slots (FR-8) and the next piece (FR-13) on shared holding and
// unlock-point pools -> one account line per piece wanted by several characters (FR-13, #70 A5), empty
// accessories (FR-9), held gear (FR-7) and the Smithy (FR-22, FR-23) -> the Gear tab, heat strip and
// Smithy views (FR-24 to FR-27). Pure: the same inputs give byte-identical output (FR-29).
import {
  type AccountState,
  type CharacterState,
  GEAR_SLOTS,
  type GearSlotId,
  gearItem,
  type HeldGear,
  heldGear,
  type WornSlot,
  wornGear,
} from '@idleon-forge/account-state';
import type { SlotValue } from '@idleon-forge/knowledge';
import type { ModuleGoal } from '../core/module';
import { effortCost } from '../metapath/priority';
import type { MetaPathResult } from '../metapath/types';
import type { Goal, GoalDetail, SourceRef, WalkthroughRoot } from '../result';
import {
  ARMOUR,
  afkToolSlot,
  better,
  type Family,
  familyOf,
  familyOfSlot,
  gateLevel,
  type HandOut,
  handOut,
  handOutOrder,
  judgeSlot,
  MAIN_STAT,
  nextToolTier,
  planRows,
  planStage,
  primaryOf,
  reached,
  recipeState,
  type SlotJudgement,
  TOOL_SKILL,
  TOOLS,
  wearable,
} from './judge';
import { ENTRY, type GearKnowledge, gearFacts, int, joinAnd, type Piece, say, sourcesOf, who } from './kb';
import {
  type Ctx,
  cloneCtx,
  commit,
  crafterOf,
  maxSmithing,
  type Path,
  Pool,
  pathTo,
  rootOf,
  setWarnings,
} from './paths';
import { buildSmithy } from './smithy';
import type { CharacterGear, GearResult, GearSlotView } from './types';

export interface GearBuildInput {
  state: AccountState;
  kb: GearKnowledge;
  meta: MetaPathResult | null;
}

export interface GearBuildOutput {
  characters: Map<number, ModuleGoal[]>;
  account: ModuleGoal[];
  result: GearResult;
}

type LineKind = 'tool' | 'empty' | 'next';
interface Line {
  kind: LineKind;
  index: number;
  slot: GearSlotId;
  piece: Piece;
  path: Path;
  doable: boolean;
  /** FR-8 case: 1 the target, 2 the cheapest piece made now, 3 the target's first open step. */
  emptyCase?: 1 | 2 | 3;
  worn: string | null;
  levelsBehind: number | null;
  /** Rank position: 3 (free-value fill), 'weapon' (with the subclass Goals) or 'armour' (last). */
  pos: 3 | 'weapon' | 'armour';
}

const SUBCLASS_ENTRY = 'metapath.goal.subclass';
const LAST_ENTRY = 'classes.goal.level';
const ACCESSORY: readonly GearSlotId[] = ['pendant', 'ring1', 'ring2'];

const rankOf = (pos: Line['pos'], effortSeconds: number) =>
  pos === 3
    ? { framePosition: 3 as const, cost: effortCost(effortSeconds) }
    : { rankAs: pos === 'weapon' ? SUBCLASS_ENTRY : LAST_ENTRY, cost: effortCost(effortSeconds) };

const effort = (kb: GearKnowledge, id: string) => {
  const e = kb.entries[id];
  return e?.type === 'check' && e.effortSeconds ? e.effortSeconds : 60;
};

export function buildGear(input: GearBuildInput): GearBuildOutput | null {
  const { state, kb, meta } = input;
  const facts = gearFacts(kb);
  if (!facts) return null;
  const world = state.account.currentWorld ?? null;
  const stage = planStage(meta?.stage.id ?? null, world);
  const beyond = (world ?? 0) >= 4 || (stage !== null && reached(stage, 'W4-entry'));
  const s = (id: string, key: string, slots: Record<string, SlotValue> = {}) => say(kb, id, key, slots);
  const sn = (key: string, slots: Record<string, SlotValue> = {}) => s(ENTRY.next, key, slots);
  const slotWord = (slot: GearSlotId) => sn(`slot-${slot}`);
  const fromText = (place: string, index: number) => {
    if (place === 'storage') return s(ENTRY.held, 'from-storage');
    if (place === `inv:c${index}`) return s(ENTRY.held, 'from-own-bag');
    const other = state.characters.find((x) => `inv:c${x.index}` === place);
    return other ? s(ENTRY.held, 'from-bag', { who: who(other) }) : s(ENTRY.held, 'from-storage');
  };

  // ---- F2: slot states ----
  const worn = new Map<number, WornSlot[]>();
  const families = new Map<number, Family | null>();
  const judged = new Map<number, SlotJudgement[]>();
  for (const c of state.characters) {
    const w = wornGear(state, c);
    const family = familyOf(facts, c);
    families.set(c.index, family);
    if (!w) continue;
    worn.set(c.index, w);
    judged.set(
      c.index,
      w.map((x) => judgeSlot(state, facts, stage, c, family, x)),
    );
  }
  const held: HeldGear[] = heldGear(state) ?? [];
  const order = handOutOrder(state.characters, meta?.pusher?.index ?? null);
  const handouts = handOut(state, facts, order, worn, held);
  const realHandouts = handouts.filter((h) => !h.freeStats);
  const handed = (index: number, slot: GearSlotId) =>
    realHandouts.find((h) => h.index === index && h.slot === slot);

  // ---- F4: the Smithy (its unregistered parts feed FR-18) ----
  const smithy = buildSmithy(state, kb, facts, worn);
  const ctx: Ctx = {
    state,
    facts,
    kb,
    pool: new Pool(state),
    points: {
      left: Math.max(0, (state.account.taskUnlocks?.owned ?? 0) - (state.account.taskUnlocks?.bought ?? 0)),
      bought: state.account.taskUnlocks?.bought ?? 0,
    },
    unregistered: smithy.unregistered,
    smithyDays: smithy.daysLeft,
  };
  // Handed-out pieces leave the pool (a recipe never consumes a piece that is being equipped).
  for (const h of realHandouts) ctx.pool.take(h.item.rawName, 1);

  const wornIn = (index: number, slot: GearSlotId): Map<string, number> => {
    const it = worn.get(index)?.find((x) => x.slot === slot)?.item;
    return new Map(it ? [[it.rawName, 1]] : []);
  };
  const tryPath = (piece: Piece, count: number, wornMap: Map<string, number>) => {
    const trial = cloneCtx(ctx);
    const p = pathTo(trial, piece, count, new Map(wornMap));
    return { p, trial };
  };

  // ---- F2, F3: lines per character, in FR-6's order ----
  const lines: Line[] = [];
  const accessories: Array<{ index: number; slot: GearSlotId }> = [];
  for (const c of order) {
    const family = families.get(c.index);
    const js = judged.get(c.index);
    if (!family || !js) continue;
    const j = (slot: GearSlotId) => js.find((x) => x.slot === slot);
    // FR-19: the AFK Target's tool.
    const afk = afkToolSlot(c);
    let toolLine: Line | null = null;
    const tj = afk ? j(afk) : undefined;
    if (afk && tj && tj.state !== 'unknown' && !handed(c.index, afk) && stage) {
      const tiers = planRows(facts, familyOfSlot(afk), family)
        .map((r) => facts.ladder.get(r.piece))
        .filter(
          (p): p is Piece => !!p && wearable(p, c, family, afk) && better(p, tj.item, afk, MAIN_STAT[family]),
        );
      for (const p of [...tiers].reverse()) {
        const { p: path, trial } = tryPath(p, 1, wornIn(c.index, afk));
        if (path.doable) {
          commit(ctx, trial);
          toolLine = {
            kind: 'tool',
            index: c.index,
            slot: afk,
            piece: p,
            path,
            doable: true,
            worn: tj.item?.rawName ?? null,
            levelsBehind: null,
            pos: 3,
          };
          break;
        }
      }
      // Nothing doable: the same next tier the Gear tab's ladder names (nextToolTier).
      const step = !toolLine && !tj.item ? nextToolTier(tiers, null, gateLevel(c, afk) ?? 0) : null;
      if (step) {
        const { p: path } = tryPath(step, 1, new Map());
        toolLine = {
          kind: 'tool',
          index: c.index,
          slot: afk,
          piece: step,
          path,
          doable: false,
          worn: null,
          levelsBehind: null,
          pos: 'weapon',
        };
      }
      if (toolLine) lines.push(toolLine);
    }
    for (const slot of ACCESSORY)
      if (j(slot)?.state === 'empty' && !handed(c.index, slot)) accessories.push({ index: c.index, slot });
    if (beyond || !stage) continue;
    // FR-8: empty armour and weapon slots.
    for (const slot of ['weapon', ...ARMOUR] as GearSlotId[]) {
      const x = j(slot);
      if (x?.state !== 'empty' || handed(c.index, slot)) continue;
      const pos: Line['pos'] = slot === 'weapon' ? 'weapon' : 'armour';
      if (x.target) {
        const { p, trial } = tryPath(x.target.piece, 1, new Map());
        if (p.doable) {
          commit(ctx, trial);
          lines.push({
            kind: 'empty',
            index: c.index,
            slot,
            piece: x.target.piece,
            path: p,
            doable: true,
            emptyCase: 1,
            worn: null,
            levelsBehind: null,
            pos: 3,
          });
          continue;
        }
      }
      let made: Line | null = null;
      for (const row of planRows(facts, familyOfSlot(slot), family)) {
        const piece = facts.ladder.get(row.piece);
        if (!piece || !reached(stage, row.from) || !wearable(piece, c, family, slot)) continue;
        if ((recipeState(state, facts, piece.rawName) ?? -1) < 0) continue;
        const { p, trial } = tryPath(piece, 1, new Map());
        if (!p.doable) continue;
        commit(ctx, trial);
        made = {
          kind: 'empty',
          index: c.index,
          slot,
          piece,
          path: p,
          doable: true,
          emptyCase: 2,
          worn: null,
          levelsBehind: null,
          pos: 3,
        };
        break;
      }
      if (made) lines.push(made);
      else if (x.target) {
        const { p } = tryPath(x.target.piece, 1, new Map());
        lines.push({
          kind: 'empty',
          index: c.index,
          slot,
          piece: x.target.piece,
          path: p,
          doable: false,
          emptyCase: 3,
          worn: null,
          levelsBehind: null,
          pos,
        });
      }
    }
    // FR-13: one next piece per character; the AFK tool line is its gear line when it fires.
    if (toolLine) continue;
    const cands = (['weapon', ...ARMOUR] as GearSlotId[])
      .map((slot) => j(slot))
      .filter(
        (x): x is SlotJudgement => !!x && x.state === 'behind' && !!x.target && !handed(c.index, x.slot),
      )
      .map((x) => ({
        x,
        ...tryPath((x.target as NonNullable<SlotJudgement['target']>).piece, 1, wornIn(c.index, x.slot)),
      }));
    const armourOrder = (a: (typeof cands)[number], b: (typeof cands)[number]) =>
      (b.x.levelsBehind ?? 0) - (a.x.levelsBehind ?? 0) ||
      ARMOUR.indexOf(a.x.slot) - ARMOUR.indexOf(b.x.slot);
    const pick =
      cands
        .filter((k) => k.p.doable)
        .sort(
          (a, b) => Number(b.x.slot === 'weapon') - Number(a.x.slot === 'weapon') || armourOrder(a, b),
        )[0] ??
      cands.find((k) => k.x.slot === 'weapon') ??
      cands.filter((k) => k.x.slot !== 'weapon').sort(armourOrder)[0];
    if (pick) {
      if (pick.p.doable) commit(ctx, pick.trial);
      lines.push({
        kind: 'next',
        index: c.index,
        slot: pick.x.slot,
        piece: (pick.x.target as NonNullable<SlotJudgement['target']>).piece,
        path: pick.p,
        doable: pick.p.doable,
        worn: pick.x.item?.rawName ?? null,
        levelsBehind: pick.x.levelsBehind,
        pos: pick.p.doable ? 3 : pick.x.slot === 'weapon' ? 'weapon' : 'armour',
      });
    }
  }

  // ---- Goals ----
  const charGoals = new Map<number, ModuleGoal[]>();
  const account: ModuleGoal[] = [];
  const addChar = (index: number, g: ModuleGoal) =>
    charGoals.set(index, [...(charGoals.get(index) ?? []), g]);
  const char = (i: number) => state.characters.find((x) => x.index === i) as CharacterState;
  const pieceName = (raw: string | null) =>
    raw ? (facts.ladder.get(raw)?.name ?? itemName(state, raw)) : '';
  const stonesOf = (index: number) => (raw: string) => {
    const it = worn.get(index)?.find((x) => x.item?.rawName === raw)?.item;
    return it ? Math.max(0, it.slotsMax - it.slotsLeft) : 0;
  };
  const goalOf = (
    id: string,
    key: string,
    text: string,
    why: string,
    details: GoalDetail[],
    fields: string[],
    extra: Partial<Goal> = {},
  ): Goal | null => {
    const e = kb.entries[id];
    if (e?.type !== 'check' || !text) return null;
    return {
      id,
      title: e.title,
      system: e.system,
      category: e.category ?? 'compounding',
      nextAction: {
        key,
        entryId: id,
        text,
        why,
        sources: sourcesOf(kb, id),
        stale: false,
        contested: null,
        confidence: e.confidence,
        provenance: { entryIds: [id], fields },
      },
      milestone: null,
      ...(details.length ? { details } : {}),
      ...extra,
    };
  };
  const GEAR_FIELDS = [
    'characters[].gear',
    'account.gearItems',
    'account.anvilRecipes',
    'account.anvilTabsOwned',
  ];

  // The craft line's text (FR-8 cases 1 and 2, FR-14): "Craft X for your shoes now (anvil tab 1)".
  const lineText = (l: Line): string => {
    const tab = facts.recipes.get(l.piece.rawName)?.tab ?? 1;
    if (!l.doable) return l.path.first.text;
    if (l.path.steps.some((x) => x.kind === 'unlock'))
      return sn('step-unlock-craft', { item: l.piece.name, world: l.piece.unlock?.world ?? 1 });
    if (l.kind === 'empty')
      return s(ENTRY.empty, l.emptyCase === 1 ? 'craft-now' : 'craft', {
        item: l.piece.name,
        slot: slotWord(l.slot),
        tab,
      });
    return sn('craft-now', { item: l.piece.name, tab });
  };
  const lineWhy = (l: Line): string => {
    const c = char(l.index);
    const parts: string[] = [];
    if (l.kind === 'tool') {
      const t = TOOL_SKILL[l.slot];
      const verb = s(ENTRY.tool, `verb-${t?.skill}`);
      const tool = s(ENTRY.tool, `tool-${l.slot}`);
      parts.push(
        l.worn
          ? s(ENTRY.tool, 'why-better', {
              who: who(c),
              verb,
              worn: pieceName(l.worn),
              item: l.piece.name,
              skill: skillLabel(t?.skill ?? ''),
              level: l.piece.lvReq,
            })
          : s(ENTRY.tool, 'why-empty', { who: who(c), verb, tool }),
      );
    } else if (l.worn && l.levelsBehind !== null)
      parts.push(
        sn('why', {
          levels: l.levelsBehind,
          worn: pieceName(l.worn),
          wornLv: worn.get(l.index)?.find((x) => x.slot === l.slot)?.item?.lvReq ?? 0,
          item: l.piece.name,
          lv: l.piece.lvReq,
        }),
      );
    else if (!l.worn)
      parts.push(sn('why-empty', { slot: slotWord(l.slot), item: l.piece.name, lv: l.piece.lvReq }));
    for (const u of [...new Set(l.path.usesWorn)].filter((u) => u === l.worn && !ctx.unregistered.has(u)))
      parts.push(sn('why-uses', { item: pieceName(u) }));
    const r = facts.recipes.get(l.piece.rawName);
    const crafter = r ? crafterOf(state, c, r.lv) : null;
    if (crafter && crafter.index !== c.index)
      parts.push(sn('why-crafter', { who: who(crafter), lv: crafter.smithingLevel ?? 0 }));
    parts.push(...setWarnings(ctx, l.path, stonesOf(l.index)));
    return parts.filter(Boolean).join(' ');
  };
  const rootFor = (piece: Piece, count: number, wornMap: Map<string, number>, id: string): WalkthroughRoot =>
    rootOf(ctx, piece, count, wornMap, id);

  // FR-13 merge (#70 A5): one account line per piece several characters want.
  const byPiece = new Map<string, Line[]>();
  for (const l of lines)
    if (l.kind !== 'tool') byPiece.set(l.piece.rawName, [...(byPiece.get(l.piece.rawName) ?? []), l]);
  const merged = new Set<Line>();
  const mergedLit: Array<{ index: number; slot: GearSlotId; key: string }> = [];
  const mergedRank = new Map<string, number>();
  for (const [raw, group] of byPiece) {
    if (new Set(group.map((l) => l.index)).size < 2) continue;
    for (const l of group) merged.add(l);
    const piece = facts.ladder.get(raw) as Piece;
    const tab = facts.recipes.get(raw)?.tab ?? 1;
    const all = group.every((l) => l.doable);
    const key = `${ENTRY.next}@account#${raw}`;
    const wornMap = new Map<string, number>();
    for (const l of group)
      for (const [k, v] of wornIn(l.index, l.slot)) wornMap.set(k, (wornMap.get(k) ?? 0) + v);
    const text = all
      ? sn('many', { item: piece.name, n: group.length, tab })
      : sn('many-step', {
          item: piece.name,
          n: group.length,
          step: (group.find((l) => !l.doable) ?? group[0])?.path.first.text ?? '',
        });
    const details: GoalDetail[] = group.map((l) => ({
      subject: `c${l.index}`,
      text: l.worn
        ? sn('detail-over', { who: who(char(l.index)), slot: slotWord(l.slot), worn: pieceName(l.worn) })
        : sn('detail-empty', { who: who(char(l.index)), slot: slotWord(l.slot) }),
    }));
    const why = [
      sn('why-many'),
      ...new Set(group.flatMap((l) => setWarnings(ctx, l.path, stonesOf(l.index)))),
    ].join(' ');
    const g = goalOf(ENTRY.next, key, text, why, details, GEAR_FIELDS, {
      title: sn('title-many', { item: piece.name, n: group.length }),
      walkthroughRoot: rootFor(piece, group.length, wornMap, `gear:${raw}@account`),
    });
    if (g) {
      account.push({
        goal: g,
        rank: rankOf(
          all ? 3 : group.some((l) => l.slot === 'weapon') ? 'weapon' : 'armour',
          effort(kb, ENTRY.next),
        ),
      });
      for (const l of group) mergedLit.push({ index: l.index, slot: l.slot, key });
      mergedRank.set(key, all ? 1 : 4);
    }
  }

  // FR-24: what the lit square answers, best first: the hand-out, a line done now, the AFK tool, the weapon.
  const litRank = new Map<string, number>([[`${ENTRY.held}@account`, 0]]);
  const lineKey = (l: Line) =>
    l.kind === 'tool'
      ? `${ENTRY.tool}@c${l.index}`
      : l.kind === 'empty'
        ? `${ENTRY.empty}@c${l.index}#${l.slot}`
        : `${ENTRY.next}@c${l.index}`;
  const keyOfSlot = new Map<string, string>();
  for (const m of mergedLit) keyOfSlot.set(`${m.index}:${m.slot}`, m.key);
  for (const l of lines) {
    if (merged.has(l)) continue;
    const id = l.kind === 'tool' ? ENTRY.tool : l.kind === 'empty' ? ENTRY.empty : ENTRY.next;
    const key = lineKey(l);
    const extra: Partial<Goal> = {
      walkthroughRoot: rootFor(l.piece, 1, wornIn(l.index, l.slot), `gear:${l.piece.rawName}@c${l.index}`),
      ...(l.kind === 'next' ? { title: sn('title', { item: l.piece.name, slot: slotWord(l.slot) }) } : {}),
    };
    const g = goalOf(id, key, lineText(l), lineWhy(l), [], GEAR_FIELDS, extra);
    if (!g) continue;
    if (l.kind === 'empty') g.nextAction.sources = slotSources(g.nextAction.sources, l.slot);
    keyOfSlot.set(`${l.index}:${l.slot}`, key);
    litRank.set(key, l.doable ? 1 : l.kind === 'tool' ? 2 : l.slot === 'weapon' ? 3 : 4);
    addChar(l.index, { goal: g, rank: rankOf(l.pos, effort(kb, id)) });
  }

  // FR-9: empty pendants and rings as one account line.
  if (accessories.length && !beyond && stage) {
    const rings = accessories.filter((a) => a.slot !== 'pendant');
    const pendants = accessories.filter((a) => a.slot === 'pendant');
    const details: GoalDetail[] = [];
    let text = '';
    const whys: string[] = [s(ENTRY.empty, 'why')];
    let doable = false;
    if (rings.length) {
      // The cheapest ring made now, for as many slots as the holdings cover.
      let made: { piece: Piece; n: number } | null = null;
      const fam = 'ring' as const;
      for (const row of facts.plan.filter((r) => r.slot === fam)) {
        const piece = facts.ladder.get(row.piece);
        if (!piece || !reached(stage, row.from) || (recipeState(state, facts, piece.rawName) ?? -1) < 0)
          continue;
        let n = 0;
        for (let k = 0; k < rings.length; k++) {
          const { p, trial } = tryPath(piece, 1, new Map());
          if (!p.doable) break;
          commit(ctx, trial);
          n++;
        }
        if (n > 0) {
          made = { piece, n };
          break;
        }
      }
      const kind = 'ring';
      if (made) {
        doable = true;
        const cost = joinAnd(
          made.piece.materials.map(
            (m) => `${int(m.amount)} ${pluralName(materialNameOf(kb, m.ref, m.rawName), m.amount)}`,
          ),
        );
        text =
          rings.length === 1
            ? s(ENTRY.empty, 'ring-now', { kind, item: made.piece.name })
            : s(ENTRY.empty, 'rings-now', {
                n: rings.length,
                kind,
                item: pluralName(made.piece.name, 2),
                cost,
              });
        if (made.n < rings.length) whys.push(s(ENTRY.empty, 'why-hold-some', { n: made.n }));
      } else {
        const target = facts.plan.filter((r) => r.slot === fam && reached(stage, r.from)).at(-1);
        const piece = target ? facts.ladder.get(target.piece) : undefined;
        const step = piece ? tryPath(piece, rings.length, new Map()).p.first.text : '';
        text =
          rings.length === 1
            ? s(ENTRY.empty, 'ring-step', { kind, step })
            : s(ENTRY.empty, 'rings-step', { n: rings.length, kind, step });
      }
      // The better ring the account could unlock next ("Steel Band is better from Lv 15: ...").
      const ringRows = facts.plan.filter((r) => r.slot === fam && reached(stage, r.from));
      const after = made ? ringRows.findIndex((r) => r.piece === made?.piece.rawName) + 1 : 0;
      const nextRow = ringRows.slice(after).find((r) => (recipeState(state, facts, r.piece) ?? 0) < 0);
      const best = nextRow ? facts.ladder.get(nextRow.piece) : undefined;
      if (best && best.rawName !== made?.piece.rawName)
        whys.push(
          s(ENTRY.empty, 'why-better', {
            item: best.name,
            lv: best.lvReq,
            how: tryPath(best, 1, new Map()).p.first.text,
          }),
        );
      const per = new Map<number, number>();
      for (const r of rings) per.set(r.index, (per.get(r.index) ?? 0) + 1);
      for (const [index, n] of per)
        details.push({
          subject: `c${index}`,
          text: s(ENTRY.empty, 'detail', { who: who(char(index)), n, kind: n === 1 ? 'ring' : 'rings' }),
        });
    }
    for (const p of pendants) {
      const fam = families.get(p.index);
      const c = char(p.index);
      const t = fam ? judged.get(p.index)?.find((x) => x.slot === 'pendant')?.target : null;
      const step = t ? tryPath(t.piece, 1, new Map()).p.first.text : '';
      if (step)
        details.push({
          subject: `c${p.index}`,
          text: s(ENTRY.empty, 'detail-pendant', { who: who(c), step }),
        });
    }
    if (!text && pendants.length) {
      const first = details[0]?.text.split(': ').slice(2).join(': ') ?? '';
      text =
        pendants.length === 1
          ? s(ENTRY.empty, 'ring-step', { kind: 'pendant', step: first })
          : s(ENTRY.empty, 'rings-step', { n: pendants.length, kind: 'pendant', step: first });
    }
    const g = goalOf(ENTRY.empty, `${ENTRY.empty}@account`, text, whys.join(' '), details, GEAR_FIELDS);
    if (g) g.nextAction.sources = slotSources(g.nextAction.sources, rings.length ? 'ring1' : 'pendant');
    if (g) {
      account.push({ goal: g, rank: rankOf(doable ? 3 : 'armour', effort(kb, ENTRY.empty)) });
      for (const a of accessories) keyOfSlot.set(`${a.index}:${a.slot}`, `${ENTRY.empty}@account`);
      litRank.set(`${ENTRY.empty}@account`, doable ? 1 : 4);
    }
  }

  // FR-7: held gear, one account Goal with a detail per character.
  const heldKey = `${ENTRY.held}@account`;
  if (realHandouts.length) {
    const byChar = new Map<number, HandOut[]>();
    for (const h of realHandouts) byChar.set(h.index, [...(byChar.get(h.index) ?? []), h]);
    const details: GoalDetail[] = [];
    for (const [index, hs] of byChar) {
      const c = char(index);
      const groups = new Map<string, string[]>();
      for (const h of hs) {
        const from = placeKey(h.place, index);
        const nm = itemName(state, h.item.rawName);
        const t = TOOL_SKILL[h.slot];
        const lv = t ? c.skillLevels?.[t.skill] : undefined;
        const label =
          t && lv !== undefined
            ? s(ENTRY.held, 'detail-tool', {
                item: nm,
                verb: `it ${s(ENTRY.tool, `verb-${t.skill}`)}`,
                skill: skillLabel(t.skill),
                level: lv,
              })
            : nm;
        groups.set(from, [...(groups.get(from) ?? []), label]);
      }
      const parts = [...groups].map(([from, names]) => {
        const items = joinAnd(countNames(names));
        if (from === 'storage') return s(ENTRY.held, 'detail-from-storage', { items });
        if (from === 'own') return s(ENTRY.held, 'detail-from-own-bag', { items });
        return s(ENTRY.held, 'detail-from-bag', { items, who: who(char(Number(from))) });
      });
      details.push({
        subject: `c${index}`,
        text: s(ENTRY.held, 'detail', { who: who(c), items: parts.join(', ') }),
      });
      for (const h of hs) keyOfSlot.set(`${index}:${h.slot}`, heldKey);
    }
    const text = byChar.size === 1 ? s(ENTRY.held, 'one') : s(ENTRY.held, 'many', { n: byChar.size });
    const g = goalOf(
      ENTRY.held,
      heldKey,
      text,
      s(ENTRY.held, byChar.size === 1 ? 'why-one' : 'why'),
      details,
      ['characters[].gear', 'account.gearItems', 'account.storageItems', 'characters[].inventoryItems'],
    );
    if (g) account.push({ goal: g, rank: rankOf(3, effort(kb, ENTRY.held) * realHandouts.length) });
  }

  // FR-22, FR-23: hire the Smithy, then register the first complete set.
  if (smithy.state === 'ready') {
    const g = goalOf(
      ENTRY.hire,
      `${ENTRY.hire}@account`,
      kb.entries[ENTRY.hire]?.text ?? '',
      kb.entries[ENTRY.hire]?.why ?? '',
      [],
      ['account.armorSmithy'],
    );
    if (g) account.push({ goal: g, rank: rankOf(3, effort(kb, ENTRY.hire)) });
  }
  if (smithy.register) {
    const { set, details } = smithy.register;
    const g = goalOf(
      ENTRY.register,
      `${ENTRY.register}@account`,
      s(ENTRY.register, 'register', { set: set.name }),
      s(ENTRY.register, 'why', { bonus: set.bonus }),
      details.map((text) => ({ subject: 'account' as const, text })),
      ['account.armorSmithy', 'characters[].gear'],
    );
    if (g) account.push({ goal: g, rank: rankOf(3, effort(kb, ENTRY.register)) });
  }

  // ---- F5: views ----
  const allGoals = [...account, ...[...charGoals.values()].flat()];
  const goalByKey = new Map(allGoals.map((g) => [g.goal.nextAction.key, g.goal]));
  const characters: CharacterGear[] = [];
  for (const c of state.characters) {
    const js = judged.get(c.index);
    const family = families.get(c.index) ?? null;
    if (!js) {
      characters.push({
        index: c.index,
        slots: [],
        lit: null,
        step: null,
        why: null,
        ladders: [],
        status: sn('status-unknown'),
        note: null,
      });
      continue;
    }
    const views: GearSlotView[] = js.map((x) => {
      const h = handed(c.index, x.slot);
      const free = handouts.filter((o) => o.freeStats && o.index === c.index && o.slot === x.slot);
      const key = keyOfSlot.get(`${c.index}:${x.slot}`) ?? null;
      const state2 = x.state === 'unknown' ? 'unknown' : h ? 'held-upgrade' : x.state;
      const word =
        state2 === 'unknown'
          ? sn('word-unknown')
          : state2 === 'held-upgrade'
            ? x.item
              ? sn('word-held')
              : sn('word-empty-held')
            : state2 === 'empty'
              ? sn('word-empty')
              : state2 === 'behind'
                ? x.levelsBehind
                  ? sn('word-behind', { n: x.levelsBehind })
                  : x.tiersBehind
                    ? sn(x.tiersBehind === 1 ? 'word-behind-tiers' : 'word-behind-tiers-many', {
                        n: x.tiersBehind,
                      })
                    : sn('word-behind-only')
                : x.trade
                  ? sn('word-trade')
                  : sn('word-ok');
      const steps = x.target ? tryPath(x.target.piece, 1, wornIn(c.index, x.slot)).p : null;
      return {
        slot: x.slot,
        state: state2,
        word,
        equipped: x.item
          ? {
              rawName: x.item.rawName,
              name: itemName(state, x.item.rawName),
              lvReq: x.item.lvReq,
              primary: primaryOf(x.item, x.slot),
              main: family ? x.item[MAIN_STAT[family]] : 0,
              pct: x.item.pct.map((p) => `${p.val}${humanPct(p.txt)}`),
              slotsLeft: x.item.slotsLeft,
              slotsMax: x.item.slotsMax,
            }
          : null,
        target:
          x.target && steps && x.target.piece.rawName !== x.item?.rawName
            ? {
                rawName: x.target.piece.rawName,
                name: x.target.piece.name,
                lvReq: x.target.piece.lvReq,
                how: steps.doable
                  ? sn('craft-now', {
                      item: x.target.piece.name,
                      tab: facts.recipes.get(x.target.piece.rawName)?.tab ?? 1,
                    })
                  : steps.first.text,
                steps: [...new Set([...steps.all].sort((a, b) => b.depth - a.depth).map((st) => st.text))],
              }
            : null,
        levelsBehind: x.levelsBehind,
        held: [
          ...(h
            ? [
                s(ENTRY.held, 'equip', {
                  item: itemName(state, h.item.rawName),
                  from: fromText(h.place, c.index),
                }),
              ]
            : []),
          ...free.map((f) =>
            s(ENTRY.held, 'detail-free', {
              item: itemName(state, f.item.rawName),
              from: fromText(f.place, c.index),
            }),
          ),
        ],
        note: x.unknown ? sn('note-unknown-item') : x.trade ? sn('note-trade') : null,
        actionKey: key,
      };
    });
    views.push(
      {
        slot: 'trap',
        state: 'm20',
        word: '',
        equipped: null,
        target: null,
        levelsBehind: null,
        held: [],
        note: null,
        actionKey: null,
      },
      {
        slot: 'skull',
        state: 'm20',
        word: '',
        equipped: null,
        target: null,
        levelsBehind: null,
        held: [],
        note: null,
        actionKey: null,
      },
    );
    // FR-24: one lit square, the slot of this character's top-ranked M18 Next Action.
    const lit = litOf(views, new Map([...mergedRank, ...litRank]));
    const litGoal = lit?.actionKey ? goalByKey.get(lit.actionKey) : undefined;
    const litHeld = lit ? views.find((v) => v.slot === lit.slot)?.held[0] : undefined;
    const step = litGoal
      ? litGoal.nextAction.key === heldKey && litHeld
        ? litHeld
        : litGoal.nextAction.text
      : null;
    // FR-25: the Characters tile line.
    const afk = afkToolSlot(c);
    const empties = views.filter((v) => {
      const at = GEAR_SLOTS.indexOf(v.slot as GearSlotId);
      return ((at >= 0 && at < 8) || v.slot === afk) && v.equipped === null && v.state === 'empty';
    }).length;
    const worst = views
      .filter((v) => v.state === 'behind' && v.levelsBehind)
      .sort(
        (a, b) =>
          (b.levelsBehind ?? 0) - (a.levelsBehind ?? 0) ||
          GEAR_SLOTS.indexOf(a.slot as GearSlotId) - GEAR_SLOTS.indexOf(b.slot as GearSlotId),
      )[0];
    const statusParts = [
      ...(empties ? [sn('status-empty', { n: empties })] : []),
      ...(views.some((v) => v.state === 'held-upgrade') ? [sn('status-held')] : []),
      ...(worst
        ? [sn('status-behind', { slot: slotWord(worst.slot as GearSlotId), n: worst.levelsBehind ?? 0 })]
        : []),
    ].slice(0, 2);
    const status =
      views.some((v) => v.state === 'unknown') && !statusParts.length
        ? sn('status-unknown')
        : statusParts.join(' · ') || sn('status-ok');
    characters.push({
      index: c.index,
      slots: views,
      lit: lit?.slot ?? null,
      step,
      // One character's page: the account hand-out speaks about this character only (R9 QA).
      why: litGoal?.id === ENTRY.held ? s(ENTRY.held, 'why-one') : (litGoal?.nextAction.why ?? null),
      ladders: laddersOf(ctx, c, family, worn.get(c.index) ?? [], sn),
      status,
      note: beyond ? sn('note-plan-w3') : null,
    });
  }
  const heatCols: Array<GearSlotId | 'tool'> = [
    'helmet',
    'weapon',
    'shirt',
    'pendant',
    'pants',
    'ring1',
    'shoes',
    'ring2',
    'tool',
  ];
  const heat: GearResult['heat'] = {
    columns: heatCols,
    rows: characters.map((cg) => {
      const c = char(cg.index);
      const afk = afkToolSlot(c);
      return {
        index: cg.index,
        cells: heatCols.map((col) => {
          const v = cg.slots.find((x) => x.slot === (col === 'tool' ? afk : col));
          if (!v) return { word: '', state: 'none' as const, actionKey: null };
          const word =
            v.state === 'behind' && v.levelsBehind
              ? sn('heat-behind', { n: v.levelsBehind })
              : v.state === 'held-upgrade'
                ? sn('word-held')
                : v.word;
          return { word, state: v.state === 'm20' ? ('none' as const) : v.state, actionKey: v.actionKey };
        }),
      };
    }),
  };
  const unlockWants: GearResult['unlockWants'] = [];
  // X5: what the unlock points and merits can buy now, deepest piece first (a prerequisite before its upgrade).
  for (const l of lines)
    for (const st of [...l.path.all].sort((a, b) => b.depth - a.depth))
      if (
        st.want &&
        (st.kind === 'unlock' || st.kind === 'merit') &&
        !unlockWants.some((u) => u.what === st.want?.what)
      )
        unlockWants.push(st.want);

  return {
    characters: charGoals,
    account,
    result: {
      characters,
      smithy: { state: smithy.state, daysLeft: smithy.daysLeft, line: smithy.line, sets: smithy.cards },
      heat,
      unlockWants,
    },
  };
}

/** FR-24: the hand-out wins, then a line that can be done now, then the AFK tool, the weapon, the rest. */
function litOf(views: GearSlotView[], ranks: ReadonlyMap<string, number>): GearSlotView | null {
  const score = (v: GearSlotView): number => (v.actionKey ? (ranks.get(v.actionKey) ?? 99) : 99);
  const order = [
    'weapon',
    'helmet',
    'shirt',
    'pants',
    'shoes',
    'pendant',
    'ring1',
    'ring2',
    'pickaxe',
    'hatchet',
    'rod',
    'net',
  ];
  const best = [...views]
    .filter((v) => score(v) < 99)
    .sort((a, b) => score(a) - score(b) || order.indexOf(a.slot) - order.indexOf(b.slot))[0];
  return best ?? null;
}

function laddersOf(
  ctx: Ctx,
  c: CharacterState,
  family: Family | null,
  worn: readonly WornSlot[],
  sn: (key: string, slots?: Record<string, SlotValue>) => string,
): CharacterGear['ladders'] {
  if (!family) return [];
  const afk = afkToolSlot(c);
  const out: CharacterGear['ladders'] = [];
  for (const slot of TOOLS) {
    const w = worn.find((x) => x.slot === slot)?.item ?? null;
    if (slot !== afk && !w) continue;
    const t = TOOL_SKILL[slot];
    const lv = gateLevel(c, slot);
    if (!t || lv === null) continue;
    const pieces = planRows(ctx.facts, familyOfSlot(slot), family)
      .map((r) => ctx.facts.ladder.get(r.piece))
      .filter((p): p is Piece => !!p);
    const tiers = pieces.map((p) => ({
      rawName: p.rawName,
      name: p.name,
      atLevel: p.lvReq,
      equipped: p.rawName === w?.rawName,
    }));
    // The same next tier as the Now tab's tool line (nextToolTier).
    const piece = nextToolTier(pieces, w ? { rawName: w.rawName, lvReq: w.lvReq ?? 0 } : null, lv);
    let next: string | null = null;
    if (piece) {
      const r = ctx.facts.recipes.get(piece.rawName);
      const locked = (recipeState(ctx.state, ctx.facts, piece.rawName) ?? 0) < 0;
      const tabMissing = !!r && r.tab > (ctx.state.account.anvilTabsOwned ?? 1);
      const world = piece.unlock?.world ?? 1;
      const gate =
        locked && tabMissing
          ? sn('ladder-gate-both', { world, tab: r?.tab ?? 1 })
          : locked
            ? sn('ladder-gate-unlock', { world })
            : tabMissing
              ? sn('ladder-gate-tab', { tab: r?.tab ?? 1 })
              : null;
      next = gate
        ? sn('ladder-next-gate', { item: piece.name, skill: skillLabel(t.skill), level: piece.lvReq, gate })
        : sn('ladder-next', { item: piece.name, skill: skillLabel(t.skill), level: piece.lvReq, have: lv });
    }
    out.push({ skill: t.skill, skillLevel: lv, tiers, next });
  }
  return out;
}

// R9 QA P2-3: the empty-slot entry cites one wiki page per slot; each line keeps its own slot's page
// (and the slot-free Sources), so an empty pants slot never cites the Rings page.
const SLOT_PAGE: Readonly<Partial<Record<GearSlotId, string>>> = {
  helmet: '/wiki/Helmets',
  shirt: '/wiki/Shirts',
  pants: '/wiki/Pants',
  shoes: '/wiki/Shoes',
  weapon: '/wiki/Weapons',
  ring1: '/wiki/Rings',
  ring2: '/wiki/Rings',
};
const ANVIL_TAB_PAGE = '/wiki/Smithing/Anvil_Tab_';
export function slotSources(sources: SourceRef[], slot: GearSlotId): SourceRef[] {
  const own = SLOT_PAGE[slot];
  const pages = Object.values(SLOT_PAGE);
  return sources.filter((x) => {
    const page = pages.find((p) => x.url.endsWith(p));
    if (page) return page === own;
    // The Anvil Tab 1 page covers the Copper Band; an armour piece's own page names its tab and recipe.
    return !x.url.includes(ANVIL_TAB_PAGE) || own === '/wiki/Rings' || slot === 'pendant';
  });
}

const SKILL_LABEL: Readonly<Record<string, string>> = {
  mining: 'Mining',
  chopping: 'Choppin',
  fishing: 'Fishing',
  catching: 'Catching',
};
export const skillLabel = (skill: string) => SKILL_LABEL[skill] ?? skill;

/** An item's display name, from its stored stats (items.json displayName), else its rawName spaced out. */
function itemName(state: AccountState, raw: string): string {
  return gearItem(state, raw)?.name ?? raw.replace(/_/g, ' ');
}

const placeKey = (place: string, index: number) =>
  place === 'storage' ? 'storage' : place === `inv:c${index}` ? 'own' : place.replace('inv:c', '');

/** ["Copper Band", "Copper Band"] -> ["2 Copper Bands"]; one of a kind gets "a". */
function countNames(names: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts].map(([n, k]) => (k === 1 ? n : `${k} ${pluralName(n, k)}`));
}

export const pluralName = (name: string, n: number) => (n === 1 || /s$/.test(name) ? name : `${name}s`);

const materialNameOf = (kb: GearKnowledge, ref: string, raw: string) => {
  const v = kb.entries[ref]?.values.name;
  return typeof v === 'string' ? v : raw.replace(/_/g, ' ');
};

/** "%_TOTAL_DAMAGE" -> "% total damage". */
const humanPct = (txt: string) => txt.replace(/_/g, ' ').toLowerCase().replace(/^ ?%/, '%');

export type { SourceRef };
export { maxSmithing };
