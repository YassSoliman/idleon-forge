// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/Statues.dc.html): the Statues page on the System template. The answer is M7's
// first statue Gold line (the picture's lit statue); tabs: the statue wall with the lit statue's levels
// per character, and every character's statue levels. Data: area S's statues picture.
import { formatCoins } from '@idleon-forge/engine/now';
import { STATUE_WORDS, type StatuesPicture, STATUES_PAGE_WORDS as W } from '@idleon-forge/engine/systems-ui';
import { WhoGlyph } from '../../design/who/WhoGlyph';
import { ChecksTile, SimplePage } from '../frame/SimplePage';
import { type FrameAnswer, frameAnswer, Pip, SystemFrame } from '../frame/SystemFrame';
import type { FullPageProps } from '../pages';
import './pages.css';

function StatueGlyph({ gold, next }: { gold: boolean; next: boolean }) {
  const body = gold ? 'var(--accent)' : next ? 'var(--fg)' : 'var(--line-strong)';
  const base = gold ? 'var(--tier-gold-2)' : 'var(--sunk)';
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="6" y="1" width="4" height="4" fill={body} />
      <rect x="5" y="5" width="6" height="5" fill={body} />
      <rect x="6" y="10" width="4" height="2" fill={base} />
      <rect x="3" y="12" width="10" height="3" fill={base} />
    </svg>
  );
}

export default function StatuesPage({ s, page }: FullPageProps) {
  const pic = page.pictures.find((p) => p.kind === 'statues') as StatuesPicture | undefined;
  if (!pic) return <SimplePage s={s} page={page} />;
  const lit = pic.elements.find((e) => e.id === pic.lit) ?? null;
  const total = pic.elements.length;
  const big = {
    value: String(pic.gold),
    unit: W.ofGold(total),
    meter: total ? pic.gold / total : 0,
    note: W.onyx(pic.onyx),
    tone: 'gold' as const,
  };
  const answer: FrameAnswer = lit
    ? {
        tone: 'gold',
        cap: W.inPlan,
        hero: W.hero(lit.name),
        sub: lit.goldCoins !== null ? W.subPrice(formatCoins(lit.goldCoins)) : W.subNoPrice,
        big,
      }
    : { ...frameAnswer(page), big };
  const who = (i: number) => {
    const c = s.result.characters.find((x) => x.index === i);
    const family = s.result.classFamilies?.[i];
    return c ? { label: `${c.classLabel} ${c.level}`, family } : null;
  };
  return (
    <SystemFrame
      s={s}
      page={page}
      answer={answer}
      tabs={[
        {
          id: 'wall',
          label: W.tabs.wall,
          render: () => (
            <div className="sf-split">
              <section className="sf-sec" aria-labelledby="su-wall-h">
                <h3 id="su-wall-h" className="sr-only">
                  {W.tabs.wall}
                </h3>
                <p className="sf-legend">
                  <span>
                    <Pip tone="gold" />
                    {W.legendGold}
                  </span>
                  <span>
                    <Pip tone="mut" />
                    {W.legendNot}
                  </span>
                  <span>{W.legendNumber}</span>
                </p>
                <ul className="su-wall">
                  {pic.elements.map((t) => {
                    const gold = t.grade >= 1;
                    const next = t.id === lit?.id;
                    return (
                      <li
                        key={t.id}
                        className={`su-cell${next ? ' su-cell--next' : ''}`}
                        aria-label={W.aria(t.name, t.level, STATUE_WORDS.grade[Math.min(3, t.grade)] ?? '')}
                      >
                        <StatueGlyph gold={gold} next={next} />
                        <span className={`sf-xs sf-strong ${gold ? 'sf-t--gold' : 'sf-t--mut'}`}>
                          {t.level > 0 ? t.level : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {lit ? <p className="sf-hint">{W.highlighted(lit.name)}</p> : null}
              </section>
              <aside className="sf-col">
                {lit ? (
                  <section className="sf-sec" aria-labelledby="su-by-h">
                    <span id="su-by-h" className="sf-capline">
                      {W.byCharacter(lit.name)}
                    </span>
                    {lit.byCharacter ? (
                      <ul className="sf-hair">
                        {lit.byCharacter.map((lv, k) => {
                          const w = who(lit.characterIndices[k] ?? k);
                          return (
                            <li key={lit.characterIndices[k] ?? k} className="sf-hair__row">
                              {w?.family ? (
                                <WhoGlyph family={w.family} classLabel={w.label} scale={1} decorative />
                              ) : null}
                              <span className="sf-grow">{w?.label}</span>
                              <span className={`sf-strong ${lv ? '' : 'sf-t--mut'}`}>{W.level(lv)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="sf-muted">{W.noSplit}</p>
                    )}
                    <p className="sf-hint">{W.perCharacter}</p>
                  </section>
                ) : null}
                <ChecksTile s={s} page={page} />
              </aside>
            </div>
          ),
        },
        {
          id: 'who',
          label: W.tabs.who,
          render: () => {
            const idx = pic.elements[0]?.characterIndices ?? [];
            return (
              <section className="sf-sec" aria-labelledby="su-who-h">
                <h3 id="su-who-h" className="sf-h">
                  {W.whoTitle}
                </h3>
                <ul className="sf-rows">
                  {idx.map((ci, k) => {
                    const w = who(ci);
                    const levels = pic.elements
                      .map((t) => ({ name: t.name, lv: t.byCharacter?.[k] ?? 0 }))
                      .filter((x) => x.lv > 0)
                      .sort((a, b) => b.lv - a.lv);
                    return (
                      <li key={ci} className="sf-row">
                        {w?.family ? (
                          <WhoGlyph family={w.family} classLabel={w.label} scale={2} decorative />
                        ) : null}
                        <span className="sf-row__main">
                          <span className="sf-strong">{w?.label}</span>
                          <span className="sf-muted">
                            {W.levelled(levels.length)}
                            {levels[0] ? ` · ${W.highest(levels[0].name, levels[0].lv)}` : ''}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          },
        },
      ]}
    />
  );
}
