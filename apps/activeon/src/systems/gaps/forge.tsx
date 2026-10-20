// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-25 the Forge (Wave 2): the 4x4 slot grid (ore, fill, time to empty, barrel, bars waiting),
// the six upgrades, and what the account can feed it. Data is the engine's forge picture (pictures/gaps.ts);
// the Next Actions are the Forge Checks. Game sprites: ores, bars, barrels; our kit as the fallback.
import { shortDuration } from '@idleon-forge/engine/now';
import type { ForgeSlotView } from '@idleon-forge/engine/systems-ui';
import { GameIcon } from '../../art/game/GameIcon';
import { itemArt } from '../../art/game/game-art';
import type { SystemPageBodyProps } from '../pages';
import {
  Bar,
  Big,
  Cap,
  Head,
  n0,
  type PageAnswer,
  type PageSections,
  pictureOf,
  Split,
  Tag,
} from '../w23/kit';
import './gaps.css';

export const FORGE_WORDS = {
  slots: 'Slots',
  upgrades: 'Upgrades',
  feed: 'What you can load',
  ofUnlocked: (n: number) => `${n} of 16 unlocked`,
  locked: 'locked',
  empty: 'Empty slot',
  loadOre: 'load ore',
  lockedMore: (n: number) => `${n} more slots open with the New Forge Slot upgrade`,
  answerCap: 'Do this next',
  thenCollect: (n: string) => `Then collect the ${n} bars waiting.`,
  emptyIn: (t: string) => `empty in ${t}`,
  ranOut: 'ran out',
  barsWaiting: 'Bars waiting',
  collect: 'collect them at the Forge',
  none: 'none',
  capacity: 'Ore per slot',
  brimstone: 'Brimstone',
  barrel: (power: number, effect: 'speed' | 'double') =>
    effect === 'speed' ? `+${power}% speed` : `${power}% extra bar`,
  oreLine: (bars: string) => `${bars} bars' worth`,
  barrels: 'Barrels',
  noOre: 'No ore held. Mining fills the Forge.',
  allSmelting: (t: string) => `Every Forge slot is smelting: the first empties in ${t}`,
  allSmeltingSub: (n: number, cap: string) => `${n} slots, up to ${cap} ore each`,
  noneOpen: 'No Forge slot unlocked yet',
  noneOpenSub: 'Buy New Forge Slot at the Forge in World 1 town.',
  where: 'Where you are',
  level: (lv: number, max: number) => `Lv ${lv} / ${max}`,
  maxed: 'maxed',
  upgradesNote: 'level of max; costs are not shown yet',
} as const;
const W = FORGE_WORDS;

const human = (s: string) => s.replace(/_/g, ' ');

/** Seconds still to run now, from the save's figure and the time since the save. */
const leftNow = (p: SystemPageBodyProps, s: number) => Math.max(0, s - (p.s.now - p.s.state.asOf) / 1000);

function Slot({ p, s }: { p: SystemPageBodyProps; s: ForgeSlotView }) {
  if (!s.unlocked)
    return (
      <li className="a-tile2 w-tile2 gp-slot is-later" aria-label={`Slot ${s.index + 1}: ${W.locked}`}>
        <span className="w-xs w-mut">{W.locked}</span>
      </li>
    );
  const left = s.smelting ? leftNow(p, s.emptyInSeconds) : 0;
  const tone = !s.smelting || left <= 0 ? 'coral' : undefined;
  return (
    <li className={`a-tile2 w-tile2 gp-slot${tone ? ' is-now' : ''}`}>
      <span className="w-row w-row--between">
        {s.ore ? (
          <GameIcon art={itemArt(s.ore.rawName)} fallback="item-ore" size={32} wiki={s.ore.name} decorative />
        ) : (
          <span className="gp-slot__hole" aria-hidden="true" />
        )}
        {s.brimstone ? <Tag tone="gold">{W.brimstone}</Tag> : null}
      </span>
      <span className="w-xs w-b">{s.ore ? s.ore.name : W.empty}</span>
      <Bar value={s.fill} max={1} tone={s.smelting ? 'sky' : 'coral'} label={`Slot ${s.index + 1} ore`} />
      <span className={`w-xs${tone ? ' w-t--coral' : ' w-mut'}`}>
        {!s.smelting ? W.loadOre : left <= 0 ? W.ranOut : W.emptyIn(shortDuration(left))}
      </span>
      {s.barrel || s.bar ? (
        <span className="w-row gp-slot__foot">
          {s.barrel ? (
            <span className="w-row w-xs w-mut" title={s.barrel.name}>
              <GameIcon art={itemArt(s.barrel.rawName)} fallback="sys-forge" size={16} decorative />
              {W.barrel(s.barrel.power, s.barrel.effect)}
            </span>
          ) : null}
          {s.bar ? (
            <span className="w-row w-xs w-t--gold" title={s.bar.name}>
              <GameIcon art={itemArt(s.bar.rawName)} fallback="sys-forge" size={16} decorative />
              {n0(s.bar.amount)}
            </span>
          ) : null}
        </span>
      ) : null}
    </li>
  );
}

function Slots({ p }: { p: SystemPageBodyProps }) {
  const f = pictureOf(p, 'forge');
  if (!f) return null;
  return (
    <Split
      main={
        <section className="w-stack" aria-label={W.slots}>
          <ul className="w-plain gp-forge">
            {f.slots
              .filter((s) => s.unlocked)
              .map((s) => (
                <Slot key={s.index} p={p} s={s} />
              ))}
            {f.slotsUnlocked < f.slots.length ? (
              <li className="a-tile2 w-tile2 gp-slot gp-slot--locked is-later">
                <span className="w-xs w-mut">{W.lockedMore(f.slots.length - f.slotsUnlocked)}</span>
              </li>
            ) : null}
          </ul>
        </section>
      }
      aside={
        <>
          <div className="w-stack">
            <Cap>{W.barsWaiting}</Cap>
            <Big value={n0(f.barsWaiting)} tone={f.barsWaiting ? 'gold' : undefined} />
            {f.bars.length ? (
              <ul className="w-plain w-stack w-stack--4">
                {f.bars.slice(0, 3).map((b) => (
                  <li key={b.rawName} className="w-row w-sm">
                    <GameIcon
                      art={itemArt(b.rawName)}
                      fallback="sys-forge"
                      size={24}
                      wiki={b.name}
                      decorative
                    />
                    <span className="w-grow">{b.name}</span>
                    <span className="w-b">{n0(b.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="w-sm w-mut">{W.none}</span>
            )}
            {f.barsWaiting ? <span className="w-xs w-mut2">{W.collect}</span> : null}
          </div>
          <div className="w-stack">
            <Cap>{W.capacity}</Cap>
            <Big value={n0(f.capacity)} />
          </div>
        </>
      }
    />
  );
}

function Feed({ p }: { p: SystemPageBodyProps }) {
  const f = pictureOf(p, 'forge');
  if (!f) return null;
  return (
    <Split
      main={
        f.ores.length ? (
          <ul className="w-hair w-plain">
            {f.ores.map((o) => (
              <li key={o.rawName} className="w-li">
                <GameIcon art={itemArt(o.rawName)} fallback="item-ore" size={24} wiki={o.name} decorative />
                <span className="w-grow w-b">{o.name}</span>
                <span className="w-sm">{n0(o.amount)}</span>
                <span className="w-xs w-mut">{W.oreLine(n0(o.bars))}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="w-p">{W.noOre}</p>
        )
      }
      aside={
        f.barrels.length ? (
          <div className="w-stack">
            <Cap>{W.barrels}</Cap>
            <ul className="w-plain w-stack w-stack--4">
              {f.barrels.map((b) => (
                <li key={b.rawName} className="w-row w-sm">
                  <GameIcon
                    art={itemArt(b.rawName)}
                    fallback="sys-forge"
                    size={24}
                    wiki={b.name}
                    decorative
                  />
                  <span className="w-stack w-stack--4 w-grow">
                    <span>{b.name}</span>
                    <span className="w-xs w-mut">{W.barrel(b.power, b.effect)}</span>
                  </span>
                  <span className="w-b">{n0(b.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null
      }
    />
  );
}

function Upgrades({ p }: { p: SystemPageBodyProps }) {
  const f = pictureOf(p, 'forge');
  if (!f) return null;
  return (
    <section className="w-stack">
      <Head title={W.upgrades} note={W.upgradesNote} />
      <ul className="w-grid w-grid--3 w-plain">
        {f.upgrades.map((u) => {
          const max = u.maxLevel > 0 && u.level >= u.maxLevel;
          return (
            <li key={u.name} className={`a-tile2 w-tile2${max ? ' is-done' : ''}`}>
              <Cap>{u.name}</Cap>
              <span className="w-row w-row--between">
                <span className="w-sm w-b">{W.level(u.level, u.maxLevel)}</span>
                {max ? <Tag tone="mint">{W.maxed}</Tag> : null}
              </span>
              <Bar
                value={u.level}
                max={Math.max(1, u.maxLevel)}
                tone={max ? 'mint' : 'gold'}
                label={u.name}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function forgeSections(p: SystemPageBodyProps): PageSections | null {
  const f = pictureOf(p, 'forge');
  if (!f) return null;
  let answer: PageAnswer | null = null;
  // Loading idle slots outranks collecting bars: a slot without ore makes nothing until it is filled.
  const fill = p.page.goals.find((g) => g.id === 'forge.check.fill-empty-slots');
  if (fill && p.page.goals[0]?.id !== fill.id)
    answer = {
      tone: 'gold',
      cap: W.answerCap,
      hero: fill.action.text,
      sub: f.barsWaiting ? W.thenCollect(n0(f.barsWaiting)) : null,
    };
  else if (p.page.goals.length === 0) {
    if (f.slotsUnlocked === 0) answer = { tone: 'sky', cap: W.where, hero: W.noneOpen, sub: W.noneOpenSub };
    else if (f.idle === 0 && f.firstEmptySeconds !== null)
      answer = {
        tone: 'mint',
        cap: W.where,
        hero: W.allSmelting(shortDuration(leftNow(p, f.firstEmptySeconds))),
        sub: W.allSmeltingSub(f.slotsUnlocked, n0(f.capacity)),
      };
  }
  return {
    answer,
    tabs: [
      {
        id: 'slots',
        label: W.slots,
        badge: `${f.slotsUnlocked - f.idle}/${f.slotsUnlocked}`,
        render: () => <Slots p={p} />,
      },
      { id: 'feed', label: W.feed, badge: f.ores.length || null, render: () => <Feed p={p} /> },
      { id: 'upgrades', label: W.upgrades, render: () => <Upgrades p={p} /> },
    ],
  };
}
