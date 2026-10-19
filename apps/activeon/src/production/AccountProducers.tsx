// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C section 8 (board m26/ProductionPlan.dc.html, right column): the account producers. The Anvils
// summary ("6 of 7 should switch") with the levers that act on every anvil (shown once here, FR-C8), each
// piece several characters want ("Craft 4 Golden Nets", FR-C10) with its gate, and the producers that
// join in later waves, tagged.
import type { ProductionResult } from '@idleon-forge/engine/production';
import { GameIcon } from '../art/game/GameIcon';
import { itemArt } from '../art/game/game-art';
import { GateLink } from '../design/atoms/GateLink';
import { useGates } from './use-gates';
import './production.css';

export function AccountProducers({ p, heading = 'h3' }: { p: ProductionResult; heading?: 'h2' | 'h3' }) {
  const gates = useGates();
  const H = heading;
  return (
    <section className="a-tile sf-tile pp-acct" aria-labelledby="pp-acct-h" data-focus-key="account">
      <H id="pp-acct-h" className="a-h2">
        Account producers
      </H>
      <ul className="pp-acct__list">
        <li className="pp-acct__row" data-focus-key="anvils">
          <span className="pp-ic pp-ic--big">
            <GameIcon art={itemArt('EquipmentSmithingTabs2')} size={32} decorative />
          </span>
          <span className="pp-acct__words">
            <b>{`Anvils: ${p.anvils.line.replace(/^(\d+) of (\d+) anvils should switch$/, '$1 of $2 should switch')}`}</b>
            {p.anvils.detail ? <span className="sf-hint">{p.anvils.detail}</span> : null}
            {p.levers.map((l) => (
              <span key={l.key} className="sf-hint">
                {l.text}
              </span>
            ))}
          </span>
          {p.anvils.switching > 0 ? <span className="pp-chip pp-chip--gold">switch</span> : null}
        </li>
        {p.shared.map((x) => (
          <li key={x.key} className="pp-acct__row" data-focus-key={x.rawName}>
            <span className="pp-ic pp-ic--big">
              <GameIcon art={itemArt(x.rawName)} size={32} decorative wiki={x.name} />
            </span>
            <span className="pp-acct__words">
              <b>
                {x.text}
                <GateLink gate={x.gate} onNavigate={gates.onNavigate} />
              </b>
              <span className="sf-hint">{x.detail}</span>
            </span>
            <span className={`pp-chip pp-chip--${x.enough >= x.who.length ? 'mint' : 'gold'}`}>
              {x.enough >= x.who.length ? 'ready' : `${x.enough} of ${x.who.length}`}
            </span>
          </li>
        ))}
        <li className="pp-acct__row pp-acct__row--later">
          <span className="pp-acct__words">
            <b>Forge, Refinery, kitchens, build slots</b>
            <span className="sf-hint">Their Production Plan rows join with their pages.</span>
          </span>
          <span className="pp-chip pp-chip--mut">Wave 2</span>
        </li>
      </ul>
      <p className="sf-hint">
        Rows are ranked by the Goal they serve, then by the slowest step they shorten, then by how much is
        still missing against what the producer makes by your return. A producer switches only when the new
        pick is at least {Math.round((p.keepRatio - 1) * 100)}% better.
      </p>
    </section>
  );
}
