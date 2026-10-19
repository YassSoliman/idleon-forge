// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/TalentPresets.dc.html): the Talent presets page on the System template. Tabs: the
// points waiting on each character's presets (M9's Build roadmap, in the Visit Order), the star points
// per preset, and the preset each character is on. Every number is M9's (lower bounds on tabs 1-3).
import type { BuildPresetView, BuildRoadmap } from '@idleon-forge/engine/result';
import { PRESETS_PAGE_WORDS as W } from '@idleon-forge/engine/systems-ui';
import { WhoGlyph } from '../../design/who/WhoGlyph';
import { tabHref } from '../../now/character-tabs';
import { StepsSection } from '../frame/SimplePage';
import { type FrameAnswer, frameAnswer, Pip, SystemFrame } from '../frame/SystemFrame';
import type { FullPageProps } from '../pages';
import './pages.css';

const waitingOf = (p: BuildPresetView) => p.unspent ?? 0;
const empty = (p: BuildPresetView) => p.tabs.every((t) => t.spent === 0);

export default function TalentPresetsPage({ s, page }: FullPageProps) {
  const order = s.view.roster.map((r) => r.index);
  const builds: BuildRoadmap[] = [...(s.result.builds ?? [])].sort(
    (a, b) => order.indexOf(a.index) - order.indexOf(b.index),
  );
  const rows = builds.map((b) => {
    const worst = [...b.presets].sort((x, y) => waitingOf(y) - waitingOf(x))[0] ?? null;
    const pts = worst ? waitingOf(worst) : 0;
    return {
      b,
      worst: pts > 0 ? worst : null,
      text: worst && pts > 0 ? (empty(worst) ? W.atLeast(pts) : W.toSpend(pts)) : W.noneWaiting,
      first: worst
        ? worst.next
            .slice(0, 3)
            .map((n) => n.label)
            .join(', ')
        : '',
    };
  });
  const waiting = rows.filter((r) => r.worst);
  const base = frameAnswer(page);
  const answer: FrameAnswer =
    waiting.length > 0 && base.tone === 'gold'
      ? {
          ...base,
          big: { value: String(waiting.length), unit: W.characters(waiting.length), note: W.havePoints },
        }
      : base;
  const who = (b: BuildRoadmap) => ({
    label: `${b.classLabel} ${b.level}`,
    family: s.result.classFamilies?.[b.index],
  });
  const roleWord = (p: BuildPresetView) => W.role[p.role ?? 'other'] ?? W.role.other;
  const starRows = builds
    .map((b) => ({
      b,
      stars: b.presets.map((p) => ({ p, n: p.star?.known?.points ?? p.star?.unspent ?? 0 })),
    }))
    .filter((r) => r.stars.some((x) => (x.n ?? 0) > 0));
  const Who = ({ b }: { b: BuildRoadmap }) => {
    const w = who(b);
    return (
      <>
        {w.family ? <WhoGlyph family={w.family} classLabel={w.label} scale={2} decorative /> : null}
        <span className="sf-strong tp-who">{w.label}</span>
      </>
    );
  };
  return (
    <SystemFrame
      s={s}
      page={page}
      answer={answer}
      tabs={[
        {
          id: 'waiting',
          label: W.tabs.waiting,
          badge: waiting.length || null,
          render: () => (
            <div className="sf-split">
              <section className="sf-sec" aria-label={W.tabs.waiting}>
                <p className="sf-legend">
                  <span>
                    <Pip tone="mint" />
                    {W.setUp}
                  </span>
                  <span>
                    <Pip tone="gold" />
                    {W.waiting}
                  </span>
                </p>
                {rows.length === 0 ? <p className="sf-muted">{W.noBuilds}</p> : null}
                <ol className="sf-rows">
                  {rows.map((r, i) => (
                    <li key={r.b.index} className={`sf-row${i === 0 && r.worst ? ' sf-row--gold' : ''}`}>
                      <span className={`sf-n${i === 0 && r.worst ? ' sf-n--gold' : ''}`}>{i + 1}</span>
                      <Who b={r.b} />
                      <span className="tp-chips">
                        {r.b.presets.map((p) => {
                          const w = waitingOf(p) > 0;
                          return (
                            <span key={p.slot} className={`tp-chip ${w ? 'tp-chip--gold' : 'tp-chip--mint'}`}>
                              <Pip tone={w ? 'gold' : 'mint'} />
                              {roleWord(p)}
                            </span>
                          );
                        })}
                      </span>
                      <span className="sf-row__main">
                        <span className={`sf-strong ${r.worst ? 'sf-t--gold' : 'sf-t--mint'}`}>{r.text}</span>
                        {r.first ? <span className="sf-hint">{W.startWith(r.first)}</span> : null}
                      </span>
                      <a
                        className="sf-link"
                        href={tabHref('build', r.b.index)}
                        aria-label={W.buildOf(who(r.b).label)}
                        onClick={(e) => {
                          e.preventDefault();
                          s.open(r.b.index, 'build');
                        }}
                      >
                        {W.build} →
                      </a>
                    </li>
                  ))}
                </ol>
                <StepsSection page={page} quiet />
              </section>
              <aside className="sf-col">
                <section className="sf-sec" aria-labelledby="tp-how-h">
                  <span id="tp-how-h" className="a-cap">
                    {W.how}
                  </span>
                  <ul className="tp-how">
                    {W.howLines.map((l) => (
                      <li key={l}>
                        <Pip tone="gold" />
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>
          ),
        },
        {
          id: 'star',
          label: W.tabs.star,
          badge: starRows.length || null,
          render: () => (
            <section className="sf-sec" aria-labelledby="tp-star-h">
              <h3 id="tp-star-h" className="a-h2">
                {W.starTitle}
              </h3>
              {starRows.length === 0 ? <p className="sf-muted">{W.starNone}</p> : null}
              <ul className="sf-rows">
                {starRows.map((r) => (
                  <li key={r.b.index} className="sf-row">
                    <Who b={r.b} />
                    <span className="tp-chips">
                      {r.stars.map((x) => (
                        <span key={x.p.slot} className="sf-small">
                          <span className="sf-muted">{roleWord(x.p)}: </span>
                          <span className={x.n ? 'sf-strong sf-t--gold' : 'sf-muted'}>
                            {W.starPoints(x.n ?? 0)}
                          </span>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ),
        },
        {
          id: 'on',
          label: W.tabs.on,
          render: () => (
            <section className="sf-sec" aria-labelledby="tp-on-h">
              <h3 id="tp-on-h" className="a-h2">
                {W.onTitle}
              </h3>
              <ul className="sf-rows">
                {builds.map((b) => (
                  <li key={b.index} className="sf-row">
                    <Who b={b} />
                    <span className="tp-chips">
                      {b.presets.map((p) => (
                        <span key={p.slot} className={`tp-chip${p.active ? ' tp-chip--on' : ''}`}>
                          {p.heading}
                          {p.active ? ` · ${W.active}` : ''}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ),
        },
      ]}
    />
  );
}
