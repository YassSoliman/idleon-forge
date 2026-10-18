// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The game's talent point totals, ported term by term from `_customBlock_TotalTalentPoints` (N.js,
// the game client: www.legendsofidleon.com/ytGl5oc/N.js, offset 4370453 in the copy read 2026-10-18,
// game v2.3.540). This is the one game formula we keep (ADR 0010, the narrow exception to ADR 0005):
// totals only, self-checked against the save (talent-points.ts), falling back to the lower bound on any
// mismatch. Pure arithmetic: raw-save terms arrive as `RawPointTerms`, Toolbox-computed ones as a
// record by term id (toolbox-parsers `talentPointTerms`). The truth checks reuse it with raw terms only.
//
// The game builds TalentDL2 = [tab 1, tab 2, tab 3, tab 4, tab 5, star], each floor(total - spent[i]),
// with tabs 4 and 5 (and the special class tabs) wrapped in max(0, .). Tab i is the i-th class of the
// character's `ReturnClasses` line (Beginner/Journeyman/..., or Rage Basics/Warrior/Barbarian/...).

/** The terms TotalTalentPoints reads straight from the save. */
export interface RawPointTerms {
  /** `Lv0_<i>`: [class level, then the skill levels]. */
  lv0: readonly number[];
  /** `CharacterClass_<i>`. */
  classId: number;
  /** `CYTalentPoints` (CurrenciesOwned.TalentPoints), 6 entries: tabs 1-5, then star. */
  cy: readonly number[];
  /** `AchieveReg`: an achievement is done when its entry is -1 (`_customBlock_AchieveStatus`). */
  achieveReg: readonly number[];
  /** `OptionsListAccount[436]`: the Darts minigame upgrade that adds tab 1 points. 0 when absent. */
  ola436?: number;
  /** `OptionsListAccount[158]`: the Voidwalker's portals unlocked from kills (VOID_TRIAL_RERUN). */
  ola158?: number;
  /** `TaskZZ2[4][0]` (Tasks[2][4][0]): the World 5 merit that adds 3 tab 4 points per level. */
  merit5?: number;
  /** `TaskZZ2[5][0]` (Tasks[2][5][0]): the World 6 merit that adds 5 tab 5 points per level. */
  merit6?: number;
  /** `Spelunk[0][9] >= 1` (Spelunk("DoWeHaveLoreN1", 9)): 1 when lore 9 is found, else 0. */
  lore9?: number;
}

/** Toolbox-computed terms by id (toolbox-parsers `talentPointTerms`); a missing id reads 0. */
export type ToolboxPointTerms = Readonly<Record<string, number>>;

/** Where each term comes from: the game's expression (N.js, TotalTalentPoints) and how we read it. */
export interface TermSource {
  /** The expression in N.js, verbatim up to receiver names. */
  game: string;
  /** Our read: a raw save key, or the Toolbox helper. */
  read: string;
  /** Tabs 1-5, 6 = star. */
  tabs: number[];
  /** True when the value depends on the preset's own talent levels. */
  perPreset?: true;
  /** Only on these classes' line for the tab (the Voidwalker tab 4, the Royal Guardian tab 5, a master class's own system). */
  classes?: readonly number[];
  /** Not on these classes' line (they have their own). */
  notClasses?: readonly number[];
}

/** Every term, with its citation. Keys are the ids in `ToolboxPointTerms` / the violation evidence. */
const VOID = [4];
const ROYAL = [12, 16];

export const TALENT_POINT_TERMS: Record<string, TermSource> = {
  level: {
    game: '3*(Lv0[0]-1|6|29), 3*min(Lv0[0]-89,100)+max(0,2*(Lv0[0]-189)), 3*(Lv0[0]-249), Lv0[0]-1',
    read: 'Lv0_<i>[0]',
    tabs: [1, 2, 3, 4, 5, 6],
  },
  skills: {
    game: 'TalentDL: -3+Σ Lv0[1..9] (+round(GetTalentNumber(1,275)), an empty slot), Σ floor(Lv0/2), Σ floor(Lv0/5)',
    read: 'Lv0_<i>[1..9]',
    tabs: [1, 2, 3, 4, 5, 6],
  },
  cy: { game: 'CurrenciesOwned.TalentPoints[0..5]', read: 'CYTalentPoints', tabs: [1, 2, 3, 4, 5, 6] },
  bubble: {
    game: 'AlchBubbles.TalArchers / TalWarrior / TalWiz (by CharacterClass <7, <19, <31, else), tabs 1-4',
    read: 'getBubbleBonus(FAST_/BUFF_/SMART_BOI_TALENT)',
    tabs: [1, 2, 3, 4],
  },
  vial1: { game: 'AlchVials.Tab1Pts', read: "getVialsBonusByStat('Tab1Pts')", tabs: [1] },
  vial2: { game: 'AlchVials.Tab2Pts', read: "getVialsBonusByStat('Tab2Pts')", tabs: [2] },
  vial3: { game: 'AlchVials.Tab3Pts', read: "getVialsBonusByStat('Tab3Pts')", tabs: [3] },
  vial4: { game: 'AlchVials.Tab4Pts', read: "getVialsBonusByStat('Tab4Pts')", tabs: [4], notClasses: VOID },
  starSign1: {
    game: 'StarSigns.TalPts1 (The Fuzzy Dice, +3)',
    read: "getStarSignBonus('Talent_Points')",
    tabs: [1],
  },
  stamp1: { game: 'StampBonusOfTypeX("Talent1")', read: "getStampsBonusByStat('Talent1')", tabs: [1] },
  stamp2: { game: 'StampBonusOfTypeX("Talent2")', read: "getStampsBonusByStat('Talent2')", tabs: [2] },
  stamp3: { game: 'StampBonusOfTypeX("Talent3")', read: "getStampsBonusByStat('Talent3')", tabs: [3] },
  stamp4: {
    game: 'StampBonusOfTypeX("Talent4")',
    read: "getStampsBonusByStat('Talent4')",
    tabs: [4],
    notClasses: VOID,
  },
  stamp5: {
    game: 'StampBonusOfTypeX("Talent5")',
    read: "getStampsBonusByStat('Talent5')",
    tabs: [5],
    notClasses: ROYAL,
  },
  achievements: {
    game: '5*A54+6*A216 | 2*A76+3*A78+8*A230 | 5*A166+10*A170+8*A219 | 10*A292+10*A295+10*A239+15*A240+12*A241 | 10*A212+20*A289+20*A305',
    read: 'AchieveReg (-1 = done)',
    tabs: [1, 2, 3, 4, 6],
  },
  flurbo: { game: 'FlurboShop(1)', read: "getDungeonFlurboStatBonus('Talent_Pts')", tabs: [1, 2, 3, 4, 5] },
  arcade16: { game: 'ArcadeBonus(16)', read: 'getArcadeBonus(arcade.shop, 16)', tabs: [1] },
  shiny1: {
    game: 'Breeding("ShinyBonusS","Nah",10,-1)',
    read: "getShinyBonus('Tab_1_Talent_Pts')",
    tabs: [1],
  },
  shiny2: {
    game: 'Breeding("ShinyBonusS","Nah",11,-1)',
    read: "getShinyBonus('Tab_2_Talent_Pts')",
    tabs: [2],
  },
  shiny3: {
    game: 'Breeding("ShinyBonusS","Nah",12,-1)',
    read: "getShinyBonus('Tab_3_Talent_Pts')",
    tabs: [3],
  },
  shiny4: {
    game: 'Breeding("ShinyBonusS","Nah",13,-1)',
    read: "getShinyBonus('Tab_4_Talent_Pts')",
    tabs: [4],
    notClasses: VOID,
  },
  vault1: { game: 'Summoning("VaultUpgBonus",1,0)', read: 'getUpgradeVaultBonus(1)', tabs: [1] },
  vault6: { game: 'Summoning("VaultUpgBonus",6,0)', read: 'getUpgradeVaultBonus(6)', tabs: [2] },
  vault40: { game: 'Summoning("VaultUpgBonus",40,0)', read: 'getUpgradeVaultBonus(40)', tabs: [3] },
  companion20: {
    game: 'Companions(20)',
    read: 'companions.list[20].bonus when acquired',
    tabs: [1, 2, 3, 4, 5, 6],
  },
  ola436: { game: 'OptionsListAccount[436] (the Darts upgrade)', read: 'OptionsListAccount[436]', tabs: [1] },
  t44: {
    game: 'GetTalentNumber(1,44) JMAN_WAS_BETTER',
    read: 'getTalentBonus(JMAN_WAS_BETTER)',
    tabs: [2],
    perPreset: true,
  },
  t119: {
    game: 'GetTalentNumber(1,119) BACK_TO_BASICS',
    read: 'getTalentBonus(BACK_TO_BASICS)',
    tabs: [2],
    perPreset: true,
  },
  t299: {
    game: 'GetTalentNumber(1,299) PREVIOUS_POINTS',
    read: 'getTalentBonus(PREVIOUS_POINTS)',
    tabs: [2],
    perPreset: true,
  },
  t494: {
    game: 'GetTalentNumber(1,494) EARLIER_EDUCATION',
    read: 'getTalentBonus(EARLIER_EDUCATION)',
    tabs: [2],
    perPreset: true,
  },
  divinity: { game: 'floor(Lv0[14]/2) (Divinity level)', read: 'Lv0_<i>[14]', tabs: [4], notClasses: VOID },
  merit5: { game: '3*Tasks[2][4][0]', read: 'TaskZZ2[4][0]', tabs: [4], notClasses: VOID },
  t34: {
    game: 'GetTalentNumber(1,34) ONE_STEP_AHEAD (class 4 tab 4)',
    read: 'getTalentBonus(ONE_STEP_AHEAD)',
    tabs: [4],
    perPreset: true,
    classes: VOID,
  },
  t45y: {
    game: 'GetTalentNumber(2,45)*OptionsListAccount[158] VOID_TRIAL_RERUN (class 4 tab 4)',
    read: 'getTalentBonus(VOID_TRIAL_RERUN, y) x OptionsListAccount[158]',
    tabs: [4],
    perPreset: true,
    classes: VOID,
  },
  merit6: { game: '5*Tasks[2][5][0]', read: 'TaskZZ2[5][0]', tabs: [5] },
  grimoire45: { game: 'Summoning("GrimoireUpgBonus",45,0)', read: 'getGrimoireBonus(45)', tabs: [5] },
  compass46: { game: 'Windwalker("CompassBonus",46,0)', read: 'getCompassBonus(46)', tabs: [5] },
  grimoire32: {
    game: '14==CharacterClass: Summoning("GrimoireUpgBonus",32,0)',
    read: 'getGrimoireBonus(32)',
    tabs: [5],
    classes: [14],
  },
  compass56: {
    game: '29==CharacterClass: Windwalker("CompassBonus",56,0)',
    read: 'getCompassBonus(56)',
    tabs: [5],
    classes: [29],
  },
  compass67: {
    game: '29==CharacterClass: Windwalker("CompassBonus",67,0)',
    read: 'getCompassBonus(67)',
    tabs: [5],
    classes: [29],
  },
  tesseract33: {
    game: '40==CharacterClass: ArcaneType("ArcaneUpgBonus",33,0)',
    read: 'getTesseractBonus(33)',
    tabs: [5],
    classes: [40],
  },
  orblet2: {
    game: '12|16==CharacterClass: Thingies("OrbletMarketBonus",2,0)',
    read: 'getOrbletMarketBonus(2)',
    tabs: [5],
    classes: ROYAL,
  },
  spelunkShop62: {
    game: '12|16==CharacterClass: Spelunk("ShopUpgBonus",62,0)',
    read: 'getSpelunkingBonus(62)',
    tabs: [5],
    classes: ROYAL,
  },
  lore9: {
    game: '12|16==CharacterClass: 50*Spelunk("DoWeHaveLoreN1",9,0)',
    read: 'Spelunk[0][9] >= 1',
    tabs: [5],
    classes: ROYAL,
  },
  armory: {
    game: '12|16==CharacterClass: RoyalG("ArmoryUpgBonus",46..49,0)',
    read: 'getArmoryUpgradeBonus(46..49)',
    tabs: [5],
    classes: ROYAL,
  },
  t8: {
    game: 'GetTalentNumber(1,8) STAR_PLAYER (star tab)',
    read: 'getTalentBonus(STAR_PLAYER)',
    tabs: [6],
    perPreset: true,
  },
  t17: {
    game: 'GetTalentNumber(1,17) SUPERNOVA_PLAYER (star tab)',
    read: 'getTalentBonus(SUPERNOVA_PLAYER)',
    tabs: [6],
    perPreset: true,
  },
  t622: {
    game: 'GetTalentNumber(1,622) STONKS! (star tab)',
    read: 'getTalentBonus(flatStarTalents, STONKS!)',
    tabs: [6],
    perPreset: true,
  },
  starRest: {
    game: 'the rest of the star line: FamBonusQTYs[64], StampBonusOfTypeX("TalentS"), GuildBonuses(11), FlurboShop(1), the three capped cards, SigilBonus 9, ShinyBonusS 14, GetBribeBonus("32"), 100*FractalIslandBonus, VaultUpgBonus 53',
    read: 'Toolbox calcTotalStarTalent (vendor/parsers/talents.ts)',
    tabs: [6],
  },
  jelly: {
    game: '12|16==CharacterClass: JellyOperation("RoG_BonusQTY",6|59,0)',
    read: 'getJellyBonus(6), getJellyBonus(59)',
    tabs: [5],
    classes: ROYAL,
  },
};

const at = (a: readonly number[], i: number) => {
  const v = a[i];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
};

/** `_customBlock_AchieveStatus(n)`: 1 when `AchieveReg[n] == -1`. */
const ach = (reg: readonly number[], n: number) => (reg[n] === -1 ? 1 : 0);

/**
 * `TalentDL` (TotalTalentPoints' first block): [-3 + the 9 first skill levels, half of each floored,
 * a fifth of each floored]. round(GetTalentNumber(1, 275)) on the first is 0: talent 275 is an empty
 * slot in the game's talent table (Toolbox talents.json has no entry 275).
 */
export function skillTerms(lv0: readonly number[]): [number, number, number] {
  let a = -3;
  let b = 0;
  let c = 0;
  for (let e = 0; e < 9; e++) {
    const v = at(lv0, e + 1);
    a += v;
    b += Math.floor(v / 2);
    c += Math.floor(v / 5);
  }
  return [a, b, c];
}

/** Classes whose tab 4 is the Voidwalker tab, with its own line. */
export const VOID_TAB_CLASS = 4;
/** Classes whose tab 5 is the Royal Guardian tab (Divine Knight has no tab 5; the line is the game's). */
export const ROYAL_TAB_CLASSES: readonly number[] = [12, 16];

/**
 * Tab `t`'s total (1-5) before spending, as TotalTalentPoints builds `TalentDL2` with spent = 0:
 * floor(sum of the terms). Toolbox terms missing from `tb` read 0, so with `tb = {}` this is a floor
 * (every Toolbox term is a bonus, never negative). Whether the game's max(0, .) clamp applies is
 * `clampsAtZero(t, classId)`; it acts on total - spent, so it is left to the caller.
 */
export function tabTotal(t: 1 | 2 | 3 | 4 | 5, r: RawPointTerms, tb: ToolboxPointTerms = {}): number {
  const L = at(r.lv0, 0);
  const [dl0, dl1, dl2] = skillTerms(r.lv0);
  const cy = (k: number) => at(r.cy, k);
  const A = (n: number) => ach(r.achieveReg, n);
  const T = (id: string) => {
    const v = tb[id];
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  };
  const shared = T('flurbo') + T('companion20');
  switch (t) {
    case 1:
      return Math.floor(
        3 * (L - 1) +
          dl0 +
          cy(0) +
          T('bubble') +
          T('vial1') +
          T('starSign1') +
          T('stamp1') +
          5 * A(54) +
          shared +
          T('arcade16') +
          6 * A(216) +
          T('shiny1') +
          T('vault1') +
          (r.ola436 ?? 0),
      );
    case 2:
      return Math.floor(
        3 * (L - 6) +
          dl1 +
          cy(1) +
          T('bubble') +
          T('vial2') +
          T('t119') +
          T('t299') +
          T('t494') +
          T('stamp2') +
          T('t44') +
          2 * A(76) +
          3 * A(78) +
          shared +
          8 * A(230) +
          T('shiny2') +
          T('vault6'),
      );
    case 3:
      return Math.floor(
        3 * (L - 29) +
          dl1 +
          cy(2) +
          T('bubble') +
          T('vial3') +
          T('stamp3') +
          5 * A(166) +
          10 * A(170) +
          shared +
          8 * A(219) +
          T('shiny3') +
          T('vault40'),
      );
    case 4:
      if (r.classId === VOID_TAB_CLASS)
        return Math.floor(1 + T('companion20') + T('t34') + T('t45y') * (r.ola158 ?? 0));
      return Math.floor(
        3 * Math.min(L - 89, 100) +
          Math.max(0, 2 * (L - 189)) +
          dl2 +
          cy(3) +
          T('bubble') +
          T('stamp4') +
          T('flurbo') +
          Math.floor(at(r.lv0, 14) / 2) +
          T('vial4') +
          3 * (r.merit5 ?? 0) +
          10 * A(292) +
          10 * A(295) +
          10 * A(239) +
          15 * A(240) +
          12 * A(241) +
          T('shiny4') +
          T('companion20'),
      );
    case 5: {
      if (ROYAL_TAB_CLASSES.includes(r.classId))
        return Math.floor(
          1 +
            T('orblet2') +
            T('spelunkShop62') +
            50 * (r.lore9 ?? 0) +
            5 * (r.merit6 ?? 0) +
            T('grimoire45') +
            T('compass46') +
            T('companion20') +
            T('armory46') +
            T('armory47') +
            T('armory48') +
            T('armory49') +
            T('jelly6') +
            T('jelly59'),
        );
      // TalentDLbonus[4]: CYTalentPoints[4] plus the master class's own system.
      const own =
        r.classId === 14
          ? T('grimoire32')
          : r.classId === 29
            ? T('compass56') + T('compass67')
            : r.classId === 40
              ? T('tesseract33')
              : 0;
      return Math.floor(
        3 * (L - 249) +
          dl2 +
          cy(4) +
          own +
          T('stamp5') +
          T('flurbo') +
          5 * (r.merit6 ?? 0) +
          T('grimoire45') +
          T('compass46') +
          T('companion20'),
      );
    }
  }
}

/** Tabs 4 and 5 (and so the Voidwalker and Royal Guardian lines) show max(0, total - spent). */
export const clampsAtZero = (t: number): boolean => t >= 4;

/**
 * The star tab's floor from the raw terms alone (L - 1 + TalentDL[0] + CYTalentPoints[5] + its
 * achievements); the exact star total is Toolbox's `calcTotalStarTalent` (M21 TR-3), which ports the
 * rest of the same line.
 */
export function starRawFloor(r: RawPointTerms): number {
  const L = at(r.lv0, 0);
  const [dl0] = skillTerms(r.lv0);
  const A = (n: number) => ach(r.achieveReg, n);
  return Math.floor(L - 1 + dl0 + at(r.cy, 5) + 10 * A(212) + 20 * A(289) + 20 * A(305));
}

/**
 * The ids of the terms tab `t` reads on class `classId`'s line, for a violation's evidence. Term ids
 * `armory` and `jelly` stand for their numbered Toolbox terms (`armory46`..`armory49`, `jelly6`, `jelly59`).
 */
export function termsOfTab(t: 1 | 2 | 3 | 4 | 5 | 'star', classId?: number): string[] {
  const tab = t === 'star' ? 6 : t;
  const special =
    (tab === 4 && classId === VOID_TAB_CLASS) || (tab === 5 && ROYAL_TAB_CLASSES.includes(classId ?? -1));
  return Object.entries(TALENT_POINT_TERMS)
    .filter(([id, s]) => {
      if (!s.tabs.includes(tab)) return false;
      if (classId === undefined) return true;
      if (s.classes) return s.classes.includes(classId);
      if (s.notClasses?.includes(classId)) return false;
      // The special lines read only their own terms (and companion 20), never the shared ones.
      return !special || id === 'companion20';
    })
    .map(([id]) => id);
}
