// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-C15 (owner Q2, DS-25): the empty star tab as ONE account Goal. A character whose preset has no
// star points while its other preset has some, and that preset's star total (Toolbox's own,
// `starPoints`) leaves more than 1 point unspent. Account-wide, so one line for the account with one
// detail per character (#70 A5); never repeated on each character. Pure arithmetic on save data.
import { type AccountState, type CharacterState, humanize } from '@idleon-forge/account-state';
import { type CheckFinding, characterSubject, defineDetector } from '@idleon-forge/knowledge';
import { z } from 'zod';
import { PRESET_LEVEL } from './analyze';
import { STAR_TOLERANCE } from './path';

const ACCOUNT = { kind: 'account' } as const;

export interface StarEmpty {
  index: number;
  /** Unspent star points on the empty preset (exact). */
  points: number;
  /** Whether the empty preset is the one in use. */
  active: boolean;
}

const spentOf = (star: readonly { base: number }[]) => star.reduce((s, x) => s + x.base, 0);

/** The characters with one empty star tab and points waiting on it, in save order. */
export function starEmptyCharacters(state: AccountState): StarEmpty[] {
  const out: StarEmpty[] = [];
  for (const c of state.characters as CharacterState[]) {
    const t = c.talents;
    if (!t?.other || c.level < PRESET_LEVEL) continue;
    const a = spentOf(t.active.star);
    const o = spentOf(t.other.star);
    const pick = a === 0 && o > 0 ? 'active' : o === 0 && a > 0 ? 'other' : null;
    if (!pick) continue;
    // ADR 0010's exact star count when the Account State has one, else Toolbox's starTotal.
    const exact = (pick === 'active' ? t.active : t.other).talentPoints?.star;
    const total =
      exact && exact.confidence !== 'bound' && exact.total !== null
        ? exact.total
        : (t.starPoints?.[pick] ?? null);
    if (total === null || total <= STAR_TOLERANCE.high) continue;
    out.push({ index: c.index, points: total, active: pick === 'active' });
  }
  return out;
}

/** FR-C15: one account finding (the count), then one finding per character for the details. */
export const starEmptyDetector = defineDetector({
  id: 'builds/star-empty',
  kind: 'engine',
  system: 'builds',
  params: z.strictObject({}),
  slots: z
    .strictObject({ count: z.number(), points: z.number(), who: z.string(), preset: z.string() })
    .partial(),
  reads: ['characters[*].talents', 'characters[*].class', 'characters[*].level'],
  examples: { fires: [{ fixture: 'scrubbed-w2', subject: ACCOUNT }], silent: [] },
  run: ({ state }) => {
    const list = starEmptyCharacters(state);
    if (list.length === 0) return [{ subject: ACCOUNT, slots: {}, result: 'pass' }];
    const who = (i: number) => {
      const c = state.characters.find((x) => x.index === i);
      return c ? `${humanize(c.class)} ${c.level}` : `Character ${i + 1}`;
    };
    return [
      {
        subject: ACCOUNT,
        slots: { count: list.length, points: list.reduce((s, x) => s + x.points, 0) },
        result: 'fires',
        urgency: 'banked',
        doneKey: `star-empty:${list.map((x) => `${x.index}-${x.points}`).join(',')}`,
      },
      ...list.map(
        (x): CheckFinding => ({
          subject: characterSubject(x.index),
          slots: { who: who(x.index), points: x.points, preset: x.active ? 'in use' : 'other' },
          result: 'fires',
        }),
      ),
    ];
  },
});
