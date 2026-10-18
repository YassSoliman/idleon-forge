// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 TR-6 the System page bodies for Construction (the Cog Board, the free seat lit), Worship (a charge
// tank per character), Trapping (each character's set and traps against the return) and Alchemy (who
// sits on which cauldron and liquid). Pictures are data drawn with our own boxes (ADR 0009, never game
// sprites); an element whose `actionKey` equals the page's highlight is outlined (M17 FR-31). Names are
// joined here, on the UI thread, from the view (M4 TR-9).
import { clockAt, inSpan } from '@idleon-forge/engine/now';
import type { SystemPicture } from '@idleon-forge/engine/result';
import type { SystemPageBodyProps } from './pages';
import './slot-pictures.css';

const nameOf = (p: SystemPageBodyProps, index: number) => {
  const c = p.s.view.roster.find((r) => r.index === index);
  return c ? `${c.name} (${c.classLabel} ${c.level})` : `Character ${index + 1}`;
};
const lit = (p: SystemPageBodyProps, key: string | null) =>
  key !== null && (p.page.highlight === key || p.page.goals.some((g) => g.action.key === key)) ? ' lit' : '';
const pictureOf = <K extends SystemPicture['kind']>(p: SystemPageBodyProps, kind: K) =>
  p.s.result.slotPictures?.find((x): x is Extract<SystemPicture, { kind: K }> => x.kind === kind) ?? null;

export function CogBoardBody(p: SystemPageBodyProps) {
  const pic = pictureOf(p, 'cog-board');
  if (!pic) return null;
  const open = pic.squares.filter((s) => s.state !== 'locked').length;
  const free = pic.squares.filter((s) => s.state === 'open').length;
  return (
    <section className="pic" aria-labelledby="pic-h">
      <h3 id="pic-h" className="sub-h">
        Cog Board
      </h3>
      <p className="small">
        {open} squares open · {free} free · build rate {Math.round(pic.buildRate).toLocaleString('en-US')} an
        hour · Construction EXP {Math.round(pic.expRate).toLocaleString('en-US')} an hour
      </p>
      <div className="cog-board" role="img" aria-label={`Cog Board: ${open} squares open, ${free} free`}>
        {pic.squares.map((s) => (
          <span key={s.id} className={`sq ${s.state}${lit(p, s.actionKey)}`} />
        ))}
      </div>
      <ul className="small pic-legend" aria-hidden="true">
        <li>
          <span className="sq character" /> character
        </li>
        <li>
          <span className="sq cog" /> cog
        </li>
        <li>
          <span className="sq open" /> free square
        </li>
        <li>
          <span className="sq locked" /> locked
        </li>
      </ul>
      <dl className="pic-list">
        <div>
          <dt>On the board</dt>
          <dd>
            {pic.squares
              .filter((s) => s.characterIndex !== undefined)
              .map((s) => nameOf(p, s.characterIndex as number))
              .join(', ') || 'nobody'}
          </dd>
        </div>
        <div>
          <dt>On the Cog Shelf (makes cogs)</dt>
          <dd>
            {pic.shelf.map((x) => (
              <span key={x.id} className={`chip${lit(p, x.actionKey)}`}>
                {nameOf(p, x.index)}
              </span>
            ))}
            {pic.shelf.length === 0 ? 'nobody' : null}
          </dd>
        </div>
        <div>
          <dt>In the cog inventory (earns nothing)</dt>
          <dd>
            {pic.inventory.map((x) => (
              <span key={x.id} className={`chip${lit(p, x.actionKey)}`}>
                {nameOf(p, x.index)}
              </span>
            ))}
            {pic.inventory.length === 0 ? 'nobody' : null}
          </dd>
        </div>
      </dl>
      {pic.bestConstructor?.nextTier ? (
        <p className="small">
          {`Best constructor: ${nameOf(p, pic.bestConstructor.index)}, Construction ${pic.bestConstructor.level}. Next: ${pic.bestConstructor.nextTier.name} at ${pic.bestConstructor.nextTier.atLevel}`}
        </p>
      ) : null}
      {pic.note ? <p className="small">{pic.note}</p> : null}
    </section>
  );
}

export function WorshipBody(p: SystemPageBodyProps) {
  const pic = pictureOf(p, 'worship');
  if (!pic) return null;
  const now = p.s.now;
  return (
    <section className="pic" aria-labelledby="pic-h">
      <h3 id="pic-h" className="sub-h">
        Charge
      </h3>
      <ul className="tanks">
        {pic.tanks.map((t) => {
          const pct = t.max > 0 ? Math.min(100, Math.round((t.charge / t.max) * 100)) : 0;
          const full = t.charge >= t.max;
          return (
            <li key={t.id} className={`tank${full ? ' full' : ''}${lit(p, t.actionKey)}`}>
              <span className="tank-bar" aria-hidden="true">
                <span className={`tank-fill p${Math.round(pct / 10) * 10}`} />
              </span>
              <span className="tank-text">
                <b>{nameOf(p, t.index)}</b>
                <span className="small">
                  {Math.round(t.charge)} of {Math.round(t.max)} charge
                  {full ? ' · full' : t.fullAt !== null ? ` · full ${inSpan(t.fullAt - now)}` : ''}
                  {t.skull ? '' : ' · no skull'}
                </span>
                {t.spendAt ? <span className="small muted">spend at {t.spendAt}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
      <h3 className="sub-h">Totems</h3>
      <ul className="small">
        {pic.totems.map((t) => (
          <li key={t.id}>
            {t.name}, {t.map}: Worship {t.levelReq}; best wave {t.maxWave}
            {t.usableBy.length ? ` · ${t.usableBy.length} can worship here` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TrappingBody(p: SystemPageBodyProps) {
  const pic = pictureOf(p, 'traps');
  if (!pic) return null;
  const tz = -new Date(p.s.now).getTimezoneOffset();
  return (
    <section className="pic" aria-labelledby="pic-h">
      <h3 id="pic-h" className="sub-h">
        Traps
      </h3>
      <p className="small muted">You're back around {clockAt(pic.returnAt, tz)}.</p>
      <ul className="trap-rows">
        {pic.rows.map((r) => (
          <li key={r.id} className={`trap-row${lit(p, r.actionKey)}`}>
            <b>{nameOf(p, r.index)}</b>
            <span className="small">
              {r.set ? `${r.set}${r.allowed ? `, ${r.allowed} traps` : ''}` : 'no trap set'}
              {r.traps.length
                ? ` · ${r.traps.filter((t) => t.endsAt <= pic.returnAt).length} of ${r.traps.length} finish before you're back`
                : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STATION_WORDS: Record<string, string> = {
  power: 'Power cauldron',
  quicc: 'Quicc cauldron',
  'high-iq': 'High-IQ cauldron',
  kazam: 'Kazam cauldron',
  water: 'Water Droplets',
  nitrogen: 'Liquid Nitrogen',
  trench: 'Trench Seawater',
  mercury: 'Toxic Mercury',
};

export function CauldronSeatsBody(p: SystemPageBodyProps) {
  const pic = pictureOf(p, 'cauldron-seats');
  if (!pic) return null;
  return (
    <section className="pic" aria-labelledby="pic-h">
      <h3 id="pic-h" className="sub-h">
        Cauldron seats
      </h3>
      <ul className="stations">
        {pic.stations.map((st) => (
          <li key={st.id} className={`station${st.locked ? ' locked' : ''}${lit(p, st.actionKey)}`}>
            <b>{STATION_WORDS[st.station]}</b>
            <span className="small">
              {st.locked
                ? 'locked'
                : st.brewers.length
                  ? st.brewers.map((i) => nameOf(p, i)).join(', ')
                  : 'nobody'}
              {st.liquid && !st.locked
                ? ` · ${Math.round(st.liquid.current * 100) / 100} of ${st.liquid.max}`
                : ''}
            </span>
          </li>
        ))}
      </ul>
      {pic.unassigned.length ? (
        <p className="small">Not brewing: {pic.unassigned.map((i) => nameOf(p, i)).join(', ')}</p>
      ) : null}
    </section>
  );
}
