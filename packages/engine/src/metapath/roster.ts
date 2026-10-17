// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Roster analysis (M2 FR-6 to FR-10, TR-8): each character on a Meta Path slot, the missing subclass
// lines, the next new character and its family-level gate, and the one Sub Class Swap Token case.
// Class composition is read from `classIndex` through classes.fact.class-tree, never assumed (R4).
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { type StageId, stageIndex } from '@idleon-forge/knowledge';
import { type ClassTree, classTree, familySlots, type RoleDef, roleDefs, slotPlan } from './knowledge';
import type { FactLookup, NextCharacter, RosterResult, RosterSlot } from './types';

/** Level a Beginner needs to pick a class, and a base class to hold a line tentatively (FR-6, FR-15). */
export const CLASS_PICK_LEVEL = 10;

interface Holder {
  c: CharacterState;
  cls: string;
}

const byLevel = (a: Holder, b: Holder) => b.c.level - a.c.level || a.c.index - b.c.index;

/** The six subclass lines of slots 1–6, in the #15 slot order (from the slot plan entry). */
export function subclassLines(kb: FactLookup): { line: string; slot: number }[] {
  return slotPlan(kb)
    .flatMap((s) => (typeof s.slot === 'number' && s.slot <= 6 ? [{ line: s.classLine, slot: s.slot }] : []))
    .sort((a, b) => a.slot - b.slot);
}

/** The slot plan's contested 9–10 options (2nd Arcane Cultist, Death Bringer, Elemental Sorcerer). */
function contestedOptions(kb: FactLookup): string[] {
  return slotPlan(kb).flatMap((s) => (typeof s.slot === 'object' ? [s.classLine] : []));
}

function slotOf(kb: FactLookup, line: string, ordinal: 1 | 2): number | null {
  const hits = slotPlan(kb)
    .filter((s) => s.classLine === line && typeof s.slot === 'number')
    .map((s) => s.slot as number)
    .sort((a, b) => a - b);
  return hits[ordinal - 1] ?? null;
}

/** Whether a promotion of `line` is one of the contested late-slot classes. */
const reachesContested = (tree: ClassTree, line: string, options: string[]) =>
  options.some((o) => tree.isA(o, line));

/** The earliest Stage any of a line's own Roles activates (FR-8), as an index; +∞ with no Role. */
function earliestRole(roles: RoleDef[], line: string): number {
  const own = roles.filter((r) => r.classLine === line && r.id !== 'pusher-candidate');
  return own.length ? Math.min(...own.map((r) => stageIndex(r.activeFrom))) : Number.POSITIVE_INFINITY;
}

export function analyzeRoster(state: AccountState, kb: FactLookup, stage: StageId | null): RosterResult {
  const tree = classTree(kb);
  const lines = subclassLines(kb);
  const lineNames = lines.map((l) => l.line);
  const options = contestedOptions(kb);
  const slots = new Map<number, RosterSlot>();
  const set = (c: CharacterState, s: Omit<RosterSlot, 'characterIndex'>) =>
    slots.set(c.index, { characterIndex: c.index, ...s });

  // Group characters by their subclass line, the Journeyman line, base classes and Beginners.
  const byLine = new Map<string, Holder[]>();
  const base: Holder[] = [];
  for (const c of state.characters) {
    const row = c.classIndex == null ? undefined : tree.byIndex.get(c.classIndex);
    if (!row) {
      set(c, { slot: null, line: null, status: 'unknown', note: null });
      continue;
    }
    if (row.tier === 'beginner') {
      set(c, { slot: slotOf(kb, 'Beginner', 1), line: null, status: 'beginner', note: null });
      continue;
    }
    const line = row.line === 'Journeyman' ? 'Journeyman' : tree.subclassLineOf(row.class);
    if (line === null) {
      base.push({ c, cls: row.class });
      continue;
    }
    byLine.set(line, [...(byLine.get(line) ?? []), { c, cls: row.class }]);
  }
  for (const list of byLine.values()) list.sort(byLevel);

  // Slots 1–6: the highest-level character of each line; Journeyman: slot 7 (TR-8).
  const hasBarbarian = (byLine.get('Barbarian')?.length ?? 0) > 0;
  for (const [line, holders] of byLine) {
    holders.forEach((h, i) => {
      if (i === 0) set(h.c, { slot: slotOf(kb, line, 1), line, status: 'on-path', note: null });
      // FR-10, PV 1.1: a 2nd Squire is on the Meta Path when the account also has a Barbarian.
      else if (line === 'Squire' && i === 1 && hasBarbarian)
        set(h.c, { slot: slotOf(kb, 'Squire', 2), line, status: 'on-path', note: 'second-squire' });
      else if (line !== 'Journeyman' && reachesContested(tree, line, options))
        set(h.c, { slot: 9, line, status: 'contested', note: null });
      else set(h.c, { slot: null, line, status: 'off-path', note: null });
    });
  }

  // FR-6: a base class at level >= 10 tentatively holds the first missing line it can become.
  const held = new Set(byLine.keys());
  for (const h of [...base].sort(byLevel)) {
    const row = tree.byName.get(h.cls);
    const target =
      h.c.level >= CLASS_PICK_LEVEL
        ? lineNames.find((l) => !held.has(l) && (row?.promotesTo ?? []).includes(l))
        : undefined;
    if (target) {
      held.add(target);
      set(h.c, { slot: slotOf(kb, target, 1), line: target, status: 'tentative', note: null });
    } else set(h.c, { slot: null, line: null, status: 'tentative', note: null });
  }
  const tentative = new Set(
    [...slots.values()].filter((s) => s.status === 'tentative' && s.line).map((s) => s.line as string),
  );

  const linesPresent = lineNames.filter((l) => held.has(l));
  const missingLines = lineNames.filter((l) => !held.has(l));

  // Family slots (FR-9): slot 1 is always open.
  const familyLevel = state.account.familyLevel ?? null;
  const gates = familySlots(kb);
  const slotsUnlocked =
    familyLevel === null ? null : 1 + gates.filter((g) => g.familyLevel <= familyLevel).length;
  const charactersUsed = state.characters.length + state.diagnostics.unreadableCharacters.length;

  // FR-8: the missing line whose earliest Role is needed soonest; ties in the #15 slot order. Then
  // Journeyman, then the 2nd Squire.
  const roles = roleDefs(kb);
  const now = stage === null ? 0 : stageIndex(stage);
  let nextLine: string | null = null;
  const missing = missingLines.filter((l) => !tentative.has(l));
  if (missing.length) {
    nextLine = [...missing].sort(
      (a, b) =>
        Math.max(earliestRole(roles, a), now) - Math.max(earliestRole(roles, b), now) ||
        lineNames.indexOf(a) - lineNames.indexOf(b),
    )[0] as string;
  } else if (missingLines.length === 0) {
    if (!byLine.has('Journeyman')) nextLine = 'Journeyman';
    else if (![...slots.values()].some((s) => s.note === 'second-squire')) nextLine = 'Squire';
  }
  let nextCharacter: NextCharacter | null = null;
  const slotNumber = charactersUsed + 1;
  if (nextLine && slotNumber <= gates.length + 1) {
    const baseClass =
      nextLine === 'Journeyman' ? 'Journeyman' : (tree.byName.get(nextLine)?.promotesFrom ?? nextLine);
    const open = slotsUnlocked !== null && charactersUsed < slotsUnlocked;
    const opensAt = open ? null : (gates.find((g) => g.slot === slotNumber)?.familyLevel ?? null);
    nextCharacter = {
      line: nextLine,
      baseClass,
      familyLevel,
      slotNumber,
      opensAt,
      gap: opensAt !== null && familyLevel !== null ? Math.max(0, opensAt - familyLevel) : null,
      slotOpen: open,
    };
  }

  // FR-10, Final rulings F17: a duplicate whose swap sibling the plan wants and the account lacks.
  let swapToken: RosterResult['swapToken'] = null;
  for (const line of lineNames) {
    const holders = byLine.get(line) ?? [];
    const sibling = tree.byName.get(line)?.swapSibling ?? null;
    if (holders.length < 2 || !sibling || held.has(sibling) || !lineNames.includes(sibling)) continue;
    const dup = holders[holders.length - 1] as Holder;
    const to = tree.byName.get(dup.cls)?.swapSibling;
    if (to) {
      swapToken = { characterIndex: dup.c.index, from: dup.cls, to };
      break;
    }
  }

  return {
    slots: state.characters.map((c) => slots.get(c.index) as RosterSlot),
    linesPresent,
    missingLines,
    charactersUsed,
    slotsUnlocked,
    nextCharacter,
    swapToken,
  };
}
