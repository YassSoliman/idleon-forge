// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 Phase 2 in the DOM (TR-14 component tests): the Timeline item in the Places bar (US-1), lanes in
// the Roster's order with the Back marker (US-10), outlined bars and their fix links (US-11, FR-27),
// repeats said once, untimed limits, the stale save first (§6), the board hidden from assistive tech
// in a focusable frame (TR-13), "See it: Timeline" and the All set link (FR-31, FR-32), the TR-9
// provenance check and axe.
import {
  buildAfkStripView,
  buildNowView,
  buildTimelineView,
  DEFAULT_UI,
  EMPTY_PREFS,
  KIND_WORDS,
  SLOTS_WORDS,
  TIMELINE_WORDS,
} from '@idleon-forge/engine/now';
import type { EngineResult, InfoLine, SystemSummary, TimelineBar } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AfkStrip } from '../src/timeline/AfkStrip';
import { withM20 } from './helpers/m20-result';
import { fixture, props, renderNow, saveOf } from './now-helpers';

const NOW = 1_792_260_000_000;
const H = 3_600_000;

// The Timeline is a lazy chunk: under a cold full suite its first import can take longer than Testing
// Library's 1 s default, so warm the module once and give the heading a CI-aware wait (R7 QA flake).
const ARRIVE = { timeout: process.env.CI ? 15_000 : 5_000 };
const timelineHeading = () => screen.findByRole('heading', { level: 2, name: 'Timeline' }, ARRIVE);
vi.setConfig({ testTimeout: ARRIVE.timeout + 5_000 });
beforeAll(async () => {
  await import('../src/timeline/TimelinePlace');
}, 30_000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function noAxeViolations(container: HTMLElement) {
  const res = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([]);
}

const sys = (id: string, name: string, kind: 'game' | 'activeon' = 'game'): SystemSummary => ({
  id,
  name,
  kind,
  world: 1,
  scope: 'account',
  unlocked: 'yes',
  unlockBy: 'always',
  covered: true,
  unlock: null,
  wiki: null,
  checks: [],
});

const bar = (entryId: string, subject: string, over: Partial<TimelineBar> = {}): TimelineBar => ({
  barId: `${entryId}@${subject}`,
  key: `${entryId}@${subject}`,
  entryId,
  system: entryId.split('.')[0] ?? entryId,
  subject: subject as TimelineBar['subject'],
  kind: 'storage',
  what: 'anvil',
  at: Date.now() + H,
  untimed: false,
  effect: 'blocker',
  fixHolds: true,
  ...over,
});

const pill = (index: number): InfoLine => ({
  key: `anvil.check.caps-before-return@c${index}`,
  text: 'Collect Thread from the anvil',
  sources: [],
  kind: 'cap',
  label: 'Anvil full · collect',
  at: Date.now() - H,
});

/**
 * mid-session (Visit Order 3, 0, 4, 1, 2) with Timeline bars: Dahlia's health food runs out before
 * Back (a blocker), three anvils full now (pills), Elm's health food untimed, and the 7th account
 * Goal's bar (behind M10's "show more").
 */
function withTimeline(over: Partial<EngineResult> = {}): EngineResult {
  const r = fixture('mid-session');
  const now = Date.now();
  r.characters = r.characters.map((c) =>
    c.index <= 2 ? { ...c, info: [pill(c.index), ...(c.info ?? [])] } : c,
  );
  const extra = Array.from({ length: 6 }, (_, i) => {
    const base = r.account.goals[0];
    if (!base) throw new Error('mid-session has an account Goal');
    return {
      ...base,
      id: `arcade.check.g${i}`,
      system: 'arcade',
      nextAction: {
        ...base.nextAction,
        key: `arcade.check.g${i}@account`,
        entryId: `arcade.check.g${i}`,
        text: `Arcade line ${i}`,
      },
    };
  });
  r.account = { ...r.account, goals: [...r.account.goals, ...extra] };
  return {
    ...r,
    systems: [sys('afk', 'AFK safety', 'activeon'), sys('anvil', 'Anvil'), sys('arcade', 'Arcade')],
    behindSystems: [],
    unknownFindings: [],
    returnAt: now + 8 * H,
    timeline: [
      bar('anvil.check.caps-before-return', 'c0', { effect: 'pill', at: now - H }),
      bar('anvil.check.caps-before-return', 'c1', { effect: 'pill', at: now - H }),
      bar('anvil.check.caps-before-return', 'c2', { effect: 'pill', at: now - H }),
      bar('afk.check.health-food-runs-out', 'c3', { kind: 'food', what: 'health food', at: now + 2 * H }),
      bar('afk.check.low-food-untimed', 'c4', {
        kind: 'food',
        what: 'health food',
        at: null,
        untimed: true,
        effect: 'next-action',
      }),
      bar('arcade.check.g5', 'account', {
        kind: 'bank',
        what: 'Arcade balls',
        effect: 'next-action',
        at: now + 3 * H,
      }),
    ],
    ...over,
  };
}

const places = () => screen.getByRole('navigation', { name: 'Places' });
const openTimeline = async (r: EngineResult, savedAgoMs = 30_000) => {
  window.history.replaceState(null, '', '/#timeline');
  const out = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste', savedAgoMs)));
  await timelineHeading();
  return out;
};
const lists = () => document.querySelector('.tl-lists') as HTMLElement;

describe('US-1: the Timeline joins the Places bar (D-1)', () => {
  it('lists Now, Characters, Systems and Timeline, in that order, and no Map', async () => {
    const r = withTimeline();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const links = within(places()).getAllByRole('link');
    expect(links.map((l) => l.querySelector('.place-label')?.textContent)).toEqual([
      'Now',
      'Characters',
      'Systems',
      'Timeline',
    ]);
    expect(screen.queryByText('Map')).toBeNull();
    fireEvent.click(within(places()).getByRole('link', { name: 'Timeline' }));
    await timelineHeading();
    expect(window.location.hash).toBe('#timeline');
    expect(document.title).toBe('Timeline · ActiveOn');
    expect(within(places()).getByRole('link', { current: 'page' }).textContent).toBe('Timeline');
  });
});

describe('US-10: lanes, the Back marker and what binds before it', () => {
  it('has one lane per character in the Roster order, then the account band, with the Back time', async () => {
    const r = withTimeline();
    const { container } = await openTimeline(r);
    const heads = [...lists().querySelectorAll('.tl-lane-link')].map((a) => a.textContent);
    expect(heads).toEqual(['1 · Dahlia', '2 · Alder', '3 · Elm', '4 · Birch', '5 · Cedar', 'Arcade']);
    expect(screen.getByText(/^Back in 8h 00m · \d\d:\d\d$/)).toBeTruthy();
    await noAxeViolations(container);
  });

  it('outlines the blocker before Back with the words and a fix link, and reads the US-10 sentence', async () => {
    await openTimeline(withTimeline());
    const lane = screen.getByRole('region', { name: '1 · Dahlia' });
    const item = lane.querySelector('.tl-item.outlined') as HTMLElement;
    expect(item.textContent).toContain('health food runs out · in 2h 00m');
    expect(item.textContent).toContain("before you're back");
    expect(
      within(item).getByText(/^health food runs out in 2h 00m, at \d\d:\d\d, before you're back$/),
    ).toBeTruthy();
    expect(within(item).getByRole('link', { name: 'See the fix: health food runs out' })).toBeTruthy();
  });

  it('says a repeated pill once, "the same on 2 more", with a See it link to each character', async () => {
    await openTimeline(withTimeline());
    expect(
      within(lists()).getAllByText(
        (_, el) =>
          el?.classList.contains('tl-item-text') === true &&
          /Anvil full · collect/.test(el.textContent ?? ''),
      ),
    ).toHaveLength(1);
    const more = within(lists()).getByText('the same on 2 more');
    expect(more.tagName).toBe('SUMMARY');
    expect(within(lists()).getByRole('link', { name: 'See it: Anvil full · collect' })).toBeTruthy();
  });

  it('points a lane whose only bar is grouped to the group above, never "Nothing timed here"', async () => {
    await openTimeline(withTimeline());
    expect(
      within(lists()).getAllByText(
        (_, el) => el?.textContent === 'In the group above · Anvil full · collect' && el.tagName === 'P',
      ),
    ).toHaveLength(2);
    expect(within(lists()).queryAllByText(TIMELINE_WORDS.nothingTimed)).toHaveLength(0);
  });

  it('lists an untimed limit as "can\'t tell when", with no bar', async () => {
    await openTimeline(withTimeline());
    const lane = screen.getByRole('region', { name: '3 · Elm' });
    expect(within(lane).getByText("health food runs out, can't tell when")).toBeTruthy();
  });

  it('draws the board aria-hidden in one labelled, focusable frame with nothing focusable inside', async () => {
    await openTimeline(withTimeline());
    const frame = screen.getByRole('region', { name: TIMELINE_WORDS.scrollLabel });
    expect(frame.getAttribute('tabindex')).toBe('0');
    const board = frame.querySelector('.tl-board') as HTMLElement;
    expect(board.getAttribute('aria-hidden')).toBe('true');
    expect(board.querySelectorAll('a, button, [tabindex]')).toHaveLength(0);
  });
});

describe('US-11: from the bar to the fix (FR-27)', () => {
  it("opens the character's Now tab with the Next Action outlined; the page belongs to the Timeline", async () => {
    await openTimeline(withTimeline());
    fireEvent.click(within(lists()).getByRole('link', { name: 'See the fix: health food runs out' }));
    expect(window.location.hash).toBe('#now-3');
    const na = document.querySelector('[data-na-key="afk.check.health-food-runs-out@c3"]');
    expect(na?.classList.contains('lit')).toBe(true);
    expect(within(places()).getByRole('link', { current: true }).textContent).toBe('Timeline');
    fireEvent.click(screen.getByRole('button', { name: '← back' }));
    await timelineHeading();
    expect(window.location.hash).toBe('#timeline');
  });

  it('expands "show more" first for an account Next Action past the cap', async () => {
    await openTimeline(withTimeline());
    fireEvent.click(within(lists()).getByRole('link', { name: 'See the fix: Arcade balls lost' }));
    expect(window.location.hash).toBe('#now');
    const na = document.querySelector('[data-na-key="arcade.check.g5@account"]');
    expect(na?.classList.contains('lit')).toBe(true);
  });
});

describe('§6: states', () => {
  it("puts the stale save's age first", async () => {
    await openTimeline(withTimeline(), 9 * H + 28 * 60_000);
    const place = document.querySelector('.timeline-place') as HTMLElement;
    const first = place.querySelector('h2')?.nextElementSibling;
    expect(first?.textContent).toBe('Your last save is 9h 28m old: these times are projected from it.');
  });

  it('says the Timeline needs AFK safety without M3 (no returnAt)', async () => {
    const { returnAt: _, timeline: __, ...rest } = withTimeline();
    await openTimeline(rest as EngineResult);
    expect(screen.getByText(TIMELINE_WORDS.unavailable)).toBeTruthy();
  });
});

describe('FR-31, FR-32: links into the Timeline', () => {
  it('an afk Next Action on Now reads "See it: Timeline"', async () => {
    const r = withTimeline();
    window.history.replaceState(null, '', '/#now-3');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('link', { name: 'See it: Timeline' }));
    await timelineHeading();
  });

  it("the All set banner's first-fill text links to the Timeline", async () => {
    const r = { ...fixture('all-set'), returnAt: Date.now() + 8 * H, timeline: [] };
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    fireEvent.click(screen.getByRole('link', { name: /^First thing fills up in/ }));
    await timelineHeading();
  });
});

describe('TR-9: the Timeline adds no words of its own', () => {
  it('every text node is a builder string or a view word', async () => {
    const r = withTimeline();
    await openTimeline(r);
    const nowView = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: Date.now() });
    const view = buildTimelineView(r, EMPTY_PREFS, nowView, {
      now: Date.now(),
      lastCloudSave: Date.now() - 30_000,
      tzOffsetMinutes: -new Date().getTimezoneOffset(),
    });
    const allowed = new Set<string>([' · ', ' ']);
    const collect = (v: unknown) => {
      if (typeof v === 'string' || typeof v === 'number') allowed.add(String(v));
      else if (typeof v === 'function') allowed.add(String((v as (n: number) => string)(2)));
      else if (v && typeof v === 'object') Object.values(v).forEach(collect);
    };
    collect(view);
    // M21: the lane heads' class and level, the map, and the "Back in" chips are the Now view's own.
    collect(nowView);
    collect(TIMELINE_WORDS);
    collect(KIND_WORDS);
    // The lanes part; the Parallel Slots and Daily & Weekly sections have their own tests.
    const place = document.querySelector('.tl-lanes-part') as HTMLElement;
    const texts: string[] = [];
    const walk = document.createTreeWalker(place, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) if (walk.currentNode.textContent) texts.push(walk.currentNode.textContent);
    const odd = texts.filter((t) => !allowed.has(t) && !allowed.has(t.trim()));
    expect(odd).toEqual([]);
  });
});

describe('M21 FR-T1: the return-time control and the NOW box', () => {
  it('"Back in" is one radio group of the Expected Return chips; a pick sets the return', async () => {
    const r = withTimeline();
    const set = vi.fn();
    window.history.replaceState(null, '', '/#timeline');
    const { container } = renderNow(
      props(r, saveOf(r, 1, 'first', null, 'paste'), { setExpectedReturn: set }),
    );
    await timelineHeading();
    const group = screen.getByRole('group', { name: TIMELINE_WORDS.backInLabel });
    expect(within(group).getAllByRole('radio').length).toBeGreaterThanOrEqual(5);
    fireEvent.click(within(group).getByRole('radio', { name: '4h' }));
    expect(set).toHaveBeenCalledWith(4 * 3600);
    await noAxeViolations(container);
  });

  it('the NOW box names the first limit with a fix before Back, with who and its fix link', async () => {
    await openTimeline(withTimeline());
    const box = document.querySelector('.tl-next') as HTMLElement;
    expect(box.textContent).toContain(TIMELINE_WORDS.nowBadge);
    expect(box.textContent).toContain('health food runs out · in 2h 00m');
    expect(within(box).getByRole('link', { name: 'See the fix: health food runs out' })).toBeTruthy();
    // On the board, that bar carries the Now tag (the board itself stays aria-hidden).
    expect(document.querySelectorAll('.tl-board .tl-bar.is-now')).toHaveLength(1);
  });

  it('draws a who-glyph on every character lane head, and no slot codes or names on the board', async () => {
    await openTimeline(withTimeline());
    const heads = [...document.querySelectorAll('.tl-lanes .tl-head')];
    expect(heads.filter((h) => h.querySelector('.who'))).toHaveLength(5);
    const board = document.querySelector('.tl-board')?.textContent ?? '';
    expect(board).not.toMatch(/\bC\d\b|Dahlia|Alder/);
  });
});

describe('M21 FR-T3: the Parallel Slots grid (#slots)', () => {
  it('a table of characters by the five slots, a word and a glyph per cell, counts in units', async () => {
    const r = withM20(withTimeline());
    window.history.replaceState(null, '', '/#slots');
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    await screen.findByRole('heading', { level: 3, name: SLOTS_WORDS.title }, ARRIVE);
    const table = screen.getByRole('table');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual([SLOTS_WORDS.character, 'Cauldron', 'Traps', 'Worship', 'Cog Board', 'Printer']);
    expect(table.textContent).toContain('builds on the Cog Board');
    expect(table.textContent).toContain(SLOTS_WORDS.states.filled);
    await noAxeViolations(container);
  });
});

describe('M21 FR-T5: the compact AFK strip', () => {
  it('one link to the Timeline: a who-glyph per character, the flag, and the sentence as its name', async () => {
    const r = withTimeline();
    const nowView = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: Date.now() });
    const tl = buildTimelineView(r, EMPTY_PREFS, nowView, { now: Date.now(), lastCloudSave: Date.now() });
    const strip = buildAfkStripView(tl, nowView);
    const open = vi.fn();
    const { container } = render(<AfkStrip strip={strip} families={nowView.families} onOpen={open} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('#timeline');
    expect(link.getAttribute('aria-label')).toMatch(/^\d+ limits? binds? before you're back: the .+ first, /);
    expect(container.querySelectorAll('.afk-mark .who').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.afk-mark.is-fix').length).toBeGreaterThan(0);
    fireEvent.click(link);
    expect(open).toHaveBeenCalled();
    await noAxeViolations(container);
  });
});
