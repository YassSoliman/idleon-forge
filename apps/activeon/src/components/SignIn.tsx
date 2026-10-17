// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { useState } from 'react';
import { formatAge } from '../format';
import type { AuthState } from '../use-activeon';

interface Props {
  auth: AuthState;
  now: number;
  waitingForSave: boolean;
  onSignIn(): void;
  onCancel(): void;
  onSignOut(): void;
}

export function SignIn({ auth, now, waitingForSave, onSignIn, onCancel, onSignOut }: Props) {
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
      const left = Math.max(0, (code.expiresAt - now) / 1000);
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
          <p className="muted small" aria-live="polite">
            Waiting for you to approve on Google… (code expires in {formatAge(left)})
          </p>
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        </section>
      );
    }
    case 'signed-in':
      return (
        <section className="card signin row" aria-label="Signed in">
          <p className="small">
            Signed in{auth.user.email ? ` as ${auth.user.email}` : ''}
            {waitingForSave ? <span className="muted"> · waiting for your save…</span> : null}
          </p>
          <button type="button" className="ghost" onClick={onSignOut}>
            Sign out
          </button>
        </section>
      );
  }
}
