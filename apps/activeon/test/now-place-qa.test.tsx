// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 QA (Q2) fixes in the Now and Characters places: the phone layout that set a 572 px column (P0),
// the Now button's light contrast (P1-12), and the P2/P3 copy and layout items. The layout itself is
// measured in a browser by scripts/layout/jitter.mjs (jsdom has no layout); here the CSS that holds it
// is pinned, with the words and the DOM.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { NowView } from '@idleon-forge/engine/now';
import type { EngineResult, Goal } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CHARACTERS_PLACE_WORDS as C, NOW_PLACE_WORDS as W } from '../src/now/place/words';
import { TAB_HEALTH } from '../src/now/tab-health';
import { fixture, props, renderNow, saveOf } from './now-helpers';

const SRC = resolve(import.meta.dirname, '../src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
/** The declarations of the first rule whose selector is exactly `sel`. */
const rule = (css: string, sel: string): string => {
  const at = css.indexOf(`\n${sel} {`);
  if (at < 0) throw new Error(`no rule ${sel}`);
  return css.slice(at, css.indexOf('}', at));
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

describe('P0: the Now column never grows past a 390 px phone', () => {
  it('the Now grid has one shrinkable track, and the avatar rows wrap', () => {
    expect(rule(read('styles/now.css'), '.n-now')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    const place = read('now/place/place.css');
    for (const sel of ['.np-job__who', '.np-then__who']) {
      expect(rule(place, sel)).toMatch(/flex-wrap:\s*wrap/);
      expect(rule(place, sel)).toMatch(/min-width:\s*0/);
    }
  });

  it('P3: a round number of two digits stays on one line', () => {
    const n = rule(read('now/place/place.css'), '.np-stop__n');
    expect(n).toMatch(/white-space:\s*nowrap/);
    expect(n).not.toMatch(/\swidth:\s*20px/);
  });
});

describe("P1-12: the Now place's filled button reads 4.5:1 in both themes", () => {
  it('uses the theme ink on --accent (tested 4.5:1 by contrast.test.ts), not a fixed dark ink', () => {
    const place = read('now/place/place.css');
    expect(rule(place, '.np-btn')).toMatch(/color:\s*var\(--on-accent\)/);
    expect(place).not.toMatch(/--accent-ink/);
  });

  it('the Now and Characters stylesheets only read custom properties that are defined', () => {
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(d, e.name)) : /\.(css|tsx)$/.test(e.name) ? [join(d, e.name)] : [],
      );
    const all = walk(SRC)
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    // Defined in a stylesheet, or set inline by a component (`style={{ '--x': … }}`).
    const defined = new Set([...all.matchAll(/['"]?(--[\w-]+)['"]?\s*:/g)].map((m) => m[1]));
    for (const f of ['now/place/place.css', 'characters/place.css', 'styles/now.css']) {
      // A var() with a fallback may name an optional token; one without must be defined.
      const bare = [...read(f).matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]);
      expect(
        bare.filter((v) => !defined.has(v)),
        f,
      ).toEqual([]);
    }
  });
});

describe('P2: Rounds says each thing once, and every pip has a word', () => {
  it('"all safe to leave" only when nothing is full either', () => {
    expect(W.roundSummary(6, 3, 0, 9)).toBe('6 characters · 3 maps · 9 full things to collect');
    expect(W.roundSummary(6, 3, 0, 0)).toBe('6 characters · 3 maps · all safe to leave');
    expect(W.roundSummary(6, 3, 2, 9)).toBe('6 characters · 3 maps · 2 fixes first');
    expect(W.roundLine(6, 0, 1)).toBe('6 characters, one job each · 1 full thing to collect');
  });

  it('M25: every round stop and the next one wear the game class icon (ClassBadge), as on Characters', async () => {
    const r: EngineResult = fixture('mid-session');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    // The badge is a lazy chunk: the bare blob draws first.
    await waitFor(() => expect(document.querySelector('.np-next .cb .cb__icon img')).not.toBeNull());
    const stops = [...document.querySelectorAll('.np-stop__pic')];
    expect(stops.length).toBeGreaterThan(0);
    for (const s of stops)
      expect(s.querySelector('.cb .cb__icon img')?.getAttribute('src')).toMatch(/ClassIcons\d+/);
    expect(document.querySelector('.np-next .cb .cb__icon img')).not.toBeNull();
    // On a phone the card's blob hides; its badge hides with it.
    expect(read('now/place/place.css')).toMatch(
      /\.np-card__top \.a-blob,\s*\.np-card__top \.cb \{\s*display: none;/,
    );
  });

  it('a card whose task is a shown "Same job" points there; no card chip is a lone pip', () => {
    const r: EngineResult = fixture('mid-session');
    const job = r.characters.find((c) => c.index === 1)?.goals[0] as Goal;
    const elm = r.characters.find((c) => c.index === 4);
    if (!elm) throw new Error('fixture');
    elm.goals = [{ ...job, nextAction: { ...job.nextAction, key: `${job.nextAction.entryId}@c4` } }];
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByText("Picked Rounds: you're on your rounds")).toBeTruthy();
    const card = screen.getByRole('region', { name: /^Same job on 2: / });
    const said = (card.getAttribute('aria-label') ?? '').replace(/^Same job on \d+: /, '').toLowerCase();
    const tasks = [...document.querySelectorAll('.np-stop__task')].map((t) => t.textContent?.toLowerCase());
    expect(tasks.filter((t) => t?.startsWith(said))).toEqual([]);
    expect(tasks.filter((t) => t === W.sameJobBelow.toLowerCase())).toHaveLength(2);
    for (const chip of document.querySelectorAll('.np-stop__chip'))
      expect(chip.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });
});

describe('P2: one framed block on Now when the save is stale', () => {
  it('the stale banner leads; the hero and the round step down to plain', () => {
    const r = fixture('mid-session');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste', 9 * 24 * 3_600_000)));
    expect(document.querySelector('.n-vb--stale')).toBeTruthy();
    expect(document.querySelectorAll('.n-now .a-frame')).toHaveLength(0);
    fireEvent.click(screen.getByRole('radio', { name: 'Log off' }));
    expect(document.querySelectorAll('.n-now .a-frame')).toHaveLength(0);
  });
});

describe('P2: Characters reads each state once', () => {
  it('"Can\'t tell" is never followed by "can\'t tell" again, and the small words never repeat the big one', () => {
    expect(C.stateWhy.unknown.toLowerCase()).not.toContain("can't tell");
    expect(C.small.gear?.behind).not.toMatch(/behind/);
    expect(C.small.gear?.fix).not.toMatch(/held/);
  });

  it('the state word and its reason are two parts on the Characters page', async () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/#characters');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    await screen.findByRole('heading', { level: 2, name: 'Characters' });
    const states = [...document.querySelectorAll('.cp-who-t .cp-xs')].map((e) => e.textContent ?? '');
    expect(states.length).toBeGreaterThan(0);
    for (const s of states)
      expect(s).toMatch(/^(Fix first|Collect · .+|Ready · nothing full|Can't tell · from the save)$/);
  });

  it('gear health counts armour, weapon and jewellery, never the skilling tools', () => {
    const slot = (s: string, state: string) => ({ slot: s, state, levelsBehind: null });
    const view = (slots: ReturnType<typeof slot>[]) =>
      ({ gear: { characters: [{ index: 0, slots }] } }) as unknown as NowView;
    const gear = TAB_HEALTH.gear as (v: NowView, i: number) => { level: string; word: string } | null;
    expect(gear(view([slot('pickaxe', 'empty'), slot('rod', 'empty'), slot('helmet', 'ok')]), 0)?.level).toBe(
      'ok',
    );
    expect(gear(view([slot('pickaxe', 'empty'), slot('helmet', 'empty')]), 0)?.word).toBe('1 empty slot');
  });
});
