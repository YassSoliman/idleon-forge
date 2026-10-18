// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs: the character page's Signs tab, its own lazy chunk (lazy-part.tsx), drawn as the
// Design Lab's "Sign slot strip" (M21 FR-C8, `systems.star-chart` also-built): the character's sign
// slots as a strip, worn signs filled and free slots dashed, the next slot's milestone said once above
// it, then what to wear for its job. The Star Chart itself lives on its System page (area S).
import type { StarSignsNowView } from '@idleon-forge/engine/now';
import { PixelArt } from '../../design/art/PixelArt';
import { GLYPH } from '../../design/atoms';
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
  if (!s || !c) return <p className="ss-muted">No star sign data for this character yet.</p>;
  const change =
    c.canChange === true
      ? 'It can reach the Telescope now'
      : c.killsToTelescope !== null
        ? `About ${c.killsToTelescope.toLocaleString('en-US')} kills to reach the Telescope`
        : "Can't tell from this save whether it can reach the Telescope";
  const slots = Array.from({ length: Math.max(c.slots, c.worn.length) }, (_, i) => c.worn[i] ?? null);
  return (
    <div className="ss">
      {s.milestone ? <p className="ss-milestone">{s.milestone}</p> : null}
      <section aria-labelledby={`ss-${index}-h`}>
        <h3 id={`ss-${index}-h`} className="ss-h">
          Sign slots <span className="ss-muted num">{c.slots === 1 ? '1 slot' : `${c.slots} slots`}</span>
        </h3>
        <ol className="ss-strip">
          {slots.map((sign, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional
            <li key={i} className="ss-slot" data-empty={sign ? 'no' : 'yes'}>
              <PixelArt name="v2-character-star" decorative />
              <span>{sign ?? 'empty slot'}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="ss-wear" aria-labelledby={`ss-${index}-w`}>
        <h3 id={`ss-${index}-w`} className="ss-h">
          Wear for {c.activity ?? 'its job'}
        </h3>
        <p className="ss-line" data-ok={c.activity && c.matches ? 'yes' : 'no'}>
          {c.activity && c.matches ? <PixelArt name={GLYPH.check} decorative /> : null}
          <span>{c.activity ? list(c.recommended) : 'No sign advice for its activity yet'}</span>
          {c.activity && c.matches ? <span className="ss-muted">already worn</span> : null}
        </p>
        {c.afterCosmos ? (
          <p className="ss-muted">
            After Chronus Cosmos: <span>{list(c.afterCosmos)}</span>
            {c.onceUnlocked ? `, ${c.onceUnlocked} once unlocked` : ''}
          </p>
        ) : null}
        <p className={c.canChange === true ? 'ss-line ss-yes' : 'ss-line'}>{change}</p>
      </section>
      <p className="ss-muted">
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
    <a
      className="ss-chart-link"
      href={formatRoute(to)}
      onClick={(e) => {
        if (!actions.navigate) return;
        e.preventDefault();
        actions.navigate(to);
      }}
    >
      <span>
        Star Chart:{' '}
        <span className="num">{s.points === null ? 'points not known' : `${s.points} points`}</span>
      </span>
      <PixelArt name={GLYPH.arrowRight} decorative />
    </a>
  );
}
