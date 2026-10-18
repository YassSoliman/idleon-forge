// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 area S in the DOM (FR-S4 to FR-S6, US-12, G6, G7, G8): each new picture lights exactly one element
// (scoped `is-now`, DS-21), a "See it" highlight moves the light to its element, labels stay on the lit
// element and at most three others (DS-20), a tap opens one sheet with value, next, cost and Source that
// Esc closes (DS-4, TR-17), the Printer's unchanged slots read "no change", the Vault's header is the
// next unlock gap, the Trapping strip lights "Collect now" once and the Pay 2 Win grid one bar.
import type {
  PrinterPicture,
  StampsPicture,
  StampTile,
  StatuesPicture,
  VaultPicture,
} from '@idleon-forge/engine/pictures';
import type { SystemPicture } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PrinterBody, StampsBody, StatuesBody, VaultBody } from '../src/systems/NewPictures';
import { SYSTEM_PAGES, type SystemPageBodyProps } from '../src/systems/pages';
import { TrappingBody } from '../src/systems/SlotPictures';
import { noAxeViolations } from './helpers/views';

afterEach(() => cleanup());

const stamp = (n: number, over: Partial<StampTile> = {}): StampTile => ({
  id: `stamp-StampA${n}`,
  actionKey: null,
  rawName: `StampA${n}`,
  name: `Stamp ${n}`,
  tab: 'combat',
  level: 10,
  cap: 20,
  status: 'owned',
  route: null,
  nextCoins: 1200,
  raiseInPlan: false,
  ...over,
});
const stamps: StampsPicture = {
  systemId: 'stamps',
  kind: 'stamps',
  elements: [
    stamp(1),
    stamp(2),
    stamp(3, { status: 'now', level: 0, cap: 0, route: 'shop', actionKey: 'stamps.check.shop-now@account' }),
    stamp(4, { status: 'toward', level: 0, cap: 0, route: 'quest' }),
    stamp(5, { status: 'later', level: 0, cap: 0, route: 'drop' }),
    stamp(6, { tab: 'skills' }),
  ],
  lit: 'stamp-StampA3',
  owned: 3,
  total: 6,
  tabs: [
    { tab: 'combat', owned: 2, total: 5 },
    { tab: 'skills', owned: 1, total: 1 },
    { tab: 'misc', owned: 0, total: 0 },
  ],
  next: ['stamp-StampA3', 'stamp-StampA4'],
};
const statues: StatuesPicture = {
  systemId: 'statues',
  kind: 'statues',
  elements: Array.from({ length: 32 }, (_, i) => ({
    id: `statue-${i}`,
    actionKey: i === 4 ? 'spend.priority.w3-early#gold@statues.acquisition.statue-4' : null,
    index: i,
    name: `Statue ${i}`,
    level: 20 + i,
    grade: i < 4 ? 1 : 0,
    byCharacter: i === 4 ? [24, 12] : null,
    characterIndices: i === 4 ? [0, 1] : [],
    goldCoins: null,
    goldInPlan: i === 4,
  })),
  lit: 'statue-4',
  gold: 4,
  onyx: 0,
};
const vault: VaultPicture = {
  systemId: 'upgrade-vault',
  kind: 'vault',
  elements: [
    {
      id: 'vault-0',
      actionKey: null,
      index: 0,
      name: 'Bigger Damage',
      level: 5,
      maxLevel: 5,
      unlockAt: 0,
      open: true,
      nextCoins: null,
    },
    {
      id: 'vault-1',
      actionKey: 'spend.x@upgrade-vault.acquisition.row-1',
      index: 1,
      name: 'Sleepy Time',
      level: 2,
      maxLevel: 25,
      unlockAt: 0,
      open: true,
      nextCoins: 50_000,
    },
    {
      id: 'vault-2',
      actionKey: null,
      index: 2,
      name: 'Special Talent',
      level: 0,
      maxLevel: 1,
      unlockAt: 60,
      open: false,
      nextCoins: null,
    },
  ],
  lit: 'vault-1',
  totalLevels: 27,
  nextUnlock: { levels: 33, name: 'Special Talent' },
};
const printer: PrinterPicture = {
  systemId: 'printer',
  kind: 'printer',
  elements: [
    {
      id: 'printer-0-0',
      actionKey: 'printer.check.slot-plan@account',
      characterIndex: 0,
      item: 'Forest Fibres',
      perHour: 10,
      changeTo: 'Megalodon Tooth',
      changeText: 'Take a Megalodon Tooth sample',
    },
    {
      id: 'printer-1-0',
      actionKey: null,
      characterIndex: 1,
      item: 'Copper Ore',
      perHour: 8,
      changeTo: null,
      changeText: null,
    },
    {
      id: 'printer-2-0',
      actionKey: null,
      characterIndex: 2,
      item: null,
      perHour: null,
      changeTo: null,
      changeText: null,
    },
  ],
  lit: 'printer-0-0',
  level: 3,
  activeSlots: 1,
};
const NOW = 1_000_000;
const traps = {
  systemId: 'trapping',
  kind: 'traps',
  returnAt: NOW + 8 * 3600_000,
  rows: [
    {
      id: 'trap-0',
      actionKey: null,
      index: 0,
      started: true,
      set: 'Cardboard Traps',
      allowed: 3,
      traps: [
        { critter: 'Froge', endsAt: NOW + 2 * 3600_000 },
        { critter: 'Froge', endsAt: NOW + 12 * 3600_000 },
      ],
    },
    {
      id: 'trap-1',
      actionKey: null,
      index: 1,
      started: true,
      set: 'Cardboard Traps',
      allowed: 3,
      traps: [{ critter: 'Crabbo', endsAt: NOW + 3600_000 }],
    },
  ],
} as unknown as SystemPicture;

const roster = [0, 1, 2].map((index) => ({
  index,
  name: `N${index}`,
  classLabel: 'Squire',
  level: 50 + index,
}));
const props = (pics: unknown[], highlight: string | null = null) =>
  ({
    s: {
      now: NOW,
      result: { slotPictures: pics, classFamilies: { 0: 'warrior', 1: 'archer', 2: 'mage' } },
      view: { roster },
    },
    page: { highlight, goals: [], wiki: 'https://idleon.wiki/wiki/Stamps' },
  }) as unknown as SystemPageBodyProps;

describe('US-12 the new System pictures in the DOM', () => {
  it('registers the four page bodies', () => {
    for (const id of ['stamps', 'statues', 'upgrade-vault', 'printer'])
      expect(SYSTEM_PAGES[id]).toBeDefined();
  });

  it('Stamps: one lit stamp, labels on the lit and the next three only, a tap sheet that Esc closes', async () => {
    const { container } = render(<StampsBody {...props([stamps])} />);
    expect(container.querySelectorAll('.sy-stamps .is-now')).toHaveLength(1);
    expect(container.querySelector('.sy-stamps .is-now')?.getAttribute('aria-label')).toBe(
      'Stamp 3, get it now',
    );
    // DS-20: owned stamps that are neither lit nor in the ribbon carry no number.
    expect(container.querySelectorAll('.sy-stamp > b')).toHaveLength(0);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Combat2/5',
      'Skills1/1',
      'Misc0/0',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Stamp 1, Lv 10 of 20' }));
    const dialog = screen.getByRole('dialog', { name: 'Stamp 1' });
    expect(dialog.textContent).toContain('Lv 10 of 20');
    expect(dialog.textContent).toContain('Lv 11');
    expect(dialog.textContent).toContain('1.2k coins');
    expect(dialog.textContent).toContain('IdleOn Wiki page');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container.querySelectorAll('.sy-ribbon__row')).toHaveLength(2);
    await noAxeViolations(container);
  });

  it('Statues: the next Gold lit, "Price not checked" when M7 has no price, the spread chart from the split', () => {
    const { container } = render(<StatuesBody {...props([statues])} />);
    expect(container.querySelectorAll('.sy-statues .is-now')).toHaveLength(1);
    expect(container.textContent).toContain('Gold next: Statue 4 · Price not checked');
    expect(container.textContent).toContain('4 of 32 Gold · 0 Onyx');
    expect(container.querySelectorAll('.sy-spread__row')).toHaveLength(2);
  });

  it('Vault: the header is the next unlock gap, "you are here" at the total, exactly one lit row', () => {
    const { container } = render(<VaultBody {...props([vault])} />);
    expect(container.querySelector('.sy-vault__gap')?.textContent).toBe('33 levels to open Special Talent');
    expect(container.textContent).toContain('you are here · 27 levels');
    const lit = container.querySelectorAll('.sy-vault .is-now');
    expect(lit).toHaveLength(1);
    expect(lit[0]?.textContent).toContain('Sleepy Time');
    expect(lit[0]?.textContent).toContain('50k coins');
  });

  it('Printer: exactly one changed slot, every other slot reads "no change"', () => {
    const { container } = render(<PrinterBody {...props([printer])} />);
    expect(container.querySelectorAll('.sy-printer .is-now')).toHaveLength(1);
    const notes = [...container.querySelectorAll('.sy-pslot__note')].map((n) => n.textContent);
    expect(notes).toEqual(['Take a Megalodon Tooth sample', 'no change', 'no change']);
    expect(container.querySelector('.sy-pslot.is-now')?.textContent).toContain('Forest Fibres');
    expect(container.querySelector('.sy-pslot.is-now')?.textContent).toContain('Megalodon Tooth');
  });

  it('G6: a "See it" highlight moves the light to its element', () => {
    const { container } = render(
      <VaultBody {...props([{ ...vault, lit: 'vault-0' }], vault.elements[1]?.actionKey ?? null)} />,
    );
    expect(container.querySelector('.sy-vault .is-now')?.textContent).toContain('Sleepy Time');
  });

  it('G7 Trapping: one row per character, "Ready to collect" lit once on the first trap done before the return', () => {
    const { container } = render(<TrappingBody {...props([traps])} />);
    expect(container.querySelectorAll('.sy-traprow')).toHaveLength(2);
    expect(container.querySelectorAll('.sy-traps .is-now')).toHaveLength(1);
    expect(container.querySelector('.sy-traps .is-now')?.textContent).toBe('Ready to collect');
    expect(container.textContent).toContain('1 of 2 done before you are back');
  });
});
