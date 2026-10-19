// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Planned Path (GLOSSARY): the one answer to "which class does this character take next, and after
// that". Built from the roster's slot assignment (M2 FR-6 to FR-10, `analyzeRoster`): the line the slot
// plan holds a character for decides its promotions. The class tree is only the fallback when the
// roster has no opinion, and even then a Beginner's options include the Journeyman, which the class
// table does not list as a Beginner promotion (M26 dossier class-journeyman, C3). Every view that
// names a character's next class (the roadmap, the Now cards, the Build note) reads this. Pure.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import type { StageId } from '@idleon-forge/knowledge';
import { type ClassRow, type ClassTree, classTree } from './knowledge';
import { analyzeRoster } from './roster';
import type { FactLookup, RosterResult } from './types';

/** How the next class is taken (the NPC or the quest chain that gives it). */
export type PromotionVia =
  | 'promotheus'
  | 'rocklyte'
  | 'speccius'
  | 'cactolyte'
  | 'eliteus'
  | 'nebulyte'
  | 'other';

export interface PlannedStep {
  class: string;
  state: 'done' | 'now' | 'next' | 'later';
}

export interface PlannedPath {
  characterIndex: number;
  /** The class now ("Beginner"). */
  class: string;
  /**
   * The line the slot plan holds the character for: a subclass line ("Squire"), "Journeyman", or
   * "Beginner" for the slot-11 Beginner; null when the roster has no opinion.
   */
  line: string | null;
  /** 'roster': the slot plan chose the path; 'tree': the class tree's options, the roster has none. */
  basis: 'roster' | 'tree';
  /** Done and now, then the planned classes in order; never options. */
  steps: PlannedStep[];
  /** The next class; null at the end of the line or when there are several options. */
  next: string | null;
  /** The class tree's options when the roster has no opinion and there is more than one. */
  options: string[];
  /** How `next` is taken; null without one. */
  via: PromotionVia | null;
}

const JOURNEYMAN = 'Journeyman';
const BEGINNER = 'Beginner';
/** The slot plan's Beginner slot (TR-8): the Beginner there stays one. */
const BEGINNER_SLOT = 11;

const released = (r: ClassRow | undefined): r is ClassRow =>
  !!r && (r as ClassRow & { released?: boolean }).released !== false;

/** The class a class came from; the Journeyman, which the class table gives none, from the Beginner. */
const parentOf = (tree: ClassTree, row: ClassRow): ClassRow | undefined =>
  row.promotesFrom
    ? tree.byName.get(row.promotesFrom)
    : row.class === JOURNEYMAN
      ? tree.byName.get(BEGINNER)
      : undefined;

/** The released classes a class promotes to; a Beginner's include the Journeyman (dossier C3). */
function optionsOf(tree: ClassTree, row: ClassRow): ClassRow[] {
  const names = [...row.promotesTo];
  if (row.tier === 'beginner' && !names.includes(JOURNEYMAN)) names.push(JOURNEYMAN);
  return names.map((n) => tree.byName.get(n)).filter(released);
}

/** The single-option chain after `from` (a subclass's elite, an elite's master), up to 4 classes. */
function onward(tree: ClassTree, from: ClassRow): ClassRow[] {
  const out: ClassRow[] = [];
  for (let r: ClassRow | undefined = from, g = 0; r && g < 4; g++) {
    const opts: ClassRow[] = r.promotesTo.map((n) => tree.byName.get(n)).filter(released);
    r = opts.length === 1 ? opts[0] : undefined;
    if (r) out.push(r);
  }
  return out;
}

/** The classes from `row` (exclusive) down to `target` (inclusive), or null when `target` isn't ahead. */
function between(tree: ClassTree, row: ClassRow, target: string): ClassRow[] | null {
  const chain: ClassRow[] = [];
  for (let r = tree.byName.get(target), g = 0; r && g < 10; g++) {
    if (r.class === row.class) return chain;
    chain.unshift(r);
    r = parentOf(tree, r);
  }
  return null;
}

function viaOf(from: ClassRow, to: ClassRow): PromotionVia {
  if (from.tier === 'beginner') return to.class === JOURNEYMAN ? 'rocklyte' : 'promotheus';
  if (from.tier === 'base') return to.class === 'Maestro' ? 'cactolyte' : 'speccius';
  if (from.tier === 'subclass') return to.class === 'Voidwalker' ? 'nebulyte' : 'eliteus';
  return 'other';
}

function pathOf(
  c: CharacterState,
  tree: ClassTree,
  line: string | null,
  stays: boolean,
): Omit<PlannedPath, 'characterIndex'> {
  const row = tree.byName.get(c.class);
  if (!row) return { class: c.class, line, basis: 'tree', steps: [], next: null, options: [], via: null };
  const back: ClassRow[] = [];
  for (let r: ClassRow | undefined = row, g = 0; r && g < 8; g++) {
    back.unshift(r);
    r = parentOf(tree, r);
  }
  const done = back.map((r): PlannedStep => ({ class: r.class, state: r === row ? 'now' : 'done' }));
  let forward: ClassRow[] | null = null;
  let basis: PlannedPath['basis'] = 'roster';
  if (stays) forward = [];
  else if (line) {
    // The planned line is ahead (a Beginner made for Hunter: Archer, Hunter), or already reached (a
    // Squire, a Divine Knight): either way the rest is the line's single-option chain.
    const ahead = between(tree, row, line);
    if (ahead && ahead.length > 0) forward = [...ahead, ...onward(tree, ahead[ahead.length - 1] as ClassRow)];
    else if (tree.isA(row.class, line) || (line === JOURNEYMAN && row.line === JOURNEYMAN))
      forward = onward(tree, row);
  }
  let options: string[] = [];
  if (forward === null) {
    basis = 'tree';
    const opts = optionsOf(tree, row);
    if (opts.length === 1) forward = [opts[0] as ClassRow, ...onward(tree, opts[0] as ClassRow)];
    else {
      forward = [];
      options = opts.map((o) => o.class);
    }
  }
  const steps = [
    ...done,
    ...forward.map((r, i): PlannedStep => ({ class: r.class, state: i === 0 ? 'next' : 'later' })),
  ];
  const first = forward[0];
  return {
    class: row.class,
    line: stays ? BEGINNER : line,
    basis,
    steps,
    next: first?.class ?? null,
    options,
    via: first ? viaOf(row, first) : null,
  };
}

/**
 * Every character's Planned Path, in save order. Pass the roster when it is at hand (M2's run has it);
 * otherwise it is analysed here. A roster that can't be read leaves the class tree alone to answer.
 */
export function plannedPaths(
  state: AccountState,
  facts: FactLookup,
  stage: StageId | null,
  roster?: RosterResult | null,
): PlannedPath[] {
  const tree = classTree(facts);
  let r: RosterResult | null = roster ?? null;
  if (roster === undefined) {
    try {
      r = analyzeRoster(state, facts, stage);
    } catch {
      r = null;
    }
  }
  return state.characters.map((c) => {
    const slot = r?.slots.find((s) => s.characterIndex === c.index);
    // The slot-11 Beginner stays one; any other Beginner without a line has no plan yet.
    const stays =
      slot?.status === 'beginner' && slot.slot === BEGINNER_SLOT && (r?.charactersUsed ?? 0) >= BEGINNER_SLOT;
    return { characterIndex: c.index, ...pathOf(c, tree, slot?.line ?? null, stays) };
  });
}

/** One character's Planned Path (see `plannedPaths`); null when the index isn't a character. */
export function plannedLine(
  state: AccountState,
  facts: FactLookup,
  stage: StageId | null,
  characterIndex: number,
  roster?: RosterResult | null,
): PlannedPath | null {
  return plannedPaths(state, facts, stage, roster).find((p) => p.characterIndex === characterIndex) ?? null;
}
