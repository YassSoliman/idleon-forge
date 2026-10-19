// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Cards view model (M8 "Cards view", owner request 2026-10-18): per character, every card preset as
// a row of slots, the best preset from owned cards as a diff against what is equipped, and the cards
// worth grinding next that the account can reach now; plus one overview row per character and a merged
// account grind list. Plain data (M10 TR-6): it crosses the worker boundary inside `EngineResult.cards`.
// Characters are named by class and level only ("Squire 85"); the UI adds names it already holds.
import type { SourceRef } from '../result';

/** One card in a slot, a recommendation or a grind line. */
export interface CardChip {
  rawName: string;
  /** "Frost Flake". */
  name: string;
  /** What it gives at its level ("+14 Base STR"), or per level when not owned ("+7 Base STR per level"). */
  effect: string;
  /** 0 when not owned; level = stars + 1. */
  level: number;
  /** 0-based stars (level − 1); 0 when not owned. */
  stars: number;
  /** "(Passive)" cards work without being equipped (M8 FR-16). */
  passive: boolean;
}

export interface CardSetChip {
  rawName: string;
  /** "Yum Yum Desert". */
  name: string;
  tier: number;
  /** "+20% All Food Effect". */
  bonus: string;
}

/** One card set's way to its next tier (M24 Cards tab). */
export interface CardSetProgress {
  rawName: string;
  /** "Yum Yum Desert". */
  name: string;
  /** 0 before the first tier. */
  tier: number;
  /** The bonus now ("+20% All Food Effect"), or null at tier 0. */
  bonus: string | null;
  /** Card levels in the set now, and at the next tier. */
  points: number;
  nextAt: number;
  /** Card levels still missing for the next tier. */
  away: number;
  /** The bonus at the next tier. */
  nextBonus: string;
}

/** One stored card preset. */
export interface PresetRow {
  /** 1-based, as the game shows it. */
  n: number;
  /** The preset the character is using. */
  active: boolean;
  /** Exactly the character's slot count; null is an empty slot. */
  slots: (CardChip | null)[];
  /** Activity names the preset fits by M8's keyword rule (TR-9): "fighting", "Mining". */
  fits: string[];
  /** "fits fighting", "fits Mining and fighting", "empty", "no clear fit". */
  label: string;
  /** It fits the character's AFK Target. */
  fitsTarget: boolean;
  /** The equipped card set: the save stores one per character, shown on the active preset only. */
  set: CardSetChip | null;
}

/** One change to make a preset match the recommendation. */
export interface CardSwap {
  /** null: an empty slot gets the card. */
  from: CardChip | null;
  to: CardChip;
  /** "Swap Copper → Iron", "Add Iron". */
  text: string;
}

/** The best preset from owned cards for one activity (AFK Target or another Role), as a diff. */
export interface PresetRecommendation {
  /** "fighting", "Mining". */
  activity: string;
  /** Why this activity: the AFK Target, or a Role the character holds. */
  reason: 'afk-target' | 'role';
  /** The 1-based preset to put the cards in, or null when presets are locked (below Lv 15). */
  preset: number | null;
  /** "In your active card preset 1", "Switch to card preset 2 (fits Mining)", "Fill empty card preset 2". */
  where: string;
  cards: CardChip[];
  swaps: CardSwap[];
  /** The preset already holds these cards. */
  done: boolean;
  set: CardSetChip | null;
  /** "Equip the Yum Yum Desert set (tier 1, +3% ...)" when the equipped set differs, else null. */
  setNote: string | null;
}

/** A card worth getting or levelling next, reachable now. */
export interface GrindItem {
  rawName: string;
  name: string;
  /** Per level ("+7 Base STR per level"). */
  effect: string;
  /** "Frost Flake" (the monster or resource that drops it). */
  monster: string;
  map: string;
  mapIndex: number;
  world: number;
  /** "Mining" for a skilling card, null for a fighting one. */
  skill: string | null;
  /** Copies owned. */
  owned: number;
  level: number;
  stars: number;
  /** Copies the next level needs, and what it is ("first copy", "level 3"). */
  next: { copies: number; label: string };
  missing: number;
  /** Base chance per kill (or per resource action), with ×5 while unowned (dossier: N.js LootDropOddsReset). */
  chance: number;
  /** "1 in 250 (×5 while you own none)". */
  chanceText: string;
  /** Mean kills for the missing copies at the base chance; null for skilling cards. */
  kills: number | null;
  /** Mean hours on this map for the character (account list: the fastest one); null without a kill rate. */
  hours: number | null;
  /** "about 1.2 h at the base drop chance (likely sooner)", "no kill rate on this map yet", ... */
  etaText: string;
  /** The preset this card improves: "fighting preset (card preset 1)". */
  improves: string;
  /** Characters already on this map for this activity ("Squire 85"). */
  farmingNow: string[];
  /** Account list only: who it helps, and who would get it fastest. */
  helps: string[];
  fastest: string | null;
  /** ≤ 24 h, or a first copy: listed before slower cards. */
  quick: boolean;
}

export interface CharacterCards {
  index: number;
  /** "Squire 85". */
  who: string;
  /** "fighting", "Mining", or null when the AFK Target isn't a card activity. */
  activity: string | null;
  /** "Can't read this character's cards right now", or null. */
  unknown: string | null;
  slotCount: number;
  /** "Card presets unlock at Lv 15", or null. */
  presetsLocked: string | null;
  presets: PresetRow[];
  /** 1-based. */
  activePreset: number;
  emptySlots: number;
  set: CardSetChip | null;
  recommendations: PresetRecommendation[];
  /** Ordered: quick wins first, then the card list's order. Capped. */
  grind: GrindItem[];
  /** "3 more cards on its list drop from bosses, crystal mobs or nodes ActiveOn can't place yet". */
  grindNote: string | null;
  /** What an empty grind list says: nothing in reach yet, or (Stage past World 4) the view's coverage. */
  grindEmpty: string;
  /** The overview row: "preset fits fighting ✓ · 2 empty slots · next grind: Frost Flake card (about 1.2 h)". */
  overview: string;
  /** Whether the active preset fits the AFK Target; null without a card activity. */
  presetFits: boolean | null;
}

export interface CardsView {
  characters: CharacterCards[];
  account: {
    /** Merged across characters, one line per card. Capped. */
    grind: GrindItem[];
    /**
     * M24: the card sets closest to their next tier, fewest card levels away first (capped). Read from
     * `account.cardSets` (Toolbox getCardSets): a tier is every card level in the set divided by its size,
     * so each new card or star counts 1. Only sets with a card owned and below the base max tier.
     */
    sets?: CardSetProgress[];
  };
  /** How ETAs are computed, shown once. */
  caveats: string[];
  /** Player-facing first (#74), then Toolbox. */
  sources: SourceRef[];
}
