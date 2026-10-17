// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { useId, useState } from 'react';
import type { AuthState, SignOutOptions, SyncState } from '../use-activeon';
import { Countdown } from './Ticking';

interface Props {
  auth: AuthState;
  sync: SyncState;
  waitingForSave: boolean;
  onSignIn(): void;
  onCancel(): void;
  onSignOut(options: SignOutOptions): void;
}

export const WRONG_ACCOUNT =
  'No characters found for this account. Is this the Google account you play with?';

/** Sign out, after a confirmation with "Also clear my data on this browser", unchecked (FR-6, D4). */
function SignOutControl({
  onSignOut,
  label = 'Sign out',
}: {
  onSignOut: Props['onSignOut'];
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [clearData, setClearData] = useState(false);
  const id = useId();
  if (!confirming) {
    return (
      <button type="button" className="ghost" onClick={() => setConfirming(true)}>
        {label}
      </button>
    );
  }
  return (
    <fieldset className="confirm">
      <legend>Sign out of ActiveOn?</legend>
      <label htmlFor={id} className="small">
        <input id={id} type="checkbox" checked={clearData} onChange={(e) => setClearData(e.target.checked)} />{' '}
        Also clear my data on this browser
      </label>
      <div className="confirm-row">
        <button type="button" className="primary" onClick={() => onSignOut({ clearData })}>
          Sign out
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setConfirming(false);
            setClearData(false);
          }}
        >
          Cancel
        </button>
      </div>
    </fieldset>
  );
}

export function SignIn({ auth, sync, waitingForSave, onSignIn, onCancel, onSignOut }: Props) {
  const [copied, setCopied] = useState(false);

  switch (auth.status) {
    case 'unconfigured':
      return (
        <section className="card signin" aria-label="Sign in">
          <p>
            <b>Live sign-in isn't set up in this build.</b>
          </p>
          <p className="muted small">
            You can still paste your save below. To enable sign-in locally, fill in{' '}
            <code>apps/activeon/.env.local</code> (see <code>docs/setup/live-sign-in.md</code>).
          </p>
        </section>
      );
    case 'restoring':
      return (
        <section className="card signin" aria-label="Sign in" aria-busy="true">
          <p className="muted">Checking for a saved sign-in…</p>
        </section>
      );
    case 'signed-out':
      return (
        <section className="card signin" aria-label="Sign in">
          <button type="button" className="primary" onClick={onSignIn}>
            Sign in with Google
          </button>
          <p className="muted small">
            Read-only: ActiveOn never changes your save. Your login stays in this browser.
          </p>
          {auth.error ? (
            <p className="error" role="alert">
              {auth.error}
            </p>
          ) : null}
        </section>
      );
    case 'requesting-code':
      return (
        <section className="card signin" aria-label="Sign in" aria-busy="true">
          <p className="muted">Asking Google for a sign-in code…</p>
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        </section>
      );
    case 'device-code': {
      const { code } = auth;
      const copy = () => {
        navigator.clipboard
          ?.writeText(code.userCode)
          .then(() => setCopied(true))
          .catch(() => setCopied(false));
      };
      return (
        <section className="card signin device" aria-label="Sign in">
          <p>
            Open{' '}
            <a href={code.verificationUrl} target="_blank" rel="noopener noreferrer">
              {code.verificationUrl.replace(/^https?:\/\/(www\.)?/, '')}
            </a>{' '}
            and enter this code:
          </p>
          <div className="code-row">
            <output className="user-code" aria-label="Sign-in code">
              {code.userCode}
            </output>
            <button type="button" className="small-btn" onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="muted small">
            Waiting for you to approve on Google… (code expires in <Countdown until={code.expiresAt} />)
          </p>
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        </section>
      );
    }
    case 'signed-in':
      if (sync.status === 'wrong-account') {
        // FR-5: the message and the way out, together.
        return (
          <section className="card signin" aria-label="Signed in">
            <p className="error" role="alert">
              {WRONG_ACCOUNT}
            </p>
            <p className="small muted">Signed in{auth.user.email ? ` as ${auth.user.email}` : ''}.</p>
            <SignOutControl onSignOut={onSignOut} label="Sign out and use another account" />
          </section>
        );
      }
      return (
        <section className="card signin row" aria-label="Signed in">
          <p className="small">
            Signed in{auth.user.email ? ` as ${auth.user.email}` : ''}
            {sync.status === 'reconnecting' && waitingForSave ? (
              <span className="muted"> · reconnecting…</span>
            ) : waitingForSave ? (
              <span className="muted"> · waiting for your save…</span>
            ) : null}
          </p>
          <SignOutControl onSignOut={onSignOut} />
        </section>
      );
  }
}
