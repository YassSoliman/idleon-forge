// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Character page's shell (M24, boards `CharNow`, `Build`, `BuildPhone`; rule 5 "one way to move").
// Top to bottom: the character strip (every character in Visit Order, a blob, class and level and a
// state pip; it replaces the old prev / dots / arrows / "switch to" bar and "All characters"), the
// header (a big blob, "Hunter 70", where and what it does, its state word, the Role line on Now, and the
// class path on the right), the cap pills, then the tabs with their count badges (FR-C7's health, a
// number with its unit read out). Class and level everywhere, never a character's name (M24 rule 4).
import type { FocusCard, NowView, TabHealth } from '@idleon-forge/engine/now';
import { forwardRef, type ReactNode } from 'react';
import { Pip, Tag } from '../design/atoms';
import { characterTabs, NOW_TAB, tabHref } from '../now/character-tabs';
import { useNowActions } from '../now/context';
import { Avatar } from './Avatar';
import { PAGE_WORDS } from './words';
import './shell.css';

export interface CharacterShellProps {
  card: Pick<FocusCard, 'index' | 'classLabel' | 'level' | 'activity' | 'map'> &
    Partial<Pick<FocusCard, 'pill' | 'strip' | 'playing'>>;
  /** The tab on show; "now" is Focus's own content. */
  tab: string;
  /** Without it the tab bar is not drawn (Focus outside a Character page). */
  onTab?: ((id: string) => void) | null;
  /** The whole Now view: the strip's labels, the class path, the Role line and the tab badges. */
  view?: NowView | null;
  /** Under the header (Focus puts the character's cap pills here). */
  children?: ReactNode;
}

type Kind = 'ready' | 'fix' | 'unknown';
/** Colour means one thing (M24 rule 7): mint fine, coral losing value now, grey not known. */
const PIP: Record<Kind, 'mint' | 'coral' | undefined> = { ready: 'mint', fix: 'coral', unknown: undefined };

const LEVEL_WORD = {
  fix: 'fix',
  behind: 'behind',
  empty: 'empty',
  unknown: 'not known',
  ok: 'fine',
} as const;

/** The tab badge: the count with the tab's health in words for a screen reader. */
function TabBadge({ id, h }: { id: string; h: TabHealth }) {
  // Gold for points waiting to be spent (do it), coral for a fix (losing value now), plain otherwise.
  const tone = h.level === 'fix' ? 'coral' : id === 'build' ? 'gold' : undefined;
  return (
    <Tag tone={tone}>
      <span aria-hidden="true">
        {h.count !== undefined ? h.count.toLocaleString('en-US') : h.level === 'fix' ? '!' : '•'}
      </span>
      <span className="sr-only">
        {LEVEL_WORD[h.level]}: {h.word}
      </span>
    </Tag>
  );
}

/** The class path on the header's right: done ✓ › here › next. */
function ClassPath({ view, index }: { view: NowView | null; index: number }) {
  const r = view?.builds.find((b) => b.index === index);
  const steps = (r?.path ?? []).filter((p) => p.state !== 'later');
  if (!r || steps.length === 0) return null;
  return (
    <ol className="cp-path" aria-label={PAGE_WORDS.classPath}>
      {steps.map((p, i) => (
        <li key={`${p.class}-${p.state}`} data-state={p.state}>
          {i > 0 ? (
            <span className="cp-path-sep" aria-hidden="true">
              ›
            </span>
          ) : null}
          <span className="cp-path-step">
            {p.label}
            {p.state === 'done' ? ' ✓' : ''}
          </span>
          {p.state === 'next' && r.nextClass ? <span className="sr-only"> ({r.nextClass})</span> : null}
        </li>
      ))}
    </ol>
  );
}

/** The strip and the header (the `<h2>` takes the forwarded ref) and, when `onTab` is given, the tabs. */
export const CharacterShell = forwardRef<HTMLHeadingElement, CharacterShellProps>(function CharacterShell(
  { card, tab, onTab = null, view = null, children },
  headingRef,
) {
  const actions = useNowActions();
  const families = view?.families ?? actions.result?.classFamilies ?? null;
  const familyOf = (i: number) => families?.[i] ?? 'beginner';
  const whoOf = (i: number) => {
    const r = view?.roster.find((x) => x.index === i);
    if (r) return `${r.classLabel} ${r.level}`;
    const c = actions.result?.characters.find((x) => x.index === i);
    return c ? `${c.classLabel} ${c.level}` : '';
  };
  const classOf = (i: number) =>
    view?.roster.find((x) => x.index === i)?.classLabel ??
    actions.result?.characters.find((x) => x.index === i)?.classLabel ??
    '';
  const strip = card.strip ?? [];
  const kind: Kind = card.pill?.kind ?? 'unknown';
  const role =
    tab === NOW_TAB ? (view?.skills.find((s) => s.index === card.index)?.train?.text ?? null) : null;
  const go = (i: number) => (tab === NOW_TAB ? actions.open(i) : actions.openTab(i, tab));
  return (
    <>
      {strip.length > 1 ? (
        <nav className="cp-strip" aria-label={PAGE_WORDS.strip}>
          {strip.map((s) => {
            const who = whoOf(s.index);
            return (
              <a
                key={s.index}
                className="cp-chip"
                href={tabHref(tab, s.index)}
                aria-current={s.current ? 'page' : undefined}
                aria-label={`${who}: ${PAGE_WORDS.state[s.kind]}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (!s.current) go(s.index);
                }}
              >
                <Avatar family={familyOf(s.index)} classLabel={classOf(s.index)} size={32} />
                <span className="cp-chip-who">{who}</span>
                <Pip tone={PIP[s.kind]} />
              </a>
            );
          })}
        </nav>
      ) : null}

      <section className="cp-head">
        <div className="cp-id">
          <span className="cp-blob">
            <Avatar family={familyOf(card.index)} classLabel={card.classLabel} size={64} />
          </span>
          <div className="cp-id-text">
            <h2 id="focus-h" ref={headingRef} tabIndex={-1} className="a-h1 cp-name">
              {card.classLabel} {card.level}
            </h2>
            <p className="cp-sub">
              {[card.map, card.activity].filter(Boolean).join(' · ')}
              {card.map || card.activity ? ' · ' : ''}
              <span className={`cp-state cp-state--${PIP[kind] ?? 'mut'}`}>{PAGE_WORDS.state[kind]}</span>
              {card.playing ? <span className="cp-playing"> · {card.playing}</span> : null}
            </p>
            {role ? (
              <p className="cp-sub">
                {role} ·{' '}
                <a
                  href={tabHref('skills', card.index)}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onTab) onTab('skills');
                    else actions.openTab(card.index, 'skills');
                  }}
                >
                  {PAGE_WORDS.skillsLink}
                </a>
              </p>
            ) : null}
          </div>
        </div>
        <ClassPath view={view} index={card.index} />
      </section>
      {children ? <div className="cs-caps">{children}</div> : null}

      {onTab ? (
        <nav aria-label={PAGE_WORDS.tabs} className="char-tabs">
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
                {flag ? <TabBadge id={t.id} h={flag} /> : null}
              </a>
            );
          })}
        </nav>
      ) : null}
    </>
  );
});
