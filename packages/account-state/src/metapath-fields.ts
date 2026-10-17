// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The M2 Stage & Meta Path fields (M2 TR-3), read from Toolbox's output. Kept in their own file so the
// adapter only gains two calls; every Toolbox name these fields depend on is here.
import {
  type AccountSummary,
  type CharacterState,
  GATE_NPCS,
  GATE_QUEST_NPCS,
  type GateNpc,
  type GateQuestId,
  type GateQuestProgress,
  type NextPortal,
} from './types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** What the M2 per-character fields need from the adapter's presence checks. */
export interface MetaPathCharacterInput {
  raw: Dict;
  /** Whether the raw keys behind each field passed (FIELD_RAW_KEYS). */
  known: { classIndex: boolean; npcDialog: boolean; nextPortal: boolean };
}

export function metaPathCharacterFields({
  raw,
  known,
}: MetaPathCharacterInput): Pick<CharacterState, 'classIndex' | 'npcDialog' | 'nextPortal'> {
  // classIndex: Toolbox leaves it unset when CharacterClass is falsy (M2 FR-15).
  const classIndex = known.classIndex ? finite(raw.classIndex) : null;

  // npcDialog: narrowed to the gate NPCs (M2 TR-17), so no other NPC data enters the Account State.
  const npcDialog: Partial<Record<GateNpc, number>> = {};
  if (known.npcDialog && isDict(raw.npcDialog))
    for (const npc of GATE_NPCS) {
      const v = finite(raw.npcDialog[npc]);
      if (v !== null) npcDialog[npc] = v;
    }

  // nextPortal: Toolbox reports the first door of the current map; on a skilling map `current` is a skill
  // level, so only a fighting map's door counts.
  let nextPortal: NextPortal | null = null;
  const np = raw.nextPortal;
  if (known.nextPortal && isDict(np) && np.currentIcon === 'ClassIconsF') {
    const goal = finite(np.goal);
    const current = finite(np.current);
    if (goal !== null && goal > 0 && current !== null) nextPortal = { door: 0, current, goal };
  }
  return { classIndex, npcDialog, nextPortal };
}

const SALT_ORDER_FIELD = 'salts';

/** Section names the M2 account fields depend on (also listed in FIELD_SECTIONS). */
const failed = (sections: readonly string[], name: string) => sections.includes(name);

const CRYSTALS = {
  Crystal1: 'desertTopaz',
  Crystal2: 'glacierQuartz',
  Crystal3: 'galaxialAmethyst',
} as const;

function itemsOf(list: unknown): Array<{ rawName: string; amount: number }> {
  if (!Array.isArray(list)) return [];
  return list.flatMap((it) => {
    if (!isDict(it) || typeof it.rawName !== 'string') return [];
    const amount = finite(it.amount) ?? 0;
    return amount > 0 ? [{ rawName: it.rawName, amount }] : [];
  });
}

export interface MetaPathAccountInput {
  account: Dict;
  characters: readonly unknown[];
  failedSections: readonly string[];
}

/** The M2 account fields. `frontier` is not read here: the worker computes it (M2 TR-2). */
export function metaPathAccountFields({
  account,
  characters,
  failedSections,
}: MetaPathAccountInput): Pick<
  AccountSummary,
'buildings' | 'salts' | 'gateQuests' | 'worldCrystals'
> {
  // towers.data is an ARRAY of { name, level } (M2 TR-3, red-team F13); absent = level 0.
  let buildings: AccountSummary['buildings'] = null;
  if (!failed(failedSections, 'towers')) {
    const towers = isDict(account.towers) && Array.isArray(account.towers.data) ? account.towers.data : [];
    const level = (name: string) => {
      const t = towers.find((x) => isDict(x) && x.name === name) as Dict | undefined;
      return t ? (finite(t.level) ?? 0) : 0;
    };
    buildings = {
      deathNote: level('Death_Note'),
      printer3d: level('3D_Printer'),
      atomCollider: level('Atom_Collider'),
    };
  }

  let salts: AccountSummary['salts'] = null;
  if (!failed(failedSections, 'refinery')) {
    const list = isDict(account.refinery) ? account.refinery[SALT_ORDER_FIELD] : undefined;
    salts = Array.isArray(list)
      ? list.flatMap((s) =>
          isDict(s) && typeof s.rawName === 'string'
            ? [{ rawName: s.rawName, unlocked: s.unlocked === true }]
            : [],
        )
      : [];
  }

  // Quest completion is getQuests' completed[], never progress[] (M2 TR-3 correction to #26 §1.1).
  // inProgressBy: the characters whose marker stands on the quest with status 0 (accepted, unfinished).
  let gateQuests: AccountSummary['gateQuests'] = null;
  if (!failed(failedSections, 'quests')) {
    gateQuests = {};
    const worlds = isDict(account.quests) ? Object.values(account.quests) : [];
    for (const list of worlds) {
      if (!Array.isArray(list)) continue;
      for (const npc of list) {
        if (!isDict(npc) || !(GATE_QUEST_NPCS as readonly string[]).includes(String(npc.name))) continue;
        for (const q of Array.isArray(npc.npcQuests) ? npc.npcQuests : []) {
          if (!isDict(q) || typeof q.QuestName !== 'string') continue;
          const idx = (arr: unknown, keep: (x: Dict) => boolean) =>
            (Array.isArray(arr) ? arr : [])
              .filter((x): x is Dict => isDict(x) && keep(x))
              .map((x) => finite(x.charIndex))
              .filter((x): x is number => x !== null)
              .sort((a, b) => a - b);
          const entry: GateQuestProgress = {
            completedBy: idx(q.completed, () => true),
            inProgressBy: idx(q.progress, (x) => finite(x.status) === 0),
          };
          gateQuests[q.QuestName as GateQuestId] = entry;
        }
      }
    }
  }

  let worldCrystals: AccountSummary['worldCrystals'] = null;
  if (!failed(failedSections, 'storage')) {
    const totals = { desertTopaz: 0, glacierQuartz: 0, galaxialAmethyst: 0 };
    const storage = isDict(account.storage) ? account.storage.list : undefined;
    const all = [...itemsOf(storage), ...characters.flatMap((c) => (isDict(c) ? itemsOf(c.inventory) : []))];
    for (const { rawName, amount } of all) {
      const key = CRYSTALS[rawName as keyof typeof CRYSTALS];
      if (key) totals[key] += amount;
    }
    worldCrystals = totals;
  }

  return { buildings, salts, gateQuests, worldCrystals };
}
