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
import { FLOW_WORDS, type NowView, PLACE_WORDS } from '@idleon-forge/engine/now';
import { Suspense, useEffect, useMemo, useSyncExternalStore } from 'react';
import { EmptyState } from '../design/atoms/States';
import { span } from '../design/format';
import { Loading, lazyPart } from '../lazy-part';
import type { Session } from '../shell/session';
import { hasW4Welcome, W4WelcomeSlot } from '../world4/W4WelcomeSlot';
import { AccountSection } from './Account';
import { StaleBanner, staleAge } from './chrome/Answer';
import { PauseControl, usePauseState } from './chrome/Pause';
import { fullGroups, heroState, lossesNow, payersOf } from './place/derive';
import { AwayLine, BackSection, CharacterCards, CoinsRow, Hero } from './place/LogOff';
import { Rail } from './place/Rail';
import './place/place.css';
import type { NowSessionView } from './session/types';

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

/**
 * US-14 (R11 QA): Now has nothing to do. No characters, or All set holds and no Next Action is left on
 * screen (every Goal skipped, or none at all). The sleeping blob shows then; otherwise the list does.
 */
export function nothingToDo(view: NowView): boolean {
  return view.roster.length === 0 || (view.allSet?.covered === true && view.visibleKeys.length === 0);
}

/** "the anvil on Bowman 60 fills first", from the AFK strip's next fill. */
const fillsFirst = (n: { what: string; who: string | null }) =>
  n.who ? `the ${n.what} on ${n.who} fills first` : `the ${n.what} fills first`;

export function NowPlace({ s }: { s: Session }) {
  const { view, result, refs } = s;
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
            onNext={(index) => {
              // M24: the round's end goes back to Now, the top of the round (the Account lives only on Now).
              if (index !== null) return s.onNext(index);
              s.navigate({ place: 'now' }, 'push');
              window.scrollTo?.({ top: 0 });
            }}
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
        {/* M24 rule 8: the Account summary lives only on Now, never under a character's tabs. */}
      </>
    );

  return (
    <>
      <div ref={refs.cardRef} className="n-now np">
        <h2 className="sr-only" data-place-heading tabIndex={-1}>
          {PLACE_WORDS.now}
        </h2>
        <Suspense fallback={<Loading what={PLACE_WORDS.now} />}>
          <SessionHost view={view} result={result} ui={ui}>
            {(sv) => <NowBody s={s} sv={sv} stale={stale} pause={pause} setPause={setPause} back={back} />}
          </SessionHost>
        </Suspense>
      </div>
      <AccountSection ref={refs.accountRef} view={view} rail={<NowRail s={s} />} />
    </>
  );
}

/** The pause points' lazy views (Log in, Rounds): Log off is the first screen. */
const PauseView = lazyPart(
  () => import('./place/Pauses'),
  (m) => m.PauseView,
);

type PauseState = ReturnType<typeof usePauseState>;

/** The rail beside Now: the pause point it shows is the session's, read from the same stored pick. */
function NowRail({ s }: { s: Session }) {
  const { view, result, timeline } = s;
  const losses = lossesNow(timeline, view);
  const tab = useRailTab();
  const goals = view.account.goals.length + view.account.hiddenCount;
  return (
    <Rail
      view={view}
      tab={tab}
      payers={payersOf(view, result)}
      losses={losses}
      fixes={view.account.blockers.length}
      goals={goals}
      onGoals={() => s.navigate({ place: 'account', page: 'goals' }, 'push')}
      onDaily={() => s.navigate({ place: 'timeline', section: 'daily' }, 'push')}
      onSpend={s.toSpend}
    />
  );
}

function NowBody({
  s,
  sv,
  stale,
  pause,
  setPause,
  back,
}: {
  s: Session;
  sv: NowSessionView;
  stale: number | null;
  pause: PauseState[0];
  setPause: PauseState[1];
  back: string;
}) {
  const { view, result, timeline, refs } = s;
  const groups = fullGroups(timeline, view);
  const losses = lossesNow(timeline, view);
  const state = heroState(sv.counter.count, sv.counter.allSet, groups);
  const strip = s.views.afkStrip;
  const first = sv.counter.first;
  const onFirst = () => (first?.who ? s.open(first.who.index) : s.toAccountFix());
  const toTimeline = () => s.navigate({ place: 'timeline', section: null }, 'push');
  const toDaily = () => s.navigate({ place: 'timeline', section: 'daily' }, 'push');
  // The Log off list (DO-CONFIRM): the items first shown this Play Session; the save ticks them.
  const current = sv.logoff.items;
  const keys = new Set(current.map((i) => i.key));
  const known = new Set(pause.logoff.map((i) => i.key));
  const added = current.filter((i) => !known.has(i.key));
  useEffect(() => {
    if (sv.tab === 'logoff' && added.length > 0)
      setPause({
        logoff: [
          ...pause.logoff,
          ...added.map((i) => ({ key: i.key, text: i.text, who: i.who?.label ?? null })),
        ],
      });
  }, [sv.tab, added, pause.logoff, setPause]);
  const ticks =
    sv.tab === 'logoff' && pause.logoff.some((i) => !keys.has(i.key))
      ? pause.logoff.map((i) => ({
          key: i.key,
          text: i.who ? `${i.who}: ${i.text}` : i.text,
          ticked: !keys.has(i.key),
        }))
      : [];
  useEffect(() => setRailTab(sv.tab), [sv.tab]);
  // M24 World 4: the set-up-first welcome comes first and holds the screen's one frame while it shows.
  const framed = !hasW4Welcome(s);
  return (
    <>
      <W4WelcomeSlot s={s} />
      {stale !== null ? <StaleBanner ageMs={stale} lastKnown={sv.counter.count} /> : null}
      <PauseControl view={sv} onPick={(tab) => setPause({ manual: tab })} />
      {sv.tab === 'logoff' ? (
        <>
          <div className={stale !== null ? 'np-lead is-demoted' : 'np-lead'}>
            <Hero
              view={view}
              counter={sv.counter}
              state={state}
              groups={groups}
              losses={losses}
              back={back}
              readyDetail={strip?.allSetDetail ?? sv.counter.allSet?.firstFill ?? null}
              onOpen={(i) => s.open(i)}
              onFirst={onFirst}
              onLoss={toDaily}
              onTimeline={toTimeline}
              unknownOpen={s.actions.expanded.has('unknown-fold')}
              onUnknown={() => s.actions.toggle('unknown-fold')}
              ticks={ticks}
              framed={framed}
            />
            <AwayLine view={view} groups={groups} losses={losses} />
          </div>
          <BackSection
            view={view}
            timeline={timeline}
            before={strip?.before ?? 0}
            onPick={s.pick}
            onTimeline={toTimeline}
          />
        </>
      ) : (
        <Suspense fallback={<Loading />}>
          <PauseView
            tab={sv.tab}
            framed={framed}
            view={view}
            sv={sv}
            timeline={timeline}
            groups={groups}
            losses={losses}
            visited={[...s.visited]}
            onOpen={(i) => s.open(i)}
            onBuild={(i) => s.actions.openTab(i, 'build')}
            onPause={(tab) => setPause({ manual: tab })}
            onTimeline={toTimeline}
            onDaily={toDaily}
            onFirst={onFirst}
          />
        </Suspense>
      )}
      {sv.counter.unknown ? (
        <UnknownFold view={view} sv={sv} s={s} open={s.actions.expanded.has('unknown-fold')} />
      ) : null}
      {/* US-14 (R11 QA): the sleeping blob when there is nothing to do; it names the next thing that fills. */}
      {nothingToDo(view) ? (
        <EmptyState
          line={FLOW_WORDS.empty(
            span(result.expectedReturn.usedSeconds * 1000),
            strip?.next ? fillsFirst(strip.next) : null,
          )}
        />
      ) : null}
      {sv.tab === 'logoff' ? (
        <>
          <CharacterCards
            view={view}
            timeline={timeline}
            groups={groups}
            onOpen={(i) => s.open(i)}
            rowRef={(i, el) => {
              if (el) refs.rows.current.set(i, el);
              else refs.rows.current.delete(i);
            }}
          />
          <CoinsRow payers={payersOf(view, result)} onSpend={s.toSpend} />
        </>
      ) : null}
    </>
  );
}

/** The characters we can't tell about, under the hero when its fold is open (FR-N2). */
function UnknownFold({
  view,
  sv,
  s,
  open,
}: {
  view: NowView;
  sv: NowSessionView;
  s: Session;
  open: boolean;
}) {
  const rows = view.roster.filter((r) => sv.counter.unknown?.indexes.includes(r.index));
  return (
    <ul id="n-unknown-fold" className="np-unknown" hidden={!open}>
      {rows.map((r) => (
        <li key={r.index}>
          <button
            type="button"
            className="np-unknown__row"
            data-index={r.index}
            onClick={() => s.open(r.index)}
          >
            <b>
              {r.classLabel} {r.level}
            </b>
            <span className="np-muted">{r.pill.text}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * The rail sits outside the session view's chunk, so the pause point it follows is shared through a
 * tiny store (the session view decides it; the rail only reads it).
 */
let railTab: 'login' | 'rounds' | 'logoff' = 'logoff';
const railListeners = new Set<() => void>();
function setRailTab(tab: 'login' | 'rounds' | 'logoff') {
  if (tab === railTab) return;
  railTab = tab;
  for (const l of railListeners) l();
}
function useRailTab() {
  return useSyncExternalStore(
    (fn) => {
      railListeners.add(fn);
      return () => railListeners.delete(fn);
    },
    () => railTab,
  );
}
