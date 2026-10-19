// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment jsdom
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C1, GC1: a gate is a link, not a riddle. GateText turns every anvil gate in a sentence into
// one GateLink chip: "(anvil tab 3)" becomes the chip (its words go), "Craft Anvil Tab 4" keeps its words
// and gains the chip; a met tab with a recipe opens that recipe; one chip per tab; no spans, no change.
import type { GateSpan } from '@idleon-forge/engine/production';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { extractGate, GateText, gateOf } from '../src/design/atoms/GateLink';

afterEach(cleanup);

const met = (tab: number): GateSpan => ({
  kind: 'gate',
  gate: 'anvil-tab',
  label: `Anvil tab ${tab}`,
  href: `#system-anvil?tab=recipes&focus=tab-${tab}`,
  system: 'anvil',
  tab: 'recipes',
  focus: `tab-${tab}`,
  met: true,
  icon: `EquipmentSmithingTabs${Math.max(2, tab)}`,
  what: `open tab ${tab}'s recipes`,
});
const unmet = (tab: number): GateSpan => ({
  ...met(tab),
  label: `Anvil Tab ${tab}`,
  href: `#system-anvil?tab=walkthrough&focus=EquipmentSmithingTabs${tab}`,
  tab: 'walkthrough',
  focus: `EquipmentSmithingTabs${tab}`,
  met: false,
  what: `what Anvil Tab ${tab} needs`,
  ready: 0,
  of: 4,
});
const GATES = [met(1), met(2), met(3), unmet(4), unmet(5)];

describe('GateText (GC1)', () => {
  it('a met tab with its recipe: the words go, one chip opens the recipe', () => {
    render(
      <GateText
        text="Craft The Ice Breaker now (anvil tab 3)"
        tabGates={GATES}
        recipe={{ rawName: 'EquipmentSword2', name: 'The Ice Breaker' }}
      />,
    );
    const a = screen.getByRole('link', { name: "Anvil tab 3: open The Ice Breaker's recipe" });
    expect(a.getAttribute('href')).toBe('#system-anvil?tab=recipes&focus=EquipmentSword2');
    expect(document.body.textContent).not.toContain('(anvil tab 3)');
  });

  it('an unmet tab keeps its words and opens its Walkthrough, ready count in the name', () => {
    render(<GateText text="Craft Anvil Tab 4 at the anvil" tabGates={GATES} />);
    const a = screen.getByRole('link', { name: 'Anvil Tab 4 (0 of 4 ready): what Anvil Tab 4 needs' });
    expect(a.getAttribute('href')).toBe('#system-anvil?tab=walkthrough&focus=EquipmentSmithingTabs4');
    expect(document.body.textContent).toContain('Craft Anvil Tab 4');
  });

  it('the gate a view is (self) stays words: no chip back to the same Walkthrough', () => {
    render(<GateText text="Craft Anvil Tab 4 at the anvil" tabGates={GATES} self="EquipmentSmithingTabs4" />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(document.body.textContent).toBe('Craft Anvil Tab 4 at the anvil');
  });

  it('one chip per tab; without spans the sentence is unchanged', () => {
    render(<GateText text="Use Anvil Tab 3 to open anvil tab 3 for every anvil" tabGates={GATES} />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    cleanup();
    render(<GateText text="Craft Golden Net now (anvil tab 2)" tabGates={null} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('extractGate gives a tile its sentence without the words, and the gate', () => {
    const r = extractGate('Craft Golden Net now (anvil tab 2)', GATES, {
      rawName: 'CatchingNet4',
      name: 'Golden Net',
    });
    expect(r.text).toBe('Craft Golden Net now');
    expect(r.gate?.focus).toBe('CatchingNet4');
    expect(gateOf(GATES, 4, { rawName: 'X', name: 'X' })?.met).toBe(false);
  });
});
