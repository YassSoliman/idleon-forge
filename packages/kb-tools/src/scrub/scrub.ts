// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The scrub walk (M11 TR-14 steps 1–4): build the pseudonym map, walk every leaf (decoding JSON-encoded
// strings), apply the policy, and run the unknown-string scan. Pure: no I/O. The command (command.ts)
// adds the denylist gate, the parse-equivalence check and the files.
import { isDeepStrictEqual } from 'node:util';
import type { Lookups } from '../load';
import type { ScrubInputs } from './inputs';
import {
  NUMERIC_LIKE,
  OPTLACC_STRING_KEEP,
  PSEUDONYM,
  RULES,
  type Rule,
  ruleFor,
  SERVER_VARS_KEEP,
  TOP_LEVEL_KEYS,
  TOURNAMENT_TOKEN,
  type ValueCheck,
} from './policy';

export interface NameMaps {
  /** Original character name -> Char{n}. */
  chars: Map<string, string>;
  /** Other players' names -> Member{n} / Opponent{n} / Friend{n}. */
  others: Map<string, string>;
}

export interface ScrubResult {
  output: Record<string, unknown>;
  names: NameMaps;
  /** Normalised path -> sample values that no rule explains. Non-empty stops the scrub. */
  unknown: Map<string, string[]>;
  /** Review stops: a new top-level key, a newly read serverVars key or OptLacc string slot. */
  problems: string[];
  /** Ids of the rules that matched a node of this export (for the policy hash). */
  matchedRules: Set<string>;
  /** serverVars keys that were blanked, and OptLacc slots blanked from a string. */
  blanked: { serverVars: string[]; optLacc: number[] };
}

type Json = unknown;
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** The empty value of the same type (TR-14: blank keeps the type). */
export function blankOf(v: Json): Json {
  if (typeof v === 'string') return '';
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  if (Array.isArray(v)) return [];
  if (isObj(v)) return {};
  return v;
}

/** Blanks every string below `v` (JSON-encoded strings re-encoded), keeping numbers. */
export function blankStrings(v: Json): Json {
  if (typeof v === 'string') {
    const decoded = decodeJson(v);
    if (decoded === undefined) return '';
    const out = blankStrings(decoded);
    return isDeepStrictEqual(out, decoded) ? v : JSON.stringify(out);
  }
  if (Array.isArray(v)) return v.map(blankStrings);
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankStrings(x)]));
  return v;
}

/** `data.CogO~[3]` -> `data.CogO~[*]`, `QuestHm_2[0].1` -> `QuestHm_*[*].1`, for grouping. */
export const normalisePath = (p: string) => p.replace(/\[\d+\]/g, '[*]').replace(/_\d+(?=$|[.[~])/g, '_*');

function decodeJson(s: string): Json | undefined {
  if (!(s.startsWith('[') || s.startsWith('{'))) return undefined;
  try {
    const d: unknown = JSON.parse(s);
    return typeof d === 'object' && d !== null ? d : undefined;
  } catch {
    return undefined;
  }
}

/** All flat lookup values (items, monsters, maps, classes, talents, cards, quests, pets, sentinels…). */
export function lookupValues(lookups: Lookups): Set<string> {
  const out = new Set<string>();
  for (const v of Object.values(lookups))
    if (Array.isArray(v)) for (const x of v) if (typeof x === 'string') out.add(x);
  return out;
}

export function passes(check: ValueCheck, s: string, lookups: Lookups): boolean {
  if ('lookup' in check) return check.lookup.some((t) => (lookups[t] as string[] | undefined)?.includes(s));
  if ('set' in check) return check.set.includes(s);
  if ('regex' in check) return check.regex.test(s);
  if ('any' in check) return check.any.some((c) => passes(c, s, lookups));
  if ('letterSet' in check) {
    if (/[\s,;:"'{}[\]]/.test(s) || /^\d+$/.test(s)) return false;
    const letters = [...s.replace(/_/g, '')];
    return new Set(letters).size === letters.length;
  }
  return s
    .split(check.sep ?? ',')
    .every((t) => t === '' || NUMERIC_LIKE.test(t) || passes(check.tokens, t, lookups));
}

/** The tournament match record: [[ownName, ...nums], [opponentName, ...nums], [tokens...]]. */
function matchNames(decoded: Json): string[] {
  if (!Array.isArray(decoded)) return [];
  return decoded
    .slice(0, 2)
    .map((side) => (Array.isArray(side) && typeof side[0] === 'string' ? side[0] : null))
    .filter((x): x is string => x !== null);
}

const friendNames = (s: string): string[] =>
  s
    .split(';')
    .filter(Boolean)
    .map((e) => e.split(',')[2])
    .filter((n): n is string => typeof n === 'string' && n !== '');

/** Step 2: the pseudonym map, from charNames, guild members, tournament opponents and friends. */
export function buildNameMaps(raw: Record<string, unknown>): NameMaps {
  const chars = new Map<string, string>();
  const names = Array.isArray(raw.charNames) ? (raw.charNames as unknown[]) : [];
  names.forEach((n, i) => {
    if (typeof n === 'string' && n !== '' && !chars.has(n)) chars.set(n, `Char${i + 1}`);
  });
  const others = new Map<string, string>();
  const counters = { Member: 0, Opponent: 0, Friend: 0 };
  const add = (name: string, kind: keyof typeof counters) => {
    if (name === '' || chars.has(name) || others.has(name)) return;
    counters[kind] += 1;
    others.set(name, `${kind}${counters[kind]}`);
  };
  const members = isObj(raw.guildData) && Array.isArray(raw.guildData.members) ? raw.guildData.members : [];
  for (const m of members) if (isObj(m) && typeof m.a === 'string') add(m.a, 'Member');
  const t = raw.tournament;
  const d = isObj(t) && isObj(t.match) && Array.isArray(t.match.d) ? t.match.d : [];
  for (const rec of d)
    if (typeof rec === 'string') for (const n of matchNames(decodeJson(rec))) add(n, 'Opponent');
  const data = isObj(raw.data) ? raw.data : {};
  let opt: unknown = data.OptLacc;
  if (typeof opt === 'string') opt = decodeJson(opt);
  const friends = Array.isArray(opt) ? opt[476] : undefined;
  if (typeof friends === 'string') for (const n of friendNames(friends)) add(n, 'Friend');
  return { chars, others };
}

export interface ScrubOptions {
  lookups: Lookups;
  inputs: ScrubInputs;
  rules?: readonly Rule[];
}

/** Steps 1–4 of TR-14 over one export. */
export function scrubExport(raw: Record<string, unknown>, opts: ScrubOptions): ScrubResult {
  const rules = opts.rules ?? RULES;
  const names = buildNameMaps(raw);
  const lookups = lookupValues(opts.lookups);
  const unknown = new Map<string, string[]>();
  const problems: string[] = [];
  const matchedRules = new Set<string>();
  const blanked = { serverVars: [] as string[], optLacc: [] as number[] };
  const read = { vars: new Set(opts.inputs.serverVarsRead), opt: new Set(opts.inputs.optLaccRead) };

  for (const k of Object.keys(raw))
    if (!(TOP_LEVEL_KEYS as readonly string[]).includes(k))
      problems.push(`unknown top-level key "${k}": a new export format must be reviewed`);

  const generic = (s: string) => s.length < 3 || NUMERIC_LIKE.test(s) || PSEUDONYM.test(s) || lookups.has(s);
  const flag = (path: string, s: string) => {
    const k = normalisePath(path);
    const list = unknown.get(k) ?? [];
    if (list.length < 5 && !list.includes(s)) list.push(s);
    unknown.set(k, list);
  };
  /** A string leaf under a check: the check, or the generic scan. */
  const scan = (path: string, s: string, check?: ValueCheck): string => {
    if (names.chars.has(s)) return names.chars.get(s) as string;
    if (generic(s) || (check && passes(check, s, opts.lookups))) return s;
    flag(path, s);
    return s;
  };

  const walk = (v: Json, path: string, inherited?: ValueCheck): Json => {
    const rule = path ? ruleFor(path, rules) : undefined;
    if (rule) matchedRules.add(rule.id);
    if (rule?.action === 'blank') return blankOf(v);
    if (rule?.action === 'blank-strings') return blankStrings(v);
    if (rule?.action === 'rename-chars' && typeof v === 'string') return names.chars.get(v) ?? v;
    if (rule?.action === 'pseudonym' && typeof v === 'string')
      return v === '' ? v : (names.others.get(v) ?? names.chars.get(v) ?? v);

    if (rule?.id === 'server-vars') {
      const key = path.slice('serverVars.'.length);
      const check = SERVER_VARS_KEEP[key];
      if (read.vars.has(key) && !check)
        problems.push(
          `serverVars.${key} is read by the parsers but not reviewed: add it to SERVER_VARS_KEEP (scrub/policy.ts)`,
        );
      if (!check || !read.vars.has(key)) {
        blanked.serverVars.push(key);
        return blankOf(v);
      }
      return walk(v, `${path}#kept`, check);
    }

    if (rule?.id === 'optlacc' && typeof v === 'string') {
      const i = Number(/\[(\d+)\]$/.exec(path)?.[1]);
      const policy = OPTLACC_STRING_KEEP[i];
      if (policy === 'friends')
        return v
          .split(';')
          .map((e) => {
            const parts = e.split(',');
            if (parts[2]) parts[2] = names.others.get(parts[2]) ?? names.chars.get(parts[2]) ?? parts[2];
            return parts.join(',');
          })
          .join(';');
      if (policy === undefined && read.opt.has(i) && v !== '' && !NUMERIC_LIKE.test(v))
        problems.push(
          `data.OptLacc[${i}] holds a string the parsers read, and is not reviewed: add it to OPTLACC_STRING_KEEP`,
        );
      if (policy === undefined || policy === 'blank') {
        if (v !== '') blanked.optLacc.push(i);
        return '';
      }
      if (NUMERIC_LIKE.test(v) || passes(policy, v, opts.lookups)) return v;
      flag(path, v);
      return v;
    }

    if (rule?.structured === 'cog-player' && typeof v === 'string') {
      if (v.startsWith('Player_')) {
        const name = v.slice('Player_'.length);
        const mapped = names.chars.get(name) ?? names.others.get(name);
        if (mapped) return `Player_${mapped}`;
        flag(path, 'Player_<unmapped name>');
        return v;
      }
      return scan(path, v, rule.values);
    }

    if (rule?.structured === 'tournament-match' && typeof v === 'string') {
      const decoded = decodeJson(v);
      if (!Array.isArray(decoded)) {
        flag(path, '<undecodable match record>');
        return v;
      }
      const out = decoded.map((side, i) => {
        if (!Array.isArray(side)) return side;
        if (i < 2)
          return side.map((x, j) =>
            j === 0 && typeof x === 'string' ? (names.chars.get(x) ?? names.others.get(x) ?? x) : x,
          );
        return side.map((x) => {
          if (typeof x === 'string' && !TOURNAMENT_TOKEN.test(x) && !NUMERIC_LIKE.test(x))
            flag(`${path}~[2]`, x);
          return x;
        });
      });
      return isDeepStrictEqual(out, decoded) ? v : JSON.stringify(out);
    }

    const check = rule?.values ?? inherited;
    if (typeof v === 'string') {
      const decoded = decodeJson(v);
      if (decoded !== undefined) {
        const out = walk(decoded, `${path}~`, check);
        return isDeepStrictEqual(out, decoded) ? v : JSON.stringify(out);
      }
      return scan(path, v, check);
    }
    if (Array.isArray(v)) return v.map((x, i) => walk(x, `${path}[${i}]`, check));
    if (isObj(v)) {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) out[k] = walk(x, path ? `${path}.${k}` : k, check);
      return out;
    }
    return v;
  };

  const output = walk(raw, '') as Record<string, unknown>;
  // `#kept` is an internal marker for the serverVars subtree; strip it from flagged paths.
  for (const [k, vals] of [...unknown]) {
    if (k.includes('#kept')) {
      unknown.delete(k);
      unknown.set(k.replace('#kept', ''), vals);
    }
  }
  return { output, names, unknown, problems, matchedRules, blanked };
}
