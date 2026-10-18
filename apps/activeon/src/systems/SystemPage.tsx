// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 FR-23 and M21 FR-S3 (Design Lab `systems.page-frame`, pick "Step first", with "Split desktop" from
// 1000 px): the System page, built from the same `EngineResult` as Now. Phone, top to bottom: the header
// (glyph, name, status), the step (one Next Action with who, DS-3), the Stage meter (only when the System
// is behind for the Stage), the picture (a lazy body from `pages.ts`), the folded order (every Next
// Action in engine order, 3 then "show all", M10's component with the same keys so Skip today, Not for
// me and Report this act on the same item as on Now, FR-33), and the Source. From 1000 px the picture
// sits on the left and the step and order on the right. M17's generic sections follow: quick collects,
// the Timeline bars, the Spend Plan lines, how it opens, what ActiveOn checks there.
import {
  buildSystemPageView,
  LINK_WORDS,
  PAGE_WORDS,
  REASON_WORDS,
  SYSTEM_HOMES,
} from '@idleon-forge/engine/now';
import { buildSystemPageFrameView, FRAME_WORDS } from '@idleon-forge/engine/systems-ui';
import { Suspense, useEffect, useMemo } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { GoalList } from '../design/atoms/GoalList';
import { Meter } from '../design/atoms/Meter';
import { SourceLabel } from '../design/atoms/SourceLabel';
import { TokenLine } from '../design/atoms/TokenLine';
import { Loading } from '../lazy-part';
import { tabById, tabHref } from '../now/character-tabs';
import { useNowActions } from '../now/context';
import { toNowPrefs } from '../now/prefs-store';
import { buildInfo } from '../now/release';
import { suggestUrl } from '../now/report';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';

/** M10's Spend Plan anchor on Now. */
const SPEND_PLAN_ANCHOR = `#${'spend-plan'}`;

import { systemArt } from './glyphs';
import { SYSTEM_PAGES } from './pages';
import { Reason, StatusGlyph } from './SystemsHub';

/** FR-S3: the folded order shows 3 Next Actions, then "show all" (DS-9). */
const ORDER_FOLD = 3;

const OVERVIEWS: Record<string, 'builds' | 'cards' | 'skills'> = {
  build: 'builds',
  cards: 'cards',
  skills: 'skills',
};

export function SystemPage({ s, id }: { s: Session; id: string }) {
  const actions = useNowActions();
  const page = useMemo(
    () =>
      buildSystemPageFrameView(s.result, toNowPrefs(s.prefs.data, null), s.view, {
        now: s.now,
        lastCloudSave: s.lastCloudSave,
        id,
        highlight: s.highlight,
      }),
    [s, id],
  );
  // FR-31: arriving from "See it", the Next Action is outlined and scrolled into view.
  useEffect(() => {
    if (!page?.highlight) return;
    const el = document.querySelector(`[data-na-key="${CSS.escape(page.highlight)}"]`);
    el?.scrollIntoView?.({ block: 'center' });
  }, [page?.highlight]);
  if (!page) return null;
  const { tile } = page;
  // FR-23 item 4 (Phase 2): this System's Timeline bars, as a compact list linking to the Timeline.
  const timelineBars = s.timeline
    ? [...s.timeline.lanes, ...s.timeline.accountLanes].flatMap((lane) =>
        [...lane.bars, ...lane.untimed]
          .filter((bar) => bar.system === id)
          .map((bar) => ({ bar, who: lane.kind === 'account' ? PAGE_WORDS.account : lane.heading })),
      )
    : [];
  const tab = page.tabHome ? tabById(page.tabHome) : undefined;
  const pageId = SYSTEM_HOMES[tile.id]?.page;
  const Body = pageId ? SYSTEM_PAGES[pageId] : undefined;
  // The Characters overview of a tab home (#builds, #cards, M20's #skills); a tab without one has no link.
  const overview = tab ? (OVERVIEWS[tab.id] ?? null) : null;
  const orderKey = `system:${tile.id}`;
  const unfolded = actions.expanded.has(orderKey);
  const shownGoals = unfolded ? page.goals : page.goals.slice(0, ORDER_FOLD);
  const art = systemArt(tile.id);
  const goals = (
    <>
      <GoalList
        goals={shownGoals}
        subject={orderKey}
        hiddenCount={unfolded ? 0 : page.goals.length - shownGoals.length}
        skipped={page.skippedKeys}
        dismissed={page.dismissed}
        seeIt={false}
        who={(_, n) => shownGoals[n]?.who ?? null}
      />
      {page.goals.length === 0 && page.skippedKeys.length === 0 ? (
        <p className="small muted">{PAGE_WORDS.nothingShown}</p>
      ) : null}
    </>
  );
  const suggest = () => {
    if (s.suggestions)
      s.suggestions.open({ kind: 'suggest', type: 'idea', screen: 'account', characterIndex: null });
  };
  return (
    <article className="system-page sy-page" aria-labelledby="system-h">
      <p className="sy-back">
        <a
          className="sy-back__link"
          href={formatRoute({ place: 'systems' })}
          onClick={(e) => {
            e.preventDefault();
            s.navigate({ place: 'systems' }, 'push');
          }}
        >
          <PixelArt name="ui-arrow-left" decorative />
          <span>{LINK_WORDS.back.replace(/^←\s*/, '')}</span>
        </a>
      </p>
      <header className={`sy-frame__head sy-tile--${tile.status}`}>
        <PixelArt name={art.name} ramp={art.ramp} scale={2} decorative />
        <h2 id="system-h" className="place-h sy-frame__title" data-place-heading tabIndex={-1}>
          {tile.name}
        </h2>
        <StatusGlyph status={tile.status} word={tile.statusWord.text} />
        <Reason tile={tile} />
        {tab && overview && (tab.id === 'build' || tab.id === 'cards') ? (
          <a
            className="sy-link"
            href={`#${overview}`}
            onClick={(e) => {
              e.preventDefault();
              actions.navigate?.({ place: 'characters', section: overview });
            }}
          >
            {PAGE_WORDS.seeEvery(tab.label)}
          </a>
        ) : null}
        {page.stageUnknown ? <p className="sy-muted">{PAGE_WORDS.blockersOnly}</p> : null}
      </header>

      <div className={`sy-frame${Body && !page.locked ? ' has-pic' : ''}`}>
        <div className="sy-frame__side">
          {!page.locked && page.step ? (
            <section className="sy-step" aria-labelledby="sy-step-h">
              <h3 id="sy-step-h" className="sy-nowtag">
                <PixelArt name="v2-systems-st-now" decorative />
                <span>{FRAME_WORDS.nextStep}</span>
              </h3>
              <p className="sy-step__act">{page.step.text}</p>
              <TokenLine who={page.step.who} />
            </section>
          ) : null}
          {page.stageMeter ? (
            <div className="sy-meter">
              <span className="sy-meter__l">{FRAME_WORDS.forStage}</span>
              <Meter
                value={page.stageMeter.value}
                max={page.stageMeter.max}
                label={page.stageMeter.label}
                tone="fix"
              />
              <span className="sy-meter__v">{page.stageMeter.text}</span>
            </div>
          ) : null}
          {page.locked ? null : (
            <section className="sy-order" aria-labelledby="sp-na-h">
              <h3 id="sp-na-h" className="sy-h3">
                {page.goals.length > 0 ? FRAME_WORDS.inOrder(page.goals.length) : PAGE_WORDS.nextActions}
              </h3>
              {goals}
            </section>
          )}
        </div>
        {Body && !page.locked ? (
          <div className="sy-frame__pic">
            <Suspense fallback={<Loading text={PAGE_WORDS.loadingPicture} />}>
              <Body s={s} page={page} />
            </Suspense>
          </div>
        ) : null}
      </div>

      {page.pills.length > 0 ? (
        <section className="sy-section" aria-labelledby="sp-pills-h">
          <h3 id="sp-pills-h" className="sy-h3">
            {PAGE_WORDS.quickCollects}
          </h3>
          <ul className="sp-pills">
            {page.pills.map((p) => (
              <li key={p.key}>
                <a
                  className={`cap${p.fullNow ? ' full' : ''}`}
                  href={tabHref('now', p.index)}
                  onClick={(e) => {
                    e.preventDefault();
                    s.open(p.index, 'now');
                  }}
                >
                  {p.label}
                </a>{' '}
                <span className="small muted">{p.who}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {timelineBars.length > 0 ? (
        <section className="sy-section" aria-labelledby="sp-tl-h">
          <h3 id="sp-tl-h" className="sy-h3">
            {PAGE_WORDS.onTimeline}
          </h3>
          <ul className="small sp-timeline">
            {timelineBars.map(({ bar, who }) => (
              <li key={bar.barId}>
                {bar.label} · {bar.timeText}
                {bar.flag ? ` · ${bar.flag}` : ''} <span className="muted">{who}</span>
              </li>
            ))}
          </ul>
          <a
            className="sy-link"
            href={formatRoute({ place: 'timeline', section: null })}
            onClick={(e) => {
              e.preventDefault();
              s.navigate({ place: 'timeline', section: null }, 'push');
            }}
          >
            {PAGE_WORDS.timelineLink}
          </a>
        </section>
      ) : null}

      {page.spendLines.length > 0 ? (
        <section className="sy-section" aria-labelledby="sp-spend-h">
          <h3 id="sp-spend-h" className="sy-h3">
            {PAGE_WORDS.spendPlan}
          </h3>
          <ul className="small">
            {page.spendLines.map((l) => (
              <li key={l.lineId}>{l.text}</li>
            ))}
          </ul>
          <a
            className="sy-link"
            href={SPEND_PLAN_ANCHOR}
            onClick={(e) => {
              e.preventDefault();
              s.toSpend();
            }}
          >
            {PAGE_WORDS.spendPlanLink}
          </a>
        </section>
      ) : null}

      {/* R7 QA: no empty "How it opens" on an open System with no unlock line. */}
      {page.alwaysOpen || page.unlock || page.locked ? (
        <details className="sy-section sp-opens" open={page.locked}>
          <summary>
            <h3 className="sy-h3">{PAGE_WORDS.howItOpens}</h3>
          </summary>
          {page.alwaysOpen ? (
            <p className="small">{REASON_WORDS.openFromStart}</p>
          ) : page.unlock ? (
            <p className="small">
              {page.unlock.text}{' '}
              {page.unlock.source ? <SourceLabel source={page.unlock.source} more={false} /> : null}
            </p>
          ) : null}
          {page.locked ? goals : null}
        </details>
      ) : null}

      <section className="sy-section sp-coverage" aria-labelledby="sp-cov-h">
        <h3 id="sp-cov-h" className="sy-h3">
          {PAGE_WORDS.coverage}
        </h3>
        {page.coverage.covered ? (
          <ul className="small">
            {page.coverage.checks.map((c) => (
              <li key={c.title}>
                {c.title} ·{' '}
                <span className="muted">
                  {c.state === 'see-above' ? PAGE_WORDS.checkedSeeAbove : PAGE_WORDS.checkedNothing}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small">
            {PAGE_WORDS.notCheckedYet(tile.name)}{' '}
            {s.suggestions ? (
              <button type="button" className="link-btn small" onClick={suggest}>
                {PAGE_WORDS.suggest}
              </button>
            ) : (
              <a
                href={suggestUrl('idea', {
                  screen: 'account',
                  character: null,
                  stage: s.result.stage.id,
                  knowledge: s.result.versions.knowledge,
                  gameBuild: s.result.versions.gameBuild,
                  build: buildInfo,
                })}
                target="_blank"
                rel="noopener noreferrer"
              >
                {PAGE_WORDS.suggest}
              </a>
            )}
          </p>
        )}
      </section>

      {page.wiki ? (
        <section className="sy-section" aria-labelledby="sp-src-h">
          <h3 id="sp-src-h" className="sy-h3">
            {PAGE_WORDS.sources}
          </h3>
          <p className="small">
            <a href={page.wiki} target="_blank" rel="noopener noreferrer">
              {PAGE_WORDS.wiki}
            </a>
          </p>
        </section>
      ) : null}
    </article>
  );
}
