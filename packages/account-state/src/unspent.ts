// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 Unspent & idle (M6 TR-3): Toolbox output -> the unspent-and-idle Account State fields. Called
// from adapter.ts; like it, this is the only place that knows the Toolbox paths it reads. A field whose
// source is missing is null and, where its raw keys are missing, listed in diagnostics.unknownFields.
//
// Every `accountOptions[n]` read goes through the OLA table below (M6 TR-3, R8): each index cites
// Toolbox's code at the pin (the parser that names it) and is covered by the OLA contract test, which
// checks type and range and snapshots each value per fixture, so a patch that moves an index fails CI.
import type {
  AlchemyState,
  CauldronId,
  CooldownGame,
  DeathNoteBuildingState,
  KeyBank,
  KeyId,
  MeritWorld,
  MinigamesState,
  PetMartState,
  PetsState,
  PostOfficeState,
  SaltState,
  TicketBank,
  UnspentAccountFields,
  UnspentCharacterFields,
} from './unspent-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const num = (v: unknown, fallback = 0): number => finite(v) ?? fallback;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * The `accountOptions` (OptLacc) indices M6 reads, each with where Toolbox names it at the pin
 * (6c37e3d). Toolbox's data/account-options-enum.js is not vendored, so the parser that reads the
 * index is the citation.
 */
export const OLA = {
  /** parsers/misc.ts enhanceColoTickets: Typhoon's day counter. */
  TICKETS_TYPHOON_DAYS: 15,
  /** parsers/misc.ts enhanceKeysObject: Dog Bone (Forest Villa key) day counter. */
  KEYS_FOREST_VILLA_DAYS: 16,
  /** parsers/misc.ts enhanceKeysObject: Djonnut (Efaunt's Tomb key). */
  KEYS_EFAUNT_DAYS: 31,
  /** parsers/misc.ts getCurrencies: the shared skill-minigame play pool. */
  MINIGAME_PLAYS: 33,
  /** parsers/misc.ts enhanceColoTickets: Centurion. */
  TICKETS_CENTURION_DAYS: 35,
  /** parsers/misc.ts enhanceColoTickets: Lonely Hunter. */
  TICKETS_LONELY_HUNTER_DAYS: 56,
  /** parsers/misc.ts enhanceKeysObject: Bellows (Chizoar's Cavern key). */
  KEYS_CHIZOAR_DAYS: 80,
  /** utility/dashboard/characters.js alchemyAlerts: Breeding arena max wave. */
  ARENA_MAX_WAVE: 89,
  /** utility/dashboard/account.js etc alerts: Spiketrap gems unclaimed today when 1 (N.js `OptionsListAccount[7]`). */
  SPIKETRAP_GEMS_TODAY: 7,
  /** parsers/highScores.ts getHighscores: Spiketrap best round. */
  SPIKETRAP_BEST: 201,
  /** parsers/highScores.ts getHighscores: Hoops best score. */
  HOOPS_BEST: 242,
  /** M6 minigames dossier (N.js MinigameHoops): unspent Hoops points. */
  HOOPS_POINTS: 418,
  /** parsers/highScores.ts getHoopsData: the four Hoops upgrade levels. */
  HOOPS_LEVELS: [419, 420, 421, 422] as const,
  /** M6 minigames dossier: Hoops cooldown seconds left at the save. */
  HOOPS_COOLDOWN: 423,
  /** M6 minigames dossier: Hoops plays today. */
  HOOPS_PLAYS_TODAY: 424,
  /** M6 minigames dossier (N.js MinigameDarts): unspent Darts points. */
  DARTS_POINTS: 434,
  /** parsers/highScores.ts getDartsData: the four Darts upgrade levels. */
  DARTS_LEVELS: [435, 436, 437, 438] as const,
  /** M6 minigames dossier: Darts cooldown seconds left at the save. */
  DARTS_COOLDOWN: 439,
  /** M6 minigames dossier: Darts plays today. */
  DARTS_PLAYS_TODAY: 440,
  /** parsers/highScores.ts getHighscores: Darts best score. */
  DARTS_BEST: 442,
  /** utility/dashboard/account.js petMartGems: the last shop day the free Pet Mart gems were claimed. */
  PET_MART_LAST_CLAIMED_DAY: 516,
} as const;

/** Every scalar OLA index above, for the contract test. */
export const OLA_INDICES: readonly number[] = Object.values(OLA)
  .flatMap((v) => (typeof v === 'number' ? [v] : [...v]))
  .sort((a, b) => a - b);

/**
 * The Pet Mart gem claim (M6 FR-13) stays off until Yasser confirms it in game (M6 Final rulings).
 * What the game code says (N.js at 2.3.540, read 2026-10-17): the claim sits on the Pet Mart tab of the
 * Tournament menu (MenuType2 98), which the Quick Ref opens from its slot 13, and that slot is enabled
 * unconditionally (`_GenINFO[54][13]=1`); the claim needs OLA[516] < shop day, shop day ≥ 1 and
 * GemPM_x ≥ 0.1, exactly the Toolbox rule. So the code shows no progress gate; the in-game check is
 * still owed before the gate opens.
 */
export const PET_MART_UNLOCK_VERIFIED = false;

/** The Breeding arena wave that adds the third big-bubble slot: website-data randomList[53][11] = 100. */
export const ARENA_THIRD_BUBBLE_WAVE = 100;
/** Companion 4, Sheepie: "all big bubbles count as equipped" (Toolbox isCompanionBonusActive(account, 4)). */
export const SHEEPIE_COMPANION_INDEX = 4;
/** `serverVars.GemPM_x` must be at least this for the game to offer the Pet Mart gems (N.js, Toolbox). */
export const PET_MART_MIN_SERVER_VAR = 0.1;

const CAULDRONS: readonly CauldronId[] = ['power', 'quicc', 'high-iq', 'kazam'];

/** The three keys M6 tracks, their NPC and the earner threshold (M6 R1: the game's > 5 for Djonnut, not Toolbox's > 6). */
const KEYS: ReadonlyArray<{ id: KeyId; npc: string; earnAbove: number }> = [
  { id: 'forest-villa', npc: 'Dog_Bone', earnAbove: 5 },
  { id: 'efaunt', npc: 'Djonnut', earnAbove: 5 },
  { id: 'chizoar', npc: 'Bellows', earnAbove: 8.5 },
];
const KEY_DAYS = [OLA.KEYS_FOREST_VILLA_DAYS, OLA.KEYS_EFAUNT_DAYS, OLA.KEYS_CHIZOAR_DAYS];
const TICKET_DAYS = [OLA.TICKETS_TYPHOON_DAYS, OLA.TICKETS_CENTURION_DAYS, OLA.TICKETS_LONELY_HUNTER_DAYS];
/** Keys and tickets bank at most this many days (Toolbox misc.ts `Math.min(daysSincePickup, 3)`). */
export const BANK_CAP_DAYS = 3;

/** Toolbox's getDartsData / getHoopsData unlock thresholds (total levels) per upgrade, parsers/highScores.ts. */
export const DARTS_UNLOCKS = [0, 40, 150, 250] as const;
export const HOOPS_UNLOCKS = [0, 12, 80, 200] as const;

/** What unspent.ts needs from the adapter's collector. */
export interface UnspentCollector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

export interface UnspentInputs {
  account: Dict;
  /** Toolbox's characters, by save slot (stubs included). */
  characters: unknown[];
  /** Slots of the characters with data. */
  withData: number[];
  levels: number[];
  finishedWorlds: number[];
  currentWorld: number | null;
}

const ola = (account: Dict): unknown[] => list(account.accountOptions);

function readAlchemy(account: Dict, characters: unknown[]): AlchemyState | null {
  const alch = account.alchemy;
  if (!isDict(alch) || !isDict(alch.cauldrons) || !isDict(alch.bubbles) || !isDict(alch.p2w)) return null;
  const cauldrons = CAULDRONS.map((id) => {
    const c = isDict(alch.cauldrons) ? (alch.cauldrons as Dict)[id] : undefined;
    const bubbles = list((alch.bubbles as Dict)[id]);
    if (!isDict(c)) return null;
    const unlocked = num(c.unlockedBubbles);
    const next = bubbles[unlocked];
    const newBubble = isDict(c.newBubble) ? c.newBubble : {};
    return {
      id,
      expectedNewBubbles: num(newBubble.expectedBubbles),
      unlockedBubbles: unlocked,
      nextBubble:
        isDict(next) && typeof next.bubbleName === 'string' && typeof next.rawName === 'string'
          ? { name: next.bubbleName, rawName: next.rawName }
          : null,
    };
  });
  if (cauldrons.some((c) => c === null)) return null;
  const unlockedBubbles = list(alch.bubblesFlat)
    .filter(
      (b): b is Dict =>
        isDict(b) && num(b.level) >= 1 && typeof b.rawName === 'string' && typeof b.bubbleName === 'string',
    )
    .map((b) => ({ rawName: b.rawName as string, name: b.bubbleName as string }))
    .sort((a, b) => (a.rawName < b.rawName ? -1 : a.rawName > b.rawName ? 1 : 0));
  const va = isDict(alch.p2w.vialsAttempts) ? alch.p2w.vialsAttempts : null;
  if (!va) return null;
  // Toolbox's vialsAttempts alert: a level-0 vial whose first ingredient is held somewhere.
  const held = heldItems(account, characters);
  const vialAttemptsUsable = list(alch.vials).some((v) => {
    if (!isDict(v) || num(v.level) !== 0) return false;
    const req = list(v.itemReq)[0];
    return isDict(req) && typeof req.rawName === 'string' && (held.get(req.rawName) ?? 0) > 0;
  });
  return {
    cauldrons: cauldrons as AlchemyState['cauldrons'],
    unlockedBubbles,
    vialAttempts: { current: num(va.current), max: num(va.max) },
    vialAttemptsUsable,
  };
}

/** rawName -> amount over storage and every character's inventory. */
function heldItems(account: Dict, characters: unknown[]): Map<string, number> {
  const out = new Map<string, number>();
  const add = (items: unknown) => {
    for (const i of list(items))
      if (isDict(i) && typeof i.rawName === 'string')
        out.set(i.rawName, (out.get(i.rawName) ?? 0) + num(i.amount));
  };
  add(isDict(account.storage) ? account.storage.list : undefined);
  for (const c of characters) if (isDict(c)) add(c.inventory);
  return out;
}

function readKeys(account: Dict, characters: unknown[], withData: number[]): KeyBank[] | null {
  const cur = account.currencies;
  if (!isDict(cur) || !Array.isArray(cur.KeysAll)) return null;
  const o = ola(account);
  return KEYS.map((k, i) => {
    const item = cur.KeysAll as unknown[];
    const raw = isDict(item[i]) ? (item[i] as Dict) : {};
    const dialog = (slot: number) => {
      const c = characters[slot];
      return isDict(c) && isDict(c.npcDialog) ? num(c.npcDialog[k.npc]) : 0;
    };
    const perDay = withData.filter((s) => dialog(s) > k.earnAbove).length;
    const days = finite(o[KEY_DAYS[i] as number]);
    return {
      id: k.id,
      rawName: typeof raw.rawName === 'string' ? raw.rawName : `Key${i + 1}`,
      name: typeof raw.name === 'string' ? raw.name : '',
      perDay,
      daysSincePickup: days,
      banked: Math.min(Math.max(days ?? 0, 0), BANK_CAP_DAYS) * perDay,
    };
  });
}

function readTickets(account: Dict, finishedWorlds: number[]): TicketBank[] | null {
  const o = ola(account);
  if (o.length === 0) return null;
  return TICKET_DAYS.map((index, npc) => {
    const days = finite(o[index]);
    return {
      npc: npc as 0 | 1 | 2,
      reachable: npc === 0 || finishedWorlds.includes(npc),
      daysSincePickup: days,
      banked: Math.min(Math.max(days ?? 0, 0), BANK_CAP_DAYS),
    };
  });
}

/** Toolbox's highScores.ts cost per upgrade, at the given levels (copied from getDartsData/getHoopsData). */
function cooldownGame(o: unknown[], game: 'darts' | 'hoops', account: Dict): CooldownGame {
  const darts = game === 'darts';
  const levels = (darts ? OLA.DARTS_LEVELS : OLA.HOOPS_LEVELS).map((i) => num(o[i]));
  const total = levels.reduce((s, x) => s + x, 0);
  const unlocks = darts ? DARTS_UNLOCKS : HOOPS_UNLOCKS;
  // Toolbox's per-upgrade cost, from the parsed highscores entry (getDartsData / getHoopsData).
  const hs = isDict(account.highscores) ? list(account.highscores.minigameHighscores) : [];
  const entry = hs.find((h) => isDict(h) && h.name === game) as Dict | undefined;
  const upgrades = list(entry?.upgrades);
  const nextCosts = unlocks.map((need, i) => {
    if (total < need) return null;
    const u = upgrades[i];
    return isDict(u) ? finite(u.cost) : null;
  });
  return {
    points: num(o[darts ? OLA.DARTS_POINTS : OLA.HOOPS_POINTS]),
    levels,
    nextCosts,
    cooldownSecondsAtSave: num(o[darts ? OLA.DARTS_COOLDOWN : OLA.HOOPS_COOLDOWN]),
    playsToday: num(o[darts ? OLA.DARTS_PLAYS_TODAY : OLA.HOOPS_PLAYS_TODAY]),
    bestScore: num(o[darts ? OLA.DARTS_BEST : OLA.HOOPS_BEST]),
  };
}

function readMinigames(account: Dict, characters: unknown[]): MinigamesState | null {
  const o = ola(account);
  const hsRoot = account.highscores;
  if (o.length === 0 || !isDict(hsRoot) || !Array.isArray(hsRoot.minigameHighscores)) return null;
  const score = (name: string) => {
    const h = (hsRoot.minigameHighscores as unknown[]).find((x) => isDict(x) && x.name === name);
    return isDict(h) ? num(h.score) : 0;
  };
  const funguyChoppinDone = characters.some(
    (c) => isDict(c) && isDict(c.questComplete) && num(c.questComplete.Funguy2, -1) === 1,
  );
  const cur = isDict(account.currencies) ? account.currencies : {};
  return {
    plays: num(cur.minigamePlays ?? o[OLA.MINIGAME_PLAYS]),
    highscores: {
      choppin: score('chopping'),
      fishing: score('fishing'),
      catching: score('catching'),
      mining: score('mining'),
    },
    funguyChoppinDone,
    darts: cooldownGame(o, 'darts', account),
    hoops: cooldownGame(o, 'hoops', account),
    spiketrap: {
      gemsAvailableToday: num(o[OLA.SPIKETRAP_GEMS_TODAY]) === 1,
      bestRound: num(o[OLA.SPIKETRAP_BEST]),
    },
  };
}

function readPets(account: Dict): PetsState | null {
  const comp = account.companions;
  if (!isDict(comp)) return null;
  const anchor = finite(comp.freeClaimAnchor);
  if (anchor === null || !Array.isArray(comp.list)) return null;
  const owned = comp.list.filter((c) => isDict(c) && c.acquired === true).length;
  const sheep = comp.list[SHEEPIE_COMPANION_INDEX];
  return { freeClaimAnchor: anchor, owned, sheepie: isDict(sheep) && sheep.acquired === true };
}

function readPetMart(account: Dict): PetMartState | null {
  const o = ola(account);
  const t = account.tournament;
  const sv = account.serverVars;
  if (o.length === 0 || !isDict(t) || !isDict(t.global) || !isDict(sv)) return null;
  return {
    unlocked: PET_MART_UNLOCK_VERIFIED,
    lastClaimedShopDay: num(o[OLA.PET_MART_LAST_CLAIMED_DAY]),
    currentShopDay: num(t.global.S),
    gemsOffered: num(sv.GemPM_x) >= PET_MART_MIN_SERVER_VAR,
  };
}

function readPostOffice(account: Dict, characters: unknown[], withData: number[]): PostOfficeState | null {
  if (!Array.isArray(account.postOfficeShipments)) return null;
  const quest = (slot: number) => {
    const c = characters[slot];
    return isDict(c) && isDict(c.questComplete) ? finite(c.questComplete.Postboy_Pablob1) : null;
  };
  const timeAway = isDict(account.timeAway) ? account.timeAway : {};
  const refresh = finite(timeAway.PostOfficeRefresh);
  return {
    unlocked: withData.some((s) => quest(s) === 1),
    questInProgressOn: withData.filter((s) => quest(s) === 0),
    companiesNotDoneToday: account.postOfficeShipments.filter((s) => isDict(s) && !num(s.completedAnOrder))
      .length,
    refreshInSeconds: refresh !== null && refresh >= 0 ? refresh : null,
  };
}

function readMerits(account: Dict): MeritWorld[] | null {
  const tasks = list(account.tasks);
  const unspent = list(tasks[4]);
  const levels = list(tasks[2]);
  const desc = list(account.meritsDescriptions);
  if (unspent.length < 5 || levels.length < 4 || desc.length < 4) return null;
  return ([1, 2, 3, 4] as const).map((world) => ({
    world,
    unspent: num(unspent[world]),
    rows: list(desc[world - 1]).map((m, index) => {
      const row = isDict(m) ? m : {};
      return {
        index,
        level: num(list(levels[world - 1])[index]),
        max: num(row.totalLevels),
        cost: finite(row.meritCost),
      };
    }),
  }));
}

function readTaskUnlocks(account: Dict, currentWorld: number | null): UnspentAccountFields['taskUnlocks'] {
  const tu = account.taskUnlocks;
  if (!isDict(tu) || !Array.isArray(tu.taskUnlocksList) || currentWorld === null) return null;
  const open = tu.taskUnlocksList.slice(0, currentWorld);
  const openUnbought = open.reduce<number>(
    (sum, column) => sum + list(column).filter((r) => isDict(r) && !num(r.unlocked)).length,
    0,
  );
  return { owned: num(tu.unlockPointsOwned), bought: num(tu.unlockedRecipes), openUnbought };
}

function readSalts(account: Dict): SaltState[] | null {
  const ref = account.refinery;
  if (!isDict(ref) || !Array.isArray(ref.salts)) return null;
  const taskLevel = num(ref.refinerySaltTaskLevel, -1);
  return ref.salts.map((s, saltIndex) => {
    const salt = isDict(s) ? s : {};
    const rank = num(salt.rank);
    // Toolbox world-3/refinery.ts hasMissingMats: totalAmount < floor(rank ^ e) × quantity, with e 1.3
    // for a salt input while the salt is within the refinery task level, else 1.5 (ADR 0005 arithmetic).
    const missingFuel = list(salt.cost).flatMap((c) => {
      if (!isDict(c) || typeof c.rawName !== 'string') return [];
      const e = c.rawName.includes('Refinery') && saltIndex <= taskLevel ? 1.3 : 1.5;
      const need = Math.floor(rank ** e) * num(c.quantity);
      const have = num(c.totalAmount);
      const name = typeof c.name === 'string' ? c.name : c.rawName;
      return have < need ? [{ rawName: c.rawName, name, need, have }] : [];
    });
    return {
      rawName: typeof salt.rawName === 'string' ? salt.rawName : `Refinery${saltIndex + 1}`,
      name: typeof salt.saltName === 'string' ? salt.saltName : '',
      unlocked: salt.unlocked === true,
      active: num(salt.active) > 0 || salt.active === true,
      rank,
      missingFuel,
    };
  });
}

function readDeathNote(account: Dict): DeathNoteBuildingState | null {
  const towers = account.towers;
  if (!isDict(towers) || !Array.isArray(towers.data)) return null;
  const t = towers.data.find((x) => isDict(x) && x.name === 'Death_Note');
  if (!isDict(t)) return null;
  const req = list(t.itemReq)[0];
  const nextCost =
    isDict(req) && typeof req.rawName === 'string' ? { rawName: req.rawName, amount: num(req.amount) } : null;
  let held = 0;
  if (nextCost) {
    const storage = isDict(account.storage) ? list(account.storage.list) : [];
    const refinery = isDict(account.refinery) ? list(account.refinery.refineryStorage) : [];
    for (const i of [...storage, ...refinery])
      if (isDict(i) && i.rawName === nextCost.rawName) held += num(i.amount);
  }
  return { inBuildSlot: t.inProgress === true, nextCost, held };
}

function readBigBubbleSlots(account: Dict): number | null {
  const bribes = account.bribes;
  const o = ola(account);
  if (!Array.isArray(bribes) || o.length === 0) return null;
  const code = bribes.some((b) => isDict(b) && b.name === 'Changing_the_Code' && b.done === true);
  const arena = num(o[OLA.ARENA_MAX_WAVE]) >= ARENA_THIRD_BUBBLE_WAVE;
  return 1 + (code ? 1 : 0) + (arena ? 1 : 0);
}

/** Reads one field: null when `read` gives null or a raw key behind it is missing (then it is unknown). */
function field<T>(c: UnspentCollector, path: string, slots: number[], read: () => T | null): T | null {
  if (!c.checkRaw(path, path, null, slots)) return null;
  const v = read();
  if (v === null) c.unknown(path);
  return v;
}

/** The M6 account fields, plus M6's full `salts` list (the adapter prefers it over M2's rawName/unlocked one). */
export function readUnspentAccount(
  i: UnspentInputs,
  c: UnspentCollector,
): UnspentAccountFields & { salts: SaltState[] | null } {
  const { account, characters, withData } = i;
  const s = withData;
  return {
    highestLevel: i.levels.length ? Math.max(...i.levels) : null,
    alchemy: field(c, 'account.alchemy', s, () => readAlchemy(account, characters)),
    bigBubbleSlots: field(c, 'account.bigBubbleSlots', s, () => readBigBubbleSlots(account)),
    merits: field(c, 'account.merits', s, () => readMerits(account)),
    taskUnlocks: field(c, 'account.taskUnlocks', s, () => readTaskUnlocks(account, i.currentWorld)),
    gems: field(c, 'account.gems', s, () =>
      isDict(account.currencies) ? finite(account.currencies.gems) : null,
    ),
    gemPurchases: field(c, 'account.gemPurchases', s, () =>
      Array.isArray(account.gemShopPurchases) ? account.gemShopPurchases.map((x) => num(x)) : null,
    ),
    keys: field(c, 'account.keys', s, () => readKeys(account, characters, withData)),
    colosseumTickets: field(c, 'account.colosseumTickets', s, () => readTickets(account, i.finishedWorlds)),
    minigames: field(c, 'account.minigames', s, () => readMinigames(account, characters)),
    // Side-read fields: an absent companions or tournament doc is null without an unknown mark (a
    // public save carries no side reads); a side read that errored is unknown through FIELD_SIDE_READS.
    pets: readPets(account),
    petMart: readPetMart(account),
    postOffice: field(c, 'account.postOffice', s, () => readPostOffice(account, characters, withData)),
    poppy: field(c, 'account.poppy', s, () => {
      const k = account.kangaroo;
      if (!isDict(k)) return null;
      const upgrades = list(k.upgrades);
      const unlocked = num(k.totalFish) > 0 || upgrades.some((u) => isDict(u) && num(u.level) > 0);
      return { unlocked, pendingFish: num(k.pendingFish) };
    }),
    salts: readSalts(account),
    deathNoteBuilding: field(c, 'account.deathNoteBuilding', s, () => readDeathNote(account)),
  };
}

/** The M6 character fields. */
export function readUnspentCharacter(raw: Dict): UnspentCharacterFields {
  const po = isDict(raw.postOffice) ? finite(raw.postOffice.unspentPoints) : null;
  const anvil =
    isDict(raw.anvil) && isDict(raw.anvil.anvilStats) ? finite(raw.anvil.anvilStats.availablePoints) : null;
  return {
    bigBubbles: list(raw.equippedBubbles).map((b) =>
      isDict(b) && typeof b.rawName === 'string' && b.rawName !== '' ? b.rawName : null,
    ),
    postOfficeUnspent: po,
    anvilPointsAvailable: anvil,
  };
}
