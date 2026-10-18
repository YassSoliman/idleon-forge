// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 Walkthroughs & Parallel Slot Plans' Account State fields (M14 TR-2, M1 TR-11). Read in
// walkthrough.ts only; declared in walkthrough-fields.ts. Optional so hand-built states need not spell
// them out; the adapter always sets each one, to a value or null (null = unknown, never "none").
//
// M14 also reads M8's holdings and quest fields (`storageItems`, `refineryStorage`,
// `characters[].inventoryItems`, `.quests`, `.smithingLevel`, `.targetMonster`; collections-types.ts).

/** One sample in the 3D Printer (Toolbox `account.printer[c][]`). */
export interface PrinterSample {
  rawName: string;
  /** Toolbox display name, e.g. "Forest_Fibres"; the rawName when the pin doesn't know the item. */
  name: string;
  /** The sample's stored size per hour (Toolbox `value`). */
  value: number;
  /** Toolbox `boostedValue`: the sample with the printer multi, per hour. */
  perHour: number;
}

export interface PrinterCharacter {
  characterIndex: number;
  /** PRINTER_SAMPLING star talent level (Toolbox `flatStarTalents`). */
  samplingLevel: number;
  /** Toolbox `printerSample` (sample size %, 0..100). */
  samplePct: number;
  stored: PrinterSample[];
  active: PrinterSample[];
}

/** M14 TR-2 `PrinterState`. */
export interface PrinterState {
  /** The 3D Printer's building level (Toolbox towers `3D_Printer`): one player slot per level (wiki). */
  level: number;
  /** 4 + gemShopPurchases[112] (N.js `PrinterSampleSlots`). */
  storedSlots: number;
  /** 1 + gemShopPurchases[111] (Crystal 3D Printer, N.js `PrinterBigSlots`). */
  activeSlots: number;
  /** Toolbox `getPrinterMulti` live, and with the day counters accountOptions[125], [323], [479] at 0 (FR-27a). */
  multiNow: number;
  multiAfterSample: number;
  characters: PrinterCharacter[];
}

/** One character's rates on one supply map (M14 TR-3), from Toolbox's clone moved there. */
export interface SupplyRate {
  characterIndex: number;
  finalKillsPerHour: number;
  /** % 0..100. */
  survivability: number;
  /** % 0..100. */
  hitChance: number;
  /** Toolbox `getDropRate` on the clone moved to the map (shrines make it map-dependent). */
  dropRate: number;
}

/** M14 TR-3 `SupplyRates`: computed in the parse worker for the supply maps of the missing leaves. */
export interface SupplyRates {
  status: 'ok' | 'partial' | 'unavailable';
  maps: { mapIndex: number; rates: SupplyRate[] }[];
  /** characterIndex -> map indices the character can walk to today (M5 TR-4's rule; fighting and skilling maps). */
  reachable: Record<number, number[]>;
  /** Leaves whose further drop maps were not computed (SUPPLY_MAPS_PER_LEAF), by rawName. */
  skipped: Record<string, number>;
}

/** The two talent presets (Toolbox `talents` and `talentPreset.talents`): base levels by talent name, levels > 0 only. */
export interface TalentPresets {
  /** 0-based `selectedTalentPreset`; texts show it plus 1. */
  selected: number;
  presets: { index: number; levels: Record<string, number> }[];
}

/** Card presets (Toolbox `cardPresets`): each preset's card effect texts; 0-based `selected`. */
export interface CardPresets {
  selected: number;
  /** 2 base presets + gemShopPurchases[66] (Card Presets), as M8 FR-17 rules. */
  unlocked: number;
  presets: string[][];
}

export interface WalkthroughAccountFields {
  /** Raw `CYAnvilTabsOwned`: anvil tabs unlocked for every anvil (1 = only tab 1). */
  anvilTabsOwned?: number | null;
  /** Bars waiting in the Forge's output slots (Toolbox `forge.list[].bar`), summed by rawName. */
  forgeOutput?: { rawName: string; amount: number }[] | null;
  printer?: PrinterState | null;
  /** Set by the parse worker after the adapter (TR-3); null until then or when it threw. */
  supplyRates?: SupplyRates | null;
}

export interface WalkthroughCharacterFields {
  /** The character's current map index (Toolbox `mapIndex`). */
  mapIndex?: number | null;
  /** Skill levels by Toolbox skill key (`skillsInfo.<skill>.level`): mining, chopping, fishing, catching. */
  skillLevels?: Record<string, number> | null;
  /** Skill efficiency as currently equipped (Toolbox `getSkillEfficiency`): mining, chopping, fishing, catching. */
  skillEfficiency?: Record<string, number> | null;
  /** Toolbox `getPlayerAnvil(...).stats.anvilSpeed`: items per hour per hammer at requiredAmount 1. */
  anvilSpeed?: number | null;
  /** TODO(M9): M9 (#77) owns the talent preset fields; this is the minimum M14's preset steps read. */
  talentPresets?: TalentPresets | null;
  /** TODO(M8): M8 (#80) owns `cardLoadout`; this is the minimum M14's preset steps read. */
  cardPresets?: CardPresets | null;
}
