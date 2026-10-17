// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 AFK Safety's user stories (section 4) as tests, on the scrubbed W2-late and W3-early saves at
// their own cloud-save time, with no history and an 8 h Expected Return unless a story says otherwise.
// Characters are named by class and level only.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import type { HistoryEntry } from '@idleon-forge/knowledge';
import { withCharacter, withUnknown } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { composeVerdict, HOUR_MS, toModuleOutput } from '../../src/afk';
import { blockers, charOf, evaluate, kb, nextActions, patchAfk, W2, W3 } from './helpers';

// W2-late save order: Barbarian Lv 60, Squire Lv 43, Shaman Lv 44, Bowman Lv 54, Wizard Lv 56.
// W3-early save order: Wizard Lv 73, Squire Lv 51, Bowman Lv 60, Squire Lv 85, Barbarian Lv 56, Shaman Lv 54.

describe('US-1 a fighter that would die', () => {
  it('blocks the W2-late Barbarian Lv 60 on owned food that fixes it, with its Source', () => {
    const r = evaluate(W2());
    const c = charOf(r, 0);
    expect(c.safety).toBe('unsafe');
    const f = c.findings.find((x) => x.entryId === 'afk.check.dies-fixable-by-food');
    expect(f?.role).toBe('blocker');
    expect(f?.nextAction.text).toMatch(
      /^Equip or swap in .+ before you leave: Barbarian is at 78% survivability/,
    );
    expect(f?.nextAction.sources[0]?.tier).toBe(1);
    expect(f?.nextAction.sources[0]?.url).toContain('parsers/damage.ts');
  });

  it('shows no food blocker on the W2-late Shaman, Bowman or Wizard', () => {
    const r = evaluate(W2());
    for (const i of [2, 3, 4])
      expect(blockers(charOf(r, i).findings).filter((x) => x.startsWith('afk.'))).toEqual([]);
  });

  it('shows no food blocker on the W3-early account, and no low-food line (stacks above lowStack)', () => {
    const r = evaluate(W3());
    for (const c of r.characters) {
      expect(c.findings.map((f) => f.entryId).filter((x) => x.includes('food'))).toEqual([]);
    }
  });

  it('gives the W3-early Squire Lv 85 a low-food Next Action on a small stack, without changing its Verdict', () => {
    const s = W3();
    const afk = s.characters[3]?.afk;
    const food = (afk?.food ?? []).map((f) => (f.kind === 'health' ? { ...f, amount: 7 } : f));
    const r = evaluate(patchAfk(s, 3, { food }));
    const c = charOf(r, 3);
    const f = c.findings.find((x) => x.entryId === 'afk.check.low-food-untimed');
    expect(f?.role).toBe('next-action');
    expect(f?.nextAction.text).toBe("Low food: 7 left; can't time it yet");
    expect(c.safety).toBe('safe');
  });
});

/** Two earlier AFK Stretches of `index`, 2 h each, eating `perHour` health food (US-2). */
function foodHistory(s: AccountState, index: number, perHour: number): HistoryEntry[] {
  const now = s.characters.find((c) => c.index === index)?.afk?.afkSince ?? s.asOf;
  const health = (c: CharacterState | undefined) =>
    (c?.afk?.food ?? []).filter((f) => f.kind === 'health').reduce((n, f) => n + f.amount, 0);
  const left = health(s.characters.find((c) => c.index === index));
  const at = (k: number): HistoryEntry => {
    const afkSince = now - k * 2 * HOUR_MS;
    const c = s.characters.find((x) => x.index === index);
    const food = (c?.afk?.food ?? []).map((f) =>
      f.kind === 'health' ? { ...f, amount: left + perHour * 2 * k } : f,
    );
    const state = patchAfk(s, index, { afkSince, food });
    return {
      lastCloudSave: afkSince,
      receivedAt: afkSince,
      state: { ...state, account: { ...state.account, lastCloudSave: afkSince } },
    };
  };
  return [at(2), at(1)];
}

describe('US-2 food that runs out overnight', () => {
  const withSpare = (s: AccountState) => {
    const f = s.characters[3]?.afk?.fighting;
    return f ? patchAfk(s, 3, { fighting: { ...f, spareHealthFood: 500 } }) : s;
  };

  it('blocks the W3-early Squire Lv 85 at 8 h: 146 food at 20 an hour runs out in about 7.3 h', () => {
    const s = withSpare(W3());
    const r = evaluate(s, 8, { history: foodHistory(s, 3, 20) });
    const f = charOf(r, 3).findings.find((x) => x.entryId === 'afk.check.health-food-runs-out');
    expect(f?.role).toBe('blocker');
    expect(f?.fixHolds).toBe(true);
    expect(((f?.at ?? 0) - (s.characters[3]?.afk?.afkSince ?? 0)) / HOUR_MS).toBeCloseTo(7.3, 1);
    expect(f?.nextAction.text).toMatch(
      /^Add more health food from storage: it runs out in about 7 h \(146 left\)/,
    );
  });

  it('shows no food blocker at 4 h; the run-out is after the return', () => {
    const s = withSpare(W3());
    const r = evaluate(s, 4, { history: foodHistory(s, 3, 20) });
    const c = charOf(r, 3);
    expect(c.findings.map((f) => f.entryId)).not.toContain('afk.check.health-food-runs-out');
    // The Squire's first fill is its anvil (about 5.1 h), which comes before the food run-out (7.3 h).
    expect(c.firstFill?.label).toBe("Squire Lv 85's anvil");
  });

  it('demotes the block to a Next Action when storage cannot cover the stretch', () => {
    const s0 = W3();
    const f = s0.characters[3]?.afk?.fighting;
    const s = f ? patchAfk(s0, 3, { fighting: { ...f, spareHealthFood: 5 } }) : s0;
    const r = evaluate(s, 8, { history: foodHistory(s, 3, 20) });
    const x = charOf(r, 3).findings.find((y) => y.entryId === 'afk.check.health-food-runs-out');
    expect(x?.role).toBe('next-action');
    expect(x?.demotedBecause).toBe('fix-does-not-hold');
  });
});

describe('US-4 anvil that caps, and anvil that cannot be helped', () => {
  it('W2-late at 8 h: the Barbarian Lv 60 is full now and blocks; the other four are one Next Action each', () => {
    const r = evaluate(W2());
    const barb = charOf(r, 0).findings.find((f) => f.entryId === 'anvil.check.caps-before-return');
    expect(barb?.role).toBe('blocker');
    expect(barb?.nextAction.text).toMatch(
      /^Collect Thread from the anvil \(time to cap: now; it refills about 3 h after you collect\)/,
    );
    for (const i of [1, 2, 3, 4]) {
      const f = charOf(r, i).findings.find((x) => x.entryId === 'anvil.check.caps-before-return');
      expect(f?.role).toBe('next-action');
      expect(f?.demotedBecause).toBe('fix-does-not-hold');
    }
  });

  it('W2-late at 2 h: the Barbarian still blocks; the Shaman and Squire stay Next Actions; the Bowman edge is pinned', () => {
    const r = evaluate(W2(), 2);
    expect(blockers(charOf(r, 0).findings)).toContain('anvil.check.caps-before-return');
    for (const i of [1, 2])
      expect(nextActions(charOf(r, i).findings)).toContain('anvil.check.caps-before-return');
    const bowman = W2().characters[3]?.afk?.anvil?.[0];
    const f = charOf(r, 3).findings.find((x) => x.entryId === 'anvil.check.caps-before-return');
    expect(f?.role).toBe((bowman?.fromEmptyMs ?? 0) >= 2 * HOUR_MS ? 'blocker' : 'next-action');
    expect(bowman?.fromEmptyMs).toBe(7355512);
  });

  it("W3-early at 8 h: no anvil blocker, and the first fill is the Bowman Lv 60's anvil at about 8.2 h", () => {
    const r = evaluate(W3());
    for (const c of r.characters)
      expect(blockers(c.findings)).not.toContain('anvil.check.caps-before-return');
    expect(r.firstFill?.label).toBe("Bowman Lv 60's anvil");
    expect(((r.firstFill?.at ?? 0) - W3().asOf) / HOUR_MS).toBeCloseTo(8.15, 1);
  });
});

describe('US-5 worship charge that is already full', () => {
  it('W3-early: four skull-less 50/50 bars are Next Actions, never blockers', () => {
    const r = evaluate(W3());
    for (const i of [1, 2, 3, 4])
      expect(nextActions(charOf(r, i).findings)).toContain('worship.check.charge-caps-no-skull');
    for (const i of [0, 5])
      expect(charOf(r, i).findings.map((f) => f.entryId)).not.toContain('worship.check.charge-caps-no-skull');
    for (const c of r.characters)
      expect(blockers(c.findings).filter((x) => x.startsWith('worship'))).toEqual([]);
  });

  const skull = (charge: number) => {
    const s = W3();
    const w = s.characters[0]?.afk?.worship;
    return w ? patchAfk(s, 0, { worship: { ...w, max: 120, charge, hasSkull: true } }) : s;
  };

  it('a skull at 26.1/120 and a 24 h return: no blocker, and the first fill is the worship charge at about 73 h', () => {
    const r = evaluate(skull(26.05), 24);
    expect(blockers(charOf(r, 0).findings)).toEqual([]);
    expect(charOf(r, 0).firstFill?.label).toBe("Wizard Lv 73's worship charge");
    expect(((charOf(r, 0).firstFill?.at ?? 0) - W3().asOf) / HOUR_MS).toBeCloseTo(73.4, 0);
  });

  it('a skull at 110/120 and an 8 h return: the blocker, and the fix holds (about 94 h of room)', () => {
    const r = evaluate(skull(110));
    const f = charOf(r, 0).findings.find((x) => x.entryId === 'worship.check.charge-caps-skull');
    expect(f?.role).toBe('blocker');
    expect(f?.fixHolds).toBe(true);
  });

  it('W2-late: no worship Finding (World 2 is not finished)', () => {
    const r = evaluate(W2());
    for (const c of r.characters) expect(c.findings.some((f) => f.entryId.startsWith('worship'))).toBe(false);
  });
});

describe('US-6 account stockpiles that cap', () => {
  it('W2-late at 8 h: two account blockers, Arcade then Water', () => {
    const r = evaluate(W2());
    expect(r.account.safety).toBe('unsafe');
    expect(blockers(r.account.findings).sort()).toEqual([
      'alchemy.check.liquid-cap',
      'arcade.check.balls-cap',
    ]);
    const water = r.account.findings.find((f) => f.entryId === 'alchemy.check.liquid-cap');
    expect(water?.nextAction.text).toBe(
      "Spend Water (bubbles, vials or the Liquid Shop): it's at cap (32 of 32) and may refill before you're back",
    );
  });

  it('a failed Arcade section makes an otherwise-safe account Unknown (W3-early)', () => {
    const s = W3();
    const failed = { ...s, diagnostics: { ...s.diagnostics, failedSections: ['arcade'] } };
    expect(evaluate(failed).account.safety).toBe('unknown');
  });

  it('W3-early at 8 h: no account blocker', () => {
    const r = evaluate(W3());
    expect(blockers(r.account.findings)).toEqual([]);
    expect(r.account.safety).toBe('safe');
  });

  it('W3-early at 48 h: the Arcade blocks (its fix holds, 48 h >= 48 h) and the Refinery is a Next Action', () => {
    const r = evaluate(W3(), 48);
    const arcade = r.account.findings.find((f) => f.entryId === 'arcade.check.balls-cap');
    expect(arcade?.role).toBe('blocker');
    expect(arcade?.fixHolds).toBe(true);
    expect(nextActions(r.account.findings)).toContain('refinery.check.fuel-runs-out');
  });
});

describe('US-7 an inventory that is full', () => {
  it('a skiller whose target stack is at cap with a full bag: blocked only when storage has room', () => {
    const fill = (s: AccountState, freeStorage: number) => {
      const c = s.characters[1];
      const inv = c?.afk?.inventory;
      if (!inv || !c?.afk) return s;
      const stacks = [
        ...inv.stacks.map((x) => (x.item === c.afkTarget && x.cap !== null ? { ...x, amount: x.cap } : x)),
        ...Array.from({ length: inv.totalSlots - inv.stacks.length }, (_, i) => ({
          item: `F${i}`,
          amount: 1,
          cap: null,
        })),
      ];
      const t = patchAfk(s, 1, { inventory: { ...inv, stacks, usedSlots: inv.totalSlots } });
      const afk = t.account.afk;
      return afk ? { ...t, account: { ...t.account, afk: { ...afk, storageFreeSlots: freeStorage } } } : t;
    };
    const blocked = evaluate(fill(W2(), 3));
    const f = charOf(blocked, 1).findings.find((x) => x.entryId === 'afk.check.skiller-carry');
    expect(f?.role).toBe('blocker');
    expect(f?.nextAction.text).toBe(
      'Deposit to storage: Copper is at its carry cap (274) and the bag has no free slot',
    );
    // The real W2-late storage is full (91 of 91), so depositing is not possible: a Next Action.
    const full = charOf(evaluate(fill(W2(), 0)), 1).findings.find(
      (x) => x.entryId === 'afk.check.skiller-carry',
    );
    expect(full?.demotedBecause).toBe('not-fillable');
  });
});

describe('US-8 empty Parallel Slots and idle traps', () => {
  it('no cauldron Finding on either fixture; an unassigned Bowman Lv 54 blocks', () => {
    for (const s of [W2(), W3()])
      for (const c of evaluate(s).characters)
        expect(c.findings.map((f) => f.entryId)).not.toContain('alchemy.check.cauldron-unassigned');
    const r = evaluate(patchAfk(W2(), 3, { cauldronAssigned: false }));
    const f = charOf(r, 3).findings.find((x) => x.entryId === 'alchemy.check.cauldron-unassigned');
    expect(f?.role).toBe('blocker');
    expect(f?.nextAction.text).toBe('Assign Bowman Lv 54 to a cauldron before you leave');
  });

  const trap = (offsetH: number) => {
    const s = W3();
    return patchAfk(s, 4, {
      traps: { placed: [{ critter: 'Critter1', endsAt: s.asOf + offsetH * HOUR_MS }] },
    });
  };

  it('no trap Finding on the W3-early account', () => {
    for (const c of evaluate(W3()).characters)
      expect(c.findings.some((f) => f.entryId.startsWith('trapping'))).toBe(false);
  });

  it('a trap finishing in 3 h against 8 h is a Next Action; a finished trap blocks', () => {
    const running = charOf(evaluate(trap(3)), 4);
    expect(nextActions(running.findings)).toContain('trapping.check.finishes-early');
    expect(blockers(running.findings)).toEqual([]);
    const done = charOf(evaluate(trap(-1)), 4);
    expect(blockers(done.findings)).toContain('trapping.check.slots-and-timers');
  });
});

describe('US-10 when the save cannot tell', () => {
  it('an unreadable anvil makes otherwise-safe rows Unknown, and the Barbarian stays Fix for its food', () => {
    let s = W2();
    for (const c of s.characters) s = withUnknown(s, `characters[${c.index}].afk.anvil`);
    const r = evaluate(s);
    expect(charOf(r, 0).safety).toBe('unsafe');
    for (const i of [1, 2, 3, 4]) expect(charOf(r, i).safety).toBe('unknown');
  });

  it('a character whose AFK Target is the Lab is not-covered, never Ready', () => {
    const r = evaluate(withCharacter(W3(), 5, { afkType: 'LABORATORY', afkTarget: null }));
    expect(charOf(r, 5).safety).toBe('not-covered');
    expect(composeVerdict('not-covered', 'not-implemented')).toEqual({
      kind: 'unknown',
      blockerKeys: [],
      unknownReason: 'not-covered',
      suggestion: null,
    });
  });

  it('missing AFK facts (no Toolbox calls) are Unknown, never a silent pass', () => {
    const s = W3();
    const bare = {
      ...s,
      characters: s.characters.map((c) => ({ ...c, afk: null })),
      account: { ...s.account, afk: null },
    };
    const r = evaluate(bare);
    for (const c of r.characters) expect(c.safety).toBe('unknown');
    expect(r.account.safety).toBe('unknown');
  });
});

describe('US-11 the overall verdict', () => {
  it('W3-early at 8 h: all 6 Ready, no account blocker, first fill the Bowman Lv 60 anvil, 4 already full', () => {
    const r = evaluate(W3());
    const out = toModuleOutput(r, kb);
    expect((out.characters ?? []).map((c) => c.verdict?.kind)).toEqual([
      'ready',
      'ready',
      'ready',
      'ready',
      'ready',
      'ready',
    ]);
    expect(out.account?.blockerKeys).toEqual([]);
    expect(out.firstFill?.label).toBe("Bowman Lv 60's anvil");
    expect(out.alreadyFull).toBe(4);
  });

  it('W2-late at 8 h: the Barbarian Lv 60 is Fix (food and its full anvil), 4 Ready, 2 account blockers', () => {
    const out = toModuleOutput(evaluate(W2()), kb);
    expect((out.characters ?? []).map((c) => c.verdict?.kind)).toEqual([
      'fix',
      'ready',
      'ready',
      'ready',
      'ready',
    ]);
    // Both bite now; the present-state food Check ranks first on the tie (FR-10).
    expect(out.characters?.[0]?.verdict?.blockerKeys).toEqual([
      'afk.check.dies-fixable-by-food@c0',
      'anvil.check.caps-before-return@c0',
    ]);
    expect(out.account?.blockerKeys).toHaveLength(2);
  });
});

describe('FR-9 Verdict composition', () => {
  it.each([
    ['unsafe', 'serving', 'fix', null],
    ['unknown', 'serving', 'unknown', 'cannot-tell'],
    ['not-covered', 'serving', 'unknown', 'not-covered'],
    ['safe', 'serving', 'ready', null],
    ['safe', 'not-implemented', 'ready', null],
    ['safe', 'not-covered', 'unknown', 'not-covered'],
    ['safe', 'exhausted', 'unknown', 'no-purpose'],
    ['safe', 'none', 'unknown', 'no-purpose'],
    ['safe', 'no-activity', 'unknown', 'no-purpose'],
    ['safe', 'cannot-tell', 'unknown', 'cannot-tell'],
  ] as const)('%s + %s -> %s (%s)', (safety, purpose, kind, reason) => {
    const v = composeVerdict(safety, purpose, ['k']);
    expect(v.kind).toBe(kind);
    expect(v.unknownReason).toBe(reason);
    expect(v.blockerKeys).toEqual(kind === 'fix' ? ['k'] : []);
  });
});

describe('TR-11 properties', () => {
  const RETURNS = [2, 4, 8, 12, 24, 48];
  it.each(['w2', 'w3'] as const)(
    'monotonicity on %s: a longer return only adds Findings; roles move only blocker -> Next Action',
    (w) => {
      const s = w === 'w2' ? W2() : W3();
      let prev: Map<string, { role: string; fixHolds: boolean; at: number | null }> | null = null;
      for (const h of RETURNS) {
        const r = evaluate(s, h);
        const all = [...r.characters.flatMap((c) => c.findings), ...r.account.findings];
        const now = new Map(all.map((f) => [f.key, { role: f.role, fixHolds: f.fixHolds, at: f.at }]));
        if (prev)
          for (const [key, p] of prev) {
            const n = now.get(key);
            expect(n, `${key} vanished at ${h} h`).toBeDefined();
            if (n && p.role !== n.role) {
              expect(p.role).toBe('blocker');
              expect(n.fixHolds).toBe(false);
              expect(n.at !== null && n.at <= s.asOf).toBe(false);
            }
          }
        prev = now;
      }
    },
  );

  it('fix-holds soundness: collecting the anvil now makes the Check pass at the return', () => {
    const s = W2();
    const r = evaluate(s, 2);
    for (const c of r.characters) {
      const f = c.findings.find((x) => x.entryId === 'anvil.check.caps-before-return');
      if (!f?.fixHolds) continue;
      const afk = s.characters.find((x) => x.index === c.index)?.afk;
      const anvil = (afk?.anvil ?? []).map((p) => ({ ...p, amount: 0, capAt: s.asOf + p.fromEmptyMs }));
      const after = charOf(evaluate(patchAfk(s, c.index, { anvil }), 2), c.index);
      expect(after.findings.map((x) => x.entryId)).not.toContain('anvil.check.caps-before-return');
    }
  });

  it('is deterministic: the same inputs give the same output (FR-31)', () => {
    expect(JSON.stringify(evaluate(W2()))).toBe(JSON.stringify(evaluate(W2())));
    expect(JSON.stringify(evaluate(W3(), 12))).toBe(JSON.stringify(evaluate(W3(), 12)));
  });

  it('never puts a character name in advice text', () => {
    for (const s of [W2(), W3()]) {
      const text = JSON.stringify(evaluate(s));
      for (const c of s.characters) expect(text).not.toContain(c.name);
    }
  });
});
