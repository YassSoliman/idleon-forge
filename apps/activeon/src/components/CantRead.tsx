// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import type { AccountState } from '@idleon-forge/account-state';
import type { SaveState } from '../use-activeon';
import { PasteSave } from './PasteSave';
import { Ago } from './Ticking';

interface Props {
  failure: Extract<SaveState, { status: 'broken' }>;
  lastGood: AccountState | null;
  busy: boolean;
  onPaste(text: string): void;
}

const EXPLAIN: Record<Props['failure']['kind'], string> = {
  input: "That doesn't look like an IdleOn save.",
  empty: 'The parser could not make sense of this save. A game update may have changed it.',
  shape: 'The parser changed shape under us. This needs a fix on our side.',
  crash: 'Something went wrong while reading the save.',
  timeout: 'Reading the save took too long. The next save will try again.',
};

/** Shown instead of any characters when the latest save failed to parse (never advise from it). */
export function CantRead({ failure, lastGood, busy, onPaste }: Props) {
  const lastSave = lastGood?.account.lastCloudSave ?? null;
  return (
    <section className="broken" role="alert" aria-label="Can't read your save">
      <b className="broken-title">Can't read your save right now</b>
      <p>{EXPLAIN[failure.kind]}</p>
      <p className="mono detail">{failure.message}</p>
      {lastSave !== null ? (
        <p className="small">
          Last good save: <Ago at={lastSave} /> ago ({new Date(lastSave).toLocaleTimeString()}).
        </p>
      ) : null}
      <PasteSave busy={busy} error={null} onPaste={onPaste} />
    </section>
  );
}
