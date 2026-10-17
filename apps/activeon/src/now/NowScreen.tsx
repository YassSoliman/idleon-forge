// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Now screen (M10): Roster or Focus, the Account section and everything around them, built from
// one `NowView` (TR-3). This component owns the screen's session state (Focus in the URL, TR-5; the
// follow state, FR-14; the frozen Visit Order, D6) and the player's preferences (TR-8). It never
// orders or filters advice itself: `buildNowView` does.
import type { AccountState } from '@idleon-forge/account-state';
import { buildNowView, type NowView, nextLocalMidnight } from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import type { SaveKind } from '@idleon-forge/sync';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNow } from '../use-now';
import { AccountSection, IfYouHaveTime, NotCoveredYet } from './Account';
import { Banners, ExpectedReturnChips, ProgressBar, WhatsNewCard } from './Chrome';
import { type NowActions, NowActionsContext } from './context';
import { Focus } from './Focus';
import { AUTO_OPEN_MS, type FollowState, INITIAL_FOLLOW, onSave, onTap } from './follow';
import { toNowPrefs, useNowPrefsStore } from './prefs-store';
import { Roster } from './Roster';
import { buildInfo, useWhatsNew } from './release';
import { reportUrl, suggestUrl } from './report';

export interface NowSave {
  state: AccountState;
  source: 'live' | 'paste';
  seq: number;
  kind: SaveKind;
  slot: number | null;
}

export interface NowScreenProps {
  result: EngineResult;
  save: NowSave;
  /** `activeon:<uidHash>:` or `activeon:paste:<h>:`; null until known (advice waits, TR-8). */
  namespace: string | null;
  expectedReturnSeconds: number;
  setExpectedReturn(seconds: number | null): void;
  updating: boolean;
  /** "Offline: showing your last save from 14:02." and the like (§6). */
  connection: string | null;
  /** M12 FR-24 / TR-10 banner text. */
  update: string | null;
  /** Merged into the result's versions (M1 D3(b)). */
  parserBehind: boolean;
  onReload(): void;
  /** The header slot for the Expected Return chips. */
  renderChips(chips: React.ReactNode): void;
  onFooter(info: NowView['footer'] & { persistent: boolean }): void;
}

const tz = (at: number) => -new Date(at).getTimezoneOffset();
const readFocusParam = (): number | null => {
  try {
    const v = new URLSearchParams(window.location.search).get('c');
    return v !== null && /^\d+$/.test(v) ? Number(v) : null;
  } catch {
    return null;
  }
};
const writeFocusParam = (index: number | null, how: 'push' | 'replace') => {
  try {
    const url = new URL(window.location.href);
    if (index === null) url.searchParams.delete('c');
    else url.searchParams.set('c', String(index));
    if (url.href === window.location.href) return;
    if (how === 'push') window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
  } catch {}
};

const interactingIn = (el: HTMLElement | null) => {
  if (typeof document === 'undefined') return false;
  if (document.querySelector('.confirm, .report-confirm')) return true;
  if (!el) return false;
  if (el.contains(document.activeElement) && document.activeElement !== el.querySelector('h2')) return true;
  return el.querySelector('details[open], [aria-expanded="true"]') !== null;
};

export function NowScreen(props: NowScreenProps) {
  const { save, namespace } = props;
  const result = useMemo<EngineResult>(
    () => ({ ...props.result, versions: { ...props.result.versions, parserBehind: props.parserBehind } }),
    [props.result, props.parserBehind],
  );
  const prefs = useNowPrefsStore(namespace);
  const live = save.source === 'live';
  const lastCloudSave = save.state.account.lastCloudSave;
  const names = useMemo(() => result.characters.map((c) => c.name), [result]);

  const [focus, setFocusState] = useState<number | null>(() => readFocusParam());
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [follow, setFollow] = useState<FollowState>(INITIAL_FOLLOW);
  const [pendingFollow, setPendingFollow] = useState<{ index: number; text: string } | null>(null);
  const [announce, setAnnounce] = useState('');
  const [seenKeys, setSeenKeys] = useState<readonly string[] | null>(null);
  const memoryOrder = useRef<{ sessionStartedAt: number | null; order: number[] } | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLElement | null>(null);
  const rows = useRef(new Map<number, HTMLButtonElement>());
  const focusHeading = useRef(false);
  const focusRowAfterBack = useRef<number | null>(null);
  const [tick, setTick] = useState(0);
  const minute = useNow(60_000);
  const now = Math.max(minute, tick);

  // ---- the frozen Visit Order (D6, TR-7) ----
  const frozenOrder = useMemo(() => {
    const s = result.sessionStartedAt;
    if (s === null) {
      if (memoryOrder.current === null)
        memoryOrder.current = { sessionStartedAt: null, order: result.visitOrder };
      return memoryOrder.current.order;
    }
    const stored = prefs.data.visitOrder;
    if (stored && stored.sessionStartedAt === s) return stored.order;
    return result.visitOrder;
  }, [result, prefs.data.visitOrder]);
  useEffect(() => {
    const s = result.sessionStartedAt;
    if (!prefs.ready || s === null) return;
    if (prefs.data.visitOrder?.sessionStartedAt !== s)
      prefs.setVisitOrder({ sessionStartedAt: s, order: result.visitOrder });
  }, [prefs, result]);

  // ---- prune once per namespace, restore the Expected Return chosen this Play Session (TR-8) ----
  const pruned = useRef<string | null>(null);
  const { setExpectedReturn, expectedReturnSeconds } = props;
  useEffect(() => {
    if (!prefs.ready || namespace === null || pruned.current === namespace) return;
    pruned.current = namespace;
    prefs.prune(
      { now: Date.now(), sessionStartedAt: result.sessionStartedAt, lastCloudSave },
      result.versions.gameBuild,
    );
    const er = prefs.data.expectedReturn;
    const valid = er && (result.sessionStartedAt === null || er.chosenAt >= result.sessionStartedAt);
    if (valid && er.seconds !== expectedReturnSeconds) setExpectedReturn(er.seconds);
  }, [prefs, namespace, result, lastCloudSave, setExpectedReturn, expectedReturnSeconds]);

  const visited = useMemo(() => new Set(follow.visited), [follow.visited]);
  const fresh = live && lastCloudSave !== null && now - lastCloudSave < AUTO_OPEN_MS;

  const viewFor = useCallback(
    (f: number | null, v: ReadonlySet<number>, extra: Partial<Parameters<typeof buildNowView>[2]> = {}) =>
      buildNowView(result, toNowPrefs(prefs.data, seenKeys), {
        focus: f,
        expanded,
        visited: v,
        leftFrom: follow.leftFrom,
        frozenOrder,
        now,
        playing: fresh ? follow.playing : null,
        lastCloudSave,
        tzOffsetMinutes: tz(now),
        appVersion: buildInfo.app,
        update: props.update ? { text: props.update } : null,
        connection: props.connection ? { text: props.connection } : null,
        ...extra,
      }),
    [
      result,
      prefs.data,
      seenKeys,
      expanded,
      follow,
      frozenOrder,
      now,
      fresh,
      lastCloudSave,
      props.update,
      props.connection,
    ],
  );
  const validFocus = focus !== null && result.characters.some((c) => c.index === focus) ? focus : null;
  const view = useMemo(() => viewFor(validFocus, visited), [viewFor, validFocus, visited]);

  // ---- Focus and history (TR-5) ----
  const setFocus = useCallback((index: number | null, how: 'push' | 'replace') => {
    setFocusState(index);
    setPendingFollow(null);
    writeFocusParam(index, how);
  }, []);
  useEffect(() => {
    const onPop = () => {
      const c = readFocusParam();
      setFocusState((prev) => {
        if (c === null && prev !== null) focusRowAfterBack.current = prev;
        return c;
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    if (validFocus !== null && focusHeading.current) {
      focusHeading.current = false;
      headingRef.current?.focus();
    }
    if (validFocus === null && focusRowAfterBack.current !== null) {
      rows.current.get(focusRowAfterBack.current)?.focus();
      focusRowAfterBack.current = null;
    }
  });

  const open = useCallback(
    (index: number) => {
      focusHeading.current = true;
      setFollow((f) => onTap(f, index, live));
      setFocus(index, 'push');
    },
    [live, setFocus],
  );
  const back = useCallback(() => {
    focusRowAfterBack.current = validFocus;
    setFocus(null, 'push');
  }, [validFocus, setFocus]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && validFocus !== null && !document.querySelector('.confirm')) back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [validFocus, back]);

  // ---- follow the game (FR-14, D1, the #38 ruling) ----
  const lastSeq = useRef<number | null>(null);
  const urlFocusAtLoad = useRef(readFocusParam() !== null);
  useEffect(() => {
    if (lastSeq.current === save.seq) return;
    const firstOfLoad = lastSeq.current === null;
    lastSeq.current = save.seq;
    if (!live) return; // paste mode never auto-opens or follows (§6)
    const isFresh = lastCloudSave !== null && Date.now() - lastCloudSave < AUTO_OPEN_MS;
    const { state, followTo } = onSave(follow, {
      kind: save.kind,
      slot: save.slot,
      fresh: isFresh,
      sessionStartedAt: result.sessionStartedAt,
      nextUp: (exclude, v) => viewFor(exclude, v, { playing: null }).focus?.next.index ?? null,
    });
    setFollow(state);
    if (followTo === null) return;
    // A valid ?c= wins over first-load auto-open; following resumes on the next switch (TR-5).
    if (firstOfLoad && urlFocusAtLoad.current) return;
    if (followTo === validFocus) return;
    const name = result.characters.find((c) => c.index === followTo)?.name ?? '';
    const label = state.playing?.status === 'next-up' ? `Next up ${name}` : `Now playing ${name}`;
    if (validFocus !== null && interactingIn(cardRef.current)) {
      setPendingFollow({ index: followTo, text: label });
      setAnnounce(label);
      return;
    }
    // Following never moves keyboard focus and keeps the scroll anchored.
    const y = window.scrollY;
    setFocus(followTo, 'replace');
    requestAnimationFrame(() => window.scrollTo({ top: y }));
    const left =
      state.leftFrom !== null ? result.characters.find((c) => c.index === state.leftFrom)?.name : null;
    setAnnounce(left && state.playing?.status === 'next-up' ? `Left ${left}. ${label}` : `Now on ${name}`);
  }, [save, live, lastCloudSave, follow, result, viewFor, validFocus, setFocus]);

  // ---- time-driven rebuilds (TR-5) ----
  useEffect(() => {
    if (view.nextExpiry === null) return;
    const ms = Math.max(0, view.nextExpiry - Date.now()) + 50;
    const t = setTimeout(() => setTick(Date.now()), Math.min(ms, 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [view.nextExpiry]);

  // ---- tab title (FR-34) and the one batched announcement per result (TR-14) ----
  useEffect(() => {
    const blur = () => setSeenKeys(view.visibleKeys);
    const focusIn = () => setSeenKeys(null);
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focusIn);
    return () => {
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focusIn);
    };
  }, [view.visibleKeys]);
  useEffect(() => {
    document.title = seenKeys !== null && view.newCount > 0 ? `(${view.newCount}) ActiveOn` : 'ActiveOn';
  }, [seenKeys, view.newCount]);
  const lastPills = useRef<Map<number, string> | null>(null);
  const [spoken, setSpoken] = useState('');
  useEffect(() => {
    const pills = new Map(view.roster.map((r) => [r.index, r.pill.text]));
    const prev = lastPills.current;
    lastPills.current = pills;
    const changed = prev ? view.roster.filter((r) => prev.get(r.index) !== r.pill.text) : [];
    const parts = [
      announce,
      changed.length
        ? `${changed.length} Verdict${changed.length === 1 ? '' : 's'} changed: ${changed.map((r) => `${r.name} ${r.pill.text}`).join(', ')}`
        : '',
      view.allSet && prev ? view.allSet.text : '',
    ].filter(Boolean);
    if (parts.length === 0) return;
    const t = setTimeout(() => {
      if (typeof document.hasFocus === 'function' && !document.hasFocus()) return;
      setSpoken(parts.join('. '));
      setAnnounce('');
    }, 1000);
    return () => clearTimeout(t);
  }, [view.roster, view.allSet, announce]);

  // ---- header and footer slots ----
  const { renderChips, onFooter } = props;
  const pick = useCallback(
    (seconds: number) => {
      prefs.setExpectedReturn({ seconds, chosenAt: Date.now() });
      setExpectedReturn(seconds);
    },
    [prefs, setExpectedReturn],
  );
  useEffect(() => {
    renderChips(
      <ExpectedReturnChips chips={view.expectedReturn.chips} updating={props.updating} onPick={pick} />,
    );
  }, [renderChips, view.expectedReturn.chips, props.updating, pick]);
  useEffect(
    () => onFooter({ ...view.footer, persistent: prefs.persistent }),
    [onFooter, view.footer, prefs.persistent],
  );

  // ---- actions for the leaves ----
  const focusChar = result.characters.find((c) => c.index === validFocus) ?? null;
  const actions: NowActions = useMemo(
    () => ({
      skip: (key) =>
        prefs.skip(key, {
          midnightAt: nextLocalMidnight(Date.now(), tz(Date.now())),
          sessionStartedAt: result.sessionStartedAt,
        }),
      unskip: (keys) => prefs.unskip(keys),
      dismiss: (key) => prefs.dismiss(key, result.versions.gameBuild),
      undismiss: (keys) => prefs.undismiss(keys),
      reportUrl: (r) =>
        reportUrl(
          {
            ...r,
            screen: focusChar ? 'character' : 'account',
            character: focusChar ? { classLabel: focusChar.classLabel, level: focusChar.level } : null,
            stage: result.stage.id,
            knowledge: result.versions.knowledge,
            gameBuild: result.versions.gameBuild,
            build: buildInfo,
          },
          names,
        ),
      open,
      toggle: (id) =>
        setExpanded((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      expanded,
    }),
    [prefs, result, focusChar, names, open, expanded],
  );

  const toSpend = () => {
    setExpanded((prev) => new Set([...prev, 'spend-open']));
    requestAnimationFrame(() => document.getElementById('spend-plan')?.scrollIntoView({ block: 'start' }));
  };
  const onNext = (index: number | null) => {
    if (index === null) {
      accountRef.current?.focus();
      accountRef.current?.scrollIntoView({ block: 'start' });
      return;
    }
    open(index);
  };
  const whatsNew = useWhatsNew();

  if (!prefs.ready) return <p className="small muted">Loading your choices…</p>;

  return (
    <NowActionsContext.Provider value={actions}>
      <Banners banners={view.banners} onReload={props.onReload} />
      <ProgressBar progress={view.progress} />
      {whatsNew.view ? <WhatsNewCard view={whatsNew.view} onDismiss={whatsNew.dismiss} /> : null}
      <div ref={cardRef}>
        {view.focus ? (
          <Focus
            ref={headingRef}
            card={view.focus}
            pendingFollow={pendingFollow}
            showCloudSaveTip={
              live &&
              fresh &&
              follow.playing?.index === view.focus.index &&
              follow.playing.status !== 'confirmed'
            }
            onBack={back}
            onNext={onNext}
            onConfusing={() =>
              suggestUrl('confusing', {
                screen: 'character',
                character: focusChar ? { classLabel: focusChar.classLabel, level: focusChar.level } : null,
                stage: result.stage.id,
                knowledge: result.versions.knowledge,
                gameBuild: result.versions.gameBuild,
                build: buildInfo,
              })
            }
          />
        ) : (
          <Roster
            view={view}
            onOpen={open}
            onSpend={toSpend}
            rowRef={(i, el) => {
              if (el) rows.current.set(i, el);
              else rows.current.delete(i);
            }}
          />
        )}
      </div>
      <AccountSection ref={accountRef} view={view} />
      <IfYouHaveTime view={view} />
      <NotCoveredYet view={view} />
      <p className="sr-only" aria-live="polite">
        {spoken}
      </p>
    </NowActionsContext.Provider>
  );
}
