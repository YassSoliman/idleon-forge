// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The app shell: picks the screen state (M10 TR-11: signed-out → waiting → parsing → broken |
// engine-error | ok) and renders the Now screen inside it. No clock here: only the ticking pieces
// (save age, countdowns) re-render every second (M10 TR-5).
//
// M21 (area N): the one-line header with its overflow menu (G1) and Settings (G10), sign-in out of the
// way (`flows.sign-in`), the walking blob while waiting, the gremlin with a labelled "use your last good
// save", the fallback Roster. A newer build shows as the header's quiet "New version ready · Reload"
// line; a pasted save is kept across that reload (this tab only).
// M24 (the UX rework, rule 8): the footer is one line; paste, sign-in, Settings and Clear my data live in
// the ••• menu; first run is its own screen (sign in or paste) before any save.

import { FLOW_WORDS, FOOTER_WORDS, HEADER_WORDS } from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import { PATCH_FOOTER_NOTE, preferencePrefix } from '@idleon-forge/sync';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Footer } from './components/Footer';
import { Header, type HeaderSave } from './components/Header';
import type { MenuSaveKind } from './components/HeaderMenu';
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
import { PageSourcesSlot } from './shell/page-sources';
import { Shell } from './shell/Shell';
import { readSuggestionsConfig } from './suggestions/config';
import type { Scene } from './suggestions/context';
import { ReadyToSend, SuggestionsProvider, useSuggestions } from './suggestions/SuggestionsProvider';
import { type ActiveOn, keepPasteForReload, type SaveState, useActiveOn } from './use-activeon';
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
// Clear my data lives in the ••• menu (M24): it loads with the menu, never on first load.
const ClearMyData = lazyPart(
  () => import('./components/ClearMyData'),
  (m) => m.ClearMyData,
);
// First run (M24): only before any save, so a returning player never downloads it.
const FirstRun = lazyPart(
  () => import('./components/FirstRun'),
  (m) => m.FirstRun,
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

// The kept paste lives with the parser now (R11 QA); re-exported for the tests and the reload chip.
export { keepPasteForReload, takeKeptPaste } from './use-activeon';

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
  const [sourcesSlot, setSourcesSlot] = useState<HTMLSpanElement | null>(null);
  const [footer, setFooter] = useState<FooterInfo | null>(null);
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
  // R11 QA: the hook parses a kept paste itself once its parser exists (this child's effects run before
  // the hook's, so restoring here found no parser and dropped the save); a later reload keeps it again.
  if (pastedText.current === null && a.restoredPaste !== null) pastedText.current = a.restoredPaste;
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

  // ---- the ••• menu (M24 Menu boards; G1, G10): your save, Look, Tell us, your data, links ----
  const [menuOpen, setMenuOpen] = useState(false);
  const noticeDot = useNoticeDot();
  const failed = footer?.failedChecks ?? 0;
  const closeThen = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };
  const openIssue = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');
  const gameVersion = footer?.parserTarget.replace(/^reads game /, '') ?? null;
  const versions = [
    shown && gameVersion ? `game ${gameVersion}` : null,
    `ActiveOn ${buildInfo.app}`,
    footer?.knowledge ?? `knowledge ${buildInfo.knowledge}`,
    shown ? `game build ${serverBuild ?? '?'}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const signedIn = auth.status === 'signed-in';
  const saveKind: MenuSaveKind = signedIn ? 'live' : shown?.source === 'paste' ? 'paste' : 'none';
  // Before any save the first-run screen is the paste box; afterwards it lives here (rule 8).
  const pasteHere = shown !== null || save.status === 'broken';
  const menu = (
    <Suspense fallback={<Loading />}>
      <HeaderMenu
        familyLevel={headerSave?.state.account.accountLevel ?? null}
        save={{
          kind: saveKind,
          action: signedIn ? (
            <Suspense fallback={null}>
              <SignOutControl onSignOut={a.signOut} />
            </Suspense>
          ) : auth.status === 'signed-out' && shown ? (
            <Button tone="ghost" onClick={closeThen(a.signIn)}>
              {HEADER_WORDS.signIn}
            </Button>
          ) : null,
        }}
        paste={
          pasteHere ? (
            <Suspense fallback={<Loading />}>
              <PasteSave busy={busy} error={pasteError} onPaste={paste} plain />
            </Suspense>
          ) : null
        }
        settings={
          <Suspense fallback={<Loading />}>
            <SettingsBody namespace={namespace} persistent={footer ? footer.persistent : true} />
          </Suspense>
        }
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
        clear={
          signedIn ? (
            <Suspense fallback={null}>
              <ClearMyData
                onClear={async (options) => {
                  forgetWhatsNew();
                  await a.clearMyData(options);
                }}
              />
            </Suspense>
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
  // First run (M24 FirstRun board): no save yet and not signed in, waiting or parsing a first paste.
  const firstRun = signInAsContent && auth.status !== 'signed-in' && save.status !== 'parsing';
  const credit = firstRun || !shown ? FOOTER_WORDS.firstRun : FOOTER_WORDS.credit(gameVersion);
  return (
    <SettingsNamespace.Provider value={namespace}>
      <PageSourcesSlot.Provider value={sourcesSlot}>
        <main className="app n-app">
          <Header
            save={headerSave}
            sync={sync}
            online={online}
            lastSnapshotAt={lastSnapshotAt}
            busy={busy && ready !== null}
            stage={okResult ? okResult.stage : null}
            staleAfterSeconds={okResult ? okResult.expectedReturn.usedSeconds : null}
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
            navRef={setNavSlot}
          />

          {firstRun ? (
            <Suspense fallback={<Loading />}>
              <FirstRun
                signedOut={auth.status === 'signed-out'}
                onSignIn={a.signIn}
                signIn={auth.status === 'signed-out' ? null : signInNode}
                error={auth.status === 'signed-out' ? auth.error : null}
                paste={
                  <Suspense fallback={<Loading />}>
                    <PasteSave busy={busy} error={pasteError} onPaste={paste} plain />
                  </Suspense>
                }
              />
            </Suspense>
          ) : signInAsContent ? (
            signInNode
          ) : null}
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
                onFooter={onFooter}
              />
            </AdviceBoundary>
          ) : null}

          <Footer
            credit={credit}
            slotRef={setSourcesSlot}
            onSuggest={() => (suggestions ? suggestions.open({ kind: 'suggest' }) : openIssue(suggestHref))}
          />
        </main>
      </PageSourcesSlot.Provider>
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
