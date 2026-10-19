// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 QA P2: the footer is one line from 720 px (the Sources shrink with an ellipsis, the legal line and
// the links never wrap), two at most on a phone; a System page's checks list gives way before its Sources.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (f: string) => readFileSync(fileURLToPath(new URL(`../src/${f}`, import.meta.url)), 'utf8');
/** The body of the top-level rule written exactly `sel {`. */
const rule = (css: string, sel: string) => {
  const at = css.indexOf(`\n${sel} {`);
  return at < 0 ? '' : css.slice(at, css.indexOf('}', at));
};

describe('the one-line footer', () => {
  const chrome = read('styles/chrome.css');
  it('does not wrap from 720 px; the Sources end in an ellipsis; the right half never wraps', () => {
    expect(rule(chrome, '.n-foot__in')).toMatch(/flex-wrap: nowrap/);
    expect(rule(chrome, '.n-foot__src')).toMatch(/text-overflow: ellipsis/);
    expect(rule(chrome, '.n-foot__src')).toMatch(/white-space: nowrap/);
    // The legal part (the affiliation disclaimer) never shrinks or wraps; only the Sources give way.
    expect(rule(chrome, '.n-foot__end')).toMatch(/flex: none/);
    expect(rule(chrome, '.n-foot__end')).toMatch(/white-space: nowrap/);
    expect(rule(chrome, '.n-foot__end')).not.toMatch(/overflow: hidden|text-overflow/);
    // The footer never widens the page column on a phone (a long Sources line or legal line).
    expect(rule(chrome, '.n-foot')).toMatch(/contain: inline-size/);
  });
  it("a System page's checks list shrinks first, so the wiki link and Toolbox stay on screen", () => {
    const frame = read('systems/frame/frame.css');
    expect(rule(frame, '.sf-foot > .sf-foot__checks')).toMatch(/text-overflow: ellipsis/);
    expect(rule(frame, '.sf-foot > *')).toMatch(/flex: none/);
  });
});
