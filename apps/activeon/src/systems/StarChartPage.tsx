// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-S5: the star-signs System page body (Design Lab v2 `systems.star-chart` "Constellation map"),
// a lazy chunk. The constellation sky, then M16's Star Chart lines and every character's signs, reused
// from systems/StarChart.tsx (the Account keeps its one summary line, D-9).
import type { StarSignsNowView } from '@idleon-forge/engine/now';
import { BODY_WORDS, FRAME_WORDS } from '@idleon-forge/engine/systems-ui';
import { PixelArt } from '../design/art/PixelArt';
import { Meter } from '../design/atoms';
import { constellationMap, SeeOnMap } from '../map/SeeOnMap';
import { useNowActions } from '../now/context';
import type { SystemPageBodyProps } from './pages';
import { CharacterSigns, StarChartBody } from './StarChart';

/**
 * M21 FR-S5 (Design Lab v2 `systems.star-chart` "Constellation map"): the sky of the next constellations
 * in M16's order, the first one lit with its step and points, the rest as stars whose names show only for
 * the best three (DS-20), over a meter of the signs unlocked toward the Hydron chart.
 */
function StarSky({ s }: { s: StarSignsNowView }) {
  const actions = useNowActions();
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
          <SeeOnMap mapIndex={constellationMap(actions.result, first.name)} label={first.name} />
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
