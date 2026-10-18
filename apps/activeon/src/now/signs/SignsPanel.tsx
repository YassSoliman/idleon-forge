// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs (docs/specs/M16-star-signs.md): the character page's Signs tab (the signs it wears, the
// ones to wear for its AFK Target, and whether it can change signs now) and the Star Chart section in the
// Account (points, unlocked signs, the next constellations). The engine (packages/engine/src/starsigns)
// builds and words everything; this file only renders it. Text is React text, styles are classes (CSP).
import type { NowView, StarSignsNowView } from '@idleon-forge/engine/now';
import type { CharacterTabProps } from '../character-tabs';
import { useNowActions } from '../context';
import { SourceLabel } from '../parts';
import './signs.css';

const list = (xs: readonly string[]) => (xs.length ? xs.join(' + ') : 'nothing');

/** M17 FR-13: the Signs tab's one status line on the Characters grid. */
export function signsStatus(view: NowView, index: number): string | null {
  const c = view.starSigns?.characters.find((x) => x.index === index);
  if (!c?.activity) return null;
  const wear = `wear ${list(c.recommended)}${c.matches ? ' ✓' : ''}`;
  if (c.canChange === true) return `${wear} · can change signs`;
  return c.killsToTelescope !== null
    ? `${wear} · Telescope in about ${c.killsToTelescope.toLocaleString('en-US')} kills`
    : wear;
}

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
      <StarChartBody s={s} />
    </div>
  );
}

function StarChartBody({ s }: { s: StarSignsNowView }) {
  return (
    <>
      <h3 className="ss-h">Star Chart</h3>
      <p className="small">
        <span className="num">{s.points ?? '?'}</span> points to spend ·{' '}
        <span className="num">{s.unlockedNodes}</span> signs unlocked (the Hydron chart opens at{' '}
        <span className="num">{s.hydronAt}</span>) · <span className="num">{s.slots}</span>{' '}
        {s.slots === 1 ? 'sign slot' : 'sign slots'} per character
      </p>
      {s.milestone ? <p className="small">{s.milestone}</p> : null}
      {s.plan ? <p className="small">{s.plan}</p> : null}
      {!s.questDone ? (
        <p className="small muted">Constellations open once the Telescope quest is handed in.</p>
      ) : null}
      {s.next.length ? (
        <>
          <h3 className="ss-h">Next constellations</h3>
          <ol className="ss-next">
            {s.next.map((n) => (
              <li key={n.name}>
                <b>{n.name}</b> {n.text} · <span className="num">{n.points}</span> points
                {n.shown ? <span className="pill">on your list</span> : null}
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {s.later.length ? (
        <ul className="ss-later small muted">
          {s.later.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : null}
      {s.nextCharacter ? <p className="small">{s.nextCharacter}</p> : null}
      {s.source ? (
        <div className="ss-sources">
          <SourceLabel source={s.source} />
        </div>
      ) : null}
    </>
  );
}

export const STAR_CHART_OPEN = 'star-chart-open';

/** The Star Chart section in the Account: points, unlocked signs, the next constellations, per character. */
export function StarChartSection({ view }: { view: NowView }) {
  const actions = useNowActions();
  const s = view.starSigns;
  if (!s) return null;
  return (
    <details
      className="ss-account card"
      id="star-chart"
      open={actions.expanded.has(STAR_CHART_OPEN)}
      onToggle={(e) => {
        const open = (e.currentTarget as HTMLDetailsElement).open;
        if (open !== actions.expanded.has(STAR_CHART_OPEN)) actions.toggle(STAR_CHART_OPEN);
      }}
    >
      <summary>
        <span className="tag">Star Signs</span> <span className="num">{s.points ?? '?'}</span> points ·{' '}
        <span className="num">{s.unlockedNodes}</span> signs unlocked
        {s.next[0] ? ` · next: ${s.next[0].name}` : ''}
      </summary>
      <div className="ss">
        <StarChartBody s={s} />
        <ul className="ss-chars small">
          {s.characters.map((c) => (
            <li key={c.index}>
              <a
                href={`#signs-${c.index}`}
                onClick={(e) => {
                  e.preventDefault();
                  actions.openTab(c.index, 'signs');
                }}
              >
                {c.line}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
