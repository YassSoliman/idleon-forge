// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Number, duration and age formatting shared by the components and the text renderer (M10 TR-1).
// Locale-free and deterministic, so golden snapshots don't depend on the machine.
//
// The number, coin and duration formats live in the Knowledge Base's template module, so a template's
// `{x:duration}` / `{x:coins}` and the engine's own strings print exactly the same words.
export {
  aboutDuration,
  compact,
  formatCoins,
  inSpan,
  shortDuration,
  span,
} from '@idleon-forge/knowledge/template';

/** 42 -> "42s", 300 -> "5m", 7300 -> "2h 1m", 200000 -> "2d". Ages clamp at 0 (clock skew). */
export function formatAge(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 120) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86_400)}d`;
}

/** "1 buy", "3 buys". */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "01:20" in the player's timezone (minutes east of UTC); deterministic for goldens at 0. */
export function clockAt(at: number, tzOffsetMinutes: number): string {
  const d = new Date(at + tzOffsetMinutes * 60_000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
