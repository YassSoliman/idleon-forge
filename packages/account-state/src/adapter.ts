// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Toolbox output (untyped) -> Account State (typed). This is the one place that knows Toolbox's
// field names, so a re-sync that renames a field fails here, loudly, in the contract tests.
//
// Toolbox tolerates a broken save quietly: a missing raw key parses to undefined, 0 or a fallback with
// no report, and an id it doesn't know resolves to undefined. So every field is checked against the
// raw save keys it comes from (fields.ts) and every id against what Toolbox resolved, and a field that
// fails is null (never a default) and listed in diagnostics.unknownFields (M1 FR-16, FR-19a, TR-11).
import type { ParsedSave, RawSaveEnvelope } from '@idleon-forge/toolbox-parsers';
import { FIELD_RAW_KEYS, type RawKind } from './fields';
import {
  type AccountState,
  type CharacterState,
  type FoodStack,
  type ParseDiagnostics,
  SCHEMA_VERSION,
} from './types';

/** The parse produced no account. Toolbox swallows its own errors, so this is the failure signal. */
export class EmptyAccountError extends Error {
  override name = 'EmptyAccountError';
}

/** Toolbox's output no longer has the shape this adapter expects (usually: upstream renamed a field). */
export class AccountShapeError extends Error {
  override name = 'AccountShapeError';
}

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const secondsBetween = (from: number | null, to: number): number | null =>
  from === null ? null : Math.max(0, Math.floor((to - from) / 1000));

const typeName = (v: unknown): string =>
  v === null ? 'null' : Array.isArray(v) ? 'an array' : v === undefined ? 'undefined' : `a ${typeof v}`;

/** Names the path and the type found, never the value: it could be a character name (TR-23). */
function fail(path: string, expected: string, got: unknown): never {
  throw new AccountShapeError(`${path}: expected ${expected}, got ${typeName(got)}`);
}

/** Whether a raw save value is present and parses as `kind`. */
export function rawPresent(value: unknown, kind: RawKind): boolean {
  if (value === undefined || value === null) return false;
  switch (kind) {
    case 'number':
      return finite(value) !== null;
    case 'string':
      return typeof value === 'string';
    case 'json': {
      if (typeof value === 'object') return true;
      if (typeof value !== 'string') return false;
      try {
        const parsed: unknown = JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null;
      } catch {
        return false;
      }
    }
  }
}

/** Warning added when names are missing, which happens for a bare save pasted without `charNames`. */
export const UNNAMED_WARNING = 'Character names are not in this save, so characters are numbered instead.';

/** The rule behind `lastPlayedCharacterIndex` (FR-19, TR-12). */
export const LAST_PLAYED_WITHIN_MS = 30_000;
export const LAST_PLAYED_TIE_MS = 1_000;

export interface ToAccountStateOptions {
  /** Where the save came from. Defaults to `'paste'`, the one that is never stored. */
  source?: 'live' | 'paste';
}

class Collector {
  readonly unknownFields = new Set<string>();
  readonly monsters = new Set<string>();
  readonly maps = new Set<string>();
  readonly items = new Set<string>();
  readonly classes = new Set<string>();

  constructor(readonly data: Dict) {}

  /** Checks the raw keys behind `template` (for slot `i`, or every slot in `slots`); marks `path` unknown if one fails. */
  checkRaw(template: string, path: string, i: number | null, slots: number[] = []): boolean {
    const specs = FIELD_RAW_KEYS[template] ?? [];
    for (const { key, kind } of specs) {
      const keys = key.endsWith('_*')
        ? slots.map((s) => key.replace('*', String(s)))
        : [i === null ? key : key.replace('{i}', String(i))];
      if (keys.some((k) => !rawPresent(this.data[k], kind))) {
        this.unknownFields.add(path);
        return false;
      }
    }
    return true;
  }

  unknown(path: string) {
    this.unknownFields.add(path);
  }
}

function toFood(raw: unknown, path: string, field: string, c: Collector): FoodStack[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) fail(path, 'an array', raw);
  const stacks: FoodStack[] = [];
  for (const slot of raw) {
    if (!isDict(slot)) continue;
    const rawName = typeof slot.rawName === 'string' ? slot.rawName : null;
    if (rawName === null || rawName === '' || rawName === 'Blank') continue;
    const amount = finite(slot.amount) ?? 0;
    if (amount <= 0) continue;
    const item = typeof slot.name === 'string' && slot.name !== '' ? slot.name : null;
    if (item === null) {
      // An item the pin doesn't know: keep the stack (it is still food in the slot), name unknown.
      c.items.add(rawName);
      c.unknown(field);
    }
    stacks.push({ item, amount });
  }
  return stacks;
}

type CharacterRead = { ok: true; state: CharacterState } | { ok: false };

function toCharacter(
  raw: Dict,
  index: number,
  asOf: number,
  warnings: string[],
  c: Collector,
): CharacterRead {
  const at = `characters[${index}]`;
  const { data } = c;
  const { class: cls, level, afkType, afkTarget, currentMap } = raw;

  // Class: an id the pin doesn't know resolves to no class name; that one character can't be read.
  if (typeof cls !== 'string' || cls === '') {
    const rawClass = finite(data[`CharacterClass_${index}`]);
    if (cls === undefined && rawClass !== null && finite(raw.classIndex) === rawClass) {
      c.classes.add(String(rawClass));
      c.unknown(`${at}.class`);
      return { ok: false };
    }
    fail(`${at}.class`, 'a class name', cls);
  }
  c.checkRaw('characters[].class', `${at}.class`, index);

  // Level: Toolbox reads a missing Lv0_<i> as level 0, so the raw key decides.
  if (!c.checkRaw('characters[].level', `${at}.level`, index)) return { ok: false };
  const lv = finite(level);
  if (lv === null || lv < 0) fail(`${at}.level`, 'a level', level);

  // Without charNames, Toolbox names characters by slot number.
  const named = typeof raw.name === 'string' && raw.name !== '';
  const name = named ? (raw.name as string) : `Character ${index + 1}`;
  if (!named && !warnings.includes(UNNAMED_WARNING)) warnings.push(UNNAMED_WARNING);

  // AFK Target: only an empty or "_" raw value means "no target"; an id the pin doesn't know is unknown.
  let type: string | null = null;
  let target: string | null = null;
  const rawTarget = data[`AFKtarget_${index}`];
  const typeKeys = c.checkRaw('characters[].afkType', `${at}.afkType`, index);
  const targetKeys = c.checkRaw('characters[].afkTarget', `${at}.afkTarget`, index);
  const afkKnown = typeKeys && targetKeys;
  if (afkKnown) {
    if (rawTarget === '' || rawTarget === '_') {
      type = 'Nothing';
    } else if (typeof afkType === 'string' && afkType !== '') {
      type = afkType;
      target = type !== 'Nothing' && typeof afkTarget === 'string' && afkTarget !== '_' ? afkTarget : null;
    } else {
      c.monsters.add(String(rawTarget));
      c.unknown(`${at}.afkType`);
      c.unknown(`${at}.afkTarget`);
    }
  }

  // Map: an unknown map id is listed, not just null.
  let map: string | null = null;
  if (c.checkRaw('characters[].currentMap', `${at}.currentMap`, index)) {
    if (typeof currentMap === 'string' && currentMap !== '') map = currentMap;
    else {
      c.maps.add(String(finite(data[`CurrentMap_${index}`])));
      c.unknown(`${at}.currentMap`);
    }
  }

  c.checkRaw('characters[].foodStacks', `${at}.foodStacks`, index);
  const foodStacks = toFood(raw.food, `${at}.food`, `${at}.foodStacks`, c);

  let seconds: number | null = null;
  if (c.checkRaw('characters[].secondsSinceLastSave', `${at}.secondsSinceLastSave`, index)) {
    seconds = secondsBetween(finite(raw.afkTime), asOf);
    if (seconds === null) c.unknown(`${at}.secondsSinceLastSave`);
  }

  return {
    ok: true,
    state: {
      index,
      name,
      class: cls,
      level: lv,
      afkType: type,
      afkTarget: target,
      currentMap: map,
      foodStacks,
      secondsSinceLastSave: seconds,
    },
  };
}

/**
 * The newest character save within 30 s of the account's, with no other within 1 s; else null.
 * `times` are Toolbox's per-character `afkTime` (epoch ms, from `PTimeAway_<i>`).
 */
function lastPlayed(times: Array<{ slot: number; ms: number }>, lastCloudSave: number | null): number | null {
  if (lastCloudSave === null) return null;
  const [newest, next] = [...times].sort((a, b) => b.ms - a.ms);
  if (!newest) return null;
  if (Math.abs(lastCloudSave - newest.ms) > LAST_PLAYED_WITHIN_MS) return null;
  if (next && newest.ms - next.ms < LAST_PLAYED_TIE_MS) return null;
  return newest.slot;
}

/**
 * Projects a Toolbox parse onto the Account State. `envelope` is the parser's input: its raw keys back
 * the presence checks, and its `sideReadReport` lists the side reads that errored.
 * @throws EmptyAccountError when the parse produced no account or no character with data.
 * @throws AccountShapeError when Toolbox's output has changed shape under us.
 */
export function toAccountState(
  parsed: ParsedSave,
  envelope: RawSaveEnvelope,
  options: ToAccountStateOptions = {},
): AccountState {
  const { account, characters, meta } = parsed;
  const asOf = meta.now;
  if (!isDict(account) || Object.keys(account).length === 0) {
    throw new EmptyAccountError(
      parsed.error
        ? `The parser could not read this save (${parsed.error}).`
        : 'The parser returned no account.',
    );
  }

  const data: Dict = isDict(envelope.data) ? envelope.data : {};
  const c = new Collector(data);
  const failedSections = [...new Set(parsed.failedSections)];
  const warnings = failedSections.map((s) => `Parser section "${s}" failed and was skipped.`);
  const states: CharacterState[] = [];
  const skipped: number[] = [];
  const unreadable: number[] = [];
  const withData: number[] = [];
  characters.forEach((raw, index) => {
    if (!isDict(raw)) fail(`characters[${index}]`, 'an object', raw);
    // Characters listed in charNames but missing from the save come back as stubs without a class.
    if (raw.class === undefined && raw.level === undefined) {
      skipped.push(index);
      warnings.push(`Character ${index + 1} has no save data and was skipped.`);
      return;
    }
    withData.push(index);
    const read = toCharacter(raw, index, asOf, warnings, c);
    if (read.ok) states.push(read.state);
    else {
      unreadable.push(index);
      warnings.push(`Character ${index + 1} could not be read and is shown as unknown.`);
    }
  });
  if (withData.length === 0) throw new EmptyAccountError('The save has no characters with data.');

  const finished = account.finishedWorlds;
  if (finished !== undefined && !isDict(finished)) fail('account.finishedWorlds', 'an object', finished);
  let finishedWorlds = Object.entries(finished ?? {})
    .filter(([, done]) => done === true)
    .map(([key]) => Number(key.replace(/^World/, '')))
    .filter(Number.isInteger)
    .sort((a, b) => a - b);
  let currentWorld = finite(account.currentWorld);
  const worldsKnown =
    c.checkRaw('account.finishedWorlds', 'account.finishedWorlds', null, withData) &&
    c.checkRaw('account.currentWorld', 'account.currentWorld', null, withData);
  if (!worldsKnown) {
    c.unknown('account.finishedWorlds');
    c.unknown('account.currentWorld');
    finishedWorlds = [];
    currentWorld = null;
  }

  const timeAway = isDict(account.timeAway) ? account.timeAway : {};
  const globalTime = finite(timeAway.GlobalTime);
  let lastCloudSave = globalTime === null ? null : Math.round(globalTime * 1000);
  if (
    !c.checkRaw('account.lastCloudSave', 'account.lastCloudSave', null) ||
    !c.checkRaw('account.secondsSinceLastSave', 'account.secondsSinceLastSave', null) ||
    lastCloudSave === null
  ) {
    c.unknown('account.lastCloudSave');
    c.unknown('account.secondsSinceLastSave');
    lastCloudSave = null;
  }

  // The daily reset: ShopRestock is a countdown in seconds, taken at GlobalTime (Toolbox's
  // hoursUntilDailyReset reads it the same way).
  let dailyResetAt: number | null = null;
  const restock = finite(timeAway.ShopRestock);
  if (
    c.checkRaw('account.dailyResetAt', 'account.dailyResetAt', null) &&
    lastCloudSave !== null &&
    restock !== null &&
    restock >= 0
  ) {
    dailyResetAt = Math.round(lastCloudSave + restock * 1000);
  } else {
    c.unknown('account.dailyResetAt');
  }

  const saveVersion = c.checkRaw('account.gameVersion.saveVersion', 'account.gameVersion.saveVersion', null)
    ? meta.saveVersion
    : null;
  const serverVars = isDict(account.serverVars) ? account.serverVars : {};
  const serverBuild = finite(serverVars.GameVERSION);
  if (serverBuild === null) c.unknown('account.gameVersion.serverBuild');

  let lastPlayedCharacterIndex: number | null = null;
  if (c.checkRaw('lastPlayedCharacterIndex', 'lastPlayedCharacterIndex', null, withData)) {
    const times = withData.flatMap((slot) => {
      const ms = finite(characters[slot]?.afkTime);
      return ms === null ? [] : [{ slot, ms }];
    });
    lastPlayedCharacterIndex = times.length === withData.length ? lastPlayed(times, lastCloudSave) : null;
  }

  const diagnostics: ParseDiagnostics = {
    failedSections,
    failedSideReads: [...new Set(envelope.sideReadReport?.failed ?? [])],
    skippedCharacters: skipped,
    unreadableCharacters: unreadable,
    unknownIds: {
      monsters: [...c.monsters],
      maps: [...c.maps],
      items: [...c.items],
      classes: [...c.classes],
    },
    unknownFields: [...c.unknownFields],
    unnamed: warnings.includes(UNNAMED_WARNING),
    parserPin: { commit: meta.parserCommit, gameVersion: meta.parserGameVersion },
    source: options.source ?? 'paste',
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    asOf,
    account: {
      currentWorld,
      finishedWorlds,
      lastCloudSave,
      secondsSinceLastSave: secondsBetween(lastCloudSave, asOf),
      dailyResetAt,
      gameVersion: { serverBuild, saveVersion, parserTarget: meta.parserGameVersion },
    },
    characters: states,
    lastPlayedCharacterIndex,
    diagnostics,
    warnings,
  };
}

/** "Siege_Breaker" -> "Siege Breaker", "FIGHTING" -> "Fighting". For display only. */
export function humanize(id: string): string {
  const spaced = id.replace(/_/g, ' ').trim();
  return spaced === spaced.toUpperCase() ? spaced.charAt(0) + spaced.slice(1).toLowerCase() : spaced;
}
