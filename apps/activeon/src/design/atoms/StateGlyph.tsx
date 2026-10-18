// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-F5 (moved verbatim from gear/GearTab.tsx in Phase F): a gear state's 12 px glyph, used by the
// Gear tab (C) and the Gear and Armor Smithy pages (S). gear/GearTab.tsx re-exports it until Integration.
import './legacy.css';

/** The state's glyph: never colour alone (the word sits next to it). */
export function StateGlyph({ state }: { state: string }) {
  if (state === 'ok')
    return (
      <svg className="gg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M2 6.5 5 9.5 10 3" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  if (state === 'behind')
    return (
      <svg className="gg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M6 10 1.5 3h9z" fill="currentColor" />
      </svg>
    );
  if (state === 'held-upgrade')
    return (
      <svg className="gg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M6 1.5 10.5 7H8v3.5H4V7H1.5z" fill="currentColor" />
      </svg>
    );
  if (state === 'empty')
    return (
      <svg className="gg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <rect
          x="1.5"
          y="1.5"
          width="9"
          height="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 1.5"
        />
      </svg>
    );
  return (
    <svg className="gg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <text x="6" y="10" textAnchor="middle" fontSize="10" fill="currentColor">
        ?
      </text>
    </svg>
  );
}
