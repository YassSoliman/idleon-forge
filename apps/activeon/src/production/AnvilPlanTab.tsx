// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C section 8: the Anvil page's Production Plan tab (it replaces "What each anvil makes"). Every
// character's anvil row in Visit Order (what to make now, why, the gain by the return, the hammers and the
// speed-ups), beside the account producers. The engine words everything (EngineResult.production).
import type { ProductionResult } from '@idleon-forge/engine/production';
import type { Session } from '../shell/session';
import { AccountProducers } from './AccountProducers';
import { PlanRow } from './PlanRows';
import './production.css';

export function AnvilPlanTab({ s, p }: { s: Session; p: ProductionResult }) {
  const order = s.result.visitOrder.length ? s.result.visitOrder : s.view.roster.map((r) => r.index);
  const rows = p.rows
    .filter((r) => r.producer === 'anvil')
    .sort((a, b) => order.indexOf(a.characterIndex) - order.indexOf(b.characterIndex));
  const who = (i: number) => {
    const c = s.view.roster.find((r) => r.index === i);
    return c ? `${c.classLabel} Lv ${c.level}` : null;
  };
  const go = (href: string) => {
    if (href === '#production') s.navigate({ place: 'account', page: 'production' }, 'push');
    else window.location.hash = href;
  };
  return (
    <div className="sf-split">
      <div className="sf-col">
        <section className="sf-sec" aria-labelledby="an-plan-h">
          <div className="sf-sec__head">
            <h3 id="an-plan-h" className="a-h2">
              What each anvil should make
            </h3>
            <span className="sf-hint">{p.anvils.line}</span>
          </div>
          <ul className="pp-rows">
            {rows.map((r, i) => (
              <PlanRow key={r.key} r={r} p={p} open={i === 0} who={who(r.characterIndex)} onLink={go} />
            ))}
          </ul>
        </section>
      </div>
      <aside className="sf-col">
        <AccountProducers p={p} />
      </aside>
    </div>
  );
}
