// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 FR-23: the generic System page, built from the same `EngineResult` as Now. Top to bottom: the
// header (name, status, reason), every Next Action of the System from every character and the account
// in engine order (M10's Next Action component, the same keys, so Skip today, Not for me and Report this
// act on the same item as on Now, FR-33), its quick collects, its Spend Plan lines, how it opens, what
// ActiveOn checks there, and the Sources. A later module's picture is drawn after the Next Actions
// (FR-23a, `pages.ts`).
import {
  buildSystemPageView,
  LINK_WORDS,
  PAGE_WORDS,
  REASON_WORDS,
  SYSTEM_HOMES,
} from '@idleon-forge/engine/now';
import { Suspense, useEffect, useMemo } from 'react';
import { tabById, tabHref } from '../now/character-tabs';
import { useNowActions } from '../now/context';
import { GoalList, SourceLabel } from '../now/parts';
import { toNowPrefs } from '../now/prefs-store';
import { buildInfo } from '../now/release';
import { suggestUrl } from '../now/report';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';

/** M10's Spend Plan anchor on Now. */
const SPEND_PLAN_ANCHOR = `#${'spend-plan'}`;

import { SYSTEM_PAGES } from './pages';
import { Reason, StatusGlyph } from './SystemsHub';

const OVERVIEWS: Record<string, 'builds' | 'cards' | 'skills'> = {
  build: 'builds',
  cards: 'cards',
  skills: 'skills',
};

export function SystemPage({ s, id }: { s: Session; id: string }) {
  const actions = useNowActions();
  const page = useMemo(
    () =>
      buildSystemPageView(s.result, toNowPrefs(s.prefs.data, null), s.view, {
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
  const goals = (
    <>
      <GoalList
        goals={page.goals}
        subject={`system:${tile.id}`}
        hiddenCount={0}
        skipped={page.skippedKeys}
        dismissed={page.dismissed}
        seeIt={false}
        who={(_, n) => page.goals[n]?.who ?? null}
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
    <article className="system-page" aria-labelledby="system-h">
      <p>
        <a
          className="small back-link"
          href={formatRoute({ place: 'systems' })}
          onClick={(e) => {
            e.preventDefault();
            s.navigate({ place: 'systems' }, 'push');
          }}
        >
          {LINK_WORDS.back}
        </a>
      </p>
      <header className={`sp-head st-${tile.status}`}>
        <h2 id="system-h" className="place-h" data-place-heading tabIndex={-1}>
          {tile.name}
        </h2>
        <p className="st-status">
          <StatusGlyph status={tile.status} />
          <span>{tile.statusWord.text}</span>
        </p>
        <Reason tile={tile} />
        {tab && overview && (tab.id === 'build' || tab.id === 'cards') ? (
          <p>
            <a
              className="small build-link"
              href={`#${overview}`}
              onClick={(e) => {
                e.preventDefault();
                actions.navigate?.({ place: 'characters', section: overview });
              }}
            >
              {PAGE_WORDS.seeEvery(tab.label)}
            </a>
          </p>
        ) : null}
        {page.stageUnknown ? <p className="small muted">{PAGE_WORDS.blockersOnly}</p> : null}
      </header>

      {page.locked ? null : (
        <section aria-labelledby="sp-na-h">
          <h3 id="sp-na-h" className="sub-h">
            {PAGE_WORDS.nextActions}
          </h3>
          {goals}
        </section>
      )}
      {Body && !page.locked ? (
        <Suspense fallback={<p className="small muted">{PAGE_WORDS.loadingPicture}</p>}>
          <Body s={s} page={page} />
        </Suspense>
      ) : null}

      {page.pills.length > 0 ? (
        <section aria-labelledby="sp-pills-h">
          <h3 id="sp-pills-h" className="sub-h">
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
        <section aria-labelledby="sp-tl-h">
          <h3 id="sp-tl-h" className="sub-h">
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
            className="small build-link"
            href={formatRoute({ place: 'timeline' })}
            onClick={(e) => {
              e.preventDefault();
              s.navigate({ place: 'timeline' }, 'push');
            }}
          >
            {PAGE_WORDS.timelineLink}
          </a>
        </section>
      ) : null}

      {page.spendLines.length > 0 ? (
        <section aria-labelledby="sp-spend-h">
          <h3 id="sp-spend-h" className="sub-h">
            {PAGE_WORDS.spendPlan}
          </h3>
          <ul className="small">
            {page.spendLines.map((l) => (
              <li key={l.lineId}>{l.text}</li>
            ))}
          </ul>
          <a
            className="small build-link"
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
        <details className="sp-opens" open={page.locked}>
          <summary>
            <h3 className="sub-h">{PAGE_WORDS.howItOpens}</h3>
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

      <section aria-labelledby="sp-cov-h" className="sp-coverage">
        <h3 id="sp-cov-h" className="sub-h">
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
        <section aria-labelledby="sp-src-h">
          <h3 id="sp-src-h" className="sub-h">
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
