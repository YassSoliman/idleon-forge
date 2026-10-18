// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The screen around the advice: Expected Return chips (FR-27, a radio group per TR-14), banners in
// TR-11 order, the progress bar (FR-9), What's new (FR-37) and the Preview badge (M12 FR-11).

import type { Banner, NowView } from '@idleon-forge/engine/now';
import { useId } from 'react';
import { formatRoute } from '../shell/route';
import { COMMITS_URL, type WhatsNewView } from './release';

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
    <fieldset className="er">
      <legend className="small muted">Back in about</legend>
      <div className="er-chips">
        {chips.map((c) => (
          <label key={c.seconds} className={`chip${c.pressed ? ' on' : ''}`}>
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={c.seconds}
              checked={c.pressed}
              onChange={() => onPick(c.seconds)}
            />
            {c.label}
          </label>
        ))}
      </div>
      <span className="small muted" role="status">
        {updating ? 'updating…' : ''}
      </span>
    </fieldset>
  );
}

export function Banners({
  banners,
  onReload,
  firstFill = null,
  onTimeline,
}: {
  banners: Banner[];
  onReload(): void;
  /** M17 FR-32: the All set banner's first-fill text, linked to the Timeline (Phase 2). */
  firstFill?: string | null;
  onTimeline?: () => void;
}) {
  if (banners.length === 0) return null;
  const linked = (b: Banner) =>
    b.kind === 'all-set' && firstFill && onTimeline && b.text.endsWith(firstFill) ? firstFill : null;
  return (
    <div className="banners">
      {banners.map((b, i) => (
        // At 320 px, more than two banners collapse past the second to one line each (TR-11).
        <div
          key={b.kind}
          className={`banner ${b.kind}${i >= 2 ? ' compact' : ''}`}
          role={b.kind === 'all-set' ? undefined : 'status'}
        >
          {linked(b) ? (
            <p>
              {b.text.slice(0, b.text.length - (firstFill ?? '').length)}
              <a
                href={formatRoute({ place: 'timeline' })}
                onClick={(e) => {
                  e.preventDefault();
                  onTimeline?.();
                }}
              >
                {firstFill}
              </a>
            </p>
          ) : (
            <p>{b.text}</p>
          )}
          {b.kind === 'update' ? (
            <button type="button" className="small-btn" onClick={onReload}>
              Reload
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

const ACCOUNT_PART = /(fix \d+ in Account)/;

export function ProgressBar({
  progress,
  onAccount,
}: {
  progress: NowView['progress'];
  /** Scrolls to the Account's "Fix before you leave" (R5 QA P2-2). */
  onAccount?: () => void;
}) {
  if (progress.hidden || progress.total === 0) return null;
  const parts = progress.label.split(ACCOUNT_PART);
  return (
    <div className="progress">
      <ol className="segments" aria-label="Verdicts in Visit Order">
        {progress.segments.map((s) => (
          <li key={s.index} className={`seg ${s.kind}`} aria-label={s.label} />
        ))}
      </ol>
      <p className="progress-label">
        {parts.map((part, i) =>
          onAccount && ACCOUNT_PART.test(part) ? (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: the label's parts are fixed in order
              key={i}
              type="button"
              className="link-btn"
              onClick={onAccount}
            >
              {part}
            </button>
          ) : (
            part
          ),
        )}
      </p>
    </div>
  );
}

export function WhatsNewCard({ view, onDismiss }: { view: WhatsNewView; onDismiss(): void }) {
  return (
    <section className="whats-new card" aria-labelledby="wn-h">
      <h2 id="wn-h" className="sub-h">
        What's new since your last visit
      </h2>
      {view.groups.map((g) => (
        <div key={g.section}>
          <h3 className="section-h">{g.title}</h3>
          <ul className="small">
            {g.entries.map((e) => (
              <li key={e.id}>{e.text}</li>
            ))}
          </ul>
        </div>
      ))}
      {view.more > 0 ? (
        <p className="small">
          and {view.more} more:{' '}
          <a href={COMMITS_URL} target="_blank" rel="noopener noreferrer">
            every change
          </a>
        </p>
      ) : null}
      <button type="button" className="small-btn" onClick={onDismiss}>
        Got it
      </button>
    </section>
  );
}

export function PreviewBadge({ text }: { text: string | null }) {
  return text ? <p className="preview-badge">{text}</p> : null;
}

/** Waiting for the first save: skeleton rows, then the cloud-save hint after 30 s (§6). */
export function Waiting({ long }: { long: boolean }) {
  return (
    <section aria-label="Waiting for your save" className="waiting">
      <ol className="roster" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="r skeleton" />
        ))}
      </ol>
      <p className="small muted" role="status">
        {long ? 'Open the game, or switch character, to trigger a cloud save.' : 'Waiting for your save…'}
      </p>
    </section>
  );
}
