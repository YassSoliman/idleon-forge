// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The stale-first banner (M21 FR-N1, DS-11). M24: the counter, its first fix and the Expected Return
// line moved into the Now place's hero and "Before you're back" (now/place/).
// Every word is the engine's (`COUNTER_WORDS`); times go through design/format.ts.
import { COUNTER_WORDS } from '@idleon-forge/engine/now';
import { PixelArt } from '../../design/art/PixelArt';
import { span } from '../../design/format';

/** M10 §6: a save older than the Expected Return is stale; the screen says so before anything is safe. */
export function staleAge(now: number, lastCloudSave: number | null, expectedReturnSeconds: number) {
  if (lastCloudSave === null) return null;
  const age = now - lastCloudSave;
  return age > expectedReturnSeconds * 1000 ? age : null;
}

/** `flows.stale` Stale-first banner: the age first, with its fix (Cloud Save). */
export function StaleBanner({
  ageMs,
  lastKnown,
  plain = false,
}: {
  ageMs: number;
  lastKnown: number | null;
  /** M24 QA P2: no tint while another block holds the screen's one frame (the World 4 welcome). */
  plain?: boolean;
}) {
  return (
    <section
      className={plain ? 'n-vb n-vb--stale n-vb--plain' : 'n-vb n-vb--stale'}
      role="status"
      aria-label={COUNTER_WORDS.stale(span(ageMs))}
    >
      <div className="n-vb__top">
        <PixelArt name="now-glyph-stale" scale={3} decorative />
        <p className="n-vb__title">{COUNTER_WORDS.stale(span(ageMs))}</p>
      </div>
      {lastKnown !== null ? <p className="n-vb__lastknown">{COUNTER_WORDS.lastKnown(lastKnown)}</p> : null}
    </section>
  );
}
