// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Game data the truth readers need, copied from the game client itself, not from IdleOn Toolbox.
// Source: https://www.legendsofidleon.com/ytGl5oc/N.js (Last-Modified 2026-10-17T01:42:35Z, read
// 2026-10-18; server build 142). Re-extract after a patch with `node packages/truth/scripts/extract-n.mjs <N.js>`.

/** Where each table and formula comes from in N.js (byte offsets in the copy read on 2026-10-18). */
export const GAME_SOURCES = {
  url: 'https://www.legendsofidleon.com/ytGl5oc/N.js',
  lastModified: '2026-10-17T01:42:35Z',
  verifiedOn: '2026-10-18',
  serverBuild: 142,
  /** `ja.ClassNames`: class id -> name. */
  classNames: 13875832,
  /** `ja.TalentOrder`: 15 talent ids per class, class id k at [15 (k - 1), 15 k). */
  talentOrder: 13880431,
  /** `_customBlock_TotalTalentPoints(spent)`: points left per tab (tabs 1-5, then the star tab). */
  totalTalentPoints: 4370453,
  /** `_customBlock_ReturnClasses(class)`: the classes whose tabs a class has, in tab order. */
  returnClasses: 4149169,
  /** `_customBlock_AchieveStatus(n)`: 1 when `AchieveReg[n] == -1`. */
  achieveStatus: 7785374,
  /** Save loader: `SL_<i>` -> SkillLevels (the live preset). */
  loadSkillLevels: 19879565,
  /** Save loader: `SLpre_<i>` -> TalPresetLISTS[1 - PlayerStuff[1]] (the other preset). */
  loadOtherPreset: 19896522,
  /** Save loader: `CY<name>` -> CurrenciesOwned (`CYTalentPoints` -> CurrenciesOwned.TalentPoints). */
  loadCurrencies: 19881972,
} as const;

/** `ja.ClassNames` (upper case, as the game writes them). Index = `CharacterClass_<i>`. */
export const CLASS_NAMES: readonly string[] = [
  '0',
  'BEGINNER',
  'JOURNEYMAN',
  'MAESTRO',
  'VOIDWALKER',
  'INFINILYTE',
  'RAGE_BASICS',
  'WARRIOR',
  'BARBARIAN',
  'SQUIRE',
  'BLOOD_BERSERKER',
  'NOPE',
  'DIVINE_KNIGHT',
  'NOPE',
  'DEATH_BRINGER',
  'FILLER',
  'ROYAL_GUARDIAN',
  'FILLER',
  'CALM_BASICS',
  'ARCHER',
  'BOWMAN',
  'HUNTER',
  'SIEGE_BREAKER',
  'NOPE',
  'NOPE',
  'BEAST_MASTER',
  'FILLER',
  'FILLER',
  'FILLER',
  'WIND_WALKER',
  'SAVVY_BASICS',
  'MAGE',
  'WIZARD',
  'SHAMAN',
  'ELEMENTAL_SORCERER',
  'SPIRITUAL_MONK',
  'BUBONIC_CONJUROR',
  'NOPE',
  'FILLER',
  'FILLER',
  'ARCANE_CULTIST',
  'FILLER',
  'MINING',
  'SMITHING',
  'CHOPPING',
  'FISHING',
  'ALCHEMY',
  'BUG_CATCHING',
  'TRAPPING',
  'CONSTRUCTION',
  'WORSHIP',
  'COOKING',
  'BREEDING',
  'LABORATORY',
  'SAILING',
  'DIVINITY',
  'GAMING',
  'FARMING',
  'SNEAKING',
  'SUMMONING',
  'SPELUNKING',
  'RESEARCH',
  'SKILL_3_LOL',
];

/** `ja.TalentOrder`: row k - 1 holds class k's 15 talent ids, in the order the talent book shows them. */
export const TALENT_ORDER: readonly number[] = [
  0, 1, 8, 9, 5, 10, 11, 12, 13, 6, 75, 76, 77, 78, 79, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
  28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
  55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 0, 1, 8, 9, 5, 10, 11, 12,
  13, 6, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
  108, 109, 110, 111, 112, 81, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 111, 127, 81, 129,
  130, 131, 132, 133, 119, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150,
  151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 141,
  142, 143, 144, 175, 176, 177, 178, 149, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192,
  193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213,
  214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 229, 228, 230, 231, 232, 203, 234,
  235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 0, 1, 8,
  9, 5, 10, 11, 12, 13, 6, 263, 266, 267, 268, 269, 270, 271, 272, 273, 274, 284, 276, 277, 278, 279, 280,
  281, 282, 283, 265, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301,
  302, 303, 304, 305, 291, 307, 293, 309, 310, 311, 312, 313, 299, 360, 316, 317, 318, 319, 320, 366, 367,
  368, 144, 325, 326, 327, 328, 374, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343,
  344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 315, 361, 362, 363, 364,
  365, 366, 367, 368, 144, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385,
  386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406,
  407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427,
  428, 429, 430, 431, 432, 433, 434, 0, 1, 8, 9, 5, 10, 11, 12, 13, 6, 445, 446, 447, 448, 449, 450, 451, 452,
  453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 464, 463, 465, 466, 467, 468, 469, 470, 486, 472, 488,
  474, 475, 476, 477, 478, 494, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494,
  495, 496, 497, 498, 499, 500, 531, 532, 533, 144, 505, 506, 507, 508, 539, 510, 511, 512, 513, 514, 515,
  516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 144, 535, 536,
  537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557,
  558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578,
  579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599,
  600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 657, 658, 617, 618, 619, 620,
  621, 622, 623, 624, 616, 626, 627, 632, 631, 630, 629, 628, 633, 634, 635, 636, 637, 638, 639, 640, 641,
  642, 643, 644, 645, 646, 647, 625, 649, 650, 651, 652, 653, 654, 655, 656, 615, 648, 659, 660, 661, 662,
  663, 664, 665, 666, 667, 668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679,
];

/** Star talents are SkillLevels 615..679 (`TotalTalentPoints` callers sum `SkillLevels[615 + b]`, b < 65). */
export const STAR_FIRST = 615;
export const STAR_COUNT = 65;
