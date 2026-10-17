// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Turns the per-run section outcomes of one parse into the list of sections that failed.

/**
 * A section counts as failed only if its last run failed: parseData runs its dynamic sections in
 * three passes, and a section that throws on pass 1 (before its cross-dependencies exist) and then
 * succeeds has recovered. Each failed section is listed once, in the order it first ran.
 */
export function finalFailures(outcomes: ReadonlyArray<readonly [name: string, ok: boolean]>): string[] {
  const last = new Map<string, boolean>();
  for (const [name, ok] of outcomes) last.set(name, ok);
  return [...last].filter(([, ok]) => !ok).map(([name]) => name);
}

/** At most 200 characters of a message, with nothing but text (TR-23: no object dumps of a save). */
export function truncateMessage(msg: unknown, max = 200): string {
  const text = typeof msg === 'string' ? msg : msg instanceof Error ? msg.message : String(msg);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
