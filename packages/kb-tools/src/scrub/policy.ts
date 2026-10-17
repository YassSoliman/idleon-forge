// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The scrub policy (M11 TR-14): a table of rules over export paths. Paths are written the way the
// walker sees them: object keys joined with `.`, array items as `[i]`, a JSON-encoded string decoded
// as `~` (so `data.CogO~[3]` is item 3 of the JSON array stored in the string `data.CogO`).
//
// A `keep` on string leaves always names the values it allows (a lookup table, a value set or a
// value test): a path-only keep is rejected by `assertPolicy`, because a path that holds an id today
// can hold a name tomorrow (`data.OptLacc[37]` holds a guild name in a public save). Bump a rule's
// `version` whenever you change what it keeps: fixtures it matched must then be re-scrubbed.

export type ValueCheck =
  | { lookup: readonly string[] }
  | { set: readonly string[] }
  | { regex: RegExp }
  /** Every comma-separated token must pass the inner check (or be numeric). */
  | { tokens: ValueCheck; sep?: string }
  /** A set of letter codes: no spaces or separators, every character but `_` at most once ("ab_edfg"). */
  | { letterSet: true }
  /** Any of the checks. */
  | { any: readonly ValueCheck[] };

export type Action =
  /** Keep the leaf if its value passes `values` (strings); numbers are always kept. */
  | 'keep'
  /** Replace with an empty value of the same type: "" / 0 / [] / {} / false. */
  | 'blank'
  /** Blank every string leaf below; keep numbers. */
  | 'blank-strings'
  /** `charNames[i]` -> `Char{i+1}`. */
  | 'rename-chars'
  /** Another player's name -> `Member{n}` / `Opponent{n}` / `Friend{n}` (one map for all third parties). */
  | 'pseudonym'
  /** A name inside a structured game string, rewritten by `structured` (CogO, tournament, friends). */
  | 'structured'
  /** Numbers kept, strings must pass the unknown-string scan (may carry platform data). */
  | 'review';

export interface Rule {
  id: string;
  version: number;
  path: RegExp;
  action: Action;
  values?: ValueCheck;
  /** For 'pseudonym': the kind of third party. */
  kind?: 'Member' | 'Opponent' | 'Friend';
  /** For 'structured': which rewriter. */
  structured?: 'cog-player' | 'tournament-match' | 'friend-bonuses';
  why: string;
}

/** The 9 top-level keys of a Toolbox "Copy for support" export. Any other key stops the scrub. */
export const TOP_LEVEL_KEYS = [
  'accountCreateTime',
  'charNames',
  'companion',
  'data',
  'extraData',
  'guildData',
  'lastUpdated',
  'serverVars',
  'tournament',
] as const;

/**
 * serverVars keys we keep, reviewed against SERVER_VARS_READ (generated from the parsers). Everything
 * else in serverVars is server-wide broadcast data that names other players and guilds, and is blanked.
 * A key the parsers start reading stops the scrub until it is reviewed here.
 */
export const SERVER_VARS_KEEP: Readonly<Record<string, ValueCheck>> = {
  A_MineCost: { regex: /^[\d.,eE+-]*$/ },
  A_MineHP: { regex: /^[\d.,eE+-]*$/ },
  A_ResXP: { regex: /^[\d.,eE+-]*$/ },
  AncientArtiPCT: { regex: /^[\d.,eE+-]*$/ },
  AncientOddPerIsland: { regex: /^[\d.,eE+-]*$/ },
  ArcadeBonuses: { regex: /^[\d.,eE+-]*$/ },
  ArcGballPCT: { regex: /^[\d.,eE+-]*$/ },
  ChipRepo: { regex: /^[\d.,eE+-]*$/ },
  DustCost: { regex: /^[\d.,eE+-]*$/ },
  GameVERSION: { regex: /^[\d.]*$/ },
  GamingFertCostExpA: { regex: /^[\d.,eE+-]*$/ },
  GemPM_x: { regex: /^[\d.,eE+-]*$/ },
  KillroySwap: { regex: /^[\d.,eE+-]*$/ },
  RandEvntHr: { regex: /^[\d.,eE+-]*$/ },
  TomeOn: { regex: /^[\d.,eE+-]*$/ },
  TomePct: { regex: /^[\d.,eE+-]*$/ },
  voteCat2: { regex: /^[\d.,eE+-]*$/ },
  voteCategories: { regex: /^[\d.,eE+-]*$/ },
  votePercent: { regex: /^[\d.,eE+-]*$/ },
  votePercent2: { regex: /^[\d.,eE+-]*$/ },
};

const MONSTER_LIST: ValueCheck = { tokens: { lookup: ['monsters'] } };

/**
 * OptLacc string slots, reviewed. Slots the parsers read (generated `optLaccRead`) that hold a string
 * must be listed here; any other string slot is blanked. `'blank'` = read only by Toolbox's UI, or free
 * text; `'friends'` = the friend-bonus list (`stat,level,name;...`, misc.ts getFriendBonuses).
 */
export const OPTLACC_STRING_KEEP: Readonly<Record<number, ValueCheck | 'blank' | 'friends'>> = {
  32: { regex: /^[01]*$/ }, // one 0/1 per cauldron (alchemy.ts)
  37: 'blank', // guild name; read only by Toolbox's dashboard
  155: MONSTER_LIST, // five-star card list (cards.ts)
  169: { letterSet: true }, // island keys (islands.ts)
  172: { regex: /^[\d.]+(?:E\d+)?$/ }, // best DPS ever (islands.ts, tome.ts)
  311: { letterSet: true }, // bonus letters (misc.ts)
  379: { tokens: { regex: /^[A-Z][A-Z0-9_]*_SET$/ } }, // unlocked armor sets (armorSmithy.ts)
  384: { tokens: { regex: /^[a-z_]?\d+$|^\d+[a-z]\d+$/ } }, // prisma bubbles (alchemy.ts)
  476: 'friends', // friend bonuses: stat,level,friendName;... (misc.ts)
  603: MONSTER_LIST, // six-star card list (cards.ts)
  606: { regex: /^[\d,]*$/ }, // pet bonus tokens (misc.ts)
};

const UQ_TEXT: ValueCheck = { regex: /^[%_$]*[A-Z][A-Z0-9_]*$/ };
const CODE_LETTERS: ValueCheck = { any: [{ regex: /^[0-9a-z_]{1,40}$/ }, { letterSet: true }] };

export const RULES: readonly Rule[] = [
  // ---- identities and other players ----
  {
    id: 'char-names',
    version: 1,
    path: /^charNames\[\d+\]$/,
    action: 'rename-chars',
    why: 'character names',
  },
  { id: 'guild-id', version: 1, path: /^guildData\.id$/, action: 'blank', why: 'guild identity' },
  {
    id: 'guild-member-name',
    version: 1,
    path: /^guildData\.members\[\d+\]\.a$/,
    action: 'pseudonym',
    kind: 'Member',
    why: "other players' names; numbers kept so the guild parse still runs (guild.ts maps over the array)",
  },
  {
    id: 'guild-member-b',
    version: 1,
    path: /^guildData\.members\[\d+\]\.b$/,
    action: 'blank',
    why: 'member free text',
  },
  {
    id: 'data-guild-strings',
    version: 1,
    path: /^data\.Guild$/,
    action: 'blank-strings',
    why: 'guild name; numbers kept',
  },
  {
    id: 'tournament-leaderboard',
    version: 1,
    path: /^tournament\.leaderboard$/,
    action: 'blank',
    why: 'other players',
  },
  {
    id: 'tournament-user',
    version: 1,
    path: /^tournament\.user\..+$/,
    action: 'review',
    why: 'tournament.ts reads user.r and user.l',
  },
  {
    id: 'tournament-match',
    version: 1,
    path: /^tournament\.match\.d\[\d+\]$/,
    action: 'structured',
    structured: 'tournament-match',
    why: 'own characters -> Char{n}, opponents -> Opponent{n}, battle tokens value-checked',
  },
  {
    id: 'cog-player',
    version: 1,
    path: /^data\.CogO~?\[\d+\]$/,
    action: 'structured',
    structured: 'cog-player',
    values: { regex: /^Cog[A-Za-z0-9_]*$/ },
    why: 'Player_<name> per character (the Construction parser joins cogs to characters by it)',
  },
  // ---- serverVars and OptLacc (see the tables above) ----
  {
    id: 'server-vars',
    version: 1,
    path: /^serverVars\.[^.[~#]+$/,
    action: 'keep',
    why: 'only reviewed SERVER_VARS_READ keys',
  },
  {
    id: 'optlacc',
    version: 1,
    path: /^data\.OptLacc~?\[\d+\]$/,
    action: 'keep',
    why: 'only reviewed OPTLACC_STRING_KEEP slots',
  },
  // ---- platform data ----
  {
    id: 'player-stuff',
    version: 1,
    path: /^data\.(PlayerStuff_\d+|SteamAchieve)(~|\[|\.|$)/,
    action: 'review',
    why: 'may carry platform data',
  },
  {
    id: 'companion-e',
    version: 1,
    path: /^companion\.e$/,
    action: 'keep',
    values: { regex: /^[\d,]*$/ },
    why: 'the equipped companion (misc.ts)',
  },
  // ---- game codes, value-checked ----
  {
    id: 'uq-text',
    version: 1,
    path: /\.UQ[12]txt$/,
    action: 'keep',
    values: UQ_TEXT,
    why: 'equipment upgrade stat names',
  },
  {
    id: 'display-type',
    version: 1,
    path: /\.SuperFunItemDisplayType$/,
    action: 'keep',
    values: { set: ['Inventory', 'ObolUpgradeReroll'] },
    why: 'obol display type',
  },
  {
    id: 'cog-shape',
    version: 1,
    path: /^data\.CogM~?\.\d+\.h$/,
    action: 'keep',
    values: {
      set: [
        'adjacent',
        'around',
        'column',
        'corners',
        'diagonal',
        'down',
        'everything',
        'left',
        'right',
        'row',
        'up',
      ],
    },
    why: 'cog bonus shapes',
  },
  {
    id: 'sneaking-progress',
    version: 1,
    path: /^data\.SSprog~?\[\d+\]\[\d+\]$/,
    action: 'keep',
    values: { letterSet: true },
    why: 'letter codes',
  },
  {
    id: 'spelunk',
    version: 1,
    path: /^data\.Spelunk~?\[\d+\]\[\d+\]$/,
    action: 'keep',
    values: { lookup: ['spelunking'] },
    why: 'spelunking rock names',
  },
  {
    id: 'ninja',
    version: 1,
    path: /^data\.Ninja~?\[\d+\]\[\d+\]$/,
    action: 'keep',
    values: { any: [{ regex: /^Nj[A-Za-z]+\d*$/ }, { letterSet: true }] },
    why: 'sneaking items, unlock letter sets',
  },
  {
    id: 'quest-step',
    version: 1,
    path: /^data\.(QuestHm_\d+\[\d+\]\.0|OptL2_\d+\[\d+\]\.2)$/,
    action: 'keep',
    values: { regex: /^[A-Za-z_]+\d+$/ },
    why: 'quest step ids (NPC name + step)',
  },
  {
    id: 'quest-label',
    version: 1,
    path: /^data\.QuestHm_\d+\[\d+\]\.\d+$/,
    action: 'keep',
    values: { regex: /^[A-Za-z0-9_.'!&-]+:$/ },
    why: 'quest progress labels',
  },
  {
    id: 'territory',
    version: 1,
    path: /^data\.Territory~?\[\d+\]\[\d+\]$/,
    action: 'keep',
    values: { regex: /^CookingSpice\d+$/ },
    why: 'spices',
  },
  {
    id: 'gaming',
    version: 1,
    path: /^data\.Gaming\[\d+\]$/,
    action: 'keep',
    values: CODE_LETTERS,
    why: 'gaming plot codes',
  },
  {
    id: 'holes',
    version: 1,
    path: /^data\.Holes~?\[\d+\]\[\d+\]$/,
    action: 'keep',
    values: CODE_LETTERS,
    why: 'hole codes',
  },
  {
    id: 'letter-number',
    version: 1,
    path: /^data\.(Compass|CauldronBubbles)~?\[\d+\]\[\d+\]$/,
    action: 'keep',
    values: { regex: /^[a-z]\d+$/ },
    why: 'compass and bubble codes',
  },
  {
    id: 'cards1',
    version: 1,
    path: /^data\.Cards1~?\[\d+\]$/,
    action: 'keep',
    values: { regex: /^DungRNG\d+$|^Rare_Drop$|^Mega-Rare_Drop$/ },
    why: 'card drop labels',
  },
  {
    id: 'obol-locked',
    version: 1,
    path: /^data\.Obol(Eq|Inv)[A-Za-z0-9_]*\[\d+\]$/,
    action: 'keep',
    values: { regex: /^ObolLocked\d+$/ },
    why: 'locked obol slots',
  },
  {
    id: 'pets-none',
    version: 1,
    path: /^data\.(Pets|PetsStored)~?\[\d+\]\[\d+\]$/,
    action: 'keep',
    values: { set: ['none'] },
    why: 'empty pet slots',
  },
  {
    id: 'summon-boss',
    version: 1,
    path: /^data\.Summon~?\[\d+\]\[\d+\]$/,
    action: 'keep',
    values: { regex: /^Boss\d+[A-Z]?$/ },
    why: 'summoning bosses',
  },
  {
    id: 'quest-filler',
    version: 1,
    path: /^data\.QuestStatus_\d+~?\.QuestNameFiller2\[\d+\]$/,
    action: 'keep',
    values: { set: ['Starting amount (generally 0)'] },
    why: 'game placeholder text',
  },
];

/** The battle tokens of a tournament match ("2x4-", "_"). */
export const TOURNAMENT_TOKEN = /^(\d+x\d+[+-]|_)$/;

/** Numeric-looking strings pass the unknown-string scan (digits and ,;:._x+- plus an exponent). */
export const NUMERIC_LIKE = /^[\d,;:._x+\-\s]*(?:[eE][+-]?\d+)?$/;

export const PSEUDONYM = /^(Char|Member|Opponent|Friend)\d+$/;

/** Rejects a path-only keep on strings (TR-14): every keep names its values, except the two table rules. */
export function assertPolicy(rules: readonly Rule[] = RULES): void {
  for (const r of rules) {
    if (r.action === 'keep' && !r.values && r.id !== 'server-vars' && r.id !== 'optlacc')
      throw new Error(`policy rule ${r.id}: a keep must name the values it allows (lookup, set or regex)`);
    if (r.action === 'pseudonym' && !r.kind) throw new Error(`policy rule ${r.id}: pseudonym needs a kind`);
    if (r.action === 'structured' && !r.structured)
      throw new Error(`policy rule ${r.id}: structured needs a rewriter`);
  }
  const ids = rules.map((r) => r.id);
  if (new Set(ids).size !== ids.length) throw new Error('policy rule ids must be unique');
}

/** The rule for a path: the first match wins. */
export const ruleFor = (path: string, rules: readonly Rule[] = RULES): Rule | undefined =>
  rules.find((r) => r.path.test(path));

/** Stable text of a rule for the policy hash (the hash covers only the rules that matched a fixture). */
export function ruleSignature(r: Rule): string {
  const extra =
    r.id === 'server-vars'
      ? JSON.stringify(Object.keys(SERVER_VARS_KEEP).sort())
      : r.id === 'optlacc'
        ? JSON.stringify(
            Object.entries(OPTLACC_STRING_KEEP).map(([k, v]) => [
              k,
              typeof v === 'string'
                ? v
                : String(JSON.stringify(v, (_k, x) => (x instanceof RegExp ? x.source : x))),
            ]),
          )
        : '';
  return `${r.id}@${r.version}:${r.action}:${r.path.source}:${JSON.stringify(r.values ?? null, (_k, x) => (x instanceof RegExp ? x.source : x))}:${extra}`;
}
