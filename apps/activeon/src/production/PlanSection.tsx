// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C section 8 (board m26/ProductionPlan.dc.html): the Production Plan section on a Character's Now
// tab, under its Goals: one row per producer the character owns (its anvil, craft next, its printer
// slots), and a link to the whole account's plan (#production). A lazy chunk (lazy-part.tsx).
import { useNowActions } from '../now/context';
import { PlanRows } from './PlanRows';
import './production.css';

export function PlanSection({ index }: { index: number }) {
  const a = useNowActions();
  const p = a.result?.production ?? null;
  const rows = p?.rows.filter((r) => r.characterIndex === index) ?? [];
  if (!p || rows.length === 0) return null;
  const hours = Math.round((a.result?.expectedReturn.usedSeconds ?? 0) / 3600);
  const go = (href: string) => {
    if (href === '#production') a.navigate?.({ place: 'account', page: 'production' });
    else window.location.hash = href;
  };
  return (
    <section className="pp-sec" aria-labelledby={`pp-h-${index}`}>
      <div className="sf-sec__head pp-sec__head">
        <h3 id={`pp-h-${index}`} className="a-h2">
          Production Plan
        </h3>
        <span className="sf-hint">
          {rows.length} {rows.length === 1 ? 'producer' : 'producers'} · by your return
          {hours ? ` in ${hours}h` : ''}
        </span>
      </div>
      <PlanRows rows={rows} p={p} onLink={go} />
      <button type="button" className="n-link-btn pp-page-link" onClick={() => go('#production')}>
        The whole account's Production Plan ›
      </button>
    </section>
  );
}
