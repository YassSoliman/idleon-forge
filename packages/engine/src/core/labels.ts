// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Display labels for a character's class and AFK Target ("Mining Copper", "Tunnels Entrance").
import { type CharacterState, humanize } from '@idleon-forge/account-state';

const AFK_VERBS: Record<string, string> = {
  FIGHTING: 'Fighting',
  MINING: 'Mining',
  CHOPPIN: 'Choppin',
  FISHING: 'Fishing',
  CATCHING: 'Catching',
  COOKING: 'Cooking',
  LABORATORY: 'In the Lab',
  DIVINITY: 'Divinity',
  SPELUNKING: 'Spelunking',
  Paying_Respect: 'Paying respect',
};

/** Shown when the AFK Target is an id the parser doesn't know yet. */
export const UNKNOWN_ACTIVITY = 'AFK target unknown';
/** M10 §6: a character with no AFK Target. */
export const NO_ACTIVITY = 'Doing nothing';

/** "Mining Copper", "Fighting Poop", "In the Lab", "Doing nothing". */
export function activityLabel(c: Pick<CharacterState, 'afkType' | 'afkTarget'>): string {
  if (c.afkType === null) return UNKNOWN_ACTIVITY;
  if (c.afkType === 'Nothing') return NO_ACTIVITY;
  const verb = AFK_VERBS[c.afkType] ?? humanize(c.afkType);
  if (!c.afkTarget) return verb;
  const target = humanize(c.afkTarget);
  // Skilling stations often name the target after the skill ("Laboratory", "Cooking").
  const redundant = [verb, humanize(c.afkType)].some((l) => l.toLowerCase().includes(target.toLowerCase()));
  return redundant ? verb : `${verb} ${target}`;
}

export const mapLabel = (c: Pick<CharacterState, 'currentMap'>): string | null =>
  c.currentMap ? humanize(c.currentMap) : null;

export const classLabel = (c: Pick<CharacterState, 'class'>): string => humanize(c.class);
