// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 TR-5, TR-14: `buildSystemsView` and `buildSystemPageView`. FR-17's status order on hand-written
// results, skips and dismissals (D-8), cap pills (R-PILL-1), Behind attribution, locked-and-behind,
// Spend Plan lines, Stage unknown and `parserBehind`; then US-5 to US-9 on the scrubbed saves through
// the full engine, the blocker-implies-wasting invariant on every committed fixture, and the TR-9 lint
// of `view-words.ts`. Characters are named by class and level only.
import type { AccountState } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS, isAdviceShaped } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';
import { buildNowView, DEFAULT_UI } from '../../src/now/build-now-view';
import { EMPTY_PREFS, type NowPrefs } from '../../src/now/prefs';
import { SYSTEM_HOMES } from '../../src/now/system-homes';
import { buildSystemPageView, buildSystemsView, seeItSystem } from '../../src/now/systems-view';
import * as words from '../../src/now/view-words';
import type {
  BehindSystem,
  CharacterResult,
  EngineResult,
  Goal,
  InfoLine,
  SystemSummary,
} from '../../src/result';

const NOW = 1_792_260_000_000;

const sys = (id: string, over: Partial<SystemSummary> = {}): SystemSummary => ({
  id,
  name: id[0]?.toUpperCase() + id.slice(1),
  kind: 'game',
  world: 1,
  scope: 'account',
  unlocked: 'yes',
  unlockBy: 'world',
  covered: true,
  unlock: { text: `Opens when ${id} opens`, world: 1, stale: false, sources: [] },
  wiki: null,
  checks: [],
  ...over,
});

const goal = (system: string, n: number, subject: string, over: Partial<Goal> = {}): Goal => ({
  id: `${system}.check.g${n}`,
  title: `${system} ${n}`,
  system,
  category: 'compounding',
  nextAction: {
    key: `${system}.check.g${n}@${subject}`,
    entryId: `${system}.check.g${n}`,
    text: `${system} line ${n}`,
    why: 'because',
    sources: [],
    stale: false,
    contested: null,
    confidence: 'H',
    provenance: { entryIds: [`${system}.check.g${n}`], fields: [] },
  },
  milestone: null,
  ...over,
});

const character = (index: number, goals: Goal[] = [], info: InfoLine[] = []): CharacterResult => ({
  index,
  name: `Char${index}`,
  classId: 'Squire',
  classLabel: 'Squire',
  level: 40 + index,
  activityLabel: 'Fighting',
  mapLabel: null,
  isPlaying: false,
  verdict: {
    kind: goals.some((g) => g.category === 'blocker') ? 'fix' : 'ready',
    blockerKeys: goals.filter((g) => g.category === 'blocker').map((g) => g.nextAction.key),
    unknownReason: null,
    suggestion: null,
  },
  purpose: [],
  goals,
  higherLeverage: null,
  spendChip: null,
  activePlay: [],
  doneThisSession: [],
  firstFill: null,
  info,
});

const cap = (system: string, index: number, at: number | null = NOW - 1): InfoLine => ({
  key: `${system}.check.cap@c${index}`,
  text: `${system} full`,
  sources: [],
  kind: 'cap',
  label: `${system} full · collect`,
  at,
});

function result(over: Partial<EngineResult> = {}): EngineResult {
  return {
    asOf: NOW,
    lastPlayedCharacterIndex: null,
    sessionStartedAt: NOW - 3_600_000,
    expectedReturn: { usedSeconds: 8 * 3600, learnedSeconds: null },
    stage: { id: 'W2-mid', label: 'W2-mid' },
    characters: [character(0), character(1)],
    visitOrder: [0, 1],
    account: {
      goals: [],
      blockerKeys: [],
      safety: 'safe',
      spendPlan: null,
      activePlay: [],
      doneThisSession: [],
    },
    firstFill: null,
    alreadyFull: 0,
    higherLeverageStatus: 'ok',
    notCovered: [],
    versions: { knowledge: 'test', gameBuild: 1, parserTarget: '2.3.540', parserBehind: false },
    diagnostics: { failedDetectors: [] },
    systems: [sys('anvil'), sys('arcade', { world: 2 }), sys('refinery', { world: 3 })],
    behindSystems: [],
    unknownFindings: [],
    ...over,
  };
}

const ui = { now: NOW, lastCloudSave: NOW - 60_000 };
const skipped = (...keys: string[]): NowPrefs => ({
  ...EMPTY_PREFS,
  skips: Object.fromEntries(
    keys.map((k) => [k, { midnightAt: NOW + 3_600_000, sessionStartedAt: NOW - 3_600_000 }]),
  ),
});
const tile = (r: EngineResult, id: string, prefs: NowPrefs = EMPTY_PREFS) =>
  buildSystemsView(r, prefs, ui)
    .groups.flatMap((g) => g.tiles)
    .concat(buildSystemsView(r, prefs, ui).later?.tiles ?? [])
    .find((t) => t.id === id);
const reason = (r: EngineResult, id: string, prefs?: NowPrefs) =>
  tile(r, id, prefs)
    ?.reason.map((s) => s.text)
    .join('');

describe('FR-17 status, the first that applies', () => {
  it('locked wins over everything, then wasting, behind, can not tell, not covered yet, ok', () => {
    const blocker = goal('anvil', 1, 'c0', { category: 'blocker' });
    const r = result({
      characters: [character(0, [blocker]), character(1)],
      systems: [
        sys('anvil'),
        sys('arcade', { unlocked: 'no' }),
        sys('refinery'),
        sys('stamps', { unlocked: 'unknown' }),
        sys('forge', { covered: false }),
        sys('bribes'),
      ],
      behindSystems: [
        {
          systemId: 'refinery',
          rowId: 'r',
          fixEntryId: 'refinery.check.g1',
          findingKeys: ['refinery.check.g1@account'],
          chosen: true,
        },
      ],
      account: { ...result().account, goals: [goal('refinery', 1, 'account')] },
    });
    const v = buildSystemsView(r, EMPTY_PREFS, ui);
    const status = Object.fromEntries(v.groups.flatMap((g) => g.tiles).map((t) => [t.id, t.status]));
    expect(status).toEqual({
      anvil: 'wasting',
      arcade: 'locked',
      refinery: 'behind',
      stamps: 'cant-tell',
      forge: 'not-covered',
      bribes: 'ok',
    });
    expect(v.wastingCount).toBe(1);
    expect(v.needsYou.map((n) => [n.id, n.status])).toEqual([
      ['anvil', 'wasting'],
      ['refinery', 'behind'],
    ]);
  });

  it('reads urgency (losing-now, lost-before-return) as wasting, never banked', () => {
    const r = result({
      account: {
        ...result().account,
        goals: [
          goal('arcade', 1, 'account', { urgency: 'losing-now' }),
          goal('refinery', 1, 'account', { urgency: 'banked' }),
        ],
      },
    });
    expect(tile(r, 'arcade')?.status).toBe('wasting');
    expect(tile(r, 'refinery')?.status).toBe('ok');
    expect(reason(r, 'arcade')).toBe('1 to fix before you leave');
    expect(reason(r, 'refinery')).toBe('Nothing to fix · 1 to do');
  });

  it('a Detector failure or a Check that could not tell reads "Can\'t tell", never "Nothing to fix"', () => {
    const r = result({
      diagnostics: { failedDetectors: [{ detectorId: 'x', entryIds: ['anvil.check.g1'], message: 'boom' }] },
      unknownFindings: [{ entryId: 'arcade.check.g2', subject: 'account', reason: 'parser-section-failed' }],
    });
    expect(tile(r, 'anvil')?.status).toBe('cant-tell');
    expect(tile(r, 'arcade')?.status).toBe('cant-tell');
    expect(reason(r, 'anvil')).toBe("Can't tell from the save");
  });
});

describe('D-8: skips, dismissals and cap pills on the hub', () => {
  const blocker = goal('anvil', 1, 'c0', { category: 'blocker' });
  const r = result({
    characters: [character(0, [blocker], [cap('anvil', 0)]), character(1, [], [cap('anvil', 1)])],
  });

  it('a skipped blocker never makes a System wasting; the tile adds "· n skipped"', () => {
    const p = skipped(blocker.nextAction.key);
    expect(tile(r, 'anvil', p)?.status).toBe('ok');
    expect(reason(r, 'anvil', p)).toBe('Nothing to fix · 1 skipped · 2 full · collect');
    expect(buildSystemsView(r, p, ui).wastingCount).toBe(0);
  });

  it('cap pills never make a System wasting or count toward the badge', () => {
    const pillsOnly = result({
      characters: [character(0, [], [cap('anvil', 0)]), character(1, [], [cap('anvil', 1)])],
    });
    const v = buildSystemsView(pillsOnly, EMPTY_PREFS, ui);
    expect(tile(pillsOnly, 'anvil')?.status).toBe('ok');
    expect(reason(pillsOnly, 'anvil')).toBe('Nothing to fix · 2 full · collect');
    expect(v.wastingCount).toBe(0);
    expect(v.needsYou).toEqual([]);
  });

  it('a pill that fills after the return is not counted; a skipped pill is not counted', () => {
    const late = result({
      characters: [
        character(0, [], [cap('anvil', 0, NOW + 9 * 3_600_000)]),
        character(1, [], [cap('anvil', 1)]),
      ],
    });
    expect(tile(late, 'anvil')?.counts.pillsFull).toBe(1);
    expect(tile(late, 'anvil', skipped('anvil.check.cap@c1'))?.counts.pillsFull).toBe(0);
  });

  it('a dismissed Goal leaves the "to do" count', () => {
    const r2 = result({
      account: { ...result().account, goals: [goal('arcade', 1, 'account'), goal('arcade', 2, 'account')] },
    });
    const p: NowPrefs = { ...EMPTY_PREFS, dismissals: { 'arcade.check.g1@account': 1 } };
    expect(tile(r2, 'arcade', p)?.counts.toDo).toBe(1);
  });
});

describe('Behind (D-9) and locked Systems (FR-17, FR-19)', () => {
  const row = (systemId: string, keys: string[], chosen = false): BehindSystem => ({
    systemId,
    rowId: `${systemId}-row`,
    fixEntryId: `${systemId}.check.g1`,
    findingKeys: keys,
    chosen,
  });

  it('a behind row whose every fix finding is skipped or dismissed is not behind', () => {
    const r = result({ behindSystems: [row('arcade', ['arcade.check.g1@c0', 'arcade.check.g1@c1'])] });
    expect(tile(r, 'arcade')?.status).toBe('behind');
    const p: NowPrefs = { ...skipped('arcade.check.g1@c0'), dismissals: { 'arcade.check.g1@c1': 1 } };
    expect(tile(r, 'arcade', p)?.status).toBe('ok');
  });

  it("the Behind Goal belongs to the chosen row's System, and counts once there", () => {
    const behindGoal = goal('metapath', 9, 'account', { id: 'metapath.goal.behind' });
    const r = result({
      account: { ...result().account, goals: [behindGoal] },
      behindSystems: [row('refinery', [behindGoal.nextAction.key], true)],
    });
    expect(tile(r, 'refinery')?.counts.toDo).toBe(1);
    expect(seeItSystem(behindGoal, r)).toBe('refinery');
    const page = buildSystemPageView(
      r,
      EMPTY_PREFS,
      { roster: [] },
      { ...ui, id: 'refinery', highlight: null },
    );
    expect(page?.goals.map((g) => g.id)).toEqual(['metapath.goal.behind']);
  });

  it('a locked System with a behind row stays locked, says so and is in "Needs you"', () => {
    const own = goal('arcade', 1, 'c1');
    const r = result({
      characters: [character(0), character(1, [own])],
      systems: [
        sys('arcade', {
          unlocked: 'no',
          unlockBy: 'own',
          unlock: { text: 'Opens at class Lv 50', world: 2, stale: false, sources: [] },
        }),
      ],
      behindSystems: [row('arcade', [own.nextAction.key])],
    });
    const v = buildSystemsView(r, EMPTY_PREFS, ui);
    const t = v.groups[0]?.tiles[0];
    expect(t?.status).toBe('locked');
    expect(t?.alsoBehind).toBe(true);
    expect(t?.reason.map((s) => s.text).join('')).toBe(
      'Opens at class Lv 50 · 1 to do · behind for your Stage',
    );
    // R6 QA: a locked System never appears in "Needs you"; its tile carries "behind for your Stage".
    expect(v.needsYou).toEqual([]);
  });

  it('a world-gated locked tile shows only the world, never the precise condition (FR-19)', () => {
    const r = result({ systems: [sys('lab', { world: 4, unlocked: 'no' })] });
    expect(reason(r, 'lab')).toBe('Opens in World 4 · Hyperion Nebula');
  });
});

describe('FR-20 worlds, FR-21 other gaps, FR-22 versions', () => {
  it('shows worlds up to the highest reached + 1 and folds the rest', () => {
    const r = result({
      systems: [
        sys('w1', { world: 1 }),
        sys('w2', { world: 2 }),
        sys('w3', { world: 3, unlocked: 'no' }),
        sys('w4', { world: 4, unlocked: 'no' }),
      ],
    });
    const v = buildSystemsView(r, EMPTY_PREFS, ui);
    expect(v.groups.map((g) => g.heading)).toEqual([
      'World 1 · Blunder Hills',
      'World 2 · Yum-Yum Desert',
      'World 3 · Frostbite Tundra',
    ]);
    expect(v.later?.label).toBe('Later worlds: 1 Systems');
  });

  it('lists notCovered items that are not whole Systems, and "Worlds 5–7" past World 4', () => {
    const r = result({
      notCovered: [
        { systemId: 'anvil', label: 'Anvil' },
        { systemId: 'worlds-5-7', label: 'Worlds 5–7' },
        { systemId: 'talents-elite', label: 'Elite talent builds' },
      ],
    });
    const v = buildSystemsView(r, EMPTY_PREFS, ui);
    expect(v.otherGaps).toEqual(['Elite talent builds']);
    expect(v.beyond).toBe('Worlds 5–7: not covered yet');
  });

  it('adds "· may be out of date" while the parser is behind', () => {
    const r = result({ versions: { ...result().versions, parserBehind: true } });
    expect(reason(r, 'anvil')).toBe('Nothing to fix (may be out of date)');
    const r2 = result({
      versions: { ...result().versions, parserBehind: true },
      systems: [sys('anvil', { covered: false })],
    });
    expect(reason(r2, 'anvil')).toBe('Not covered yet · may be out of date');
  });
});

describe('Stage unknown (FR-23, US-13)', () => {
  const blocker = goal('anvil', 1, 'c0', { category: 'blocker' });
  const r = result({
    stage: { id: 'unknown', label: '?' },
    characters: [character(0, [blocker, goal('anvil', 2, 'c0')]), character(1)],
    account: { ...result().account, goals: [goal('arcade', 1, 'account', { urgency: 'losing-now' })] },
    behindSystems: [
      {
        systemId: 'refinery',
        rowId: 'x',
        fixEntryId: 'refinery.check.g1',
        findingKeys: ['refinery.check.g1@account'],
        chosen: true,
      },
    ],
  });

  it('no tile is behind, wasting comes from blockers only, the rest "Can\'t tell", and no "to do"', () => {
    const v = buildSystemsView(r, EMPTY_PREFS, ui);
    const tiles = v.groups.flatMap((g) => g.tiles);
    expect(tiles.map((t) => [t.id, t.status])).toEqual([
      ['anvil', 'wasting'],
      ['arcade', 'cant-tell'],
      ['refinery', 'cant-tell'],
    ]);
    expect(tiles.every((t) => t.counts.toDo === null)).toBe(true);
  });

  it('a System page shows only blockers and no Spend Plan lines', () => {
    const page = buildSystemPageView(r, EMPTY_PREFS, { roster: [] }, { ...ui, id: 'anvil', highlight: null });
    expect(page?.goals.map((g) => g.action.key)).toEqual([blocker.nextAction.key]);
    expect(page?.spendLines).toEqual([]);
    expect(page?.stageUnknown).toBe(true);
  });
});

describe('the System page (FR-23)', () => {
  it('lists every Goal in engine order: characters in the frozen order, then the account', () => {
    const r = result({
      characters: [character(0, [goal('anvil', 1, 'c0')]), character(1, [goal('anvil', 2, 'c1')])],
      account: { ...result().account, goals: [goal('anvil', 3, 'account')] },
    });
    const roster = [{ index: 1 }, { index: 0 }] as never;
    const page = buildSystemPageView(
      r,
      EMPTY_PREFS,
      { roster },
      { ...ui, id: 'anvil', highlight: 'anvil.check.g2@c1' },
    );
    expect(page?.goals.map((g) => [g.who, g.action.key])).toEqual([
      ['Char1 · Squire lv 41', 'anvil.check.g2@c1'],
      ['Char0 · Squire lv 40', 'anvil.check.g1@c0'],
      ['Account', 'anvil.check.g3@account'],
    ]);
    expect(page?.highlight).toBe('anvil.check.g2@c1');
  });

  it('hides a skipped Goal with its key for undo, and the hub count drops in the same render (FR-33)', () => {
    const r = result({
      account: { ...result().account, goals: [goal('arcade', 1, 'account'), goal('arcade', 2, 'account')] },
    });
    const p = skipped('arcade.check.g1@account');
    const page = buildSystemPageView(r, p, { roster: [] }, { ...ui, id: 'arcade', highlight: null });
    expect(page?.goals.map((g) => g.action.key)).toEqual(['arcade.check.g2@account']);
    expect(page?.skippedKeys).toEqual(['arcade.check.g1@account']);
    expect(tile(r, 'arcade', p)?.counts.toDo).toBe(1);
  });

  it('places Spend Plan lines by their step refs', () => {
    const line = {
      id: 'l1',
      entryId: 'spend.priority.x#y',
      position: 1,
      text: 'Buy a Vault row',
      why: '',
      steps: [{ sink: 'vault', ref: 'arcade.acquisition.row-1', fromLevel: 0, toLevel: 1, coins: 1 }],
    };
    const r = result({
      account: { ...result().account, spendPlan: { lines: [line], perCharacter: [] } as never },
      systems: [sys('arcade', { covered: false })],
    });
    expect(reason(r, 'arcade')).toBe('Not covered yet · in the Spend Plan');
    const page = buildSystemPageView(
      r,
      EMPTY_PREFS,
      { roster: [] },
      { ...ui, id: 'arcade', highlight: null },
    );
    expect(page?.spendLines).toEqual([{ lineId: 'l1', text: 'Buy a Vault row' }]);
  });

  it('is null for an id that is not a game System', () => {
    const r = result({ systems: [sys('afk', { kind: 'activeon' })] });
    expect(
      buildSystemPageView(r, EMPTY_PREFS, { roster: [] }, { ...ui, id: 'afk', highlight: null }),
    ).toBeNull();
    expect(
      buildSystemPageView(r, EMPTY_PREFS, { roster: [] }, { ...ui, id: 'nonsense', highlight: null }),
    ).toBeNull();
  });

  it('is deterministic', () => {
    const r = result();
    expect(JSON.stringify(buildSystemsView(r, EMPTY_PREFS, ui))).toBe(
      JSON.stringify(buildSystemsView(r, EMPTY_PREFS, ui)),
    );
  });
});

describe('TR-9: view words are not advice', () => {
  const strings: string[] = [];
  const collect = (v: unknown) => {
    if (typeof v === 'string') strings.push(v);
    else if (typeof v === 'function') strings.push(String((v as (...a: unknown[]) => unknown)(3, 'Anvil')));
    else if (v && typeof v === 'object') Object.values(v).forEach(collect);
  };
  collect(words);

  it('holds no imperative from the Next Action templates and no rating word', () => {
    expect(strings.length).toBeGreaterThan(30);
    expect(strings.filter(isAdviceShaped)).toEqual([]);
  });

  it('SYSTEM_HOMES names only registry Systems', async () => {
    const ctx = await goldenContext();
    const ids = new Set(ctx.kb.systems.map((s) => s.id));
    expect(Object.keys(SYSTEM_HOMES).filter((id) => !ids.has(id))).toEqual([]);
  });
});

// ---- the scrubbed saves through the full engine (US-5 to US-9) ----

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const engineOn = (state: AccountState, now: number) =>
  goldenResult({
    state,
    kb: ctx.kb,
    registries: ctx.registries,
    now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
const scrubbed = (id: string) => {
  const f = fixtures.find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  return { r: engineOn(stateOf(f), f.now), now: f.now };
};
const hubOf = (r: EngineResult, now: number) => buildSystemsView(r, EMPTY_PREFS, { now });
const tilesOf = (r: EngineResult, now: number) => {
  const v = hubOf(r, now);
  return new Map([...v.groups.flatMap((g) => g.tiles), ...(v.later?.tiles ?? [])].map((t) => [t.id, t]));
};
const text = (t: { reason: { text: string }[] } | undefined) => t?.reason.map((s) => s.text).join('');

describe('US-5 to US-7 on scrubbed-w3 (W3-early, 6 characters)', () => {
  const { r, now } = scrubbed('scrubbed-w3');
  const tiles = tilesOf(r, now);

  it('Talent presets is wasting; Anvil and Worship are not, and read their pills', () => {
    expect(tiles.get('talent-presets')?.status).toBe('wasting');
    expect(text(tiles.get('talent-presets'))).toMatch(/^2 to fix before you leave/);
    expect(tiles.get('anvil')?.status).not.toBe('wasting');
    expect(text(tiles.get('anvil'))).toMatch(/· 6 full · collect$/);
    expect(text(tiles.get('worship'))).toMatch(/· 4 full · collect$/);
  });

  it('marks exactly the golden "Not covered yet" Systems not covered (M4 covers Classes, Portals, Skills, the Vault)', () => {
    const notCovered = [...tiles.values()].filter((t) => t.status === 'not-covered').map((t) => t.name);
    expect(notCovered.sort()).toEqual(
      [
        'Bribes',
        'Forge',
        'Quests',
        'Statues',
        'The Owl',
        'Alchemy Pay 2 Win',
        'Islands',
        'Atom Collider',
        'Equinox',
        'Prayers',
        'Salt Lick',
        'Shrines',
      ].sort(),
    );
    expect(text(tiles.get('upgrade-vault'))).toBe('Nothing to fix');
  });

  it('US-6: World 4 is locked by world, no World 5+ group, and the Post Office is locked and behind', () => {
    for (const id of ['lab', 'cooking', 'breeding']) {
      expect(tiles.get(id)?.status).toBe('locked');
      expect(text(tiles.get(id))).toBe('Opens in World 4 · Hyperion Nebula');
      expect(tiles.get(id)?.counts.toDo).toBe(0);
    }
    const v = hubOf(r, now);
    expect(v.groups.map((g) => g.world)).toEqual([0, 1, 2, 3, 4]);
    const po = tiles.get('post-office');
    expect(po?.status).toBe('locked');
    expect(text(po)).toMatch(
      /^Opens once a character reaches class Lv 50 .* · 1 to do · behind for your Stage$/,
    );
    expect(v.needsYou.some((n) => n.id === 'post-office')).toBe(false);
    const page = buildSystemPageView(
      r,
      EMPTY_PREFS,
      { roster: [] },
      { now, id: 'post-office', highlight: null },
    );
    expect(page?.locked).toBe(true);
    expect(page?.goals.map((g) => g.action.text)).toContain(
      "Finish Postboy Pablob's quest: 5 Empty Boxes from Anvil Tab 2",
    );
    expect(page?.unlock?.source?.href).toMatch(/^https:\/\/idleon\.wiki\/wiki\//);
  });

  it('US-8: the Refinery page lists its account Goals and what ActiveOn checks there', () => {
    const page = buildSystemPageView(
      r,
      EMPTY_PREFS,
      { roster: [] },
      { now, id: 'refinery', highlight: null },
    );
    expect(page?.goals.every((g) => g.who === 'Account')).toBe(true);
    expect(page?.goals.some((g) => g.action.text.startsWith('Get 1 more Bullfrog Horn'))).toBe(true);
    const fuel = page?.coverage.checks.find(
      (c) =>
        c.title ===
        r.systems
          ?.find((s) => s.id === 'refinery')
          ?.checks.find((x) => x.entryId === 'refinery.check.fuel-runs-out')?.title,
    );
    expect(fuel?.state).toBe('nothing-to-do');
  });

  it('US-8: the Anvil page shows 6 anvil pills, one per character', () => {
    const page = buildSystemPageView(r, EMPTY_PREFS, buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now }), {
      now,
      id: 'anvil',
      highlight: null,
    });
    expect(page?.pills.map((p) => p.label)).toEqual(Array(6).fill('Anvil full · collect'));
  });

  it('US-9: Equinox is not covered and says so', () => {
    const page = buildSystemPageView(r, EMPTY_PREFS, { roster: [] }, { now, id: 'equinox', highlight: null });
    expect(page?.coverage.covered).toBe(false);
    expect(page?.tile.status).toBe('not-covered');
    expect(page?.wiki).toBe('https://idleon.wiki/wiki/Equinox');
  });

  it('US-12: a big-bubble Next Action sees Alchemy bubbles; a talent-preset blocker sees its Build tab', () => {
    const bubble = r.characters.flatMap((c) => c.goals).find((g) => g.system === 'alchemy-bubbles');
    expect(bubble && seeItSystem(bubble, r)).toBe('alchemy-bubbles');
    expect(SYSTEM_HOMES['talent-presets']?.tab).toBe('build');
  });
});

describe('US-5 and US-7 on scrubbed-w2 (W2-late, 5 characters)', () => {
  const { r, now } = scrubbed('scrubbed-w2');
  const tiles = tilesOf(r, now);

  it('Arcade is wasting; the Barbarian 60 anvil reads "· 1 full · collect" without wasting', () => {
    expect(tiles.get('arcade')?.status).toBe('wasting');
    expect(tiles.get('anvil')?.status).not.toBe('wasting');
    expect(text(tiles.get('anvil'))).toMatch(/· 1 full · collect$/);
  });

  it('the Cards, Stamps, Talent presets and big-bubble rows read "Behind for your Stage"', () => {
    for (const id of ['cards', 'stamps', 'talent-presets', 'alchemy-bubbles']) {
      const t = tiles.get(id);
      if (t?.status !== 'wasting') expect(t?.status).toBe('behind');
    }
    const v = hubOf(r, now);
    const firstBehind = v.needsYou.findIndex((n) => n.status === 'behind');
    expect(v.needsYou.slice(firstBehind).every((n) => n.status !== 'wasting')).toBe(true);
  });

  it('no hub text names a Stage label, "Tier", "rated" or a score', () => {
    const all = JSON.stringify(hubOf(r, now));
    expect(all).not.toMatch(/W\d-(early|mid|late)|Tier|rated|score/);
  });

  it('Not for me on every card line takes Cards off "behind"', () => {
    const keys = (r.behindSystems ?? []).filter((b) => b.systemId === 'cards').flatMap((b) => b.findingKeys);
    const p: NowPrefs = {
      ...EMPTY_PREFS,
      dismissals: Object.fromEntries(keys.map((k) => [k, r.versions.gameBuild])),
    };
    expect(tilesOf(r, now).get('cards')?.status).toBe('behind');
    const after = buildSystemsView(r, p, { now });
    const cards = after.groups.flatMap((g) => g.tiles).find((t) => t.id === 'cards');
    expect(cards?.status).not.toBe('behind');
  });

  it('US-6: World 4 folds into "Later worlds: 3 Systems"', () => {
    expect(hubOf(r, now).later?.label).toBe('Later worlds: 3 Systems');
  });
});

describe('US-5 invariant: a Verdict blocker on Now makes its System wasting (every committed fixture)', () => {
  for (const f of fixtures)
    it(f.id, () => {
      const r = engineOn(stateOf(f), f.now);
      const tiles = tilesOf(r, f.now);
      const blockers = [
        ...r.characters.flatMap((c) =>
          c.goals.filter((g) => c.verdict.blockerKeys.includes(g.nextAction.key)),
        ),
        ...r.account.goals.filter((g) => r.account.blockerKeys.includes(g.nextAction.key)),
      ];
      for (const g of blockers) {
        const id = seeItSystem(g, r);
        const t = id ? tiles.get(id) : undefined;
        if (t && t.status !== 'locked') expect(`${id}: ${t.status}`).toBe(`${id}: wasting`);
      }
      // TR-11 budget, generously: the hub builds well under 3 ms × 2 even in CI.
      const t0 = performance.now();
      hubOf(r, f.now);
      expect(performance.now() - t0).toBeLessThan(50);
    });
});
