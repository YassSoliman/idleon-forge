// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Now place (M10; M21 FR-N1). Top to bottom on a phone: the stale-first banner when the save is
// stale, the counter with its first fix, the Expected Return line, the pause-point control, the pause
// point's content (Log in: the Away card and what changed; Log off: the AFK Setup list), then Rounds'
// grouped jobs and the Roster, then the Account summary. The compact AFK strip (area T's) sits between
// the pause control and its content (FR-I1). A Character page is the same object from every
// place (M17 FR-15): Focus plus the Account. The session state lives in the shell (M17 FR-10,
// `shell/session.ts`), so it survives place moves; nothing here orders or filters advice
// (`buildNowView` and `buildSessionView` do).
import { FLOW_WORDS, PLACE_WORDS } from '@idleon-forge/engine/now';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { EmptyState } from '../design/atoms/States';
import { span } from '../design/format';
import { Loading, lazyPart } from '../lazy-part';
import type { Session } from '../shell/session';
import { AfkStrip } from '../timeline/AfkStrip';
import { AccountSection } from './Account';
import { Counter, ReturnLine, StaleBanner, staleAge } from './chrome/Answer';
import { PauseContent, PauseControl, usePauseState } from './chrome/Pause';
import { Roster } from './Roster';
import { useNowSettings } from './settings/context';

export type { NowSave, ShellProps as NowScreenProps } from '../shell/session';

/** Focus, the Character page's Now tab, is a lazy part (M21 TR-12): it is prefetched when idle. */
const Focus = lazyPart(
  () => import('./Focus'),
  (m) => m.Focus,
);

/**
 * The session view's builder is its own small lazy chunk (M21 TR-12), started with this module: the
 * worker's first parse takes far longer than this fetch, so the counter never waits on it in practice.
 */
const SessionHost = lazyPart(
  () => import('./session/SessionHost'),
  (m) => m.SessionHost,
);
SessionHost.preload().catch(() => undefined);

/** When this page first loaded: a pasted save has no Play Session, so a pick holds for the visit. */
const LOADED_AT = Date.now();

export function NowPlace({ s }: { s: Session }) {
  const { view, result, refs } = s;
  const settings = useNowSettings();
  const session = result.sessionStartedAt;
  const [pause, setPause] = usePauseState(session);
  const chosenAt = s.prefs.data.expectedReturn?.chosenAt ?? null;
  const ui = useMemo(
    () => ({
      returnChangedThisSession: chosenAt !== null && chosenAt >= (session ?? LOADED_AT),
      manualTab: pause.manual,
      visited: [...s.visited],
    }),
    [chosenAt, session, pause.manual, s.visited],
  );
  const stale = staleAge(s.now, s.lastCloudSave, result.expectedReturn.usedSeconds);
  const [updating, setUpdating] = useState(false);
  const pick = useCallback(
    (seconds: number) => {
      setUpdating(true);
      s.pick(seconds);
      setTimeout(() => setUpdating(false), 1500);
    },
    [s],
  );
  const back =
    view.expectedReturn.chips.find((c) => c.pressed)?.label ?? span(result.expectedReturn.usedSeconds * 1000);

  if (view.focus)
    return (
      <>
        {stale !== null ? <StaleBanner ageMs={stale} lastKnown={null} /> : null}
        <div ref={refs.cardRef}>
          <Focus
            headingRef={refs.headingRef}
            card={view.focus}
            pendingFollow={null}
            showCloudSaveTip={
              s.live &&
              s.fresh &&
              s.follow.playing?.index === view.focus.index &&
              s.follow.playing.status !== 'confirmed'
            }
            onBack={s.back}
            onNext={s.onNext}
            tab={s.pageTab}
            onTab={(id) =>
              view.focus &&
              s.navigate({ place: 'character', index: view.focus.index, tab: id }, 'replace', {
                origin: s.origin,
              })
            }
            view={view}
          />
        </div>
        <AccountSection ref={refs.accountRef} view={view} />
      </>
    );

  return (
    <>
      <div ref={refs.cardRef} className="n-now">
        <h2 className="sr-only" data-place-heading tabIndex={-1}>
          {PLACE_WORDS.now}
        </h2>
        <Suspense fallback={<Loading what={PLACE_WORDS.now} />}>
          <SessionHost view={view} result={result} ui={ui}>
            {(sv) => (
              <>
                {stale !== null ? <StaleBanner ageMs={stale} lastKnown={sv.counter.count} /> : null}
                <Counter
                  view={view}
                  counter={sv.counter}
                  lastCloudSave={s.lastCloudSave}
                  stale={stale !== null}
                  onFirst={(_key, who) => (who ? s.open(who.index) : s.toAccountFix())}
                  unknownOpen={s.actions.expanded.has('unknown-fold')}
                  onUnknown={() => s.actions.toggle('unknown-fold')}
                  onTimeline={
                    s.timeline ? () => s.navigate({ place: 'timeline', section: null }, 'push') : null
                  }
                  fillAt={result.firstFill ? { at: result.firstFill.at, settings } : null}
                  afkDetail={s.views.afkStrip?.allSetDetail ?? null}
                />
                <ReturnLine
                  view={view}
                  result={result}
                  settings={settings}
                  updating={updating}
                  onPick={pick}
                  facts={s.views.afkStrip?.returnFacts ?? null}
                />
                <PauseControl view={sv} onPick={(tab) => setPause({ manual: tab })} />
                <AfkStrip
                  strip={s.views.afkStrip}
                  families={view.families}
                  onOpen={() => s.navigate({ place: 'timeline', section: null }, 'push')}
                />
                <PauseContent
                  view={sv}
                  shown={pause.logoff}
                  onShown={(logoff) => setPause({ logoff })}
                  onOpen={(i) => s.open(i)}
                  onBuild={(i) => s.actions.openTab(i, 'build')}
                  back={back}
                />
                {view.roster.length === 0 ? (
                  <EmptyState line={FLOW_WORDS.empty(span(result.expectedReturn.usedSeconds * 1000), null)} />
                ) : null}
                <Roster
                  view={view}
                  result={result}
                  session={sv}
                  onOpen={(i) => s.open(i)}
                  onSpend={s.toSpend}
                  rowRef={(i, el) => {
                    if (el) refs.rows.current.set(i, el);
                    else refs.rows.current.delete(i);
                  }}
                />
              </>
            )}
          </SessionHost>
        </Suspense>
      </div>
      <AccountSection ref={refs.accountRef} view={view} />
    </>
  );
}
