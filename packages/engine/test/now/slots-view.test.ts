// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-T3 and FR-T5 (area T): the Parallel Slots grid and the compact AFK strip, through the full engine
// on the scrubbed public saves. Characters are named by class and level only.
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS, isAdviceShaped } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';
import { buildNowView, DEFAULT_UI } from '../../src/now/build-now-view';
import { EMPTY_PREFS } from '../../src/now/prefs';
import { buildSlotsView, SLOT_KINDS } from '../../src/now/slots-view';
import { buildAfkStripView, buildTimelineView } from '../../src/now/timeline-view';
import { AFK_STRIP_WORDS, DAILY_WORDS, SLOTS_WORDS } from '../../src/now/words/time';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const on = (id: string) => {
  const f = fixtures.find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  const state = stateOf(f);
  const r = goldenResult({
    state,
    kb: ctx.kb,
    registries: ctx.registries,
    now: f.now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
  const view = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: f.now });
  const timeline = buildTimelineView(r, EMPTY_PREFS, view, {
    now: f.now,
    lastCloudSave: state.account.lastCloudSave,
  });
  return { r, view, timeline, now: f.now };
};

describe('FR-T3 the Parallel Slots grid on scrubbed-w3 (W3-early, 6 characters)', () => {
  const { r, view } = on('scrubbed-w3');
  const v = buildSlotsView(r, view);

  it('has a row per character in the Roster order and the five columns in the Lab order', () => {
    expect(v?.rows.map((x) => x.index)).toEqual(view.roster.map((x) => x.index));
    expect(v?.columns.map((c) => c.kind)).toEqual([...SLOT_KINDS]);
    expect(v?.rows.every((x) => x.cells.length === 5)).toBe(true);
  });

  it("each cell carries M20's own words and a state word, never cut", () => {
    for (const row of v?.rows ?? [])
      for (const c of row.cells) {
        expect(c.text.length).toBeGreaterThan(0);
        expect(c.text).not.toMatch(/…|\.\.\.$/);
        expect(c.a11y).toContain(c.stateWord);
      }
  });

  it('exactly one NOW cell, from the fill order: the empty cog seat the first slot Goal fills', () => {
    const now = v?.rows.flatMap((x) => x.cells.filter((c) => c.now).map((c) => ({ i: x.index, k: c.kind })));
    expect(now).toHaveLength(1);
    expect(v?.now?.kind).toBe('cog');
    const goal = r.account.goals.find((g) => g.nextAction.key === v?.now?.key);
    expect(goal?.id).toBe('construction.check.cog-seat-free');
    const cell = v?.rows.find((x) => x.index === v?.now?.index)?.cells.find((c) => c.kind === 'cog');
    expect(cell?.state).toBe('fillable');
    // DS-18: the step is about 12 words.
    expect(v?.now?.text.split(/\s+/).length).toBeLessThanOrEqual(12);
  });

  it('counts each column in units, and the tray says each character once per slot kind', () => {
    const cog = v?.columns.find((c) => c.kind === 'cog');
    expect(cog?.count).toBe('5 of 6 in use · 1 free');
    const worship = v?.columns.find((c) => c.kind === 'worship');
    expect(worship?.count).toBe('6 of 6 in use · 4 full');
    for (const t of v?.tray ?? []) expect(new Set(t.who.map((w) => w.index)).size).toBe(t.who.length);
    expect(v?.tray[0]?.now).toBe(true);
  });
});

describe('FR-T3 on scrubbed-w2 (before W3)', () => {
  it('the W3 slots read "Not open yet", and there is no NOW cell', () => {
    const { r, view } = on('scrubbed-w2');
    const v = buildSlotsView(r, view);
    const cog = v?.rows.flatMap((x) => x.cells.filter((c) => c.kind === 'cog'));
    expect(cog?.every((c) => c.tone === 'closed' && c.stateWord === 'Not open yet')).toBe(true);
    expect(v?.now).toBeNull();
    expect(v?.columns.find((c) => c.kind === 'cauldron')?.count).toBe('5 of 5 in use');
  });
});

describe('FR-T5 the compact AFK strip', () => {
  it('marks each character at its first binding limit and says the first one in one sentence', () => {
    const { timeline, view } = on('scrubbed-w3');
    const strip = buildAfkStripView(timeline, view);
    expect(strip?.marks.map((m) => m.index).sort()).toEqual(view.roster.map((x) => x.index).sort());
    expect(strip?.marks.every((m) => m.beforeReturn)).toBe(true);
    expect(strip?.before).toBeGreaterThan(0);
    expect(strip?.sentence).toMatch(
      /^\d+ limits bind before you're back: the .+ on .+ first, (full now|in \d)/,
    );
    // It reads only the Timeline's own bars: the badge count is the bars before the return.
    const before = timeline?.lanes.flatMap((l) => l.bars).filter((b) => b.state === 'open' && b.beforeReturn);
    expect(strip?.before).toBe(before?.length);
  });

  it('is null without a Timeline, and says nothing binds when nothing does', () => {
    const { view } = on('scrubbed-w3');
    expect(buildAfkStripView(null, view)).toBeNull();
    const { timeline } = on('scrubbed-w3');
    if (!timeline) throw new Error('scrubbed-w3 has a Timeline');
    const quiet = { ...timeline, lanes: timeline.lanes.map((l) => ({ ...l, bars: [] })) };
    expect(buildAfkStripView(quiet, view)?.sentence).toBe(AFK_STRIP_WORDS.nothing);
  });
});

describe('TR-9: the Time area words are not advice', () => {
  it('holds no imperative from the Next Action templates and no rating word', () => {
    const strings: string[] = [];
    const collect = (v: unknown) => {
      if (typeof v === 'string') strings.push(v);
      else if (typeof v === 'function')
        strings.push(String((v as (...a: unknown[]) => unknown)(3, 'anvil', 'x', 'y')));
      else if (v && typeof v === 'object') Object.values(v).forEach(collect);
    };
    collect([AFK_STRIP_WORDS, SLOTS_WORDS, DAILY_WORDS]);
    expect(strings.filter(isAdviceShaped)).toEqual([]);
  });
});
