// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C1b: the Walkthrough tab any System page that owns a gate shows (the gate-homes registry,
// walkthrough.fact.gate-homes). It lists the Walkthroughs that hold one of the System's gates: each
// one's answer line, the Bottleneck line (FR-C12) and its steps, the focused one outlined (FR-C2). In
// Wave C only the Anvil owns gates with Walkthroughs (the next tab, and any shown Goal crafting at the
// anvil); later pages join by their registry row.
import type { EngineResult } from '@idleon-forge/engine/result';
import { WalkthroughSteps } from '../../now/walkthrough/Walkthrough';
import type { Session } from '../../shell/session';

export type GateWalkthrough = NonNullable<EngineResult['production']>['walkthroughs'][number];

/** The Walkthroughs that hold a gate of this System (FR-C1b). */
export function gateWalkthroughsOf(result: EngineResult, systemId: string): GateWalkthrough[] {
  if (systemId === 'anvil') return result.production?.walkthroughs ?? [];
  return [];
}

/** The item a Walkthrough builds (its focus key): the root line's item. */
export const walkthroughKey = (w: GateWalkthrough) => w.view.tree[0]?.item ?? w.view.targetId;

export function GateWalkthroughs({ s, items }: { s: Session; items: GateWalkthrough[] }) {
  void s;
  return (
    <div className="sf-col">
      {items.map((w) => (
        <section
          key={w.view.targetId}
          className="sf-sec wt-gate"
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
