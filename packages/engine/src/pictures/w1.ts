// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 4: the World 1 core System pages' pictures, built from Account State (Toolbox numbers and
// arithmetic, ADR 0005). Advice-free: the pages' answers are their Checks.
import type { AccountState } from '@idleon-forge/account-state';
import {
  bigWord,
  MEGAFEATHER_WORDS,
  owlAffordable,
  owlBonusWord,
  owlNextBonus,
  owlNotStarted,
} from '@idleon-forge/knowledge';
import type { OwlPicture } from './w1-types';

const human = (s: string) => s.replace(/_/g, ' ').trim();
const amount = (n: number, percent: boolean) =>
  `+${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}${percent ? '%' : ''}`;

/** M26 FR-51: Orion's feathers, upgrades, bonuses and Megafeathers. */
export function owlPicture(state: AccountState): OwlPicture | null {
  const o = state.account.owl;
  if (!o) return null;
  const locked = o.upgrades.find((u) => !u.unlocked);
  const next = owlNextBonus(o);
  const L = o.bonusesLevel;
  return {
    systemId: 'owl',
    kind: 'owl',
    started: !owlNotStarted(o),
    feathers: bigWord(o.feathers),
    rate: bigWord(o.featherRate),
    progress: bigWord(o.progress),
    megafeathers: o.megafeathers,
    restarts: o.restarts,
    shiny: o.shiny,
    bonusesLevel: L,
    multiplier: `x${Number(o.bonusMultiplier.toPrecision(4)).toLocaleString('en-US')}`,
    nextUnlock: locked ? { name: human(locked.name), at: bigWord(locked.unlockAt) } : null,
    nextBonus: next ? owlBonusWord(next) : null,
    upgrades: o.upgrades.map((u) => ({
      index: u.index,
      name: human(u.name),
      level: u.level,
      cost: bigWord(u.cost),
      unlockAt: bigWord(u.unlockAt),
      unlocked: u.unlocked,
      affordable: owlAffordable(o, u.index),
    })),
    bonuses: o.bonuses.map((b) => ({
      name: b.name,
      value: amount(b.value, b.percent),
      // The next level L' > L with L' - 1 = offset (mod 6) raises this stat.
      nextAt: L + 1 + ((((b.offset - L) % 6) + 6) % 6),
    })),
    megas: MEGAFEATHER_WORDS.map((words, i) => ({ n: i + 1, words, owned: o.megafeathers > i })),
  };
}
