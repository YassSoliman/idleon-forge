// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The screen around the advice: the Expected Return chips (M10 FR-27; a radio group per TR-14, opened
// from the learned "Back in about 8h · Change" line, or inline when Settings says "Always ask") and the
// wait for the first save (`flows.loading` Blob walking, owner override). The banners, the progress bar
// and What's new moved to the counter, the toasts and the docked patch notes (M21, now/chrome/).
import { FLOW_WORDS, type NowView, RETURN_WORDS } from '@idleon-forge/engine/now';
import { useId } from 'react';
import { cx } from '../design/atoms/Button';
import { Loading } from '../design/atoms/States';

export function ExpectedReturnChips({
  chips,
  updating,
  onPick,
}: {
  chips: NowView['expectedReturn']['chips'];
  updating: boolean;
  onPick(seconds: number): void;
}) {
  const name = useId();
  // Native radios: the browser gives the group arrow keys and one Tab stop (TR-14 radio group).
  return (
    <fieldset className="er n-er">
      <legend className="n-er__legend">{RETURN_WORDS.lead}</legend>
      <div className="er-chips n-er__chips">
        {chips.map((c) => (
          <label key={c.seconds} className={cx('a-chip n-er__chip', c.pressed && 'a-chip--pressed on')}>
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={c.seconds}
              checked={c.pressed}
              onChange={() => onPick(c.seconds)}
            />
            <span className="num">{c.label}</span>
          </label>
        ))}
      </div>
      <span className="n-muted n-small" role="status">
        {updating ? 'updating…' : ''}
      </span>
    </fieldset>
  );
}

/** The skeleton of the Now layout under the walking blob, so nothing jumps when the answer lands. */
function NowSkeleton() {
  return (
    <div className="n-skel" aria-hidden="true">
      <span className="n-skel__verdict" />
      <ol className="roster">
        {[0, 1, 2].map((i) => (
          <li key={i} className="r skeleton n-skel__row" />
        ))}
      </ol>
    </div>
  );
}

/**
 * Waiting for the first save, and parsing it (`flows.loading` Blob walking): our guide blob walks a
 * 4-frame loop with its named step, over the skeleton; the Cloud Save hint after 30 s. Reduced motion
 * pins frame 1 (art.css).
 */
export function Waiting({ long, step = 1 }: { long: boolean; step?: number }) {
  return (
    <section aria-label={FLOW_WORDS.waitingLabel} className="waiting n-waiting">
      <Loading
        steps={[...FLOW_WORDS.waitingSteps]}
        current={step}
        skeleton={<NowSkeleton />}
        hint={FLOW_WORDS.cloudSaveHint}
        hintAfterMs={long ? 0 : 30_000}
      />
    </section>
  );
}
