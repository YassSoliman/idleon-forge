// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The app shell: picks the screen state (M10 TR-11: signed-out → waiting → parsing → broken |
// engine-error | ok) and renders the Now screen inside it. No clock here: only the ticking pieces
// (save age, countdowns) re-render every second (M10 TR-5).
//
// M21 (area N): the one-line header with its overflow menu (G1) and Settings (G10), sign-in out of the
// way (`flows.sign-in`), the walking blob while waiting, the gremlin with a labelled "use your last good
// save", the fallback Roster, and the fan-disclaimer footer. A newer build shows as the header's quiet
// "New version ready · Reload" chip; a pasted save is kept across that reload (this tab only).

import { FLOW_WORDS, HEADER_WORDS } from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import { PATCH_FOOTER_NOTE, preferencePrefix } from '@idleon-forge/sync';
import { type ReactNode, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header, type HeaderSave } from './components/Header';
import { PixelArt } from './design/art/PixelArt';
import { Button } from './design/atoms/Button';
import { ago, clockAt, localOffsetMinutes } from './design/format';
import { Loading, lazyPart } from './lazy-part';
import { AdviceBoundary, CantWorkOut } from './now/CantWorkOut';
import { Waiting } from './now/Chrome';
import { LazySheet as Sheet } from './now/chrome/LazySheet';
import { useNoticeDot } from './now/chrome/notices';
import { shortHash } from './now/prefs-store';
import { buildInfo, forgetWhatsNew, previewBadge, useUpdateAvailable } from './now/release';
import { suggestUrl } from './now/report';
import { SettingsNamespace } from './now/settings/context';
import { Shell } from './shell/Shell';
import { readSuggestionsConfig } from './suggestions/config';
import type { Scene } from './suggestions/context';
import { ReadyToSend, SuggestionsProvider, useSuggestions } from './suggestions/SuggestionsProvider';
import { type ActiveOn, type ClearOptions, type SaveState, useActiveOn } from './use-activeon';
import { useNow } from './use-now';

// Lazy parts (M21 TR-12): what opens on a tap stays out of the first load and is prefetched when idle.
const SettingsBody = lazyPart(
  () => import('./now/settings/Settings'),
  (m) => m.SettingsBody,
);
const HeaderMenu = lazyPart(
  () => import('./components/HeaderMenu'),
  (m) => m.HeaderMenu,
);
const Footer = lazyPart(
  () => import('./components/Footer'),
  (m) => m.Footer,
);
// Sign-in is the first screen only when signed out; signed in, it lives in the overflow menu.
const SignIn = lazyPart(
  () => import('./components/SignIn'),
  (m) => m.SignIn,
);
const SignOutControl = lazyPart(
  () => import('./components/SignIn'),
  (m) => m.SignOutControl,
);
// The broken-save and paste states are rare after the first visit: lazy too, behind the walking blob.
const CantRead = lazyPart(
  () => import('./components/CantRead'),
  (m) => m.CantRead,
);
const PasteSave = lazyPart(
  () => import('./components/PasteSave'),
  (m) => m.PasteSave,
);

type FooterInfo = {
  app: string;
  knowledge: string;
  game: string;
  parserTarget: string;
  failedChecks: number;
  persistent: boolean;
};

/** A pasted save survives the "New version ready" reload in this tab only (sessionStorage, guarded). */
const RELOAD_PASTE = 'activeon:reload-paste';

/** Keeps the pasted text for a reload; false when the browser won't keep it (the chip then warns). */
export function keepPasteForReload(text: string | null): boolean {
  if (text === null) return true;
  try {
    sessionStorage.setItem(RELOAD_PASTE, text);
    return true;
  } catch {
    return false;
  }
}

/** The pasted text a reload kept, read once and forgotten. */
export function takeKeptPaste(): string | null {
  try {
    const t = sessionStorage.getItem(RELOAD_PASTE);
    if (t !== null) sessionStorage.removeItem(RELOAD_PASTE);
    return t;
  } catch {
    return null;
  }
}

type Ready = Extract<SaveState, { status: 'ready' }>;

export function App() {
  const a = useActiveOn();
  const { auth, save, uid } = a;
  const ready = save.status === 'ready' ? save : null;
  const versionState = ready?.state ?? a.lastGood?.state ?? null;
  const serverBuild = a.patch?.build?.serverBuild ?? versionState?.account.gameVersion.serverBuild ?? null;

  // M13: what a Suggestion's context is built from, read when the form opens and again at send time.
  const suggestionsConfig = useMemo(() => readSuggestionsConfig(import.meta.env, buildInfo), []);
  const sceneRef = useRef<Omit<Scene, 'now' | 'characterIndex'>>({
    state: null,
    result: null,
    screen: 'now',
    expectedReturnSeconds: null,
  });
  const result = ready?.result ?? null;
  const okResult = result && !('error' in result) ? result : null;
  sceneRef.current = {
    state: versionState,
    result: okResult,
    screen: save.status === 'broken' || (result && 'error' in result) ? 'other' : 'now',
    expectedReturnSeconds: a.expectedReturnSeconds,
  };
  const scene = useCallback((): Scene => {
    // M17 TR-12: the new places map onto the Worker's existing screens; nothing new is sent.
    let characterIndex: number | null = null;
    let hash = '';
    try {
      hash = window.location.hash;
      const m = /^#([a-z]+)-(\d+)$/.exec(hash);
      if (m && m[1] !== 'system' && m[1] !== 'map') characterIndex = Number(m[2]);
    } catch {}
    const s = sceneRef.current;
    const focused = characterIndex !== null && s.result?.characters.some((c) => c.index === characterIndex);
    const systems = hash === '#systems' || hash.startsWith('#system-');
    return {
      ...s,
      characterIndex: focused ? characterIndex : null,
      screen:
        s.screen === 'now' && focused ? 'character' : s.screen === 'now' && systems ? 'account' : s.screen,
      now: Date.now(),
    };
  }, []);

  return (
    <SuggestionsProvider
      config={suggestionsConfig}
      uid={auth.status === 'signed-in' ? uid : null}
      signedOut={auth.status !== 'signed-in' && auth.status !== 'restoring'}
      proof={a.proof}
      scene={scene}
    >
      <AppBody a={a} serverBuild={serverBuild} />
    </SuggestionsProvider>
  );
}

function AppBody({ a, serverBuild }: { a: ActiveOn; serverBuild: number | null }) {
  const { auth, save, sync, online, lastSnapshotAt, lastGood, pasteError, historyNote, patch, uid } = a;
  const suggestions = useSuggestions();
  const ready = save.status === 'ready' ? save : null;
  const busy = save.status === 'parsing';

  // `flows.cant-read` Use last good: the last clean save with its advice, kept so the player can choose
  // it, labelled as such, when the newest one breaks. Never a silent swap.
  const lastReady = useRef<Ready | null>(null);
  if (ready?.result && !('error' in ready.result)) lastReady.current = ready;
  const [useLast, setUseLast] = useState(false);
  useEffect(() => {
    if (save.status !== 'broken') setUseLast(false);
  }, [save.status]);
  const shown: Ready | null = ready ?? (useLast && save.status === 'broken' ? lastReady.current : null);
  const result = shown?.result ?? null;
  const okResult = result && !('error' in result) ? (result as EngineResult) : null;

  // While the newest save can't be read, the header shows the last good one, tagged as such (FR-15).
  const headerSave: HeaderSave | null = ready
    ? { state: ready.state, source: ready.source, tag: 'current' }
    : lastGood
      ? { state: lastGood.state, source: lastGood.source, tag: 'last-good' }
      : null;

  // The preference namespace (TR-8): per signed-in account, or per pasted account by a hash of its
  // character names, computed and kept on this device only.
  const [namespace, setNamespace] = useState<string | null>(null);
  const pasteNames = ready?.source === 'paste' ? ready.state.characters.map((c) => c.name).join('\n') : null;
  useEffect(() => {
    let active = true;
    setNamespace(null);
    const next = uid
      ? preferencePrefix(uid)
      : pasteNames !== null
        ? shortHash(pasteNames).then((h) => `activeon:paste:${h}:`)
        : null;
    void next
      ?.then((ns) => active && setNamespace(ns))
      .catch(() => active && setNamespace('activeon:memory:'));
    return () => {
      active = false;
    };
  }, [uid, pasteNames]);

  // Waiting for the first save: the cloud-save hint after 30 s (§6).
  const [waitingLong, setWaitingLong] = useState(false);
  useEffect(() => {
    if (save.status !== 'waiting') return setWaitingLong(false);
    const t = setTimeout(() => setWaitingLong(true), 30_000);
    return () => clearTimeout(t);
  }, [save.status]);

  const [navSlot, setNavSlot] = useState<HTMLDivElement | null>(null);
  const [footer, setFooter] = useState<FooterInfo | null>(null);
  const renderChips = useCallback((_node: ReactNode) => {}, []);
  const onFooter = useCallback((info: FooterInfo) => setFooter(info), []);
  useEffect(() => {
    if (!shown) setFooter(null);
  }, [shown]);

  // ---- a pasted save kept across the "New version ready" reload ----
  const pastedText = useRef<string | null>(null);
  const paste = useCallback(
    (text: string) => {
      pastedText.current = text;
      a.paste(text);
    },
    [a],
  );
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const kept = takeKeptPaste();
    if (kept !== null) {
      pastedText.current = kept;
      a.paste(kept);
    }
  }, [a]);
  const updateCheck = useUpdateAvailable();
  const updateText = a.updated ? 'ActiveOn was updated. Reload to continue' : updateCheck.text;
  const [dropWarned, setDropWarned] = useState(false);
  const reload = useCallback(() => {
    const pasted = (ready?.source ?? shown?.source) === 'paste' ? pastedText.current : null;
    if (!keepPasteForReload(pasted) && !dropWarned) {
      setDropWarned(true);
      return;
    }
    window.location.reload();
  }, [ready, shown, dropWarned]);

  const suggestHref = useMemo(
    () =>
      suggestUrl('idea', {
        screen: 'now',
        character: null,
        stage: okResult ? okResult.stage.id : 'unknown',
        knowledge: buildInfo.knowledge,
        gameBuild: serverBuild,
        build: buildInfo,
      }),
    [okResult, serverBuild],
  );

  // ---- the header's overflow menu (G1) and Settings (G10) ----
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const noticeDot = useNoticeDot();
  const failed = footer?.failedChecks ?? 0;
  const closeThen = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };
  const openIssue = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');
  const versions = [
    `ActiveOn ${buildInfo.app}`,
    footer?.knowledge ?? `knowledge ${buildInfo.knowledge}`,
    shown ? `game build ${serverBuild ?? '?'}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const signedIn = auth.status === 'signed-in';
  const menu = (
    <Suspense fallback={<Loading />}>
      <HeaderMenu
        familyLevel={headerSave?.state.account.accountLevel ?? null}
        onSettings={closeThen(() => setSettingsOpen(true))}
        onSuggest={closeThen(() =>
          suggestions ? suggestions.open({ kind: 'suggest' }) : openIssue(suggestHref),
        )}
        onYourSuggestions={signedIn && suggestions ? closeThen(() => suggestions.openList()) : null}
        onConfusing={closeThen(() =>
          suggestions
            ? suggestions.open({ kind: 'suggest', type: 'confusing' })
            : openIssue(
                suggestUrl('confusing', {
                  screen: 'now',
                  character: null,
                  stage: okResult?.stage.id ?? 'unknown',
                  knowledge: buildInfo.knowledge,
                  gameBuild: serverBuild,
                  build: buildInfo,
                }),
              ),
        )}
        versions={versions}
        historyNote={historyNote}
        patchNote={patch?.newer && !patch.parserBehind ? PATCH_FOOTER_NOTE : null}
        failedChecks={
          failed > 0
            ? {
                text: FLOW_WORDS.failedChecks(failed),
                onReport: closeThen(() =>
                  suggestions ? suggestions.open({ kind: 'suggest', type: 'wrong' }) : openIssue(suggestHref),
                ),
              }
            : null
        }
        account={
          signedIn ? (
            <Suspense fallback={null}>
              <SignOutControl onSignOut={a.signOut} />
            </Suspense>
          ) : auth.status === 'signed-out' && shown ? (
            <Button tone="quiet" className="n-wide" onClick={closeThen(a.signIn)}>
              {HEADER_WORDS.signIn}
            </Button>
          ) : null
        }
      />
    </Suspense>
  );

  // Sign-in is out of the way (`flows.sign-in`): with no save it is the content; with a save showing,
  // a code the player asked for opens in a sheet, never above the advice.
  const signInAsContent = !shown && save.status !== 'broken';
  const codeInSheet =
    !signInAsContent && (auth.status === 'requesting-code' || auth.status === 'device-code');
  const signInNode = (
    <Suspense fallback={<Loading />}>
      <SignIn
        auth={auth}
        sync={sync}
        waitingForSave={save.status === 'waiting'}
        onSignIn={a.signIn}
        onCancel={a.cancelSignIn}
        onSignOut={a.signOut}
      />
    </Suspense>
  );

  const badge = previewBadge();
  return (
    <SettingsNamespace.Provider value={namespace}>
      <main className="app n-app">
        <Header
          save={headerSave}
          sync={sync}
          online={online}
          lastSnapshotAt={lastSnapshotAt}
          busy={busy && ready !== null}
          stage={okResult ? okResult.stage : null}
          preview={badge}
          update={
            updateText
              ? {
                  text: dropWarned ? HEADER_WORDS.newVersionDrops : HEADER_WORDS.newVersion,
                  onReload: reload,
                }
              : null
          }
          menu={menu}
          dot={noticeDot || failed > 0}
          menuOpen={menuOpen}
          onMenu={setMenuOpen}
        />
        {/* M17 FR-2: the place navigation sits right under the header (the shell fills it, FR-12). */}
        <div ref={setNavSlot} className="nav-slot" />

        {signInAsContent ? signInNode : null}
        <Sheet open={codeInSheet} title={FLOW_WORDS.signInTitle} onClose={a.cancelSignIn}>
          {codeInSheet ? signInNode : null}
        </Sheet>

        <ReadyToSend />

        {save.status === 'broken' && !useLast ? (
          <Suspense fallback={<Loading />}>
            <CantRead
              failure={save}
              lastGood={lastGood?.state ?? null}
              busy={busy}
              onPaste={paste}
              onUseLastGood={lastReady.current ? () => setUseLast(true) : null}
            />
          </Suspense>
        ) : null}
        {save.status === 'broken' && useLast && lastReady.current ? (
          <p className="n-oldbanner" role="status">
            <PixelArt name="now-glyph-stale" decorative />
            <LastGoodLine at={lastReady.current.state.account.lastCloudSave} />
          </p>
        ) : null}

        {save.status === 'waiting' ? <Waiting long={waitingLong} step={1} /> : null}
        {save.status === 'parsing' && !shown ? <Waiting long={false} step={2} /> : null}

        {shown && result && 'error' in result ? (
          <CantWorkOut message={result.error} state={shown.state} />
        ) : null}
        {shown && okResult ? (
          <AdviceBoundary state={shown.state} resetKey={okResult}>
            <Shell
              navSlot={navSlot}
              result={okResult}
              save={shown}
              namespace={namespace}
              expectedReturnSeconds={a.expectedReturnSeconds}
              setExpectedReturn={a.setExpectedReturn}
              updating={a.updating}
              connection={null}
              update={null}
              parserBehind={patch?.parserBehind ?? false}
              onReload={reload}
              renderChips={renderChips}
              onFooter={onFooter}
            />
          </AdviceBoundary>
        ) : null}

        {signInAsContent ? (
          <Suspense fallback={<Loading />}>
            <PasteSave busy={busy} error={pasteError} onPaste={paste} />
          </Suspense>
        ) : save.status !== 'broken' ? (
          <details className="n-paste-fold fallback" open={pasteError !== null}>
            <summary>{FLOW_WORDS.pasteOpen}</summary>
            <Suspense fallback={<Loading />}>
              <PasteSave busy={busy} error={pasteError} onPaste={paste} />
            </Suspense>
          </details>
        ) : null}

        {shown?.source === 'paste' && auth.status === 'signed-out' ? (
          <section className="n-slimbar" aria-label={HEADER_WORDS.signIn}>
            <span>{FLOW_WORDS.pastedBar}</span>
            <Button tone="quiet" onClick={a.signIn}>
              {HEADER_WORDS.signIn}
            </Button>
          </section>
        ) : null}

        <Suspense fallback={null}>
          <Footer
            persistent={footer ? footer.persistent : true}
            signedIn={signedIn}
            onSuggest={() => (suggestions ? suggestions.open({ kind: 'suggest' }) : openIssue(suggestHref))}
            onYourSuggestions={signedIn && suggestions ? () => suggestions.openList() : null}
            onClear={async (options) => {
              forgetWhatsNew();
              await a.clearMyData(options);
            }}
          />
        </Suspense>
        <Sheet open={settingsOpen} title={HEADER_WORDS.settings} onClose={() => setSettingsOpen(false)}>
          <Suspense fallback={<Loading />}>
            <SettingsBody namespace={namespace} persistent={footer ? footer.persistent : true} />
          </Suspense>
        </Sheet>
      </main>
    </SettingsNamespace.Provider>
  );
}

/** "Advice from your last good save at 15:00 (3h old). The newest one can't be read." */
function LastGoodLine({ at }: { at: number | null }) {
  const now = useNow(60_000);
  if (at === null) return null;
  return (
    <>{FLOW_WORDS.usingLastGood(clockAt(at, localOffsetMinutes(at)), ago(at, now).replace(/ ago$/, ''))}</>
  );
}
