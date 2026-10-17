// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M9 test helpers: the compiled Knowledge Base, the M9 module and synthetic talent edits on the
// scrubbed saves (the W2-late and W3-early accounts, no names).
import type { AccountState, CharacterTalents, PresetTalents } from '@idleon-forge/account-state';
import { withAccount, withCharacter } from '@idleon-forge/knowledge';
import { createBuildsModule } from '../../src/builds';
import type { ModuleOutput } from '../../src/core/module';
import { kb } from '../afk/helpers';
import { input } from '../core/helpers';

export { kb };
export const m9 = createBuildsModule({ kb });

export const run = (s: AccountState, over: Parameters<typeof input>[1] = {}): ModuleOutput =>
  m9.run(input(s, { now: s.asOf, ...over }));

/** The rendered M9 Goals of one character: [title, text]. */
export const goalsOf = (out: ModuleOutput, index: number) =>
  (out.characters?.find((c) => c.index === index)?.goals ?? []).map((g) => [
    g.goal.title,
    g.goal.nextAction.text,
  ]);

export const goalOf = (out: ModuleOutput, index: number, entryId: string) =>
  out.characters?.find((c) => c.index === index)?.goals?.find((g) => g.goal.nextAction.entryId === entryId);

export const TALENT = {
  GILDED_SWORD: 6,
  MEAT_SHANK: 86,
  IDLE_BRAWLING: 88,
  POWER_STRIKE: 90,
  WHIRL: 91,
  FIRMLY_GRASP_IT: 94,
  BACK_TO_BASICS: 119,
} as const;

const talentsOf = (s: AccountState, index: number): CharacterTalents => {
  const t = s.characters.find((c) => c.index === index)?.talents;
  if (!t) throw new Error(`character ${index} has no talents`);
  return t;
};

/** Sets talent `id` to `base` on the character's active or other preset. */
export function setTalent(
  s: AccountState,
  index: number,
  which: 'active' | 'other',
  id: number,
  base: number,
): AccountState {
  const t = talentsOf(s, index);
  const p = t[which];
  if (!p) throw new Error(`character ${index} has no ${which} preset`);
  const next: PresetTalents = {
    ...p,
    tabs: p.tabs.map((tab) => ({
      ...tab,
      talents: tab.talents.map((x) => (x.id === id ? { ...x, base } : x)),
    })),
  };
  return withCharacter(s, index, { talents: { ...t, [which]: next } });
}

export function setBar(s: AccountState, index: number, bar: number[] | null): AccountState {
  const t = talentsOf(s, index);
  return withCharacter(s, index, { talents: { ...t, active: { ...t.active, attackBar: bar } } });
}

/** The save after a swap in game: the other preset becomes the active one. */
export function swapPresets(s: AccountState, index: number): AccountState {
  const t = talentsOf(s, index);
  if (!t.other) throw new Error('no other preset');
  return withCharacter(s, index, {
    talents: { ...t, selectedPreset: t.selectedPreset === 0 ? 1 : 0, active: t.other, other: t.active },
  });
}

export const withItems = (s: AccountState, potions: number, fragments: number) =>
  withAccount(s, { resetItems: { potions, fragments } });
