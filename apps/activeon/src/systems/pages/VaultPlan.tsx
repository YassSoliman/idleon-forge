// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-58: the Vault plan tab of the Upgrade Vault page. It lays out the engine's `VaultPlan` and
// orders nothing itself: every step in the plan's order, grouped by the character that pays (log in
// on it to buy), each with its icon, its levels, its coins and its effect before and after. Then what
// is left over, the next unlock, the rows the plan leaves waiting and the maxed ones. Class and level
// only, never a name.
import { formatCoins } from '@idleon-forge/engine/now';
import type { VaultPlan, VaultPlanStep } from '@idleon-forge/engine/result';
import { VAULT_PLAN_WORDS as P } from '@idleon-forge/engine/systems-ui';
import { GameIcon } from '../../art/game/GameIcon';
import { vaultArt } from '../../art/game/systems-art';
import { WhoGlyph } from '../../design/who/WhoGlyph';
import type { Session } from '../../shell/session';

const n = (x: number) => x.toLocaleString('en-US');
/** "2.1B coins" -> "2.1B": the column says "coins" once. */
export const bareCoins = (x: number) => formatCoins(x).replace(/\s*coins?$/, '');

function who(s: Session, index: number): string {
  const c = s.result.characters.find((x) => x.index === index);
  return c ? `${c.classLabel} ${c.level}` : `slot ${index + 1}`;
}

function Step({ st, k }: { st: VaultPlanStep; k: number }) {
  const maxed = st.toLevel >= st.maxLevel;
  const tag = st.phase === 'list' && st.target !== null ? P.target(st.target) : P.cheapestLevels;
  return (
    <li className={`sf-row vp-step${st.phase === 'list' ? ' sf-row--gold' : ''}`}>
      <span className={`sf-n${st.phase === 'list' ? ' sf-n--gold' : ''} num`}>{k}</span>
      <GameIcon art={vaultArt(st.index)} size={32} decorative />
      <span className="sf-row__main">
        <span className="sf-strong">{st.name}</span>
        <span className="sf-small">
          {maxed ? P.maxedTo(st.fromLevel, st.toLevel) : P.levels(st.fromLevel, st.toLevel, st.maxLevel)}
        </span>
        {st.effectChange ? <span className="sf-hint vp-effect">{st.effectChange}</span> : null}
        <span className="sf-hint">
          {[tag, st.opensAt !== null ? P.opensAt(n(st.opensAt)) : null].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className="sf-row__end">
        <b className="num">{bareCoins(st.coins)}</b>
        <span className="sf-hint">coins</span>
      </span>
    </li>
  );
}

export function VaultPlanTab({ s, plan }: { s: Session; plan: VaultPlan }) {
  let k = 0;
  const groups = plan.pockets
    .filter((p) => p.steps > 0)
    .map((p) => ({ p, steps: plan.steps.filter((x) => x.payer === p.holder) }));
  return (
    <div className="sf-split vp">
      <div className="sf-col">
        <section className="sf-sec" aria-labelledby="vp-h">
          <div className="sf-sec__head">
            <h3 id="vp-h" className="a-h2">
              {P.stepsTitle}
            </h3>
            <span className="sf-hint">{P.stepCount(plan.steps.length)}</span>
          </div>
          <p className="sf-hint sf-text">{P.intro}</p>
          {groups.length === 0 ? <p className="sf-muted">{P.heroNone}</p> : null}
          {groups.map(({ p, steps }) => {
            const family = s.result.classFamilies?.[p.holder];
            return (
              <div key={p.holder} className="vp-pocket">
                <div className="vp-pocket__head">
                  {family ? (
                    <WhoGlyph family={family} classLabel={who(s, p.holder)} scale={1} decorative />
                  ) : null}
                  <span className="sf-strong">{P.pocket(who(s, p.holder))}</span>
                  <span className="sf-hint">
                    {[
                      P.pocketCoins(bareCoins(p.spent), bareCoins(p.coins)),
                      p.fromBank > 0 ? P.withdraw(bareCoins(p.fromBank)) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <ol className="sf-rows vp-steps">
                  {steps.map((st) => {
                    k += 1;
                    return <Step key={`${st.payer}:${st.index}:${st.fromLevel}`} st={st} k={k} />;
                  })}
                </ol>
              </div>
            );
          })}
        </section>
      </div>
      <aside className="sf-col">
        <section className="sf-sec" aria-labelledby="vp-left-h">
          <span id="vp-left-h" className="a-cap">
            {P.leftTitle}
          </span>
          <ul className="sf-hair">
            <li className="sf-hair__row">{P.left(bareCoins(plan.left))}</li>
            <li className="sf-hair__row">{P.after(n(plan.levels.after), plan.levels.bought)}</li>
            {plan.opened.length > 0 ? (
              <li className="sf-hair__row">{P.opened(plan.opened.map((o) => o.name).join(', '))}</li>
            ) : null}
            <li className="sf-hair__row">
              {plan.nextUnlock
                ? P.nextUnlock(plan.nextUnlock.levels, plan.nextUnlock.name, n(plan.nextUnlock.at))
                : P.allOpen}
            </li>
          </ul>
          <p className="sf-hint">{P.spendNote}</p>
        </section>
        {plan.waiting.length > 0 ? (
          <section className="sf-sec" aria-labelledby="vp-wait-h">
            <div className="sf-sec__head">
              <span id="vp-wait-h" className="a-cap">
                {P.waitingTitle}
              </span>
              <span className="sf-hint">{P.waitingHint}</span>
            </div>
            <ul className="sf-hair">
              {plan.waiting.map((w) => (
                <li key={w.index} className="sf-hair__row vp-wait">
                  <GameIcon art={vaultArt(w.index)} size={24} decorative />
                  <span className="sf-grow">
                    <span className="sf-small sf-strong">{w.name}</span>{' '}
                    <span className="sf-hint">{P.rowLevel(w.level, w.maxLevel)}</span>
                  </span>
                  <span className="sf-xs sf-t--mut">
                    {w.opensAt !== null
                      ? P.opensAt(n(w.opensAt))
                      : w.nextCoins !== null
                        ? P.next(bareCoins(w.nextCoins))
                        : P.notPriced}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {plan.maxed.length > 0 ? (
          <details className="sf-fold vp-maxed">
            <summary className="a-cap">{P.maxedTitle(plan.maxed.length)}</summary>
            <p className="sf-hint">{plan.maxed.map((m) => m.name).join(', ')}</p>
          </details>
        ) : null}
      </aside>
    </div>
  );
}
