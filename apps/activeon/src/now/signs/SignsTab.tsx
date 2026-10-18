// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs: the character page's Signs tab, its own lazy chunk (lazy-part.tsx). The Star Chart
// section in the Account and the System page body stay in SignsPanel.tsx.
import type { StarSignsNowView } from '@idleon-forge/engine/now';
import { formatRoute } from '../../shell/route';
import type { CharacterTabProps } from '../character-tabs';
import { useNowActions } from '../context';
import { list } from './signs-status';
import './signs-tab.css';

const STAR_SIGNS = 'star-signs';

/** The character page's Signs tab (character-tabs.ts). */
export function SignsTab({ view, index }: CharacterTabProps) {
  const s = view.starSigns;
  const c = s?.characters.find((x) => x.index === index);
  if (!s || !c) return <p className="small muted">No star sign data for this character yet.</p>;
  const change =
    c.canChange === true
      ? 'yes, it can reach the Telescope'
      : c.killsToTelescope !== null
        ? `needs about ${c.killsToTelescope.toLocaleString('en-US')} kills to reach the Telescope`
        : "can't tell from this save";
  return (
    <div className="ss">
      <dl className="ss-facts">
        <div>
          <dt>Wearing</dt>
          <dd>{list(c.worn)}</dd>
        </div>
        <div>
          <dt>Wear for {c.activity ?? 'its job'}</dt>
          <dd>
            {c.activity ? list(c.recommended) : 'no sign advice for its activity yet'}
            {c.activity && c.matches ? ' ✓' : ''}
          </dd>
        </div>
        {c.afterCosmos ? (
          <div>
            <dt>After Chronus Cosmos</dt>
            <dd>
              {list(c.afterCosmos)}
              {c.onceUnlocked ? `, ${c.onceUnlocked} once unlocked` : ''}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Can change signs</dt>
          <dd className={c.canChange === true ? 'ss-yes' : undefined}>{change}</dd>
        </div>
        <div>
          <dt>Sign slots</dt>
          <dd className="num">{c.slots}</dd>
        </div>
      </dl>
      <p className="small muted">
        Signs are changed only at the Telescope, at the top of the big tree in World 1 (Where the Branches
        End). Unlocking a sign is account-wide; each character aligns its own.
      </p>
      <StarChartLink s={s} />
    </div>
  );
}

/** The Signs tab's one line about the account's Star Chart; the chart itself lives on its System page. */
function StarChartLink({ s }: { s: StarSignsNowView }) {
  const actions = useNowActions();
  const to = { place: 'system', id: STAR_SIGNS } as const;
  return (
    <p className="small ss-chart-link">
      Star Chart: <span className="num">{s.points ?? '?'}</span> points ·{' '}
      <a
        href={formatRoute(to)}
        onClick={(e) => {
          if (!actions.navigate) return;
          e.preventDefault();
          actions.navigate(to);
        }}
      >
        see it
      </a>
    </p>
  );
}
