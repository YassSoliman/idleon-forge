// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24: the System page template, one component every System page renders through (boards
// after/Alchemy.dc.html and after/sys/*.dc.html). Top to bottom:
//   1. the back link ("← Systems · World 1");
//   2. the header: the System's icon, its name, its status word in its colour and a reason;
//   3. the answer: the screen's one `.a-frame`, what to do first (cap, hero, sub) and an optional big
//      number with its unit, a meter and a note;
//   4. real tabs for the page's sections (role=tablist; arrow keys move between tabs), or plain
//      children when a page has one section;
//   5. the footer line: what ActiveOn checks here, the IdleOn Wiki page, the Toolbox version.
// A page passes only what differs from the defaults: `frameAnswer(page)` and the footer come from the
// engine's `page.frame` (packages/engine/src/pictures/page-view.ts frameOf). See SystemPage.tsx for how
// a System picks its page (pages.ts) and SimplePage.tsx for the thin default.
import type { FrameTone, SystemFrameView } from '@idleon-forge/engine/systems-ui';
import { PAGE_FRAME_WORDS } from '@idleon-forge/engine/systems-ui';
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { PixelArt } from '../../design/art/PixelArt';
import { Frame, Pip as SharedPip } from '../../design/atoms/Surfaces';
import { PageSources } from '../../shell/page-sources';
import { formatRoute } from '../../shell/route';
import type { Session } from '../../shell/session';
import { SystemIcon } from './SystemIcon';
import { GateWalkthroughs, gateWalkthroughsOf } from './WalkthroughTab';
import './frame.css';

export type { FrameTone };

/** The framed answer. `big` is the number that sums it up ("221 points", "7 of 18 tries"). */
export interface FrameAnswer {
  tone: FrameTone;
  cap: string;
  hero: string;
  sub?: string | null;
  big?: {
    value: string;
    unit?: string | null;
    note?: string | null;
    /** 0..1, drawn as a meter under the number. */
    meter?: number | null;
    /** The number's colour; the answer's tone by default. */
    tone?: FrameTone;
  } | null;
}

export interface FrameTab {
  id: string;
  label: string;
  /** A count beside the label ("15", "13 of 121"). */
  badge?: string | number | null;
  render: () => ReactNode;
}

/** The page frame the engine builds (`buildSystemPageFrameView`), the fields the template reads. */
export interface FramePage {
  tile: { id: string; name: string };
  frame: SystemFrameView;
  wiki: string | null;
}

export interface SystemFrameProps {
  s: Session;
  page: FramePage;
  /** Replaces the engine's default answer (`page.frame.answer`); null when the body draws its own frame. */
  answer?: FrameAnswer | null;
  /** Replaces the header's status line. */
  status?: { tone: FrameTone; word: string; reason?: string | null };
  /** The page's sections as tabs; without tabs, `children` is the page body. */
  tabs?: FrameTab[];
  /** The tab open first (a tab id); the first tab by default. */
  initialTab?: string;
  children?: ReactNode;
  /** Replaces "Checks: …" in the footer line. */
  checksLine?: string;
}

/** The engine's default answer for a page. */
export const frameAnswer = (page: FramePage): FrameAnswer => ({ ...page.frame.answer });

const toneClass = (t: FrameTone) => `sf-t--${t}`;

export function SystemFrame({
  s,
  page,
  answer = frameAnswer(page),
  status = page.frame.status,
  tabs,
  initialTab,
  children,
  checksLine = page.frame.checksLine,
}: SystemFrameProps) {
  const { tile } = page;
  const toolbox = s.result.versions.parserTarget;
  // M26 FR-C1b: a System that owns a gate gets a Walkthrough tab with the Walkthroughs that hold one.
  const gated = gateWalkthroughsOf(s.result, tile.id);
  const allTabs =
    tabs && gated.length > 0 && !tabs.some((t) => t.id === 'walkthrough')
      ? [
          ...tabs,
          {
            id: 'walkthrough',
            label: PAGE_FRAME_WORDS.walkthroughTab,
            badge: gated.length,
            render: () => <GateWalkthroughs s={s} items={gated} />,
          },
        ]
      : tabs;
  // M26 FR-C2: the route names the open tab (an unknown one opens the first) and a row to outline.
  const route = s.route.place === 'system' && s.route.id === tile.id ? s.route : null;
  const routeTab = route?.tab && allTabs?.some((t) => t.id === route.tab) ? route.tab : undefined;
  const onTab = (id: string) =>
    s.navigate({ place: 'system', id: tile.id, tab: id }, 'replace', { origin: s.origin });
  useFocusRow(route?.focus ?? null, routeTab ?? initialTab ?? null);
  return (
    <article className="system-page sy-page sf" aria-labelledby="system-h">
      <p className="sf-back">
        <a
          href={formatRoute({ place: 'systems' })}
          onClick={(e) => {
            e.preventDefault();
            s.navigate({ place: 'systems' }, 'push');
          }}
        >
          <PixelArt name="ui-arrow-left" decorative />
          <span>{page.frame.back}</span>
        </a>
      </p>
      <header className="sf-head">
        <span className="sf-icon">
          <SystemIcon id={tile.id} size={48} />
        </span>
        <div className="sf-head__text">
          <h2 id="system-h" className="a-h1 sf-title" data-place-heading tabIndex={-1}>
            {tile.name}
          </h2>
          <p className="sf-status">
            <span className={`sf-status__word ${toneClass(status.tone)}`}>
              <Pip tone={status.tone} />
              {status.word}
            </span>
            {status.reason ? (
              <>
                <span className="sf-dot" aria-hidden="true">
                  ·
                </span>
                <span className="sf-status__reason">{status.reason}</span>
              </>
            ) : null}
          </p>
        </div>
      </header>

      {answer ? <Answer answer={answer} /> : null}

      {allTabs && allTabs.length > 1 ? (
        <Tabs
          name={tile.name}
          tabs={allTabs}
          initial={routeTab ?? initialTab}
          current={routeTab}
          onChange={onTab}
        />
      ) : allTabs?.[0] ? (
        <div className="sf-body">{allTabs[0].render()}</div>
      ) : (
        <div className="sf-body">{children}</div>
      )}

      {/* Rule 8: the page's checks and Sources are the one-line footer's left half (shell/page-sources).
          A read-only World 4 body writes its own Source line there (world4/parts.tsx SourceLine). */}
      {page.frame.readOnly ? null : (
        <PageSources>
          <span className="sf-foot">
            <span className="sf-foot__checks" title={checksLine}>
              {checksLine}
            </span>
            {page.wiki ? (
              <>
                <span aria-hidden="true"> · </span>
                <a href={page.wiki} target="_blank" rel="noopener noreferrer">
                  {PAGE_FRAME_WORDS.wiki(wikiName(page.wiki, tile.name))}
                </a>
              </>
            ) : null}
            {toolbox ? (
              <>
                <span aria-hidden="true"> · </span>
                <span>{PAGE_FRAME_WORDS.toolbox(toolbox)}</span>
              </>
            ) : null}
          </span>
        </PageSources>
      )}
    </article>
  );
}

/**
 * "https://idleon.wiki/wiki/Talent_Book_Library" -> "Talent Book Library"; a sub-page keeps its parent
 * ("…/wiki/Changelog/2025" -> "Changelog 2025", not "2025").
 */
export function wikiName(href: string, fallback: string): string {
  try {
    const path = new URL(href).pathname.replace(/^\/wiki\//, '').replace(/^\//, '');
    const name = decodeURIComponent(path).replace(/[_/]/g, ' ').replace(/#.*$/, '').trim();
    return name || fallback;
  } catch {
    return fallback;
  }
}

export function Answer({ answer }: { answer: FrameAnswer }) {
  const big = answer.big;
  const bigTone = big?.tone ?? answer.tone;
  return (
    <Frame
      tone={answer.tone === 'gold' ? 'gold' : answer.tone === 'mint' ? 'ok' : 'coral'}
      pad
      className={`sf-answer${answer.tone === 'sky' || answer.tone === 'mut' ? ` ${toneClass(answer.tone)}` : ''}`}
      aria-label={answer.cap}
    >
      <div className="sf-answer__text">
        <span className={`a-cap sf-cap ${toneClass(answer.tone)}`}>{answer.cap}</span>
        <p className="sf-hero">{answer.hero}</p>
        {answer.sub ? <p className="sf-sub">{answer.sub}</p> : null}
      </div>
      {big ? (
        <div className="sf-big">
          <span className={`sf-big__n ${toneClass(bigTone)}`}>
            {big.value}
            {big.unit ? <span className="sf-big__unit"> {big.unit}</span> : null}
          </span>
          {big.meter !== null && big.meter !== undefined ? (
            <span className={`sf-meter ${toneClass(bigTone)}`} aria-hidden="true">
              <i style={{ width: `${Math.max(0, Math.min(1, big.meter)) * 100}%` }} />
            </span>
          ) : null}
          {big.note ? <span className="sf-big__note">{big.note}</span> : null}
        </div>
      ) : null}
    </Frame>
  );
}

/** Real tabs (WAI-ARIA tabs pattern): one tab stop, arrow keys, Home and End move between tabs. */
export function Tabs({
  name,
  tabs,
  initial,
  current: wanted,
  onChange,
}: {
  name: string;
  tabs: FrameTab[];
  initial?: string;
  /** M26 FR-C2: the tab the route names; it wins over the local choice when it changes. */
  current?: string;
  onChange?: (id: string) => void;
}) {
  const [own, setOwn] = useState(() => tabs.find((t) => t.id === initial)?.id ?? tabs[0]?.id ?? '');
  const [seen, setSeen] = useState(wanted);
  if (wanted !== seen) {
    setSeen(wanted);
    if (wanted) setOwn(wanted);
  }
  const on = own;
  const setOn = (id: string) => {
    setOwn(id);
    onChange?.(id);
  };
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = tabs.find((t) => t.id === on) ?? tabs[0];
  const move = (e: KeyboardEvent, i: number) => {
    const n = tabs.length;
    const to =
      e.key === 'ArrowRight'
        ? (i + 1) % n
        : e.key === 'ArrowLeft'
          ? (i - 1 + n) % n
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : null;
    if (to === null) return;
    e.preventDefault();
    const t = tabs[to];
    if (!t) return;
    setOn(t.id);
    refs.current[to]?.focus();
  };
  return (
    <>
      <div className="sf-tabs" role="tablist" aria-label={PAGE_FRAME_WORDS.sections(name)}>
        {tabs.map((t, i) => {
          const sel = t.id === current?.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-t-${t.id}`}
              aria-selected={sel}
              aria-controls={`${base}-p-${t.id}`}
              tabIndex={sel ? 0 : -1}
              className={`sf-tab${sel ? ' sf-tab--on' : ''}`}
              onClick={() => setOn(t.id)}
              onKeyDown={(e) => move(e, i)}
            >
              <span>{t.label}</span>
              {t.badge !== null && t.badge !== undefined && t.badge !== '' ? (
                <span className="sf-badge">{t.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {current ? (
        <div
          className="sf-body"
          role="tabpanel"
          id={`${base}-p-${current.id}`}
          aria-labelledby={`${base}-t-${current.id}`}
        >
          {current.render()}
        </div>
      ) : null}
    </>
  );
}

/** The shared pip (design/atoms Surfaces), keyed by the frame's tones: grey ('mut') is "later". */
export function Pip({ tone }: { tone: FrameTone }) {
  return <SharedPip {...(tone === 'mut' ? {} : { tone: tone === 'mint' ? 'mint' : tone })} />;
}

/**
 * M26 FR-C2: the route's focused row (`[data-focus-key]`) is scrolled into view, outlined for 2 s and
 * given keyboard focus, once per focus key and tab.
 */
function useFocusRow(focus: string | null, tab: string | null) {
  // The tab is part of the key: the same focus on another tab is found again.
  const key = focus ? `${tab ?? ''}:${focus}` : null;
  useEffect(() => {
    if (!key) return;
    const focus = key.slice(key.indexOf(':') + 1);
    let tries = 0;
    let timer = 0;
    let clear = 0;
    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focus)}"]`);
      if (!el) {
        if (tries++ < 20) timer = window.setTimeout(find, 100);
        return;
      }
      el.scrollIntoView?.({ block: 'center' });
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
      el.classList.add('is-focus');
      clear = window.setTimeout(() => el.classList.remove('is-focus'), 2000);
    };
    find();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clear);
    };
  }, [key]);
}
