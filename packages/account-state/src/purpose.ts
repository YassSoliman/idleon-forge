// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 Purpose & Milestones (TR-2): Toolbox output -> class and skill EXP, the current-map fighting rate,
// tools, the Death Note and the Upgrade Vault kill totals. Called from adapter.ts; like it, the only
// place that knows these Toolbox paths. `getMaxDamage` and the class EXP multi arrive injected from the
// parse worker (ADR 0006); without them `fighting` is null.
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import { killsLeftTable } from './frontier';
import type {
  ClassExp,
  FightingRate,
  PurposeAccountFields,
  PurposeCharacterFields,
  VaultKills,
} from './purpose-types';
import type { CharacterState } from './types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const attempt = <T>(f: () => T | null): T | null => {
  try {
    return f();
  } catch {
    return null;
  }
};
/** Survivability and hit chance in Toolbox's unit, % 0..100; anything else is unknown. */
const pct = (v: unknown): number | null => {
  const n = finite(v);
  return n !== null && n >= 0 && n <= 100 ? n : null;
};

const GATHERING_AFK: ReadonlySet<string> = new Set(['MINING', 'CHOPPIN', 'FISHING', 'CATCHING']);

/** The gathering skills M4's doors, tools and Role Contributions read (Toolbox `skillsInfo` keys). */
export const PURPOSE_SKILLS = ['mining', 'chopping', 'fishing', 'catching'] as const;

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

export interface PurposeInputs {
  account: Dict;
  characters: unknown[];
  /** The raw save (`envelope.data`), for `KLA_<i>`. */
  data: Dict;
  states: CharacterState[];
  withData: number[];
  calls: ToolboxCalls | null;
  withFrozenClock: (<T>(now: number, f: () => T) => T) | null;
  asOf: number;
}

function classExpOf(v: unknown): ClassExp | null {
  if (!isDict(v)) return null;
  const exp = finite(v.exp);
  const expReq = finite(v.expReq);
  if (exp === null || expReq === null || exp < 0 || expReq < 0) return null;
  return { exp: Math.floor(exp), expReq: Math.ceil(expReq) };
}

function fightingOf(
  raw: Dict,
  characters: unknown[],
  account: Dict,
  calls: ToolboxCalls,
): FightingRate | null {
  if (raw.afkType !== 'FIGHTING') return null;
  const r = attempt(() => calls.getMaxDamage(raw, characters, account) as Dict);
  if (!r) return null;
  const finalKillsPerHour = finite(r.finalKillsPerHour);
  const killsPerHour = finite(r.killsPerHour);
  const survivability = pct(r.survivability);
  const hitChance = pct(r.hitChance);
  if (finalKillsPerHour === null || killsPerHour === null || survivability === null || hitChance === null)
    return null;
  if (finalKillsPerHour < 0 || killsPerHour < 0) return null;
  const multi = attempt(() => calls.classExpMulti(raw, account, characters));
  const target = typeof raw.targetMonster === 'string' ? raw.targetMonster : null;
  const given = target ? attempt(() => calls.monsterExpGiven(target)) : null;
  const classExpMulti = multi !== null && multi > 0 ? multi : null;
  return {
    finalKillsPerHour,
    killsPerHour,
    expPerKill: classExpMulti !== null && given !== null && given >= 0 ? given * classExpMulti : null,
    classExpMulti,
    survivability,
    hitChance,
  };
}

/**
 * Only the monsters some character is AFK fighting: a Death Note Goal is a Purpose of its feeders
 * (M4 TR-4), and the whole page would push a big account past the history cap (M1 TR-16).
 */
function readDeathNote(account: Dict, targets: ReadonlySet<string>): Record<string, number> | null {
  const dn = account.deathNote;
  // A save from before World 3 may have no Death Note: no kills recorded, which is not unknown.
  if (dn === undefined) return {};
  if (!isDict(dn)) return null;
  const out: Record<string, number> = {};
  for (const [world, page] of Object.entries(dn)) {
    // W1–W4 pages only ('0'..'3'): M4's Death Note Goals stop at W4-entry (TR-4).
    if (!/^[0-3]$/.test(world) || !isDict(page)) continue;
    for (const m of list(page.mobs)) {
      if (!isDict(m) || typeof m.rawName !== 'string' || !targets.has(m.rawName)) continue;
      // A monster no character has met reads NaN in Toolbox: no kills, not an unknown page.
      const kills = finite(m.kills);
      if (kills !== null && kills > 0) out[m.rawName] = Math.floor(kills);
    }
  }
  return out;
}

function readVault(account: Dict): VaultKills | null {
  const uv = account.upgradeVault;
  // A save from before the Vault: nothing to count, which is not unknown.
  if (uv === undefined || (isDict(uv) && !Array.isArray(uv.upgrades)))
    return { killTotals: [], rowLevels: {} };
  if (!isDict(uv) || !Array.isArray(uv.vaultTotalKills) || !Array.isArray(uv.upgrades)) return null;
  const killTotals: number[] = [];
  for (const v of uv.vaultTotalKills) {
    const n = finite(v);
    if (n === null || n < 0) return null;
    killTotals.push(Math.floor(n));
  }
  // Only the rows that grow with kills ("+{% ... per POW 10 ... Kills", the generator's own test).
  const rowLevels: Record<string, number> = {};
  for (const u of uv.upgrades) {
    if (!isDict(u) || typeof u.name !== 'string') return null;
    if (!/per_POW_10_.+_Kills/.test(typeof u.description === 'string' ? u.description : '')) continue;
    const level = finite(u.level);
    if (level === null) return null;
    rowLevels[u.name] = level;
  }
  return { killTotals, rowLevels };
}

/** The M4 fields, account and per character, written onto the states in place. */
export function readPurpose(input: PurposeInputs, c: Collector): PurposeAccountFields {
  const { account, characters, data, states, withData, calls, withFrozenClock, asOf } = input;
  const frozen = <T>(f: () => T): T => (withFrozenClock ? withFrozenClock(asOf, f) : f());
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
    const info = isDict(raw.skillsInfo) ? raw.skillsInfo : null;
    const fighter = raw.afkType === 'FIGHTING';
    const skiller = GATHERING_AFK.has(String(raw.afkType));
    // Fields that can't apply to this activity are left out (absent, not null: null means unknown), so
    // the history stays under its cap (M1 TR-16).
    const fields: PurposeCharacterFields = {
      // Class EXP toward the next level: only a fighter earns it AFK (the Class EXP Goal, TR-4).
      ...(fighter ? { classExp: read('classExp', () => (info ? classExpOf(info.character) : null)) } : {}),
      ...(fighter && calls
        ? { fighting: read('fighting', () => frozen(() => fightingOf(raw, characters, account, calls))) }
        : {}),
      // Only a skiller's gathering tools matter (the tool Goal, TR-4).
      ...(skiller
        ? {
            tools: read('tools', () => {
              if (!Array.isArray(raw.tools)) return null;
              return raw.tools
                .map((t) => (isDict(t) && typeof t.rawName === 'string' ? t.rawName : null))
                .filter((t): t is string => t !== null && /^(EquipmentTools|FishingRod|CatchingNet)/.test(t));
            }),
          }
        : {}),
      // Only a fighter has a portal Goal (TR-4).
      ...(fighter
        ? {
            portalKillsLeft: read('portalKillsLeft', () => {
              const map = finite(raw.mapIndex);
              if (map === null) return null;
              const row = killsLeftTable(data, st.index)?.[map];
              if (!Array.isArray(row)) return [];
              const out: number[] = [];
              for (const v of row) {
                const n = finite(v);
                if (n === null) return null;
                out.push(Math.ceil(n));
              }
              return out;
            }),
          }
        : {}),
    };
    Object.assign(st, fields);
  }
  const field = <T>(path: string, read: () => T | null): T | null => {
    if (!c.checkRaw(path, path, null, withData)) return null;
    const v = attempt(read);
    if (v === null) c.unknown(path);
    return v;
  };
  return {
    deathNote: field('account.deathNote', () =>
      readDeathNote(
        account,
        new Set(
          states
            .filter((s) => s.afkType === 'FIGHTING')
            .flatMap((s) => (s.targetMonster ? [s.targetMonster] : [])),
        ),
      ),
    ),
    vault: field('account.vault', () => readVault(account)),
  };
}
