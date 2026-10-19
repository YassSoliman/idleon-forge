// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/_Simple.dc.html): the thin System page every System without its own page renders
// through, and the shared sections a dedicated page can reuse: the steps (M10's Goal list, so Skip today,
// Not for me and Report this act on the same item as on Now, FR-33), the quick collects, the Timeline
// bars, the Spend Plan lines and the "What ActiveOn checks" tile.

import type { SystemPageView } from '@idleon-forge/engine/now';
import { shortDuration } from '@idleon-forge/engine/now';
import {
  type FrameTone,
  PAGE_FRAME_WORDS,
  SIMPLE_WORDS,
  SYSTEM_BLURBS,
  type SystemFrameView,
} from '@idleon-forge/engine/systems-ui';
import type { ReactNode } from 'react';
import { GoalList } from '../../design/atoms/GoalList';
import { tabById, tabHref } from '../../now/character-tabs';
import { useNowActions } from '../../now/context';
import { buildInfo } from '../../now/release';
import { suggestUrl } from '../../now/report';
import { formatRoute } from '../../shell/route';
import type { Session } from '../../shell/session';
import { type FrameAnswer, Pip, SystemFrame } from './SystemFrame';

/** The engine's System page view plus the M24 frame (buildSystemPageFrameView). */
export type FullPage = SystemPageView & { frame: SystemFrameView };

/** The Characters overview a tab home opens (#builds, #cards). */
const OVERVIEWS: Record<string, 'builds' | 'cards'> = { build: 'builds', cards: 'cards' };

/** The System's Timeline bars: account lanes and character lanes (by class and level, never a name). */
export function timelineBarsOf(s: Session, id: string) {
  if (!s.timeline) return [];
  return [...s.timeline.lanes, ...s.timeline.accountLanes].flatMap((lane) =>
    [...lane.bars, ...lane.untimed]
      .filter((bar) => bar.system === id)
      .map((bar) => ({ bar, who: lane.kind === 'account' ? null : lane.short })),
  );
}

/** A timer answer when the System has nothing to fix but a bar that caps later (board: Arcade). */
export function timerAnswer(s: Session, page: FullPage): FrameAnswer | null {
  if (page.goals.length > 0 || page.tile.status !== 'ok') return null;
  const next = timelineBarsOf(s, page.tile.id)
    .map((x) => x.bar)
    .filter((b) => b.at !== null && b.at > s.now && b.state === 'open')
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0))[0];
  if (!next || next.at === null) return null;
  const t = shortDuration((next.at - s.now) / 1000);
  return {
    tone: 'sky',
    cap: SIMPLE_WORDS.beforeCap,
    hero: `${capitalise(next.label)}: ${t}`,
    sub: null,
    big: { value: t, unit: null, note: SIMPLE_WORDS.untilCap },
  };
}
const capitalise = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** The steps, as M10's Goal list (numbered by CSS), each with who it is for. */
export function StepsSection({
  page,
  title,
  quiet = false,
}: {
  page: FullPage;
  title?: string;
  quiet?: boolean;
}) {
  const actions = useNowActions();
  const key = `system:${page.tile.id}`;
  const unfolded = actions.expanded.has(key);
  const shown = unfolded ? page.goals : page.goals.slice(0, 5);
  const opens =
    page.locked || page.tile.status === 'not-covered'
      ? (page.unlock?.text ?? (page.alwaysOpen ? PAGE_FRAME_WORDS.openFromStart : null))
      : null;
  if (page.goals.length === 0 && page.skippedKeys.length === 0 && page.dismissed.length === 0 && !opens)
    return null;
  return (
    <section className={`sf-sec sf-steps${quiet ? ' sf-steps--quiet' : ''}`} aria-labelledby="sf-steps-h">
      <span id="sf-steps-h" className="sf-capline">
        {title ?? (opens && page.goals.length === 0 ? PAGE_FRAME_WORDS.howItOpens : PAGE_FRAME_WORDS.inGame)}
      </span>
      {opens && page.goals.length === 0 ? (
        <ol className="sf-plain">
          <li>
            <span className="sf-n">1</span>
            <span>{opens}</span>
          </li>
        </ol>
      ) : null}
      <GoalList
        goals={shown}
        subject={key}
        hiddenCount={unfolded ? 0 : page.goals.length - shown.length}
        skipped={page.skippedKeys}
        dismissed={page.dismissed}
        seeIt={false}
        who={(_, n) => page.frame.steps.find((x) => x.key === shown[n]?.action.key)?.who ?? null}
      />
    </section>
  );
}

/** Quick collects, Timeline bars and Spend Plan lines: real data the page has, shown when present. */
export function ExtrasSections({ s, page }: { s: Session; page: FullPage }) {
  const bars = timelineBarsOf(s, page.tile.id);
  const actions = useNowActions();
  const overview = page.tabHome ? OVERVIEWS[page.tabHome] : undefined;
  const tab = page.tabHome ? tabById(page.tabHome) : undefined;
  return (
    <>
      {overview && tab ? (
        <a
          className="sf-link"
          href={`#${overview}`}
          onClick={(e) => {
            e.preventDefault();
            actions.navigate?.({ place: 'characters', section: overview });
          }}
        >
          {SIMPLE_WORDS.seeEvery(tab.label)} →
        </a>
      ) : null}
      {page.pills.length > 0 ? (
        <section className="sf-sec" aria-labelledby="sf-pills-h">
          <span id="sf-pills-h" className="sf-capline">
            {SIMPLE_WORDS.quickCollects}
          </span>
          <ul className="sf-plain">
            {page.pills.map((p) => (
              <li key={p.key}>
                <Pip tone={p.fullNow ? 'coral' : 'sky'} />
                <a
                  href={tabHref('now', p.index)}
                  onClick={(e) => {
                    e.preventDefault();
                    s.open(p.index, 'now');
                  }}
                >
                  {p.label}
                </a>
                <span className="sf-muted">{shortWho(s, p.index)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {bars.length > 0 ? (
        <section className="sf-sec" aria-labelledby="sf-tl-h">
          <span id="sf-tl-h" className="sf-capline">
            {SIMPLE_WORDS.onTimeline}
          </span>
          <ul className="sf-hair">
            {bars.map(({ bar, who }) => (
              <li key={bar.barId} className="sf-hair__row">
                <span className="sf-grow">
                  {bar.label}
                  {who ? <span className="sf-muted"> · {who}</span> : null}
                </span>
                <span className="sf-muted">
                  {bar.timeText}
                  {bar.flag ? ` · ${bar.flag}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <a
            className="sf-link"
            href={formatRoute({ place: 'timeline', section: null })}
            onClick={(e) => {
              e.preventDefault();
              s.navigate({ place: 'timeline', section: null }, 'push');
            }}
          >
            {SIMPLE_WORDS.timelineLink} →
          </a>
        </section>
      ) : null}
      {page.spendLines.length > 0 ? <SpendSection s={s} page={page} /> : null}
    </>
  );
}

export function SpendSection({ s, page, title }: { s: Session; page: FullPage; title?: string }) {
  if (page.spendLines.length === 0) return null;
  return (
    <section className="sf-sec" aria-labelledby="sf-spend-h">
      <span id="sf-spend-h" className="sf-capline">
        {title ?? SIMPLE_WORDS.spendPlan}
      </span>
      <ul className="sf-hair">
        {page.spendLines.map((l) => (
          <li key={l.lineId} className="sf-hair__row">
            {l.text}
          </li>
        ))}
      </ul>
      <button type="button" className="sf-link sf-linkbtn" onClick={() => s.toSpend()}>
        {SIMPLE_WORDS.spendPlanLink} →
      </button>
    </section>
  );
}

const shortWho = (s: Session, index: number) => {
  const c = s.result.characters.find((x) => x.index === index);
  return c ? `${c.classLabel} ${c.level}` : '';
};

/** "What ActiveOn checks": each check with its state, or the suggest link when there are none. */
export function ChecksTile({ s, page }: { s: Session; page: FullPage }) {
  const checks = page.frame.checks;
  const suggest = () =>
    s.suggestions?.open({ kind: 'suggest', type: 'idea', screen: 'account', characterIndex: null });
  return (
    <aside className="sf-tile sf-checks" aria-labelledby="sf-checks-h">
      <span id="sf-checks-h" className="sf-capline">
        {PAGE_FRAME_WORDS.whatChecks}
      </span>
      {checks.length > 0 ? (
        <ul className="sf-hair">
          {checks.map((c) => (
            <li key={c.title} className="sf-hair__row">
              <Pip tone={c.tone} />
              <span className="sf-grow">{c.title}</span>
              <span className={`sf-xs sf-t--${c.tone}`}>{c.word}</span>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="sf-muted">{PAGE_FRAME_WORDS.noChecksYet}</p>
          {s.suggestions ? (
            <button type="button" className="sf-link a-btn--plain" onClick={suggest}>
              {PAGE_FRAME_WORDS.suggestCheck(page.tile.name)} →
            </button>
          ) : (
            <a
              className="sf-link"
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
              {PAGE_FRAME_WORDS.suggestCheck(page.tile.name)} →
            </a>
          )}
        </>
      )}
    </aside>
  );
}

/** M24: the thin page. `body` is an older picture (pages.ts) shown above the steps until it moves. */
export function SimplePage({ s, page, body }: { s: Session; page: FullPage; body?: ReactNode }) {
  const blurb = SYSTEM_BLURBS[page.tile.id];
  const answer = timerAnswer(s, page);
  const status: { tone: FrameTone; word: string; reason?: string | null } | undefined = answer
    ? {
        tone: 'sky',
        word: SIMPLE_WORDS.capsIn(answer.big?.value ?? ''),
        reason: page.frame.status.reason || null,
      }
    : undefined;
  return (
    <SystemFrame s={s} page={page} {...(answer ? { answer } : {})} {...(status ? { status } : {})}>
      {body ? <div className="sf-col">{body}</div> : null}
      <div className="sf-split">
        <div className="sf-col">
          {blurb ? (
            <section className="sf-sec" aria-labelledby="sf-what-h">
              <span id="sf-what-h" className="sf-capline">
                {SIMPLE_WORDS.whatItIs}
              </span>
              <p className="sf-text">{blurb}</p>
            </section>
          ) : null}
          <StepsSection page={page} />
          <ExtrasSections s={s} page={page} />
        </div>
        <ChecksTile s={s} page={page} />
      </div>
    </SystemFrame>
  );
}
