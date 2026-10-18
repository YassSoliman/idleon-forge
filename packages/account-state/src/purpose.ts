// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 Purpose & Milestones (TR-2): Toolbox output -> class and skill EXP, the current-map fighting rate,
// tools, the Death Note and the Upgrade Vault kill totals. Called from adapter.ts; like it, the only
// place that knows these Toolbox paths. `getMaxDamage` and the class EXP multi arrive injected from the
// parse worker (ADR 0006); without them `fighting` is null.
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import { killsLeftTable } from './frontier';
import type {
  DeathNotePage,
  FightingRate,
  LevelExp,
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

function levelExp(v: unknown): LevelExp | null {
  if (!isDict(v)) return null;
  const level = finite(v.level);
  const exp = finite(v.exp);
  const expReq = finite(v.expReq);
  if (level === null || exp === null || expReq === null || level < 0 || exp < 0 || expReq < 0) return null;
  return { level, exp, expReq };
}

function fightingOf(raw: Dict, characters: unknown[], account: Dict, calls: ToolboxCalls): FightingRate | null {
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

function readDeathNote(account: Dict): Record<string, DeathNotePage> | null {
  const dn = account.deathNote;
  if (!isDict(dn)) return null;
  const out: Record<string, DeathNotePage> = {};
  for (const [world, page] of Object.entries(dn)) {
    if (world === 'miniBosses' || !/^\d+$/.test(world) || !isDict(page)) continue;
    const mobs: DeathNotePage['mobs'] = [];
    for (const m of list(page.mobs)) {
      if (!isDict(m) || typeof m.rawName !== 'string') continue;
      const kills = finite(m.kills);
      if (kills === null || kills < 0) return null;
      mobs.push({ rawName: m.rawName, kills });
    }
    out[world] = { mobs };
  }
  return Object.keys(out).length > 0 ? out : null;
}

function readVault(account: Dict): VaultKills | null {
  const uv = account.upgradeVault;
  if (!isDict(uv) || !Array.isArray(uv.vaultTotalKills) || !Array.isArray(uv.upgrades)) return null;
  const killTotals: number[] = [];
  for (const v of uv.vaultTotalKills) {
    const n = finite(v);
    if (n === null || n < 0) return null;
    killTotals.push(n);
  }
  const rows: VaultKills['rows'] = [];
  for (const u of uv.upgrades) {
    if (!isDict(u) || typeof u.name !== 'string') return null;
    const level = finite(u.level);
    const maxLevel = finite(u.maxLevel);
    if (level === null || maxLevel === null) return null;
    rows.push({ name: u.name, level, maxLevel });
  }
  return { killTotals, rows };
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
    const fields: PurposeCharacterFields = {
      classExp: read('classExp', () => (info ? levelExp(info.character) : null)),
      skills: read('skills', () => {
        if (!info) return null;
        const out: Record<string, LevelExp> = {};
        for (const k of PURPOSE_SKILLS) {
          const v = levelExp(info[k]);
          if (v) out[k] = v;
        }
        return out;
      }),
      // Only a fighter has a current-map rate; any other AFK type is null by definition, not unknown.
      fighting:
        raw.afkType !== 'FIGHTING'
          ? null
          : calls
            ? read('fighting', () => frozen(() => fightingOf(raw, characters, account, calls)))
            : null,
      tools: read('tools', () => {
        if (!Array.isArray(raw.tools)) return null;
        return raw.tools
          .map((t) => (isDict(t) && typeof t.rawName === 'string' ? t.rawName : null))
          .filter((t): t is string => t !== null && t !== 'Blank');
      }),
      portalKillsLeft: read('portalKillsLeft', () => {
        const map = finite(raw.mapIndex);
        if (map === null) return null;
        const row = killsLeftTable(data, st.index)?.[map];
        if (!Array.isArray(row)) return [];
        const out: number[] = [];
        for (const v of row) {
          const n = finite(v);
          if (n === null) return null;
          out.push(n);
        }
        return out;
      }),
    };
    if (raw.afkType === 'FIGHTING' && !calls) c.unknown(`${at}.fighting`);
    Object.assign(st, fields);
  }
  const field = <T>(path: string, read: () => T | null): T | null => {
    if (!c.checkRaw(path, path, null, withData)) return null;
    const v = attempt(read);
    if (v === null) c.unknown(path);
    return v;
  };
  return {
    deathNote: field('account.deathNote', () => readDeathNote(account)),
    vault: field('account.vault', () => readVault(account)),
  };
}
