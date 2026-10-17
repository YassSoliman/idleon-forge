// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Roles (M2 FR-7, FR-23, FR-24, TR-9, TR-12): which character does which job on the Meta Path, the
// Role-owner lookup M5 uses for "better fit", and the Visit Order hints Roles imply.
import type { AccountState } from '@idleon-forge/account-state';
import { type StageId, stageIndex } from '@idleon-forge/knowledge';
import { classTree, ENTRY, roleDefs } from './knowledge';
import type { FactLookup, MetaPathResult, RoleAssignment, RosterResult, VisitHint } from './types';

/** The role id the pusher carries (FR-7, S5); pusher-candidate Roles only name the classes Sources argue for. */
export const PUSHER_ROLE = 'pusher';
const CANDIDATE_ROLE = 'pusher-candidate';
const SECOND_SUFFIX = '-2nd';

/** Role entry slug -> subclass line: role-squire -> Squire. */
const lineOfEntry = (entryId: string) => {
  const slug = entryId.slice(ENTRY.rolePrefix.length);
  return slug.charAt(0).toUpperCase() + slug.slice(1);
};

/** FR-7, TR-9: Roles per character index. A Role a later Stage activates is listed, but not active. */
export function assignRoles(
  state: AccountState,
  kb: FactLookup,
  stage: StageId | null,
  roster: RosterResult,
  pusher: number | null,
): Record<number, RoleAssignment[]> {
  const tree = classTree(kb);
  const at = stage === null ? -1 : stageIndex(stage);
  const classOf = new Map(
    state.characters.map((c) => [
      c.index,
      c.classIndex == null ? null : (tree.byIndex.get(c.classIndex)?.class ?? null),
    ]),
  );
  const holderOf = (line: string) =>
    roster.slots.find((s) => s.line === line && s.status === 'on-path' && s.note === null)?.characterIndex ??
    null;
  const secondSquire = roster.slots.find((s) => s.note === 'second-squire')?.characterIndex ?? null;

  const out: Record<number, RoleAssignment[]> = {};
  for (const c of state.characters) out[c.index] = [];
  for (const r of roleDefs(kb)) {
    if (r.id === CANDIDATE_ROLE) continue;
    const holder = r.id.endsWith(SECOND_SUFFIX) ? secondSquire : holderOf(lineOfEntry(r.entryId));
    if (holder === null) continue;
    const cls = classOf.get(holder);
    if (!cls || !tree.isA(cls, r.classLine)) continue;
    out[holder]?.push({
      role: r.id,
      afkType: r.owns[0] ?? null,
      active: at >= stageIndex(r.activeFrom),
      entryId: r.entryId,
    });
  }
  if (pusher !== null)
    out[pusher]?.unshift({ role: PUSHER_ROLE, afkType: 'FIGHTING', active: true, entryId: ENTRY.pusherRule });
  return out;
}

/** Friendly activity names -> the AFK type or Parallel Slot a Role owns. */
const ALIASES: Record<string, string> = {
  trapping: 'parallel:trap',
  trap: 'parallel:trap',
  construction: 'parallel:cog',
  cog: 'parallel:cog',
  worship: 'parallel:worship',
  alchemy: 'parallel:cauldron',
  cauldron: 'parallel:cauldron',
  printer: 'parallel:printer',
};
const norm = (a: string) => {
  const k = a.trim().toLowerCase();
  return ALIASES[k] ?? (k.startsWith('parallel:') ? k : k.toUpperCase());
};

/**
 * FR-23: the characters whose active Roles own `activity`, an AFK type ("FISHING") or a Parallel Slot
 * ("parallel:trap", or "trap" / "Trapping"). For M5's "better fit".
 */
export function roleOwnersOf(result: Pick<MetaPathResult, 'roles'>, activity: string): number[] {
  const want = norm(activity);
  return Object.entries(result.roles)
    .filter(([, roles]) => roles.some((r) => r.active && r.afkType !== null && norm(r.afkType) === want))
    .map(([i]) => Number(i))
    .sort((a, b) => a - b);
}

/**
 * FR-24, TR-12: Visit Order hints from Roles. Pooling Roles (Worship with Charge Syphon) visit after the
 * characters they pool from. Cooldown Roles and the Eagle Eye trap-stop skip need talent and cooldown
 * fields the Account State does not carry yet, so they are not emitted (see the M2 PR).
 */
export function visitHints(
  state: AccountState,
  kb: FactLookup,
  roles: Record<number, RoleAssignment[]>,
): VisitHint[] {
  const defs = new Map(roleDefs(kb).map((r) => [`${r.entryId}#${r.id}`, r]));
  const hints: VisitHint[] = [];
  for (const [i, list] of Object.entries(roles)) {
    const index = Number(i);
    for (const r of list) {
      if (!r.active || defs.get(`${r.entryId}#${r.role}`)?.visitHint !== 'pool-after') continue;
      hints.push({
        characterIndex: index,
        kind: 'pool-after',
        after: state.characters.map((c) => c.index).filter((x) => x !== index),
        roleId: r.role,
        provenance: { entryIds: [r.entryId], fields: ['characters[*].classIndex'] },
      });
    }
  }
  return hints;
}
