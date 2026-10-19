// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the Map's own words (TR-9: never advice) and the Timeline tabs switching their panels.
import { isAdviceShaped } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { MAP_UI_WORDS } from '../src/map/words';

describe("TR-9: the Map's M24 words are not advice", () => {
  it('holds no imperative from the Next Action templates and no rating word', () => {
    const strings: string[] = [];
    const collect = (v: unknown) => {
      if (typeof v === 'string') strings.push(v);
      else if (typeof v === 'function') {
        const f = v as (...a: unknown[]) => unknown;
        // Number and string slots, or list slots (the ranks, who fights here).
        try {
          strings.push(String(f(3, 2, 'Bowman 60')));
        } catch {
          strings.push(String(f([25_000, 100_000], ['Bowman 60', 'Squire 77'])));
        }
      } else if (v && typeof v === 'object') Object.values(v).forEach(collect);
    };
    collect(MAP_UI_WORDS);
    expect(strings.length).toBeGreaterThan(40);
    expect(strings.filter(isAdviceShaped)).toEqual([]);
  });
});

describe('M24 QA: the Map hero lines', () => {
  it('P3: says "in about 26m", never "about in 26m"', () => {
    expect(MAP_UI_WORDS.heroWho('Bowman 81', 'in 26m')).toBe(
      'Bowman 81 is there · in about 26m at its kill rate',
    );
    expect(MAP_UI_WORDS.heroWho('Bowman 81', '26m')).toBe('Bowman 81 is there · about 26m at its kill rate');
    expect(MAP_UI_WORDS.heroWho('Bowman 81', null)).toBe('Bowman 81 is there');
  });

  it('P2 (no text walls): the Constellations hero keeps its first sentences, about two lines', async () => {
    const { leadOf } = await import('../src/map/MapPlace');
    const wall =
      '4,994 more kills there open Where the Branches End; time to open it: about 2h at its kill rate. ' +
      'The Telescope is at the top of the big tree; you open the way once, on this one character. ' +
      'Constellations pay Star Chart Points that unlock star signs. After this, 8 constellations are ready.';
    const lead = leadOf(wall);
    expect(lead).toBe(
      '4,994 more kills there open Where the Branches End; time to open it: about 2h at its kill rate. ' +
        'The Telescope is at the top of the big tree; you open the way once, on this one character.',
    );
    expect(lead.length).toBeLessThanOrEqual(200);
    // A decimal ("2.3B") is not a sentence end, and one long sentence is kept whole.
    expect(leadOf('Costs 2.3B coins in all. Then more.', 26)).toBe('Costs 2.3B coins in all.');
    expect(leadOf('x'.repeat(300))).toHaveLength(300);
  });
});
