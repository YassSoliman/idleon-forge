// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-51 Orion the Great Horned Owl (Wave 4): the feathers and the 9 upgrades, the six stats Bonuses of
// Orion pays, and the 10 named Megafeathers. Data is the owl picture (engine pictures/w1.ts, Toolbox's
// parseOwl). The answer is Orion's Check when one fires (restart, Mega Reset, a bonus to buy, start him),
// else where Orion stands. Game sprites: Orion, his upgrade icons (Owl_i) and bonus icons (Owlb_i).
import type { OwlPicture } from '@idleon-forge/engine/systems-ui';
import { GameIcon } from '../../art/game/GameIcon';
import { etcArt } from '../../art/game/game-art';
import type { FullPageProps, SystemPageBodyProps } from '../pages';
import { Big, Cap, Head, type PageAnswer, type PageSections, pictureOf, Split, Tag } from '../w23/kit';
import './w1.css';

export const OWL_WORDS = {
  orion: 'Orion',
  upgrades: 'Upgrades',
  bonuses: 'Bonuses',
  megas: 'Megafeathers',
  feathers: 'feathers',
  perSec: (rate: string) => `${rate} a second`,
  hero: (rate: string) => `Orion makes ${rate} feathers a second`,
  sub: (mf: number, l: number) => `Megafeather ${mf} · Bonuses of Orion ${l}`,
  level: (n: number) => `Lv ${n.toLocaleString('en-US')}`,
  cost: (c: string) => `next ${c}`,
  opensAt: (at: string) => `opens at ${at} feathers this run`,
  buy: 'can buy',
  nextUnlock: (name: string, at: string) => `${name} opens at ${at} feathers made this run`,
  allOpen: 'Every upgrade is open',
  run: 'This run',
  made: (p: string) => `${p} feathers made this run`,
  restarts: (n: number) => `${n} Restarts this Megafeather`,
  shiny: (n: number) => `${n.toLocaleString('en-US')} Shiny Feathers`,
  multi: (m: string) => `Orion's bonuses ${m}`,
  boLevel: (l: number) => `Bonuses of Orion ${l}`,
  nextBonus: (b: string) => `Next level: ${b}`,
  never: 'Bonuses of Orion never resets: every level is a permanent stat for every character.',
  nextAt: (lv: number) => `next step at ${lv}`,
  owned: 'owned',
  later: 'later',
  megaNote: (n: number) =>
    n > 10
      ? `${n} owned: every one past the 10th adds half of Orion's base bonuses again`
      : `${n} of 10 named`,
} as const;
const W = OWL_WORDS;

/** Orion's bonus icons (Owlb_1..6) by stat, in the cycle's order. */
const BONUS_ICON: Readonly<Record<string, string>> = {
  'Class XP': 'Owlb_1',
  'Base DMG': 'Owlb_2',
  'Total DMG': 'Owlb_3',
  'Skill XP': 'Owlb_4',
  'Drop Rate': 'Owlb_5',
  'All Stats': 'Owlb_6',
};

function Upgrades({ o }: { o: OwlPicture }) {
  return (
    <Split
      main={
        <section className="w-stack" aria-labelledby="w1-owl-up">
          <Head
            id="w1-owl-up"
            title={W.upgrades}
            note={o.nextUnlock ? W.nextUnlock(o.nextUnlock.name, o.nextUnlock.at) : W.allOpen}
          />
          <ul className="w-hair w-plain">
            {o.upgrades.map((u) => (
              <li key={u.index} className={`w-li${u.unlocked ? '' : ' w1-later'}`}>
                <GameIcon art={etcArt(`Owl_${u.index}`)} fallback="sys-owl" size={32} decorative />
                <span className="w-stack w-stack--4 w-grow">
                  <span className="w-sm w-b">{u.name}</span>
                  <span className="w-xs w-mut">
                    {u.unlocked ? `${W.level(u.level)} · ${W.cost(u.cost)}` : W.opensAt(u.unlockAt)}
                  </span>
                </span>
                {u.affordable ? <Tag tone="gold">{W.buy}</Tag> : u.unlocked ? null : <Tag>{W.later}</Tag>}
              </li>
            ))}
          </ul>
        </section>
      }
      aside={
        <section className="w-stack" aria-label={W.run}>
          <div className="w-row">
            <GameIcon art={etcArt('Owl')} fallback="sys-owl" size={48} decorative />
            <span className="w-stack w-stack--4">
              <Big value={o.feathers} unit={W.feathers} />
              <span className="w-sm">{W.perSec(o.rate)}</span>
            </span>
          </div>
          <ul className="w-plain w-stack w-stack--4">
            <li className="w-xs w-mut">{W.made(o.progress)}</li>
            <li className="w-xs w-mut">{W.restarts(o.restarts)}</li>
            <li className="w-xs w-mut">{W.shiny(o.shiny)}</li>
          </ul>
        </section>
      }
    />
  );
}

function Bonuses({ o }: { o: OwlPicture }) {
  return (
    <section className="w-stack" aria-labelledby="w1-owl-bo">
      <Head id="w1-owl-bo" title={W.boLevel(o.bonusesLevel)} note={W.multi(o.multiplier)} />
      <ul className="w-grid w-grid--3 w-plain">
        {o.bonuses.map((b) => (
          <li key={b.name} className="a-tile2 w-tile2">
            <div className="w-row">
              <GameIcon art={etcArt(BONUS_ICON[b.name])} fallback="sys-owl" size={24} decorative />
              <Cap>{b.name}</Cap>
            </div>
            <Big value={b.value} />
            <span className="w-xs w-mut">{W.nextAt(b.nextAt)}</span>
          </li>
        ))}
      </ul>
      {o.nextBonus ? <p className="w-p w-sm">{W.nextBonus(o.nextBonus)}</p> : null}
      <p className="w-p w-xs w-mut">{W.never}</p>
    </section>
  );
}

function Megas({ o }: { o: OwlPicture }) {
  return (
    <section className="w-stack" aria-labelledby="w1-owl-mf">
      <Head id="w1-owl-mf" title={W.megas} note={W.megaNote(o.megafeathers)} />
      <ol className="w-grid w-grid--3 w-plain">
        {o.megas.map((m) => (
          <li key={m.n} className={`a-tile2 w-tile2${m.owned ? ' w1-done' : ' w1-later'}`}>
            <div className="w-row w-row--between">
              <Cap>{`#${m.n}`}</Cap>
              {m.owned ? <Tag tone="mint">{W.owned}</Tag> : <Tag>{W.later}</Tag>}
            </div>
            <span className="w-sm">{m.words}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function owlSections(p: FullPageProps): PageSections | null {
  const o = pictureOf(p as SystemPageBodyProps, 'owl');
  if (!o) return null;
  const acting = p.page.goals.some((g) => g.category !== 'nice');
  const answer: PageAnswer | null = acting
    ? null
    : {
        tone: 'mint',
        cap: 'Where you are',
        hero: W.hero(o.rate),
        sub: W.sub(o.megafeathers, o.bonusesLevel),
      };
  return {
    answer,
    tabs: [
      { id: 'orion', label: W.orion, render: () => <Upgrades o={o} /> },
      { id: 'bonuses', label: W.bonuses, badge: o.bonusesLevel, render: () => <Bonuses o={o} /> },
      { id: 'megafeathers', label: W.megas, badge: o.megafeathers, render: () => <Megas o={o} /> },
    ],
  };
}
