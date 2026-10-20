// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 area S (TR-10, FR-S1, FR-S4, US-11, US-12): the `pictures` module over the full engine on the
// scrubbed saves, the slotPictures merge in the core (M20's pictures and area S's both come through,
// M20's first), BehindSystem.expectedBy, and the hub's Stage report card.
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { runEngine } from '../../src/core/engine';
import type { EngineModule } from '../../src/core/module';
import { goldenResult } from '../../src/golden';
import { EMPTY_PREFS } from '../../src/now/prefs';
import { buildSystemsView } from '../../src/now/systems-view';
import { buildAnvilPageView } from '../../src/pictures/anvil-view';
import { buildSystemsHubView } from '../../src/pictures/hub-view';
import { buildSystemPageFrameView, inStepOrder } from '../../src/pictures/page-view';
import type { PrinterPicture, StampsPicture, StatuesPicture, VaultPicture } from '../../src/pictures/types';
import type { EngineResult, SystemPicture } from '../../src/result';
import { input, NOW, publicState } from '../core/helpers';

const ctx = await goldenContext();
const fixture = (id: string) => {
  const f = listFixtures({ private: false }).find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  return { state: stateOf(f), now: f.now };
};
const run = (id: 'scrubbed-w2' | 'scrubbed-w3'): EngineResult => {
  const { state, now } = fixture(id);
  return goldenResult({
    state,
    kb: ctx.kb,
    registries: ctx.registries,
    now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
};
const pic = <K extends SystemPicture['kind']>(r: EngineResult, kind: K) =>
  r.slotPictures?.find((p) => p.kind === kind) as unknown;

const W3 = run('scrubbed-w3');
const W2 = run('scrubbed-w2');

describe('the core concatenates slotPictures from every module (orchestrator-approved F-frozen edit)', () => {
  const picture = (systemId: 'construction' | 'stamps'): SystemPicture =>
    systemId === 'construction'
      ? ({ systemId, kind: 'cog-board', squares: [] } as unknown as SystemPicture)
      : ({ systemId, kind: 'stamps', elements: [], lit: null } as SystemPicture);
  const mod = (id: string, p: SystemPicture, after = false): EngineModule => ({
    id,
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    ...(after ? { after: true } : {}),
    run: () => ({ slotPictures: [p] }),
  });
  it("keeps M20's pictures first, then the pictures step's", () => {
    const r = runEngine(input(publicState('first.json')), [
      mod('pictures', picture('stamps'), true),
      mod('m20-slots', picture('construction')),
    ]);
    expect(r.slotPictures?.map((p) => p.kind)).toEqual(['cog-board', 'stamps']);
  });
  it('leaves slotPictures out when no module emits any', () => {
    expect(runEngine(input(publicState('first.json')), []).slotPictures).toBeUndefined();
  });
  it('the real engine carries both M20 and area S pictures', () => {
    const kinds = W3.slotPictures?.map((p) => p.kind) ?? [];
    expect(kinds).toEqual(expect.arrayContaining(['cog-board', 'stamps', 'statues', 'vault', 'printer']));
    expect(kinds.indexOf('cog-board')).toBeLessThan(kinds.indexOf('stamps'));
  });
  void NOW;
});

describe('BehindSystem.expectedBy (orchestrator-approved F-frozen edit)', () => {
  it("carries each behind row's Stage", () => {
    const rows = W3.behindSystems ?? [];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => typeof r.expectedBy === 'string')).toBe(true);
    expect(rows.find((r) => r.systemId === 'cards')?.expectedBy).toBe('W1-mid');
  });
});

describe('US-12 the new System pictures', () => {
  it('W3-early Vault: "33 levels to open Special Talent", you are here at the total, one lit row', () => {
    const v = pic(W3, 'vault') as VaultPicture;
    expect(v.nextUnlock).toEqual({ levels: 33, name: 'Special Talent' });
    expect(v.totalLevels).toBe(W3.slotPictures ? v.totalLevels : -1);
    expect(v.elements.filter((e) => e.id === v.lit)).toHaveLength(1);
    expect(v.elements.filter((e) => e.actionKey !== null)).toHaveLength(1);
  });
  it('W2-late Vault: "56 levels to open Active Murdering"', () => {
    const v = pic(W2, 'vault') as VaultPicture;
    expect(v.nextUnlock).toEqual({ levels: 56, name: 'Active Murdering' });
  });
  it("the Vault's lit row is M7's first Vault buy", () => {
    const v = pic(W3, 'vault') as VaultPicture;
    const line = W3.account.spendPlan?.lines.find((l) => l.steps.some((s) => s.sink === 'vault'));
    const ref = line?.steps.find((s) => s.sink === 'vault')?.ref;
    expect(ref).toBe(`upgrade-vault.acquisition.row-${v.elements.find((e) => e.id === v.lit)?.index}`);
  });
  it("W3-early Printer: every slot reads its M14 change or 'no change', and changes match M14's Goal", () => {
    const p = pic(W3, 'printer') as PrinterPicture;
    expect(p.elements.length).toBeGreaterThan(0);
    const goal = W3.account.goals.find((g) => g.id === 'printer.check.slot-plan');
    const changed = p.elements.filter((e) => e.changeTo !== null);
    expect(changed.length).toBe(goal ? Math.max(1, goal.details?.length ?? 1) : 0);
    expect(p.lit === null).toBe(changed.length === 0);
  });
  it('Stamps: the three tabs in game order, one lit stamp (the top stamps Goal), a next-three ribbon', () => {
    const s = pic(W3, 'stamps') as StampsPicture;
    expect(s.tabs.map((t) => t.tab)).toEqual(['combat', 'skills', 'misc']);
    expect(s.tabs.reduce((n, t) => n + t.total, 0)).toBe(s.total);
    const lit = s.elements.filter((e) => e.id === s.lit);
    expect(lit).toHaveLength(1);
    expect(lit[0]?.status).not.toBe('owned');
    expect(s.next[0]).toBe(s.lit);
    expect(s.next.length).toBeLessThanOrEqual(3);
    // The lit stamp's key is a stamps Goal's own Next Action key (M17 FR-31's highlight).
    const keys = [...W3.account.goals, ...W3.characters.flatMap((c) => c.goals)]
      .filter((g) => g.system === 'stamps')
      .map((g) => g.nextAction.key);
    expect(keys).toContain(lit[0]?.actionKey);
  });
  it('Statues: 32 statues with a grade, the next Gold lit from M7', () => {
    const s = pic(W3, 'statues') as StatuesPicture;
    expect(s.elements).toHaveLength(32);
    expect(s.elements.filter((e) => e.id === s.lit)).toHaveLength(1);
    expect(s.elements.find((e) => e.id === s.lit)?.grade).toBe(0);
    expect(
      s.elements.every((e) => e.byCharacter === null || e.byCharacter.length === e.characterIndices.length),
    ).toBe(true);
  });
});

describe('US-11 the Stage report card (FR-S1)', () => {
  const hubUi = { now: fixture('scrubbed-w3').now };
  const v = buildSystemsHubView(W3, EMPTY_PREFS, hubUi, buildSystemsView(W3, EMPTY_PREFS, hubUi));
  it('the "Wasting now" strip lists the wasting Systems with their count', () => {
    expect(v.wastingNow.map((w) => w.id)).toEqual(
      v.groups
        .flatMap((g) => g.tiles)
        .filter((t) => t.status === 'wasting')
        .map((t) => t.id),
    );
    expect(v.wastingLabel).toBe(`${v.wastingNow.length} Systems wasting`);
  });
  it('rows are the behind Systems, largest gap first, at most 5, the worst open with one step', () => {
    const rows = v.report?.rows ?? [];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(5);
    expect(rows.map((r) => r.id)).toEqual(expect.arrayContaining(['cards', 'obols']));
    const gaps = rows.map((r) => r.gap);
    expect([...gaps].sort((a, b) => b - a)).toEqual(gaps);
    expect(rows.filter((r) => r.open)).toHaveLength(1);
    expect(rows[0]?.open).toBe(true);
    expect(rows[0]?.step?.text).toMatch(/card/i);
    expect(v.report?.allSystems).toMatch(/^All Systems \(\d+\)$/);
  });
  it('"not covered yet" is said once per band', () => {
    for (const g of v.groups) {
      const n = g.tiles.filter((t) => t.status === 'not-covered').length;
      expect(v.bands[g.world]?.notCovered ?? null).toEqual(n ? expect.stringContaining(`${n} here`) : null);
    }
  });
  it('a System page leads with its step and, when behind, the Stage meter', () => {
    const ui = { now: fixture('scrubbed-w3').now, id: 'cards', highlight: null };
    const page = buildSystemPageFrameView(W3, EMPTY_PREFS, { roster: [] }, ui);
    expect(page?.step?.text).toBe(page?.goals[0]?.action.text);
    expect(page?.stageMeter?.text).toBe('Expected by World 1, mid · you are at World 3, early');
    const vault = buildSystemPageFrameView(W3, EMPTY_PREFS, { roster: [] }, { ...ui, id: 'upgrade-vault' });
    expect(vault?.pictures.map((p) => p.kind)).toEqual(['vault']);
  });
});

describe('M24 the Systems index, the page template and the Anvil page', () => {
  const now = fixture('scrubbed-w3').now;
  const v = buildSystemsHubView(W3, EMPTY_PREFS, { now }, buildSystemsView(W3, EMPTY_PREFS, { now }));
  const ix = v.index;
  const tiles = ix.worlds.flatMap((w) => w.tiles);
  it('the summary and filter counts agree with the tiles; Locked and not covered are apart', () => {
    expect(ix.summary).toMatch(/^\d+ Systems · \d+ wasting · \d+ behind for World 3/);
    expect(ix.counts.needs).toBe(tiles.filter((t) => t.needsYou).length);
    expect(ix.counts.notCovered).toBe(tiles.filter((t) => t.status === 'not-covered').length);
    expect(ix.counts.locked).toBe(tiles.filter((t) => t.status === 'locked').length);
    for (const t of tiles.filter((x) => x.status === 'locked')) expect(t.sub).toBe('locked');
    for (const t of tiles.filter((x) => x.status === 'not-covered')) expect(t.sub).toBe('not covered yet');
  });
  it('every wasting System leads with its first step; every behind row has its next step', () => {
    expect(ix.wasting.map((w) => w.id)).toEqual(v.wastingNow.map((w) => w.id));
    for (const w of ix.wasting) expect(w.step?.text).toBeTruthy();
    expect(ix.behindTitle).toBe('Behind for World 3');
    for (const b of ix.behind) expect(b.by).toMatch(/^usually done by World \d/);
    expect(ix.behind.filter((b) => b.step).length).toBe(ix.behind.length);
  });
  it('a locked world says how it opens', () => {
    for (const w of ix.worlds)
      if (w.tiles.length && w.tiles.every((t) => t.status === 'locked')) expect(w.how).toBeTruthy();
  });
  it('the frame: back link, status word, the answer from the first step, the checks line', () => {
    const page = buildSystemPageFrameView(
      W3,
      EMPTY_PREFS,
      { roster: [] },
      { now, id: 'cards', highlight: null },
    );
    expect(page?.frame.back).toBe('Systems · Across worlds');
    expect(page?.frame.status.word).toBe('Behind for World 3');
    expect(page?.frame.status.reason).not.toMatch(/Behind for your Stage/);
    expect(page?.frame.answer.hero).toBe(page?.goals[0]?.action.text);
    expect(page?.frame.checksLine).toMatch(/^Checks: /);
    // Steps name class and level, never a character's name.
    for (const st of page?.frame.steps ?? []) if (st.who) expect(st.who).toMatch(/^[A-Z][a-z ]+ \d+$/);
    const eq = buildSystemPageFrameView(
      W3,
      EMPTY_PREFS,
      { roster: [] },
      { now, id: 'equinox', highlight: null },
    );
    // M26 FR-6: no Mirror and no Dream Upgrade on this save, so Equinox reads locked, with how it opens.
    expect(eq?.frame.answer).toMatchObject({
      tone: 'mut',
      hero: "Equinox isn't open yet",
      cap: 'How it opens',
    });
  });
  it('the Anvil page: the Bowman Lv 60 puts its 3 spare points into Speed; splits by work', () => {
    const { state } = fixture('scrubbed-w3');
    const a = buildAnvilPageView(state, W3, 8);
    expect(a?.hero?.hero).toBe("Put Bowman 60's 3 spare anvil points into Speed");
    expect(a?.rows.find((r) => r.spare > 0)?.todo).toBe('Add all 3 to Speed');
    // Products slowest last, each with its work per item (Toolbox requiredAmount).
    const works = a?.products.map((p) => p.work) ?? [];
    expect([...works].sort((x, y) => x - y)).toEqual(works);
    expect(a?.products[0]).toMatchObject({ name: 'Thread', work: 100 });
    // No character clears the respec Goal's 25% at 8 h, so no Whetstone order.
    expect(a?.whetstone).toEqual([]);
  });
  it('World 4 pages with Checks (M26 Wave 1): a normal tile; the body answers while nothing fires', () => {
    const W4 = ['lab', 'cooking', 'breeding'];
    const r = {
      ...W3,
      systems: (W3.systems ?? []).map((x) => (W4.includes(x.id) ? { ...x, unlocked: 'yes' as const } : x)),
      world4: { ...(W3.world4 ?? {}), readOnlyPages: W4 },
    } as EngineResult;
    const h = buildSystemsHubView(r, EMPTY_PREFS, { now }, buildSystemsView(r, EMPTY_PREFS, { now })).index;
    const lab = h.worlds.flatMap((w) => w.tiles).find((t) => t.id === 'lab');
    expect(lab?.readOnly).toBe(false);
    const page = buildSystemPageFrameView(
      r,
      EMPTY_PREFS,
      { roster: [] },
      { now, id: 'lab', highlight: null },
    );
    expect(page?.frame.readOnly).toBe(false);
    // No Lab Check fires on this save, so the Lab body draws its own answer and the template none.
    expect(page?.frame.bodyAnswers).toBe(true);
  });
});

describe('M24 QA fixes: caps full now on the page header, one "Needs you" definition', () => {
  const now = fixture('scrubbed-w3').now;
  // Worship charge as cap pills (R-PILL-1): five full now, one full later (before the return).
  const withCaps = (fullNow: number, later: number): EngineResult => ({
    ...W3,
    characters: W3.characters.map((c, i) => ({
      ...c,
      goals: c.goals.filter((g) => g.system !== 'worship'),
      info: [
        ...(c.info ?? []).filter((l) => !l.key.startsWith('worship.')),
        ...(i < fullNow + later
          ? [
              {
                key: `worship.check.charge-full@c${c.index}`,
                text: 'Worship charge is full',
                sources: [],
                kind: 'cap' as const,
                label: 'Worship full · spend',
                at: i < fullNow ? now - 1000 : now + 3_600_000,
              },
            ]
          : []),
      ],
    })),
    account: { ...W3.account, goals: W3.account.goals.filter((g) => g.system !== 'worship') },
  });
  it('the header counts the caps full now with their own verb, in gold, and the answer is to do', () => {
    const r = withCaps(5, 1);
    const page = buildSystemPageFrameView(
      r,
      EMPTY_PREFS,
      { roster: [] },
      { now, id: 'worship', highlight: null },
    );
    expect(page?.tile.status).toBe('ok');
    expect(page?.frame.status).toMatchObject({ tone: 'gold', word: '5 full · spend' });
    expect(page?.frame.status.reason).not.toMatch(/collect|6 full|Nothing to fix/);
    expect(page?.frame.answer).toMatchObject({
      tone: 'gold',
      cap: 'Do this next',
      hero: 'Worship full on 5 characters',
    });
  });
  it('caps that fill only later are not counted; with none full now the page says nothing to fix', () => {
    const r = withCaps(0, 2);
    const page = buildSystemPageFrameView(
      r,
      EMPTY_PREFS,
      { roster: [] },
      { now, id: 'worship', highlight: null },
    );
    expect(page?.frame.status).toMatchObject({ tone: 'mint', word: 'Nothing to fix' });
  });
  it('the index: a gold tile (to do or a cap full now) needs you, and the filter counts the pips', () => {
    const r = withCaps(5, 0);
    const ix = buildSystemsHubView(r, EMPTY_PREFS, { now }, buildSystemsView(r, EMPTY_PREFS, { now })).index;
    const tiles = ix.worlds.flatMap((w) => w.tiles);
    expect(tiles.find((t) => t.id === 'worship')).toMatchObject({ tone: 'todo', needsYou: true });
    for (const t of tiles) expect(t.needsYou).toBe(t.tone === 'wasting' || t.tone === 'todo');
    expect(ix.counts.needs).toBe(tiles.filter((t) => t.tone === 'wasting' || t.tone === 'todo').length);
  });
});

describe('final QA P2: the Stamps page has one order', () => {
  const tile = (id: string, status: StampsPicture['elements'][number]['status']) =>
    ({ id, status }) as StampsPicture['elements'][number];
  const stamps = {
    systemId: 'stamps',
    kind: 'stamps',
    elements: [
      tile('a', 'now'),
      tile('b', 'toward'),
      tile('c', 'toward'),
      tile('d', 'active'),
      tile('e', 'owned'),
    ],
    lit: 'a',
    owned: 1,
    total: 5,
    tabs: [],
    next: ['a', 'd', 'b'],
    byGoal: { 'q@c4': ['c'], 'q@c1': ['b', 'e'], 'shop@account': ['a'] },
  } as StampsPicture;
  const keys = (...k: string[]) => k.map((key) => ({ action: { key } }));

  it("lights the first step's stamp and lists stamps in step order, then the rest", () => {
    const [p] = inStepOrder(
      [stamps as SystemPicture],
      keys('q@c4', 'q@c1', 'shop@account'),
    ) as StampsPicture[];
    expect(p?.lit).toBe('c');
    // "e" is owned: never listed. "d" has no step: after the stepped ones.
    expect(p?.next).toEqual(['c', 'b', 'a', 'd']);
  });

  it('leaves the picture alone when no step names a stamp', () => {
    expect(inStepOrder([stamps as SystemPicture], keys('other@account'))[0]).toBe(stamps);
  });

  it("on a real page, the step's key is the lit stamp's key", () => {
    const now = fixture('scrubbed-w3').now;
    const roster = [...W3.characters].reverse().map((c) => ({ index: c.index }));
    const page = buildSystemPageFrameView(W3, EMPTY_PREFS, { roster } as never, {
      now,
      id: 'stamps',
      highlight: null,
    });
    const s = page?.pictures.find((x) => x.kind === 'stamps') as StampsPicture | undefined;
    const first = page?.goals.find((g) => (s?.byGoal?.[g.action.key] ?? []).length > 0);
    expect(first).toBeDefined();
    if (!s || !first) return;
    expect(s.lit).toBe(s.byGoal?.[first.action.key]?.[0]);
    expect(s.next[0]).toBe(s.lit);
  });
});
