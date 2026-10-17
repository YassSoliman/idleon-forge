// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The app shell: picks the screen state (M10 TR-11: signed-out → waiting → parsing → broken |
// engine-error | ok) and renders the Now screen inside it. No clock here: only the ticking pieces
// (save age, countdowns) re-render every second (M10 TR-5).
import { PATCH_FOOTER_NOTE, preferencePrefix } from '@idleon-forge/sync';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { CantRead } from './components/CantRead';
import { ClearMyData } from './components/ClearMyData';
import { Header, type HeaderSave } from './components/Header';
import { PasteSave } from './components/PasteSave';
import { SignIn } from './components/SignIn';
import { AdviceBoundary, CantWorkOut } from './now/CantWorkOut';
import { Waiting } from './now/Chrome';
import { NowScreen } from './now/NowScreen';
import { shortHash } from './now/prefs-store';
import { buildInfo, forgetWhatsNew, previewBadge, useUpdateAvailable } from './now/release';
import { suggestUrl } from './now/report';
import { useActiveOn } from './use-activeon';

const clock = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

type FooterInfo = {
  app: string;
  knowledge: string;
  game: string;
  parserTarget: string;
  failedChecks: number;
  persistent: boolean;
};

export function App() {
  const a = useActiveOn();
  const { auth, save, sync, online, lastSnapshotAt, lastGood, pasteError, historyNote, patch, uid } = a;
  const ready = save.status === 'ready' ? save : null;
  const busy = save.status === 'parsing';
  const versionState = ready?.state ?? lastGood?.state ?? null;
  const serverBuild = patch?.build?.serverBuild ?? versionState?.account.gameVersion.serverBuild ?? null;
  const update = useUpdateAvailable();
  const updateText = a.updated ? 'ActiveOn was updated. Reload to continue' : update.text;
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

  const [chips, setChips] = useState<ReactNode>(null);
  const [footer, setFooter] = useState<FooterInfo | null>(null);
  const renderChips = useCallback((node: ReactNode) => setChips(node), []);
  const onFooter = useCallback((info: FooterInfo) => setFooter(info), []);
  useEffect(() => {
    if (!ready) {
      setChips(null);
      setFooter(null);
    }
  }, [ready]);

  const savedAt = versionState?.account.lastCloudSave ?? null;
  const connection = !online
    ? `Offline: showing your last save from ${savedAt ? clock(savedAt) : 'earlier'}.`
    : sync.status === 'reconnecting'
      ? `Can't reach your save right now: showing your last save from ${savedAt ? clock(savedAt) : 'earlier'}.`
      : null;

  const suggestHref = useMemo(
    () =>
      suggestUrl('idea', {
        screen: 'now',
        character: null,
        stage: ready?.result && !('error' in ready.result) ? ready.result.stage.id : 'unknown',
        knowledge: buildInfo.knowledge,
        gameBuild: serverBuild,
        build: buildInfo,
      }),
    [ready, serverBuild],
  );

  const result = ready?.result ?? null;
  const badge = previewBadge();

  return (
    <main className="app">
      {badge ? <p className="preview-badge">{badge}</p> : null}
      <Header
        save={headerSave}
        sync={sync}
        online={online}
        lastSnapshotAt={lastSnapshotAt}
        chips={result && !('error' in result) ? chips : null}
        suggestHref={suggestHref}
        busy={busy && ready !== null}
      />

      <SignIn
        auth={auth}
        sync={sync}
        waitingForSave={save.status === 'waiting'}
        onSignIn={a.signIn}
        onCancel={a.cancelSignIn}
        onSignOut={a.signOut}
      />

      {updateText && !ready ? (
        <div className="banner update" role="status">
          <p>{updateText}</p>
          <button type="button" className="small-btn" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      ) : null}

      {save.status === 'broken' ? (
        <CantRead failure={save} lastGood={lastGood?.state ?? null} busy={busy} onPaste={a.paste} />
      ) : null}

      {save.status === 'waiting' ? <Waiting long={waitingLong} /> : null}
      {save.status === 'parsing' && !ready ? <Waiting long={false} /> : null}

      {ready && result && 'error' in result ? (
        <CantWorkOut message={result.error} state={ready.state} />
      ) : null}
      {ready && result && !('error' in result) ? (
        <AdviceBoundary state={ready.state} resetKey={result}>
          <NowScreen
            result={result}
            save={ready}
            namespace={namespace}
            expectedReturnSeconds={a.expectedReturnSeconds}
            setExpectedReturn={a.setExpectedReturn}
            updating={a.updating}
            connection={connection}
            update={updateText}
            parserBehind={patch?.parserBehind ?? false}
            onReload={() => window.location.reload()}
            renderChips={renderChips}
            onFooter={onFooter}
          />
        </AdviceBoundary>
      ) : null}

      {save.status !== 'broken' ? (
        <details
          className="card fallback"
          open={(auth.status === 'unconfigured' && !ready) || pasteError !== null}
        >
          <summary>Paste your save instead</summary>
          <PasteSave busy={busy} error={pasteError} onPaste={a.paste} />
        </details>
      ) : null}

      <footer className="foot muted small">
        <p className="foot-line">
          {[
            `ActiveOn ${buildInfo.app}`,
            footer?.knowledge ?? `knowledge ${buildInfo.knowledge}`,
            versionState ? `game build ${serverBuild ?? '?'}` : null,
            versionState ? `parser targets ${versionState.account.gameVersion.parserTarget}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          {patch?.newer && !patch.parserBehind ? ` · ${PATCH_FOOTER_NOTE}` : ''}
        </p>
        {footer && footer.failedChecks > 0 ? (
          <p className="foot-line">
            {footer.failedChecks} check{footer.failedChecks === 1 ? '' : 's'} failed ·{' '}
            <a href={suggestHref} target="_blank" rel="noopener noreferrer">
              Report
            </a>
          </p>
        ) : null}
        {footer && !footer.persistent ? (
          <p className="foot-line">Can't remember your choices in this browser.</p>
        ) : null}
        {historyNote ? <p className="foot-line">{historyNote}</p> : null}
        {auth.status === 'signed-in' ? (
          <div className="foot-line">
            <ClearMyData
              onClear={async (options) => {
                forgetWhatsNew();
                await a.clearMyData(options);
              }}
            />
          </div>
        ) : null}
        <p className="foot-line">
          <a href={suggestHref} target="_blank" rel="noopener noreferrer">
            Suggest something
          </a>
        </p>
        Read-only. Save parsing by{' '}
        <a href="https://github.com/Morta1/IdleonToolbox" target="_blank" rel="noopener noreferrer">
          IdleOn Toolbox
        </a>{' '}
        (GPL-3.0).{' '}
        <a href="https://github.com/YassSoliman/idleon-forge" target="_blank" rel="noopener noreferrer">
          Source
        </a>
        . Not affiliated with LavaFlame2.
      </footer>
    </main>
  );
}
