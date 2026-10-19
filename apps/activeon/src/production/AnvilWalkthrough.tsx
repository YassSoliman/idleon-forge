// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C4 (board m26/AnvilRecipes.dc.html, Walkthrough in dark): the Anvil page's Walkthrough tab.
// The next tab first: one row per material ("Get 1,000 more Void Bar (0 held)"), what feeds it from the
// Requirement Tree ("Void Ore · 2 held"), and its time ("no estimate" until its Supply is rated, FR-C12),
// then the craft itself with its gate. Then every other Walkthrough that holds an anvil gate (FR-C1b),
// and the full steps behind one button each. The engine words everything.
import type { ProductionResult } from '@idleon-forge/engine/production';
import { useState } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import { itemArt } from '../art/game/game-art';
import { GateLink, GateText, gateOf } from '../design/atoms/GateLink';
import { WalkthroughSteps } from '../now/walkthrough/Walkthrough';
import { walkthroughKey } from '../systems/frame/WalkthroughTab';
import { useGates } from './use-gates';
import './production.css';

const n0 = (n: number) => Math.round(n).toLocaleString('en-US');

export function AnvilWalkthrough({ p }: { p: ProductionResult }) {
  const t = p.nextTab;
  const gates = useGates();
  const [all, setAll] = useState(false);
  const others = p.walkthroughs.filter((w) => !t || w.view !== t.walkthrough);
  const view = t?.walkthrough ?? null;
  // The tree's lines under each material (depth 2): what it is made from.
  const under = new Map<string, string[]>();
  if (view) {
    let parent: string | null = null;
    for (const line of view.tree) {
      if (line.depth === 1 && line.item) parent = line.item;
      else if (line.depth === 2 && parent && line.item)
        under.set(parent, [...(under.get(parent) ?? []), line.text]);
    }
  }
  const stepFor = (raw: string, name: string) =>
    view?.steps.find((st) => st.text.includes(name) && !/^Craft \d+ Anvil Tab/.test(st.text)) ?? null;
  return (
    <div className="sf-col aw">
      {t ? (
        <section className="sf-sec" aria-labelledby="aw-h" data-focus-key={t.rawName}>
          <div className="sf-sec__head">
            <h3 id="aw-h" className="a-h2">
              Anvil Tab {t.tab}
            </h3>
            <span className="sf-hint">{t.bottleneck}</span>
          </div>
          <ol className="aw-steps">
            {t.materials.map((m, i) => {
              const missing = Math.max(0, m.need - m.held);
              const st = stepFor(m.rawName, m.name);
              const sub = under.get(m.rawName) ?? [];
              return (
                <li key={m.rawName} className={`aw-step${missing === 0 ? ' is-done' : ''}`}>
                  <span className="pp-ic">
                    <GameIcon art={itemArt(m.rawName)} size={32} decorative wiki={m.name} />
                  </span>
                  <span className="aw-step__body">
                    <span className="sf-strong">
                      {i + 1}.{' '}
                      {missing === 0
                        ? `${m.name}: all ${n0(m.need)} held`
                        : `Get ${n0(missing)} more ${m.name} (${n0(m.held)} held)`}
                    </span>
                    {st && !/^Check in game/.test(st.text) ? (
                      <span className="sf-hint">
                        <GateText text={st.text} {...gates} />
                      </span>
                    ) : missing > 0 ? (
                      <span className="sf-hint">where: check in game</span>
                    ) : null}
                    {sub.map((x) => (
                      <span key={x} className="sf-hint aw-sub">
                        {x}
                      </span>
                    ))}
                    <span className="aw-bar" aria-hidden="true">
                      <i style={{ width: `${Math.min(1, m.held / Math.max(1, m.need)) * 100}%` }} />
                    </span>
                  </span>
                  <span className="sf-hint aw-eta">{missing === 0 ? 'done' : 'no estimate'}</span>
                </li>
              );
            })}
            <li className="aw-step">
              <span className="pp-ic">
                <GameIcon art={itemArt(t.rawName)} size={32} decorative />
              </span>
              <span className="aw-step__body">
                <span className="sf-strong">
                  {t.materials.length + 1}. Craft Anvil Tab {t.tab} at the anvil
                </span>
                {(() => {
                  // The tab item is a recipe on the tab before it: a place to look, never itself. The chip
                  // opens that recipe but keeps the tab's own sprite, so "Anvil tab 3" never shows the
                  // tab IV item it crafts.
                  const tabBefore = gates.tabGates?.[t.tab - 2];
                  const g = gateOf(gates.tabGates, t.tab - 1, {
                    rawName: t.rawName,
                    name: `Anvil Tab ${t.tab}`,
                  });
                  return g ? (
                    <GateLink
                      gate={tabBefore ? { ...g, icon: tabBefore.icon } : g}
                      onNavigate={gates.onNavigate}
                    />
                  ) : null;
                })()}
                {t.smithing.lv !== null ? (
                  <span className="sf-hint">
                    needs Smithing {t.smithing.lv} (wiki)
                    {t.smithing.best !== null ? `: best on the account is ${t.smithing.best}` : ''}
                  </span>
                ) : null}
              </span>
              <span className="sf-hint aw-eta">last</span>
            </li>
          </ol>
          {view ? (
            <>
              <button
                type="button"
                className="n-link-btn"
                aria-expanded={all}
                onClick={() => setAll((v) => !v)}
              >
                {all ? 'Hide every step' : 'Every step and the full tree'}
              </button>
              {all ? <WalkthroughSteps view={view} self={t.rawName} /> : null}
            </>
          ) : null}
        </section>
      ) : (
        <p className="sf-note">Every W1-W4 anvil tab is owned.</p>
      )}
      {others.map((w) => (
        <section
          key={w.view.targetId}
          className="sf-sec"
          data-focus-key={walkthroughKey(w)}
          aria-label={w.title}
        >
          <h3 className="a-h2">{w.title}</h3>
          <WalkthroughSteps view={w.view} />
        </section>
      ))}
    </div>
  );
}
