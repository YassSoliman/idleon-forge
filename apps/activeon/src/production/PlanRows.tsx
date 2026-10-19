// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C9 (board m26/ProductionPlan.dc.html): one character's Production Plan rows. Each row: the
// product's sprite, what to make, why (the Demand it serves, or the Smithing EXP fallback when nothing
// needs it), a value chip, and when opened the hammers (from -> to, made by the return) and the speed-ups
// as numbered steps. A keep is one quiet line. The first three rows are open, the rest behind "All
// producers". The engine words everything (EngineResult.production).
import type { ProductionResult, ProductionRow, ProductionStep } from '@idleon-forge/engine/production';
import { useState } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import { itemArt } from '../art/game/game-art';
import { GateLink } from '../design/atoms/GateLink';
import { useGates } from './use-gates';
import './production.css';

const n0 = (n: number) => Math.round(n).toLocaleString('en-US');
/** Rows open before "All producers" (section 8: the first three). */
const SHOWN = 3;

/** A step's sprite: an item, a stamp (StampB3) or a bubble (aUpgradesB2), all in the game's data folder. */
const stepArt = (icon: string | null) => itemArt(icon);

function Steps({ steps, onLink }: { steps: ProductionStep[]; onLink?: (href: string) => void }) {
  return (
    <ol className="pp-steps">
      {steps.map((st, i) => (
        <li key={st.key} className={`pp-step pp-step--${st.tone}`}>
          <span className="pp-step__n num">{i + 1}</span>
          <span className="pp-ic pp-ic--sm">
            <GameIcon art={stepArt(st.icon)} fallback="item-ore" size={24} decorative />
          </span>
          <span className="pp-step__t">{st.text}</span>
          {st.link ? (
            <a
              className="pp-link"
              href={st.link.href}
              onClick={
                onLink
                  ? (e) => {
                      e.preventDefault();
                      onLink(st.link?.href ?? '');
                    }
                  : undefined
              }
            >
              {st.link.label} ›
            </a>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function PlanRow({
  r,
  p,
  open: initial,
  who,
  onLink,
}: {
  r: ProductionRow;
  p: ProductionResult;
  open: boolean;
  /** The character's label, on pages that list several characters. */
  who?: string | null;
  onLink?: (href: string) => void;
}) {
  const [open, setOpen] = useState(initial);
  const gates = useGates();
  const product = (i: number) => p.products[i];
  const hasMore = r.hammers.length > 0 || r.steps.length > 0;
  const tone = r.quiet ? 'quiet' : r.chip?.tone === 'gold' ? 'gold' : 'plain';
  return (
    <li className={`a-tile pp-row pp-row--${tone}`} data-focus-key={r.key}>
      <div className="pp-row__main">
        <span className="pp-ic pp-ic--big">
          <GameIcon art={itemArt(r.icon)} fallback="item-ore" size={32} decorative />
        </span>
        <div className="pp-row__words">
          {who ? <span className="sf-hint">{who}</span> : null}
          <span className="pp-row__t">
            {r.text}
            {r.gate ? <GateLink gate={r.gate} onNavigate={gates.onNavigate} /> : null}
          </span>
          {r.why && !r.quiet ? <span className="pp-row__why">{r.why}</span> : null}
          {r.also ? (
            <span className="sf-hint pp-also">
              {r.also.text.split(': see ')[0]}:{' '}
              <a
                className="pp-link"
                href={r.also.href}
                onClick={
                  onLink
                    ? (e) => {
                        e.preventDefault();
                        onLink(r.also?.href ?? '');
                      }
                    : undefined
                }
              >
                {r.also.label} ›
              </a>
            </span>
          ) : null}
        </div>
        {r.chip ? <span className={`pp-chip pp-chip--${r.chip.tone}`}>{r.chip.text}</span> : null}
      </div>
      {hasMore && !r.quiet ? (
        open ? (
          <>
            {r.hammers.length > 0 && r.kind !== 'keep' ? (
              <ul className="pp-hammers">
                {r.hammers.map((h, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: hammers are positional (save order).
                  <li key={i} className="pp-hammer">
                    <span className="a-cap">Hammer {i + 1}</span>
                    <span className="pp-hammer__move">
                      {h.from >= 0 ? (
                        <span className="pp-hammer__from">
                          <GameIcon art={itemArt(product(h.from)?.rawName)} size={24} decorative />
                          <span>{product(h.from)?.name}</span>
                        </span>
                      ) : (
                        <span className="pp-hammer__from">free</span>
                      )}
                      <span aria-hidden="true">›</span>
                      <span className="pp-hammer__to">
                        <GameIcon art={itemArt(product(h.to)?.rawName)} size={24} decorative />
                        <b>{product(h.to)?.name}</b>
                      </span>
                    </span>
                    <span className="sf-hint">
                      {h.shared
                        ? `two hammers share one ${product(h.to)?.name ?? ''} stock`
                        : `${n0(h.made)} made by your return (room ${n0(h.room)})`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {r.steps.length ? <Steps steps={r.steps} {...(onLink ? { onLink } : {})} /> : null}
          </>
        ) : (
          <button type="button" className="pp-more" aria-expanded={false} onClick={() => setOpen(true)}>
            {r.steps.length === 1 ? '1 step' : `${r.steps.length} steps`} ›
          </button>
        )
      ) : null}
    </li>
  );
}

/** One character's rows: the first three open, the rest behind "All producers". */
export function PlanRows({
  rows,
  p,
  who,
  onLink,
}: {
  rows: ProductionRow[];
  p: ProductionResult;
  who?: (r: ProductionRow) => string | null;
  onLink?: (href: string) => void;
}) {
  const [all, setAll] = useState(false);
  const ordered = [...rows].sort((a, b) => a.order - b.order);
  const shown = all ? ordered : ordered.slice(0, SHOWN);
  return (
    <>
      <ul className="pp-rows">
        {shown.map((r, i) => (
          <PlanRow
            key={r.key}
            r={r}
            p={p}
            open={i === 0}
            who={who ? who(r) : null}
            {...(onLink ? { onLink } : {})}
          />
        ))}
      </ul>
      {ordered.length > SHOWN && !all ? (
        <button type="button" className="pp-more" onClick={() => setAll(true)}>
          All producers ({ordered.length - SHOWN} more) ›
        </button>
      ) : null}
    </>
  );
}
