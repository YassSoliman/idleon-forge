// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The one time language and the one coin format, for components (M21 FR-F6, FR-F7, DS-6, TR-2).
// Everything is the engine's formatter (packages/knowledge/src/template.ts through engine/now), so a
// component's "in 14h 04m" and a Knowledge Base sentence's never disagree. This file formats nothing
// itself; `moment` only picks between two engine formats by the player's "Times" preference (G10).
// The format guard test (TR-15) fails any other app file that formats a duration or a clock itself.
import { aboutDuration, agoSpan, clockAt, formatCoins, inSpan } from '@idleon-forge/engine/now';

export {
  aboutDuration,
  agoSpan,
  clockAt,
  compact,
  formatCoins,
  inSpan,
  plural,
  span,
} from '@idleon-forge/engine/now';

/** The "Times" preference (G10): a relative countdown, or the clock time ("around 20:10"). */
export type TimeStyle = 'relative' | 'clock';

/** The player's offset from UTC in minutes (east positive), for clock times. */
export const localOffsetMinutes = (at: number): number => -new Date(at).getTimezoneOffset();

/**
 * A future moment, as the UI prints it: "in 14h 04m", or "around 20:10" with the clock preference.
 * `tzOffsetMinutes` is passed in (tests and goldens use 0); the UI passes `localOffsetMinutes(at)`.
 */
export function moment(at: number, now: number, style: TimeStyle, tzOffsetMinutes: number): string {
  return style === 'clock' ? `around ${clockAt(at, tzOffsetMinutes)}` : inSpan(at - now);
}

/** A past moment: "8h 30m ago". Ages are always relative. */
export const ago = (at: number, now: number): string => agoSpan(now - at);

/** Effort, an estimated task length: "about 10m". */
export const effort = (seconds: number): string => aboutDuration(seconds);

/** Coins with a short suffix ("100M coins"); never the game's tier names (DS-16). */
export const coins = (n: number): string => formatCoins(n);
