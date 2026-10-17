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

/** Shown when the AFK Target is an id the parser doesn't know yet (never "No AFK target set"). */
export const UNKNOWN_ACTIVITY = 'AFK target unknown (the game may have updated)';

/** What the character progresses while away, e.g. "Fighting · Purp Mushroom". */
export function describeActivity(c: Pick<CharacterState, 'afkType' | 'afkTarget'>): string {
  if (c.afkType === null) return UNKNOWN_ACTIVITY;
  const label = AFK_LABELS[c.afkType] ?? humanize(c.afkType);
  if (!c.afkTarget) return label;
  const target = humanize(c.afkTarget);
  // Skilling stations often name the target after the skill ("Laboratory", "Cooking").
  const redundant = [label, humanize(c.afkType)].some((l) => l.toLowerCase().includes(target.toLowerCase()));
  return redundant ? label : `${label} · ${target}`;
}

/** No snapshot for this long during live sync: hint to refresh (FR-26; the game saves every ~4 min). */
export const STALE_SNAPSHOT_MS = 6 * 60_000;
/** A last cloud save older than this means the game is probably closed (FR-27). */
export const GAME_CLOSED_MS = 30 * 60_000;

export const HINT_SWITCH =
  'No new save for a while: press Cloud Save or switch character in the game to refresh.';
export const HINT_OPEN_GAME = 'Open the game and switch character to refresh.';

export interface FreshnessInput {
  now: number;
  source: 'live' | 'paste' | null;
  /** The save's own last cloud save (epoch ms). */
  lastCloudSave: number | null;
  /** When the last live snapshot arrived (epoch ms, local clock). */
  lastSnapshotAt: number | null;
}

/** The refresh hint under the header, or null (FR-26, FR-27). Only for live sync. */
export function freshnessHint({ now, source, lastCloudSave, lastSnapshotAt }: FreshnessInput): string | null {
  if (source !== 'live') return null;
  if (lastCloudSave !== null && now - lastCloudSave > GAME_CLOSED_MS) return HINT_OPEN_GAME;
  if (lastSnapshotAt !== null && now - lastSnapshotAt > STALE_SNAPSHOT_MS) return HINT_SWITCH;
  return null;
}
