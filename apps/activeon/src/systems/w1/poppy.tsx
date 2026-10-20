// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55 Poppy's Fish Pond (Wave 6): the fish and their rate, the next prestige buy, the twelve
// upgrades (cheapest open ones first), the Megafish ladder and reset spirals, the Tar Pit, and the bonuses
// with the shiny fish. Data is `account.poppy` (Toolbox's own Poppy numbers); the answer is Poppy's first
// firing Check, else where the pond stands. Game sprites: the game's Poppy menu art, our kit as fallback.
import type { PoppyState, PoppyUpgrade } from '@idleon-forge/account-state';
import { aboutDuration, compact } from '@idleon-forge/engine/now';
import { GameIcon } from '../../art/game/GameIcon';
import { FISH_ART, megafishArt, poppyBonusArt, shinyArt, spiralArt } from '../../art/game/poppy-art';
import type { FullPageProps } from '../pages';
import { Big, Cap, Head, n0, type PageAnswer, type PageSections, Split, Tag } from '../w23/kit';
import './w1.css';

export const POPPY_WORDS = {
  tabs: { pond: 'Pond', megafish: 'Megafish', tar: 'Tar Pit', bonuses: 'Bonuses' },
  where: 'Where you are',
  hero: (fish: string, rate: string) => `${fish} fish, ${rate} a minute`,
  resetIn: (n: number, cost: string, eta: string) =>
    `Fisheroo Reset ${n} costs ${cost} fish: ${eta} at this rate`,
  resetOpens: (n: number, at: string, now: string) =>
    `Fisheroo Reset ${n} opens at run progress ${at} (now ${now})`,
  megafish: 'Megafish',
  ofTwelve: (n: number) => `${n} of 12`,
  cheapest: 'Cheapest to buy',
  cheapestNote: 'Open upgrades, cheapest first',
  all: (n: number) => `All ${n} upgrades`,
  level: (n: number) => `Lv ${n0(n)}`,
  cost: (c: string) => `${c} fish`,
  canBuy: 'can buy',
  locked: 'locked',
  opensAt: (at: string) => `opens at run progress ${at}`,
  fish: 'Fish',
  bluefin: 'Bluefin, held and banked',
  banked: (n: string) => `${n} banked since your last visit: open the pond to collect them`,
  tarFish: 'Tartar fish',
  resets: (n: number) => `${n} Fisheroo ${n === 1 ? 'Reset' : 'Resets'} done`,
  spirals: 'Reset spirals',
  spiralNote: 'Each reset gives points to spend on the spirals; they last through every reset.',
  spiral: [
    'Bluefin caught',
    'Shiny speed and luck',
    'Upgrades cheaper',
    'Other spirals higher',
    'Tartar caught',
  ],
  more: (n: number) => `${n} more Megafish`,
  ladderNote: 'A Megafish stays for good. Greatest Catch takes a whole run of fish for the next one.',
  owned: 'owned',
  next: 'next',
  later: 'later',
  tarNote: 'The Tar Pit opens with Megafish: three upgrades at 1, three more at 5, the last two at 8.',
  tarOpensWith: (n: number) => `opens with Megafish ${n}`,
  bonusHead: 'Bonuses from Poppy',
  bonusNote: 'For every character, all the time. They grow with Bonuses from Poppy and with Megafish.',
  shinyHead: 'Shiny fish',
  shinyNote: 'Each kind of shiny fish caught multiplies your bluefin.',
  caught: (n: string) => `${n} caught`,
  /** What Megafish n gives (Toolbox megaFishDesc). */
  megafishGives: [
    'Tar Pit: its first 3 upgrades',
    "Poppy's bonuses x1.5",
    'Two more reset spirals, +5 points a reset',
    "Poppy's bonuses x2",
    'Tar Pit: 3 more upgrades, Tartar fish x3',
    'Fishing Buddy: +50% bluefin and shiny speed a level past 5',
    "Poppy's bonuses x2.5",
    'Tar Pit: the last 2 upgrades, Tartar fish x3 again',
    "Poppy's bonuses x3",
    'Shiny fishing 1% faster a Tasty Fishbait level',
    'Every upgrade 5% cheaper a King Worm level',
    "Poppy's bonuses higher with every Megafish from here",
  ],
} as const;
const W = POPPY_WORDS;
const pct = (b: { value: number; percent: boolean }) =>
  `+${b.value < 100 ? Math.round(b.value * 10) / 10 : compact(b.value)}${b.percent ? '%' : ''}`;
/** The Megafish each Tar Pit upgrade needs (Toolbox tarFishUnlocked: 3 at 1, 3 at 5, 2 at 8). */
const TAR_GATE = [1, 1, 1, 5, 5, 5, 8, 8];

function UpgradeRow({ u, fish }: { u: PoppyUpgrade; fish: number }) {
  const can = u.unlocked && u.cost > 0 && fish >= u.cost;
  return (
    <li className={`w-li${u.unlocked ? '' : ' w1-quiet'}`}>
      <span className="w-stack w-stack--4 w-grow">
        <span className="w-sm w-b">{u.name}</span>
        <span className="w-xs w-mut">
          {W.level(u.level)} · {u.unlocked ? W.cost(compact(u.cost)) : W.opensAt(compact(u.opensAt))}
        </span>
      </span>
      {can ? <Tag tone="gold">{W.canBuy}</Tag> : u.unlocked ? null : <Tag>{W.locked}</Tag>}
    </li>
  );
}

function Pond({ p }: { p: PoppyState }) {
  const ups = p.upgrades ?? [];
  const fish = p.totalFish ?? 0;
  const open = ups.filter((u) => u.unlocked && u.cost > 0).sort((a, b) => a.cost - b.cost);
  return (
    <Split
      main={
        <>
          <section className="w-stack" aria-labelledby="w1-poppy-cheap">
            <Head id="w1-poppy-cheap" title={W.cheapest} note={W.cheapestNote} />
            <ul className="w-hair w-plain">
              {open.slice(0, 3).map((u) => (
                <UpgradeRow key={u.index} u={u} fish={fish} />
              ))}
            </ul>
          </section>
          <details className="w1-fold">
            <summary className="a-cap">{W.all(ups.length)}</summary>
            <ul className="w-hair w-plain">
              {ups.map((u) => (
                <UpgradeRow key={u.index} u={u} fish={fish} />
              ))}
            </ul>
          </details>
        </>
      }
      aside={
        <section className="w-stack" aria-labelledby="w1-poppy-fish">
          <Head id="w1-poppy-fish" title={W.fish} />
          <div className="w-row">
            <GameIcon art={FISH_ART.bluefin} fallback="sys-poppy" size={32} decorative />
            <span className="w-stack w-stack--4">
              <Cap>{W.bluefin}</Cap>
              <Big value={compact(fish)} />
            </span>
          </div>
          {p.pendingFish > 0 ? <p className="w-p w-xs">{W.banked(compact(p.pendingFish))}</p> : null}
          <div className="w-row">
            <GameIcon art={FISH_ART.tar} fallback="sys-poppy" size={32} decorative />
            <span className="w-stack w-stack--4">
              <Cap>{W.tarFish}</Cap>
              <Big value={compact(p.tar?.fish ?? 0)} />
            </span>
          </div>
        </section>
      }
    />
  );
}

function Megafish({ p }: { p: PoppyState }) {
  const have = p.megafish ?? 0;
  const tile = (gives: string, i: number) => {
    const n = i + 1;
    const state = n <= have ? 'owned' : n === have + 1 ? 'next' : 'later';
    return (
      <li
        key={gives}
        className={`a-tile2 w-tile2 w1-mega${state === 'owned' ? ' is-done' : state === 'next' ? ' is-now' : ' is-later'}`}
      >
        <div className="w-row w-row--between">
          <span className="w-row">
            <GameIcon art={megafishArt(n)} fallback="sys-poppy" size={32} decorative />
            <span className="w-b w-sm">{`${W.megafish} ${n}`}</span>
          </span>
          <Tag tone={state === 'owned' ? 'mint' : state === 'next' ? 'gold' : undefined}>{W[state]}</Tag>
        </div>
        <span className="w-xs w-mut">{gives}</span>
      </li>
    );
  };
  // Rule 3: the next three Megafish first (the last three once all twelve are owned); the rest folded.
  const all = W.megafishGives.map((g, i) => ({ g, i }));
  const start = Math.min(Math.max(0, have), all.length - 3);
  const first = all.slice(start, start + 3);
  const rest = all.filter((x) => !first.includes(x));
  return (
    <div className="w-stack w-stack--24">
      <section className="w-stack" aria-labelledby="w1-poppy-mega">
        <Head id="w1-poppy-mega" title={W.megafish} note={W.ofTwelve(Math.min(12, have))} />
        <p className="w-p w-xs">{W.ladderNote}</p>
        <ol className="w-grid w-grid--3 w-plain">{first.map((x) => tile(x.g, x.i))}</ol>
        {rest.length ? (
          <details className="w1-fold">
            <summary className="a-cap">{W.more(rest.length)}</summary>
            <ol className="w-grid w-grid--3 w-plain">{rest.map((x) => tile(x.g, x.i))}</ol>
          </details>
        ) : null}
      </section>
      <section className="w-stack" aria-labelledby="w1-poppy-spirals">
        <Head id="w1-poppy-spirals" title={W.spirals} note={W.resets(p.fisherooResets ?? 0)} />
        <p className="w-p w-xs">{W.spiralNote}</p>
        <ul className="w-grid w-grid--3 w-plain">
          {(p.spirals ?? []).map((s, i) => (
            <li key={W.spiral[i] ?? i} className={`a-tile2 w-tile2${s.level > 0 ? '' : ' is-later'}`}>
              <div className="w-row">
                <GameIcon art={spiralArt(i)} fallback="sys-poppy" size={32} decorative />
                <span className="w-stack w-stack--4">
                  <span className="w-b w-sm">{W.spiral[i]}</span>
                  <span className="w-xs w-mut num">{`${W.level(s.level)} · x${s.multi}`}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function TarPit({ p }: { p: PoppyState }) {
  const tar = p.tar?.upgrades ?? [];
  return (
    <section className="w-stack" aria-labelledby="w1-poppy-tar">
      <Head id="w1-poppy-tar" title={W.tabs.tar} note={`${compact(p.tar?.fish ?? 0)} ${W.tarFish}`} />
      <p className="w-p w-xs">{W.tarNote}</p>
      <ul className="w-hair w-plain">
        {tar.map((u, i) => (
          <li key={u.index} className={`w-li${u.unlocked ? '' : ' w1-quiet'}`}>
            <GameIcon art={FISH_ART.tar} fallback="sys-poppy" size={24} decorative />
            <span className="w-stack w-stack--4 w-grow">
              <span className="w-sm w-b">{u.name}</span>
              <span className="w-xs w-mut">
                {u.unlocked
                  ? `${W.level(u.level)} · ${compact(u.cost)} ${W.tarFish}`
                  : W.tarOpensWith(TAR_GATE[i] ?? 8)}
              </span>
            </span>
            {u.unlocked ? null : <Tag>{W.locked}</Tag>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Bonuses({ p }: { p: PoppyState }) {
  return (
    <div className="w-stack w-stack--24">
      <section className="w-stack" aria-labelledby="w1-poppy-bon">
        <Head id="w1-poppy-bon" title={W.bonusHead} />
        <p className="w-p w-xs">{W.bonusNote}</p>
        <ul className="w-grid w-grid--3 w-plain">
          {(p.bonuses ?? []).map((b, i) => (
            <li key={b.name} className={`a-tile2 w-tile2${b.value > 0 ? '' : ' is-later'}`}>
              <div className="w-row">
                <GameIcon art={poppyBonusArt(i + 1)} fallback="sys-poppy" size={32} decorative />
                <span className="w-stack w-stack--4">
                  <Cap>{b.name}</Cap>
                  <span className="w-b num">{pct(b)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="w-stack" aria-labelledby="w1-poppy-shiny">
        <Head id="w1-poppy-shiny" title={W.shinyHead} />
        <p className="w-p w-xs">{W.shinyNote}</p>
        <ul className="w-grid w-grid--3 w-plain">
          {(p.shiny ?? []).map((s, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the six shiny fish are fixed game positions
            <li key={i} className={`a-tile2 w-tile2${s.caught > 0 ? '' : ' is-later'}`}>
              <div className="w-row">
                <GameIcon art={shinyArt(i)} fallback="sys-poppy" size={32} decorative />
                <span className="w-stack w-stack--4">
                  <span className="w-b num">{`x${s.multi}`}</span>
                  <span className="w-xs w-mut">{W.caught(compact(s.caught))}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** The pond's own answer while no Poppy Check fires: the fish, and the next prestige buy. */
function answerOf(p: PoppyState): PageAnswer {
  const fish = p.totalFish ?? 0;
  const rate = p.fishPerMinute ?? 0;
  const reset = p.upgrades?.find((u) => u.name.toLowerCase() === 'fisheroo reset');
  const n = (p.fisherooResets ?? 0) + 1;
  let sub: string | null = null;
  if (reset?.unlocked && reset.cost > fish && rate > 0)
    sub = W.resetIn(n, compact(reset.cost), aboutDuration(((reset.cost - fish) / rate) * 60));
  else if (reset && !reset.unlocked) sub = W.resetOpens(n, compact(reset.opensAt), compact(p.progress ?? 0));
  const mega = p.megafish ?? 0;
  return {
    tone: 'mint',
    cap: W.where,
    hero: W.hero(compact(fish), compact(rate)),
    sub,
    big: {
      value: String(mega),
      unit: W.megafish,
      meter: Math.min(1, mega / 12),
      note: W.ofTwelve(Math.min(12, mega)),
    },
  };
}

export function poppySections({ s, page }: FullPageProps): PageSections | null {
  const p = s.state.account.poppy;
  if (!p?.unlocked || !p.upgrades) return null;
  return {
    answer: page.goals.some((g) => g.id.startsWith('poppy.check.')) ? null : answerOf(p),
    tabs: [
      { id: 'pond', label: W.tabs.pond, render: () => <Pond p={p} /> },
      {
        id: 'megafish',
        label: W.tabs.megafish,
        badge: `${Math.min(12, p.megafish ?? 0)}/12`,
        render: () => <Megafish p={p} />,
      },
      { id: 'tar', label: W.tabs.tar, render: () => <TarPit p={p} /> },
      { id: 'bonuses', label: W.tabs.bonuses, render: () => <Bonuses p={p} /> },
    ],
  };
}
