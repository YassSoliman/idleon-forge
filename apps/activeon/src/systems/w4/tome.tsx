// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-16 the Tome (Wave 1): the PTS and the damage they pay, the next Account LV gates and what each
// adds, and every metric with its colour and what the next colour takes. Data is M26's tome picture
// (engine pictures/w4.ts, Toolbox's own Tome); metrics under their Account LV gate read "not counting
// yet" (Q3). Game sprites: the Tome's bonus icons, our kit as the fallback.
import type { TomeRowView } from '@idleon-forge/engine/systems-ui';
import { GameIcon } from '../../art/game/GameIcon';
import { etcArt } from '../../art/game/game-art';
import type { FullPageProps, SystemPageBodyProps } from '../pages';
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
import './w4.css';

export const TOME_WORDS = {
  score: 'Score',
  metrics: 'Metrics',
  pts: 'PTS',
  hero: (pts: string, dmg: string) => `Your Tome: ${pts} PTS, +${dmg}% damage`,
  heroNone: 'Your Tome counts no PTS yet',
  counting: (n: number, of: number) => `${n} of ${of} metrics counting`,
  nextAt: (lv: number, n: number) => `next one counts at Account LV ${n0(lv)} (${n0(n)} to go)`,
  startsAt: (lv: number, n: number) => `Metrics start counting at Account LV ${n0(lv)} (${n0(n)} to go)`,
  nextUnlocks: 'Next to count',
  unlockRow: (lv: number, n: number) => `Account LV ${n0(lv)} · ${n0(n)} to go`,
  adds: (p: number) => `+${n0(p)} PTS`,
  waiting: (p: number) => `${n0(p)} PTS wait in metrics that don't count yet`,
  bonuses: 'What the Tome pays',
  damage: 'Damage',
  skillEff: 'Skill Efficiency',
  dropRate: 'Drop Rate',
  pageOff: (page: string, from: string) => `needs the ${page} pages, past ${from} PTS`,
  notCounting: 'not counting yet',
  next: (tier: string, need: string, lower: boolean) => `${tier} at ${need}${lower ? ' or less' : ''}`,
  top: 'top colour',
  colours: 'Colours: bronze, silver, gold, blue. Each colour is a share of the metric’s most PTS.',
  rest: (n: number) => `${n} metrics that don't count yet`,
} as const;
const W = TOME_WORDS;
const pct = (n: number) => (Math.round(n * 10) / 10).toString();

function Row({ r }: { r: TomeRowView }) {
  return (
    <li className={`w-li w4-tome-row${r.counting ? '' : ' w4-quiet'}`}>
      <span className={`w4-tome-tier w4-tome-tier--${r.tier}`} aria-hidden="true" />
      <span className="w-stack w-stack--4 w-grow">
        <span className="w-sm">{r.name}</span>
        <span className="w-xs w-mut">
          {r.quantity}
          {r.next ? ` · ${W.next(r.next.tier, r.next.need, r.lowerIsBetter)}` : ` · ${W.top}`}
        </span>
      </span>
      <span className="w-stack w-stack--4 w4-tome-pts">
        <span className="w-xs num">
          {n0(r.points)} / {n0(r.maxPoints)}
        </span>
        {r.counting ? null : <span className="w-xs w-mut">{W.notCounting}</span>}
      </span>
    </li>
  );
}

function Score({ p }: { p: SystemPageBodyProps }) {
  const t = pictureOf(p, 'tome');
  if (!t) return null;
  const bonuses = [
    { key: 'dmg', icon: 'Tome_0', label: W.damage, value: t.damagePct, off: null },
    {
      key: 'eff',
      icon: 'Tome_1',
      label: W.skillEff,
      value: t.skillEffPct,
      off: t.pages.blue ? null : W.pageOff('Blue', '4,000'),
    },
    {
      key: 'drop',
      icon: 'Tome_2',
      label: W.dropRate,
      value: t.dropRatePct,
      off: t.pages.red ? null : W.pageOff('Red', '8,000'),
    },
  ];
  return (
    <Split
      main={
        <>
          <section className="w-stack" aria-labelledby="w4-tome-next">
            <Head
              id="w4-tome-next"
              title={W.nextUnlocks}
              note={t.waiting ? W.waiting(t.waiting) : undefined}
            />
            <ul className="w-hair w-plain">
              {t.nextUnlocks.map((u) => (
                <li key={u.name} className="w-li">
                  <span className="w-stack w-stack--4 w-grow">
                    <span className="w-sm w-b">{u.name}</span>
                    <span className="w-xs w-mut">{W.unlockRow(u.lvReq, u.levelsToGo)}</span>
                  </span>
                  <Tag tone="gold">{W.adds(u.points)}</Tag>
                </li>
              ))}
            </ul>
          </section>
          <section className="w-stack" aria-labelledby="w4-tome-pays">
            <Head id="w4-tome-pays" title={W.bonuses} />
            <ul className="w-grid w-grid--3 w-plain">
              {bonuses.map((b) => (
                <li key={b.key} className={`a-tile2 w-tile2${b.off ? ' is-later' : ''}`}>
                  <div className="w-row">
                    <GameIcon art={etcArt(b.icon)} fallback="sys-tome" size={24} decorative />
                    <Cap>{b.label}</Cap>
                  </div>
                  <Big value={`+${pct(b.value)}%`} />
                  {b.off ? <span className="w-xs w-mut">{b.off}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        </>
      }
      aside={
        <section className="w-stack" aria-label={W.counting(t.counted, t.total)}>
          <Big value={n0(t.points)} unit={W.pts} />
          <Bar value={t.counted} max={t.total} tone="mint" label={W.counting(t.counted, t.total)} />
          <span className="w-sm">{W.counting(t.counted, t.total)}</span>
          <p className="w-p w-xs w-mut">{W.colours}</p>
        </section>
      }
    />
  );
}

function Metrics({ p }: { p: SystemPageBodyProps }) {
  const t = pictureOf(p, 'tome');
  if (!t) return null;
  const counting = t.rows.filter((r) => r.counting);
  const rest = t.rows.filter((r) => !r.counting);
  return (
    <section className="w-stack" aria-label={W.metrics}>
      <ul className="w-hair w-plain">
        {counting.map((r) => (
          <Row key={r.name} r={r} />
        ))}
      </ul>
      {rest.length ? (
        <details className="w4-fold">
          <summary className="a-cap">{W.rest(rest.length)}</summary>
          <ul className="w-hair w-plain">
            {rest.map((r) => (
              <Row key={r.name} r={r} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

export function tomeSections(p: FullPageProps): PageSections | null {
  const t = pictureOf(p, 'tome');
  if (!t) return null;
  const next = t.nextUnlocks[0];
  const answer: PageAnswer | null =
    p.page.goals.length > 0
      ? null
      : t.counted === 0
        ? {
            tone: 'sky',
            cap: 'Coming up',
            hero: W.heroNone,
            sub: next ? W.startsAt(next.lvReq, next.levelsToGo) : null,
          }
        : {
            tone: 'mint',
            cap: 'Where you are',
            hero: W.hero(n0(t.points), pct(t.damagePct)),
            sub: [W.counting(t.counted, t.total), next ? W.nextAt(next.lvReq, next.levelsToGo) : null]
              .filter(Boolean)
              .join(' · '),
          };
  return {
    answer,
    tabs: [
      { id: 'score', label: W.score, render: () => <Score p={p} /> },
      { id: 'metrics', label: W.metrics, badge: `${t.counted}/${t.total}`, render: () => <Metrics p={p} /> },
    ],
  };
}
