// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the Bubba System page's four sections (canvas board after/Bubba): Bonuses to your account (the
// bonus tiles, the next Boon level, and a side column with Megaflesh, the run, pats and Charisma in one
// line each), This run, Charisma, and Pats & gifts. A lazy chunk; it only lays out `EngineResult.bubba`
// with M23's words and panels (BubbaPage.tsx), and adds no advice.
import { BUBBA_WORDS as BW } from '@idleon-forge/engine/bubba-text';
import type { BubbaBonusView, BubbaResult } from '@idleon-forge/engine/result';
import { EmptyState, Pip } from '../design/atoms';
import type { FullPageProps, SystemPageBodyProps } from '../systems/pages';
import { FramedSections } from '../systems/w23/framed';
import { Cap, type PageSections, Split, type Tone } from '../systems/w23/kit';
import { Charisma, Gifts, Megaflesh, Pats, patsLine, Run, Smoker, when } from './BubbaPage';
import './bubba.css';

export const BUBBA_TAB_WORDS = {
  bonuses: 'Bonuses to your account',
  run: 'This run',
  charisma: 'Charisma',
  pats: 'Pats & gifts',
  boon: (level: number) => `Boon Lv ${level}`,
  boonWhat: '(Boon is the upgrade that grows these bonuses)',
  charismaLine: (n: number) => `${n} levels waiting to train`,
  charismaOnly: "Charisma boosts Bubba's meat only, not your account",
  dryRun: (rate: string | null, now: string | null) =>
    [now ? `${now}` : null, rate ? `${rate} a minute` : null].filter(Boolean).join(' · '),
} as const;
const T = BUBBA_TAB_WORDS;

const TONE: Record<BubbaBonusView['rating'], Tone> = { high: 'gold', mid: 'mint', low: 'mut' };

/** "+24% Build Rate" -> ["+24%", "Build Rate"]: the number big, the rest under it. */
export const splitBonus = (text: string): [string, string] => {
  const m = /^([+−-]?\d[\d.,]*%?)\s+(.+)$/.exec(text);
  return m ? [m[1] as string, m[2] as string] : [text, ''];
};

function Bonuses({ p, b }: { p: SystemPageBodyProps; b: BubbaResult }) {
  const now = p.s.now;
  const next = b.boonNext;
  const banked = b.charisma?.banked ?? null;
  return (
    <Split
      main={
        <section className="w-stack" aria-label={BW.accountTitle}>
          <p className="w-p">{BW.accountLede(b.megaflesh.multiplier)}</p>
          <ul className="w-plain bb2-bonuses">
            {b.bonuses.map((x) => {
              const [v, what] = splitBonus(x.text);
              const tone = TONE[x.rating];
              return (
                <li key={x.key} className={`a-tile w-tile bb2-bonus${x.next ? ' is-now' : ''}`}>
                  <span className="w-stack w-stack--4 w-grow">
                    <span className="bb2-v">{v}</span>
                    <span className="w-sm w-mut2">{what}</span>
                  </span>
                  <span className={`w-row w-xs w-b w-t--${tone}`}>
                    <Pip tone={tone === 'mut' ? undefined : tone} />
                    {BW.rating[x.rating]}
                  </span>
                </li>
              );
            })}
          </ul>
          {next ? (
            <p className="a-tile2 w-tile2 w-sm">
              <span className="w-b w-t--gold">{T.boon(next.level)}</span>{' '}
              <span className="w-mut2">
                {T.boonWhat}{' '}
                {[
                  next.add ? `adds ${next.add}` : null,
                  next.cost,
                  next.affordable ? BW.affordable : when(next.at, now),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </p>
          ) : null}
        </section>
      }
      aside={
        <>
          <Megaflesh b={b} now={now} />
          {b.ratePerMin || b.projected ? (
            <div className="w-stack w-stack--8">
              <Cap>{BW.runTitle}</Cap>
              <span className="w-sm">{T.dryRun(b.ratePerMin, b.projected)}</span>
              {b.run.nextType ? <span className="w-xs w-mut2">{b.run.nextType}</span> : null}
            </div>
          ) : null}
          {b.pats ? (
            <div className="w-stack w-stack--8">
              <Cap>{BW.patsTitle}</Cap>
              <span className="w-sm">{patsLine(b.pats, now)}</span>
            </div>
          ) : null}
          {banked ? (
            <div className="w-stack w-stack--8">
              <Cap>{T.charisma}</Cap>
              <span className="w-sm">{T.charismaLine(banked)}</span>
              <span className="w-xs w-mut2">{T.charismaOnly}</span>
            </div>
          ) : null}
        </>
      }
    />
  );
}

export function bubbaSections(p: SystemPageBodyProps): PageSections | null {
  const b = p.s.result.bubba;
  if (!b) return null;
  const now = p.s.now;
  if (b.state !== 'ok') {
    const body = () =>
      b.state === 'unknown' ? <p className="bb-cant">{BW.cantRead}</p> : <EmptyState line={BW.notMaking} />;
    return { answer: null, tabs: [{ id: 'bonuses', label: T.bonuses, render: body }] };
  }
  const banked = b.charisma?.banked ?? null;
  return {
    answer: null,
    tabs: [
      { id: 'bonuses', label: T.bonuses, render: () => <Bonuses p={p} b={b} /> },
      {
        id: 'run',
        label: T.run,
        render: () => (
          <div className="w-stack w-stack--24">
            <Run b={b} />
            <Smoker b={b} now={now} />
          </div>
        ),
      },
      {
        id: 'charisma',
        label: T.charisma,
        badge: banked || null,
        render: () => <Charisma b={b} now={now} />,
      },
      {
        id: 'pats',
        label: T.pats,
        render: () => (
          <div className="w-stack w-stack--24">
            <Pats b={b} now={now} />
            <Gifts b={b} />
          </div>
        ),
      },
    ],
  };
}

/** The Bubba page on the template (FULL_PAGES: bubba), with its login note on the first tab. */
export default function BubbaFullPage(p: FullPageProps) {
  const sections = bubbaSections(p);
  const b = p.s.result.bubba;
  if (sections && b?.loginNote) {
    const [first, ...rest] = sections.tabs;
    if (first)
      sections.tabs = [
        {
          ...first,
          render: () => (
            <>
              <p className="bb-note" role="note">
                {[b.openOn ? BW.openOn(b.openOn) : null, BW.loginNote].filter(Boolean).join('. ')}
              </p>
              {first.render()}
            </>
          ),
        },
        ...rest,
      ];
  }
  return <FramedSections {...p} sections={sections} />;
}
