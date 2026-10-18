// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 F6 the Alchemy page body (docs/specs/M19-alchemy.md FR-18 to FR-23, TR-6), a lazy chunk: the four
// cauldron pots with the one bubble to level lit, the vial shelf, the liquid tubes and the Pay 2 Win
// grid (pages.ts draws M20's cauldron seats after it). M21 FR-S5: restyled in the design system (pots in
// their cauldron colours, the vial shelf labelling only the best three, G8's Pay 2 Win grid: one bar per
// line in M19's order with exactly one lit "next" bar and a tap sheet). It only formats `EngineResult.alchemy` (built in the worker); it adds no
// advice. Our own boxes, never game art (ADR 0009). Only the lit element and up to three others carry
// small labels; every other value is in the tap sheet (Design Lab v2 critique, issue 7).
import {
  brewLine,
  cellLine,
  liquidAmount,
  potLine,
  potName,
  rowLine,
  tubeLine,
} from '@idleon-forge/engine/alchemy-text';
import { formatCoins } from '@idleon-forge/engine/now';
import type { AlchemyResult, EngineResult, P2wCell, PotView } from '@idleon-forge/engine/result';
import { BODY_WORDS, FRAME_WORDS } from '@idleon-forge/engine/systems-ui';
import type { CSSProperties } from 'react';
import { cx } from '../design/atoms/Button';
import { usePictureSheet } from '../systems/PictureSheet';
import type { SystemPageBodyProps } from '../systems/pages';
import './alchemy.css';

/** Up to five rising bubbles: about the new bubbles the banked brew gives (M6). */
const RISE = ['a', 'b', 'c', 'd', 'e'];

const tenth = (n: number, max: number) =>
  max > 0 ? Math.max(0, Math.min(10, Math.round((n / max) * 10))) * 10 : 0;

/** FR-8: the element to light. A "See it" highlight wins; else the pick (the engine sets its key). */
function litKey(a: AlchemyResult, highlight: string | null): string | null {
  if (highlight) {
    const keys = [
      ...a.pots.map((p) => p.next?.actionKey),
      ...a.tubes.map((t) => t.actionKey),
      ...a.p2w.map((c) => c.actionKey),
      a.vialPick?.actionKey,
    ];
    if (keys.includes(highlight)) return highlight;
  }
  return a.pick?.actionKey ?? null;
}

function Pot({ pot, lit }: { pot: PotView; lit: boolean }) {
  const name = potName(pot.cauldron);
  return (
    <li className={`al-pot al-${pot.cauldron}${lit ? ' is-now' : ''}`}>
      <details>
        <summary>
          <span className="al-pot-art" aria-hidden="true">
            <span className="al-rise">
              {RISE.slice(0, Math.min(5, Math.round(pot.expectedNewBubbles))).map((id) => (
                <i key={id} />
              ))}
            </span>
            <span className="al-pot-body" />
          </span>
          {lit ? <span className="al-now">Level this</span> : null}
          <b>{name}</b>
          <span className="al-pot-next">{potLine(pot)}</span>
          {brewLine(pot) ? <span className="small muted">{brewLine(pot)}</span> : null}
        </summary>
        <div className="al-sheet">
          <p className="small">
            {pot.unlockedBubbles} bubbles unlocked
            {pot.nextUnlock ? ` · next new bubble: ${pot.nextUnlock}` : ''}
          </p>
          {pot.rows.length ? (
            <ol className="small">
              {pot.rows.map((r) => (
                <li key={r.rawName}>{rowLine(r)}</li>
              ))}
            </ol>
          ) : null}
          {pot.locked.length ? (
            <p className="small muted">{pot.locked.join(', ')}: unlocks with brew, spend it</p>
          ) : null}
        </div>
      </details>
    </li>
  );
}

function Column({ a, pot }: { a: AlchemyResult; pot: PotView }) {
  const chips = a.column[pot.cauldron] ?? [];
  return (
    <details className="al-column">
      <summary className="small">Show all {potName(pot.cauldron)} bubbles</summary>
      <ul className="al-chips">
        {chips.map((c) => (
          <li key={c.rawName} className={`chip${c.inPlan ? ' plan' : ''}${c.unlocked ? '' : ' locked'}`}>
            {c.name} {c.unlocked ? `Lv ${c.level}` : 'locked'}
            {c.unlocked && c.bandLevel !== null ? ` · band ${c.bandLevel}` : ''}
            {c.unlocked && c.pctOfMax !== null ? ` · ${c.pctOfMax}% of max` : ''}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** M7's price for a Pay 2 Win key, from its Spend Plan step (spend/candidates.ts `p2wRef`); null when unpriced. */
const p2wRef = (key: string) =>
  `alchemy-p2w.acquisition.${key
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\./g, '-')}`;
function p2wCost(result: EngineResult, key: string): number | null {
  const ref = p2wRef(key);
  for (const l of result.account?.spendPlan?.lines ?? [])
    for (const st of l.steps) if (st.sink === 'p2w' && st.ref === ref && st.coins !== null) return st.coins;
  return null;
}

/** G8: one Pay 2 Win line as a bar of level against cap; the lit "next" bar carries its words. */
function Cell({ c, lit, cost, onOpen }: { c: P2wCell; lit: boolean; cost: number | null; onOpen(): void }) {
  const pct = c.max ? tenth(Math.max(0, c.level), c.max) : 0;
  return (
    <li>
      <button
        type="button"
        className={cx('al-cell', c.closed && 'closed', lit && 'is-now')}
        aria-label={`${c.row} ${cellLine(c)}${lit ? `, ${BODY_WORDS.next}` : ''}`}
        onClick={onOpen}
      >
        <span className="al-cell__name">{`${c.row} ${c.label}`}</span>
        <span className="al-bar" style={{ '--pct': pct } as CSSProperties} aria-hidden="true" />
        {lit ? (
          <span className="al-cell__v num">
            {[cellLine(c), cost !== null ? formatCoins(cost) : null].filter(Boolean).join(' · ')}
          </span>
        ) : null}
      </button>
    </li>
  );
}

export default function AlchemyLab(p: SystemPageBodyProps) {
  const a = p.s.result.alchemy;
  const { open, sheet } = usePictureSheet(p.page.wiki ?? null);
  if (!a) return null;
  const lit = litKey(a, p.page.highlight);
  // G8: exactly one lit bar: the highlight's cell, else M19's next.
  const litCell = a.p2w.find((c) => lit !== null && c.actionKey === lit) ?? a.p2w.find((c) => c.next) ?? null;
  const labelled = new Set([
    ...a.vials.filter((v) => v.lit).map((v) => v.index),
    ...a.vials.filter((v) => v.rollTarget).map((v) => v.index),
  ]);
  return (
    <>
      {a.topStep ? <p className="al-step">{a.topStep.text}</p> : null}

      <section className="sy-pic" aria-labelledby="al-pots-h">
        <h3 id="al-pots-h" className="sy-h3">
          Cauldrons
        </h3>
        {a.planMet ? <p className="small">{a.notes.planMet}</p> : null}
        {a.notes.covers ? <p className="small muted">{a.notes.covers}</p> : null}
        <ul className="al-pots">
          {a.pots.map((pot) => (
            <Pot key={pot.cauldron} pot={pot} lit={lit !== null && pot.next?.actionKey === lit} />
          ))}
        </ul>
        {a.pots.map((pot) => (
          <Column key={pot.cauldron} a={a} pot={pot} />
        ))}
      </section>

      <section className="sy-pic" aria-labelledby="al-vials-h">
        <h3 id="al-vials-h" className="sy-h3">
          Vials
        </h3>
        <p className="small">
          {a.vials.filter((v) => v.level > 0).length} of {a.vials.length} unlocked
          {a.attempts ? ` · ${a.attempts.current} of ${a.attempts.max} attempts left` : ''}
        </p>
        <ol className="al-shelf" aria-label="Vial shelf">
          {a.vials.map((v) => (
            <li
              key={v.index}
              className={`al-vial${v.level > 0 ? ' have' : ''}${v.rollTarget ? ' easy' : ''}${v.lit ? ' is-now' : ''}`}
              title={v.level > 0 ? `${v.name} Lv ${v.level}` : `${v.name}: roll ${v.rollNeeded}+`}
            >
              <span className="al-glass" aria-hidden="true">
                <i className={`h${v.level > 0 ? Math.max(10, tenth(v.level, 13)) : 0}`} />
              </span>
              {labelled.has(v.index) ? (
                <span className="al-vlab">{v.level > 0 ? v.name : `${v.name} ${v.rollNeeded}+`}</span>
              ) : null}
            </li>
          ))}
        </ol>
        {a.vialPick ? (
          <p className="small">
            Next vial: {a.vialPick.name} {a.vialPick.from} → {a.vialPick.to}
          </p>
        ) : null}
        <details>
          <summary className="small">Every vial</summary>
          <ul className="small al-list">
            {a.vials.map((v) => (
              <li key={v.index}>
                {v.name}: {v.level > 0 ? `Lv ${v.level}` : `locked, roll ${v.rollNeeded}+`}
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className="sy-pic" aria-labelledby="al-tubes-h">
        <h3 id="al-tubes-h" className="sy-h3">
          Liquids
        </h3>
        <ul className="al-tubes">
          {a.tubes.map((t) => (
            <li
              key={t.index}
              className={`al-tube${t.open ? '' : ' locked'}${lit !== null && t.actionKey === lit ? ' is-now' : ''}`}
            >
              <span className="al-tube-g" aria-hidden="true">
                <i className={`h${t.open ? tenth(t.current, t.max) : 0}`} />
              </span>
              <b className="small">{t.name}</b>
              <span className="small">{tubeLine(t)}</span>
              {t.note ? <span className="small muted">{t.note}</span> : null}
            </li>
          ))}
        </ul>
        <p className="sr-only">
          {a.tubes
            .map((t) => `${t.name}: ${t.open ? `${liquidAmount(t.current)} of ${t.max}` : 'locked'}`)
            .join('; ')}
        </p>
      </section>

      {a.p2w.length ? (
        <section className="sy-pic" aria-labelledby="al-p2w-h">
          <h3 id="al-p2w-h" className="sy-h3">
            {BODY_WORDS.p2w}
          </h3>
          <ol className="al-grid">
            {a.p2w.map((c) => {
              const cost = p2wCost(p.s.result, c.key);
              return (
                <Cell
                  key={c.key}
                  c={c}
                  lit={litCell?.key === c.key}
                  cost={cost}
                  onOpen={() =>
                    open({
                      title: `${c.row} ${c.label}`,
                      rows: [
                        { label: FRAME_WORDS.value, value: cellLine(c) },
                        {
                          label: FRAME_WORDS.next,
                          value:
                            !c.closed && (c.max === null || c.level < c.max)
                              ? `${c.label} ${c.level + 1}`
                              : null,
                        },
                        { label: FRAME_WORDS.cost, value: cost !== null ? formatCoins(cost) : null },
                      ],
                    })
                  }
                />
              );
            })}
          </ol>
          <details>
            <summary className="small">Every upgrade</summary>
            <ul className="small al-list">
              {a.p2w.map((c) => (
                <li key={c.key}>
                  {c.row} {cellLine(c)}
                </li>
              ))}
            </ul>
          </details>
        </section>
      ) : null}
      {sheet}
    </>
  );
}
