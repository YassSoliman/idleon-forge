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
