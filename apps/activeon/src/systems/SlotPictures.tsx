// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 TR-6 the cauldron seats picture (M21 FR-S5 `time.parallel-slots` "Per-slot strips"), drawn on the
// Alchemy page's Seats tab. Our own pixel art (ADR 0009); one element lit (FR-S6). Construction, Worship
// and Trapping moved onto the M24 template (systems/w23/).
import { liquidAmount } from '@idleon-forge/engine/alchemy-text';
import type { SystemPicture } from '@idleon-forge/engine/result';
import { BODY_WORDS, FRAME_WORDS } from '@idleon-forge/engine/systems-ui';
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
