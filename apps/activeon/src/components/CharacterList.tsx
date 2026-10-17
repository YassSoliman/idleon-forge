// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { type AccountState, humanize } from '@idleon-forge/account-state';
import { describeActivity } from '../format';

type Row = { kind: 'read'; c: AccountState['characters'][number] } | { kind: 'unreadable'; index: number };

/** One row per character: who, what they're doing, where. No advice yet (next slice). */
export function CharacterList({ state }: { state: AccountState }) {
  const { account, characters, diagnostics } = state;
  const build = account.gameVersion.serverBuild;
  // A character that couldn't be read is an Unknown row in its slot, never dropped (FR-19b).
  const rows: Row[] = [
    ...characters.map((c) => ({ kind: 'read' as const, c })),
    ...diagnostics.unreadableCharacters.map((index) => ({ kind: 'unreadable' as const, index })),
  ].sort((a, b) => (a.kind === 'read' ? a.c.index : a.index) - (b.kind === 'read' ? b.c.index : b.index));
  return (
    <section aria-label="Characters">
      <h2 className="section-h">Characters</h2>
      <ul className="roster">
        {rows.map((row) =>
          row.kind === 'read' ? (
            <li key={row.c.index} className="r">
              <div className="who">
                <b>{row.c.name}</b>
                <span>
                  {humanize(row.c.class)} · Lv {row.c.level}
                </span>
              </div>
              <div className="doing">
                <span>{describeActivity(row.c)}</span>
                <span className="muted">{row.c.currentMap ? humanize(row.c.currentMap) : 'Unknown map'}</span>
              </div>
            </li>
          ) : (
            <li key={row.index} className="r unknown">
              <div className="who">
                <b>Character {row.index + 1}</b>
                <span className="pill unk">Unknown</span>
              </div>
              <div className="doing">
                <span>This character couldn't be read. The game may have updated.</span>
              </div>
            </li>
          ),
        )}
      </ul>
      <p className="mono muted acct">
        World {account.currentWorld ?? '?'}
        {build !== null ? ` · game build ${build}` : ''} · parser targets {account.gameVersion.parserTarget}
      </p>
    </section>
  );
}
