// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs (docs/specs/M16-star-signs.md): the Star Chart section in the Account (points, unlocked
// signs, the next constellations) and the star-signs System page body (area S). The Signs tab's status
// line moved to signs-status.ts (area C) in M21 Phase F. The tab itself (the signs a character wears and should wear) is SignsTab.tsx, a lazy chunk. The engine
// (packages/engine/src/starsigns) builds and words everything; this file only renders it. Text is React
// text, styles are classes (CSP).
import { BODY_WORDS, FRAME_WORDS, type NowView, type StarSignsNowView } from '@idleon-forge/engine/now';
import { PixelArt } from '../../design/art/PixelArt';
import { Meter } from '../../design/atoms/Meter';
import { SourceLabel } from '../../design/atoms/SourceLabel';
import type { SystemPageBodyProps } from '../../systems/pages';
import { useNowActions } from '../context';
import './signs-page.css';

const list = (xs: readonly string[]) => (xs.length ? xs.join(' + ') : 'nothing');

function StarChartBody({ s, heading = true }: { s: StarSignsNowView; heading?: boolean }) {
  return (
    <>
      {heading ? <h3 className="ss-h">Star Chart</h3> : null}
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
                {n.shown ? (
                  <>
                    {' '}
                    <span className="pill">on your list</span>
                  </>
                ) : null}
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
        <CharacterSigns s={s} />
      </div>
    </details>
  );
}

/**
 * Every character's sign line, with a recommendation shared by several characters said once
 * ("wear The Fuzzy Dice · 6 characters") and each character's own line under "show details" (#70 A5).
 */
function CharacterSigns({ s }: { s: StarSignsNowView }) {
  const actions = useNowActions();
  const groups = new Map<string, StarSignsNowView['characters']>();
  for (const c of s.characters) {
    const id = c.activity ? `wear ${list(c.recommended)}` : c.line;
    groups.set(id, [...(groups.get(id) ?? []), c]);
  }
  const link = (c: StarSignsNowView['characters'][number]) => (
    <a
      href={`#signs-${c.index}`}
      onClick={(e) => {
        e.preventDefault();
        actions.openTab(c.index, 'signs');
      }}
    >
      {c.line}
    </a>
  );
  return (
    <ul className="ss-chars small">
      {[...groups].map(([id, cs]) =>
        cs.length > 1 ? (
          <li key={id}>
            {id} · <span className="num">{cs.length}</span> characters
            <details className="ss-group">
              <summary>show details</summary>
              <ul>
                {cs.map((c) => (
                  <li key={c.index}>{link(c)}</li>
                ))}
              </ul>
            </details>
          </li>
        ) : (
          cs.map((c) => <li key={c.index}>{link(c)}</li>)
        ),
      )}
    </ul>
  );
}

/**
 * M21 FR-S5 (Design Lab v2 `systems.star-chart` "Constellation map"): the sky of the next constellations
 * in M16's order, the first one lit with its step and points, the rest as stars whose names show only for
 * the best three (DS-20), over a meter of the signs unlocked toward the Hydron chart.
 */
function StarSky({ s }: { s: StarSignsNowView }) {
  const first = s.next[0] ?? null;
  return (
    <div className="ss-sky">
      {first ? (
        <div className="ss-sky__now">
          <span className="sy-nowtag">
            <PixelArt name="v2-systems-st-now" decorative />
            <span>{FRAME_WORDS.nextStep}</span>
          </span>
          <p className="ss-sky__act">
            <b>{first.name}</b> {first.text}
          </p>
          <p className="ss-sky__pts num">{BODY_WORDS.starPoints(first.points)}</p>
        </div>
      ) : null}
      <ol className="ss-sky__stars" aria-label={BODY_WORDS.starChart}>
        {s.next.map((n, i) => (
          <li key={n.name} className={i === 0 ? 'is-now' : undefined}>
            <PixelArt name="v2-systems-star" ramp={i === 0 ? 'gold' : 'silver'} decorative />
            {i < 4 ? (
              <span className="ss-sky__name">{n.name}</span>
            ) : (
              <span className="sr-only">{n.name}</span>
            )}
          </li>
        ))}
      </ol>
      <div className="ss-sky__meter">
        <Meter
          value={s.unlockedNodes}
          max={Math.max(1, s.hydronAt)}
          label={BODY_WORDS.signsUnlocked(s.unlockedNodes, s.hydronAt)}
        />
        <span className="num">{BODY_WORDS.signsUnlocked(s.unlockedNodes, s.hydronAt)}</span>
      </div>
    </div>
  );
}

/** The star-signs System page body (pages.ts): the account's Star Chart and every character's signs. */
export function StarSignsSystemBody({ s }: SystemPageBodyProps) {
  const v = s.view.starSigns;
  if (!v) return null;
  return (
    <section className="ss sy-pic" aria-labelledby="ss-chart-h">
      <h3 id="ss-chart-h" className="sy-h3">
        {BODY_WORDS.starChart}
      </h3>
      <StarSky s={v} />
      <StarChartBody s={v} heading={false} />
      <CharacterSigns s={v} />
    </section>
  );
}
