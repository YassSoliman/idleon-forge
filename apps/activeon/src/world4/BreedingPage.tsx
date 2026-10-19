// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the Breeding page body (board `after/sys/Breeding`), a read-only view of the save: the
// framed answer, then Nest and Mobs (the nest's eggs, why Breeding matters as the World 4 loop),
// Territories (won once, then foraged), the Mob Arena (wave bonuses on a track with the best wave) and
// Upgrades (as they open). M25: the game's eggs, spices and upgrade sprites (ADR 0009 as amended
// 2026-10-19), our kit as the fallback.
import type { BreedingPageView } from '@idleon-forge/engine/world4';
import { type CSSProperties, useState } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import { eggArt, keyIndex, petUpgradeArt, spiceArt } from '../art/game/w4-art';
import { cx, Pip, Tabs } from '../design/atoms';
import type { Session } from '../shell/session';
import { Frame, Rows, SourceLine, Tag } from './parts';

type BreedTab = 'nest' | 'territories' | 'arena' | 'upgrades';

/** The World 4 loop as boxes and arrows: eggs, Mobs, spices, kitchens, Lab chips, upgrades. */
function Loop() {
  return (
    <svg
      className="w4-loop"
      role="img"
      aria-label="Eggs hatch into Mobs; Mobs forage territories for spices; spices find meals in the kitchens and buy Lab chips; meals pay for Breeding upgrades"
      viewBox="0 0 520 150"
    >
      <g className="w4-loop__box">
        <rect x="0" y="50" width="96" height="44" />
        <rect x="140" y="50" width="96" height="44" />
        <rect className="is-key" x="280" y="0" width="110" height="44" />
        <rect x="424" y="0" width="96" height="44" />
        <rect x="424" y="100" width="96" height="44" />
        <rect x="280" y="100" width="110" height="44" />
      </g>
      <g className="w4-loop__label">
        <text x="48" y="77">
          Eggs
        </text>
        <text x="188" y="77">
          Mobs
        </text>
        <text className="is-key" x="335" y="27">
          Spices
        </text>
        <text x="472" y="27">
          Kitchens
        </text>
        <text x="472" y="127">
          Lab chips
        </text>
        <text x="335" y="127">
          Upgrades
        </text>
      </g>
      <g className="w4-loop__arrow">
        <rect x="96" y="70" width="44" height="4" />
        <rect x="236" y="20" width="4" height="52" />
        <rect x="236" y="20" width="44" height="4" />
        <rect x="390" y="20" width="34" height="4" />
        <rect x="400" y="20" width="4" height="100" />
        <rect x="404" y="120" width="20" height="4" />
        <rect x="470" y="44" width="4" height="34" />
        <rect x="390" y="78" width="84" height="4" />
        <rect x="390" y="78" width="4" height="22" />
      </g>
      <g className="w4-loop__note">
        <text x="432" y="72">
          meals
        </text>
      </g>
    </svg>
  );
}

export function BreedingBody({ s, v }: { s: Session; v: BreedingPageView }) {
  const [tab, setTab] = useState<BreedTab>('nest');
  return (
    <div className="w4-page">
      <Frame f={v.frame} s={s} />
      <Tabs<BreedTab>
        label="Breeding sections"
        value={tab}
        idBase="w4-breed"
        onChange={setTab}
        tabs={v.tabs.map((t) => ({
          value: t.id as BreedTab,
          label: t.label,
          badge: t.badge ? <Tag>{t.badge}</Tag> : undefined,
        }))}
      />
      <div
        id={`w4-breed-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`w4-breed-tab-${tab}`}
        className="w4-panel"
      >
        {tab === 'nest' ? (
          <div className="w4-halves">
            <section className="a-tile w4-sec" aria-labelledby="w4-nest-h">
              <header className="w4-sec__head">
                <h3 id="w4-nest-h" className="sy-h3">
                  The nest
                </h3>
                <span className="w4-muted w4-small">{v.nestLine}</span>
              </header>
              <ul className="w4-nest" aria-label="Nest slots">
                {v.nest.map((e) => (
                  <li key={e.key} className={cx('w4-egg', `is-${e.state}`)}>
                    <span className="w4-egg__box">
                      <GameIcon
                        art={eggArt()}
                        fallback="item-pet-egg"
                        size={48}
                        decorative
                        className={e.state === 'egg' ? undefined : 'w4-dim'}
                      />
                    </span>
                    <span className="w4-xs">{e.label}</span>
                  </li>
                ))}
              </ul>
              <p className="w4-small w4-muted">{v.nestNote}</p>
            </section>
            <section className="a-tile w4-sec" aria-labelledby="w4-loop-h">
              <header className="w4-sec__head">
                <h3 id="w4-loop-h" className="sy-h3">
                  Why it matters
                </h3>
                <span className="w4-muted w4-small">Breeding starts the World 4 loop</span>
              </header>
              <Loop />
              <p className="w4-small w4-muted">{v.loopNote}</p>
            </section>
          </div>
        ) : null}
        {tab === 'territories' ? (
          <section className="w4-sec" aria-labelledby="w4-t-h">
            <header className="w4-sec__head">
              <h3 id="w4-t-h" className="sy-h3">
                {v.territoriesTitle}
              </h3>
              <span className="w4-muted w4-small">{v.territoriesLine}</span>
            </header>
            <div className="w4-split">
              <Rows
                rows={v.territories}
                label="Territories in order"
                art={{ of: (r) => spiceArt(keyIndex(r.key)), fallback: 'item-spice', dim: (r) => !!r.quiet }}
              />
              <aside className="a-tile2 w4-stack">
                <span className="w4-cap">Forage teams</span>
                <GameIcon art={spiceArt(0)} fallback="sys-territories" size={48} decorative />
                <p className="w4-small w4-muted">{v.forageNote}</p>
                <p className="w4-xs w4-muted">{v.claimsNote}</p>
              </aside>
            </div>
          </section>
        ) : null}
        {tab === 'arena' ? (
          <section className="w4-sec" aria-labelledby="w4-a-h">
            <header className="w4-sec__head">
              <h3 id="w4-a-h" className="sy-h3">
                Mob Arena
              </h3>
              <span className="w4-muted w4-small">{v.arenaLine}</span>
            </header>
            <div className="a-tile">
              <ol className="w4-track" aria-label="Mob Arena wave bonuses">
                {v.arena.waves.map((w) => (
                  <li
                    key={w.key}
                    className={cx('w4-wave', w.key2 && 'is-key', w.reached && 'is-reached')}
                    style={{ '--at': w.at } as CSSProperties}
                  >
                    <span className="w4-xs w4-strong">{w.wave}</span>
                    <span className="w4-wave__dot" aria-hidden="true" />
                    <span className="w4-xs">
                      {w.what}
                      {w.reached ? <span className="sr-only"> (reached)</span> : null}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="w4-small w4-muted w4-track__note">
                <Pip tone="gold" /> {v.arena.note}
              </p>
            </div>
          </section>
        ) : null}
        {tab === 'upgrades' ? (
          <div className="w4-split">
            <section className="w4-sec" aria-labelledby="w4-u-h">
              <header className="w4-sec__head">
                <h3 id="w4-u-h" className="sy-h3">
                  Upgrades, as they open
                </h3>
                <span className="w4-muted w4-small">{v.upgradesLine}</span>
              </header>
              <Rows
                rows={v.upgrades}
                label="Breeding upgrades"
                numbered={false}
                art={{
                  of: (r) => petUpgradeArt(keyIndex(r.key)),
                  fallback: 'item-pet-egg',
                  dim: (r) => !!r.quiet,
                }}
              />
            </section>
            <aside className="w4-stack">
              <div className="a-tile2 w4-stack">
                <span className="w4-cap">World 4 Mobs</span>
                <p className="w4-small w4-muted">{v.mobsNote}</p>
              </div>
              <div className="a-tile2 w4-stack">
                <span className="w4-cap">Shiny Mobs · later</span>
                <p className="w4-small w4-muted">{v.shinyNote}</p>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
      <SourceLine sources={[v.source]} />
    </div>
  );
}
