// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-2: the class EXP a kill gives, as Toolbox computes it: the monster's `ExpGiven` from Toolbox's
// game data times `getClassExpMulti(character)` (ADR 0005: Toolbox numbers, plain arithmetic on them).
import { monsters } from '@website-data';
import { getClassExpMulti } from '../vendor/parsers/character';

/** A monster's base class EXP per kill (`monsters.json` `ExpGiven`); null for an id the pin doesn't know. */
export function monsterExpGiven(rawName: string): number | null {
  const m = (monsters as Record<string, { ExpGiven?: unknown }>)[rawName];
  const v = m?.ExpGiven;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Toolbox `getClassExpMulti(character, account, characters).value`; null when it isn't a finite number. */
export function classExpMulti(character: unknown, account: unknown, characters: unknown[]): number | null {
  const r = getClassExpMulti(character, account, characters) as { value?: unknown } | undefined;
  const v = r?.value;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
