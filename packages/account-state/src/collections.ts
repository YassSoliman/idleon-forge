// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 Collections (M8 TR-15): Toolbox output -> the collections Account State fields. Called from
// adapter.ts after the characters are read; like it, the only place that knows these Toolbox paths.
// A field whose source is missing is null and, where its raw keys are missing, listed in
// diagnostics.unknownFields. Traps from TR-15 are handled here: equippedCards is padded to 8,
// `cardSet.stars` is tier − 1, `selectedCardPreset` is 0-based, the parsed shop stock drops stamps
// (raw `ShopStock` is read instead), and there is no free-inventory field (it is derived).
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import type {
  CardLoadout,
  CardSetState,
  CardState,
  CollectionsAccountFields,
  CollectionsCharacterFields,
  ObolSlot,
} from './collections-types';
import type { CharacterState } from './types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const num = (v: unknown, fallback = 0): number => finite(v) ?? fallback;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Storage rows of `account.obols.inventory`, in the save's order (M8 dossier, raw `ObolInvOr`). */
const OBOL_ROW_SHAPES = ['Circle', 'Square', 'Hexagon', 'Sparkle'] as const;

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

export interface CollectionsInputs {
  account: Dict;
  characters: unknown[];
  data: Dict;
  states: CharacterState[];
  withData: number[];
  failedSections: string[];
  calls: ToolboxCalls | null;
  withFrozenClock: (<T>(now: number, f: () => T) => T) | null;
  asOf: number;
}

const attempt = <T>(f: () => T | null): T | null => {
  try {
    return f();
  } catch {
    return null;
  }
};

function field<T>(c: Collector, path: string, slots: number[], read: () => T | null): T | null {
  if (!c.checkRaw(path, path, null, slots)) return null;
  const v = attempt(read);
  if (v === null) c.unknown(path);
  return v;
}

function counts(items: unknown[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of items) {
    if (
      !isDict(x) ||
      typeof x.rawName !== 'string' ||
      x.rawName === 'Blank' ||
      x.rawName === 'LockedInvSpace'
    )
      continue;
    out[x.rawName] = (out[x.rawName] ?? 0) + num(x.amount);
  }
  return out;
}

function readStampLevels(account: Dict): CollectionsAccountFields['stampLevels'] {
  if (!isDict(account.stamps)) return null;
  const out: Record<string, { name: string; level: number; maxLevel: number }> = {};
  for (const tab of Object.values(account.stamps))
    for (const s of list(tab))
      if (isDict(s) && typeof s.rawName === 'string')
        out[s.rawName] = {
          name: typeof s.displayName === 'string' ? s.displayName : s.rawName,
          level: num(s.level),
          maxLevel: num(s.maxLevel),
        };
  return Object.keys(out).length ? out : null;
}

function readCards(account: Dict): Record<string, CardState> | null {
  if (!isDict(account.cards)) return null;
  const out: Record<string, CardState> = {};
  for (const [name, c] of Object.entries(account.cards)) {
    // Owned cards only: an unowned card carries nothing M8 reads, and the Account State stays small (M1 TR-16).
    if (!isDict(c) || typeof c.rawName !== 'string' || num(c.amount) <= 0) continue;
    out[c.rawName] = {
      name,
      amount: num(c.amount),
      stars: num(c.stars),
      nextLevelReq: num(c.nextLevelReq),
      perTier: num(c.perTier),
      effect: typeof c.effect === 'string' ? c.effect : '',
      set: typeof c.category === 'string' ? c.category : '',
    };
  }
  return out;
}

function readCardSets(account: Dict, calls: ToolboxCalls): CardSetState[] {
  const sets = calls.getCardSets(account);
  const sizes = new Map<string, number>();
  for (const c of Object.values(isDict(account.cards) ? account.cards : {}))
    if (isDict(c) && typeof c.category === 'string') sizes.set(c.category, (sizes.get(c.category) ?? 0) + 1);
  return Object.values(sets).flatMap((s) => {
    if (!isDict(s) || typeof s.rawName !== 'string' || typeof s.name !== 'string') return [];
    const size = sizes.get(s.name) ?? 0;
    const points = num(s.totalStars);
    return [
      {
        rawName: s.rawName,
        name: s.name,
        effect: typeof s.effect === 'string' ? s.effect : '',
        bonus: num(s.bonus),
        // Toolbox's `stars` is tier − 1 (TR-15); -1 means no tier yet.
        tier: Math.max(0, num(s.stars, -1) + 1),
        points,
        size,
      },
    ];
  });
}

function obolSlots(raw: unknown): ObolSlot[] {
  return list(raw).flatMap((o, index) => {
    if (!isDict(o) || typeof o.rawName !== 'string') return [];
    const locked = o.rawName.startsWith('ObolLocked');
    const empty = o.rawName === 'Blank';
    return [
      {
        index,
        shape: typeof o.shape === 'string' ? o.shape : '',
        levelReq: num(o.levelReq),
        state: locked ? 'locked' : empty ? 'empty' : 'filled',
        obol: locked || empty ? null : o.rawName,
      },
    ];
  });
}

function readStoredObols(account: Dict): CollectionsAccountFields['storedObols'] {
  const o = account.obols;
  if (!isDict(o) || !Array.isArray(o.inventory)) return null;
  const out: Array<{ rawName: string; shape: string }> = [];
  o.inventory.forEach((row, r) => {
    const shape = OBOL_ROW_SHAPES[r];
    if (!shape) return;
    for (const x of list(row))
      if (typeof x === 'string' && x !== 'Blank' && x !== 'LockedInvSpace') out.push({ rawName: x, shape });
  });
  return out;
}

const cardIds = (cards: unknown): string[] =>
  list(cards).flatMap((c) =>
    isDict(c) && typeof c.cardName === 'string' && typeof c.rawName === 'string' ? [c.rawName] : [],
  );

function readLoadout(raw: Dict): CardLoadout | null {
  const cards = raw.cards;
  if (!isDict(cards)) return null;
  const set =
    isDict(cards.cardSet) && typeof cards.cardSet.rawName === 'string' ? cards.cardSet.rawName : null;
  const selected = finite(raw.selectedCardPreset);
  return {
    equipped: cardIds(cards.equippedCards),
    set,
    presets: list(raw.cardPresets).map(cardIds),
    selectedPreset: selected === null ? null : Math.trunc(selected),
  };
}

function readQuests(raw: Dict): Record<string, Record<string, number>> | null {
  if (!isDict(raw.quests)) return null;
  const out: Record<string, Record<string, number>> = {};
  for (const [npc, q] of Object.entries(raw.quests)) {
    if (!isDict(q)) continue;
    const row: Record<string, number> = {};
    for (const [key, v] of Object.entries(q)) {
      const n = finite(v);
      if (n !== null) row[key] = n;
    }
    out[npc] = row;
  }
  return out;
}

/** Stackable items only: equipment (`typeGen` "a…": tools, gear, stamps, obols) takes one slot each. */
function typesOf(items: unknown[], into: Record<string, string>) {
  for (const x of items)
    if (
      isDict(x) &&
      typeof x.rawName === 'string' &&
      typeof x.typeGen === 'string' &&
      !x.typeGen.startsWith('a')
    )
      into[x.rawName] ??= x.typeGen;
}

/** The M8 account fields; also sets each character's M8 fields on `states`. */
export function readCollections(i: CollectionsInputs, c: Collector): CollectionsAccountFields {
  const { account, characters, data, states, withData, calls } = i;
  const s = withData;
  const storage = isDict(account.storage) ? list(account.storage.list) : null;
  const refinery = isDict(account.refinery) ? list(account.refinery.refineryStorage) : null;
  const cards = field(c, 'account.cards', s, () => readCards(account));

  const heldItemTypes: Record<string, string> = {};
  typesOf(storage ?? [], heldItemTypes);
  typesOf(refinery ?? [], heldItemTypes);
  for (const ch of characters) if (isDict(ch)) typesOf(list(ch.inventory), heldItemTypes);

  for (const st of states) {
    const raw = characters[st.index];
    if (!isDict(raw)) continue;
    const at = `characters[${st.index}]`;
    const read = <T>(name: keyof CollectionsCharacterFields, f: () => T | null): T | null => {
      const path = `${at}.${name}`;
      if (!c.checkRaw(`characters[].${name}`, path, st.index)) return null;
      const v = attempt(f);
      if (v === null) c.unknown(path);
      return v;
    };
    const fields: CollectionsCharacterFields = {
      quests: read('quests', () => readQuests(raw)),
      inventoryItems: read('inventoryItems', () => counts(list(raw.inventory))),
      freeInventorySlots: read('freeInventorySlots', () => {
        const slots = finite(raw.inventorySlots);
        if (slots === null) return null;
        const used = list(raw.inventory).filter(
          (x) => isDict(x) && typeof x.rawName === 'string' && x.rawName !== 'Blank',
        ).length;
        return Math.max(0, slots - used);
      }),
      // Toolbox's functions arrive only in the parse worker; without them the field is null, not unknown (as M3's afk).
      carryPerSlot:
        !calls || !i.withFrozenClock
          ? null
          : read('carryPerSlot', () => {
              if (!calls || !i.withFrozenClock) return null;
              const out: Record<string, number> = {};
              const types = [...new Set(Object.values(heldItemTypes))].sort();
              i.withFrozenClock(i.asOf, () => {
                for (const t of types) {
                  const v = attempt(() =>
                    finite((calls.getItemCapacity(t, raw, account) as Dict | undefined)?.value),
                  );
                  if (v !== null && v > 0) out[t] = v;
                }
                return null;
              });
              return out;
            }),
      money: read('money', () => finite(raw.money)),
      smithingLevel: read('smithingLevel', () =>
        isDict(raw.skillsInfo) && isDict(raw.skillsInfo.smithing)
          ? finite(raw.skillsInfo.smithing.level)
          : null,
      ),
      // No AFK Target is a real null, not an unknown: only the raw key decides.
      targetMonster: c.checkRaw('characters[].targetMonster', `${at}.targetMonster`, st.index)
        ? typeof raw.targetMonster === 'string' && raw.targetMonster !== '' && raw.targetMonster !== '_'
          ? raw.targetMonster
          : null
        : null,
      cardLoadout: read('cardLoadout', () => readLoadout(raw)),
      personalObols: read('personalObols', () => (isDict(raw.obols) ? obolSlots(raw.obols.list) : null)),
    };
    Object.assign(st, fields);
  }

  return {
    stampLevels: field(c, 'account.stampLevels', s, () => readStampLevels(account)),
    storageItems: field(c, 'account.storageItems', s, () => (storage ? counts(storage) : null)),
    refineryStorage: field(c, 'account.refineryStorage', s, () => (refinery ? counts(refinery) : null)),
    bankCoins: field(c, 'account.bankCoins', s, () =>
      isDict(account.currencies) ? finite(account.currencies.bankMoney) : null,
    ),
    shopStock: !calls
      ? null
      : field(c, 'account.shopStock', s, () => {
          const stock = calls.shopStockAll(data.ShopStock);
          if (!stock) return null;
          return Array.from(stock, (shop) => {
            const out: Record<string, number> = {};
            for (const x of shop ?? []) out[x.rawName] = (out[x.rawName] ?? 0) + x.amount;
            return out;
          });
        }),
    heldItemTypes: storage === null ? null : heldItemTypes,
    cards,
    cardSets: !calls || !cards ? null : field(c, 'account.cardSets', s, () => readCardSets(account, calls)),
    familyObols: field(c, 'account.familyObols', s, () =>
      isDict(account.obols) ? obolSlots(account.obols.list) : null,
    ),
    storedObols: field(c, 'account.storedObols', s, () => readStoredObols(account)),
    obolDropMerit: field(c, 'account.obolDropMerit', s, () => {
      const tasks = list(account.tasks);
      const row = list(list(tasks[2])[1]);
      return row.length ? num(row[0]) : null;
    }),
  };
}
