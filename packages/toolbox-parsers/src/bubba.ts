// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 X1 (ADR 0010): Toolbox's own Bubba parse, run on a raw record the caller may have edited (one level
// higher, happiness 0), plus the three game tables the derived values read. The arithmetic lives in
// @idleon-forge/account-state (src/bubba-x1.ts). Runs only in the parse worker (ADR 0006).
import { generalSpelunky } from '@website-data';
import { getBubba, SMOKER_MAX_QUALITY_SECONDS } from '../vendor/parsers/clickers/bubba';
import type { ToolboxBubba, ToolboxBubbaTables } from './types';

const numbers = (row: unknown): number[] => (Array.isArray(row) ? row.map((v) => Number(v)) : []);

/** Toolbox `getBubba` on this raw record (the save's `Bubba` array). null when it isn't an array. */
export function bubbaParse(rawBubba: unknown, account: unknown): ToolboxBubba | null {
  if (!Array.isArray(rawBubba)) return null;
  // getBubba JSON-parses the save's string, so hand it one.
  return getBubba({ Bubba: JSON.stringify(rawBubba) }, account) as ToolboxBubba;
}

/** The Charisma and gift tables from Toolbox's game data (`generalSpelunky`, the game's CustomLists.Spelunky). */
export function bubbaTables(): ToolboxBubbaTables {
  const s = generalSpelunky as unknown as unknown[][];
  return {
    charismaNames: Array.isArray(s?.[36]) ? s[36].map(String) : [],
    charismaPerLevel: numbers(s?.[37]),
    giftPassive: numbers(s?.[41]),
    smokerMaxQualitySeconds: SMOKER_MAX_QUALITY_SECONDS,
  };
}
