// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/GearTools.dc.html): the Gear & Tools page on the System template. Tabs: the empty
// slots per character (each with the piece M18's Gear Plan puts there and how to get it), every weapon,
// and everything worn (M18's heat strip). The aside lists the Task Board and Merit Shop recipes M18's
// Goals need. Data: M18's `EngineResult.gear`.
import type { GearSlotView } from '@idleon-forge/engine/gear';
import { GEAR_PAGE_WORDS as W } from '@idleon-forge/engine/systems-ui';
import { Sprite } from '../../art/sprites/Sprite';
import { WhoGlyph } from '../../design/who/WhoGlyph';
import { GearPageBody } from '../../gear/GearPages';
import { formatRoute } from '../../shell/route';
import { ChecksTile, SimplePage, StepsSection } from '../frame/SimplePage';
import { type FrameAnswer, frameAnswer, SystemFrame } from '../frame/SystemFrame';
import type { FullPageProps } from '../pages';
import './pages.css';

const SPRITE: Readonly<Record<string, string>> = {
  helmet: 'gear-helmet',
  weapon: 'gear-weapon',
  shirt: 'gear-shirt',
  pendant: 'gear-pendant',
  pants: 'gear-pants',
  ring1: 'gear-ring',
  ring2: 'gear-ring',
  shoes: 'gear-shoes',
};

export default function GearToolsPage({ s, page }: FullPageProps) {
  const gear = s.result.gear;
  if (!gear) return <SimplePage s={s} page={page} />;
  const order = s.view.roster.map((r) => r.index);
  const chars = [...gear.characters].sort((a, b) => order.indexOf(a.index) - order.indexOf(b.index));
  const who = (i: number) => {
    const c = s.result.characters.find((x) => x.index === i);
    return { label: c ? `${c.classLabel} ${c.level}` : `${i + 1}`, family: s.result.classFamilies?.[i] };
  };
  const emptyRows = chars
    .map((c) => ({ c, slots: c.slots.filter((x) => x.state === 'empty' && x.slot in SPRITE) }))
    .filter((r) => r.slots.length > 0);
  const emptyN = emptyRows.reduce((n, r) => n + r.slots.length, 0);
  const base = frameAnswer(page);
  const answer: FrameAnswer =
    emptyN > 0 && base.tone === 'gold'
      ? {
          ...base,
          big: { value: String(emptyN), unit: W.emptySlots(emptyN), note: W.onCharacters(emptyRows.length) },
        }
      : base;
  const weapons = chars.map((c) => ({ c, w: c.slots.find((x) => x.slot === 'weapon') ?? null }));
  const behindWeapons = weapons.filter((x) => x.w && x.w.state !== 'ok').length;
  const Who = ({ i, scale = 2 }: { i: number; scale?: 1 | 2 }) => {
    const w = who(i);
    return (
      <span className="gt-who">
        {w.family ? <WhoGlyph family={w.family} classLabel={w.label} scale={scale} decorative /> : null}
        <span className="sf-strong">{w.label}</span>
      </span>
    );
  };
  const SlotCard = ({ x }: { x: GearSlotView }) => {
    const held = x.held.length > 0;
    return (
      <li className={`gt-slot${held ? ' gt-slot--held' : ''}`}>
        <span className="gt-slot__top">
          <Sprite name={SPRITE[x.slot] ?? 'gear-helmet'} size={32} decorative />
          <span className="sf-row__main">
            <span className="sf-hint">{W.slot[x.slot] ?? x.slot}</span>
            <span className="sf-strong">{held ? x.held[0] : (x.target?.name ?? W.anyPiece)}</span>
          </span>
        </span>
        <span className={`sf-xs ${held ? 'sf-t--mint' : 'sf-muted'}`}>
          {held ? W.held(x.held[0] ?? '') : (x.target?.how ?? x.note ?? '')}
        </span>
      </li>
    );
  };
  return (
    <SystemFrame
      s={s}
      page={page}
      answer={answer}
      tabs={[
        {
          id: 'empty',
          label: W.tabs.empty,
          badge: emptyN || null,
          render: () => (
            <div className="sf-split">
              <div className="sf-col">
                {emptyRows.length === 0 ? <p className="sf-muted">{W.noEmpty}</p> : null}
                {emptyRows.map((r) => (
                  <section key={r.c.index} className="sf-sec" aria-label={who(r.c.index).label}>
                    <div className="gt-head">
                      <Who i={r.c.index} />
                      <span className="sf-hint">
                        {r.slots.length} {W.emptySlots(r.slots.length)}
                      </span>
                    </div>
                    <ul className="gt-slots">
                      {r.slots.map((x) => (
                        <SlotCard key={x.slot} x={x} />
                      ))}
                    </ul>
                  </section>
                ))}
                <StepsSection page={page} quiet />
              </div>
              <aside className="sf-col">
                {gear.unlockWants.length > 0 ? (
                  <section className="sf-sec" aria-labelledby="gt-then-h">
                    <span id="gt-then-h" className="a-cap">
                      {W.thenWeapons}
                    </span>
                    <p className="sf-muted">{W.unlockLine}</p>
                    <ul className="sf-hair">
                      {gear.unlockWants.map((u) => (
                        <li key={`${u.kind}-${u.world}-${u.what}`} className="gt-want">
                          <span className="sf-small sf-strong">{W.unlock(u.what)}</span>
                          <span className="sf-hint">{W.where(u.kind, u.world)}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      className="sf-link"
                      href={formatRoute({ place: 'system', id: 'task-unlocks' })}
                      onClick={(e) => {
                        e.preventDefault();
                        s.navigate({ place: 'system', id: 'task-unlocks' }, 'push');
                      }}
                    >
                      {W.tasksLink} →
                    </a>
                  </section>
                ) : null}
                <ChecksTile s={s} page={page} />
              </aside>
            </div>
          ),
        },
        {
          id: 'weapons',
          label: W.tabs.weapons,
          badge: behindWeapons || null,
          render: () => (
            <section className="sf-sec" aria-labelledby="gt-w-h">
              <h3 id="gt-w-h" className="a-h2">
                {W.weaponsTitle}
              </h3>
              <ul className="sf-rows">
                {weapons.map(({ c, w }) => (
                  <li key={c.index} className={`sf-row${w && w.state !== 'ok' ? ' sf-row--gold' : ''}`}>
                    <Who i={c.index} />
                    <span className="sf-row__main">
                      <span className="sf-small">
                        {w?.equipped ? W.now(w.equipped.name) : W.noWeapon}
                        {w?.target ? <span className="sf-muted"> · {W.next(w.target.name)}</span> : null}
                      </span>
                      <span className="sf-hint">
                        {w?.target?.how ?? (w?.state === 'ok' ? W.ok : w?.word)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ),
        },
        {
          id: 'worn',
          label: W.tabs.worn,
          render: () => <GearPageBody s={s} page={page} />,
        },
      ]}
    />
  );
}
