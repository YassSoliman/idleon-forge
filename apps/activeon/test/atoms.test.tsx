// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment jsdom
// Copyright (C) 2026 IdleOn Forge contributors.
// The atom set (M21 FR-F5, TR-5, TR-17, DS-3, DS-4, DS-5, DS-14, DS-15): contracts, accessibility and
// axe, in light and dark.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  GlyphChip,
  IconButton,
  LinkRow,
  Loading,
  Meter,
  PartFailed,
  Pill,
  Ring,
  Seal,
  Section,
  SegmentedControl,
  Sheet,
  Speech,
  StatusGlyph,
  Tabs,
  Toast,
  TokenLine,
  VerdictStamp,
} from '../src/design/atoms';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete document.documentElement.dataset.theme;
});

async function noAxeViolations(container: HTMLElement) {
  const res = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([]);
}

/** No style attribute other than CSS custom properties (CSP style-src 'self'). */
function onlyCustomPropertyStyles(container: HTMLElement) {
  for (const el of container.querySelectorAll('[style]')) {
    const decls = (el.getAttribute('style') ?? '')
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean);
    expect(decls.every((d) => d.startsWith('--'))).toBe(true);
  }
}

function Gallery() {
  const [seg, setSeg] = useState<'system' | 'light' | 'dark'>('system');
  const [tab, setTab] = useState<'build' | 'gear'>('build');
  return (
    <main>
      <Pill urgency="fix" glyph="now-cap-anvil" verb="Anvil full · collect" />
      <Pill urgency="optional" glyph="now-cap-trap" verb="Traps done · optional" />
      <Pill
        urgency="soon"
        glyph="now-cap-worship"
        verb="Worship fills soon · spend"
        count={4}
        filter={{ pressed: false, onToggle() {} }}
      />
      <VerdictStamp verdict="ready" word="Ready" />
      <VerdictStamp verdict="fix" word="Fix" />
      <VerdictStamp verdict="unknown" word="Unknown" />
      <VerdictStamp verdict="skipped" word="Skipped" />
      <Button tone="primary">Next: Barbarian 56 · fix</Button>
      <IconButton label="More" glyph="flows-overflow-spark" />
      <LinkRow href="#system-alchemy">See it on the Alchemy page</LinkRow>
      <Chip onClick={() => {}} pressed>
        5 min
      </Chip>
      <GlyphChip family="archer" label="Bowman 60" detail="6" />
      <Badge count={2} label="2 to fix before you leave" />
      <TokenLine who={{ family: 'warrior', label: 'Squire 51' }} where="Sands of Time" howLong="in 3h 40m" />
      <Meter value={1010} max={2000} label="1,010 of 2,000 teeth" />
      <Ring value={3} max={7} label="3 of 7 dailies done" />
      <SegmentedControl
        label="Theme"
        value={seg}
        onChange={(v) => setSeg(v)}
        options={[
          { value: 'system' as const, label: 'System' },
          { value: 'light' as const, label: 'Light' },
          { value: 'dark' as const, label: 'Dark' },
        ]}
      />
      <Tabs
        label="Character tabs"
        idBase="x"
        value={tab}
        onChange={(v) => setTab(v)}
        tabs={[
          { value: 'build' as const, label: 'Build' },
          { value: 'gear' as const, label: 'Gear' },
        ]}
      />
      <div id="x-panel-build" role="tabpanel" aria-labelledby="x-tab-build" />
      <Seal kind="fix" word="Fix" />
      <StatusGlyph status="wasting" word="Wasting" />
      <Section title="Account">
        <p>Account · 0 fixes · 19 Goals</p>
      </Section>
      <Speech name="Scout">The anvil fills in 3h 40m, before you're back.</Speech>
      <EmptyState line="Nothing to do now. Back in 8h 10m: the anvil on Bowman 54 fills first." />
      <PartFailed line="Couldn't load this part." retry="Try again" onRetry={() => {}} />
      <Toast actions={[{ label: 'Reload', onClick() {} }]}>A new version is ready.</Toast>
    </main>
  );
}

describe('the gallery of atoms', () => {
  it.each(['light', 'dark'])('has no axe violations in %s', async (theme) => {
    document.documentElement.dataset.theme = theme;
    const { container } = render(<Gallery />);
    await noAxeViolations(container);
    onlyCustomPropertyStyles(container);
  });
});

describe('Pill (DS-5)', () => {
  it('is colour = urgency, glyph = kind (decorative beside its word), text = the fix verb', () => {
    const { container } = render(<Pill urgency="fix" glyph="now-cap-anvil" verb="Anvil full · collect" />);
    const pill = container.querySelector('.a-pill') as HTMLElement;
    expect(pill.className).toContain('a-pill--fix');
    expect(pill.textContent).toBe('Anvil full · collect');
    expect(pill.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
  it('is a toggle when it is a roster-level filter (DS-7)', () => {
    const onToggle = vi.fn();
    render(
      <Pill
        urgency="fix"
        glyph="now-cap-anvil"
        verb="Anvil full on 6 · collect"
        filter={{ pressed: true, onToggle }}
      />,
    );
    const b = screen.getByRole('button', { name: 'Anvil full on 6 · collect' });
    expect(b.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(b);
    expect(onToggle).toHaveBeenCalledOnce();
  });
});

describe('VerdictStamp', () => {
  it('pairs every Verdict with its own glyph and word (DS-8)', () => {
    const { container } = render(
      <>
        <VerdictStamp verdict="ready" word="Ready" />
        <VerdictStamp verdict="fix" word="Fix" />
        <VerdictStamp verdict="unknown" word="Unknown" />
        <VerdictStamp verdict="skipped" word="Skipped" />
      </>,
    );
    const stamps = [...container.querySelectorAll('.a-stamp')];
    expect(stamps.map((s) => s.textContent)).toEqual(['Ready', 'Fix', 'Unknown', 'Skipped']);
    const glyphs = stamps.map((s) => s.querySelector('svg')?.getAttribute('class')?.split(' ')[1]);
    expect(new Set(glyphs).size).toBe(4);
  });
});

describe('TokenLine (DS-3)', () => {
  it('hides every unknown token and never prints a placeholder', () => {
    const { container } = render(<TokenLine who={null} where="Sands of Time" howLong={null} />);
    expect(container.textContent).toBe('Sands of Time');
    expect(container.textContent).not.toMatch(/place not given|time not known|Any character/);
  });
  it('keeps who · where · how long in that order', () => {
    const { container } = render(
      <TokenLine who={{ family: 'archer', label: 'Bowman 60' }} where="Sands of Time" howLong="in 3h 40m" />,
    );
    expect(container.textContent?.replace(/\s+/g, ' ')).toBe('Bowman 60·Sands of Time·in 3h 40m');
  });
  it('renders nothing when every token is unknown', () => {
    const { container } = render(<TokenLine />);
    expect(container.innerHTML).toBe('');
  });
});

describe('Sheet (DS-4, TR-17)', () => {
  function Opener() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Why?
        </button>
        <Sheet open={open} title="Why this" onClose={() => setOpen(false)}>
          <button type="button">Report this</button>
          <a href="#x">Source</a>
        </Sheet>
      </>
    );
  }
  it('is a modal dialog: focus moves in, the page is inert, Esc closes and focus returns', () => {
    const { container } = render(<Opener />);
    const opener = screen.getByRole('button', { name: 'Why?' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Why this' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(container.closest('[inert]') ?? container.parentElement?.closest('[inert]')).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.querySelector('[inert]')).toBeNull();
  });
  it('traps Tab inside the sheet', () => {
    render(<Opener />);
    fireEvent.click(screen.getByRole('button', { name: 'Why?' }));
    const dialog = screen.getByRole('dialog');
    const items = within(dialog).getAllByRole('button');
    const last = within(dialog).getByRole('link');
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(items[0]);
    (items[0] as HTMLElement).focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
  it('holds no second sheet inline and no nested details (DS-4)', () => {
    render(<Opener />);
    fireEvent.click(screen.getByRole('button', { name: 'Why?' }));
    expect(document.querySelectorAll('[role="dialog"] [role="dialog"]').length).toBe(0);
    expect(document.querySelectorAll('details details').length).toBe(0);
  });
});

describe('SegmentedControl and Tabs', () => {
  it('a segmented control is a radio group', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="Times"
        value="relative"
        onChange={onChange}
        options={[
          { value: 'relative', label: 'In 2h 10m' },
          { value: 'clock', label: 'Around 20:10' },
        ]}
      />,
    );
    const group = screen.getByRole('group', { name: 'Times' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(2);
    fireEvent.click(radios[1] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith('clock');
  });
  it('tabs move with the arrow keys and keep one tab in the tab order', () => {
    function T() {
      const [v, setV] = useState<'a' | 'b' | 'c'>('a');
      return (
        <Tabs
          label="Tabs"
          value={v}
          onChange={(v) => setV(v)}
          tabs={[
            { value: 'a' as const, label: 'Now' },
            { value: 'b' as const, label: 'Build' },
            { value: 'c' as const, label: 'Gear' },
          ]}
        />
      );
    }
    render(<T />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    fireEvent.keyDown(tabs[0] as HTMLElement, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Gear');
  });
});

describe('Meter, Ring, Badge', () => {
  it('a meter carries its value and a named label; the fill is a custom property only', () => {
    const { container } = render(<Meter value={1010} max={2000} label="1,010 of 2,000 teeth" />);
    const m = screen.getByRole('meter', { name: '1,010 of 2,000 teeth' });
    expect(m.getAttribute('aria-valuenow')).toBe('1010');
    expect(m.getAttribute('style')).toBe('--fill: 0.505;');
    onlyCustomPropertyStyles(container);
  });
  it('a meter clamps out-of-range values', () => {
    render(<Meter value={5000} max={2000} label="over" />);
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('2000');
  });
  it('a ring is an SVG image with a label', () => {
    render(<Ring value={3} max={7} label="3 of 7 dailies" />);
    expect(screen.getByRole('img', { name: '3 of 7 dailies' }).tagName.toLowerCase()).toBe('svg');
  });
  it('a badge names its count in words and hides at zero', () => {
    const { container, rerender } = render(<Badge count={2} label="2 to fix before you leave" />);
    expect(container.textContent).toContain('2 to fix before you leave');
    rerender(<Badge count={0} label="none" />);
    expect(container.innerHTML).toBe('');
  });
});

describe('Loading and the lazy-part states (D-11, US-14, G3)', () => {
  it('shows nothing before its delay, so a fast load never flashes the blob', () => {
    vi.useFakeTimers();
    const { container } = render(<Loading delayMs={400} label="Loading" />);
    expect(container.querySelector('svg')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(container.querySelector('svg')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(container.querySelector('.px-flows-walking-blob')).not.toBeNull();
  });
  it('names its step, then shows the hint after hintAfterMs', () => {
    vi.useFakeTimers();
    render(
      <Loading
        steps={['Reading your save', 'Working it out', 'Drawing your characters']}
        current={1}
        hintAfterMs={30_000}
        hint="Taking a while? Press Cloud Save in the game."
      />,
    );
    expect(screen.getByRole('status').textContent).toContain('Working it out');
    expect(screen.queryByText(/Cloud Save/)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByText(/Cloud Save/)).toBeTruthy();
  });
  it('a failed part is one line with a Try again button', () => {
    const onRetry = vi.fn();
    render(<PartFailed line="Couldn't load this part." retry="Try again" onRetry={onRetry} />);
    expect(screen.getByRole('alert').textContent).toContain("Couldn't load this part.");
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it('the empty state is the sleeping blob plus the next thing to do', () => {
    const { container } = render(<EmptyState line="Nothing to do now. Back in 8h 10m." />);
    expect(container.querySelector('.px-flows-sleeping-blob')).not.toBeNull();
    expect(container.textContent).toContain('Back in 8h 10m');
  });
});

describe('Speech (the NPC why, Quest Log accent)', () => {
  it('opts its subtree into Quest Log tokens and carries the guide and its name tag', () => {
    const { container } = render(<Speech name="Scout">Why text.</Speech>);
    const s = container.querySelector('.a-speech') as HTMLElement;
    expect(s.dataset.direction).toBe('quest');
    expect(s.textContent).toContain('Scout');
    expect(s.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
