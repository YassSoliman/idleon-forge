// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// TR-15: the plain-text Now screen. Component snapshots of the synthetic view fixtures, with names
// replaced by <c{index}>, and the golden engine M11's `kb golden` loads.
import { describe, expect, it } from 'vitest';
import { goldenEngine, saveOrderLabel } from '../../src/golden';
import { renderNowText } from '../../src/now/render-text';
import { NOW, PUBLIC_SAVES, publicState } from '../core/helpers';
import { FIXTURE_IDS, fixture, view } from './helpers';

describe('renderNowText on the view fixtures', () => {
  it.each(FIXTURE_IDS)('%s', (id) => {
    const r = fixture(id);
    const text = renderNowText(view(r));
    for (const c of r.characters) expect(text).not.toContain(c.name);
    expect(text).toMatchSnapshot();
  });
  it('renders the Focus card too, still without names', () => {
    const r = fixture('mid-session');
    const text = renderNowText(view(r, { focus: 2, leftFrom: 3 }));
    expect(text).toContain('FOCUS <c2> · 5 of 5 · last one');
    expect(text).toContain('Left <c3> ✓ 1 done · Fix before you leave');
    expect(text).toContain('Next: switch to Barbarian 51 · 1 fix');
    for (const c of r.characters) expect(text).not.toContain(c.name);
  });
  it('has the "### <label> · <Class> <level> · <Verdict>" lines M11 diffs Verdicts on', () => {
    const text = renderNowText(view(fixture('mid-session')));
    expect(text).toMatch(/^### <c3> · Barbarian 51 · Fix before you leave$/m);
    expect(text).toMatch(/^### Account · nothing to fix$/m);
  });
});

describe('goldenEngine (M11 TR-15 hook)', () => {
  const golden = (f: string) =>
    goldenEngine.renderNow({
      state: publicState(f),
      kb: { version: { display: 'test' } },
      now: NOW,
      expectedReturnMs: 8 * 3600_000,
    });
  it.each(PUBLIC_SAVES)('%s: C1…Cn labels, no names, and M11-parsable Verdict lines', (f) => {
    const state = publicState(f);
    const text = golden(f);
    for (const c of state.characters) if (c.name.length > 2) expect(text).not.toContain(c.name);
    const lines = text.split('\n').filter((l) => /^### (C\d+|Account) · /.test(l));
    expect(lines.length).toBe(
      state.characters.length +
        state.diagnostics.unreadableCharacters.filter((i) => !state.characters.some((c) => c.index === i))
          .length +
        1,
    );
    expect(text).not.toContain('safe to log off');
    expect(text).not.toMatch(/^Not covered yet:/m);
  });
  it('labels characters in save order', () => {
    const s = publicState(PUBLIC_SAVES[0] as string);
    const label = saveOrderLabel(s);
    expect(s.characters.map((c) => label(c.index))).toEqual(s.characters.map((_, i) => `C${i + 1}`));
  });
  it('has no Stage until M2 ships', () => {
    expect(
      goldenEngine.stage({
        state: publicState(PUBLIC_SAVES[0] as string),
        kb: { version: { display: 'test' } },
        now: NOW,
        expectedReturnMs: 0,
      }),
    ).toBeNull();
  });
  it('is stable for one fixture', () => {
    expect(golden('first.json')).toMatchSnapshot();
  });
});
