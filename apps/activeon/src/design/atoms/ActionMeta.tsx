// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-F5 (moved verbatim from now/parts.tsx in Phase F): a Next Action's meta row (its Source line
// and the "sources disagree" badge). The old exports in now/parts.tsx re-export these until Integration.
import type { NextActionView } from '@idleon-forge/engine/now';
import { SourceLabel } from './SourceLabel';

/** "sources disagree" with both sides behind an expander (FR-20). */
export function ContestedBadge({ contested }: { contested: NonNullable<NextActionView['contested']> }) {
  return (
    <details className="contested">
      <summary>sources disagree</summary>
      <ul>
        {contested.sides.map((s) => (
          <li key={s.text}>
            {s.text}{' '}
            {s.sources.map((src) => (
              <SourceLabel key={`${src.href}${src.text}${src.credit}`} source={src} more={false} />
            ))}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** The meta row under a Next Action: its Source, then "sources disagree" when contested. */
export function ActionMeta({ action }: { action: Pick<NextActionView, 'source' | 'contested'> }) {
  return (
    <div className="na-meta">
      <SourceLabel source={action.source} />
      {action.contested ? <ContestedBadge contested={action.contested} /> : null}
    </div>
  );
}
