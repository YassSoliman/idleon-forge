// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Toolbox output (untyped) -> Account State (typed). This is the one place that knows Toolbox's
// field names, so a re-sync that renames a field fails here, loudly, in the contract tests.
import type { ParsedSave } from '@idleon-forge/toolbox-parsers';
import type { AccountState, CharacterState, FoodStack } from './types';

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

function fail(path: string, expected: string, got: unknown): never {
  const shown = got === undefined ? 'undefined' : JSON.stringify(got)?.slice(0, 60);
  throw new AccountShapeError(`${path}: expected ${expected}, got ${shown}`);
}

function toFood(raw: unknown, path: string): FoodStack[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) fail(path, 'an array', raw);
  const stacks: FoodStack[] = [];
  for (const slot of raw) {
    if (!isDict(slot)) continue;
    const amount = finite(slot.amount) ?? 0;
    const item = typeof slot.name === 'string' ? slot.name : null;
    if (item && amount > 0 && slot.rawName !== 'Blank') stacks.push({ item, amount });
  }
  return stacks;
}

function toCharacter(raw: Dict, index: number, asOf: number): CharacterState {
  const at = `characters[${index}]`;
  const { name, class: cls, level, afkType, afkTarget, currentMap } = raw;
  if (typeof name !== 'string' || name === '') fail(`${at}.name`, 'a name', name);
  if (typeof cls !== 'string' || cls === '') fail(`${at}.class`, 'a class name', cls);
  const lv = finite(level);
  if (lv === null || lv < 0) fail(`${at}.level`, 'a level', level);
  const type = typeof afkType === 'string' && afkType !== '' ? afkType : 'Nothing';
  const target = type !== 'Nothing' && typeof afkTarget === 'string' && afkTarget !== '_' ? afkTarget : null;
  return {
    index,
    name,
    class: cls,
    level: lv,
    afkType: type,
    afkTarget: target,
    currentMap: typeof currentMap === 'string' && currentMap !== '' ? currentMap : null,
    foodStacks: toFood(raw.food, `${at}.food`),
    secondsSinceLastSave: secondsBetween(finite(raw.afkTime), asOf),
  };
}

/**
 * Projects a Toolbox parse onto the Account State.
 * @throws EmptyAccountError when the parse produced no account or no character with data.
 * @throws AccountShapeError when Toolbox's output has changed shape under us.
 */
export function toAccountState(parsed: ParsedSave): AccountState {
  const { account, characters, meta } = parsed;
  const asOf = meta.now;
  if (!isDict(account) || Object.keys(account).length === 0) {
    throw new EmptyAccountError(
      parsed.error
        ? `The parser could not read this save (${parsed.error}).`
        : 'The parser returned no account.',
    );
  }

  const warnings = parsed.failedSections.map((s) => `Parser section "${s}" failed and was skipped.`);
  const states: CharacterState[] = [];
  characters.forEach((raw, index) => {
    if (!isDict(raw)) fail(`characters[${index}]`, 'an object', raw);
    // Characters listed in charNames but missing from the save come back as stubs without a class.
    if (raw.class === undefined && raw.level === undefined) {
      warnings.push(`Character ${index + 1} has no save data and was skipped.`);
      return;
    }
    states.push(toCharacter(raw, index, asOf));
  });
  if (states.length === 0) throw new EmptyAccountError('The save has no characters with data.');

  const finished = account.finishedWorlds;
  if (finished !== undefined && !isDict(finished)) fail('account.finishedWorlds', 'an object', finished);
  const finishedWorlds = Object.entries(finished ?? {})
    .filter(([, done]) => done === true)
    .map(([key]) => Number(key.replace(/^World/, '')))
    .filter(Number.isInteger)
    .sort((a, b) => a - b);

  const timeAway = isDict(account.timeAway) ? account.timeAway : {};
  const globalTime = finite(timeAway.GlobalTime);
  const lastCloudSave = globalTime === null ? null : Math.round(globalTime * 1000);
  const serverVars = isDict(account.serverVars) ? account.serverVars : {};

  return {
    asOf,
    account: {
      currentWorld: finite(account.currentWorld),
      finishedWorlds,
      lastCloudSave,
      secondsSinceLastSave: secondsBetween(lastCloudSave, asOf),
      gameVersion: {
        serverBuild: finite(serverVars.GameVERSION),
        saveVersion: meta.saveVersion,
        parserTarget: meta.parserGameVersion,
      },
    },
    characters: states,
    warnings,
  };
}

/** "Siege_Breaker" -> "Siege Breaker", "FIGHTING" -> "Fighting". For display only. */
export function humanize(id: string): string {
  const spaced = id.replace(/_/g, ' ').trim();
  return spaced === spaced.toUpperCase() ? spaced.charAt(0) + spaced.slice(1).toLowerCase() : spaced;
}
