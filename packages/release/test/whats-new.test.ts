// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M12 US-3 and TR-7 over synthetic first-parent histories.
import { describe, expect, it } from 'vitest';
import type { Commit } from '../src/commits.ts';
import { parseWhatsNewLine, prOf } from '../src/commits.ts';
import { entryFor, whatsNewFeed } from '../src/whats-new.ts';

let n = 0;
const commit = (
  subject: string,
  body = '',
  files: string[] = ['apps/activeon/src/App.tsx'],
  extra: Partial<Commit> = {},
): Commit => ({
  sha: `${(++n).toString(16).padStart(40, '0')}`,
  date: '2026-10-21T12:00:00Z',
  subject,
  body,
  files,
  ...extra,
});
const upstream = (game: string, tb = '3.3.96') =>
  `repo=https://github.com/YassSoliman/IdleonToolbox\ncommit=abc\ncommitDate=2026-10-21\ntoolboxVersion=${tb}\ngameVersion=${game}\n`;
const one = (c: Commit) => entryFor(c, []);

describe("What's new feed (US-3)", () => {
  it("skips a developer-only merge with no What's-new line", () => {
    expect(one(commit('chore(ci): cache pnpm store (#70)'))).toBeNull();
  });

  it('puts a kb fix that touches packages/knowledge/ in Advice changes, with an upper-cased title', () => {
    const e = one(
      commit('fix(kb): stamp cap step uses materials, not coins (#71)', '', [
        'packages/knowledge/entries/stamps.yaml',
      ]),
    );
    expect(e).toMatchObject({ section: 'advice', text: 'Stamp cap step uses materials, not coins', pr: 71 });
  });

  it("uses the What's-new: line over the title", () => {
    const e = one(
      commit(
        'feat(ui): card set badges (#72)',
        "Body\n\nWhat's-new: Cards now show which set they complete\n",
      ),
    );
    expect(e).toMatchObject({ section: 'app', text: 'Cards now show which set they complete' });
  });

  it("skips What's-new: none whatever the type", () => {
    expect(one(commit('feat(ui): internal knob (#73)', "What's-new: none"))).toBeNull();
    expect(one(commit('fix: thing (#74)', 'What’s-new: None'))).toBeNull();
  });

  it('announces a parser sync that changes gameVersion as Game patch support, before any other rule', () => {
    const e = one(
      commit(
        'chore(parsers): sync Toolbox to abc1234 (game 2.3.541) (#75)',
        "What's-new: none",
        ['packages/toolbox-parsers/UPSTREAM'],
        {
          upstream: { before: upstream('2.3.540'), after: upstream('2.3.541') },
        },
      ),
    );
    expect(e).toMatchObject({ section: 'game-patch', text: 'Reads saves from game version 2.3.541' });
  });

  it('gives a sync that refreshes generated facts at the same game version a default Advice entry (RT-27)', () => {
    const e = one(
      commit(
        'chore(parsers): sync Toolbox to abc1234 (game 2.3.540) (#76)',
        '',
        ['packages/toolbox-parsers/UPSTREAM', 'packages/knowledge/generated/stamps.json'],
        {
          upstream: { before: upstream('2.3.540', '3.3.96'), after: upstream('2.3.540', '3.3.97') },
        },
      ),
    );
    expect(e).toMatchObject({ section: 'advice', text: 'Game facts refreshed from Toolbox 3.3.97' });
  });

  it('skips a sync that changes nothing players see', () => {
    const e = one(
      commit(
        'chore(parsers): sync Toolbox to abc1234 (game 2.3.540) (#77)',
        '',
        ['packages/toolbox-parsers/UPSTREAM'],
        {
          upstream: { before: upstream('2.3.540'), after: upstream('2.3.540') },
        },
      ),
    );
    expect(e).toBeNull();
  });

  it('lists entries newest first and keeps ids, so the panel can show those before lastSeen (E1..E4 before E5)', () => {
    const commits = Array.from({ length: 8 }, (_, i) => commit(`feat: change ${8 - i} (#${100 + 8 - i})`));
    const { feed } = whatsNewFeed(commits);
    expect(feed.schema).toBe(1);
    expect(feed.entries.map((e) => e.text)).toEqual([8, 7, 6, 5, 4, 3, 2, 1].map((i) => `Change ${i}`));
    const lastSeen = feed.entries.findIndex((e) => e.id === commits[4]?.sha);
    expect(feed.entries.slice(0, lastSeen)).toHaveLength(4);
  });

  it('caps the feed at 100 entries', () => {
    const commits = Array.from({ length: 130 }, (_, i) => commit(`fix: bug ${i} (#${i + 1})`));
    expect(whatsNewFeed(commits).feed.entries).toHaveLength(100);
  });

  it('truncates long text to 119 characters plus an ellipsis, with a warning naming the PR', () => {
    const warnings: string[] = [];
    const e = entryFor(commit('feat: x (#80)', `What's-new: ${'a'.repeat(150)}`), warnings);
    expect(e?.text).toHaveLength(120);
    expect(e?.text.endsWith('…')).toBe(true);
    expect(warnings[0]).toContain('PR #80');
  });

  it('strips Markdown and the trailing period', () => {
    const e = one(commit('feat: x (#81)', "What's-new: Use the `Focus` [card](https://x.test) now."));
    expect(e?.text).toBe('Use the Focus card now');
  });

  it('reads old-format merges (Merge pull request #N from ...) by their first body line', () => {
    expect(
      prOf({
        subject: 'Merge pull request #28 from YassSoliman/feat/slice-1',
        body: '\nfeat(sync): live sync\n',
      }),
    ).toEqual({
      pr: 28,
      title: 'feat(sync): live sync',
    });
    const e = one(commit('Merge pull request #28 from YassSoliman/feat/x', 'feat(sync): live sign-in\n'));
    expect(e).toMatchObject({ pr: 28, text: 'Live sign-in', section: 'app' });
  });

  it("tolerates CRLF and an empty What's-new line (absent)", () => {
    expect(parseWhatsNewLine("Summary\r\nWHAT'S-NEW: Faster sync\r\n")).toEqual({
      kind: 'text',
      text: 'Faster sync',
    });
    expect(parseWhatsNewLine("What's-new:\n")).toBeNull();
  });

  it('dates entries in UTC', () => {
    const e = one(commit('fix: late (#82)', '', undefined, { date: '2026-10-21T23:30:00-05:00' }));
    expect(e?.date).toBe('2026-10-22');
  });
});
