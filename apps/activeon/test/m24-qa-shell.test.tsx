// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 QA fix round (systems, shell, account pages): the one-line footer's legal words and its Sources
// title, ShortText's fold of a long "why", a wiki sub-page's name and the top bar past World 4. The
// footer CSS is checked in m24-qa-footer-css.test.ts (node).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Footer } from '../src/components/Footer';
import { Header } from '../src/components/Header';
import { ShortText, splitFirstSentence } from '../src/design/atoms/ShortText';
import { wikiName } from '../src/systems/frame/SystemFrame';

afterEach(cleanup);

describe('the footer (QA P2: one line)', () => {
  it('shows the affiliation disclaimer on every page, then Suggest and Source', () => {
    render(
      <Footer credit="Numbers by IdleOn Toolbox 2.3.540 · facts from the IdleOn Wiki" onSuggest={() => {}} />,
    );
    const foot = screen.getByRole('contentinfo');
    expect(foot.querySelector('.n-foot__end')?.textContent).toContain(
      'Fan-made, read-only, not affiliated with LavaFlame2',
    );
    // The Sources line carries its full text as a title, for when the ellipsis cuts it.
    expect(foot.querySelector('.n-foot__src')?.getAttribute('title')).toBe(
      'Numbers by IdleOn Toolbox 2.3.540 · facts from the IdleOn Wiki',
    );
  });
});

describe('ShortText (QA P2: no text walls)', () => {
  const long =
    '4,994 more kills there open Where the Branches End; time to open it: about 2h at its kill rate. The Telescope is at the top of the big tree; you open the way once, on this one character. Constellations pay Star Chart Points.';
  it('leaves short text alone', () => {
    expect(splitFirstSentence('Short and sweet. Two.')).toBeNull();
  });
  it('folds a long text after its first sentence and opens on "more"', () => {
    render(<ShortText text={long} />);
    expect(screen.queryByText(/Telescope/)).toBeNull();
    const more = screen.getByRole('button', { name: 'more' });
    expect(more.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(more);
    expect(screen.getByText(/Telescope/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'less' }).getAttribute('aria-expanded')).toBe('true');
  });
});

describe('wikiName (QA P3: "IdleOn Wiki: 2025")', () => {
  it('keeps a sub-page under its parent', () => {
    expect(wikiName('https://idleon.wiki/wiki/Changelog/2025', 'Bubba')).toBe('Changelog 2025');
    expect(wikiName('https://idleon.wiki/wiki/Talent_Book_Library', 'x')).toBe('Talent Book Library');
  });
});

describe('the top bar past World 4 (QA P2)', () => {
  it('says "World 4 or later", not "World 4 · entry"', () => {
    render(
      <Header
        save={null}
        sync={{ status: 'idle' } as never}
        online
        lastSnapshotAt={null}
        stage={{ id: 'W4-entry', label: 'World 4, entry', needs: [], beyond: true }}
      />,
    );
    expect(screen.getByText('World 4 or later')).toBeTruthy();
    expect(screen.queryByText('World 4 · entry')).toBeNull();
  });
});
