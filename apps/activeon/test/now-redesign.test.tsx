// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 area N in the DOM: the counter and its first fix (FR-N2, US-1), the Unknown fold, All set with the
// campfire (US-4), the stale-first banner (US-3), grouped jobs and roster findings (FR-N3, US-2), the
// Ready fold (FR-N4), the pause points with the Log off DO-CONFIRM ticks (FR-N6, US-5), the Expected
// Return line, the header's overflow menu (G1), Settings (G10), the "New version ready" chip with its
// pasted-save keep, What's new as the docked patch notes (US-15) and the sleeping blob (US-14).
import type { EngineResult, Goal, InfoLine } from '@idleon-forge/engine/result';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keepPasteForReload, takeKeptPaste } from '../src/App';
import { Footer } from '../src/components/Footer';
import { Header } from '../src/components/Header';
import { HeaderMenu } from '../src/components/HeaderMenu';
import { WhatsNewDock } from '../src/now/chrome/WhatsNew';
import { useUpdateAvailable } from '../src/now/release';
import { SettingsNamespace } from '../src/now/settings/context';
import { SettingsBody } from '../src/now/settings/Settings';
import { readSettings } from '../src/now/settings/settings-store';
import { Shell } from '../src/shell/Shell';
import { fixture, props, renderNow, saveOf } from './now-helpers';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  delete document.documentElement.dataset.theme;
});
afterEach(() => cleanup());

async function noAxeViolations(container: HTMLElement) {
  const res = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([]);
}

const H = 3_600_000;
/** M24: the hero (the Log off pause point's one framed block): its title and its verdict word. */
const counterHeading = () => document.querySelector('.np-hero__title') as HTMLElement;
const verdict = () => document.querySelector('.np-hero__verdict .a-display')?.textContent;
/** Picks the Log off pause point (the hero lives there). */
const logOff = () => fireEvent.click(screen.getByRole('radio', { name: 'Log off' }));

/** A copy of `base`'s Goal as another character's (same entry, same text: a repeated job). */
function cloneGoal(g: Goal, index: number): Goal {
  return { ...g, nextAction: { ...g.nextAction, key: `${g.nextAction.entryId}@c${index}` } };
}

describe('FR-N2 the counter (US-1)', () => {
  it('counts the blockers, shows the first fix as who · where · verb, and opens that character', async () => {
    const r = fixture('mid-session');
    const { container } = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    logOff();
    expect(verdict()).toBe('Fix first');
    expect(counterHeading().textContent).toBe('Food runs out in about 2h');
    expect(screen.getByText('1 fix before you leave')).toBeTruthy();
    const first = screen.getByRole('button', { name: /Open Barbarian 51/ });
    expect(first.textContent).toContain('Barbarian 51');
    expect(first.textContent).toContain('Fishing Camp');
    // D-10: no fixSeconds ships, so no time token, and never "time not known" (DS-3, DS-23).
    expect(first.querySelector('.a-token--how-long')).toBeNull();
    expect(first.textContent).not.toContain('time not known');
    await noAxeViolations(container);
    fireEvent.click(first);
    expect(window.location.hash).toBe('#now-3');
  });

  it('folds the Unknown characters apart: they never count and never block', () => {
    const r = fixture('mid-session');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    logOff();
    const fold = screen.getByRole('button', { name: "1 we can't tell: see why" });
    expect(fold.getAttribute('aria-expanded')).toBe('false');
    const list = document.getElementById('n-unknown-fold') as HTMLElement;
    expect(list.hidden).toBe(true);
    fireEvent.click(fold);
    expect(fold.getAttribute('aria-expanded')).toBe('true');
    expect(list.hidden).toBe(false);
    expect(
      within(list)
        .getAllByRole('button')
        .map((b) => b.dataset.index),
    ).toEqual(['0']);
  });

  it('at zero reads "Ready · Safe to log off for 8h" in the mint frame, with what fills first (US-4, M24)', () => {
    const r = { ...fixture('all-set'), returnAt: Date.now() + 8 * H, timeline: [] };
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const panel = counterHeading().closest('section') as HTMLElement;
    expect(verdict()).toBe('Ready');
    expect(counterHeading().textContent).toBe('Safe to log off for 8h');
    expect(panel.dataset.tone).toBe('ready');
    expect(panel.classList.contains('a-frame')).toBe(true);
    expect(panel.textContent).toMatch(/First thing fills up in 9h/);
  });

  it('US-14 (R11 QA): every Goal skipped, the sleeping blob says what to do next', () => {
    const r = fixture('mid-session');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.queryByText(/^Nothing to do now/)).toBeNull();
    cleanup();
    // Skip today on every Goal, every Unknown and the account (the prefs store's own record).
    const until = { midnightAt: Date.now() + 6 * H, sessionStartedAt: null };
    const keys = [
      ...r.characters.flatMap((c) => [...c.goals.map((g) => g.nextAction.key), `unknown@c${c.index}`]),
      ...r.account.goals.map((g) => g.nextAction.key),
      'unknown@account',
    ];
    localStorage.setItem(
      'activeon:test:skips',
      JSON.stringify(Object.fromEntries(keys.map((k) => [k, until]))),
    );
    try {
      renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
      logOff();
      expect(verdict()).not.toBe('Fix first');
      expect(screen.getByText(/^Nothing to do now\. Back in/)).toBeTruthy();
    } finally {
      localStorage.removeItem('activeon:test:skips');
    }
  });

  it('US-14: no Goal at all is the same empty state', () => {
    const r = { ...fixture('all-set'), returnAt: Date.now() + 8 * H, timeline: [] };
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByText(/^Nothing to do now\. Back in 8h/)).toBeTruthy();
  });

  it('says the save is old first, and demotes the count to "last known" (US-3, DS-11)', () => {
    const r = fixture('mid-session');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste', 9 * H + 28 * 60_000)));
    logOff();
    const stale = screen.getByRole('status', { name: /^Your save is 9h 28m old/ });
    expect(stale.textContent).toContain('Your save is 9h 28m old: press Cloud Save, then check again');
    expect(stale.textContent).toContain('last known: 1 fix');
    // The stale banner comes before the counter in the page.
    expect(stale.compareDocumentPosition(counterHeading()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('FR-N3 the same job, said once (US-2, M24 Rounds and the hero)', () => {
  it('a Next Action on two rows is one "Same job" card on the round, its characters in Visit Order', () => {
    const r: EngineResult = fixture('mid-session');
    const job = r.characters.find((c) => c.index === 1)?.goals[0] as Goal;
    const elm = r.characters.find((c) => c.index === 4);
    if (!elm) throw new Error('fixture');
    elm.goals = [cloneGoal(job, 4)];
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    expect(screen.getByText("Picked Rounds: you're on your rounds")).toBeTruthy();
    const card = screen.getByRole('region', { name: /^Same job on 2: collect 2 Amarok keys/ });
    const chips = within(card).getAllByRole('link');
    // Visit Order: the Wizard 40 comes before the Shaman 44.
    expect(chips.map((c) => c.getAttribute('aria-label'))).toEqual(['Wizard 40', 'Shaman 44']);
    fireEvent.click(chips[1] as HTMLElement);
    expect(window.location.hash).toBe('#now-1');
  });

  it('a cap full now on 3 rows is said once in the hero; those cards say Collect, the pip agrees', () => {
    const r: EngineResult = fixture('mid-session');
    const cap = (i: number): InfoLine => ({
      key: `anvil.check.full@c${i}`,
      kind: 'cap',
      label: 'Anvil full · collect',
      text: 'Collect from the anvil',
      sources: [],
      at: null,
    });
    for (const i of [1, 2, 3]) {
      const c = r.characters.find((x) => x.index === i);
      if (c) c.info = [cap(i)];
    }
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    logOff();
    // The hero leads with the fix; the full anvils are one line in it, not a pill on every row (DS-7).
    expect(verdict()).toBe('Fix first');
    expect(screen.getByText(/Also full: anvil on 3 characters/)).toBeTruthy();
    const card = (i: string) => document.querySelector(`.np-card[data-index="${i}"]`) as HTMLElement;
    expect(card('2').querySelector('.np-state')?.textContent).toBe('Collect');
    expect(card('2').querySelector('.np-state .a-pip--gold')).toBeTruthy();
    expect(card('4').querySelector('.np-state')?.textContent).not.toBe('Collect');
    expect(card('2').querySelector('.a-pill')).toBeNull();
  });

  it('every character is a card in Visit Order, none folded away (M24)', () => {
    const r: EngineResult = fixture('mid-session');
    const extra = r.characters.find((c) => c.index === 4);
    if (!extra) throw new Error('fixture');
    r.characters.push({ ...extra, index: 5, name: 'Fir' });
    r.visitOrder = [...r.visitOrder, 5];
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    logOff();
    const cards = [...document.querySelectorAll<HTMLElement>('.np-card')];
    expect(cards).toHaveLength(6);
    expect(cards.at(-1)?.dataset.index).toBe('5');
  });
});

describe('FR-N6 the pause points (US-5)', () => {
  it('picks Log off when every character with a fix is opened, and the save ticks the items', () => {
    const r = fixture('account-stockpile');
    const view = render(<Shell {...props(r, saveOf(r, 1, 'first', null, 'paste'))} />);
    const group = screen.getByRole('group', { name: 'Pause point' });
    expect((within(group).getByRole('radio', { name: 'Log off' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText('Picked Log off: every character with a fix was opened')).toBeTruthy();
    expect(screen.getByText('2 fixes before you leave')).toBeTruthy();
    // No tap-to-tick control exists (DS-2): only the next save ticks.
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(document.querySelectorAll('.np-ticks .is-ticked')).toHaveLength(0);
    // The next save shows one fixed: the hero lists both, the fixed one ticked by the save.
    const next: EngineResult = structuredClone(r);
    next.account.goals = next.account.goals.filter((g) => g.nextAction.key !== r.account.blockerKeys[0]);
    next.account.blockerKeys = next.account.blockerKeys.slice(1);
    view.rerender(<Shell {...props(next, saveOf(next, 2, 'first', null, 'paste'))} />);
    expect(document.querySelectorAll('.np-ticks li')).toHaveLength(2);
    expect(document.querySelectorAll('.np-ticks .is-ticked')).toHaveLength(1);
  });

  it('a manual pick holds and says so', () => {
    const r = fixture('mid-session');
    const view = render(<Shell {...props(r, saveOf(r, 1, 'first', null, 'paste'))} />);
    expect(screen.getByText("Picked Rounds: you're on your rounds")).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Log in' }));
    expect(screen.getByText('You picked Log in: it stays for this session')).toBeTruthy();
    view.rerender(<Shell {...props(r, saveOf(r, 2, 'first', null, 'paste'))} />);
    expect((screen.getByRole('radio', { name: 'Log in' }) as HTMLInputElement).checked).toBe(true);
  });
});

describe('M24 "How long are you away?"', () => {
  it('the chips are one radio group beside the mini-timeline; picking one re-runs the engine', () => {
    const r = fixture('mid-session');
    const set = vi.fn();
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste'), { setExpectedReturn: set }));
    logOff();
    const group = screen.getByRole('group', { name: 'How long are you away?' });
    expect((within(group).getByRole('radio', { name: '8h' }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(within(group).getByRole('radio', { name: '4h' }));
    expect(set).toHaveBeenCalledWith(4 * 3600);
  });
});

describe('G1 the header and its overflow menu, G10 Settings', () => {
  const menu = (over: Partial<Parameters<typeof HeaderMenu>[0]> = {}) => (
    <HeaderMenu
      familyLevel={1234}
      onSettings={() => {}}
      onSuggest={() => {}}
      onYourSuggestions={null}
      onConfusing={() => {}}
      versions="ActiveOn 0.1.0 · knowledge #ec89 · game build 142"
      historyNote={null}
      patchNote={null}
      failedChecks={null}
      account={null}
      {...over}
    />
  );
  it('a 44 px "More" opens the menu: Family level, Settings, Suggest, versions; a dot when something is new', () => {
    const settings = vi.fn();
    render(
      <Header
        save={null}
        sync={{ status: 'off' }}
        online
        lastSnapshotAt={null}
        menu={menu({ onSettings: settings })}
        dot
      />,
    );
    const more = screen.getByRole('button', { name: 'More, something new' });
    fireEvent.click(more);
    const sheet = screen.getByRole('dialog', { name: 'ActiveOn' });
    expect(sheet.textContent).toContain('Family level 1,234');
    expect(sheet.textContent).toContain('ActiveOn 0.1.0 · knowledge #ec89 · game build 142');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Settings' }));
    expect(settings).toHaveBeenCalled();
  });

  it('M24 menu: your save, the paste box on demand, Look inline, the full disclaimer', () => {
    render(
      menu({
        save: { kind: 'paste', action: <button type="button">Sign in</button> },
        paste: <p>the paste box</p>,
        settings: <p>the theme rows</p>,
      }),
    );
    expect(screen.getByRole('region', { name: 'Your save' }).textContent).toContain(
      'Pasted save · this tab only',
    );
    expect(screen.queryByText('the paste box')).toBeNull();
    const open = screen.getByRole('button', { name: /Paste a save instead/ });
    fireEvent.click(open);
    expect(open.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('the paste box')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Look' }).textContent).toContain('the theme rows');
    expect(screen.getByText(/not affiliated with or endorsed by LavaFlame2/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Source code \(GPL-3\.0\)/ }).getAttribute('target')).toBe(
      '_blank',
    );
  });

  it('M24 footer: one line, the page Sources slot over the default credit, the legal line kept', () => {
    render(
      <Footer credit="Numbers by IdleOn Toolbox 2.3.540 · facts from the IdleOn Wiki" onSuggest={() => {}} />,
    );
    const foot = screen.getByRole('contentinfo');
    expect(foot.textContent).toContain('Numbers by IdleOn Toolbox 2.3.540');
    expect(foot.textContent).toContain('Fan-made, read-only');
    expect(within(foot).getByRole('button', { name: 'Suggest' })).toBeTruthy();
    expect(within(foot).queryByText(/Paste/)).toBeNull();
  });

  it('shows "New version ready · Reload" as a quiet chip that reloads', () => {
    const reload = vi.fn();
    render(
      <Header
        save={null}
        sync={{ status: 'off' }}
        online
        lastSnapshotAt={null}
        update={{ text: 'New version ready · Reload', onReload: reload }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New version ready · Reload' }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('Settings: Theme back to System, Times as a clock, kept for the account', () => {
    document.documentElement.dataset.theme = 'dark';
    localStorage.setItem('activeon:theme', 'dark');
    render(<SettingsBody namespace="activeon:test:" persistent />);
    fireEvent.click(screen.getByRole('radio', { name: 'System' }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem('activeon:theme')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Around 20:10' }));
    expect(readSettings('activeon:test:').times).toBe('clock');
    fireEvent.click(screen.getByRole('radio', { name: 'Always ask' }));
    expect(readSettings('activeon:test:').back).toBe('ask');
  });

  it('with "Always ask", the chips stay inline on Now', () => {
    localStorage.setItem('activeon:test:settings', JSON.stringify({ back: 'ask' }));
    const r = fixture('mid-session');
    render(
      <SettingsNamespace.Provider value="activeon:test:">
        <Shell {...props(r, saveOf(r, 1, 'first', null, 'paste'))} />
      </SettingsNamespace.Provider>,
    );
    logOff();
    expect(screen.queryByRole('button', { name: 'Change' })).toBeNull();
    expect(screen.getAllByRole('radio', { name: '8h' }).length).toBeGreaterThan(0);
  });
});

describe('a tab left open learns about a new build, and keeps a pasted save across the reload', () => {
  it('checks /version.json on window focus (and every 30 minutes)', async () => {
    const check = vi.fn(async () => true);
    function Probe() {
      const u = useUpdateAvailable(check, { channel: 'production' });
      return <p>{u.text ?? 'none'}</p>;
    }
    render(<Probe />);
    expect(check).not.toHaveBeenCalled();
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(check).toHaveBeenCalledOnce();
    expect(screen.getByText('A different version of ActiveOn is live. Reload to switch')).toBeTruthy();
  });

  it('keeps the pasted text for one reload in this tab, read once', () => {
    expect(keepPasteForReload('{"data":{}}')).toBe(true);
    expect(takeKeptPaste()).toBe('{"data":{}}');
    expect(takeKeptPaste()).toBeNull();
    expect(keepPasteForReload(null)).toBe(true);
  });

  it('says so when the browser will not keep it', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    try {
      expect(keepPasteForReload('x'.repeat(10))).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("What's new as the docked patch notes (US-15)", () => {
  it('docks as a tab, opens a short scroll of up to 3, and Got it dismisses it', () => {
    const dismiss = vi.fn();
    const entries = [1, 2, 3, 4].map((n) => ({
      id: `e${n}`,
      date: '2026-10-18',
      section: 'app' as const,
      text: `Change ${n}`,
    }));
    render(
      <WhatsNewDock
        view={{
          groups: [{ section: 'app', title: 'App changes', entries }],
          more: 0,
          newest: { id: 'e1', date: '2026-10-18' },
        }}
        onDismiss={dismiss}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: "What's new · 4" }));
    const sheet = screen.getByRole('dialog', { name: 'New since your last visit' });
    expect(
      within(sheet)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Change 1', 'Change 2', 'Change 3']);
    expect(sheet.textContent).toContain('and 1 more');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Got it' }));
    expect(dismiss).toHaveBeenCalledOnce();
  });
});

describe('`flows.empty` the sleeping blob (US-14)', () => {
  it('a character with nothing left: the blob sleeps and names what is next', () => {
    const r = fixture('mid-session');
    window.history.replaceState(null, '', '/#now-4');
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const empty = document.querySelector('.a-empty') as HTMLElement;
    expect(empty.textContent).toMatch(/^Nothing to do now\. Back in /);
  });
});
