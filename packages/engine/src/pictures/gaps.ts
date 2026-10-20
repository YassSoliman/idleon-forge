// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 2, the W2/W3 gaps: each page's read-only picture, built from Account State in the worker's
// `pictures` step. Advice-free: the Next Actions come from the System's Checks.
import type { AccountState, ForgeItem } from '@idleon-forge/account-state';
import type { ForgeItemView, ForgePicture } from './gaps-types';

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
