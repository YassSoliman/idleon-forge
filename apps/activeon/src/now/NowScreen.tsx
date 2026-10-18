// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Now place (M10; M21 FR-N1). Top to bottom on a phone: the stale-first banner when the save is
// stale, the counter with its first fix, the Expected Return line, the pause-point control, the pause
// point's content (Log in: the Away card and what changed; Log off: the AFK Setup list), then Rounds'
// grouped jobs and the Roster, then the Account summary. The compact AFK strip goes between the pause
// control and its content (Integration places it, FR-I1). A Character page is the same object from every
// place (M17 FR-15): Focus plus the Account. The session state lives in the shell (M17 FR-10,
// `shell/session.ts`), so it survives place moves; nothing here orders or filters advice
// (`buildNowView` and `buildSessionView` do).
import { PLACE_WORDS } from '@idleon-forge/engine/now';
import { useCallback, useMemo, useState } from 'react';
import { span } from '../design/format';
import { lazyPart } from '../lazy-part';
import type { Session } from '../shell/session';
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
    }),
    [chosenAt, session, pause.manual],
  );
  const sv = useMemo(() => s.views.sessionView(ui), [s.views, ui]);
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
        {stale !== null ? <StaleBanner ageMs={stale} lastKnown={sv.counter.count} /> : null}
        <Counter
          view={view}
          counter={sv.counter}
          lastCloudSave={s.lastCloudSave}
          stale={stale !== null}
          onFirst={(_key, who) => (who ? s.open(who.index) : s.toAccountFix())}
          unknownOpen={s.actions.expanded.has('unknown-fold')}
          onUnknown={() => s.actions.toggle('unknown-fold')}
          onTimeline={s.timeline ? () => s.navigate({ place: 'timeline', section: null }, 'push') : null}
        />
        <ReturnLine view={view} result={result} settings={settings} updating={updating} onPick={pick} />
        <PauseControl view={sv} onPick={(tab) => setPause({ manual: tab })} />
        <PauseContent
          view={sv}
          shown={pause.logoff}
          onShown={(logoff) => setPause({ logoff })}
          onOpen={(i) => s.open(i)}
          onBuild={(i) => s.actions.openTab(i, 'build')}
          back={back}
        />
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
      </div>
      <AccountSection ref={refs.accountRef} view={view} />
    </>
  );
}
