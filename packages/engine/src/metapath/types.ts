// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2's output types (M2 TR-4, TR-4a, TR-12, TR-14). Plain, structured-cloneable data: no functions,
// Maps, class instances or Dates, so M4, M5, M7, M8 and the engine core read them without calling M2.
import type { CompiledKnowledge, Entry, FactTable, StageId } from '@idleon-forge/knowledge';

export type { StageId };

import type { Category, Provenance } from '../result';

export type { Category, Provenance };

/** Read-only access to compiled entries and fact tables by id: `DetectorContext.facts` has this shape. */
export interface FactLookup {
  get(id: string): Readonly<Entry | FactTable> | undefined;
}

/** What M2 reads from the compiled Knowledge Base. */
export type MetaPathKnowledge = Pick<CompiledKnowledge, 'entries' | 'facts' | 'lists' | 'priorityByStage'>;

export interface StageEvidence {
  field: string;
  /** Never strings, so no name can enter (M2 TR-17). */
  value: number | boolean | number[] | null;
  known: boolean;
}

export interface StageResult {
  /** null only when certainty is 'unknown'. */
  id: StageId | null;
  /** "World 2, late". */
  label: string;
  world: 1 | 2 | 3 | 4 | null;
  certainty: 'certain' | 'partial' | 'unknown';
  coverage: 'covered' | 'beyond';
  /** The rule that matched, e.g. "w2-late". */
  rule: string | null;
  evidence: StageEvidence[];
  /** What the account needs for the next Stage, one line per unmet condition; null at W4-entry. */
  next: { stage: StageId; needs: string[] } | null;
  provenance: Provenance;
}

/** The Stage's list after frame and include resolution (M2 TR-13). Plain data: no functions. */
export interface ResolvedPriorityList {
  /** null when certainty is 'unknown' (FR-3). */
  stage: StageId | null;
  /** e.g. "metapath.priority.w2-late"; null when the Stage has no list file yet (the frame alone applies). */
  listId: string | null;
  /** entry id -> position; frame items at 1 and 3, the push at 2, Stage items from 4. */
  positions: Record<string, number>;
  /** The last authored position (the bottom tie, TR-13). */
  lastPosition: number;
  /** Entry ids listed with byUrgency: position 1 or 3 by urgency (TR-13). */
  byUrgency: string[];
  /** Entry ids carried forward from earlier Stage lists (TR-13). */
  carryForward: string[];
  /** Entry ids at a contested item (FR-20 moves them off first place). */
  contested: string[];
  /**
   * Beyond coverage (FR-5, D2): only Verdict blockers and positions 1 and 3 rank. The engine core drops
   * every other Goal; `positions` already holds only positions 1 to 3.
   */
  frameOnly: boolean;
}

export type RosterStatus = 'on-path' | 'tentative' | 'contested' | 'off-path' | 'beginner' | 'unknown';

export interface RosterSlot {
  characterIndex: number;
  /** Meta Path slot (TR-8): 1–6 a subclass line, 7 Journeyman, 8 the 2nd Squire, 9 for 9–10, 11 Beginner. */
  slot: number | null;
  /** Subclass line (Barbarian, Squire, Bowman, Hunter, Shaman, Wizard, Journeyman), or the line a base class holds tentatively. */
  line: string | null;
  status: RosterStatus;
  /** 'second-squire': the on-path duplicate Squire (FR-10, PV 1.1). */
  note: 'second-squire' | null;
}

export interface NextCharacter {
  line: string;
  /** The class to pick at level 10 (Warrior, Archer, Mage), or Journeyman. */
  baseClass: string;
  /** The family level (`account.accountLevel`, the sum of class levels). */
  familyLevel: number | null;
  /** The slot number the new character takes (1-based count of characters after it). */
  slotNumber: number;
  /** Family level that opens that slot; null when the slot is already open or unknown. */
  opensAt: number | null;
  gap: number | null;
  /** Open: a Goal ("Make a Hunter"); closed: an Account-section note (FR-9). */
  slotOpen: boolean;
}

export interface RosterResult {
  slots: RosterSlot[];
  /** Subclass lines of slots 1–6 that some character holds (or holds tentatively). */
  linesPresent: string[];
  /** Subclass lines of slots 1–6 nobody holds, in the #15 slot order. */
  missingLines: string[];
  /** Characters with save data (readable or not). */
  charactersUsed: number;
  /** Character slots the family level opens; null when the family level is unknown. */
  slotsUnlocked: number | null;
  nextCharacter: NextCharacter | null;
  /** FR-10, Final rulings F17: the only case the Sub Class Swap Token is suggested. */
  swapToken: { characterIndex: number; from: string; to: string } | null;
}

export interface RoleAssignment {
  role: string;
  /** What the Role owns: an AFK type ("FISHING") or a Parallel Slot ("parallel:cog"); null for neither. */
  afkType: string | null;
  active: boolean;
  /** The Role entry it comes from (provenance). */
  entryId: string;
}

export interface VisitHint {
  characterIndex: number;
  kind: 'pool-after' | 'cooldown-ready' | 'skip-trap-stop';
  after?: number[];
  roleId: string;
  provenance: Provenance;
}

/** The next step of the current world's gate chain for the pusher (M2 TR-11, FR-12). */
export type PushStep =
  | {
      kind: 'route';
      /** Toolbox map name of the frontier door, e.g. "Thermonuclear_Climb". */
      mapName: string;
      mapIndex: number;
      door: number;
      killsLeft: number;
    }
  | { kind: 'quest'; quest: string; npc: string; number: number; title: string | null }
  | { kind: 'boss'; boss: string; crystal: string | null }
  | { kind: 'crystal'; crystal: string }
  | { kind: 'gatekeeper'; npc: string }
  /** FR-13: nobody can fight the frontier yet. */
  | {
      kind: 'wall';
      mapName: string;
      mapIndex: number;
      reason: 'hit' | 'survivability';
      hitChance: number;
      survivability: number;
    };

export interface PushGoal {
  entryId: 'metapath.goal.push';
  /** The pusher; for a `wall` step, the strongest candidate (FR-13). */
  characterIndex: number;
  /** Frontier door kills. */
  current: number;
  goal: number;
  /** killsLeft ÷ finalKillsPerHour (FR-12, ADR 0005 arithmetic); null for a quest, boss or wall step. */
  etaSeconds: number | null;
  /** The current world's gate-chain entry. */
  chainId: string;
  step: PushStep;
  provenance: Provenance;
}

export interface PusherResult {
  index: number;
  frontierMap: number;
  /** The incumbent (TR-10 step 3), for the "kept the incumbent" explanation. */
  incumbent: number;
  /** The fastest candidate (TR-10 step 4). */
  fastest: number;
}

export interface MetaPathResult {
  stage: StageResult;
  list: ResolvedPriorityList;
  pusher: { index: number; frontierMap: number } | null;
  pushGoal: PushGoal | null;
  /** Why there is no push Goal: the frontier could not be computed, or the account is beyond coverage. */
  pushUnavailable: 'no-frontier' | 'beyond-coverage' | 'no-stage' | 'chain-done' | null;
  /** Per character index (FR-7, TR-9). */
  roles: Record<number, RoleAssignment[]>;
  roster: RosterResult;
  visitHints: VisitHint[];
  /** The other Meta Path Goals (FR-15 to FR-17, FR-9), as findings; their words live in the entries. */
  goals: MetaPathGoal[];
}

/** One Meta Path Goal instance, for the engine core to merge and rank. Text is rendered from its entry. */
export interface MetaPathGoal {
  entryId:
    | 'metapath.goal.subclass'
    | 'metapath.goal.world-tutorial-w3'
    | 'metapath.goal.elite'
    | 'metapath.goal.next-character'
    | 'metapath.goal.swap-token';
  subject: { kind: 'account' } | { kind: 'character'; index: number };
  /** Template slots for the entry's text (game identifiers and numbers only). */
  slots: Record<string, number | string>;
  /** FR-17: the authored elite order; lower first. */
  order: number;
  provenance: Provenance;
}

/** M2 TR-14: what every module's Goal provides to the one comparator. */
export interface Rankable {
  entryId: string;
  category: Category;
  stale: boolean;
  contested: boolean;
  cost: { unit: 'coins' | 'gems' | 'hours' | 'none'; amount: number } | null;
  milestoneEtaSeconds: number | null;
  /** Contributions count for its activity (M4). */
  goalsServed: number;
  /** From an M6 finding (M11 CheckFinding.urgency); null for every other module. */
  urgency: 'losing-now' | 'lost-before-return' | 'banked' | null;
  /** Epoch ms when the value starts to be lost (M6 TR-6); null when none. */
  deadline: number | null;
  /** By-urgency items only (TR-13): 1 while urgency is losing-now or lost-before-return, else 3. */
  framePosition: 1 | 3 | null;
  /** The subject key ("account", "c3"), the last tie-break after the entry id. */
  subjectKey?: string;
  /**
   * M9 D3, Final rulings RT1: a listed item whose position-3 condition doesn't hold (a core talent step
   * with no unspent points and no level-up signal) ranks in the last-position tie instead.
   */
  atLastPosition?: boolean;
}
