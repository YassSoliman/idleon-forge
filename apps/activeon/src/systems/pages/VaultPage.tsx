// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/UpgradeVault.dc.html): the Upgrade Vault page on the System template. M26 FR-58:
// the answer is the Vault plan (every coin on the Vault, row by row) and its tab opens first; without a
// plan, M7's first Vault line (the picture's lit row). Other tabs: the tower (the next floors to open,
// "you are here", the newest open floors and the lit row), the Spend Plan's Vault lines and every
// upgrade (M21's picture). Data: area S's vault picture and M7's `vaultPlan`.
import { formatCoins } from '@idleon-forge/engine/now';
import {
  VAULT_PLAN_WORDS as P,
  type VaultFloorRow,
  type VaultPicture,
  VAULT_PAGE_WORDS as W,
} from '@idleon-forge/engine/systems-ui';
import { GameIcon } from '../../art/game/GameIcon';
import { vaultArt } from '../../art/game/systems-art';
import { SimplePage, SpendSection, StepsSection } from '../frame/SimplePage';
import { type FrameAnswer, frameAnswer, SystemFrame } from '../frame/SystemFrame';
import { VaultBody } from '../NewPictures';
import type { FullPageProps } from '../pages';
import { bareCoins, VaultPlanTab } from './VaultPlan';
import './pages.css';

type Look = 'next' | 'later' | 'open' | 'buy';
const n = (x: number) => x.toLocaleString('en-US');
/** "100M coins" -> "100M": the big number carries its unit beside it. */
const bare = (coins: string) => coins.replace(/ coins$/, '');

function Floor({ look }: { look: Look }) {
  const wall = look === 'open' ? 'var(--ok-soft)' : look === 'later' ? 'var(--sunk)' : 'var(--accent-soft)';
  const roof = look === 'open' ? 'var(--ok)' : look === 'later' ? 'var(--line-strong)' : 'var(--accent)';
  const win = look === 'later' ? 'var(--line-strong)' : 'var(--fg)';
  return (
    <svg aria-hidden="true" width="36" height="36" viewBox="0 0 12 12" shapeRendering="crispEdges">
      <rect x="1" y="2" width="10" height="9" fill={wall} />
      <rect x="0" y="1" width="12" height="2" fill={roof} />
      <rect x="3" y="5" width="2" height="2" fill={win} />
      <rect x="7" y="5" width="2" height="2" fill={win} />
      <rect x="5" y="8" width="2" height="3" fill={roof} />
    </svg>
  );
}

export default function VaultPage({ s, page }: FullPageProps) {
  const pic = page.pictures.find((p) => p.kind === 'vault') as VaultPicture | undefined;
  if (!pic) return <SimplePage s={s} page={page} />;
  const lit = pic.elements.find((e) => e.id === pic.lit) ?? null;
  // The next floor is the picture's unlock gap; a locked row without a known level (0) isn't drawn.
  const nextFloor = pic.nextUnlock
    ? (pic.elements.find((e) => !e.open && e.name === pic.nextUnlock?.name) ?? null)
    : null;
  const later = pic.elements
    .filter((e) => !e.open && e !== nextFloor && e.unlockAt > pic.totalLevels)
    .sort((a, b) => a.unlockAt - b.unlockAt);
  const locked = [...(nextFloor ? [nextFloor] : []), ...later.slice(0, nextFloor ? 1 : 2)];
  const open = pic.elements
    .filter((e) => e.open && e.id !== lit?.id)
    .sort((a, b) => b.unlockAt - a.unlockAt)
    .slice(0, 4);
  const gap = pic.nextUnlock ? W.gap(pic.nextUnlock.levels, pic.nextUnlock.name) : null;
  const plan = s.result.account.spendPlan?.vaultPlan ?? null;
  const planRows = plan ? new Set(plan.steps.map((x) => x.index)).size : 0;
  const cheapestWaiting = plan?.waiting.find((w) => w.nextCoins !== null)?.nextCoins ?? null;
  const answer: FrameAnswer =
    plan && plan.steps.length > 0
      ? {
          tone: 'gold',
          cap: P.cap,
          hero: P.hero(planRows, formatCoins(plan.spent)),
          sub: P.sub(plan.levels.bought, formatCoins(plan.left)),
          big: { value: bareCoins(plan.spent), unit: W.coins, note: P.bigNote(plan.levels.bought) },
        }
      : plan && cheapestWaiting !== null
        ? { tone: 'mint', cap: P.cap, hero: P.heroNone, sub: P.subNone(formatCoins(cheapestWaiting)) }
        : lit && lit.nextCoins !== null
          ? {
              tone: 'gold',
              cap: 'Do this next',
              hero: W.hero(lit.level, lit.name, formatCoins(lit.nextCoins)),
              sub: W.sub(gap),
              big: {
                value: bare(formatCoins(lit.nextCoins)),
                unit: W.coins,
                note: W.levelOf(lit.level, lit.maxLevel),
              },
            }
          : frameAnswer(page);
  const rows: { f: VaultFloorRow; look: Look; note: string; at: string }[] = [
    ...locked
      .slice(0, 2)
      .reverse()
      .map((f) => ({
        f,
        look: (f === nextFloor ? 'next' : 'later') as Look,
        note: f === nextFloor && pic.nextUnlock ? W.nextToOpen(pic.nextUnlock.levels) : W.opensLater,
        at: W.atLevels(
          n(f === nextFloor && pic.nextUnlock ? pic.totalLevels + pic.nextUnlock.levels : f.unlockAt),
        ),
      })),
    ...open.map((f) => ({
      f,
      look: 'open' as Look,
      note: W.rowNote(f.level, f.maxLevel, f.nextCoins !== null ? formatCoins(f.nextCoins) : null),
      at: W.openedAt(n(f.unlockAt)),
    })),
    ...(lit
      ? [
          {
            f: lit,
            look: 'buy' as Look,
            note: W.rowNote(
              lit.level,
              lit.maxLevel,
              lit.nextCoins !== null ? formatCoins(lit.nextCoins) : null,
            ),
            at: W.buyNext,
          },
        ]
      : []),
  ];
  const hereAfter = Math.min(2, locked.length) - 1;
  return (
    <SystemFrame
      s={s}
      page={page}
      answer={answer}
      tabs={[
        ...(plan
          ? [
              {
                id: 'plan',
                label: P.tab,
                badge: plan.steps.length || null,
                render: () => <VaultPlanTab s={s} plan={plan} />,
              },
            ]
          : []),
        {
          id: 'tower',
          label: W.tabs.tower,
          render: () => (
            <div className="sf-split">
              <div className="sf-col">
                <section className="sf-sec" aria-labelledby="uv-h">
                  <div className="sf-sec__head">
                    <h3 id="uv-h" className="a-h2">
                      {W.towerTitle}
                    </h3>
                    <span className="sf-hint">{W.towerHint}</span>
                  </div>
                  <ul className="sf-rows">
                    {hereAfter < 0 ? (
                      <li className="uv-li">
                        <Here total={pic.totalLevels} />
                      </li>
                    ) : null}
                    {rows.map((r, i) => (
                      <li key={r.f.id} className="uv-li">
                        <div
                          className={`sf-row${r.look === 'buy' || r.look === 'next' ? ' sf-row--gold' : ''}${r.look === 'later' ? ' sf-row--later' : ''}`}
                        >
                          <GameIcon
                            art={vaultArt(r.f.index)}
                            fallback={<Floor look={r.look} />}
                            size={32}
                            className={r.look === 'later' ? 'uv-later' : undefined}
                            decorative
                          />
                          <span className="sf-row__main">
                            <span className="sf-strong">{r.f.name}</span>
                            <span className="sf-hint">{r.note}</span>
                          </span>
                          <span
                            className={`sf-small ${r.look === 'buy' || r.look === 'next' ? 'sf-t--gold' : 'sf-t--mut'}`}
                          >
                            {r.at}
                          </span>
                        </div>
                        {i === hereAfter ? <Here total={pic.totalLevels} /> : null}
                      </li>
                    ))}
                  </ul>
                </section>
                <StepsSection page={page} quiet />
              </div>
              <aside className="sf-col">
                <SpendSection s={s} page={page} title={W.inPlan} />
                {page.spendLines.length > 0 ? <p className="sf-hint">{W.cheapest}</p> : null}
              </aside>
            </div>
          ),
        },
        {
          id: 'spend',
          label: W.tabs.plan,
          badge: page.spendLines.length || null,
          render: () => <SpendSection s={s} page={page} />,
        },
        {
          id: 'all',
          label: W.tabs.all(pic.elements.length),
          render: () => <VaultBody s={s} page={page} />,
        },
      ]}
    />
  );
}

function Here({ total }: { total: number }) {
  return (
    <div className="uv-here">
      <span className="a-cap sf-t--gold">{W.here}</span>
      <span className="sf-small sf-strong sf-t--gold">{W.levels(n(total))}</span>
    </div>
  );
}
