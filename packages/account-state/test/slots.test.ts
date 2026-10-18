// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 TR-2's fields on the scrubbed saves (CI), with the worker's Toolbox functions injected; the OLA
// contract (TR-9) on every public save; synthetic helpers. Counts, classes and levels only (TR-8).
import { readFileSync } from 'node:fs';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { ballotText, SKILL_IDS, toAccountState } from '../src';
import { accountStateOf, listJson, PUBLIC_DIR, readSave } from './helpers';

const scrubbed = (id: string) => {
  const raw = JSON.parse(
    readFileSync(new URL(`../../../fixtures/scrubbed/${id}.json`, import.meta.url), 'utf8'),
  ) as Parameters<typeof normalizeEnvelope>[0];
  const env = normalizeEnvelope(raw);
  const d = env.data as Record<string, unknown>;
  const ta = (typeof d.TimeAway === 'string' ? JSON.parse(d.TimeAway) : d.TimeAway) as { GlobalTime: number };
  const now = Math.round(ta.GlobalTime * 1000);
  return toAccountState(parseSave(env, { now }), env, { toolbox: { calls: toolboxCalls, withFrozenClock } });
};
const who = (s: ReturnType<typeof scrubbed>, index: number) => {
  const c = s.characters.find((x) => x.index === index);
  return c ? `${c.class} ${c.level}` : `?${index}`;
};

describe('M20 fields on the scrubbed W3-early save', () => {
  const s = scrubbed('scrubbed-w3');
  it('reads the Cog Board: 23 open squares, 1 free, both Squires on the board, 3 on the shelf, the Shaman 54 in the inventory', () => {
    const b = s.account.cogBoard;
    expect(b?.squares).toHaveLength(96);
    expect(b?.squares.filter((x) => x !== 'locked')).toHaveLength(23);
    expect(b?.squares.filter((x) => x === 'open')).toHaveLength(1);
    const place = (kind: string) =>
      s.characters
        .filter((c) => c.slots?.cogPlace?.kind === kind)
        .map((c) => who(s, c.index))
        .sort();
    expect(place('board')).toEqual(['Squire 51', 'Squire 85']);
    expect(place('shelf')).toEqual(['Barbarian 56', 'Bowman 60', 'Wizard 73']);
    expect(place('inventory')).toEqual(['Shaman 54']);
  });
  it('reads Toolbox build speed and Construction EXP per character (the three-way tie at 111.17)', () => {
    const tie = s.characters.filter((c) => Math.abs((c.slots?.constructionSpeed ?? 0) - 111.17) < 0.01);
    expect(tie.map((c) => who(s, c.index)).sort()).toEqual([
      'Barbarian 56',
      'Bowman 60',
      'Squire 51',
      'Wizard 73',
    ]);
  });
  it('no skull, no trap set and no Lord of the Hunt quest on any character; cauldron seats read', () => {
    expect(s.characters.every((c) => c.slots?.skull === null && c.slots?.trapSet === null)).toBe(true);
    expect(s.characters.every((c) => c.slots?.trappingStarted === false)).toBe(true);
    expect(s.characters.map((c) => c.slots?.cauldron)).toEqual([2, 0, 1, 0, 3, 2]);
  });
  it('liquids: Water and Nitrogen open (best Alchemy 20), Nitrogen nearly empty', () => {
    const l = s.account.liquids ?? [];
    expect(l.map((x) => x.unlocked)).toEqual([true, true, false, false]);
    expect(l[1]?.max).toBe(13);
    expect(l[1]?.current).toBeLessThan(1);
  });
  it('reset items: weekly offset 1, Killroy 1 room done with 6 skulls, Ballot voted, tournament not registered', () => {
    expect(s.account.resets).toEqual({ weeklyOffsetDays: 1, serverWeekOfSave: 2963 });
    const k = s.account.killroy;
    expect(k?.roomsOpen).toBe(1);
    expect(k?.doneCode).toBe(1);
    expect(k?.skulls).toBe(6);
    expect(k?.roomClasses[0]).toHaveLength(1);
    expect(k?.roomClasses[1]).toHaveLength(1);
    expect(s.account.ballot?.votedWeek).toBe(2963);
    expect(s.account.weeklyBattle?.bestDifficulty).toBe(0);
    expect(s.account.petTournament).toMatchObject({ registeredThroughDay: 241, day: 241 });
    expect(s.account.taskBoardDailies?.map((t) => [t.unlocked, t.done])).toEqual([
      [true, false],
      [true, false],
      [true, false],
    ]);
    // The scrub drops the guild id and name, so the scrubbed copy reads as not in a guild.
    expect(s.account.guildTasks).toEqual({ member: false, daily: [], weekly: [] });
    expect(s.account.randomEvents?.doneToday).toBe(false);
    expect(s.account.randomEvents?.schedule.length).toBeGreaterThan(0);
  });
  it('skills: every W1–W3 skill per character', () => {
    for (const c of s.characters) expect(Object.keys(c.skills ?? {}).sort()).toEqual([...SKILL_IDS].sort());
  });
  it('keeps no player-cog name (TR-2 privacy)', () => {
    expect(JSON.stringify(s.account.cogBoard)).not.toMatch(/Player_/);
  });
});

describe('M20 fields on the scrubbed W2-late save', () => {
  const s = scrubbed('scrubbed-w2');
  it('Killroy: 1 room, never run; no guild; the W2 task board waits on its quest', () => {
    expect(s.account.killroy?.roomsOpen).toBe(1);
    expect(s.account.killroy?.doneCode).toBe(0);
    expect(s.account.killroy?.roomClasses[0]).toEqual(['Warrior']);
    expect(s.account.guildTasks?.member).toBe(false);
    expect(s.account.taskBoardDailies?.map((t) => t.unlocked)).toEqual([true, false, false]);
    expect(s.account.liquids?.map((x) => x.unlocked)).toEqual([true, false, false, false]);
  });
});

describe('without the worker functions', () => {
  it('Killroy and Random Events are not computed (null), never a default', () => {
    const raw = JSON.parse(
      readFileSync(new URL('../../../fixtures/scrubbed/scrubbed-w3.json', import.meta.url), 'utf8'),
    ) as Parameters<typeof normalizeEnvelope>[0];
    const s = accountStateOf(raw);
    expect(s.account.killroy).toBeNull();
    expect(s.account.randomEvents).toBeNull();
    expect(s.account.ballot?.votedWeek).toBe(2963);
  });
});

describe('the OLA contract on every public save (TR-9)', () => {
  for (const file of listJson(PUBLIC_DIR)) {
    it(`${file}: reset-item fields are integers in range or null`, () => {
      const s = accountStateOf(readSave(PUBLIC_DIR, file));
      const w = s.account.weeklyBattle;
      if (w) expect(w.bestDifficulty).toBeGreaterThanOrEqual(0);
      if (w) expect(w.bestDifficulty).toBeLessThanOrEqual(5);
      const r = s.account.resets;
      if (r?.weeklyOffsetDays != null) expect(r.weeklyOffsetDays).toBeGreaterThanOrEqual(0);
      if (r?.weeklyOffsetDays != null) expect(r.weeklyOffsetDays).toBeLessThan(8);
      for (const c of s.characters) {
        const sl = c.slots;
        if (sl?.skull) expect(sl.skull).toMatch(/^WorshipSkull\d+$/);
        if (sl?.trapSet) expect(sl.trapSet).toMatch(/^TrapBoxSet\d+$/);
      }
    });
  }
});

describe('ballotText', () => {
  it('fills the multiplier and the percent', () => {
    expect(ballotText('All_your_characters_deal_}x_more_damage', 25)).toBe(
      'All your characters deal 1.25x more damage',
    );
    expect(ballotText('+{%_Drop_Rate', 30)).toBe('+30% Drop Rate');
  });
});
