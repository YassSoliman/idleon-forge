// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 2, the W2/W3 gaps: each page's read-only picture, built from Account State in the worker's
// `pictures` step. Advice-free: the Next Actions come from the System's Checks.
import type { AccountState, ForgeItem } from '@idleon-forge/account-state';
import type { ForgeItemView, ForgePicture, TaskBoardPicture, TaskWorldView } from './gaps-types';

const human = (s: string) => s.replace(/_/g, ' ').trim();
const view = (i: ForgeItem): ForgeItemView => ({ rawName: i.rawName, name: human(i.name), amount: i.amount });

/** M26 FR-25: the Forge page's slot grid, bars waiting, upgrades and what it can be fed. */
export function forgePicture(state: AccountState): ForgePicture | null {
  const f = state.account.forge;
  if (!f) return null;
  const cap = Math.max(1, f.oreCapacity);
  const slots = f.slots.map((s) => ({
    index: s.index,
    unlocked: s.unlocked,
    brimstone: s.brimstone,
    ore: s.ore ? view(s.ore) : null,
    fill: s.ore ? Math.min(1, s.ore.amount / cap) : 0,
    smelting: s.smelting,
    emptyInSeconds: s.emptyInSeconds,
    bar: s.bar ? view(s.bar) : null,
    barrel: s.barrel ? { ...view(s.barrel), effect: s.barrel.effect, power: s.barrel.power } : null,
  }));
  const open = slots.filter((s) => s.unlocked);
  const smelting = open.filter((s) => s.smelting).map((s) => s.emptyInSeconds);
  const byBar = new Map<string, ForgeItemView>();
  for (const s of f.slots) {
    if (!s.bar) continue;
    const e = byBar.get(s.bar.rawName);
    if (e) e.amount += s.bar.amount;
    else byBar.set(s.bar.rawName, view(s.bar));
  }
  const bars = [...byBar.values()].sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
  return {
    systemId: 'forge',
    kind: 'forge',
    slotsUnlocked: f.slotsUnlocked,
    slots,
    idle: open.filter((s) => !s.smelting).length,
    firstEmptySeconds: smelting.length ? Math.min(...smelting) : null,
    barsWaiting: bars.reduce((n, b) => n + b.amount, 0),
    bars,
    capacity: f.oreCapacity,
    upgrades: f.upgrades,
    ores: f.oresHeld
      .filter((o) => o.amount >= o.perBar)
      .map((o) => ({ ...view(o), bars: Math.floor(o.amount / o.perBar) }))
      .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name)),
    barrels: f.barrelsHeld
      .map((b) => ({ ...view(b), effect: b.effect, power: b.power }))
      .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name)),
  };
}

/** What opens each world's board (dossier: Grasslands Gary, then Davey's, Irwin's and Neddy's quests). */
const OPENERS = [
  'Talk to Grasslands Gary in World 1 town',
  "Finish Desert Davey's quest in World 2 town",
  "Finish Iceland Irwin's quest in World 3 town",
  "Finish Nebula Neddy's quest in World 4 town",
] as const;

/** M26 FR-26: the Task Board page: each board's tasks, its Merit Shop and the Task Unlocks. */
export function taskBoardPicture(state: AccountState): TaskBoardPicture | null {
  const tb = state.account.taskBoard;
  if (!tb) return null;
  const merits = state.account.merits ?? null;
  const worlds: TaskWorldView[] = tb.worlds.map((w) => {
    const shop = merits?.find((m) => m.world === w.world);
    return {
      world: w.world,
      open: w.open,
      opener: OPENERS[w.world - 1] ?? '',
      tasks: w.tasks.map((t) => ({
        index: t.index,
        name: human(t.name),
        stat: t.stat,
        level: t.level,
        maxLevel: t.maxLevel,
        next: t.next,
        ready: w.open ? t.ready : 0,
        resetsOnClaim: t.resetsOnClaim,
      })),
      daily: w.daily ? { name: human(w.daily.name), done: w.daily.done } : null,
      ready: w.open ? w.tasks.reduce((n, t) => n + t.ready, 0) : 0,
      merits: shop?.unspent ?? null,
      // A row without a price is the game's placeholder ("IDK YET"): not a row to buy.
      shop: (shop?.rows ?? [])
        .filter((r) => r.cost !== null)
        .map((r) => ({
          index: r.index,
          text: tb.meritText[w.world - 1]?.[r.index] ?? '',
          level: r.level,
          max: r.max,
          cost: r.cost,
        })),
    };
  });
  const tu = state.account.taskUnlocks ?? null;
  return {
    systemId: 'task-board',
    kind: 'task-board',
    worlds,
    ready: worlds.reduce((n, w) => n + w.ready, 0),
    unlocks: {
      owned: tb.unlockPoints.owned,
      bought: tb.unlockPoints.bought,
      openUnbought: tu?.openUnbought ?? null,
      progress: tb.unlockPoints.progress,
      nextAt: tb.unlockPoints.nextAt,
    },
  };
}
