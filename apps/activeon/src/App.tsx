// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { CantRead } from './components/CantRead';
import { CharacterList } from './components/CharacterList';
import { Header } from './components/Header';
import { PasteSave } from './components/PasteSave';
import { SignIn } from './components/SignIn';
import { useActiveOn } from './use-activeon';
import { useNow } from './use-now';

export function App() {
  const { auth, save, lastGood, signIn, cancelSignIn, signOut, paste } = useActiveOn();
  const now = useNow();
  const ready = save.status === 'ready' ? save : null;
  const busy = save.status === 'parsing';

  return (
    <main className="app">
      <Header state={ready?.state ?? null} source={ready?.source ?? null} now={now} />

      <SignIn
        auth={auth}
        now={now}
        waitingForSave={save.status === 'waiting'}
        onSignIn={signIn}
        onCancel={cancelSignIn}
        onSignOut={signOut}
      />

      {save.status === 'broken' ? (
        <CantRead failure={save} lastGood={lastGood?.state ?? null} now={now} busy={busy} onPaste={paste} />
      ) : null}

      {busy ? (
        <p className="muted" aria-live="polite">
          Reading your save…
        </p>
      ) : null}

      {ready ? <CharacterList state={ready.state} /> : null}

      {save.status !== 'broken' ? (
        <details className="card fallback" open={auth.status === 'unconfigured' && !ready}>
          <summary>Paste your save instead</summary>
          <PasteSave busy={busy} onPaste={paste} />
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
