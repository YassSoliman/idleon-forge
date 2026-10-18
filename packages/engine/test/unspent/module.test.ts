// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 as an engine module (M6 FR-1, FR-2, FR-30, TR-9, TR-10, US-12): Goals with rendered Next
// Actions, ranking hints, spendCount, the Active Play entry, Stage gating, and no Verdict ever.
import { detectors } from '@idleon-forge/knowledge/detectors';
import { describe, expect, it } from 'vitest';
import { assemble, createEngine } from '../../src';
import { createUnspentModule } from '../../src/unspent';
import { W2 as afkW2, W3 as afkW3 } from '../afk/helpers';
import { input, PUBLIC_SAVES, publicState } from '../core/helpers';
import { loadKb, scrubbed, stateOf } from '../metapath/helpers';

const kb = loadKb();
const m6 = createUnspentModule({ kb, registry: detectors });
const w2 = stateOf(scrubbed('scrubbed-w2'));
const w3 = stateOf(scrubbed('scrubbed-w3'));
const at = (s: typeof w2) => s.account.lastCloudSave as number;

const accountTexts = (s: typeof w2, hours = 8) =>
  (
    m6.run(input(s, { now: at(s), options: { expectedReturnSeconds: hours * 3600 } })).account?.goals ?? []
  ).map((g) => g.goal.nextAction.text);

describe('the M6 engine module', () => {
  it('declares itself: Expected-Return-dependent, never a Verdict', () => {
    expect(m6).toMatchObject({ id: 'unspent-idle', dependsOnExpectedReturn: true, affectsVerdict: false });
  });

  it('W2-late: the Account Goals the spec lists, rendered', () => {
    const texts = accountTexts(w2);
    expect(texts).toEqual(
      expect.arrayContaining([
        'Claim your free pet pull at Doggy',
        'Collect 5 Colosseum tickets',
        'Spiketrap starts at :00: up to 40 gems today',
        'Play one round of Darts (about 2 min, from any map with the Darts item)',
        'Play one round of Hoops (about 2 min)',
        'Use your 11 vial attempts on the W2 town cauldron',
        'Spend 12 W1 merits',
        'Spend 2 task unlock points',
        'Spend 29 Darts points (next level costs 2)',
        '7 Hoops points unspent',
        'Spend banked brew in 3 cauldrons: about 10 new bubbles',
        "Open Poppy's pond to convert your fish",
        '628 gems unspent',
        // On since the in-game check (#34).
        "Claim today's free Pet Mart gems",
      ]),
    );
    // No printer line (W2-late without the hammer), no W3 Checks (Stage), and no anvil line: nothing
    // unspent, and the W3 town shop (Whetstone) isn't reached (#70 A3).
    expect(texts.some((t) => /Crystal 3D Printer|Refinery|Death Note|Salt|anvil|Whetstone/i.test(t))).toBe(
      false,
    );
  });

  it("never runs M3's Checks, even in a shared System (#70 A5)", () => {
    for (const s of [afkW2(), afkW3()]) {
      const out = m6.run(input(s, { now: at(s) }));
      const ids = [
        ...(out.account?.goals ?? []),
        ...(out.characters ?? []).flatMap((c) => c.goals ?? []),
      ].map((g) => g.goal.id);
      expect(ids).not.toContain('anvil.check.caps-before-return');
      expect(ids).not.toContain('anvil.check.fill-time');
      expect(ids).not.toContain('refinery.check.fuel-runs-out');
    }
  });

  it('W3-early: one account anvil line with per-character detail, and the Whetstone respec (#70 A2, A3)', () => {
    // With the AFK facts (the worker passes Toolbox's calls), where the anvil plan lives.
    const s = afkW3();
    const out = m6.run(input(s, { now: at(s) }));
    const goal = (id: string) => out.account?.goals?.find((g) => g.goal.id === id)?.goal;
    const spend = goal('anvil.check.spend-points');
    expect(spend?.nextAction.text).toBe('Unspent anvil points on Bowman Lv 60 → Speed');
    expect(spend?.details).toEqual([{ subject: 'c2', text: 'Bowman Lv 60: 3 into Speed, 0 into Capacity' }]);
    expect(spend?.nextAction.why).toMatch(/in 8 h from empty/);
    const respec = goal('anvil.check.respec');
    expect(respec?.nextAction.text).toBe('Whetstone respec → about 30% more anvil output at 8 h');
    // One character to respec: no "Start with the first character." (R3 QA P3).
    expect(respec?.nextAction.why).not.toMatch(/first character/);
    expect(respec?.details).toEqual([
      { subject: 'c0', text: 'Wizard Lv 73: respec to 7 Speed / 23 Capacity, about 30% more' },
    ]);
    // Never a character Goal.
    for (const c of out.characters ?? [])
      expect((c.goals ?? []).map((g) => g.goal.system)).not.toContain('anvil');
  });

  it('W2-late with the AFK facts: no anvil Goal (nothing unspent; the W3 shop is not reached)', () => {
    const s = afkW2();
    const out = m6.run(input(s, { now: at(s) }));
    const all = [...(out.account?.goals ?? []), ...(out.characters ?? []).flatMap((c) => c.goals ?? [])];
    expect(all.filter((g) => g.goal.system === 'anvil')).toEqual([]);
  });

  it('W3-early: the W3 Checks show, with the Contested gem count replaced by printer progress', () => {
    const out = m6.run(input(w3, { now: at(w3) }));
    const texts = (out.account?.goals ?? []).map((g) => g.goal.nextAction.text);
    expect(texts).toEqual(
      expect.arrayContaining([
        'Get 1 more Bullfrog Horn to run Explosive Salts',
        "Refine 10 Explosive Salts for the Death Note's first level (have 0)",
        'Hold your gems until you can buy it',
        'Spend 1 W2 merit: All Yum-Yum Desert mobs respawn faster',
        'Spend 3 W3 merits',
        'Spend 10 task unlock points',
      ]),
    );
    const printer = out.account?.goals?.find((g) => g.goal.id === 'gem-shop.check.printer-progress');
    expect(printer?.goal.milestone).toEqual({
      unit: 'gems',
      current: 365,
      next: 875,
      etaSeconds: null,
      stopHere: false,
    });
    const w3merits = out.account?.goals?.find((g) => g.goal.id === 'merit-shop.check.spend-w3');
    expect(w3merits?.goal.nextAction.contested?.sides).toHaveLength(2);
  });

  it('places character Goals and counts spendCount without nice Goals (FR-30)', () => {
    const out = m6.run(input(w3, { now: at(w3) }));
    const row = (i: number) => out.characters?.find((c) => c.index === i);
    expect(row(3)?.goals?.map((g) => g.goal.nextAction.text)).toEqual(
      expect.arrayContaining([
        'Collect 6 boss keys',
        "Finish Postboy Pablob's quest: 5 Empty Boxes from Anvil Tab 2",
      ]),
    );
    // Bubble names are game ids in capitals ("LEVEL_UP_GIFT"); the {slot:name} format sentence-cases them.
    expect(row(5)?.goals?.map((g) => g.goal.nextAction.text)).toEqual([
      'Equip Level up gift in a big-bubble slot',
      'Equip Hammer hammer in a big-bubble slot',
    ]);
    // The Bowman Lv 60's 3 anvil points are on the account line now (#70 A2).
    expect(row(2)?.goals ?? []).toEqual([]);
    expect(row(2)?.spendCount).toBe(0);
  });

  it('ranking hints: losing-now and lost-before-return at position 1, banked at 3 (TR-9)', () => {
    const goals = m6.run(input(w2, { now: at(w2) })).account?.goals ?? [];
    const hint = (id: string) => goals.find((g) => g.goal.id === id)?.rank;
    expect(hint('pets.check.free-pull')).toMatchObject({ urgency: 'losing-now', framePosition: 1 });
    expect(hint('minigames.check.spiketrap')).toMatchObject({
      urgency: 'lost-before-return',
      framePosition: 1,
    });
    expect(hint('alchemy-vials.check.daily-attempts')).toMatchObject({ urgency: 'banked', framePosition: 3 });
    expect(hint('merit-shop.check.spend-w1')).toMatchObject({ urgency: null, framePosition: 3 });
    expect(hint('pets.check.free-pull')?.cost).toEqual({ unit: 'hours', amount: 20 / 3600 });
  });

  it('daily plays: at 24 h a nice Goal at position 3 plus an Active Play entry; not at 8 h', () => {
    const out = m6.run(input(w3, { now: at(w3), options: { expectedReturnSeconds: 24 * 3600 } }));
    const plays = out.account?.goals?.find((g) => g.goal.id === 'minigames.check.daily-plays');
    expect(plays?.goal.category).toBe('nice');
    expect(plays?.rank?.framePosition).toBe(3);
    expect(out.account?.activePlay?.map((a) => a.estimateSeconds)).toEqual([600]);
    expect(accountTexts(w3)).not.toContain("Use today's 4 minigame plays");
  });

  it('never changes a Verdict: the engine result is the same with M6 on or off (US-12)', () => {
    const run = (mods: ReturnType<typeof createUnspentModule>[]) =>
      createEngine(mods).run(input(w2, { now: at(w2) }));
    const on = run([m6]);
    const off = run([]);
    expect(on.characters.map((c) => c.verdict)).toEqual(off.characters.map((c) => c.verdict));
    expect(typeof assemble).toBe('function');
  });

  it.each(PUBLIC_SAVES)('runs on the public save %s without a crash', (file) => {
    expect(() => m6.run(input(publicState(file)))).not.toThrow();
  });
});
