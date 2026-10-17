// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Toolbox website table (#74 follow-up): every key is a real System, every route is a site page,
// and the lookup prefers an entry override to its System.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TOOLBOX_ENTRY_PAGES, TOOLBOX_PAGES, toolboxPage } from '../src/toolbox-site';

const systems = [
  ...readFileSync(new URL('../systems.yaml', import.meta.url), 'utf8').matchAll(/^ {2}- id: (\S+)/gm),
].map((m) => m[1]);

describe('Toolbox website pages', () => {
  it('keys only known Systems and entry ids of known Systems', () => {
    expect(Object.keys(TOOLBOX_PAGES).filter((s) => !systems.includes(s))).toEqual([]);
    expect(Object.keys(TOOLBOX_ENTRY_PAGES).filter((id) => !systems.includes(id.split('.')[0]))).toEqual([]);
  });
  it('routes are site paths, never code', () => {
    for (const p of [...Object.values(TOOLBOX_PAGES), ...Object.values(TOOLBOX_ENTRY_PAGES)])
      expect(p.path).toMatch(/^\/[a-z0-9/-]+$/);
  });
  it('names the page and prefers an entry override', () => {
    expect(toolboxPage('anvil.check.spend-points')).toEqual({
      url: 'https://idleontoolbox.com/account/world-1/anvil',
      title: 'IdleOn Toolbox: Anvil',
    });
    expect(toolboxPage('pets.check.mart-gems')?.url).toBe(
      'https://idleontoolbox.com/account/misc/tournament',
    );
    expect(toolboxPage('metapath.goal.push')).toBeNull();
  });
});
