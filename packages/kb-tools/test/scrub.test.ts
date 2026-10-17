// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The scrub (M11 TR-14, US-11, FR-25, FR-27) and M1 TR-17's acceptance criteria for it. Runs over
// Toolbox's public saves in CI; over the two private saves locally only, never printing a name.
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FIELD_SOURCES } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { listFixtures } from '../src/fixtures';
import { loadSource } from '../src/load';
import { PRIVATE_FIXTURES, PUBLIC_FIXTURES, SCRUBBED_FIXTURES } from '../src/paths';
import { scrub } from '../src/scrub/command';
import { SCRUBBED_OUTPUT_PATHS } from '../src/scrub/equivalence';
import { denyMatcher, policyHash, stringLeaves, structuralGate, wordsOf } from '../src/scrub/gates';
import { readScrubInputs, scanScrubInputs } from '../src/scrub/inputs';
import { assertPolicy, OPTLACC_STRING_KEEP, RULES, type Rule, SERVER_VARS_KEEP } from '../src/scrub/policy';
import { buildNameMaps, lookupValues, scrubExport } from '../src/scrub/scrub';

const src = loadSource();
const lookups =
  src.lookups ??
  (() => {
    throw new Error('run pnpm kb generate');
  })();
const inputs = readScrubInputs();
const publicFiles = readdirSync(PUBLIC_FIXTURES)
  .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
  .sort();
const readJson = (f: string) => JSON.parse(readFileSync(f, 'utf8')) as Record<string, unknown>;

/** Every original name of an export: characters, guild members, tournament opponents, friends. */
function originalNames(raw: Record<string, unknown>): string[] {
  const m = buildNameMaps(raw);
  return [...m.chars.keys(), ...m.others.keys()];
}

/** A minimal, policy-clean export built from a public save, for focused mutations. */
const base = () => readJson(path.join(PUBLIC_FIXTURES, 'latest.json'));

describe('the policy (TR-14)', () => {
  it('names the values every string keep allows', () => {
    expect(() => assertPolicy()).not.toThrow();
    const pathOnly: Rule = { id: 'bad', version: 1, path: /^data\.X$/, action: 'keep', why: 'test' };
    expect(() => assertPolicy([...RULES, pathOnly])).toThrow(/must name the values/);
  });

  it('SERVER_VARS_READ and the OptLacc slots the parsers read are generated and current', () => {
    expect(scanScrubInputs()).toEqual(inputs);
    // Reviewed before the first scrub: every read serverVars key is in the reviewed table, and every
    // reviewed key is one the parsers read.
    expect(inputs.serverVarsRead.filter((k) => !(k in SERVER_VARS_KEEP))).toEqual([]);
    expect(Object.keys(SERVER_VARS_KEEP).filter((k) => !inputs.serverVarsRead.includes(k))).toEqual([]);
    // Every reviewed OptLacc string slot that keeps values is one the parsers read.
    for (const [i, p] of Object.entries(OPTLACC_STRING_KEEP))
      if (p !== 'blank') expect(inputs.optLaccRead, `OptLacc[${i}]`).toContain(Number(i));
  });

  it('only rules that matched a fixture move its policy hash', () => {
    const h = policyHash(['char-names', 'guild-id']);
    expect(policyHash(['guild-id', 'char-names'])).toBe(h);
    expect(policyHash(['char-names'])).not.toBe(h);
  });
});

describe('the denylist matcher (step 5)', () => {
  it('matches whole words, split on case changes and digits, never inside game ids', () => {
    const m = denyMatcher(
      ['Two', 'Bob', 'JosephHood', 'Player1'],
      new Set(['Knightly_Twohander', 'Call_Me_Bob']),
    );
    expect(m.denied('Two')).toBe(true);
    expect(m.denied('Player_JosephHood')).toBe(true);
    expect(m.denied('Knightly_Twohander')).toBe(false);
    expect(m.denied('Player_Char7')).toBe(false);
    expect(wordsOf('Player_Char11')).toEqual(['player', 'char', '11']);
    // A lookup value is game data, not a name.
    expect(m.denied('Call_Me_Bob')).toBe(false);
  });

  it('checks a name that is also game data as a whole leaf only', () => {
    const m = denyMatcher(['Gold'], new Set(['Gold']));
    expect(m.denied('Gold_Bar')).toBe(false);
    expect(m.denied('gold')).toBe(false);
  });
});

describe.each(publicFiles)('scrubbing public save %s', (file) => {
  const raw = readJson(path.join(PUBLIC_FIXTURES, file));
  const run = scrub(raw, { id: 'scrubbed-test' });
  const out = JSON.parse(run.text) as Record<string, unknown>;

  it('stops for nothing: no unexplained string, no review stop, parse-equivalent', () => {
    expect(run.stops).toEqual([]);
  });

  it('renames characters to Char1…CharN and pseudonymises every other player', () => {
    const names = out.charNames as string[];
    expect(names.every((n, i) => n === `Char${i + 1}`)).toBe(true);
    const members = ((out.guildData as { members?: { a?: unknown }[] })?.members ?? []).map((m) => m?.a);
    expect(members.every((a) => typeof a !== 'string' || a === '' || /^(Member|Char)\d+$/.test(a))).toBe(
      true,
    );
  });

  it('leaves no original name anywhere in the serialized output (M1 TR-17 test 1)', () => {
    const matcher = denyMatcher(originalNames(raw), lookupValues(lookups));
    expect([...stringLeaves(out)].filter((s) => matcher.denied(s)).length).toBe(0);
  });

  it('blanks the guild id, the leaderboard and every serverVars key the parsers do not read', () => {
    const g = out.guildData as { id?: unknown } | undefined;
    if (g && 'id' in g) expect(g.id === '' || g.id === null).toBe(true);
    const t = out.tournament as { leaderboard?: unknown[] } | undefined;
    if (t?.leaderboard) expect(t.leaderboard).toEqual([]);
    for (const [k, v] of Object.entries((out.serverVars ?? {}) as Record<string, unknown>))
      if (!(k in SERVER_VARS_KEEP))
        expect(
          v === '' ||
            v === 0 ||
            (Array.isArray(v) && v.length === 0) ||
            v === false ||
            (typeof v === 'object' && v !== null && Object.keys(v).length === 0),
          k,
        ).toBe(true);
  });
});

describe('scrub stops and exact-match replacement (US-11, TR-14)', () => {
  it('stops on a new top-level key', () => {
    const raw = { ...base(), surprise: 1 };
    expect(scrub(raw, { id: 'scrubbed-test' }).stops.join('\n')).toMatch(/unknown top-level key "surprise"/);
  });

  it('stops on a new, unreviewed string field and names the field path', () => {
    const raw = base();
    (raw.data as Record<string, unknown>).BrandNewKey = 'SomeoneSpecial';
    const r = scrubExport(raw, { lookups, inputs });
    expect([...r.unknown.keys()]).toEqual(['data.BrandNewKey']);
  });

  it('stops when the parsers start reading a serverVars key nobody reviewed', () => {
    const r = scrubExport(base(), {
      lookups,
      inputs: { ...inputs, serverVarsRead: [...inputs.serverVarsRead, 'Comp_RaffleWinners'] },
    });
    expect(r.problems.join('\n')).toMatch(
      /serverVars\.Comp_RaffleWinners is read by the parsers but not reviewed/,
    );
  });

  it('replaces exact matches only: a character named Two or Bob leaves game ids intact', () => {
    const raw = base();
    const names = [...(raw.charNames as string[])];
    names[0] = 'Two';
    names[1] = 'Bob';
    raw.charNames = names;
    const data = raw.data as Record<string, unknown>;
    data.ExtraItemTest = 'Knightly_Twohander';
    data.ExtraBubbleTest = 'Call_Me_Bob';
    data.ExtraNameTest = 'Two';
    const r = scrubExport(raw, {
      lookups: { ...lookups, items: [...lookups.items, 'Knightly_Twohander', 'Call_Me_Bob'] },
      inputs,
    });
    const out = r.output.data as Record<string, unknown>;
    expect(out.ExtraItemTest).toBe('Knightly_Twohander');
    expect(out.ExtraBubbleTest).toBe('Call_Me_Bob');
    expect(out.ExtraNameTest).toBe('Char1');
  });

  it('rewrites Player_<name> in CogO, opponents in tournament records and friends in OptLacc[476]', () => {
    const raw = base();
    const own = (raw.charNames as string[])[0] as string;
    const data = raw.data as Record<string, unknown>;
    const cog = JSON.parse(String(data.CogO)) as string[];
    cog[0] = `Player_${own}`;
    data.CogO = JSON.stringify(cog);
    const opt = data.OptLacc as unknown[];
    opt[476] = '3,98,SomeFriendName;1,10,AnotherFriend';
    opt[37] = 'SomeGuildName';
    raw.tournament = {
      ...(raw.tournament as object),
      match: {
        d: [
          JSON.stringify([
            [own, 0, 3],
            ['RivalPlayer', 0, 2],
            ['2x4-', '_'],
          ]),
        ],
      },
    };
    const r = scrubExport(raw, { lookups, inputs });
    const d = r.output.data as Record<string, unknown>;
    expect((JSON.parse(String(d.CogO)) as string[])[0]).toBe('Player_Char1');
    expect((d.OptLacc as unknown[])[476]).toMatch(/^3,98,Friend\d+;1,10,Friend\d+$/);
    expect((d.OptLacc as unknown[])[37]).toBe('');
    const rec = JSON.parse((r.output.tournament as { match: { d: string[] } }).match.d[0] as string);
    expect(rec[0][0]).toBe('Char1');
    expect(rec[1][0]).toMatch(/^Opponent\d+$/);
  });
});

describe('the Account State never reads a scrubbed output path (TR-14 step 6)', () => {
  it('no FIELD_SOURCES Toolbox path is on SCRUBBED_OUTPUT_PATHS', () => {
    for (const toolboxPath of Object.values(FIELD_SOURCES))
      for (const part of toolboxPath.split(/,\s*/)) {
        const p = part.replace('characters[i]', 'characters[0]');
        expect(
          SCRUBBED_OUTPUT_PATHS.some((r) => r.test(p)),
          p,
        ).toBe(false);
      }
  });
});

describe('the structural gate (TR-14, CI)', () => {
  it('passes on every committed scrubbed fixture', () => {
    expect(structuralGate()).toEqual([]);
  });

  it('fails a fixture with a real-looking name, a guild id or a stale policy hash', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'kb-scrub-'));
    const raw = base();
    const run = scrub(raw, { id: 'scrubbed-bad', consent: 'https://example.org/consent' });
    const bad = JSON.parse(run.text) as Record<string, unknown>;
    (bad.charNames as string[])[0] = 'NotAPseudonym';
    (bad.guildData as Record<string, unknown>).id = 'abcDEF123ghiJKL456mno';
    writeFileSync(path.join(dir, 'scrubbed-bad.json'), JSON.stringify(bad));
    writeFileSync(
      path.join(dir, 'scrubbed-bad.meta.json'),
      JSON.stringify({
        ...run.meta,
        scrubber: { ...(run.meta.scrubber as object), matchedPolicyHash: '00000000' },
      }),
    );
    const messages = structuralGate(dir).map((p) => p.message);
    expect(messages).toContain('charNames must all be Char<n>');
    expect(messages).toContain('guildData.id must be empty');
    expect(messages.some((m) => m.includes('re-scrub'))).toBe(true);
  });
});

// ---- the committed scrubbed fixtures, against their private originals (local only) ----

const PAIRS: [string, string][] = [
  ['scrubbed-w2', 'yasser.raw.json'],
  ['scrubbed-w3', 'joseph.raw.json'],
];
const havePrivate = PAIRS.every(([, f]) => existsSync(path.join(PRIVATE_FIXTURES, f)));

describe.skipIf(!havePrivate)('private saves (local only; names never printed)', () => {
  it.each(PAIRS)('%s scrubs with no stop, parse-equivalent', (_id, file) => {
    const run = scrub(readJson(path.join(PRIVATE_FIXTURES, file)), { id: 'scrubbed-local' });
    expect(run.stops.length).toBe(0);
  });

  it.each(PAIRS)(
    '%s: zero hits of any original character name, guild member, opponent, friend or guild id',
    (id, file) => {
      const committed = path.join(SCRUBBED_FIXTURES, `${id}.json`);
      if (!existsSync(committed)) return;
      const raw = readJson(path.join(PRIVATE_FIXTURES, file));
      const names = originalNames(raw);
      const guildId = (raw.guildData as { id?: unknown }).id;
      if (typeof guildId === 'string' && guildId) names.push(guildId);
      expect(names.length).toBeGreaterThan(0);
      const text = readFileSync(committed, 'utf8');
      // A plain grep first (case-insensitive substring), then the whole-word matcher over every leaf.
      const grepHits = names.filter(
        (n) => n.length >= 3 && text.toLowerCase().includes(n.toLowerCase()) && !lookupValues(lookups).has(n),
      );
      expect(grepHits.length).toBe(0);
      const matcher = denyMatcher(names, lookupValues(lookups));
      expect([...stringLeaves(JSON.parse(text))].filter((s) => matcher.denied(s)).length).toBe(0);
    },
  );
});

describe('fixture registry', () => {
  it('lists the public and scrubbed fixtures', () => {
    const ids = listFixtures({ private: false }).map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(['highend', 'latest', 'toolbox-raw']));
  });
});
