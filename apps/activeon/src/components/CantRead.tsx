// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// "Can't read your save" (M1 FR-15; M21 `flows.cant-read` Use last good, with the gremlin, Field
// Guide's one mascot bust on an error state). Never advice from a broken parse (AGENTS.md): the last good
// save is an explicit, labelled choice ("Use your last good save (from 09:12)"), never a silent swap.
import type { AccountState } from '@idleon-forge/account-state';
import { SETUP_WORDS as W } from '@idleon-forge/engine/now';
import { useState } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { Button } from '../design/atoms/Button';
import { ago, clockAt, localOffsetMinutes } from '../design/format';
import type { SaveState } from '../use-activeon';
import { useNow } from '../use-now';
import { PasteSave } from './PasteSave';

interface Props {
  failure: Extract<SaveState, { status: 'broken' }>;
  lastGood: AccountState | null;
  busy: boolean;
  onPaste(text: string): void;
  /** Shows the advice from the last good save, labelled as such; null when there is none to show. */
  onUseLastGood?: (() => void) | null;
}

const EXPLAIN: Record<Props['failure']['kind'], string> = {
  input: "That doesn't look like an IdleOn save.",
  empty: 'The parser could not make sense of this save. A game update may have changed it.',
  shape: 'The parser changed shape under us. This needs a fix on our side.',
  crash: 'Something went wrong while reading the save.',
  timeout: 'Reading the save took too long. The next save will try again.',
  updated: 'ActiveOn was updated. Reload to continue.',
};

/** Shown instead of any characters when the latest save failed to parse (never advise from it). */
export function CantRead({ failure, lastGood, busy, onPaste, onUseLastGood = null }: Props) {
  const now = useNow(60_000);
  const lastSave = lastGood?.account.lastCloudSave ?? null;
  // With no last good save to offer, pasting is the way out: open it at once.
  const [paste, setPaste] = useState(() => lastSave === null || !onUseLastGood);
  // M24 States board: the one frame on the screen, coral (losing value now: no advice until it reads).
  return (
    <section className="broken n-cantread a-frame a-frame--pad" role="alert" aria-label={W.cantRead}>
      <div className="n-cantread__head">
        <PixelArt name="flows-gremlin" scale={2} decorative />
        <div className="n-cantread__words">
          <h2 className="a-h1 n-cantread__title broken-title">Can't read your save right now</h2>
          <p className="n-cantread__why">{EXPLAIN[failure.kind]}</p>
        </div>
      </div>
      {lastSave !== null && onUseLastGood ? (
        <>
          <p>{W.cantReadLine}</p>
          <Button tone="primary" className="n-wide" onClick={onUseLastGood}>
            {W.lastGoodButton(clockAt(lastSave, localOffsetMinutes(lastSave)))}
          </Button>
          <p className="n-cantread__note">{W.lastGoodNote(ago(lastSave, now).replace(/ ago$/, ''))}</p>
        </>
      ) : null}
      {paste ? (
        <PasteSave busy={busy} error={null} onPaste={onPaste} plain />
      ) : (
        <Button tone="ghost" className="n-wide" onClick={() => setPaste(true)}>
          {W.pasteInstead}
        </Button>
      )}
      <p className="mono n-cantread__detail detail">{failure.message}</p>
    </section>
  );
}
