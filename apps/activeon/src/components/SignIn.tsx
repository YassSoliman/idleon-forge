// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Sign-in (M1 FR-5, FR-6; M21 `flows.sign-in` Out of the way + Code card): signed out with no save, the
// code card is the content; with a save showing it never sits above the advice: Sign in and Sign out
// live in the header's overflow menu (G1), and a pasted save gets one slim bar at the foot. The code
// card is the device-code state: two numbered steps, the code with Copy, and how long it works.
import { SETUP_WORDS, FLOW_WORDS as W } from '@idleon-forge/engine/now';
import { useId, useState } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { Button } from '../design/atoms/Button';
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
export function SignOutControl({
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
      <Button tone="quiet" onClick={() => setConfirming(true)}>
        {label}
      </Button>
    );
  }
  return (
    <fieldset className="confirm n-confirm">
      <legend>Sign out of ActiveOn?</legend>
      <label htmlFor={id} className="n-check">
        <input id={id} type="checkbox" checked={clearData} onChange={(e) => setClearData(e.target.checked)} />{' '}
        Also clear my data on this browser
      </label>
      <div className="confirm-row n-row-actions">
        <Button tone="primary" onClick={() => onSignOut({ clearData })}>
          Sign out
        </Button>
        <Button
          tone="plain"
          onClick={() => {
            setConfirming(false);
            setClearData(false);
          }}
        >
          {SETUP_WORDS.cancel}
        </Button>
      </div>
    </fieldset>
  );
}

function Card({ children, busy }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <section className="n-signin signin" aria-label="Sign in" aria-busy={busy || undefined}>
      <div className="n-signin__head">
        <PixelArt name="flows-padlock-locked" scale={2} decorative />
        <div>
          <h2 className="n-signin__title">{W.signInTitle}</h2>
          <p className="n-muted n-small">{SETUP_WORDS.signInLead}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function SignIn({ auth, sync, waitingForSave, onSignIn, onCancel, onSignOut }: Props) {
  const [copied, setCopied] = useState(false);

  switch (auth.status) {
    case 'unconfigured':
      return (
        <section className="n-slimbar n-slimbar--muted" aria-label="Sign in">
          <p>{SETUP_WORDS.unconfigured}</p>
        </section>
      );
    case 'restoring':
      return (
        <section className="n-signin signin" aria-label="Sign in" aria-busy="true">
          <p className="n-muted">{SETUP_WORDS.restoring}</p>
        </section>
      );
    case 'signed-out':
      return (
        <Card>
          <Button tone="primary" className="n-wide" onClick={onSignIn}>
            {SETUP_WORDS.signInWithGoogle}
          </Button>
          {auth.error ? (
            <p className="error n-error" role="alert">
              {auth.error}
            </p>
          ) : null}
        </Card>
      );
    case 'requesting-code':
      return (
        <Card busy>
          <p className="n-muted">{SETUP_WORDS.asking}</p>
          <Button tone="plain" onClick={onCancel}>
            {SETUP_WORDS.cancel}
          </Button>
        </Card>
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
        <Card>
          <ol className="n-steps">
            <li>
              {SETUP_WORDS.codeStep1}{' '}
              <a href={code.verificationUrl} target="_blank" rel="noopener noreferrer">
                {code.verificationUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </li>
            <li>{SETUP_WORDS.codeStep2}</li>
          </ol>
          <div className="code-row n-code-row">
            <output className="user-code n-code num" aria-label="Sign-in code">
              {code.userCode}
            </output>
            <Button tone="quiet" onClick={copy}>
              {copied ? SETUP_WORDS.copied : SETUP_WORDS.copy}
            </Button>
          </div>
          <p className="n-muted n-small">
            {SETUP_WORDS.codeWaiting}{' '}
            <b className="num">
              <Countdown until={code.expiresAt} />
            </b>{' '}
            {SETUP_WORDS.codeMore}
          </p>
          <Button tone="plain" onClick={onCancel}>
            {SETUP_WORDS.cancel}
          </Button>
        </Card>
      );
    }
    case 'signed-in':
      if (sync.status === 'wrong-account') {
        // FR-5: the message and the way out, together.
        return (
          <section className="n-signin signin" aria-label="Signed in">
            <p className="error n-alert n-alert--bad" role="alert">
              {WRONG_ACCOUNT}
            </p>
            <p className="n-small n-muted">{SETUP_WORDS.signedIn(auth.user.email)}.</p>
            <SignOutControl onSignOut={onSignOut} label={SETUP_WORDS.useAnother} />
          </section>
        );
      }
      // Signed in: it lives in the overflow menu; only the wait for the first save shows here.
      if (!waitingForSave) return null;
      return (
        <section className="n-signin signin" aria-label="Signed in">
          <div className="n-signin__head">
            <PixelArt name="flows-padlock-open" scale={2} decorative />
            <p>
              {sync.status === 'reconnecting'
                ? `${SETUP_WORDS.signedIn(auth.user.email)} · reconnecting…`
                : SETUP_WORDS.approved}
            </p>
          </div>
        </section>
      );
  }
}
