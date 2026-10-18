// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// "Clear my data" (M1 FR-23; M21 `flows.clear-my-data` What it clears + Hold to clear): it answers "will
// this touch my game?" before the button (Goes / Stays), then clears this account's save history and
// choices on this browser on a 1 s hold, with "Also sign out" offered (the checkbox row is 44 px).
import { SETUP_WORDS as W } from '@idleon-forge/engine/now';
import { useId, useState } from 'react';
import { Button } from '../design/atoms/Button';
import { HoldButton } from '../now/chrome/HoldButton';
import type { ClearOptions } from '../use-activeon';

export function ClearMyData({ onClear }: { onClear(options: ClearOptions): Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [alsoSignOut, setAlsoSignOut] = useState(false);
  const [done, setDone] = useState(false);
  const id = useId();
  const hint = useId();
  if (!confirming) {
    return (
      <>
        <button type="button" className="n-link-btn" onClick={() => setConfirming(true)}>
          {W.clearOpen}
        </button>
        {done ? <span role="status"> {W.cleared}</span> : null}
      </>
    );
  }
  const close = () => {
    setConfirming(false);
    setAlsoSignOut(false);
  };
  return (
    <fieldset className="confirm n-clear">
      <legend>{W.clearTitle}</legend>
      <div className="n-goes">
        <div>
          <p className="n-goes__k">{W.goes}</p>
          <ul>
            {W.goesList.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="n-goes__k">{W.stays}</p>
          <ul>
            {W.staysList.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <label htmlFor={id} className="n-check">
        <input
          id={id}
          type="checkbox"
          checked={alsoSignOut}
          onChange={(e) => setAlsoSignOut(e.target.checked)}
        />{' '}
        {W.alsoSignOut}
      </label>
      <div className="confirm-row n-row-actions">
        <HoldButton
          describedBy={hint}
          onConfirm={() => {
            void onClear({ alsoSignOut }).then(() => setDone(true));
            close();
          }}
        >
          {W.holdToClear}
        </HoldButton>
        <Button tone="plain" onClick={close}>
          {W.cancel}
        </Button>
      </div>
      <p id={hint} className="n-muted n-small">
        {W.holdHint}
      </p>
    </fieldset>
  );
}
