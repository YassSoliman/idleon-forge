// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 Integration (spec §9 "I"), engine side, through the full engine on the scrubbed public saves:
// the Times setting on the Timeline and the AFK strip (G10), the save's age on the Build marker,
// SourceView's verified date and the session facts' grouped-job sentences (groupTexts in SessionFacts). Characters are named by class and level only.
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';
import { buildNowView, DEFAULT_UI, sourceView } from '../../src/now/build-now-view';
import { asOfLine, buildKnownLine, pathMarker, saveAgo } from '../../src/now/characters-ui';
import { EMPTY_PREFS } from '../../src/now/prefs';
import { buildAfkStripView, buildTimelineView, timeIn } from '../../src/now/timeline-view';
import type { EngineResult, SourceRef } from '../../src/result';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const results = new Map<string, { r: EngineResult; now: number }>();
const run = (id: string) => {
  const hit = results.get(id);
  if (hit) return hit;
  const f = fixtures.find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  const r = goldenResult({
    state: stateOf(f),
    kb: ctx.kb,
    registries: ctx.registries,
    now: f.now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
  const out = { r, now: f.now };
  results.set(id, out);
  return out;
};

const M = 60_000;
const H = 60 * M;

describe('G10: the Timeline and the AFK strip follow the Times setting', () => {
  const { r, now } = run('scrubbed-w3');
  const view = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now });
  const tl = (times?: 'relative' | 'clock') =>
    buildTimelineView(r, EMPTY_PREFS, view, { now, lastCloudSave: now, tzOffsetMinutes: 0, times });
  const timedBars = (t: ReturnType<typeof tl>) =>
    (t?.lanes ?? []).flatMap((l) => l.bars).filter((b) => !b.untimed && b.at !== null && b.at > now);

  it('a moment reads "in 3h 10m", "around 01:20", or both ways without a setting', () => {
    const at = now + 3 * H + 10 * M;
    expect(timeIn(at, now, 0, 'relative')).toBe('in 3h 10m');
    expect(timeIn(at, now, 0, 'clock')).toMatch(/^around \d\d:\d\d$/);
    expect(timeIn(at, now, 0)).toMatch(/^in 3h 10m · \d\d:\d\d$/);
  });

  it('every timed bar and the Back label use the chosen style; no setting keeps both (the golden)', () => {
    const rel = tl('relative');
    const clock = tl('clock');
    const both = tl();
    expect(timedBars(rel).length).toBeGreaterThan(0);
    for (const b of timedBars(rel)) expect(b.timeText).toMatch(/^(later · )?in \d+[dhm]/);
    for (const b of timedBars(rel)) expect(b.timeText).not.toMatch(/\d\d:\d\d/);
    for (const b of timedBars(clock)) expect(b.timeText).toMatch(/^(later · )?around \d\d:\d\d$/);
    for (const b of timedBars(both)) expect(b.timeText).toMatch(/in \d+[dhm].* · \d\d:\d\d$/);
    expect(rel?.axis.backLabel).toMatch(/^Back in \d+h \d\dm$/);
    expect(clock?.axis.backLabel).toMatch(/^Back around \d\d:\d\d$/);
    expect(both?.axis.backLabel).toMatch(/^Back in \d+h \d\dm · \d\d:\d\d$/);
  });

  it("the AFK strip's sentence says its first limit in the same style", () => {
    const rel = buildAfkStripView(tl('relative'), view, { times: 'relative' });
    const clock = buildAfkStripView(tl('clock'), view, { times: 'clock', tzOffsetMinutes: 0 });
    expect(rel?.sentence).toBeTruthy();
    expect(clock?.before).toBe(rel?.before);
    const timed = rel?.marks.find((m) => m.at > now && m.beforeReturn);
    if (timed) {
      expect(clock?.marks.find((m) => m.index === timed.index)?.when).toMatch(/^around \d\d:\d\d$/);
      expect(timed.when).toMatch(/^in \d+[dhm]/);
    }
  });
});

describe("the Build marker says the save's age (area C's request)", () => {
  it('NowView.saveAgeMinutes is whole minutes since the last cloud save, null without one', () => {
    const { r, now } = run('scrubbed-w3');
    expect(
      buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now, lastCloudSave: now - 12 * M - 30_000 })
        .saveAgeMinutes,
    ).toBe(12);
    expect(
      buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now, lastCloudSave: null }).saveAgeMinutes,
    ).toBeNull();
  });

  it('"as of your last save (12m ago)", "just now" under a minute, and nothing when unknown', () => {
    expect(saveAgo(12)).toBe(' (12m ago)');
    expect(saveAgo(0)).toBe(' (just now)');
    expect(saveAgo(null)).toBe('');
    expect(asOfLine(130)).toBe('as of your last save (2h 10m ago)');
    expect(asOfLine(null)).toBe('as of your last save');
    expect(buildKnownLine(70, 12)).toBe(
      'As of your last save (12m ago): at least 70 points waiting · they end here',
    );
    expect(buildKnownLine(70)).toBe('As of your last save: at least 70 points waiting · they end here');
    const bound = { tab: 1, path: [], known: { kind: 'bound' as const, points: 70, overBy: null } };
    expect(pathMarker(bound, 5)).toBe(
      'As of your last save (5m ago): at least 70 points waiting · they end here',
    );
  });
});

describe("SourceView carries its main Source's verified date (the why sheet)", () => {
  const wiki: SourceRef = {
    tier: 2,
    label: 'IdleOn Wiki: Smithing',
    url: 'https://idleon.wiki/wiki/Smithing',
    verifiedOn: '2026-10-18',
  } as SourceRef;
  const toolbox: SourceRef = {
    tier: 1,
    label: 'IdleOn Toolbox',
    url: 'https://idleontoolbox.com/',
    verifiedOn: '2026-10-17',
    gameVersion: '2.3.540',
  } as SourceRef;

  it('the best player-facing Source dates the line; the Toolbox page fallback has no date', () => {
    expect(sourceView([wiki, toolbox], false, 'anvil.check.x').verifiedOn).toBe('2026-10-18');
    expect(sourceView([toolbox], false, 'anvil.check.x').verifiedOn).toBeNull();
  });
});

describe("SessionFacts carries the grouped-job sentences (area N's request)", () => {
  it('result.session.groupTexts is typed on SessionFacts, by entry id, with no placeholder', () => {
    const { r } = run('scrubbed-w3');
    const texts = r.session?.groupTexts ?? {};
    for (const [id, text] of Object.entries(texts)) {
      expect(id).toMatch(/\.check\./);
      expect(text).not.toContain('{');
    }
  });
});
