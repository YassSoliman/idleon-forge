// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25 render guard, System pages: every game thing a System page names wears its game sprite
// (<GameIcon>, an `img.g-art` from /game-art/), with a wiki link where it isn't already a button. If a
// row loses its sprite, its count drops and this fails.
import type { SystemPicture } from '@idleon-forge/engine/result';
import type { StampsPicture, StampTile, StatuesPicture, VaultPicture } from '@idleon-forge/engine/systems-ui';
import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { SYSTEM_ART } from '../src/art/game/system-art';
import { SystemIcon } from '../src/systems/frame/SystemIcon';
import { StampsBody, StatuesBody, VaultBody } from '../src/systems/NewPictures';
import type { SystemPageBodyProps } from '../src/systems/pages';
import { constructionSections } from '../src/systems/w23/construction';
import { prayersSections, shrinesSections } from '../src/systems/w23/prayers';
import { printerSections } from '../src/systems/w23/printer';
import { refinerySections } from '../src/systems/w23/refinery';
import { trappingSections, worshipSections } from '../src/systems/w23/worship';

afterEach(() => cleanup());

const NOW = 1_000_000;
const sprites = (el: ParentNode) =>
  [...el.querySelectorAll<HTMLImageElement>('img.g-art')].map((i) => i.getAttribute('src') ?? '');
const each = (rows: NodeListOf<Element> | Element[], what: string) => {
  const list = [...rows];
  expect(list.length, what).toBeGreaterThan(0);
  for (const r of list) expect(r.querySelector('img.g-art'), `${what}: ${r.textContent}`).not.toBeNull();
};

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
  elements: [stamp(1), stamp(2), stamp(3, { status: 'now', level: 0, cap: 0, route: 'shop' })],
  lit: 'stamp-StampA3',
  owned: 2,
  total: 3,
  tabs: [{ tab: 'combat', owned: 2, total: 3 }],
  next: ['stamp-StampA3'],
};
const statues: StatuesPicture = {
  systemId: 'statues',
  kind: 'statues',
  elements: Array.from({ length: 6 }, (_, i) => ({
    id: `statue-${i}`,
    actionKey: null,
    index: i,
    name: `Statue ${i}`,
    level: 10,
    grade: i % 3,
    byCharacter: null,
    characterIndices: [],
    goldCoins: null,
    goldInPlan: false,
  })),
  lit: 'statue-1',
  gold: 2,
  onyx: 2,
};
const vault: VaultPicture = {
  systemId: 'upgrade-vault',
  kind: 'vault',
  elements: [0, 1, 2].map((index) => ({
    id: `vault-${index}`,
    actionKey: null,
    index,
    name: `Row ${index}`,
    level: 1,
    maxLevel: 5,
    unlockAt: 0,
    open: index < 2,
    nextCoins: 10,
  })),
  lit: 'vault-1',
  totalLevels: 2,
  nextUnlock: null,
};
const w23 = [
  {
    systemId: 'printer',
    kind: 'printer',
    elements: [
      {
        id: 'p0',
        actionKey: null,
        characterIndex: 0,
        item: 'Copper Ore',
        perHour: 8,
        changeTo: null,
        changeText: null,
      },
      {
        id: 'p1',
        actionKey: null,
        characterIndex: 1,
        item: 'Oak Logs',
        perHour: 8,
        changeTo: null,
        changeText: null,
      },
    ],
    lit: null,
    level: 2,
    activeSlots: 1,
  },
  {
    systemId: 'refinery',
    kind: 'refinery',
    waiting: 0,
    salts: [1, 2].map((n) => ({
      id: `salt-${n}`,
      actionKey: null,
      rawName: `Refinery${n}`,
      name: n === 1 ? 'Redox Salts' : 'Explosive Salts',
      unlocked: n === 1,
      active: true,
      rank: 3,
      power: 10,
      powerCap: 100,
      autoRefine: false,
      fullAt: null,
      dryAt: null,
      fuel: [{ name: 'Copper Ore', held: 100 }],
      inRefinery: 5,
      inChest: 1,
      paysFor: [],
    })),
  },
  {
    systemId: 'construction',
    kind: 'build-slots',
    slots: [
      {
        index: 0,
        name: '3D Printer',
        level: 3,
        maxLevel: 10,
        progress: 1,
        buildCost: 10,
        bodyFull: false,
        salt: null,
      },
    ],
    buildings: [0, 1, 2].map((index) => ({
      index,
      name: `Building ${index}`,
      level: index,
      maxLevel: 10,
      progress: 0,
      buildCost: 10,
      bodyFull: false,
      salt: null,
    })),
    buildRate: 10,
  },
  {
    systemId: 'prayers',
    kind: 'prayers',
    prayers: [0, 1].map((index) => ({
      index,
      name: `Prayer ${index}`,
      bonus: '+1%',
      curse: '-1%',
      level: 1,
      unlocked: true,
      zone: 'Goblin Gorefest',
      wave: 10,
    })),
    equipped: [{ index: 0, prayers: ['Prayer 0'] }],
    totems: [{ name: 'Goblin Gorefest', map: 'Spirit Fields', levelReq: 1, maxWave: 20 }],
    bestWorship: 10,
  },
  {
    systemId: 'shrines',
    kind: 'shrines',
    shrines: [0, 1].map((index) => ({
      index,
      name: `Shrine ${index}`,
      what: '+1%',
      built: 1,
      level: 2,
      map: 'Spirit Fields',
      salt: null,
    })),
    maps: [{ map: 'Spirit Fields', characters: [0] }],
  },
  {
    systemId: 'worship',
    kind: 'worship',
    tanks: [
      {
        id: 't0',
        actionKey: null,
        index: 0,
        charge: 5,
        max: 10,
        fullAt: null,
        skull: 'WorshipSkull1',
        spendAt: null,
      },
    ],
    totems: [
      {
        id: 'totem-0',
        actionKey: null,
        name: 'Goblin Gorefest',
        map: 'Spirit Fields',
        levelReq: 1,
        maxWave: 20,
        usableBy: [0],
      },
    ],
  },
  {
    systemId: 'trapping',
    kind: 'traps',
    returnAt: NOW + 3600_000,
    rows: [
      {
        id: 'trap-0',
        actionKey: null,
        index: 0,
        started: true,
        set: 'Cardboard Traps',
        allowed: 3,
        traps: [],
      },
    ],
  },
] as unknown as SystemPicture[];

const props = (pics: unknown[]) =>
  ({
    s: {
      now: NOW,
      result: { slotPictures: pics, classFamilies: { 0: 'warrior', 1: 'archer' }, returnAt: NOW, skills: [] },
      state: { characters: [{ index: 0, slots: { trapSet: 'TrapBoxSet1' } }] },
      view: {
        roster: [0, 1].map((index) => ({ index, name: `N${index}`, classLabel: 'Squire', level: 50 })),
      },
      navigate: () => {},
    },
    page: { highlight: null, goals: [], wiki: null, frame: { status: { tone: 'mint', reason: '' } } },
  }) as unknown as SystemPageBodyProps;

const tabs = (sections: { tabs: { id: string; render: () => ReactNode }[] } | null) =>
  Object.fromEntries((sections?.tabs ?? []).map((t) => [t.id, () => <>{t.render()}</>]));

describe('System pages wear the game sprites', () => {
  it('every System icon is a game sprite (SYSTEM_ART)', () => {
    for (const id of Object.keys(SYSTEM_ART)) {
      const { container, unmount } = render(<SystemIcon id={id} size={24} />);
      expect(sprites(container), id).toHaveLength(1);
      unmount();
    }
  });

  it('Stamps: every stamp in the book and the next-three ribbon', () => {
    const { container } = render(<StampsBody {...props([stamps])} />);
    each(container.querySelectorAll('.sy-stamp'), 'stamp');
    each(container.querySelectorAll('.sy-ribbon__row'), 'ribbon');
    expect(sprites(container)).toContain('/game-art/data/StampA1.webp');
    expect(
      container.querySelector('.sy-ribbon__row a[href="https://idleon.wiki/wiki/Stamp_3"]'),
    ).not.toBeNull();
  });

  it('Statues: every statue, in its grade', () => {
    const { container } = render(<StatuesBody {...props([statues])} />);
    each(container.querySelectorAll('.sy-statue'), 'statue');
    expect(sprites(container)).toEqual(
      expect.arrayContaining([
        '/game-art/data/Statue1.webp',
        '/game-art/data/StatueG2.webp',
        '/game-art/data/StatueO3.webp',
      ]),
    );
  });

  it('Upgrade Vault: every row', () => {
    const { container } = render(<VaultBody {...props([vault])} />);
    each(container.querySelectorAll('.sy-vrow'), 'vault row');
    expect(sprites(container)).toContain('/game-art/data/VaultUpg0.webp');
  });

  it('3D Printer: each printing sample is the item', () => {
    const t = tabs(printerSections(props(w23)));
    const { container } = render(t.printing?.() ?? <div />);
    each(container.querySelectorAll('.w23-sample'), 'sample');
    expect(sprites(container)).toEqual(
      expect.arrayContaining(['/game-art/data/Copper.webp', '/game-art/data/OakTree.webp']),
    );
  });

  it('Refinery: each salt, its fuel, the next salt and storage', () => {
    const t = tabs(refinerySections(props(w23) as never));
    for (const [id, render_] of Object.entries(t)) {
      const { container, unmount } = render(render_() ?? <div />);
      expect(sprites(container).length, id).toBeGreaterThan(0);
      if (id === 'storage') each(container.querySelectorAll('.w-li'), 'storage row');
      unmount();
    }
  });

  it('Construction: buildings in slots and the building list', () => {
    const t = tabs(constructionSections(props(w23)));
    const slots = render(t.slots?.() ?? <div />);
    expect(sprites(slots.container)).toContain('/game-art/data/ConTower0.webp');
    slots.unmount();
    const all = render(t.buildings?.() ?? <div />);
    each(all.container.querySelectorAll('.w-li'), 'building');
  });

  it('Prayers and Shrines: each prayer, equipped prayer and shrine', () => {
    const pr = tabs(prayersSections(props(w23)));
    const eq = render(pr.equipped?.() ?? <div />);
    expect(sprites(eq.container)).toContain('/game-art/data/Prayer0.webp');
    eq.unmount();
    const all = render(pr.all?.() ?? <div />);
    each(all.container.querySelectorAll('li.w-li'), 'prayer');
    all.unmount();
    const sh = tabs(shrinesSections(props(w23)));
    const allSh = render(sh.all?.() ?? <div />);
    each(allSh.container.querySelectorAll('.w23-shrine'), 'shrine');
    expect(sprites(allSh.container)).toContain('/game-art/data/ConTowerB18.webp');
  });

  it('Worship and Trapping: totems, the skull in a tank, the trap set', () => {
    const w = tabs(worshipSections(props(w23)));
    const totems = render(w.totems?.() ?? <div />);
    each(totems.container.querySelectorAll('.w23-totem'), 'totem');
    totems.unmount();
    const tr = tabs(trappingSections(props(w23)));
    const sets = render(tr.sets?.() ?? <div />);
    expect(sprites(sets.container)).toContain('/game-art/data/TrapBoxSet1.webp');
  });
});
