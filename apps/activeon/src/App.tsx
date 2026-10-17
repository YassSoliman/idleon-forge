// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// No clock here: only the ticking pieces (save age, countdowns) re-render every second (M10 TR-5).
import { CantRead } from './components/CantRead';
import { CharacterList } from './components/CharacterList';
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
    signIn,
    cancelSignIn,
    signOut,
    paste,
  } = useActiveOn();
  const ready = save.status === 'ready' ? save : null;
  const busy = save.status === 'parsing';
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
