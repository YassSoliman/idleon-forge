// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-11 The Rift (Wave 1): this level's task as a meter, the "Coming up" strip of the next ten levels
// with their elite gates, and the twelve bonuses on a ladder, each linking to the System it feeds. Data
// is M26's rift picture (engine pictures/w4.ts); the answer is the Rift Checks' first Next Action, as on
// every page. Every Rift number is the engine's `riftLabel()`. Game sprites: the level's monster face
// and the bonus icons (`Rift_<n>`), our kit as the fallback.
import type { RiftBonusView, RiftLevelView } from '@idleon-forge/engine/systems-ui';
import { GameIcon } from '../../art/game/GameIcon';
import { dataArt, itemArt } from '../../art/game/game-art';
import { formatRoute } from '../../shell/route';
import type { Session } from '../../shell/session';
import type { FullPageProps, SystemPageBodyProps } from '../pages';
import { Bar, Big, Cap, Head, n0, type PageSections, pictureOf, Split, Tag } from '../w23/kit';
import './w4.css';

export const RIFT_WORDS = {
  now: 'This level',
  coming: 'Coming up',
  bonuses: 'Bonuses',
  of: (done: number, max: number) => `${done} of ${max} levels done`,
  progress: (v: string, q: string) => `${v} of ${q}`,
  doneWalk: 'Done: walk into the portal in The Rift to go on',
  afkHere: (n: number) => `${n} AFK on The Rift`,
  nextBonus: (name: string, n: number) => `${name} in ${n} ${n === 1 ? 'level' : 'levels'}`,
  allBonuses: 'Every bonus is open',
  open: 'open',
  next: 'next',
  later: 'later',
  needs: (elite: string) => `needs a ${elite}`,
  has: (elite: string) => elite,
  opens: (name: string) => `opens ${name}`,
  noneLeft: 'You are past the last Rift level.',
  quest: "The Rift Ripper's items",
  questNote:
    "The quest 'Entering The Rift...' takes these three items and opens The Rift for the whole account.",
  held: (have: string, need: string) => `${have} of ${need}`,
  counted: (n: number) => `${n} counted`,
  gateNote:
    'Score levels only count on that elite class. A class it promotes to keeps its talents, so it counts too.',
  afkNote:
    'AFK-kill levels fill while a character is AFK on The Rift. Every other level only moves while you play it, and kills past a quota are lost until someone walks through the portal.',
} as const;
const W = RIFT_WORDS;

function SysLink({ s, system, children }: { s: Session; system: string; children: string }) {
  return (
    <a
      className="w-link"
      href={formatRoute({ place: 'system', id: system })}
      onClick={(e) => {
        e.preventDefault();
        s.navigate({ place: 'system', id: system }, 'push');
      }}
    >
      {children} ›
    </a>
  );
}

function Face({ icon, size = 32 }: { icon: string; size?: 24 | 32 | 48 }) {
  return (
    <span className="w-icon">
      <GameIcon art={dataArt(icon)} fallback="sys-rift" size={size} decorative />
    </span>
  );
}

function Gate({ gate }: { gate: RiftLevelView['gate'] }) {
  if (!gate) return null;
  return (
    <Tag tone={gate.owned ? 'mint' : 'coral'}>{gate.owned ? W.has(gate.elite) : W.needs(gate.elite)}</Tag>
  );
}

function Current({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'rift');
  if (!pic) return null;
  const c = pic.current;
  if (!c) return <p className="w-p">{W.noneLeft}</p>;
  return (
    <section className={`a-tile w-tile${c.complete ? ' is-done' : ' is-now'}`} aria-labelledby="w4-rift-now">
      <div className="w-row w-row--between">
        <span className="w-row">
          <Face icon={c.icon} size={48} />
          <span className="w-stack w-stack--4">
            <Cap>{W.now}</Cap>
            <h3 id="w4-rift-now" className="a-h2">
              {c.label}
            </h3>
          </span>
        </span>
        <span className="w-row">
          <Tag>{c.kind}</Tag>
          <Gate gate={c.gate} />
        </span>
      </div>
      <p className="w-p w-b">{c.task}</p>
      <Bar
        value={Math.min(c.progress, c.quota)}
        max={Math.max(1, c.quota)}
        tone={c.complete ? 'mint' : 'gold'}
        label={W.progress(n0(c.progress), n0(c.quota))}
      />
      <div className="w-row w-row--between w-xs">
        <span className="w-mut num">{W.progress(n0(c.progress), n0(c.quota))}</span>
        <span className="w-mut">
          {pic.afk.length ? W.afkHere(pic.afk.length) : ''}
          {c.counted ? ` · ${W.counted(c.counted)}` : ''}
        </span>
      </div>
      {c.complete ? <p className="w-p w-t--mint">{W.doneWalk}</p> : null}
    </section>
  );
}

function Coming({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'rift');
  if (!pic || pic.upcoming.length === 0) return null;
  const first = pic.upcoming.slice(0, 3);
  const rest = pic.upcoming.slice(3);
  const row = (l: RiftLevelView) => (
    <li key={l.shown} className="w-li w4-rift-level">
      <span className="w4-rift-n num">{l.shown}</span>
      <Face icon={l.icon} size={24} />
      <span className="w-stack w-stack--4 w-grow">
        <span className="w-sm">{l.task}</span>
        <span className="w-xs w-mut">
          {l.kind}
          {l.bonus ? ` · ${W.opens(l.bonus)}` : ''}
        </span>
      </span>
      <Gate gate={l.gate} />
    </li>
  );
  return (
    <section className="w-stack" aria-labelledby="w4-rift-coming">
      <Head id="w4-rift-coming" title={W.coming} />
      <ol className="w-hair w-plain">{first.map(row)}</ol>
      {rest.length ? (
        <details className="w4-fold">
          <summary className="a-cap">{`${rest.length} more`}</summary>
          <ol className="w-hair w-plain">{rest.map(row)}</ol>
        </details>
      ) : null}
      {pic.upcoming.some((l) => l.gate) ? <p className="w-p w-xs w-mut">{W.gateNote}</p> : null}
    </section>
  );
}

function BonusTile({ s, b }: { s: Session; b: RiftBonusView }) {
  return (
    <li
      className={`a-tile2 w-tile2 w4-bonus${b.unlocked ? ' is-done' : b.next ? ' is-now' : ''}${b.later ? ' is-later' : ''}`}
    >
      <div className="w-row w-row--between">
        <span className="w-row">
          <GameIcon art={dataArt(`Rift_${b.icon}`)} fallback="sys-rift" size={32} decorative />
          <span className="w-b w-sm">{b.name}</span>
        </span>
        <Tag tone={b.unlocked ? 'mint' : b.next ? 'gold' : undefined}>
          {b.unlocked ? W.open : b.later ? W.later : b.label}
        </Tag>
      </div>
      <span className="w-xs w-mut">{b.what}</span>
      {b.system ? (
        <SysLink s={s} system={b.system}>
          {b.name}
        </SysLink>
      ) : null}
    </li>
  );
}

function Ladder({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'rift');
  if (!pic) return null;
  const done = pic.bonuses.filter((b) => b.unlocked).length;
  return (
    <section className="w-stack" aria-labelledby="w4-rift-bonus">
      <Head
        id="w4-rift-bonus"
        title={W.bonuses}
        note={pic.nextBonus ? W.nextBonus(pic.nextBonus.name, pic.nextBonus.levelsToGo) : W.allBonuses}
      />
      <ol className="w4-ladder" aria-label={`${done} of ${pic.bonuses.length} bonuses open`}>
        {pic.bonuses.map((b) => (
          <li
            key={b.name}
            className={`w4-ladder__pip${b.unlocked ? ' is-done' : b.next ? ' is-next' : ''}`}
            title={`${b.label}: ${b.name}`}
          />
        ))}
      </ol>
      <ul className="w-grid w-grid--3 w-plain">
        {pic.bonuses.map((b) => (
          <BonusTile key={b.name} s={p.s} b={b} />
        ))}
      </ul>
    </section>
  );
}

function Overview({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'rift');
  if (!pic) return null;
  return (
    <Split
      main={
        <>
          <Current p={p} />
          <Coming p={p} />
        </>
      }
      aside={
        <section className="w-stack" aria-label={W.of(pic.done, pic.max)}>
          <Big value={String(pic.done)} unit={`of ${pic.max} levels done`} />
          <Bar value={pic.done} max={pic.max} tone="mint" label={W.of(pic.done, pic.max)} />
          {pic.nextBonus ? (
            <p className="w-p w-sm">
              <span className="w-b">{W.nextBonus(pic.nextBonus.name, pic.nextBonus.levelsToGo)}</span>
              <span className="w-mut"> · {pic.nextBonus.label}</span>
            </p>
          ) : null}
          <p className="w-p w-xs w-mut">{W.afkNote}</p>
        </section>
      }
    />
  );
}

function Quest({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'rift');
  if (!pic || pic.quest.length === 0) return null;
  return (
    <section className="w-stack" aria-labelledby="w4-rift-quest">
      <Head id="w4-rift-quest" title={W.quest} />
      <ul className="w-hair w-plain">
        {pic.quest.map((q) => (
          <li key={q.rawName} className="w-li">
            <span className="w-icon">
              <GameIcon
                art={itemArt(q.rawName)}
                fallback="item-monster-material"
                size={32}
                wiki={q.name}
                decorative
              />
            </span>
            <span className="w-stack w-stack--4 w-grow">
              <span className="w-sm w-b">{q.name}</span>
              <Bar
                value={Math.min(q.have, q.need)}
                max={q.need}
                tone={q.have >= q.need ? 'mint' : 'gold'}
                label={W.held(n0(q.have), n0(q.need))}
              />
            </span>
            <span className="w-xs num">{W.held(n0(Math.min(q.have, q.need)), n0(q.need))}</span>
          </li>
        ))}
      </ul>
      <p className="w-p w-xs w-mut">{W.questNote}</p>
    </section>
  );
}

export function riftSections(p: FullPageProps): PageSections | null {
  const pic = pictureOf(p, 'rift');
  if (!pic) return null;
  if (!pic.unlocked)
    return {
      answer: null,
      tabs: [
        { id: 'quest', label: W.quest, render: () => <Quest p={p} /> },
        { id: 'bonuses', label: W.bonuses, render: () => <Ladder p={p} /> },
      ],
    };
  return {
    answer: null,
    tabs: [
      { id: 'level', label: W.now, render: () => <Overview p={p} /> },
      {
        id: 'bonuses',
        label: W.bonuses,
        badge: `${pic.bonuses.filter((b) => b.unlocked).length}/${pic.bonuses.length}`,
        render: () => <Ladder p={p} />,
      },
    ],
  };
}
