// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 Walkthroughs & Parallel Slot Plans (TR-2): Toolbox output -> the walkthrough Account State
// fields. Called from adapter.ts after the characters are read; like it, the only place that knows
// these Toolbox paths. A field whose source is missing is null and, where its raw keys are missing,
// listed in diagnostics.unknownFields.
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import type { CharacterState } from './types';
import type {
  CardPresets,
  PrinterCharacter,
  PrinterSample,
  PrinterState,
  TalentPresets,
  WalkthroughAccountFields,
  WalkthroughCharacterFields,
} from './walkthrough-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const num = (v: unknown, fallback = 0): number => finite(v) ?? fallback;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** The skills whose level and efficiency a Walkthrough's skilling Supplies read (Toolbox `skillsInfo` keys). */
export const WALKTHROUGH_SKILLS = ['mining', 'chopping', 'fishing', 'catching'] as const;

/**
 * Game indices (N.js at game 2.3.540, read 2026-10-17; the wiki's 3D Printer page describes the same):
 * stored sample slots are 4 + gemShopPurchases[112] (`PrinterSampleSlots`), active slots 1 +
 * gemShopPurchases[111] (Crystal 3D Printer), and a new sample zeroes the day counters
 * accountOptions[125] (Gold Relic), [323] (winter event) and [479] (legend talent), which Toolbox's
 * getPrinterMulti reads.
 */
export const PRINTER = {
  baseStored: 4,
  gemStored: 112,
  baseActive: 1,
  gemActive: 111,
  resetCounters: [125, 323, 479],
} as const;
/** M8 FR-17: 2 base card presets plus Gem Shop Card Presets (gemShopPurchases[66]). */
const CARD_PRESETS = { base: 2, gem: 66 } as const;

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

export interface WalkthroughInputs {
  account: Dict;
  characters: unknown[];
  data: Dict;
  states: CharacterState[];
  withData: number[];
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

function readQuests(raw: Dict): Record<string, Record<string, number>> | null {
  if (!isDict(raw.quests)) return null;
  const out: Record<string, Record<string, number>> = {};
  for (const [npc, q] of Object.entries(raw.quests)) {
    if (!isDict(q)) continue;
    const row: Record<string, number> = {};
    for (const [k, v] of Object.entries(q)) {
      const n = finite(v);
      if (n !== null) row[k] = n;
    }
    out[npc] = row;
  }
  return out;
}

/** Base levels by talent name, levels > 0, over Toolbox's `{ "<tab>": { orderedTalents[] } }`. */
function levelsOf(talents: unknown): Record<string, number> | null {
  if (!isDict(talents)) return null;
  const out: Record<string, number> = {};
  for (const tab of Object.values(talents)) {
    if (!isDict(tab) || !Array.isArray(tab.orderedTalents)) continue;
    for (const t of tab.orderedTalents) {
      if (!isDict(t) || typeof t.name !== 'string') continue;
      const lv = num(t.baseLevel ?? t.level);
      if (lv > 0) out[t.name] = Math.max(out[t.name] ?? 0, lv);
    }
  }
  return out;
}

function readTalentPresets(raw: Dict, data: Dict, index: number): TalentPresets | null {
  const sel = finite(raw.selectedTalentPreset);
  if (sel !== 0 && sel !== 1) return null;
  const active = levelsOf(raw.talents);
  if (!active) return null;
  const presets = [{ index: sel, levels: active }];
  const other =
    isDict(raw.talentPreset) && data[`SLpre_${index}`] !== undefined
      ? levelsOf(raw.talentPreset.talents)
      : null;
  presets.push({ index: 1 - sel, levels: other ?? {} });
  return { selected: sel, presets: presets.sort((a, b) => a.index - b.index) };
}

function readCardPresets(raw: Dict, gems: unknown[]): CardPresets | null {
  const sel = finite(raw.selectedCardPreset);
  if (sel === null || !Array.isArray(raw.cardPresets)) return null;
  const presets = raw.cardPresets.map((p) =>
    (Array.isArray(p) ? p : isDict(p) ? Object.values(p) : [])
      .filter((c): c is Dict => isDict(c) && typeof c.cardName === 'string' && c.cardName !== '')
      .map((c) => (typeof c.effect === 'string' ? c.effect : '')),
  );
  return { selected: sel, unlocked: CARD_PRESETS.base + num(gems[CARD_PRESETS.gem]), presets };
}

function sampleOf(s: unknown, calls: ToolboxCalls): PrinterSample | null {
  if (!isDict(s) || typeof s.item !== 'string' || s.item === 'Blank') return null;
  const name = calls.itemDisplayName(s.item) ?? s.item;
  return { rawName: s.item, name, value: num(s.value), perHour: num(s.boostedValue) };
}

function readPrinter(
  account: Dict,
  characters: unknown[],
  states: CharacterState[],
  calls: ToolboxCalls,
): PrinterState | null {
  const towers = isDict(account.towers) ? list(account.towers.data) : [];
  const tower = towers.find((t) => isDict(t) && t.name === '3D_Printer');
  if (!isDict(tower)) return null;
  const level = num(tower.level);
  if (!Array.isArray(account.printer)) return null;
  const gems = list(account.gemShopPurchases);
  const multi = (acc: Dict) => finite((calls.getPrinterMulti(acc, characters) as Dict | undefined)?.value);
  const multiNow = multi(account);
  const opts = [...list(account.accountOptions)];
  for (const i of PRINTER.resetCounters) if (i < opts.length) opts[i] = 0;
  const multiAfterSample = multi({ ...account, accountOptions: opts });
  if (multiNow === null || multiAfterSample === null) return null;
  const out: PrinterCharacter[] = [];
  for (const st of states) {
    const rows = list((account.printer as unknown[])[st.index]);
    const c = characters[st.index];
    if (!isDict(c)) continue;
    const talent = list(c.flatStarTalents).find((t) => isDict(t) && t.name === 'PRINTER_SAMPLING');
    out.push({
      characterIndex: st.index,
      samplingLevel: isDict(talent) ? num(talent.level) : 0,
      samplePct: num(c.printerSample),
      stored: rows.filter((r) => isDict(r) && r.active !== true).flatMap((r) => sampleOf(r, calls) ?? []),
      active: rows.filter((r) => isDict(r) && r.active === true).flatMap((r) => sampleOf(r, calls) ?? []),
    });
  }
  return {
    level,
    storedSlots: PRINTER.baseStored + num(gems[PRINTER.gemStored]),
    activeSlots: PRINTER.baseActive + num(gems[PRINTER.gemActive]),
    multiNow,
    multiAfterSample,
    characters: out,
  };
}

function readForgeOutput(account: Dict): WalkthroughAccountFields['forgeOutput'] {
  if (!isDict(account.forge) || !Array.isArray(account.forge.list)) return null;
  const sums = new Map<string, number>();
  for (const slot of account.forge.list) {
    const bar = isDict(slot) ? slot.bar : null;
    if (!isDict(bar) || typeof bar.rawName !== 'string' || bar.rawName === 'Blank') continue;
    const n = num(bar.amount ?? bar.quantity);
    if (n > 0) sums.set(bar.rawName, (sums.get(bar.rawName) ?? 0) + n);
  }
  return [...sums].sort(([a], [b]) => (a < b ? -1 : 1)).map(([rawName, amount]) => ({ rawName, amount }));
}

function field<T>(c: Collector, path: string, slots: number[], read: () => T | null): T | null {
  if (!c.checkRaw(path, path, null, slots)) return null;
  const v = attempt(read);
  if (v === null) c.unknown(path);
  return v;
}

/** The M14 fields, account and per character, written onto the states in place. */
export function readWalkthrough(input: WalkthroughInputs, c: Collector): WalkthroughAccountFields {
  const { account, characters, data, states, withData, calls, withFrozenClock, asOf } = input;
  const s = withData;
  const frozen = <T>(f: () => T): T => (withFrozenClock ? withFrozenClock(asOf, f) : f());
  const gems = list(account.gemShopPurchases);

  for (const st of states) {
    const raw = characters[st.index];
    if (!isDict(raw)) continue;
    const at = `characters[${st.index}]`;
    const read = <T>(name: string, f: () => T | null): T | null => {
      if (!c.checkRaw(`characters[].${name}`, `${at}.${name}`, st.index)) return null;
      const v = attempt(f);
      if (v === null) c.unknown(`${at}.${name}`);
      return v;
    };
    const skills = isDict(raw.skillsInfo) ? raw.skillsInfo : null;
    const fields: WalkthroughCharacterFields = {
      quests: read('quests', () => readQuests(raw)),
      inventoryItems: read('inventoryItems', () => counts(list(raw.inventory))),
      smithingLevel: read('smithingLevel', () =>
        skills && isDict(skills.smithing) ? finite(skills.smithing.level) : null,
      ),
      targetMonster: read('targetMonster', () =>
        typeof raw.targetMonster === 'string' && raw.targetMonster !== '' ? raw.targetMonster : null,
      ),
      mapIndex: read('mapIndex', () => finite(raw.mapIndex)),
      skillLevels: read('skillLevels', () => {
        if (!skills) return null;
        const out: Record<string, number> = {};
        for (const k of WALKTHROUGH_SKILLS) {
          const v = isDict(skills[k]) ? finite((skills[k] as Dict).level) : null;
          if (v !== null) out[k] = v;
        }
        return out;
      }),
      skillEfficiency: calls
        ? read('skillEfficiency', () =>
            frozen(() => {
              const info = calls.getMaxDamage(raw, characters, account);
              const out: Record<string, number> = {};
              for (const k of WALKTHROUGH_SKILLS) {
                const v = attempt(() =>
                  finite(
                    (calls.getSkillEfficiency(k, raw, characters, account, info) as Dict | undefined)?.value,
                  ),
                );
                if (v !== null) out[k] = v;
              }
              return out;
            }),
          )
        : null,
      anvilSpeed: calls
        ? read('anvilSpeed', () =>
            frozen(() => {
              const a = calls.getPlayerAnvil(raw, characters, account) as Dict;
              const v = finite(isDict(a?.stats) ? a.stats.anvilSpeed : null);
              return v !== null && v > 0 ? v : null;
            }),
          )
        : null,
      talentPresets: read('talentPresets', () => readTalentPresets(raw, data, st.index)),
      cardPresets: read('cardPresets', () => readCardPresets(raw, gems)),
    };
    Object.assign(st, fields);
  }

  const storage = isDict(account.storage) ? list(account.storage.list) : null;
  const refinery = isDict(account.refinery) ? account.refinery.refineryStorage : null;
  return {
    anvilTabsOwned: field(c, 'account.anvilTabsOwned', s, () => finite(data.CYAnvilTabsOwned)),
    forgeOutput: field(c, 'account.forgeOutput', s, () => readForgeOutput(account)),
    storageItems: field(c, 'account.storageItems', s, () => (storage ? counts(storage) : null)),
    refineryStorage: field(c, 'account.refineryStorage', s, () =>
      Array.isArray(refinery) ? counts(refinery) : null,
    ),
    printer: calls
      ? field(c, 'account.printer', s, () => frozen(() => readPrinter(account, characters, states, calls)))
      : null,
    supplyRates: null,
  };
}
