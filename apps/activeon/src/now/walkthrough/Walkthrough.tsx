// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 FR-22, FR-23: a Goal's Walkthrough as an expandable section under its card. Collapsed, one line
// ("Steps 1 of 14 · slowest: Distilled Water"); expanded, the ordered steps with progress, then the
// Requirement Tree as an indented list, then "other ways" (Active Play and not-yet-reachable Supplies).
// All text is React text (TR-13); indentation is a class per depth, never an inline style (CSP).
import type { GoalView } from '@idleon-forge/engine/now';
import './walkthrough.css';

type View = NonNullable<GoalView['walkthrough']>;

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export function Walkthrough({ view }: { view: View }) {
  return (
    <details className="walkthrough small">
      <summary>
        <span className="wt-label">Walkthrough</span> {view.collapsed}
      </summary>
      {view.caveats.length ? <p className="wt-caveat muted">{view.caveats.join(' · ')}</p> : null}
      <ol className="wt-steps">
        {view.steps.map((s) => (
          <li key={s.order} className={`wt-step wt-${s.when}`}>
            <span className="wt-when muted">{s.when === 'now' ? 'Now' : 'After'}</span>
            <span className="wt-text">{s.text}</span>
            {s.progress && s.progress.need > 0 ? (
              <span className="wt-progress muted">
                {' '}
                ({fmt(s.progress.held)} / {fmt(s.progress.need)})
              </span>
            ) : null}
            {s.why ? <span className="wt-why muted"> Why: {s.why}</span> : null}
          </li>
        ))}
      </ol>
      <details className="wt-tree">
        <summary>Everything it needs</summary>
        <ul>
          {view.tree.map((t, i) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: tree lines are positional and never reorder.
              key={i}
              className={`wt-d${Math.min(t.depth, 6)} ${t.done === true ? 'wt-done' : t.done === false ? 'wt-missing' : 'wt-unknown'}`}
            >
              <span className="wt-mark" aria-hidden="true">
                {t.done === true ? '✓' : t.done === false ? '•' : '?'}
              </span>{' '}
              <span className="sr-only">
                {t.done === true ? 'Done: ' : t.done === false ? 'Missing: ' : ''}
              </span>
              {t.text}
            </li>
          ))}
        </ul>
      </details>
      {view.otherWays.length ? (
        <details className="wt-other">
          <summary>Other ways ({view.otherWays.length})</summary>
          <ul>
            {view.otherWays.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </details>
  );
}
