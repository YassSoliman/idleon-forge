// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 FR-22, FR-23 in the M21 design (`cards.walkthrough` Pinned current step, `walkthrough-step`
// Progress bar step, `requirement-tree` Flat need list): the card face shows only the current step
// ("step 1 of 4 · 1,010 of 2,000"); the full list is the why sheet's content (DS-4: never a third inline
// level), a stepper with three-state needs, then the missing leaves as "990 more" with the full tree and
// the other ways behind one button each. One NOW step per Walkthrough (DS-2). All text is React text
// (TR-13); indentation is a class per depth, never an inline style (CSP).
import { CARD_WORDS, type GoalView } from '@idleon-forge/engine/now';
import { type CSSProperties, useState } from 'react';
import { GameIcon } from '../../art/game/GameIcon';
import { itemArt } from '../../art/game/game-art';
import { PixelArt } from '../../design/art/PixelArt';
import { cx } from '../../design/atoms/Button';
import { Meter } from '../../design/atoms/Meter';
import { SeeOnMap } from '../../map/SeeOnMap';
import './walkthrough.css';

type View = NonNullable<GoalView['walkthrough']>;

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** The one NOW step: the first step whose inputs are ready, else the first step. */
export function currentStep(view: View) {
  return view.steps.find((s) => s.when === 'now') ?? view.steps[0] ?? null;
}

/** The card face's pinned line: "step 1 of 4 · 1,010 of 2,000". */
export function WalkthroughPin({ view }: { view: View }) {
  const step = currentStep(view);
  if (!step) return null;
  const p = step.progress && step.progress.need > 0 ? step.progress : null;
  return (
    <span className="wt-pin">
      <span className="wt-pin__top">
        <span>{CARD_WORDS.walkthroughStep(step.order, view.steps.length)}</span>
        {p ? <span className="num">{`${fmt(p.held)} of ${fmt(p.need)}`}</span> : null}
      </span>
      <span className="wt-pin__line">{step.text}</span>
      {p ? (
        // A span bar: the pin sits inside the card's button, where a block-level meter can't go.
        <span
          className="wt-bar"
          role="img"
          aria-label={`${fmt(p.held)} of ${fmt(p.need)}`}
          style={{ '--fill': Math.min(1, Math.max(0, p.held / p.need)) } as CSSProperties}
        >
          <span className="wt-bar__fill" />
        </span>
      ) : null}
    </span>
  );
}

/** The why sheet's Walkthrough: every step, the missing leaves, then the full tree and other ways. */
export function WalkthroughSteps({ view }: { view: View }) {
  const [tree, setTree] = useState(false);
  const [other, setOther] = useState(false);
  const now = currentStep(view);
  const missing = view.tree.filter((t) => t.done === false);
  return (
    <section className="walkthrough" aria-label={CARD_WORDS.walkthroughAll}>
      <p className="wt-collapsed">{view.collapsed}</p>
      {view.caveats.length ? <p className="wt-caveat n-muted">{view.caveats.join(' · ')}</p> : null}
      <ol className="wt-steps">
        {view.steps.map((s) => {
          const p = s.progress && s.progress.need > 0 ? s.progress : null;
          const isNow = s === now;
          return (
            <li key={s.order} className={cx('wt-step', `wt-${s.when}`, isNow && 'is-now')}>
              <PixelArt
                name={
                  isNow
                    ? 'cards-stone-now'
                    : s.when === 'blocked'
                      ? 'cards-stone-blocked'
                      : 'cards-stone-after'
                }
                decorative
              />
              <span className="wt-step__body">
                <span className="wt-when">{isNow ? 'Now' : s.when === 'blocked' ? 'Blocked' : 'After'}</span>
                <span className="wt-text">{s.text}</span>
                {p ? (
                  <>
                    <span className="wt-progress num">
                      {`${fmt(p.held)} of ${fmt(p.need)} · ${CARD_WORDS.toGo(Math.max(0, p.need - p.held))}`}
                    </span>
                    <Meter
                      value={p.held}
                      max={p.need}
                      label={`${fmt(p.held)} of ${fmt(p.need)}`}
                      tone={isNow ? 'accent' : 'muted'}
                    />
                  </>
                ) : null}
                {s.why ? <span className="wt-why n-muted">{s.why}</span> : null}
                <SeeOnMap mapIndex={s.mapIndex} label={s.text} />
              </span>
            </li>
          );
        })}
      </ol>
      {missing.length > 0 ? (
        <ul className="wt-needs">
          {missing.map((t, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: tree lines are positional and never reorder.
            <li key={i} className="wt-missing">
              <PixelArt name="cards-req-missing" decorative />
              {t.item ? <GameIcon art={itemArt(t.item)} fallback="item-ore" size={24} decorative /> : null}
              <span>{t.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="wt-more">
        <button type="button" className="n-link-btn" aria-expanded={tree} onClick={() => setTree((v) => !v)}>
          {CARD_WORDS.walkthroughTree}
        </button>
        {view.otherWays.length ? (
          <button
            type="button"
            className="n-link-btn"
            aria-expanded={other}
            onClick={() => setOther((v) => !v)}
          >
            {CARD_WORDS.walkthroughOther(view.otherWays.length)}
          </button>
        ) : null}
      </div>
      {tree ? (
        <ul className="wt-tree">
          {view.tree.map((t, i) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: tree lines are positional and never reorder.
              key={i}
              className={`wt-d${Math.min(t.depth, 6)} ${t.done === true ? 'wt-done' : t.done === false ? 'wt-missing' : 'wt-unknown'}`}
            >
              <PixelArt
                name={
                  t.done === true
                    ? 'cards-req-have'
                    : t.done === false
                      ? 'cards-req-missing'
                      : 'cards-req-elsewhere'
                }
                decorative
              />
              {t.item ? <GameIcon art={itemArt(t.item)} fallback="item-ore" size={24} decorative /> : null}
              <span className="sr-only">
                {t.done === true ? 'Done: ' : t.done === false ? 'Missing: ' : ''}
              </span>
              {t.text}
            </li>
          ))}
        </ul>
      ) : null}
      {other ? (
        <ul className="wt-other">
          {view.otherWays.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
