// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the World 2 and 3 System pages (w23-types.ts): the Refinery, the Construction build slots, the
// 3D Printer's samples, the prayers and the shrines, laid out from Account State facts. Read-only and
// advice-free: no Check, no Verdict. Names are made human here ("Redox_Salts" -> "Redox Salts").
import type { AccountState } from '@idleon-forge/account-state';
import type {
  BuildingView,
  BuildSlotsPicture,
  PrayersPicture,
  PrinterSamplesPicture,
  RefineryPicture,
  ShrinesPicture,
} from './w23-types';

const human = (s: string) => s.replace(/_/g, ' ').trim();

/** A game number as the game writes it in a bonus: up to two decimals, no trailing zeros. */
const num = (n: number) => String(Math.round(n * 100) / 100);

/** "+{%_Class_EXP" at 30 -> "+30% Class EXP"; a text without `{` stays as is (made human). */
export const fill = (template: string, n: number): string =>
  human(template.replace(/\{/g, num(n)))
    .replace(/\s*\.+\s*$/, '')
    .replace(/\s+/g, ' ');

const salts = (state: AccountState) => {
  const out = new Map<string, string>();
  for (const s of state.account.refinery?.salts ?? []) if (s.name) out.set(s.rawName, human(s.name));
  return out;
};

function buildingsOf(state: AccountState): BuildingView[] {
  const saltName = salts(state);
  return (state.account.construction?.buildings ?? []).map((b) => ({
    index: b.index,
    name: human(b.rawName),
    level: b.level,
    maxLevel: b.maxLevel,
    progress: b.progress,
    buildCost: b.buildCost,
    bodyFull: b.bodyFull,
    salt: saltName.get(b.saltRawName) ?? (b.saltRawName ? human(b.saltRawName) : null),
  }));
}

// ---- Refinery ----

export function refineryPicture(state: AccountState): RefineryPicture | null {
  const ref = state.account.refinery;
  if (!ref || ref.salts.length === 0) return null;
  const asOf = state.asOf;
  const storage = state.account.refineryStorage ?? {};
  const chest = state.account.storageItems ?? {};
  const dry = new Map((state.account.afk?.salts ?? []).map((s) => [s.salt, s.dryAt]));
  const construction = state.account.construction;
  const slotted = new Set((construction?.buildSlots ?? []).filter((x): x is number => x !== null));
  const buildings = buildingsOf(state);
  const views = ref.salts.map((s) => {
    const name = human(s.name || s.rawName);
    const paysFor = (construction?.buildings ?? [])
      .filter((b) => slotted.has(b.index) && b.saltRawName === s.rawName)
      .map((b) => {
        const v = buildings.find((x) => x.index === b.index);
        return { name: v?.name ?? human(b.rawName), from: b.level, to: b.level + 1 };
      });
    return {
      id: `salt-${s.rawName}`,
      actionKey: null,
      rawName: s.rawName,
      name,
      unlocked: s.unlocked,
      active: s.active,
      rank: s.rank,
      power: s.power,
      powerCap: s.powerCap,
      autoRefine: s.autoRefine,
      fullAt: s.fullInSeconds === null ? null : asOf + s.fullInSeconds * 1000,
      dryAt: s.active ? (dry.get(s.rawName) ?? dry.get(s.name) ?? null) : null,
      fuel: (s.fuel ?? []).map((f) => ({ name: human(f.name), held: f.held })),
      inRefinery: storage[s.rawName] ?? 0,
      inChest: chest[s.rawName] ?? 0,
      paysFor,
    };
  });
  return {
    systemId: 'refinery',
    kind: 'refinery',
    salts: views,
    waiting: views.reduce((t, s) => t + s.inRefinery, 0),
  };
}

// ---- Construction: the build slots ----

export function buildSlotsPicture(state: AccountState): BuildSlotsPicture | null {
  const c = state.account.construction;
  if (!c) return null;
  const buildings = buildingsOf(state);
  return {
    systemId: 'construction',
    kind: 'build-slots',
    slots: c.buildSlots.map((i) => (i === null ? null : (buildings.find((b) => b.index === i) ?? null))),
    buildings,
    buildRate: c.totalBuildRate,
  };
}

// ---- 3D Printer: samples ----

const PRINTER_BUILDING = 0;

export function printerSamplesPicture(state: AccountState): PrinterSamplesPicture | null {
  const p = state.account.printer;
  if (!p || p.level <= 0) return null;
  const building = state.account.construction?.buildings.find((b) => b.index === PRINTER_BUILDING);
  return {
    systemId: 'printer',
    kind: 'printer-samples',
    level: p.level,
    maxLevel: building?.maxLevel ?? null,
    storedSlots: p.storedSlots,
    characters: [...p.characters]
      .sort((a, b) => a.characterIndex - b.characterIndex)
      .map((c) => ({
        index: c.characterIndex,
        samplePct: c.samplePct,
        active: c.active.map((s) => ({ name: human(s.name), perHour: s.perHour })),
        stored: c.stored.map((s) => ({ name: human(s.name), perHour: s.perHour })),
      })),
  };
}

// ---- Prayers ----

/** Toolbox `getPrayerBonusAndCurse`: x + x * (level - 1) / 10, rounded. */
const atLevel = (x: number, level: number) => Math.round(x + (x * (Math.max(1, level) - 1)) / 10);

export function prayersPicture(state: AccountState): PrayersPicture | null {
  const list = state.account.prayers;
  if (!list) return null;
  const levels = state.characters.map((c) => c.skills?.worship?.level).filter((x): x is number => x != null);
  return {
    systemId: 'prayers',
    kind: 'prayers',
    prayers: list.map((p) => ({
      index: p.index,
      name: human(p.name),
      bonus: fill(p.effect, atLevel(p.x1, p.level)),
      curse: fill(p.curse, atLevel(p.x2, p.level)),
      level: p.level,
      unlocked: p.level > 0,
      zone: human(p.unlockZone),
      wave: p.unlockWave,
    })),
    equipped: state.characters
      .filter((c) => c.afk?.prayers != null)
      .map((c) => ({ index: c.index, prayers: (c.afk?.prayers ?? []).map((x) => human(x.name)) })),
    totems: (state.account.totems ?? []).map((t) => ({
      name: human(t.name),
      map: human(t.map),
      levelReq: t.levelReq,
      maxWave: t.maxWave,
    })),
    bestWorship: levels.length ? Math.max(...levels) : null,
  };
}

// ---- Shrines ----

/** "Boosts_Total_Damage_of_players_on_this_map_by_+{%." at 12 -> "+12% Total Damage on its map". */
export function shrineWhat(desc: string, n: number): string {
  const full = fill(desc, n);
  const m = /^Boosts (?:the )?(.+?)(?: of players)? on this map by \+?(\S+?)$/.exec(full);
  return m ? `+${m[2]} ${m[1]}` : full;
}

/** The shrine's Construction building: 18 + its place in the list (Toolbox `ConTowerB18`). */
const SHRINE_BUILDING = 18;

export function shrinesPicture(
  state: AccountState,
  mapName: (index: number) => string | null,
): ShrinesPicture | null {
  const list = state.account.shrines;
  if (!list) return null;
  const buildings = buildingsOf(state);
  const shrines = list.map((s) => {
    const b = buildings.find((x) => x.index === SHRINE_BUILDING + s.index);
    const built = b?.level ?? 0;
    const lv = Math.max(1, s.level);
    const map = built > 0 && s.level > 0 ? mapName(s.mapId) : null;
    return {
      index: s.index,
      name: human(s.name),
      what: shrineWhat(s.desc, s.baseBonus + (lv - 1) * s.bonusPerLevel),
      built,
      level: s.level,
      map: map ? human(map) : null,
      salt: b?.salt ?? null,
    };
  });
  const byMap = new Map<string, number[]>();
  for (const c of state.characters) {
    if (!c.currentMap) continue;
    const m = human(c.currentMap);
    byMap.set(m, [...(byMap.get(m) ?? []), c.index]);
  }
  const maps = [...byMap.entries()]
    .map(([map, characters]) => ({ map, characters }))
    .sort((a, b) => b.characters.length - a.characters.length || a.map.localeCompare(b.map));
  return { systemId: 'shrines', kind: 'shrines', shrines, maps };
}
