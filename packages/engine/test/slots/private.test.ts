// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 acceptance on the two private saves, against the spec's worked table (§11). Local only:
// fixtures/private is gitignored, so these skip in CI. By class and level, never by name (TR-8).
import { describe, expect, it } from 'vitest';
import { buildNowView, DEFAULT_UI, EMPTY_PREFS } from '../../src/now';
import { HOUR, hasPrivate, privateFile, row, run, slotOf, workerState } from './helpers';

describe.skipIf(!hasPrivate('joseph'))('the W3-early private save (§11.2)', () => {
  const s = () => structuredClone(workerState(privateFile('joseph')));
  it('today 1 of 11, week 2 of 5; daily reset in about 12.6 h, the account week in about 36.6 h', () => {
    const st = s();
    const r = run(st);
    expect(r.checklist?.rings).toEqual({ today: { done: 1, total: 11 }, week: { done: 2, total: 5 } });
    expect(((r.checklist?.clocks.daily ?? 0) - st.asOf) / HOUR).toBeCloseTo(12.55, 1);
    expect(((r.checklist?.clocks.accountWeek ?? 0) - st.asOf) / HOUR).toBeCloseTo(36.55, 1);
    expect(((r.checklist?.clocks.serverWeek ?? 0) - st.asOf) / HOUR).toBeCloseTo(112.3, 0);
    const g = row(r, 'guild-daily');
    expect(g?.manual?.hint).toBe('2 of 5 met');
    expect(row(r, 'guild-weekly')?.manual?.hint).toBe('3 of 4 met');
  });

  it('the Shaman 54 to the Cog Shelf, then the Wizard 73 on the free square; Wax Skulls for all 6', () => {
    const r = run(s());
    const seat = r.account.goals.find((x) => x.id === 'construction.check.cog-seat-free');
    expect(seat?.nextAction.text).toBe('Put your Shaman Lv 54 on the Cog Shelf');
    expect(seat?.details?.map((d) => d.text)).toEqual([
      'Seat your Wizard Lv 73 on the free Cog Board square',
    ]);
    const skull = r.account.goals.find((x) => x.id === 'worship.check.no-skull');
    expect(skull?.nextAction.text).toBe('Buy a Wax Skull for each of 6 characters');
    expect(skull?.nextAction.why).toMatch(/Frostbite Towndra shop/);
    expect(skull?.details?.at(-1)?.text).toBe(
      "Also free: Start Trapping (Lord of the Hunt's first quest); move your Squire Lv 85 to Liquid Nitrogen (0.08 of 13)",
    );
  });

  it('Skills headers and pips as the worked table says', () => {
    const st = s();
    const r = run(st);
    const tab = (cls: string, lv: number) => r.skills?.find((c) => c.index === slotOf(st, cls, lv));
    expect(tab('Wizard', 73)?.train?.text).toBe('Train: Worship · trains as it spends charge');
    expect(tab('Squire', 85)?.train?.text).toBe(
      'Train: Construction · trains while it sits on the Cog Board',
    );
    expect(tab('Squire', 51)?.train?.text).toBe(
      'Train: Construction · trains while it sits on the Cog Board',
    );
    expect(tab('Bowman', 60)?.train?.text).toBe("Role skill: Catching · it's fighting now");
    expect(tab('Barbarian', 56)?.train?.text).toBe('Train: Fishing · trains while AFK on Fishing');
    expect(tab('Shaman', 54)?.train?.text).toBe('Train: Alchemy · trains while it brews (High-IQ)');
    const worship = (r.skills ?? []).map((c) => c.slots.find((p) => p.kind === 'worship')?.state);
    expect(worship.filter((x) => x === 'capped')).toHaveLength(4);
    const v = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: r.asOf });
    const bow = v.skills.find((x) => x.index === slotOf(st, 'Bowman', 60));
    expect(bow?.rows.find((x) => x.skill === 'smithing')?.gateText).toBe(
      'Anvil Tab 4 at Smithing 50 (11 levels)',
    );
  });
});

describe.skipIf(!hasPrivate('yasser'))('the W2-late private save (§11.1)', () => {
  const s = () => structuredClone(workerState(privateFile('yasser')));
  it("today 0 of 10, week 0 of 3; Killroy's Warrior room on the Squire Lv 43", () => {
    const r = run(s());
    expect(r.checklist?.rings).toEqual({ today: { done: 0, total: 10 }, week: { done: 0, total: 3 } });
    expect(r.account.activePlay.map((a) => a.text)).toContain(
      "Run Killroy's Warrior room on your Squire Lv 43 (YumYum Grotto)",
    );
    expect(r.account.goals.some((g) => g.id === 'construction.check.cog-seat-free')).toBe(false);
  });
  it('Skills headers: the Squire 43 trains its Mining specialty; the Barbarian 60 is fighting', () => {
    const st = s();
    const r = run(st);
    const tab = (cls: string, lv: number) => r.skills?.find((c) => c.index === slotOf(st, cls, lv));
    expect(tab('Squire', 43)?.train?.text).toBe('Train: Mining (specialty) · trains while AFK on Mining');
    expect(tab('Barbarian', 60)?.train?.text).toBe("Role skill: Fishing · it's fighting now");
    expect(tab('Shaman', 44)?.train?.text).toBe('Train: Alchemy · trains while it brews (High-IQ)');
    expect(tab('Wizard', 56)?.train?.text).toBe("Role skill: Choppin · it's fighting now");
  });
});
