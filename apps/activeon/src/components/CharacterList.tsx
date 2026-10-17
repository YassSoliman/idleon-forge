// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { type AccountState, humanize } from '@idleon-forge/account-state';
import { describeActivity } from '../format';

/** One row per character: who, what they're doing, where. No advice yet (next slice). */
export function CharacterList({ state }: { state: AccountState }) {
  const { account, characters } = state;
  const build = account.gameVersion.serverBuild;
  return (
    <section aria-label="Characters">
      <h2 className="section-h">Characters</h2>
      <ul className="roster">
        {characters.map((c) => (
          <li key={c.index} className="r">
            <div className="who">
              <b>{c.name}</b>
              <span>
                {humanize(c.class)} · Lv {c.level}
              </span>
            </div>
            <div className="doing">
              <span>{describeActivity(c)}</span>
              <span className="muted">{c.currentMap ? humanize(c.currentMap) : 'Unknown map'}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mono muted acct">
        World {account.currentWorld ?? '?'}
        {build !== null ? ` · game build ${build}` : ''} · parser targets {account.gameVersion.parserTarget}
      </p>
    </section>
  );
}
