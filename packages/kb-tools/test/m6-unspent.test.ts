// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 Unspent & idle (docs/specs/M6-unspent-idle.md §4, TR-13): the user stories as Detector runs on the
// scrubbed fixtures with `now` = the fixture's last cloud save and Expected Return 8 h unless a story
// says otherwise, the reset-crossing test, Toolbox oracle checks, and the authored constants checked
// against the generated fact tables. Private fixtures are never read here.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import {
  type AnyDetector,
  type CheckFinding,
  makeContext,
  runDetector,
  withAccount,
  withCharacter,
} from '@idleon-forge/knowledge';
import { detectors } from '@idleon-forge/knowledge/detectors';
import { ROW_INDEX } from '@idleon-forge/knowledge/detectors/merit-shop/unspent';
import { describe, expect, it } from 'vitest';
import { fixtureById, stateOf } from '../src/fixtures';
import { parseExport } from '../src/parse';
import { GENERATED_DIR } from '../src/paths';

const HOUR = 3_600_000;
type Finding = CheckFinding & Record<string, unknown>;
const w2 = stateOf(fixtureById('scrubbed-w2') ?? fail('scrubbed-w2'));
const w3 = stateOf(fixtureById('scrubbed-w3') ?? fail('scrubbed-w3'));
function fail(id: string): never {
  throw new Error(`fixture ${id} missing`);
}
const savedAt = (s: AccountState) => s.account.lastCloudSave ?? fail('lastCloudSave');

interface RunOpts {
  now?: number;
  er?: number;
  params?: Record<string, unknown>;
  history?: { lastCloudSave: number; receivedAt: number; state: AccountState }[];
}
/** Runs one Detector at `now` (default: the save) and Expected Return `er` hours (default 8). */
function run(id: string, state: AccountState, o: RunOpts = {}) {
  const d = detectors[id] as AnyDetector;
  const ctx = makeContext(state, null, {
    now: o.now ?? savedAt(state),
    expectedReturnMs: (o.er ?? 8) * HOUR,
    history: o.history ?? [],
  });
  const r = runDetector(d, ctx, o.params ?? {});
  if (!r.ok) throw new Error(r.error);
  return r.findings as readonly Finding[];
}
const fired = (fs: readonly Finding[]) => fs.filter((f) => f.result === 'fires');
const one = (fs: readonly Finding[]) => {
  const f = fired(fs);
  expect(f).toHaveLength(1);
  return f[0] as Finding;
};
const label = (s: AccountState, i: number) => {
  const c = s.characters.find((x) => x.index === i);
  return c ? `${c.class} ${c.level}` : '?';
};

describe('US-1 banked keys and tickets', () => {
  it('W3-early: one key Goal on the Squire Lv 85, banked, 6 keys (4 Forest Villa, 2 Efaunt)', () => {
    const f = one(run('boss-keys/banked', w3));
    expect(f.subject.kind === 'character' && label(w3, f.subject.index)).toBe('Squire 85');
    expect(f).toMatchObject({ urgency: 'banked', slots: { total: 6, forestVilla: 4, efaunt: 2 } });
  });
  it('W3-early: 4 Colosseum tickets, one NPC capped for 2 days', () => {
    expect(one(run('colosseum/tickets-banked', w3))).toMatchObject({
      urgency: 'losing-now',
      slots: { total: 4, daysLost: 2, cappedNpcs: 1 },
    });
  });
  it('W2-late: no key Goal; 5 tickets (Typhoon 3, Centurion 2), Lonely Hunter not counted', () => {
    expect(fired(run('boss-keys/banked', w2))).toEqual([]);
    expect(one(run('colosseum/tickets-banked', w2))).toMatchObject({
      slots: { total: 5, daysLost: 1, cappedNpcs: 1 },
    });
  });
  it('W2-late at Expected Return 72 h: 4 Forest Villa keys lost before return, on the Barbarian Lv 60; not at 48 h', () => {
    const f = one(run('boss-keys/banked', w2, { er: 72 }));
    expect(f.subject.kind === 'character' && label(w2, f.subject.index)).toBe('Barbarian 60');
    expect(f).toMatchObject({ urgency: 'lost-before-return', slots: { total: 4, forestVilla: 4 } });
    expect(typeof f.deadline).toBe('number');
    expect(fired(run('boss-keys/banked', w2, { er: 48 }))).toEqual([]);
  });
});

describe('US-2 free dailies', () => {
  it('W2-late: the free pet pull is claimable since about 15 h, losing-now', () => {
    expect(one(run('pets/free-pull', w2))).toMatchObject({
      urgency: 'losing-now',
      slots: { hoursClaimable: 15 },
    });
  });
  it('W3-early: no pull yet; its nextChangeAt is about 11 h 13 m after the save; it appears at save + 12 h', () => {
    const [f] = run('pets/free-pull', w3);
    expect(f?.result).toBe('pass');
    const minutes = Math.round(((f?.nextChangeAt as number) - savedAt(w3)) / 60_000);
    expect(minutes).toBe(11 * 60 + 13);
    expect(fired(run('pets/free-pull', w3, { now: savedAt(w3) + 12 * HOUR }))).toHaveLength(1);
  });
  it('Pet Mart gems: on since the in-game check (#34); W2-late claimable (shop day 241); a closed gate is silent', () => {
    expect(w2.account.petMart?.unlocked).toBe(true);
    expect(one(run('pets/mart-gems', w2))).toMatchObject({ slots: { shopDay: 241 } });
    const closed = withAccount(w2, {
      petMart: { ...(w2.account.petMart ?? fail('petMart')), unlocked: false },
    });
    expect(fired(run('pets/mart-gems', closed))).toEqual([]);
  });
  it('W2-late: 11 vial attempts, banked at 8 h (reset ~23 h 43 m away), lost-before-return at 24 h', () => {
    expect(one(run('alchemy-vials/attempts', w2))).toMatchObject({
      urgency: 'banked',
      slots: { attempts: 11 },
    });
    expect(one(run('alchemy-vials/attempts', w2, { er: 24 }))).toMatchObject({
      urgency: 'lost-before-return',
    });
  });
  it('W3-early: no vial Goal (0 of 17 left)', () => {
    expect(fired(run('alchemy-vials/attempts', w3))).toEqual([]);
  });
  it('W3-early at 24 h: 4 minigame plays with an open Milestone; not at 8 h', () => {
    expect(one(run('minigames/daily-plays', w3, { er: 24 }))).toMatchObject({ slots: { plays: 4 } });
    expect(fired(run('minigames/daily-plays', w3))).toEqual([]);
  });
  it('Spiketrap: W2-late 13 min to the hour shows; 20 min later it is gone; W3-early shows at its save', () => {
    expect(one(run('minigames/spiketrap', w2))).toMatchObject({ slots: { minutes: 13 } });
    expect(fired(run('minigames/spiketrap', w2, { now: savedAt(w2) + 20 * 60_000 }))).toEqual([]);
    expect(one(run('minigames/spiketrap', w3))).toMatchObject({ slots: { minutes: 15 } });
  });
});

describe('US-3 Darts and Hoops', () => {
  it('W2-late: spend 29 Darts points (next DMG level costs 2); 7 Hoops points unspent, no cost', () => {
    expect(one(run('minigames/cooldown-spend', w2, { params: { game: 'darts' } }))).toMatchObject({
      slots: { points: 29, cost: 2 },
    });
    const hoops = one(run('minigames/cooldown-spend', w2, { params: { game: 'hoops' } }));
    expect(hoops.slots).toEqual({ points: 7 });
  });
  it('W3-early: no Darts spend (2 against 5), no Hoops line, both play prompts', () => {
    expect(fired(run('minigames/cooldown-spend', w3, { params: { game: 'darts' } }))).toEqual([]);
    expect(fired(run('minigames/cooldown-spend', w3, { params: { game: 'hoops' } }))).toEqual([]);
    expect(fired(run('minigames/cooldown-play', w3, { params: { game: 'darts' } }))).toHaveLength(1);
    expect(fired(run('minigames/cooldown-play', w3, { params: { game: 'hoops' } }))).toHaveLength(1);
  });
  it('once a play is seen in this Play Session, the prompt does not return (D3)', () => {
    const mg = w3.account.minigames ?? fail('minigames');
    const later = withAccount(w3, { minigames: { ...mg, darts: { ...mg.darts, playsToday: 1 } } });
    const history = [{ lastCloudSave: savedAt(w3) - 5 * 60_000, receivedAt: 0, state: w3 }];
    expect(
      fired(
        run('minigames/cooldown-play', later, {
          params: { game: 'darts' },
          history,
          now: savedAt(w3) + 60 * 60_000,
        }),
      ),
    ).toEqual([]);
  });
});

describe('US-4 banked brew', () => {
  it('W2-late: Quicc, High-IQ and Kazam, about 10 bubbles; Kazam next is Level Up Gift for 4 fighters', () => {
    expect(fired(run('alchemy-bubbles/brew', w2))).toEqual([]);
    expect(one(run('alchemy-bubbles/brew', w2, { params: { variant: 'big' } }))).toMatchObject({
      slots: { bubbles: 10, cauldrons: 3, bigBubble: 'LEVEL_UP_GIFT', bigFits: 4 },
    });
  });
  it('W3-early: all 4 cauldrons, about 7', () => {
    expect(one(run('alchemy-bubbles/brew', w3))).toMatchObject({ slots: { bubbles: 7, cauldrons: 4 } });
  });
});

describe('US-5 big-bubble slots', () => {
  const fill = (s: AccountState) =>
    fired(run('alchemy-bubbles/big-bubbles', s, { params: { mode: 'fill' } }));
  const swap = (s: AccountState) =>
    fired(run('alchemy-bubbles/big-bubbles', s, { params: { mode: 'swap' } }));
  const on = (fs: ReturnType<typeof fill>, s: AccountState) =>
    fs.map(
      (f) => `${f.subject.kind === 'character' ? label(s, f.subject.index) : 'account'}: ${f.slots.bubble}`,
    );
  it('W2-late: only the Squire Lv 43 (Mining) gets Wyoming Blood', () => {
    expect(on(fill(w2), w2)).toEqual(['Squire 43: WYOMING_BLOOD']);
  });
  it('W3-early: the Shaman Lv 54 gets Level Up Gift and Hammer Hammer; the Wizard swaps Molto Loggo', () => {
    expect(on(fill(w3), w3)).toEqual(['Shaman 54: LEVEL_UP_GIFT', 'Shaman 54: HAMMER_HAMMER']);
    expect(
      swap(w3).map((f) => [label(w3, f.subject.kind === 'character' ? f.subject.index : -1), f.slots]),
    ).toEqual([['Wizard 73', { from: 'MOLTO_LOGGO', bubble: 'HAMMER_HAMMER' }]]);
  });
  it('Sheepie owned: no bubble Goal; companion data unknown: unknown', () => {
    const pets = w3.account.pets ?? fail('pets');
    expect(fill(withAccount(w3, { pets: { ...pets, sheepie: true } }))).toEqual([]);
    const r = run('alchemy-bubbles/big-bubbles', withAccount(w3, { pets: null }), {
      params: { mode: 'fill' },
    });
    expect(r.map((f) => f.result)).toEqual(['unknown']);
  });
});

describe('US-6 merits and unlock points', () => {
  const order = [
    { row: 'w2-task-sb3', upTo: 1 },
    { row: 'w2-task-sa3', upTo: 'characters' },
    { row: 'w2-task-sb2' },
  ];
  it('W2-late: 12 W1 merits, 2 task unlock points', () => {
    expect(one(run('merit-shop/unspent', w2, { params: { world: 1 } }))).toMatchObject({
      slots: { unspent: 12 },
    });
    expect(one(run('task-unlocks/unspent', w2))).toMatchObject({ slots: { points: 2 } });
  });
  it('W3-early: 1 W2 merit names Yum-Yum Desert respawn; 10 unlock points; 3 W3 merits', () => {
    const p = { world: 2, order };
    expect(fired(run('merit-shop/unspent', w3, { params: { ...p, row: 'w2-task-sb2' } }))).toHaveLength(1);
    expect(fired(run('merit-shop/unspent', w3, { params: { ...p, row: 'w2-task-sb3' } }))).toEqual([]);
    expect(fired(run('merit-shop/unspent', w3, { params: p }))).toEqual([]);
    expect(one(run('task-unlocks/unspent', w3))).toMatchObject({ slots: { points: 10 } });
    expect(one(run('merit-shop/unspent', w3, { params: { world: 3 } }))).toMatchObject({
      slots: { unspent: 3 },
    });
  });
});

describe('US-7 unspent gems (D2, RT2)', () => {
  const form = (s: AccountState) =>
    (['contested', 'printer-progress', 'printer-buy'] as const).filter(
      (f) => fired(run('gem-shop/unspent', s, { params: { form: f } })).length > 0,
    );
  it('W2-late, no Infinity Hammer: the Contested count only', () => {
    expect(form(w2)).toEqual(['contested']);
  });
  it('W3-early: printer progress, 365 of 875', () => {
    expect(form(w3)).toEqual(['printer-progress']);
    expect(one(run('gem-shop/unspent', w3, { params: { form: 'printer-progress' } }))).toMatchObject({
      slots: { gems: 365, price: 875 },
    });
  });
  it('W2-late with the Infinity Hammer: printer progress; W3 with 900 gems: buy', () => {
    const hammer = withAccount(w2, {
      gemPurchases: (w2.account.gemPurchases ?? []).map((n, i) => (i === 103 ? 1 : n)),
    });
    expect(form(hammer)).toEqual(['printer-progress']);
    expect(form(withAccount(w3, { gems: 900 }))).toEqual(['printer-buy']);
  });
  it('a W2-mid account with 400 gems and nothing bought: the Contested count', () => {
    expect(form(withAccount(w2, { gems: 400 }))).toEqual(['contested']);
  });
});

describe('US-9 and US-10 Post Office and anvil points', () => {
  const po = (s: AccountState, part: string) => fired(run('post-office/state', s, { params: { part } }));
  it('W2-late: the Barbarian Lv 60 (quest in progress) unlocks the Post Office', () => {
    expect(po(w2, 'unlock').map((f) => f.subject.kind === 'character' && label(w2, f.subject.index))).toEqual(
      ['Barbarian 60'],
    );
  });
  it('W3-early: the Squire Lv 85, with 4 boxes waiting; no box Goal while locked', () => {
    const [f] = po(w3, 'unlock');
    expect(f && f.subject.kind === 'character' && label(w3, f.subject.index)).toBe('Squire 85');
    expect(f?.slots).toEqual({ boxes: 4 });
    expect(po(w3, 'boxes')).toEqual([]);
  });
  it('unlocked with 4 boxes: every character shows the box Goal', () => {
    const open = withAccount(w3, {
      postOffice: { ...(w3.account.postOffice ?? fail('po')), unlocked: true },
    });
    expect(po(open, 'boxes')).toHaveLength(6);
    expect(po(open, 'unlock')).toEqual([]);
  });
  it('W3-early: only the Bowman Lv 60 has 3 anvil points; W2-late none', () => {
    expect(
      fired(run('anvil/points', w3)).map((f) => f.subject.kind === 'character' && label(w3, f.subject.index)),
    ).toEqual(['Bowman 60']);
    expect(fired(run('anvil/points', w2))).toEqual([]);
  });
  it('FR-23: Capacity instead once M3 reports a product capping before the return (8.5 h after the save)', () => {
    const later = savedAt(w3) + 8.5 * HOUR;
    expect(fired(run('anvil/points', w3, { now: later }))).toEqual([]);
    expect(one(run('anvil/points', w3, { now: later, params: { form: 'capacity' } }))).toMatchObject({
      slots: { points: 3, product: 'Leather_Hide' },
    });
  });
});

describe('US-11 Poppy', () => {
  it('fires on both accounts; not after a later save in the session shows the fish dropped', () => {
    expect(fired(run('poppy/pending-fish', w2))).toHaveLength(1);
    expect(fired(run('poppy/pending-fish', w3))).toHaveLength(1);
    const p = w2.account.poppy ?? fail('poppy');
    const after = withAccount(w2, { poppy: { ...p, pendingFish: 5 } });
    const history = [{ lastCloudSave: savedAt(w2) - 5 * 60_000, receivedAt: 0, state: w2 }];
    expect(fired(run('poppy/pending-fish', after, { history }))).toEqual([]);
  });
});

describe('US-13 unknown, not wrong', () => {
  it('without companion data: no pet pull and no bubble Goal, both unknown', () => {
    const s = withAccount(w2, { pets: null });
    expect(run('pets/free-pull', s).map((f) => f.result)).toEqual(['unknown']);
    expect(run('alchemy-bubbles/big-bubbles', s, { params: { mode: 'fill' } }).map((f) => f.result)).toEqual([
      'unknown',
    ]);
  });
  it('the alchemy section failed: brew, vials and bubbles are unknown', () => {
    const s = { ...w3, diagnostics: { ...w3.diagnostics, failedSections: ['alchemy'] } };
    for (const [id, params] of [
      ['alchemy-bubbles/brew', {}],
      ['alchemy-vials/attempts', {}],
      ['alchemy-bubbles/big-bubbles', { mode: 'fill' }],
    ] as const)
      expect(run(id, s, { params }).map((f) => f.result)).toEqual(['unknown']);
  });
});

describe('US-14 the W3 engine (D6)', () => {
  it('W3-early: get 1 more Bullfrog Horn to run Explosive Salt; with 10 held, switch it on', () => {
    expect(one(run('refinery/salt-off', w3, { params: { form: 'fuel' } }))).toMatchObject({
      urgency: 'losing-now',
      slots: { salt: 'Explosive_Salts', material: 'Bullfrog_Horn', more: 1 },
    });
    const fuelled = withAccount(w3, {
      salts: (w3.account.salts ?? []).map((s) => ({ ...s, missingFuel: [] })),
    });
    expect(fired(run('refinery/salt-off', fuelled, { params: { form: 'fuel' } }))).toEqual([]);
    expect(one(run('refinery/salt-off', fuelled, { params: { form: 'switch-on' } }))).toMatchObject({
      slots: { salt: 'Explosive_Salts' },
    });
  });
  it('W3-early: refine 10 Explosive Salts for the Death Note (have 0); with 10 held, nothing', () => {
    expect(one(run('death-note/build', w3, { params: { form: 'salts' } }))).toMatchObject({
      urgency: 'losing-now',
      slots: { cost: 10, held: 0 },
    });
    const dn = w3.account.deathNoteBuilding ?? fail('dn');
    const held = withAccount(w3, { deathNoteBuilding: { ...dn, held: 10 } });
    expect(fired(run('death-note/build', held, { params: { form: 'salts' } }))).toEqual([]);
  });
  it('W2-late: neither Goal, although Redox is unlocked and off', () => {
    for (const form of ['fuel', 'switch-on'])
      expect(fired(run('refinery/salt-off', w2, { params: { form } }))).toEqual([]);
    for (const form of ['salts', 'slot'])
      expect(fired(run('death-note/build', w2, { params: { form } }))).toEqual([]);
  });
});

describe('TR-13 reset crossing', () => {
  it('W2-late at save + 24 h: vial attempts refilled; Typhoon reads 5 (two days lost)', () => {
    const now = savedAt(w2) + 24 * HOUR;
    expect(one(run('alchemy-vials/attempts', w2, { now }))).toMatchObject({ slots: { attempts: 11 } });
    expect(one(run('colosseum/tickets-banked', w2, { now }))).toMatchObject({ slots: { daysLost: 2 } });
  });
});

describe('TR-13 Toolbox oracles (on the parsed scrubbed saves)', () => {
  const parsed = (id: string) => {
    const f = fixtureById(id) ?? fail(id);
    return parseExport(JSON.parse(readFileSync(f.file, 'utf8')), f.now) as unknown as {
      account: Record<string, unknown> & {
        currencies: {
          KeysAll: { daysSincePickup?: number; totalAmount: number }[];
          ColosseumTickets: { allTickets: { daysSincePickup: number }[] };
        };
        finishedWorlds: Record<string, boolean>;
      };
    };
  };
  it.each(['scrubbed-w2', 'scrubbed-w3'])(
    '%s: our keys and tickets fire wherever areKeysOverdue does',
    (id) => {
      const p = parsed(id);
      const toolboxKeys = p.account.currencies.KeysAll.filter(
        (k) => (k.daysSincePickup ?? 0) >= 3 && k.totalAmount > 0,
      );
      const toolboxTickets = p.account.currencies.ColosseumTickets.allTickets.filter(
        (t, i) => (i === 0 || p.account.finishedWorlds[`World${i}`]) && t.daysSincePickup >= 3,
      );
      const s = id === 'scrubbed-w2' ? w2 : w3;
      if (toolboxKeys.length) expect(fired(run('boss-keys/banked', s)).length).toBeGreaterThan(0);
      if (toolboxTickets.length) expect(fired(run('colosseum/tickets-banked', s))).toHaveLength(1);
    },
  );
});

describe('authored constants match the generated facts at the pin', () => {
  const facts = (file: string) =>
    (
      JSON.parse(readFileSync(path.join(GENERATED_DIR, file), 'utf8')) as {
        facts: { id: string; rows: unknown }[];
      }
    ).facts;
  it('merit row ids map to their row index (merit-shop.fact.rows slot)', () => {
    const rows = facts('merit-shop.facts.json').find((f) => f.id === 'merit-shop.fact.rows')?.rows as {
      id: string;
      slot: number;
    }[];
    for (const [id, index] of Object.entries(ROW_INDEX))
      expect(rows.find((r) => r.id === id)?.slot, id).toBe(index);
  });
  it('the gem-shop Detector defaults match gem-shop.fact.items', () => {
    const items = facts('gem-shop.facts.json').find((f) => f.id === 'gem-shop.fact.items')?.rows as {
      rawName: string;
      index: number;
      price: number;
    }[];
    const params = (detectors['gem-shop/unspent'] as AnyDetector).params.parse({
      form: 'contested',
    }) as Record<string, number>;
    expect(items.find((i) => i.rawName === 'GemP1')?.index).toBe(params.hammerIndex);
    const printer = items.find((i) => i.rawName === 'GemQ1');
    expect([printer?.index, printer?.price]).toEqual([params.printerIndex, params.printerPrice]);
  });
  it('every pairing-table bubble is in alchemy-bubbles.fact.bubbles', () => {
    const bubbles = facts('alchemy-bubbles.facts.json')[0]?.rows as { rawName: string }[];
    const params = (detectors['alchemy-bubbles/big-bubbles'] as AnyDetector).params.parse({
      mode: 'fill',
    }) as {
      pairing: Record<string, string[]>;
    };
    for (const raw of Object.values(params.pairing).flat())
      expect(
        bubbles.some((b) => b.rawName === raw),
        raw,
      ).toBe(true);
  });
});

describe('US-12 M6 never touches a Verdict', () => {
  it('every M6 entry is a next-action Check (never a blocker)', async () => {
    const { loadSource } = await import('../src/load');
    const m6 = loadSource().authored.filter(
      (e) =>
        [
          'boss-keys',
          'colosseum',
          'alchemy-bubbles',
          'alchemy-vials',
          'merit-shop',
          'task-unlocks',
          'gem-shop',
          'pets',
          'minigames',
          'post-office',
          'anvil',
          'poppy',
          'refinery',
          'death-note',
        ].includes(e.value.system) &&
        // M3 shares the anvil and refinery Systems; only M6's own Detectors count here.
        e.value.type === 'check' &&
        Object.hasOwn(detectors, e.value.detector.id) &&
        !['anvil/caps-before-return', 'refinery/fuel-runs-out'].includes(e.value.detector.id),
    );
    expect(m6.length).toBeGreaterThan(20);
    for (const e of m6) expect(e.value.type === 'check' && e.value.effect, e.value.id).toBe('next-action');
  });
  it('a character mutation that changes nothing M6 reads leaves its findings alone', () => {
    const base = run('anvil/points', w3);
    expect(run('anvil/points', withCharacter(w3, 0, { afkTarget: 'x' }))).toEqual(base);
  });
});
