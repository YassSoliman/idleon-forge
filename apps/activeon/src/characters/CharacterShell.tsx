// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Character page's sticky identity strip and tab bar (M21 FR-C5, Design Lab `character.shell`
// "Sticky identity strip", with the runner-up's 44 px prev / next arrows merged). A 56 px strip: the
// who-glyph chibi, the name with "Squire 85", pin + map, and the Verdict stamp (glyph + word). Under it,
// the tab bar (Now, Build, Gear, Cards, Signs, Skills), one health badge per tab (FR-C7). On scroll it
// shrinks to the chibi, the name and the stamp. It is in the first load because Focus renders it
// (bundle-guards.ts allows this one file of characters/), so it stays small.
import type { FocusCard, NowView } from '@idleon-forge/engine/now';
import { CHARACTERS_WORDS } from '@idleon-forge/engine/now';
import { forwardRef, type ReactNode, useEffect, useRef, useState } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { GLYPH, VerdictStamp } from '../design/atoms';
import { WhoGlyph } from '../design/who/WhoGlyph';
import { characterTabs, NOW_TAB, tabHref } from '../now/character-tabs';
import { useNowActions } from '../now/context';

export interface CharacterShellProps {
  card: Pick<FocusCard, 'index' | 'name' | 'classLabel' | 'level' | 'activity' | 'map'> &
    Partial<Pick<FocusCard, 'pill' | 'strip'>>;
  /** The tab on show; "now" is Focus's own content. */
  tab: string;
  /** Without it the tab bar is not drawn (Focus outside a Character page). */
  onTab?: ((id: string) => void) | null;
  /** The whole Now view, for the tab badges (FR-C7); without it the tabs carry no badge. */
  view?: NowView | null;
  /** Under the identity line (Focus puts the character's cap pills here). */
  children?: ReactNode;
}

const W = CHARACTERS_WORDS.shell;
const LEVEL_WORD = CHARACTERS_WORDS.matrix.level;

function Arrow({ dir, to, tab }: { dir: 'prev' | 'next'; to: number | null; tab: string }) {
  const actions = useNowActions();
  if (to === null) return <span className="cs-arrow cs-arrow--off" aria-hidden="true" />;
  return (
    <a
      className="cs-arrow"
      href={tabHref(tab, to)}
      aria-label={dir === 'prev' ? W.prev : W.next}
      onClick={(e) => {
        e.preventDefault();
        if (tab === NOW_TAB) actions.open(to);
        else actions.openTab(to, tab);
      }}
    >
      <PixelArt name={dir === 'prev' ? GLYPH.arrowLeft : GLYPH.arrowRight} decorative />
    </a>
  );
}

/** The identity strip (the `<h2>` takes the forwarded ref) and, when `onTab` is given, the tab bar. */
export const CharacterShell = forwardRef<HTMLHeadingElement, CharacterShellProps>(function CharacterShell(
  { card, tab, onTab = null, view = null, children },
  headingRef,
) {
  const actions = useNowActions();
  const family = actions.result?.classFamilies?.[card.index] ?? 'beginner';
  // Prev / next keep the tab, in Visit Order (the strip Focus shows), wrapping at the ends.
  const order = (card.strip ?? []).map((s) => s.index);
  const at = order.indexOf(card.index);
  const prev = order.length > 1 && at >= 0 ? (order[(at - 1 + order.length) % order.length] ?? null) : null;
  const next = order.length > 1 && at >= 0 ? (order[(at + 1) % order.length] ?? null) : null;
  // Shrink on scroll: a sentinel above the sticky strip leaves the viewport.
  const sentinel = useRef<HTMLDivElement>(null);
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setShrunk(!(e?.isIntersecting ?? true)));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const pill = card.pill;
  return (
    <>
      <div ref={sentinel} className="cs-sentinel" aria-hidden="true" />
      <div className="hero cs-strip" data-shrunk={shrunk ? 'yes' : 'no'}>
        <Arrow dir="prev" to={prev} tab={tab} />
        <WhoGlyph family={family} classLabel={card.classLabel} level={card.level} scale={2} decorative />
        <div className="cs-ident">
          <h2 id="focus-h" ref={headingRef} tabIndex={-1} className="cs-name">
            {card.name}
          </h2>
          <p className="cs-sub">
            <span className="num">
              {card.classLabel} {card.level}
            </span>
            {card.map ? (
              <span className="cs-where">
                <PixelArt name={GLYPH.where} decorative />
                {card.map}
              </span>
            ) : null}
            {card.activity ? <span className="cs-activity">{card.activity}</span> : null}
          </p>
        </div>
        {pill ? <VerdictStamp verdict={pill.kind} word={pill.text} /> : null}
        <Arrow dir="next" to={next} tab={tab} />
      </div>
      {children ? <div className="cs-caps">{children}</div> : null}

      {onTab ? (
        <nav aria-label={W.tabs} className="char-tabs">
          {characterTabs.map((t) => {
            const h = view ? (t.health?.(view, card.index) ?? null) : null;
            const flag = h && h.level !== 'ok' ? h : null;
            return (
              <a
                key={t.id}
                href={tabHref(t.id, card.index)}
                className={`char-tab${t.id === tab ? ' on' : ''}`}
                aria-current={t.id === tab ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onTab(t.id);
                }}
              >
                <span>{t.label}</span>
                {flag ? (
                  <span className="cs-badge" data-level={flag.level}>
                    <span aria-hidden="true">{flag.level === 'fix' ? '!' : '•'}</span>
                    <span className="sr-only">
                      {LEVEL_WORD[flag.level]}: {flag.word}
                    </span>
                  </span>
                ) : null}
              </a>
            );
          })}
        </nav>
      ) : null}
    </>
  );
});
