// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 F7 the Bubba System page body (docs/specs/M23-bubba.md FR-22 to FR-25, TR-5), a lazy chunk inside
// area S's Step-first frame (SystemPage draws the header, the one lit step and the folded order). It only
// lays out `EngineResult.bubba`, built in the worker: every word is the engine's (BUBBA_WORDS, the
// entries) and every time an epoch the page reads against its own clock (DS-6). Two parts, said plainly
// (FR-22): Bubba's bonuses to the account, then everything inside Bubba, which boosts only Bubba.
// Phase F atoms only (Meter, Chip, Badge, EmptyState); our own art (ADR 0009).
import { patsText, BUBBA_WORDS as W } from '@idleon-forge/engine/bubba-text';
import type { BubbaBonusView, BubbaResult } from '@idleon-forge/engine/result';
import { FRAME_WORDS } from '@idleon-forge/engine/systems-ui';
import { Chip, cx, EmptyState, Meter } from '../design/atoms';
import { inSpan } from '../design/format';
import { usePictureSheet } from '../systems/PictureSheet';
import type { SystemPageBodyProps } from '../systems/pages';
import './bubba.css';

/** FR-23: a time as the page reads it: "in 12h 52m", "now", or "out of reach". */
const when = (at: number | null, now: number) =>
  at === null ? W.outOfReach : at <= now ? 'now' : inSpan(at - now);

function Bonuses({ b, now, open }: { b: BubbaResult; now: number; open(x: BubbaBonusView): void }) {
  const next = b.boonNext;
  return (
    <section className="sy-pic bb-account" aria-labelledby="bb-account-h">
      <h3 id="bb-account-h" className="sy-h3">
        {W.accountTitle}
      </h3>
      <p className="sy-pic__lede">{W.accountLede(b.megaflesh.multiplier)}</p>
      <ul className="bb-bonuses">
        {b.bonuses.map((x) => (
          <li key={x.key} className={cx('bb-bonus', x.next && 'is-next')}>
            <button type="button" className="bb-bonus__row" onClick={() => open(x)}>
              <span className="bb-bonus__text num">{x.text}</span>
              <Chip>{W.rating[x.rating]}</Chip>
            </button>
            {x.next && next ? (
              <p className="bb-bonus__next small num">
                {[
                  W.nextBoon(next.level, next.add, next.cost),
                  next.affordable ? W.affordable : when(next.at, now),
                ].join(' · ')}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Megaflesh({ b, now }: { b: BubbaResult; now: number }) {
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
          <li key={r.row} className={cx('bb-pip', r.owned && 'is-owned')} title={r.name}>
            <span className="sr-only">{r.owned ? r.name : `${r.name} (${W.notOwned})`}</span>
          </li>
        ))}
      </ol>
      {n ? (
        <div className="bb-next">
          <p className="bb-next__label">{W.megafleshNext(n.row, n.label)}</p>
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

function Run({ b }: { b: BubbaResult }) {
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
function patsLine(p: NonNullable<BubbaResult['pats']>, now: number): string {
  const count = p.left === null || p.perHour === null ? null : patsText(p);
  if (p.refillAt === null) return count ? `${count} · ${W.patsFull}` : W.patsFull;
  const refills = `refills ${when(p.refillAt, now)}`;
  if (!count) return refills;
  // "21 left · 11 a refill" (Megaflesh's head start) already reads as a count, so no "now" after it.
  return p.left !== null && p.perHour !== null && p.left > p.perHour
    ? `${count}, ${refills}`
    : `${count} now, ${refills}`;
}

function Pats({ b, now }: { b: BubbaResult; now: number }) {
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

function Smoker({ b, now }: { b: BubbaResult; now: number }) {
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

function Charisma({ b, now }: { b: BubbaResult; now: number }) {
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

function Gifts({ b }: { b: BubbaResult }) {
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

export default function BubbaPage(p: SystemPageBodyProps) {
  const b = p.s.result.bubba;
  const now = p.s.now;
  const { open, sheet } = usePictureSheet(p.page.wiki ?? null);
  if (!b) return null;
  if (b.state === 'unknown') return <p className="bb-cant">{W.cantRead}</p>;
  const openBonus = (x: BubbaBonusView) =>
    open({
      title: x.name,
      rows: [
        { label: FRAME_WORDS.value, value: x.text },
        { label: W.stacks(x.stacks), value: W.rating[x.rating] },
        { label: W.where, value: W.whereText[x.key] ?? null },
      ],
    });
  return (
    <div className="bb-page">
      {b.state === 'not-started' ? (
        <EmptyState line={W.notMaking} />
      ) : b.step ? null : (
        <p className="bb-idle">
          {[W.nothingToDo, b.nextEvent ? `${b.nextEvent.label} ${when(b.nextEvent.at, now)}` : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      {b.loginNote ? (
        <p className="bb-note" role="note">
          {[b.openOn ? W.openOn(b.openOn) : null, W.loginNote].filter(Boolean).join('. ')}
        </p>
      ) : null}
      <Bonuses b={b} now={now} open={openBonus} />
      <section className="sy-pic bb-inside" aria-labelledby="bb-inside-h">
        <h3 id="bb-inside-h" className="sy-h3">
          {W.insideTitle}
        </h3>
        <p className="sy-pic__lede">{W.insideLede}</p>
        <Megaflesh b={b} now={now} />
        <Run b={b} />
        <div className="bb-grid">
          <Pats b={b} now={now} />
          <Smoker b={b} now={now} />
          <Charisma b={b} now={now} />
          <Gifts b={b} />
        </div>
      </section>
      {sheet}
    </div>
  );
}
