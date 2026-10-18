// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 TR-6 the System page bodies for Construction, Worship, Trapping and Alchemy's seats, restyled for
// M21 FR-S5 (Design Lab v2 `systems.construction` "Cog Board heat map", `systems.worship-prayers`
// "Charge tanks" with "Wave rulers" under them, G7 the Trapping strip, `time.parallel-slots` "Per-slot
// strips" for the cauldron seats). Pictures are data drawn with our own pixel art (ADR 0009); exactly one
// element is lit (FR-S6: the page's highlight when it names one, else the System's first Next Action),
// scoped as `.sy-… .is-now` (DS-21). Names are joined here, on the UI thread, from the view (M4 TR-9).
import { liquidAmount } from '@idleon-forge/engine/alchemy-text';
import { inSpan } from '@idleon-forge/engine/now';
import type { SystemPicture } from '@idleon-forge/engine/result';
import { BODY_WORDS, FRAME_WORDS } from '@idleon-forge/engine/systems-ui';
import type { CSSProperties } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { WhoGlyph } from '../design/who/WhoGlyph';
import type { SystemPageBodyProps } from './pages';
import './slot-pictures.css';
import { cx } from '../design/atoms';

const labelOf = (p: SystemPageBodyProps, index: number) => {
  const c = p.s.view.roster.find((r) => r.index === index);
  return c ? `${c.classLabel} ${c.level}` : `Character ${index + 1}`;
};

/** A character as its chibi and "Class level" (DS-13: the one who-glyph family). */
function Who({ p, index }: { p: SystemPageBodyProps; index: number }) {
  const family = p.s.result.classFamilies?.[index];
  const label = labelOf(p, index);
  return (
    <span className="sy-who">
      {family ? <WhoGlyph family={family} classLabel={label} scale={1} decorative /> : null}
      <span>{label}</span>
    </span>
  );
}

/** FR-S6: the one lit element's key: the page's highlight, else the System's first Next Action. */
function litKeyOf(p: SystemPageBodyProps, keys: readonly (string | null)[]): string | null {
  if (p.page.highlight && keys.includes(p.page.highlight)) return p.page.highlight;
  for (const g of p.page.goals) if (keys.includes(g.action.key)) return g.action.key;
  return null;
}
/** Marks only the first element carrying the lit key, so a picture never has two. */
function oneLit(lit: string | null) {
  let done = false;
  return (key: string | null) => {
    if (done || key === null || key !== lit) return false;
    done = true;
    return true;
  };
}

const pictureOf = <K extends SystemPicture['kind']>(p: SystemPageBodyProps, kind: K) =>
  p.s.result.slotPictures?.find((x): x is Extract<SystemPicture, { kind: K }> => x.kind === kind) ?? null;

function NowTag() {
  return (
    <span className="sy-nowtag">
      <PixelArt name="v2-systems-st-now" decorative />
      <span>{FRAME_WORDS.nextStep}</span>
    </span>
  );
}

export function CogBoardBody(p: SystemPageBodyProps) {
  const pic = pictureOf(p, 'cog-board');
  if (!pic) return null;
  const open = pic.squares.filter((s) => s.state !== 'locked').length;
  const free = pic.squares.filter((s) => s.state === 'open').length;
  const isLit = oneLit(
    litKeyOf(
      p,
      [...pic.squares, ...pic.shelf, ...pic.inventory].map((x) => x.actionKey),
    ),
  );
  const seated = pic.squares.filter((s) => s.characterIndex !== undefined);
  return (
    <section className="sy-pic sy-cog" aria-labelledby="sy-cog-h">
      <h3 id="sy-cog-h" className="sy-h3">
        {BODY_WORDS.cogBoard}
      </h3>
      <p className="sy-pic__lede num">
        {open} squares open · {free} free · build rate {Math.round(pic.buildRate).toLocaleString('en-US')} an
        hour · Construction EXP {Math.round(pic.expRate).toLocaleString('en-US')} an hour
      </p>
      <div
        className="sy-cog__board"
        role="img"
        aria-label={`Cog Board: ${open} squares open, ${free} free, ${seated.length} characters seated`}
      >
        {pic.squares.map((s) => {
          const lit = isLit(s.actionKey);
          const family =
            s.characterIndex !== undefined ? p.s.result.classFamilies?.[s.characterIndex] : undefined;
          return (
            <span key={s.id} className={cx('sy-sq', `sy-sq--${s.state}`, lit && 'is-now')}>
              {family && s.characterIndex !== undefined ? (
                <WhoGlyph family={family} classLabel={labelOf(p, s.characterIndex)} scale={1} decorative />
              ) : lit ? (
                <PixelArt name="v2-systems-st-now" decorative />
              ) : null}
            </span>
          );
        })}
      </div>
      <ul className="sy-legend" aria-hidden="true">
        <li>
          <span className="sy-sq sy-sq--character" /> character
        </li>
        <li>
          <span className="sy-sq sy-sq--cog" /> cog
        </li>
        <li>
          <span className="sy-sq sy-sq--open" /> free square
        </li>
        <li>
          <span className="sy-sq sy-sq--locked" /> locked
        </li>
      </ul>
      <dl className="sy-pic__list">
        <div>
          <dt>On the board</dt>
          <dd>
            {seated.map((s) => (
              <Who key={s.id} p={p} index={s.characterIndex as number} />
            ))}
            {seated.length === 0 ? 'nobody' : null}
          </dd>
        </div>
        <div>
          <dt>On the Cog Shelf (makes cogs)</dt>
          <dd>
            {pic.shelf.map((x) => (
              <span key={x.id} className={cx('sy-tag', isLit(x.actionKey) && 'is-now')}>
                <Who p={p} index={x.index} />
              </span>
            ))}
            {pic.shelf.length === 0 ? 'nobody' : null}
          </dd>
        </div>
        <div>
          <dt>In the cog inventory (earns nothing)</dt>
          <dd>
            {pic.inventory.map((x) => (
              <span key={x.id} className={cx('sy-tag', isLit(x.actionKey) && 'is-now')}>
                <Who p={p} index={x.index} />
              </span>
            ))}
            {pic.inventory.length === 0 ? 'nobody' : null}
          </dd>
        </div>
      </dl>
      {pic.bestConstructor?.nextTier ? (
        <p className="sy-pic__lede">
          {`Best constructor: ${labelOf(p, pic.bestConstructor.index)}, Construction ${pic.bestConstructor.level}. Next: ${pic.bestConstructor.nextTier.name} at ${pic.bestConstructor.nextTier.atLevel}`}
        </p>
      ) : null}
      {pic.note ? <p className="sy-pic__lede">{pic.note}</p> : null}
    </section>
  );
}

export function WorshipBody(p: SystemPageBodyProps) {
  const pic = pictureOf(p, 'worship');
  if (!pic) return null;
  const now = p.s.now;
  const isLit = oneLit(
    litKeyOf(
      p,
      [...pic.tanks, ...pic.totems].map((x) => x.actionKey),
    ),
  );
  const maxWave = Math.max(1, ...pic.totems.map((t) => t.maxWave));
  return (
    <section className="sy-pic sy-worship" aria-labelledby="sy-worship-h">
      <h3 id="sy-worship-h" className="sy-h3">
        {BODY_WORDS.charge}
      </h3>
      <ul className="sy-tanks">
        {pic.tanks.map((t) => {
          const pct = t.max > 0 ? Math.min(100, (t.charge / t.max) * 100) : 0;
          const full = t.charge >= t.max;
          const lit = isLit(t.actionKey);
          return (
            <li key={t.id} className={cx('sy-tank', full && 'is-full', lit && 'is-now')}>
              {lit ? <NowTag /> : null}
              <span className="sy-tank__glass" style={{ '--pct': pct } as CSSProperties} aria-hidden="true">
                <PixelArt name="v2-systems-totem" ramp="wood" decorative />
              </span>
              <span className="sy-tank__v num">
                {Math.round(t.charge)}/{Math.round(t.max)}
              </span>
              <span className="sy-tank__t">
                {full ? 'full now' : t.fullAt !== null ? `full ${inSpan(t.fullAt - now)}` : ''}
                {t.skull ? '' : ' · no skull'}
              </span>
              <Who p={p} index={t.index} />
              {t.spendAt ? <span className="sy-tank__t">spend at {t.spendAt}</span> : null}
            </li>
          );
        })}
      </ul>
      <h4 className="sy-h4">{BODY_WORDS.totems}</h4>
      <ul className="sy-rulers">
        {pic.totems.map((t) => (
          <li key={t.id} className={cx('sy-ruler', isLit(t.actionKey) && 'is-now')}>
            <span className="sy-ruler__name">
              <b>{t.name}</b> · {t.map} · Worship {t.levelReq}
            </span>
            <span
              className="sy-ruler__bar"
              style={{ '--pct': (t.maxWave / maxWave) * 100 } as CSSProperties}
              aria-hidden="true"
            />
            <span className="sy-ruler__v num">
              {BODY_WORDS.bestWave(t.maxWave)}
              {t.usableBy.length ? ` · ${t.usableBy.length} can worship here` : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * G7 the Trapping strip: one row per character with a trap-set glyph and one cell per trap, each filled
 * by its time to done against the Back marker (the Timeline's length rule, DS-6). "Collect now" is lit
 * on the first trap that is done before the return.
 */
export function TrappingBody(p: SystemPageBodyProps) {
  const pic = pictureOf(p, 'traps');
  if (!pic) return null;
  const now = p.s.now;
  const span = Math.max(1, pic.returnAt - now);
  const firstDone = pic.rows
    .flatMap((r) => r.traps.map((t, k) => ({ r, t, k })))
    .find((x) => x.t.endsAt <= pic.returnAt);
  const litRow = litKeyOf(
    p,
    pic.rows.map((r) => r.actionKey),
  );
  return (
    <section className="sy-pic sy-traps" aria-labelledby="sy-traps-h">
      <h3 id="sy-traps-h" className="sy-h3">
        {BODY_WORDS.traps}
      </h3>
      <ul className="sy-traps__rows">
        {pic.rows.map((r) => {
          const done = r.traps.filter((t) => t.endsAt <= pic.returnAt).length;
          return (
            <li
              key={r.id}
              className={cx('sy-traprow', r.actionKey !== null && r.actionKey === litRow && 'is-row-lit')}
            >
              <span className="sy-traprow__head">
                <PixelArt name="v2-systems-trap" ramp="wood" decorative />
                <Who p={p} index={r.index} />
                <span className="sy-traprow__set">
                  {r.set ? `${r.set}${r.allowed ? `, ${r.allowed} traps` : ''}` : BODY_WORDS.noTrap}
                </span>
              </span>
              {r.traps.length ? (
                <>
                  <ol className="sy-traprow__cells" aria-label={BODY_WORDS.trapsLine(done, r.traps.length)}>
                    {r.traps.map((t, k) => {
                      const left = Math.max(0, t.endsAt - now);
                      const fill = Math.min(100, (left / span) * 100);
                      const isNow = firstDone?.r === r && firstDone.k === k;
                      return (
                        <li
                          // biome-ignore lint/suspicious/noArrayIndexKey: a character's traps are positional
                          key={k}
                          className={cx(
                            'sy-trap',
                            t.endsAt <= pic.returnAt ? 'is-done' : 'is-later',
                            isNow && 'is-now',
                          )}
                          style={{ '--pct': fill } as CSSProperties}
                          title={`${t.critter}: ${t.endsAt <= pic.returnAt ? BODY_WORDS.trapDone : BODY_WORDS.trapLater}`}
                        >
                          {isNow ? <span className="sy-trap__now">{BODY_WORDS.collectNow}</span> : null}
                        </li>
                      );
                    })}
                  </ol>
                  <span className="sy-traprow__line num">{BODY_WORDS.trapsLine(done, r.traps.length)}</span>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="sy-hint">
        <span className="sy-traps__back" aria-hidden="true" /> {BODY_WORDS.back}: {inSpan(pic.returnAt - now)}
      </p>
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
const CAULDRONS: Record<string, 'power' | 'quicc' | 'high-iq' | 'kazam'> = {
  power: 'power',
  quicc: 'quicc',
  'high-iq': 'high-iq',
  kazam: 'kazam',
};

/** The cauldron seats as a per-slot strip (`time.parallel-slots` "Per-slot strips"). */
export function CauldronSeatsBody(p: SystemPageBodyProps) {
  const pic = pictureOf(p, 'cauldron-seats');
  if (!pic) return null;
  const isLit = oneLit(
    litKeyOf(
      p,
      pic.stations.map((s) => s.actionKey),
    ),
  );
  return (
    <section className="sy-pic sy-seats" aria-labelledby="sy-seats-h">
      <h3 id="sy-seats-h" className="sy-h3">
        {BODY_WORDS.seats}
      </h3>
      <ul className="sy-seats__strip">
        {pic.stations.map((st) => {
          const lit = isLit(st.actionKey);
          const cauldron = CAULDRONS[st.station];
          return (
            <li key={st.id} className={cx('sy-seat', st.locked && 'is-locked', lit && 'is-now')}>
              {lit ? <NowTag /> : null}
              <PixelArt
                name={cauldron ? 'v2-systems-cauldron' : 'v2-systems-flask'}
                {...(cauldron ? { cauldron } : { ramp: 'silver' as const })}
                decorative
              />
              <b>{STATION_WORDS[st.station]}</b>
              <span className="sy-seat__who">
                {st.locked
                  ? 'locked'
                  : st.brewers.length
                    ? st.brewers.map((i) => <Who key={i} p={p} index={i} />)
                    : 'nobody'}
              </span>
              {st.liquid && !st.locked ? (
                <span className="sy-seat__v num">{`${liquidAmount(st.liquid.current)} of ${st.liquid.max}`}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {pic.unassigned.length ? (
        <p className="sy-pic__lede">
          Not brewing:{' '}
          {pic.unassigned.map((i) => (
            <Who key={i} p={p} index={i} />
          ))}
        </p>
      ) : null}
    </section>
  );
}
