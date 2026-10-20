// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-17 Elite classes (Wave 1): the six elites Eliteus gives, each with who holds it and who is on
// the way (the Greenie Gang's 10 kills, then the pick), and the Rift levels a score elite plays. Data is
// M26's elite picture (engine pictures/w4.ts); the answer is the Elite Check's first Next Action. Game
// sprites: each elite's class icon, our kit as the fallback.
import type { EliteView } from '@idleon-forge/engine/systems-ui';
import { GameIcon } from '../../art/game/GameIcon';
import { classArtOfName } from '../../art/game/w4-art';
import type { FullPageProps, SystemPageBodyProps } from '../pages';
import { Bar, Big, Cap, Head, type PageSections, pictureOf, Split, Tag, Who } from '../w23/kit';
import './w4.css';

export const ELITE_WORDS = {
  elites: 'The six elites',
  from: (cls: string) => `from ${cls}`,
  holds: 'Holds it',
  onTheWay: 'On the way',
  nobody: 'Nobody yet',
  gang: (k: number) => `Greenie Gang ${k} of 10`,
  pick: 'Gang beaten: pick it at Eliteus',
  rift: (levels: string[]) => `Plays the score levels: ${levels.join(', ')}`,
  done: (n: number) => `${n} promoted`,
  pending: (n: number) => `${n} to promote`,
  how: 'How it works',
  howNote:
    'Eliteus stands on Outskirts of Fallstar Isle (World 4). His first quest is 10 Greenie Gang kills, his second is picking your elite. There is no level gate, and each subclass has exactly one elite.',
  voidwalker: 'Voidwalker, the Journeyman line, comes from Nebulyte, not Eliteus.',
} as const;
const W = ELITE_WORDS;

function EliteTile({ p, e }: { p: SystemPageBodyProps; e: EliteView }) {
  const now = e.onTheWay.length > 0;
  return (
    <li className={`a-tile w-tile${now ? ' is-now' : e.holders.length ? ' is-done' : ''}`}>
      <div className="w-row">
        <span className="w-icon">
          <GameIcon
            art={classArtOfName(e.elite)}
            fallback="class-beginner"
            size={32}
            wiki={e.name}
            decorative
          />
        </span>
        <span className="w-stack w-stack--4">
          <span className="w-b">{e.name}</span>
          <span className="w-xs w-mut">{W.from(e.from)}</span>
        </span>
      </div>
      {e.holders.length ? (
        <div className="w-stack w-stack--4">
          <Cap>{W.holds}</Cap>
          <div className="w-who-list w-sm">
            {e.holders.map((i) => (
              <Who key={i} p={p} index={i} />
            ))}
          </div>
        </div>
      ) : null}
      {now ? (
        <div className="w-stack w-stack--8">
          <Cap tone="gold">{W.onTheWay}</Cap>
          {e.onTheWay.map((o) => (
            <div key={o.index} className="w-stack w-stack--4 w-sm">
              <Who p={p} index={o.index} />
              {o.step === 'pick' ? (
                <Tag tone="gold">{W.pick}</Tag>
              ) : (
                <Bar value={o.kills} max={10} tone="gold" label={W.gang(o.kills)} />
              )}
              {o.step === 'gang' ? <span className="w-xs w-mut num">{W.gang(o.kills)}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
      {!now && e.holders.length === 0 ? <span className="w-xs w-mut">{W.nobody}</span> : null}
      {e.riftGates.length ? <span className="w-xs w-mut">{W.rift(e.riftGates)}</span> : null}
    </li>
  );
}

function Elites({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'elite');
  if (!pic) return null;
  return (
    <Split
      main={
        <ul className="w-grid w-plain" aria-label={W.elites}>
          {pic.elites.map((e) => (
            <EliteTile key={e.elite} p={p} e={e} />
          ))}
        </ul>
      }
      aside={
        <section className="w-stack" aria-label={W.how}>
          <Big value={String(pic.done)} unit={pic.pending ? `promoted · ${pic.pending} to go` : 'promoted'} />
          <Bar
            value={pic.done}
            max={Math.max(1, pic.done + pic.pending)}
            tone="mint"
            label={W.done(pic.done)}
          />
          <Head title={W.how} />
          <p className="w-p w-sm">{W.howNote}</p>
          <p className="w-p w-xs w-mut">{W.voidwalker}</p>
        </section>
      }
    />
  );
}

export function eliteSections(p: FullPageProps): PageSections | null {
  const pic = pictureOf(p, 'elite');
  if (!pic) return null;
  return {
    answer: null,
    tabs: [
      {
        id: 'elites',
        label: W.elites,
        badge: pic.pending ? pic.pending : null,
        render: () => <Elites p={p} />,
      },
    ],
  };
}
