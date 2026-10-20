// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-6: one `unlocked(system)` guard keyed on each System's own unlock fact. `currentWorld` is only
// the fallback when the fact can't be read or the Account State has no field for it yet: raw counters
// tick on locked accounts (R8), and a save made just before a new world reads the old `currentWorld`
// (R5), so a world number alone is the weakest evidence. The engine core silences every Goal of a System
// with an entry here while this says 'no'; the `systems/unlocked` milestone Detector is its registry face.
import type { AccountState } from '@idleon-forge/account-state';
import { isKnown } from '@idleon-forge/account-state';

export type UnlockState = 'yes' | 'no' | 'unknown';

/** true / false when the save says so, null when it can't (unread, or no Account State field yet). */
type UnlockFact = (state: AccountState) => boolean | null;

interface UnlockRule {
  /** The world whose reach is the fallback. */
  world: number;
  /** Account State paths the fact reads (provenance). */
  reads: readonly string[];
  fact: UnlockFact;
  /**
   * Entry ids that are the unlock step itself (the quest to open the System): they stay live while the
   * System reads locked, or the guard would hide the one thing that opens it.
   */
  opens?: readonly string[];
}

const known = (s: AccountState, path: string) => isKnown(s, path);

/** Any character uploaded into the Lab (in a tube): the Lab is built. No tube is not proof of a locked Lab. */
const labFact: UnlockFact = (s) => {
  const lab = known(s, 'account.lab') ? s.account.lab : null;
  return lab?.characters.some((c) => c.uploaded) ? true : null;
};

/**
 * Breeding has started: a level above 0, or more than the one species Toolbox reports before any breed
 * (a World 3 save reads `speciesBred` 1). A read Breeding at level 0 with one species: not started.
 */
const breedingFact: UnlockFact = (s) => {
  const b = known(s, 'account.breeding') ? s.account.breeding : null;
  if (!b) return null;
  // `started` (M26 FR-8) is Breeding level > 0; hand-built states may lack it.
  return b.started ?? (b.level > 0 || b.speciesBred > 1);
};

/**
 * Cooking in use: a kitchen cooking or on a recipe, an upgrade bought, or a meal levelled. Toolbox reads
 * kitchen 0 as `idle` on a World 3 save, so an idle kitchen alone is not proof; every kitchen locked is.
 */
const cookingFact: UnlockFact = (s) => {
  const c = known(s, 'account.cooking') ? s.account.cooking : null;
  if (!c || c.kitchens.length === 0) return null;
  if (c.kitchens.every((k) => k.status === 'locked')) return false;
  const used =
    c.kitchens.some(
      (k) => k.status === 'cooking' || k.status === 'recipe' || k.speedLv + k.fireLv + k.luckLv > 0,
    ) || c.meals.some((m) => m.level > 0);
  return used ? true : null;
};

/**
 * Lab node 12 (Sigils of Olden Alchemy) lit, or a character seated on a sigil (cauldron seat >= 100).
 * Sigil progress has no Account State field before Wave 2 (`account.sigils`), so neither is not proof.
 */
const sigilsFact: UnlockFact = (s) => {
  const lab = known(s, 'account.lab') ? s.account.lab : null;
  if (lab?.bonuses.some((n) => n.index === 12 && n.lit)) return true;
  return s.characters.some((c) => (c.slots?.cauldron ?? -1) >= 100) ? true : null;
};

/** M26 FR-8's authored reader: the Mirror held, or a Dream Upgrade with a level. */
const equinoxFact: UnlockFact = (s) =>
  known(s, 'account.equinoxUnlocked') ? (s.account.equinoxUnlocked ?? null) : null;

/** M26 FR-11: the Rift Ripper's quest done on a character, or a Rift level completed (`account.rift`). */
const riftFact: UnlockFact = (s) => {
  const r = known(s, 'account.rift') ? s.account.rift : null;
  return r ? r.unlocked : null;
};

/** No Account State field yet: the world fallback decides (named so the gap is visible). */
const notYet: UnlockFact = () => null;

/**
 * The Systems with an own unlock fact (spec FR-6). Islands (`islands/unlocked`) has no Account State
 * field yet, so it falls back to its world until its reader lands.
 */
export const UNLOCK_RULES: Readonly<Record<string, UnlockRule>> = {
  lab: { world: 4, reads: ['account.lab'], fact: labFact },
  breeding: { world: 4, reads: ['account.breeding'], fact: breedingFact },
  cooking: { world: 4, reads: ['account.cooking'], fact: cookingFact },
  sigils: { world: 4, reads: ['account.lab'], fact: sigilsFact },
  rift: { world: 4, reads: ['account.rift'], fact: riftFact, opens: ['rift.check.unlock-quest'] },
  equinox: { world: 3, reads: ['account.equinoxUnlocked'], fact: equinoxFact },
  islands: { world: 2, reads: [], fact: notYet },
};

/** Whether entry `id` is `system`'s unlock step, which the lock guard keeps (`UnlockRule.opens`). */
export const opensSystem = (system: string, id: string): boolean =>
  UNLOCK_RULES[system]?.opens?.includes(id) ?? false;

/** Whether `system` has an own unlock rule (its Checks are silent while it says 'no'). */
export const hasUnlockRule = (system: string): boolean => Object.hasOwn(UNLOCK_RULES, system);

/**
 * `system`'s unlock state on this account: its own fact, else whether `currentWorld` reached the
 * rule's world; 'unknown' when neither can be read. A System with no rule is 'yes' (nothing to guard).
 */
export function unlocked(system: string, state: AccountState): UnlockState {
  const rule = UNLOCK_RULES[system];
  if (!rule) return 'yes';
  let fact: boolean | null;
  try {
    fact = rule.fact(state);
  } catch {
    fact = null;
  }
  if (fact !== null) return fact ? 'yes' : 'no';
  const world = known(state, 'account.currentWorld') ? state.account.currentWorld : null;
  if (world === null || world === undefined) return 'unknown';
  return world >= rule.world ? 'yes' : 'no';
}
