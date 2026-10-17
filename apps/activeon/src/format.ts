// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { type CharacterState, humanize } from '@idleon-forge/account-state';

/** 42 -> "42s", 300 -> "5m", 7300 -> "2h 1m", 200000 -> "2d". */
export function formatAge(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 120) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86_400)}d`;
}

const AFK_LABELS: Record<string, string> = {
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
  Nothing: 'No AFK target set',
};

/** What the character progresses while away, e.g. "Fighting · Purp Mushroom". */
export function describeActivity(c: Pick<CharacterState, 'afkType' | 'afkTarget'>): string {
  const label = AFK_LABELS[c.afkType] ?? humanize(c.afkType);
  if (!c.afkTarget) return label;
  const target = humanize(c.afkTarget);
  // Skilling stations often name the target after the skill ("Laboratory", "Cooking").
  const redundant = [label, humanize(c.afkType)].some((l) => l.toLowerCase().includes(target.toLowerCase()));
  return redundant ? label : `${label} · ${target}`;
}
