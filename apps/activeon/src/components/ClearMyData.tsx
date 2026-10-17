// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { useId, useState } from 'react';
import type { ClearOptions } from '../use-activeon';

/**
 * "Clear my data" (M1 FR-23): deletes this account's save history and preferences on this browser,
 * after a confirmation that also offers to sign out.
 */
export function ClearMyData({ onClear }: { onClear(options: ClearOptions): Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [alsoSignOut, setAlsoSignOut] = useState(false);
  const [done, setDone] = useState(false);
  const id = useId();
  if (!confirming) {
    return (
      <>
        <button type="button" className="link-btn" onClick={() => setConfirming(true)}>
          Clear my data
        </button>
        {done ? <span role="status"> Cleared.</span> : null}
      </>
    );
  }
  const close = () => {
    setConfirming(false);
    setAlsoSignOut(false);
  };
  return (
    <fieldset className="confirm">
      <legend>Clear your ActiveOn data on this browser?</legend>
      <p className="small">
        This deletes your save history and your choices here. Your game save is not touched.
      </p>
      <label htmlFor={id} className="small">
        <input
          id={id}
          type="checkbox"
          checked={alsoSignOut}
          onChange={(e) => setAlsoSignOut(e.target.checked)}
        />{' '}
        Also sign out
      </label>
      <div className="confirm-row">
        <button
          type="button"
          className="primary"
          onClick={() => {
            void onClear({ alsoSignOut }).then(() => setDone(true));
            close();
          }}
        >
          Clear my data
        </button>
        <button type="button" className="ghost" onClick={close}>
          Cancel
        </button>
      </div>
    </fieldset>
  );
}
