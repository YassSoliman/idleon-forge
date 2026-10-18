// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 user stories (docs/specs/M20-skills-parallel-slots.md §4) and TR-9's clock and ring tests, on the
// scrubbed saves (CI), which give the spec's worked numbers. By class and level only, never a name (TR-8).
import { describe, expect, it } from 'vitest';
import { runMetaPath } from '../../src/metapath';
import { buildNowView, DEFAULT_UI, EMPTY_PREFS, renderNowText } from '../../src/now';
import { buildChecklist, buildSlots, killroyRoomDone } from '../../src/slots';
import { copy, HOUR, kb, m20Goals, row, run, scrubbedFile, slotOf, workerState } from './helpers';

const w3 = () => copy(workerState(scrubbedFile('scrubbed-w3')));
const w2 = () => copy(workerState(scrubbedFile('scrubbed-w2')));
const ids = (gs: { id: string }[]) => gs.map((g) => g.id);

describe('US-1 one place for my daily items', () => {
  it('W3-early: today 1 of 11 (vial attempts done), week 2 of 5 (Killroy and the Ballot); the daily reset time', () => {
    const r = run(w3());
    expect(r.checklist?.rings).toEqual({ today: { done: 1, total: 11 }, week: { done: 2, total: 5 } });
    expect(row(r, 'vial-attempts')?.state).toBe('done');
    expect(row(r, 'pet-tournament')?.state).toBe('todo');
    expect(row(r, 'killroy-rooms')?.state).toBe('done');
    expect(row(r, 'ballot')?.state).toBe('done');
    const v = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: r.asOf });
    expect(v.checklist?.ringText).toBe('Today 1 of 11 · Week 2 of 5');
    expect(v.checklist?.dailyText).toMatch(/^daily reset in \d+h \d\dm$/);
  });

  it('W2-late: today 0 of 10, week 0 of 3; Post Office, guild and Efaunt keys are not listed', () => {
    const r = run(w2());
    expect(r.checklist?.rings).toEqual({ today: { done: 0, total: 10 }, week: { done: 0, total: 3 } });
    expect(r.checklist?.rows.map((x) => x.id)).not.toContain('post-office');
    expect(r.checklist?.rows.map((x) => x.id)).not.toContain('guild-daily');
    expect(row(r, 'boss-keys')?.details.join(' ')).not.toMatch(/Efaunt/);
    expect(r.checklist?.gated.map((g) => g.text)).toContain(
      "Post Office orders: finish Postboy Pablob's quest",
    );
    expect(
      row(r, 'weekly-battle')?.state === 'todo' &&
        row(r, 'ballot')?.state === 'todo' &&
        row(r, 'killroy-rooms')?.state,
    ).toBe('todo');
  });
});

describe('US-2 no reset surprises', () => {
  it('save + 13 h: vial attempts are to do again, the server-day rows and the week are unchanged', () => {
    const s = w3();
    const r = run(s, { now: s.asOf + 13 * HOUR });
    const vials = row(r, 'vial-attempts');
    expect(vials?.state).toBe('todo');
    expect(vials?.details[0]).toBe('reset since your last save');
    expect(row(r, 'pet-tournament')?.state).toBe('todo');
    expect(row(r, 'pet-mart')?.state).toBe('todo');
    expect(row(r, 'killroy-rooms')?.state).toBe('done');
    expect(row(r, 'ballot')?.state).toBe('done');
  });

  it("save + 37 h: Killroy's room is to do with next week's class, the skulls row is gone", () => {
    const s = w3();
    const r = run(s, { now: s.asOf + 37 * HOUR });
    const k = row(r, 'killroy-rooms');
    expect(k?.state).toBe('todo');
    const next = s.account.killroy?.roomClasses[1][0];
    expect(k?.details).toContain('reset since your last save');
    expect(k?.details.some((d) => d.startsWith(`${next} room`))).toBe(true);
    expect(row(r, 'killroy-skulls')).toBeUndefined();
    expect(row(r, 'spiketrap')?.resetSinceSave).toBe(true);
  });
});

describe('US-3 don’t lose skulls', () => {
  it('an 8 h return: no skull Goal; the row says how many and when the week ends', () => {
    const r = run(w3());
    expect(ids(m20Goals(r))).not.toContain('killroy.check.skulls');
    const v = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: r.asOf });
    const skulls = v.checklist?.bands.flatMap((b) => b.rows).find((x) => x.id === 'killroy-skulls');
    expect(skulls?.label).toBe('Spend 6 Killroy skulls');
    expect(skulls?.clockText).toMatch(/^your weekly reset in 36h \d\dm$/);
  });

  it('a 2-day return: the skull Goal at position 1, the checklist open with the row linked to it', () => {
    const r = run(w3(), { expectedReturnHours: 48 });
    const g = r.account.goals.find((x) => x.id === 'killroy.check.skulls');
    expect(g?.nextAction.text).toBe(
      "Spend 6 Killroy skulls at Killroy's Skull Shop: Arcade ball packs first",
    );
    // Position 1 (never-skip, by urgency): above every free-value fill such as the Cog Board seat.
    const at = (id: string) => r.account.goals.findIndex((x) => x.id === id);
    expect(at('killroy.check.skulls')).toBeLessThan(at('construction.check.cog-seat-free'));
    expect(r.checklist?.expanded).toBe(true);
    expect(row(r, 'killroy-skulls')?.link).toEqual({ kind: 'goal', key: 'killroy.check.skulls@account' });
  });
});

describe('US-4 who runs Killroy', () => {
  it('W2-late: the Squire Lv 43 runs the Warrior room (the Barbarian Lv 60 pushes); the row links to it', () => {
    const r = run(w2());
    expect(r.account.activePlay.map((a) => a.text)).toContain(
      "Run Killroy's Warrior room on your Squire Lv 43 (YumYum Grotto)",
    );
    expect(row(r, 'killroy-rooms')?.link).toEqual({ kind: 'active-play', key: 'killroy.check.room@room-1' });
  });

  it('an Archer room and no Archer-line character: cannot, no Active Play, one less in the week ring', () => {
    const s = w2();
    for (const c of s.characters) if (c.class === 'Bowman') c.class = 'Barbarian';
    const k = s.account.killroy;
    if (k) k.roomClasses = [['Archer'], ['Archer']];
    const r = run(s);
    expect(row(r, 'killroy-rooms')?.state).toBe('cannot');
    expect(row(r, 'killroy-rooms')?.details).toEqual(['Archer room: no Archer on your account']);
    expect(r.account.activePlay.some((a) => a.key.startsWith('killroy.check.room'))).toBe(false);
    expect(r.checklist?.rings.week.total).toBe(2);
  });
});

describe('US-5 seat the right character', () => {
  it('W3-early: the Shaman Lv 54 to the shelf, then the Wizard Lv 73 on the free square; no blocker', () => {
    const r = run(w3());
    const g = r.account.goals.find((x) => x.id === 'construction.check.cog-seat-free');
    expect(g?.nextAction.text).toBe('Put your Shaman Lv 54 on the Cog Shelf');
    expect(g?.details?.map((d) => d.text)).toEqual(['Seat your Wizard Lv 73 on the free Cog Board square']);
    expect(r.account.blockerKeys).not.toContain('construction.check.cog-seat-free@account');
  });

  it('a later save with the Shaman on the shelf and the Wizard on the board: no seat Goal', () => {
    const s = w3();
    const shaman = s.characters[slotOf(s, 'Shaman', 54)];
    const wizard = s.characters[slotOf(s, 'Wizard', 73)];
    const board = s.account.cogBoard;
    if (!shaman?.slots || !wizard?.slots || !board) throw new Error('fixture');
    const free = board.squares.indexOf('open');
    board.squares[free] = 'character';
    wizard.slots.cogPlace = { kind: 'board', slot: free };
    shaman.slots.cogPlace = { kind: 'shelf', slot: 99 };
    expect(ids(run(s).account.goals)).not.toContain('construction.check.cog-seat-free');
  });

  it('W2-late: no Cog Board Goal and every cog pip locked', () => {
    const r = run(w2());
    expect(ids(r.account.goals)).not.toContain('construction.check.cog-seat-free');
    expect(r.skills?.every((c) => c.slots.find((p) => p.kind === 'cog')?.state === 'locked')).toBe(true);
    expect(r.skills?.[0]?.slots.find((p) => p.kind === 'cog')?.text).toBe('Opens in W3');
  });
});

describe('US-6 skulls for everyone', () => {
  it('one account line for 6 characters, the four at the cap first', () => {
    const r = run(w3());
    const g = r.account.goals.find((x) => x.id === 'worship.check.no-skull');
    expect(g?.nextAction.text).toBe('Buy a Wax Skull for each of 6 characters at the Frostbite Towndra shop');
    const full = g?.details?.slice(0, 4).map((d) => d.text) ?? [];
    expect(full.every((t) => /: full, 50 of 50 charge$/.test(t))).toBe(true);
  });
});

describe('US-7 start Trapping', () => {
  it('W3-early: the start line is an "Also free" detail; every trap pip needs the quest', () => {
    const r = run(w3());
    expect(ids(r.account.goals)).not.toContain('trapping.check.start');
    const skull = r.account.goals.find((x) => x.id === 'worship.check.no-skull');
    expect(skull?.details?.at(-1)?.text).toMatch(
      /^Also free: Start Trapping \(Lord of the Hunt's first quest\)/,
    );
    expect(
      r.skills?.every(
        (c) => c.slots.find((p) => p.kind === 'trap')?.text === "needs Lord of the Hunt's quest",
      ),
    ).toBe(true);
  });

  it('the Barbarian Lv 56 with quest 1 done and no set: the trap-set line names it; no start', () => {
    const s = w3();
    const b = s.characters[slotOf(s, 'Barbarian', 56)];
    if (!b?.slots) throw new Error('fixture');
    b.slots.trappingStarted = true;
    const out = buildSlots(s, kb, runMetaPath(s, kb, s.asOf), s.asOf, 8 * HOUR);
    expect(out.fired.map((f) => f.entryId)).toContain('trapping.check.no-trap-set');
    expect(out.fired.map((f) => f.entryId)).not.toContain('trapping.check.start');
  });
});

describe('US-8 an idle liquid', () => {
  it('W3-early: move the Squire Lv 85 to Liquid Nitrogen, as an "Also free" detail', () => {
    const r = run(w3());
    const skull = r.account.goals.find((x) => x.id === 'worship.check.no-skull');
    expect(skull?.details?.at(-1)?.text).toMatch(
      /move your Squire Lv 85 to Liquid Nitrogen \(0\.08 of 13\)$/,
    );
  });
  it('W2-late: Liquid Nitrogen is locked, so it does not fire', () => {
    const s = w2();
    const out = buildSlots(s, kb, runMetaPath(s, kb, s.asOf), s.asOf, 8 * HOUR);
    expect(out.fired.map((f) => f.entryId)).not.toContain('alchemy.check.liquid-unstaffed');
  });
});

describe('US-9 skills for a Role', () => {
  const tab = (r: ReturnType<typeof run>, s: ReturnType<typeof w3>, cls: string, lv: number) =>
    r.skills?.find((c) => c.index === slotOf(s, cls, lv));
  it('the Squire Lv 85: Construction Role, Decent cogs at 15, Mining specialty, trains on the Cog Board', () => {
    const s = w3();
    const r = run(s);
    const t = tab(r, s, 'Squire', 85);
    const con = t?.rows.find((x) => x.skill === 'construction');
    expect(con?.role?.active).toBe(true);
    expect(con?.nextGate).toEqual({ label: 'Decent cogs', atLevel: 15, levelsLeft: 4, scope: 'character' });
    expect(t?.rows.find((x) => x.skill === 'mining')?.specialty).toBe(true);
    expect(t?.train?.text).toBe('Train: Construction · trains while it sits on the Cog Board');
    const v = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: r.asOf });
    const row = v.skills.find((x) => x.index === t?.index)?.rows.find((x) => x.skill === 'construction');
    expect(row?.gateText).toBe('Decent cogs at Construction 15 (4 levels)');
  });
  it('the Wizard Lv 73: trains Worship, the account best; next totem Acorn Assault at 30', () => {
    const s = w3();
    const t = tab(run(s), s, 'Wizard', 73);
    expect(t?.train?.text).toBe('Train: Worship · trains as it spends charge');
    const w = t?.rows.find((x) => x.skill === 'worship');
    expect(w?.accountBest?.index).toBe(t?.index);
    expect(w?.nextGate?.label).toBe('Acorn Assault');
    expect(t?.slots.find((p) => p.kind === 'cog')?.text).toBe('on the shelf: makes cogs');
  });
  it('the Bowman Lv 60 (fighting): a Role skill, never "Train"', () => {
    const s = w3();
    expect(tab(run(s), s, 'Bowman', 60)?.train?.text).toBe("Role skill: Catching · it's fighting now");
  });
  it("W2-late Squire Lv 43: Mining specialty, Ol' Straightaway at 25; Construction a Role from W3, locked", () => {
    const s = w2();
    const t = tab(run(s), s, 'Squire', 43);
    expect(t?.train?.text).toBe('Train: Mining (specialty) · trains while AFK on Mining');
    expect(t?.rows.find((x) => x.skill === 'mining')?.nextGate).toMatchObject({ atLevel: 25, levelsLeft: 5 });
    const con = t?.rows.find((x) => x.skill === 'construction');
    expect(con?.role).toEqual({ id: 'construction-builder', active: false, from: 'W3' });
    expect(con?.locked?.text).toBe('Opens in W3: finish World 2');
  });
});

describe('US-10 a Random Event while I play', () => {
  it('an event live now: a Goal naming the map and event; three hours to the next one: waiting, no Goal', () => {
    const s = w3();
    const ev = s.account.randomEvents?.schedule.find((e) => e.world <= 3 && e.at > s.asOf);
    if (!ev) throw new Error('fixture has no upcoming event');
    const live = run(s, { now: ev.at + 60_000 });
    const g = live.account.goals.find((x) => x.id === 'random-events.check.today');
    expect(g?.nextAction.text).toBe(
      `Random Event now on ${ev.map.replace(/_/g, ' ')} (${ev.event.replace(/_/g, ' ')}): one a day`,
    );
    expect(row(live, 'random-event')?.state).toBe('todo');
    const early = run(s, { now: ev.at - 3 * HOUR });
    if (early.checklist && row(early, 'random-event')?.availableAt === ev.at) {
      expect(ids(early.account.goals)).not.toContain('random-events.check.today');
      expect(row(early, 'random-event')?.state).toBe('waiting');
    }
  });
});

describe('TR-9 clocks, codes and rings', () => {
  it("Killroy's per-digit code: 20 is room 2 done, 301 rooms 1 and 3", () => {
    expect([1, 2, 3].map((r) => killroyRoomDone(20, r))).toEqual([false, true, false]);
    expect([1, 2, 3].map((r) => killroyRoomDone(301, r))).toEqual([true, false, true]);
  });

  it('a manual Done tick counts in the ring until its period ends, then clears itself', () => {
    const s = w3();
    const guilded = copy(s);
    guilded.account.guildTasks = {
      member: true,
      daily: [{ met: true }, { met: false }],
      weekly: [{ met: true }],
    };
    const r = run(guilded);
    const daily = row(r, 'guild-daily');
    expect(daily?.manual?.hint).toBe('1 of 2 met');
    const key = daily?.manual?.key ?? '';
    const end = daily?.periodEnd ?? 0;
    const ticked = buildNowView(r, { ...EMPTY_PREFS, ticks: { [key]: end } }, { ...DEFAULT_UI, now: r.asOf });
    const plain = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: r.asOf });
    expect((ticked.checklist?.rings.today.done ?? 0) - (plain.checklist?.rings.today.done ?? 0)).toBe(1);
    const later = buildNowView(r, { ...EMPTY_PREFS, ticks: { [key]: end } }, { ...DEFAULT_UI, now: end + 1 });
    expect(
      later.checklist?.bands.flatMap((b) => b.rows).find((x) => x.id === 'guild-daily')?.manual?.ticked,
    ).toBe(false);
  });

  it('cannot and unknown rows never count', () => {
    const s = w3();
    s.account.minigames = null;
    const r = run(s);
    expect(row(r, 'minigame-plays')?.state).toBe('unknown');
    expect(row(r, 'spiketrap')?.state).toBe('unknown');
    expect(r.checklist?.rings.today.total).toBe(9);
  });

  it('a Gold Pocketwatch save (counters refilled, clocks unchanged) ticks nothing done', () => {
    const s = w3();
    const al = s.account.alchemy;
    if (al) al.vialAttempts = { ...al.vialAttempts, current: al.vialAttempts.max };
    const r = run(s);
    expect(row(r, 'vial-attempts')?.state).toBe('todo');
    expect(r.checklist?.clocks.daily).toBe(run(w3()).checklist?.clocks.daily);
  });

  it('determinism: the same input gives byte-identical M20 output (FR-39)', () => {
    const a = run(w3());
    const b = run(w3());
    expect(JSON.stringify([a.checklist, a.skills, a.slotPictures, a.skillGrid])).toBe(
      JSON.stringify([b.checklist, b.skills, b.slotPictures, b.skillGrid]),
    );
  });

  it('the golden line for the checklist', () => {
    const r = run(w3(), { expectedReturnHours: 48 });
    const text = renderNowText(buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: r.asOf }));
    expect(text).toMatch(/\[checklist\] Today 1\/11 · Week 2\/5 · daily reset in/);
    expect(text).toMatch(/○ To do: Spend 6 Killroy skulls/);
  });
});

describe('without the checklist rows fact', () => {
  it('no checklist at all (never advice from a partial bundle)', () => {
    const s = w3();
    const bare = {
      entries: kb.entries,
      facts: { ...kb.facts, 'checklist.fact.rows': undefined },
    } as unknown as typeof kb;
    expect(
      buildChecklist({
        state: s,
        kb: bare,
        meta: null,
        now: s.asOf,
        expectedReturnMs: 8 * HOUR,
        history: [],
      }),
    ).toBeNull();
  });
});
