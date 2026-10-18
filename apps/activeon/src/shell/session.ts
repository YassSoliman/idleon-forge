// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 FR-10, TR-1: the Play Session state, lifted out of the Now screen into the shell so it survives
// place moves. It holds the route (the fragment, TR-3), where a Character page was opened from (FR-4,
// D-3), per-place scroll, the follow state and its save handler (M10 FR-14, D-4), the frozen Visit
// Order (D6), M10's `expanded` set, the pending "Now playing · go" chip, the one polite live region and
// the player's preferences. Moving between places never re-runs the engine or the worker: every place
// re-renders from the same `EngineResult` and the `NowView` built here.
import type { AccountState } from '@idleon-forge/account-state';
import {
  buildNowView,
  buildSystemsView,
  buildTimelineView,
  invariantViolations,
  type NowView,
  nextLocalMidnight,
  PLACE_WORDS,
  type TimelineFix,
} from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import type { SaveKind } from '@idleon-forge/sync';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BUILDS_OPEN } from '../now/BuildView';
import { CARDS_OPEN } from '../now/cards/CardsPanel';
import { characterTabs, NOW_TAB } from '../now/character-tabs';
import type { NowActions } from '../now/context';
import { AUTO_OPEN_MS, type FollowState, INITIAL_FOLLOW, onSave, onTap } from '../now/follow';
import { toNowPrefs, useNowPrefsStore } from '../now/prefs-store';
import { buildInfo } from '../now/release';
import { reportUrl } from '../now/report';
import { useSuggestions } from '../suggestions/SuggestionsProvider';
import { useNow } from '../use-now';
import {
  formatRoute,
  type KnownRoutes,
  type Place,
  parseRoute,
  placeOf,
  type Route,
  routeKey,
  routeOfHash,
} from './route';

export interface NowSave {
  state: AccountState;
  source: 'live' | 'paste';
  seq: number;
  kind: SaveKind;
  slot: number | null;
}

export interface ShellProps {
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
const readLocation = () => {
  try {
    return { hash: window.location.hash, search: window.location.search };
  } catch {
    return { hash: '', search: '' };
  }
};
const readOrigin = (): string => {
  try {
    const o = (window.history.state as { origin?: unknown } | null)?.origin;
    return typeof o === 'string' ? o : '#now';
  } catch {
    return '#now';
  }
};
/** `#builds` and `#cards` open the folded overview they point at. */
const unfoldFor = (hash: string): string[] =>
  hash === '#builds' ? [BUILDS_OPEN] : hash === '#cards' ? [CARDS_OPEN] : [];

/** FR-7 / D-2: a legacy `?c=` is rewritten once, by replaceState, and never written again. */
function rewriteLegacy(): string {
  const { hash, search } = readLocation();
  const { rewrite } = parseRoute(hash, search, { tabs: [], systems: [], indexes: [], timeline: false });
  if (rewrite === null) return hash;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('c');
    url.hash = rewrite;
    window.history.replaceState(window.history.state, '', url);
  } catch {}
  return rewrite;
}

const interactingIn = (el: HTMLElement | null) => {
  if (typeof document === 'undefined') return false;
  if (document.querySelector('.confirm, .report-confirm')) return true;
  if (!el) return false;
  if (el.contains(document.activeElement) && document.activeElement !== el.querySelector('h2')) return true;
  return el.querySelector('details[open], [aria-expanded="true"]') !== null;
};

/** The place a route is marked under (FR-4): a page belongs to the place it was opened from. */
export function markedPlace(route: Route, origin: string): Place {
  if (route.place !== 'character') return placeOf(route);
  if (origin === '#characters' || origin === '#builds' || origin === '#cards') return 'characters';
  if (origin === '#systems' || origin.startsWith('#system-')) return 'systems';
  if (origin === '#timeline') return 'timeline';
  return 'now';
}

export interface NavigateOptions {
  /** Where a Character page was opened from (a fragment); defaults to the current screen. */
  origin?: string;
  /** The NextAction key to outline on arrival (FR-31). */
  highlight?: string | null;
}

export function useSession(props: ShellProps) {
  const { save, namespace } = props;
  const result = useMemo<EngineResult>(
    () => ({ ...props.result, versions: { ...props.result.versions, parserBehind: props.parserBehind } }),
    [props.result, props.parserBehind],
  );
  const prefs = useNowPrefsStore(namespace);
  // TR-9: invariants log once per result in dev builds; production renders anyway.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const v = invariantViolations(props.result);
    if (v.length) console.warn(`EngineResult invariants (TR-9):\n${v.join('\n')}`);
  }, [props.result]);
  const live = save.source === 'live';
  const lastCloudSave = save.state.account.lastCloudSave;
  const names = useMemo(() => result.characters.map((c) => c.name), [result]);

  // ---- the route (TR-3) and where a page was opened from (FR-4, D-3) ----
  const [hash, setHash] = useState<string>(rewriteLegacy);
  const [origin, setOrigin] = useState<string>(readOrigin);
  const known: KnownRoutes = useMemo(
    () => ({
      tabs: characterTabs.map((t) => t.id),
      systems: (result.systems ?? []).filter((s) => s.kind === 'game').map((s) => s.id),
      indexes: result.characters.map((c) => c.index),
      timeline: true,
    }),
    [result],
  );
  const route = useMemo(() => routeOfHash(hash, known), [hash, known]);
  // FR-10: the shell restores each place's scroll itself; the browser's own restoration would race it.
  useEffect(() => {
    try {
      window.history.scrollRestoration = 'manual';
    } catch {}
  }, []);
  const loadRoute = useRef(route);
  const place = markedPlace(route, origin);
  const [highlight, setHighlight] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(unfoldFor(hash)));
  const [follow, setFollow] = useState<FollowState>(INITIAL_FOLLOW);
  const [pendingFollow, setPendingFollow] = useState<{ index: number; text: string } | null>(null);
  const [announce, setAnnounce] = useState('');
  const [seenKeys, setSeenKeys] = useState<readonly string[] | null>(null);
  const memoryOrder = useRef<{ sessionStartedAt: number | null; order: number[] } | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLElement | null>(null);
  const outletRef = useRef<HTMLDivElement | null>(null);
  const rows = useRef(new Map<number, HTMLButtonElement>());
  const focusHeading = useRef(false);
  const focusRowAfterBack = useRef<number | null>(null);
  const scrolls = useRef(new Map<string, number>());
  const pendingScroll = useRef<number | null>(null);
  /** M17 FR-27: the Next Action or pill a Timeline link scrolls to on arrival, and whether its details open. */
  const pendingReveal = useRef<{ key: string; details: boolean } | null>(null);
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
  const nowPrefs = useMemo(() => toNowPrefs(prefs.data, seenKeys), [prefs.data, seenKeys]);

  const viewFor = useCallback(
    (f: number | null, v: ReadonlySet<number>, extra: Partial<Parameters<typeof buildNowView>[2]> = {}) =>
      buildNowView(result, nowPrefs, {
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
      nowPrefs,
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
  const validFocus = route.place === 'character' ? route.index : null;
  const pageTab = route.place === 'character' ? route.tab : NOW_TAB;
  const view = useMemo(() => viewFor(validFocus, visited), [viewFor, validFocus, visited]);
  const systems = useMemo(
    () => buildSystemsView(result, nowPrefs, { now, lastCloudSave }),
    [result, nowPrefs, now, lastCloudSave],
  );
  // M17 TR-6: the Timeline from the same result and the Roster's frozen order; null without M3.
  const timeline = useMemo(
    () => buildTimelineView(result, nowPrefs, view, { now, lastCloudSave, tzOffsetMinutes: tz(now) }),
    [result, nowPrefs, view, now, lastCloudSave],
  );

  // ---- moving between places (FR-8, FR-11) ----
  const navigate = useCallback(
    (to: Route, how: 'push' | 'replace', opts: NavigateOptions = {}) => {
      scrolls.current.set(routeKey(route), window.scrollY);
      const fromHere = route.place === 'character' ? origin : formatRoute(route);
      const nextOrigin =
        opts.origin ?? (to.place === 'character' || to.place === 'system' ? fromHere : '#now');
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('c');
        url.hash = formatRoute(to);
        const state = { origin: nextOrigin };
        if (how === 'push') window.history.pushState(state, '', url);
        else window.history.replaceState(state, '', url);
        setHash(url.hash);
      } catch {
        setHash(formatRoute(to));
      }
      setOrigin(nextOrigin);
      setHighlight(opts.highlight ?? null);
      setPendingFollow(null);
      for (const id of to.place === 'characters' && to.section ? unfoldFor(`#${to.section}`) : [])
        setExpanded((prev) => new Set([...prev, id]));
      if (how === 'push') {
        focusHeading.current = true;
        pendingScroll.current = scrolls.current.get(routeKey(to)) ?? 0;
      }
    },
    [route, origin],
  );
  useEffect(() => {
    const onPop = () => {
      const next = readLocation().hash;
      const nextRoute = routeOfHash(next, known);
      setHash((prev) => {
        const prevRoute = routeOfHash(prev, known);
        scrolls.current.set(routeKey(prevRoute), window.scrollY);
        if (prevRoute.place === 'character' && nextRoute.place === 'now')
          focusRowAfterBack.current = prevRoute.index;
        return next;
      });
      setOrigin(readOrigin());
      setPendingFollow(null);
      const saved = scrolls.current.get(routeKey(nextRoute));
      if (saved !== undefined) pendingScroll.current = saved;
      const unfold = unfoldFor(next);
      if (unfold.length) setExpanded((prev) => new Set([...prev, ...unfold]));
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, [known]);
  // Arrival: scroll restored or to the top, keyboard focus to the place's heading (player moves only).
  useEffect(() => {
    if (pendingScroll.current !== null) {
      const y = pendingScroll.current;
      pendingScroll.current = null;
      try {
        window.scrollTo({ top: y });
      } catch {}
    }
    if (focusHeading.current) {
      focusHeading.current = false;
      const h =
        route.place === 'character'
          ? headingRef.current
          : outletRef.current?.querySelector<HTMLElement>('[data-place-heading]');
      h?.focus({ preventScroll: true });
    }
    if (route.place === 'now' && focusRowAfterBack.current !== null) {
      rows.current.get(focusRowAfterBack.current)?.focus();
      focusRowAfterBack.current = null;
    }
    if (route.place === 'characters' && route.section)
      document.getElementById(route.section)?.scrollIntoView?.({ block: 'start' });
    const reveal = pendingReveal.current;
    if (reveal) {
      const q = CSS.escape(reveal.key);
      const el = document.querySelector<HTMLElement>(`[data-na-key="${q}"], [data-cap-key="${q}"]`);
      if (el) {
        pendingReveal.current = null;
        if (reveal.details)
          el.querySelector<HTMLDetailsElement>('details.goal-details')?.setAttribute('open', '');
        el.scrollIntoView?.({ block: 'center' });
      }
    }
  });

  const open = useCallback(
    (index: number, tab?: string) => {
      // From the Roster or a grid a character opens on Now; switching characters keeps the tab.
      const nextTab = tab ?? (route.place === 'character' ? route.tab : NOW_TAB);
      setFollow((f) => onTap(f, index, live));
      navigate({ place: 'character', index, tab: nextTab }, 'push');
    },
    [live, navigate, route],
  );
  const openTab = useCallback((index: number, id: string) => open(index, id), [open]);
  const back = useCallback(() => {
    if (route.place === 'character') focusRowAfterBack.current = route.index;
    const target = route.place === 'character' ? routeOfHash(origin, known) : { place: 'now' as const };
    navigate(target.place === 'character' ? { place: 'now' } : target, 'push');
  }, [route, origin, known, navigate]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && validFocus !== null && !document.querySelector('.confirm')) back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [validFocus, back]);

  // ---- follow the game (M10 FR-14, D1, the #38 ruling; M17 FR-9, D-4) ----
  const lastSeq = useRef<number | null>(null);
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
    // First-load auto-open only on a Now route: a deep link anywhere else wins (FR-9).
    if (firstOfLoad && loadRoute.current.place !== 'now') return;
    if (followTo === validFocus) return;
    const name = result.characters.find((c) => c.index === followTo)?.name ?? '';
    const label = state.playing?.status === 'next-up' ? `Next up ${name}` : `Now playing ${name}`;
    const followable = route.place === 'now' || (route.place === 'character' && route.tab === NOW_TAB);
    if (!followable || (validFocus !== null && interactingIn(cardRef.current))) {
      setPendingFollow({ index: followTo, text: label });
      setAnnounce(label);
      return;
    }
    // Following never moves keyboard focus and keeps the scroll anchored.
    const y = window.scrollY;
    navigate({ place: 'character', index: followTo, tab: NOW_TAB }, 'replace', { origin: '#now' });
    requestAnimationFrame(() => {
      try {
        window.scrollTo({ top: y });
      } catch {}
    });
    const left =
      state.leftFrom !== null ? result.characters.find((c) => c.index === state.leftFrom)?.name : null;
    setAnnounce(left && state.playing?.status === 'next-up' ? `Left ${left}. ${label}` : `Now on ${name}`);
  }, [save, live, lastCloudSave, follow, result, viewFor, validFocus, navigate, route]);

  // ---- time-driven rebuilds (TR-5; M17 TR-6: a Timeline bar turning full now) ----
  const nextExpiry = Math.min(view.nextExpiry ?? Infinity, timeline?.nextExpiry ?? Infinity);
  useEffect(() => {
    if (!Number.isFinite(nextExpiry)) return;
    const ms = Math.max(0, nextExpiry - Date.now()) + 50;
    const t = setTimeout(() => setTick(Date.now()), Math.min(ms, 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [nextExpiry]);

  // ---- tab title (FR-11, M10 FR-34) and the one batched announcement per result (TR-14) ----
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
  const placeName = PLACE_NAMES[place];
  useEffect(() => {
    const prefix = seenKeys !== null && view.newCount > 0 ? `(${view.newCount}) ` : '';
    document.title = `${prefix}${placeName} · ActiveOn`;
  }, [seenKeys, view.newCount, placeName]);
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
  const pick = useCallback(
    (seconds: number) => {
      prefs.setExpectedReturn({ seconds, chosenAt: Date.now() });
      setExpectedReturn(seconds);
    },
    [prefs, setExpectedReturn],
  );

  // ---- actions for the leaves ----
  const focusChar = result.characters.find((c) => c.index === validFocus) ?? null;
  const suggestions = useSuggestions();
  const reportScreen = focusChar ? 'character' : place === 'systems' ? 'account' : 'now';
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
      openReport: suggestions
        ? (r) =>
            suggestions.open({
              kind: 'report',
              source: r,
              screen: reportScreen,
              characterIndex: focusChar?.index ?? null,
            })
        : null,
      open: (index) => open(index),
      openTab,
      toggle: (id) =>
        setExpanded((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      expanded,
      navigate: (to, opts) => navigate(to, 'push', opts),
      place,
      result,
      highlight,
    }),
    [
      prefs,
      result,
      focusChar,
      names,
      open,
      openTab,
      expanded,
      suggestions,
      reportScreen,
      navigate,
      place,
      highlight,
    ],
  );

  /** M17 FR-27: from a Timeline bar to where its Next Action (or pill) is shown, unfolded and outlined. */
  const toFix = useCallback(
    (fix: TimelineFix) => {
      const m = /^c(\d+)$/.exec(fix.subject);
      const index = m ? Number(m[1]) : null;
      if (fix.expand === 'show-more')
        setExpanded((prev) => new Set([...prev, index === null ? 'account' : `c${index}`]));
      pendingReveal.current = { key: fix.key, details: fix.expand === 'behind-details' };
      if (fix.where === 'account' || index === null) {
        navigate({ place: 'now' }, 'push', { highlight: fix.key });
        return;
      }
      setFollow((f) => onTap(f, index, live));
      navigate({ place: 'character', index, tab: NOW_TAB }, 'push', {
        highlight: fix.key,
        origin: '#timeline',
      });
    },
    [navigate, live],
  );

  const toSpend = useCallback(() => {
    if (route.place !== 'now' && route.place !== 'character') navigate({ place: 'now' }, 'push');
    setExpanded((prev) => new Set([...prev, 'spend-open']));
    requestAnimationFrame(() => document.getElementById('spend-plan')?.scrollIntoView({ block: 'start' }));
  }, [route, navigate]);
  const onNext = (index: number | null) => {
    if (index === null) {
      accountRef.current?.focus();
      accountRef.current?.scrollIntoView({ block: 'start' });
      return;
    }
    open(index);
  };
  const toAccountFix = () => {
    const go = () => {
      const el = document.getElementById('account-fix') ?? accountRef.current;
      el?.focus({ preventScroll: true });
      el?.scrollIntoView?.({ block: 'start' });
    };
    // The Account section is on Now and on every Character page; from another place, go there first.
    if (route.place === 'now' || route.place === 'character') return go();
    navigate({ place: 'now' }, 'push');
    requestAnimationFrame(go);
  };

  return {
    result,
    prefs,
    view,
    systems,
    timeline,
    toFix,
    route,
    origin,
    place,
    navigate,
    open,
    back,
    onNext,
    toSpend,
    toAccountFix,
    pick,
    actions,
    pendingFollow,
    spoken,
    live,
    fresh,
    follow,
    focusChar,
    validFocus,
    pageTab,
    suggestions,
    now,
    lastCloudSave,
    highlight,
    refs: { headingRef, cardRef, accountRef, outletRef, rows },
  };
}

export const PLACE_NAMES: Record<Place, string> = PLACE_WORDS;

export type Session = ReturnType<typeof useSession>;
