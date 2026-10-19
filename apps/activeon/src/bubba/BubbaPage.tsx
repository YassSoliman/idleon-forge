// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 F7 the Bubba page's panels (docs/specs/M23-bubba.md FR-22 to FR-25, TR-5): Megaflesh, the run,
// pats, the Smoker, the Charisma Chart, gifts and dice. M24's BubbaTabs.tsx lays them out as the
// board's tabs on the System page template. They only lay out `EngineResult.bubba`, built in the worker:
// every word is the engine's (BUBBA_WORDS) and every time an epoch read against the page's clock (DS-6).
// M25: Megaflesh and upgrades wear the game's sprites (ADR 0009 as amended 2026-10-19).
import { patsText, BUBBA_WORDS as W } from '@idleon-forge/engine/bubba-text';
import type { BubbaResult } from '@idleon-forge/engine/result';
import { bubbaUpgradeArt, megafleshArt } from '../art/game/bubba-art';
import { GameIcon } from '../art/game/GameIcon';
import { cx, Meter } from '../design/atoms';
import { inSpan } from '../design/format';
import './bubba.css';

/** FR-23: a time as the page reads it: "in 12h 52m", "now", or "out of reach". */
export const when = (at: number | null, now: number) =>
  at === null ? W.outOfReach : at <= now ? 'now' : inSpan(at - now);

export function Megaflesh({ b, now }: { b: BubbaResult; now: number }) {
  const m = b.megaflesh;
  const n = m.next;
  return (
    <section className="bb-panel bb-megaflesh" aria-labelledby="bb-mf-h">
      <h4 id="bb-mf-h" className="sy-h4">
        {W.megafleshTitle}
      </h4>
      <p className="small">
        {[W.megafleshOwned(m.owned), m.chromatic ? W.chromatic(m.chromatic) : null]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <ol className="bb-pips" aria-label={W.megafleshOwned(m.owned)}>
        {m.rows.map((r) => (
          <li key={r.row} className={cx('bb-mf', r.owned && 'is-owned')} title={r.name}>
            <GameIcon
              art={megafleshArt(r.row)}
              fallback={<span className={cx('bb-pip', r.owned && 'is-owned')} />}
              size={32}
              decorative
            />
            <span className="sr-only">{r.owned ? r.name : `${r.name} (${W.notOwned})`}</span>
          </li>
        ))}
      </ol>
      {n ? (
        <div className="bb-next">
          <p className="bb-next__label bb-ic-line">
            <GameIcon art={megafleshArt(n.row)} fallback="sys-bubba" size={24} decorative />
            {W.megafleshNext(n.row, n.label)}
          </p>
          <p className="small muted">{n.text}</p>
          {n.have !== null && n.need !== null ? (
            <Meter value={n.have} max={n.need} label={n.progress ?? n.label} tone="accent" />
          ) : null}
          {n.progress ? (
            <p className="small num">
              {[n.progress, n.affordable ? W.affordable : when(n.at, now)].join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** An upgrade's game sprite, inline before its name. */
function BuyIcon({ index }: { index: number }) {
  return (
    <span className="bb-buy__ic">
      <GameIcon art={bubbaUpgradeArt(index)} fallback="sys-bubba" size={24} decorative />
    </span>
  );
}

export function Run({ b }: { b: BubbaResult }) {
  const buys = b.run.nextBuys;
  return (
    <section className="bb-panel" aria-labelledby="bb-run-h">
      <h4 id="bb-run-h" className="sy-h4">
        {W.runTitle}
      </h4>
      <p className="small num">
        {[b.ratePerMin ? W.rate(b.ratePerMin) : null, b.projected ? W.projected(b.projected) : null]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {b.run.nextType ? <p className="small muted">{b.run.nextType}</p> : null}
      <p className="bb-sub">{W.nextBuys}</p>
      {buys.length === 0 ? <p className="small muted">{W.noBuys}</p> : null}
      <ol className="bb-buys">
        {buys.slice(0, 3).map((x) => (
          <li key={x.index}>
            <BuyIcon index={x.index} />
            <span>{x.name}</span> <span className="num muted">{x.cost}</span>
          </li>
        ))}
      </ol>
      {buys.length > 3 ? (
        <details className="bb-more">
          <summary className="small">{W.showAll(buys.length)}</summary>
          <ol className="bb-buys" start={4}>
            {buys.slice(3).map((x) => (
              <li key={x.index}>
                <BuyIcon index={x.index} />
                <span>{x.name}</span> <span className="num muted">{x.cost}</span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  );
}

/**
 * The pats in the Timeline's words (R12 QA): "10 of 10 now, refills in 51m"; "full when you open
 * Bubba" when no refill is due.
 */
export function patsLine(p: NonNullable<BubbaResult['pats']>, now: number): string {
  const count = p.left === null || p.perHour === null ? null : patsText(p);
  if (p.refillAt === null) return count ? `${count} · ${W.patsFull}` : W.patsFull;
  const refills = `refills ${when(p.refillAt, now)}`;
  if (!count) return refills;
  // "21 left · 11 a refill" (Megaflesh's head start) already reads as a count, so no "now" after it.
  return p.left !== null && p.perHour !== null && p.left > p.perHour
    ? `${count}, ${refills}`
    : `${count} now, ${refills}`;
}

export function Pats({ b, now }: { b: BubbaResult; now: number }) {
  const p = b.pats;
  return (
    <section className="bb-panel" aria-labelledby="bb-pats-h">
      <h4 id="bb-pats-h" className="sy-h4">
        {W.patsTitle}
      </h4>
      {p ? (
        <>
          <p className="num">{patsLine(p, now)}</p>
          <ul className="small muted bb-tips">
            <li>{W.patTip}</li>
            <li>{W.doublePatTip}</li>
          </ul>
        </>
      ) : (
        <p className="small muted">{b.locked.pats}</p>
      )}
    </section>
  );
}

export function Smoker({ b, now }: { b: BubbaResult; now: number }) {
  const s = b.smoker;
  return (
    <section className="bb-panel" aria-labelledby="bb-smoker-h">
      <h4 id="bb-smoker-h" className="sy-h4">
        {W.smokerTitle}
      </h4>
      {s ? (
        <>
          <Meter
            value={Math.min(s.seconds, s.max)}
            max={s.max}
            label={W.smokerTitle}
            tone={s.atMax ? 'ok' : 'accent'}
          />
          <p className="small num">
            {[
              s.atMax
                ? s.heldForSlabcakes
                  ? W.smokerHeld
                  : W.smokerAtMax
                : W.smokerMaxIn(when(s.maxAt, now)),
              s.needs,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="small muted">{W.smokerTip}</p>
        </>
      ) : (
        <p className="small muted">{b.locked.smoker}</p>
      )}
    </section>
  );
}

export function Charisma({ b, now }: { b: BubbaResult; now: number }) {
  const c = b.charisma;
  return (
    <section className="bb-panel bb-charisma" aria-labelledby="bb-ch-h">
      <h4 id="bb-ch-h" className="sy-h4">
        {W.charismaTitle}
      </h4>
      <p className="small bb-only">{W.charismaLede}</p>
      {c ? (
        <>
          {c.mindfulFirst ? <p className="small">{W.mindfulFirst}</p> : null}
          {c.allMax ? <p className="small">{W.allMax}</p> : null}
          <ul className="bb-attrs">
            {c.attrs.map((a) => (
              <li key={a.id} className={cx('bb-attr', a.training && 'is-training')}>
                <span className="bb-attr__name">
                  {a.name}{' '}
                  {a.training ? (
                    <span className={cx('bb-tag', a.atMax && 'bb-tag--max')}>
                      {a.atMax ? W.max : W.training}
                    </span>
                  ) : null}
                  {a.emulsified ? <span className="bb-tag">{W.emulsified}</span> : null}
                </span>
                <Meter
                  value={a.level}
                  max={a.max ?? 120}
                  label={`${a.name} ${W.levelOf(a.level, a.max)}`}
                  tone={a.atMax ? 'ok' : 'accent'}
                />
                <span className="bb-attr__lv small num">{W.levelOf(a.level, a.max)}</span>
                {a.next && a.training ? <span className="small muted bb-attr__next">{a.next}</span> : null}
              </li>
            ))}
          </ul>
          {(() => {
            const firstOpen = c.attrs.find((a) => a.next && !a.training);
            return firstOpen?.next ? <p className="small muted">{firstOpen.next}</p> : null;
          })()}
          <p className="small num">
            {[
              c.nextLevelAt !== null ? W.nextLevel(when(c.nextLevelAt, now)) : null,
              c.banked ? W.banked(c.banked) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {c.emulsifyOpen ? (
            <ul className="small bb-tips">
              <li>{W.emulsify}</li>
              <li className="muted">{W.emulsifyGuide}</li>
            </ul>
          ) : null}
          {c.targets.length ? (
            <details className="bb-more bb-targets">
              <summary className="small muted">{W.targetsTitle}</summary>
              <ul className="small muted">
                {c.targets.map((t) => (
                  <li key={t.source}>
                    <span>{t.label}: </span>
                    {t.gaps
                      .map((g, i) => (g ? W.gap(c.attrs[i]?.name ?? '', g.gap) : null))
                      .filter(Boolean)
                      .join(', ')}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      ) : (
        <p className="small muted">{b.locked.charisma}</p>
      )}
    </section>
  );
}

export function Gifts({ b }: { b: BubbaResult }) {
  return (
    <>
      <section className="bb-panel" aria-labelledby="bb-gifts-h">
        <h4 id="bb-gifts-h" className="sy-h4">
          {W.giftsTitle}
        </h4>
        <p className="small">{b.locked.gifts ?? (b.gifts.length ? b.gifts.join(', ') : W.noGifts)}</p>
      </section>
      <section className="bb-panel" aria-labelledby="bb-dice-h">
        <h4 id="bb-dice-h" className="sy-h4">
          {W.diceTitle}
        </h4>
        <p className="small num">{b.locked.dice ?? W.dice(b.dice)}</p>
      </section>
    </>
  );
}
