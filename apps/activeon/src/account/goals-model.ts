// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the Goals page's view (canvas board Goals), pure: the account's Goals as the Now view ranks them
// (skips and dismissals applied, unfolded), the top three first, then the rest in three groups by the
// Goal's category, each in rank order. It ranks nothing itself. "On one character" is each character's
// first Goal that isn't a fix, in Visit Order. M6's urgency (losing now) comes from the engine result.

import type { GoalView, NowView } from '@idleon-forge/engine/now';
import type { Category, ClassFamily, EngineResult } from '@idleon-forge/engine/result';
import { systemGameArt } from '../art/game/system-art';
import { spriteOf } from '../art/sprites';
import { GOALS_WORDS as W } from './words';

export type GroupId = 'spendable' | 'compounding' | 'nice';
export const GROUP_ORDER: readonly GroupId[] = ['spendable', 'compounding', 'nice'];

export interface GoalRow {
  goal: GoalView;
  /** "Colosseum", the System's name. */
  system: string;
  /** Two letters for the System's tile, where the sprite kit has no drawing for it. */
  mono: string;
  /** The System's sprite (`sys-<id>`), or null. */
  sprite: string | null;
  tone: 'losing' | 'do' | 'extra';
  /** "being lost now", or null. */
  urgency: string | null;
  group: GroupId;
}

export interface CharacterGoal {
  index: number;
  who: string;
  family: ClassFamily | null;
  text: string;
}

export interface GoalsPage {
  total: number;
  blockers: GoalView[];
  three: GoalRow[];
  groups: { id: GroupId; rows: GoalRow[]; count: number }[];
  oneCharacter: CharacterGoal[];
  skippedKeys: string[];
  dismissed: number;
}

const groupOf = (c: Category): GroupId =>
  c === 'spendable' ? 'spendable' : c === 'nice' ? 'nice' : 'compounding';

export const monogram = (name: string) => {
  const words = name.split(/[\s-]+/).filter((w) => /^[A-Za-z0-9]/.test(w));
  const a = words[0] ?? '';
  const b = words[1] ?? '';
  return (b ? `${a.charAt(0)}${b.charAt(0)}` : a.slice(0, 2)).toUpperCase() || '?';
};

const ONE_CHARACTER_CAP = 6;

export function goalsPage(result: EngineResult, view: NowView): GoalsPage {
  const acct = view.account;
  const urgencyOf = new Map(result.account.goals.map((g) => [g.nextAction.key, g.urgency]));
  const systemName = (id: string) => result.systems?.find((s) => s.id === id)?.name ?? null;
  const row = (g: GoalView): GoalRow => {
    const u = urgencyOf.get(g.action.key);
    const system = systemName(g.system) ?? g.title;
    const group = groupOf(g.category);
    return {
      goal: g,
      system,
      mono: monogram(system),
      sprite: spriteOf(`sys-${g.system}`) || systemGameArt(g.system) ? `sys-${g.system}` : null,
      tone: u === 'losing-now' ? 'losing' : group === 'nice' ? 'extra' : 'do',
      urgency: u === 'losing-now' ? W.losingNow : u === 'lost-before-return' ? W.lostBefore : null,
      group,
    };
  };
  const rows = acct.goals.map(row);
  const three = rows.slice(0, 3);
  const after = rows.slice(3);
  const groups = GROUP_ORDER.map((id) => ({
    id,
    rows: after.filter((r) => r.group === id),
    count: rows.filter((r) => r.group === id).length,
  }));

  const oneCharacter: CharacterGoal[] = [];
  for (const i of result.visitOrder) {
    const c = result.characters.find((x) => x.index === i);
    const g = c?.goals.find((x) => x.category !== 'blocker');
    if (!c || !g) continue;
    oneCharacter.push({
      index: c.index,
      who: `${c.classLabel} ${c.level}`,
      family: result.classFamilies?.[c.index] ?? null,
      text: g.nextAction.text,
    });
    if (oneCharacter.length >= ONE_CHARACTER_CAP) break;
  }

  return {
    total: acct.goals.length + acct.hiddenCount,
    blockers: acct.blockers,
    three,
    groups,
    oneCharacter,
    skippedKeys: acct.skippedKeys,
    dismissed: acct.dismissed.length,
  };
}
