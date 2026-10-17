// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// No clock here: only the ticking pieces (save age, countdowns) re-render every second (M10 TR-5).
import { PATCH_BANNER, PATCH_FOOTER_NOTE } from '@idleon-forge/sync';
import { CantRead } from './components/CantRead';
import { CharacterList } from './components/CharacterList';
import { ClearMyData } from './components/ClearMyData';
import { Header, type HeaderSave } from './components/Header';
import { PasteSave } from './components/PasteSave';
import { SignIn } from './components/SignIn';
import { useActiveOn } from './use-activeon';

export function App() {
  const {
    auth,
    save,
    sync,
    online,
    lastSnapshotAt,
    lastGood,
    pasteError,
    historyNote,
    patch,
    signIn,
    cancelSignIn,
    signOut,
    clearMyData,
    paste,
  } = useActiveOn();
  const ready = save.status === 'ready' ? save : null;
  const busy = save.status === 'parsing';
  const versionState = ready?.state ?? lastGood?.state ?? null;
  const serverBuild = patch?.build?.serverBuild ?? versionState?.account.gameVersion.serverBuild ?? null;
  // While the newest save can't be read, the header shows the last good one, tagged as such (FR-15).
  const headerSave: HeaderSave | null = ready
    ? { state: ready.state, source: ready.source, tag: 'current' }
    : lastGood
      ? { state: lastGood.state, source: lastGood.source, tag: 'last-good' }
      : null;

  return (
    <main className="app">
      <Header save={headerSave} sync={sync} online={online} lastSnapshotAt={lastSnapshotAt} />

      <SignIn
        auth={auth}
        sync={sync}
        waitingForSave={save.status === 'waiting'}
        onSignIn={signIn}
        onCancel={cancelSignIn}
        onSignOut={signOut}
      />

      {patch?.parserBehind ? (
        <p className="patch-banner" role="status">
          {PATCH_BANNER}
          {patch.build?.serverBuild != null ? ` (game build ${patch.build.serverBuild})` : ''} Advice may be
          off.
        </p>
      ) : null}

      {save.status === 'broken' ? (
        <CantRead failure={save} lastGood={lastGood?.state ?? null} busy={busy} onPaste={paste} />
      ) : null}

      {busy ? (
        <p className="muted" aria-live="polite">
          Reading your save…
        </p>
      ) : null}

      {ready ? <CharacterList state={ready.state} /> : null}

      {save.status !== 'broken' ? (
        <details
          className="card fallback"
          open={(auth.status === 'unconfigured' && !ready) || pasteError !== null}
        >
          <summary>Paste your save instead</summary>
          <PasteSave busy={busy} error={pasteError} onPaste={paste} />
        </details>
      ) : null}

      <footer className="foot muted small">
        {versionState ? (
          <p className="foot-line">
            {`game build ${serverBuild ?? '?'} · parser targets ${versionState.account.gameVersion.parserTarget}`}
            {patch?.newer && !patch.parserBehind ? ` · ${PATCH_FOOTER_NOTE}` : ''}
          </p>
        ) : null}
        {historyNote ? <p className="foot-line">{historyNote}</p> : null}
        {auth.status === 'signed-in' ? (
          <div className="foot-line">
            <ClearMyData onClear={clearMyData} />
          </div>
        ) : null}
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
