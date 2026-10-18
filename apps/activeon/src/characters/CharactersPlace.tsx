// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 FR-13, FR-14: Characters. One tile per character in save order (the in-game slot order, so a
// tile never moves): name, class and level, AFK Target and map, the Verdict pill and cap pills exactly
// as the Roster shows them, and one status line per registered tab that publishes one. A tile opens
// the Character page on its Now tab; a tab line opens that tab. The Builds and Cards overviews (#97,
// #99) render under the grid, unchanged (D-7).
import { CHARACTERS_WORDS, type RosterRow } from '@idleon-forge/engine/now';
import { LegacyPill as Pill } from '../design/atoms/LegacyPill';
import { BuildsOverview } from '../now/BuildView';
import { CardsOverview } from '../now/cards/CardsPanel';
import { characterTabs, NOW_TAB, tabHref } from '../now/character-tabs';
import { SkillGrid } from '../now/SkillsTab';
import type { Session } from '../shell/session';

function Tile({ row, s }: { row: RosterRow; s: Session }) {
  const lines = characterTabs.flatMap((t) => {
    const text = t.status?.(s.view, row.index) ?? null;
    return text ? [{ id: t.id, label: t.label, text }] : [];
  });
  const open = (tab: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    s.navigate({ place: 'character', index: row.index, tab }, 'push', { origin: '#characters' });
  };
  return (
    <li className={`ct ${row.pill.kind}`}>
      <a
        className="ct-main"
        href={tabHref(NOW_TAB, row.index)}
        aria-label={row.accessibleName}
        onClick={open(NOW_TAB)}
      >
        <span className="r-top">
          <span className="r-name">{row.name}</span>
          <span className="r-class">
            {row.classLabel} · lv {row.level}
          </span>
          <Pill pill={row.pill} />
        </span>
        <span className="r-where small">{[row.activity, row.map].filter(Boolean).join(' · ')}</span>
        {row.caps.length > 0 ? (
          <span className="r-caps">
            {row.caps.map((c) => (
              <span key={c.key} className={`cap${c.fullNow ? ' full' : ''}`}>
                {c.label}
              </span>
            ))}
            {row.moreCaps > 0 ? <span className="cap more">+{row.moreCaps}</span> : null}
          </span>
        ) : null}
      </a>
      {lines.length > 0 ? (
        <ul className="ct-tabs">
          {lines.map((l) => (
            <li key={l.id}>
              <a href={tabHref(l.id, row.index)} className="ct-tab small" onClick={open(l.id)}>
                <b>{l.label}</b> <span>{l.text}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CharactersPlace({ s }: { s: Session }) {
  // Save order: the Roster's rows (Visit Order) re-sorted by CharacterState.index.
  const rows = [...s.view.roster].sort((a, b) => a.index - b.index);
  return (
    <section className="characters-place" aria-labelledby="characters-h">
      <h2 id="characters-h" className="section-h place-h" data-place-heading tabIndex={-1}>
        {CHARACTERS_WORDS.title}
      </h2>
      <ul className="ct-grid">
        {rows.map((row) => (
          <Tile key={row.index} row={row} s={s} />
        ))}
      </ul>
      <BuildsOverview view={s.view} />
      <CardsOverview view={s.view} />
      <SkillGrid grid={s.view.skillGrid} />
    </section>
  );
}
