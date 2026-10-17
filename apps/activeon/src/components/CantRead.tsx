// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import type { AccountState } from '@idleon-forge/account-state';
import { formatAge } from '../format';
import type { SaveState } from '../use-activeon';
import { PasteSave } from './PasteSave';

interface Props {
  failure: Extract<SaveState, { status: 'broken' }>;
  lastGood: AccountState | null;
  now: number;
  busy: boolean;
  onPaste(text: string): void;
}

const EXPLAIN: Record<Props['failure']['kind'], string> = {
  input: "That doesn't look like an IdleOn save.",
  empty: 'The parser could not make sense of this save. A game update may have changed it.',
  shape: 'The parser changed shape under us. This needs a fix on our side.',
  crash: 'Something went wrong while reading the save.',
  sync: 'Could not load your save from the game.',
};

/** Shown instead of any characters when the latest save failed to parse (never advise from it). */
export function CantRead({ failure, lastGood, now, busy, onPaste }: Props) {
  const lastSave = lastGood?.account.lastCloudSave ?? null;
  return (
    <section className="broken" role="alert" aria-label="Can't read your save">
      <b className="broken-title">Can't read your save right now</b>
      <p>{EXPLAIN[failure.kind]}</p>
      <p className="mono detail">{failure.message}</p>
      {lastSave !== null ? (
        <p className="small">
          Last good save: {formatAge((now - lastSave) / 1000)} ago ({new Date(lastSave).toLocaleTimeString()}
          ).
        </p>
      ) : null}
      <PasteSave busy={busy} onPaste={onPaste} />
    </section>
  );
}
