// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Character page's identity strip and tab bar (M21 §9 "Extraction", FR-C5; area C). Lifted out of
// now/Focus.tsx in Phase F with no visual change: the hero (name, class · level · activity · map, and a
// slot for the caps Focus shows under it) and the tab bar (Now, Build, Gear, Cards, Signs, Skills). It is
// in the first load because Focus renders it (bundle-guards.ts allows this one file of characters/).
import type { FocusCard } from '@idleon-forge/engine/now';
import { forwardRef, type ReactNode } from 'react';
import { characterTabs, tabHref } from '../now/character-tabs';

export interface CharacterShellProps {
  card: Pick<FocusCard, 'index' | 'name' | 'classLabel' | 'level' | 'activity' | 'map'>;
  /** The tab on show; "now" is Focus's own content. */
  tab: string;
  /** Without it the tab bar is not drawn (Focus outside a Character page). */
  onTab?: ((id: string) => void) | null;
  /** Under the identity line (Focus puts the character's cap pills here). */
  children?: ReactNode;
}

/** The identity strip (the `<h2>` takes the forwarded ref) and, when `onTab` is given, the tab bar. */
export const CharacterShell = forwardRef<HTMLHeadingElement, CharacterShellProps>(function CharacterShell(
  { card, tab, onTab = null, children },
  headingRef,
) {
  return (
    <>
      <div className="hero">
        <h2 id="focus-h" ref={headingRef} tabIndex={-1}>
          {card.name}
        </h2>
        <p className="small muted">
          {[`${card.classLabel} · lv ${card.level}`, card.activity, card.map].filter(Boolean).join(' · ')}
        </p>
        {children}
      </div>

      {onTab ? (
        <nav aria-label="Character page" className="char-tabs">
          {characterTabs.map((t) => (
            <a
              key={t.id}
              href={tabHref(t.id, card.index)}
              className={`char-tab${t.id === tab ? ' on' : ''}`}
              aria-current={t.id === tab ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                onTab(t.id);
              }}
            >
              {t.label}
            </a>
          ))}
        </nav>
      ) : null}
    </>
  );
});
