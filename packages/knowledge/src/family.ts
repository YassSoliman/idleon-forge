// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Which generated Goals a Contribution's `goalFamily` expands into (M4 TR-4, M11 TR-2b). `kb compile`
// makes one concrete Contribution per member and `kb check` requires at least one, so both use this.
//
// A family is named one of two ways:
//   - an id prefix: `upgrade-vault.goal.kill-row` matches `upgrade-vault.goal.kill-row` and
//     `upgrade-vault.goal.kill-row-*`;
//   - a generator: `cards.goal.card-levels` matches every generated Goal of the `cards` system made by
//     the `card-levels` generator (card and Death Note ladders have no shared id prefix).
// A member must also fit the Contribution: when the Goal names an AFK type (`values.afkType`), it is
// the Contribution's own; when it names a world (`values.world`), the world is one of the
// Contribution's Stages (an activity never serves a Goal of a world it doesn't apply to).
import type { Entry } from './schema';
import { STAGE_DEFINITIONS, STAGES, type StageId, stagesBetween } from './stages';

type ContributionLike = Extract<Entry, { type: 'contribution' }>;

const generatorOf = (g: Entry): string | null =>
  'generatedBy' in g && g.generatedBy && typeof g.generatedBy === 'object'
    ? ((g.generatedBy as { generator?: string }).generator ?? null)
    : null;

/** The highest world among the Contribution's Stages; null for `stages: all`. */
function maxWorld(c: Pick<ContributionLike, 'appliesTo'>): number | null {
  const s = c.appliesTo.stages;
  if (s === 'all') return null;
  const ids: StageId[] = s.flatMap((x) => (typeof x === 'string' ? [x] : stagesBetween(x.from, x.to)));
  if (ids.length === 0) return null;
  return Math.max(...ids.filter((id) => STAGES.includes(id)).map((id) => STAGE_DEFINITIONS[id].world));
}

/** The generated Goals `contribution.goalFamily` expands into, sorted by id. */
export function familyMembers<G extends Entry>(
  contribution: Pick<ContributionLike, 'goalFamily' | 'activity' | 'appliesTo'>,
  generated: readonly G[],
): G[] {
  const fam = contribution.goalFamily;
  if (!fam) return [];
  const [sys, , slug] = fam.split('.');
  const top = maxWorld(contribution);
  const afk = contribution.activity.afkType ?? null;
  return generated
    .filter((g) => g.type === 'goal' && 'origin' in g && g.origin === 'generated')
    .filter(
      (g) =>
        g.id === fam || g.id.startsWith(`${fam}-`) || (g.system === sys && generatorOf(g) === (slug ?? '')),
    )
    .filter((g) => {
      const v = g.values as Record<string, unknown>;
      if (typeof v.afkType === 'string' && afk !== null && v.afkType !== afk) return false;
      if (typeof v.world === 'number' && top !== null && v.world > top) return false;
      return true;
    })
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
