// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The character page's Signs tab, M24 board `Signs` (I-character-b; M16's data). The answer first: is
// the sign worn right for its job, and if not, the swap and when it can reach the Telescope. Then the
// sign slots as tiles (the locked second one says what opens it), and while Chronus Cosmos is locked,
// how to get slot 2: earn Star Chart points from constellations, then spend them along the chart. The
// 19 points are the whole path (8 signs on the way at 2, Cosmos itself at 3; the wiki's "3 points" is
// that last node), and the tab says so. Its own lazy chunk; the Star Chart lives on its System page.
import type { StarSignsNowView } from '@idleon-forge/engine/now';
import type { ReactNode } from 'react';
import { GameIcon } from '../../art/game/GameIcon';
import type { GameArt } from '../../art/game/game-art';
import { Answer, StepNo, TabSource } from '../../characters/tabs/kit';
import { PixelArt } from '../../design/art/PixelArt';
import { GLYPH, Meter, Pip } from '../../design/atoms';
import { formatRoute } from '../../shell/route';
import type { CharacterTabProps } from '../character-tabs';
import { useNowActions } from '../context';
import { list } from './signs-status';
import './signs-tab.css';

const STAR_SIGNS = 'star-signs';
/**
 * The game draws no picture per sign; its star sign icon (Toolbox draws every sign with it, `kind-art`
 * starsign) stands for each, our own star as the fallback.
 */
const SIGN_ART: GameArt = { path: 'data/SignStar1b' };
const fallbackSign = 'item-star';

/** "Barbarian 74 and Squire 77 each have 1 sign to swap" (class and level, the strip's words). */
function others(s: StarSignsNowView, index: number, who: (i: number) => string | null): string | null {
  const off = s.characters.filter((x) => x.index !== index && x.activity && !x.matches);
  if (!off.length) return 'Every other character wears the right sign too';
  const names = off.map((x) => who(x.index) ?? `Character ${x.index + 1}`);
  const joined = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  return `On other characters: ${joined} ${off.length === 1 ? 'has' : 'each have'} a sign to swap`;
}

/** A link to the Star Chart's System page. */
function ChartLink({ children, className }: { children: ReactNode; className: string }) {
  const actions = useNowActions();
  const to = { place: 'system', id: STAR_SIGNS } as const;
  return (
    <a
      className={className}
      href={formatRoute(to)}
      onClick={(e) => {
        if (!actions.navigate) return;
        e.preventDefault();
        actions.navigate(to);
      }}
    >
      {children}
    </a>
  );
}

/** The character page's Signs tab (character-tabs.ts). */
export function SignsTab({ view, index }: CharacterTabProps) {
  const s = view.starSigns;
  const c = s?.characters.find((x) => x.index === index);
  if (!s || !c) return <p className="tb tb-note">No star sign data for this character yet.</p>;
  const who = (i: number) => {
    const k = view.skills.find((x) => x.index === i);
    return k ? `${k.classLabel} ${k.level}` : null;
  };
  const activity = c.activity?.toLowerCase() ?? null;
  const reach =
    c.canChange === true
      ? 'It can reach the Telescope now'
      : c.killsToTelescope !== null
        ? `About ${c.killsToTelescope.toLocaleString('en-US')} kills to reach the Telescope`
        : "Can't tell from this save whether it can reach the Telescope";
  const slots = Array.from({ length: Math.max(c.slots, c.worn.length) }, (_, i) => c.worn[i] ?? null);
  const cosmos = s.cosmos ?? null;
  return (
    <div className="tb ss">
      {!c.activity ? (
        <Answer
          tone="plain"
          art={SIGN_ART}
          icon={fallbackSign}
          cap="Signs"
          title="No sign advice for its activity yet"
          sub={reach}
        />
      ) : c.matches ? (
        <Answer
          tone="ok"
          icon="status-check"
          cap="Nothing to change"
          title={`${list(c.recommended)} ${c.recommended.length === 1 ? 'is' : 'are'} already right for ${activity}`}
          sub={others(s, index, who)}
        />
      ) : (
        <Answer
          tone="gold"
          art={SIGN_ART}
          icon={fallbackSign}
          cap={`Swap a sign · for ${activity}`}
          title={`At the Telescope: wear ${list(c.recommended)}${c.worn.length ? ` instead of ${list(c.worn)}` : ''}`}
          sub={reach}
        />
      )}

      <div className="ss-grid">
        <section className="tb-sec" aria-labelledby={`ss-${index}-h`}>
          <h2 id={`ss-${index}-h`} className="a-h2">
            Sign slots
          </h2>
          <ol className="tb-list ss-slots">
            {slots.map((sign, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional
              <li key={i} className="ss-slot" data-empty={sign ? 'no' : 'yes'}>
                <span className="ss-slot__ic" data-tone={sign ? 'gold' : 'plain'}>
                  <GameIcon art={sign ? SIGN_ART : null} fallback={fallbackSign} size={48} decorative />
                </span>
                <b>{sign ?? 'Empty slot'}</b>
                <span className={sign && c.matches ? 'tb-xs tb-ok' : 'tb-xs'}>
                  {sign
                    ? c.matches && activity
                      ? `worn · fits ${activity}`
                      : 'worn'
                    : 'align one at the Telescope'}
                </span>
              </li>
            ))}
            {cosmos && c.slots === 1 ? (
              <li className="ss-slot" data-locked="yes">
                <span className="ss-slot__ic ss-slot__ic--n" aria-hidden="true">
                  2
                </span>
                <b>Second slot</b>
                <span className="tb-xs">opens with the Chronus Cosmos sign</span>
              </li>
            ) : null}
          </ol>
        </section>

        {cosmos ? (
          <section className="tb-sec" aria-labelledby={`ss-${index}-slot2`}>
            <h2 id={`ss-${index}-slot2`} className="a-h2">
              How to get slot 2
            </h2>
            <ol className="tb-list tb-steps">
              <li>
                <StepNo n={1} now={true} />
                <span>
                  Finish constellations to earn Star Chart points.{' '}
                  <ChartLink className="tb-link ss-inline">See the next ones on the Star Chart</ChartLink>
                </span>
              </li>
              <li>
                <StepNo n={2} now={false} />
                <span>Spend them on the Star Chart, sign by sign, until you reach Chronus Cosmos</span>
              </li>
            </ol>
            <div className="ss-meter">
              <div className="tb-sec-head">
                <span className="tb-note">Star Chart points</span>
                <span>
                  <span className="ss-big">{cosmos.have ?? '?'}</span>
                  <span className="tb-note"> of {cosmos.need} needed</span>
                </span>
              </div>
              <Meter
                value={cosmos.have ?? 0}
                max={cosmos.need}
                label={`Star Chart points: ${cosmos.have ?? 'not known'} of ${cosmos.need}`}
                tone="accent"
              />
              <p className="tb-note">
                {cosmos.need} points buy the {cosmos.onTheWay.length} signs on the way (
                {cosmos.onTheWay.join(', ')}) and Chronus Cosmos itself, {cosmos.cost} points. It gives every
                character a second sign slot.
              </p>
            </div>
            {c.afterCosmos?.length ? (
              <div className="ss-after">
                <p className="a-cap">When you get slot 2, wear for {activity ?? 'its job'}</p>
                <ul className="tb-list ss-chips">
                  {c.afterCosmos.map((x) => (
                    <li key={x} className="ss-chip">
                      <GameIcon art={SIGN_ART} fallback={fallbackSign} size={24} decorative />
                      <b>{x}</b>
                    </li>
                  ))}
                </ul>
                {c.onceUnlocked ? <p className="tb-xs">{c.onceUnlocked} once unlocked</p> : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      <ul className="tb-list ss-rows">
        <li className="ss-row">
          <Pip tone={c.canChange ? 'mint' : undefined} />
          <span className="ss-row__main">
            Signs change only at the Telescope: <b>Where the Branches End</b>, World 1
          </span>
          <span className="tb-note">
            {c.canChange === true
              ? 'it can reach it now'
              : reach.replace(/ to reach the Telescope$/, ' to reach it')}
          </span>
        </li>
        <li>
          <ChartLink className="ss-row ss-row--link">
            <Pip />
            <span className="ss-row__main">Star Chart</span>
            <span className="tb-note">
              {s.points === null ? 'points not known' : `${s.points} points`} · open
            </span>
            <PixelArt name={GLYPH.arrowRight} decorative />
          </ChartLink>
        </li>
      </ul>
      <TabSource source={s.source} note="Unlocking a sign is account-wide; each character picks its own" />
    </div>
  );
}
