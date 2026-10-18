// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 engine output (docs/specs/M18-gear-tools.md TR-5): plain, structured-cloneable data built in the
// worker. Indices only, never a name; every word is rendered from an entry's `values`.
import type { GearSlotId, SkillId } from '@idleon-forge/account-state';

export type GearSlotState = 'empty' | 'ok' | 'behind' | 'held-upgrade' | 'unknown';

export interface GearSlotView {
  slot: GearSlotId | 'trap' | 'skull';
  /** Trap set and skull are M20's: 'm20', and the Gear tab shows M20's pip for them. */
  state: GearSlotState | 'm20';
  /** "45 levels behind", "empty", "better one held", "ok". */
  word: string;
  equipped: null | {
    rawName: string;
    name: string;
    lvReq: number;
    /** Defence (armour, pendant, ring) or Weapon Power (weapon, tool). */
    primary: number;
    main: number;
    pct: string[];
    slotsLeft: number;
    slotsMax: number;
  };
  /** The Gear Plan target and how to get it (FR-14's steps, first three; "show all" for the rest). */
  target: null | { rawName: string; name: string; lvReq: number; how: string; steps: string[] };
  levelsBehind: number | null;
  /** Held items that fit this slot and beat what is worn ("Gold Helmet from storage"). */
  held: string[];
  /** "A trade: compare in game", "An item this version doesn't know", or null. */
  note: string | null;
  /** The NextAction.key this slot's element answers (FR-28). */
  actionKey: string | null;
}

export interface GearLadderTier {
  rawName: string;
  name: string;
  atLevel: number;
  equipped: boolean;
}

export interface CharacterGear {
  index: number;
  /** 8 equipment, 4 tools, then trap and skull. */
  slots: GearSlotView[];
  /** FR-24's one lit square. */
  lit: GearSlotView['slot'] | null;
  /** The lit slot's Next Action text. */
  step: string | null;
  /** The lit slot's Next Action why. */
  why: string | null;
  /** FR-24: the AFK skill's tool ladder, and any skill whose tool is equipped. */
  ladders: Array<{ skill: SkillId; skillLevel: number; tiers: GearLadderTier[]; next: string | null }>;
  /** FR-25's Characters tile line. */
  status: string;
  /** "The Gear Plan covers Worlds 1–3" on a W4+ account. */
  note: string | null;
}

export interface SmithySetCard {
  set: string;
  setName: string;
  bonus: string;
  registered: boolean;
  parts: Array<{ rawName: string; name: string; where: 'worn' | 'held' | 'missing' }>;
  /** "2 of 4 parts: craft an Iron Helmet", "registered". */
  line: string;
  actionKey: string | null;
}

export interface GearResult {
  characters: CharacterGear[];
  smithy: {
    state: 'waiting' | 'ready' | 'hired' | 'unknown';
    daysLeft: number | null;
    /** "Opens in 26 days, or once 2,000 gems were bought". */
    line: string;
    sets: SmithySetCard[];
  };
  heat: {
    columns: Array<GearSlotId | 'tool'>;
    rows: Array<{
      index: number;
      cells: Array<{ word: string; state: GearSlotState | 'none'; actionKey: string | null }>;
    }>;
  };
  /** X5: the Task Board and Merit Shop recipes M18's Goals need, in Goal rank order (M6's details). */
  unlockWants: Array<{ kind: 'task-unlock' | 'merit'; world: number; what: string }>;
}
