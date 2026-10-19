// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C3 (board m26/AnvilRecipes.dc.html, Recipes in Daylight): the Anvil page's Recipes tab.
// A strip of anvil tabs (owned, locked, later), a filter (Wanted, the default: a Gear Plan target or a
// craft-next piece of any character; Craftable now; All), the open tab's counts, and one card per recipe:
// its sprite, name, "#6 on tab 3 · Smithing 39 (wiki)", its state, its materials as "held of need" and
// who wants it. The next tab's card sits beside it and opens the Walkthrough. Reads only (M17): the
// engine words everything (EngineResult.production).
import type { NextTabView, ProductionResult, RecipeView } from '@idleon-forge/engine/production';
import { useMemo, useState } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import { itemArt } from '../art/game/game-art';
import { WhoGlyph } from '../design/who/WhoGlyph';
import type { Session } from '../shell/session';
import './production.css';

type Filter = 'wanted' | 'craftable' | 'all';
const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'wanted', label: 'Wanted' },
  { id: 'craftable', label: 'Craftable now' },
  { id: 'all', label: 'All' },
];
const STATE_WORD: Record<RecipeView['state'], string> = {
  crafted: 'crafted',
  open: 'open',
  locked: 'locked',
  unknown: "can't tell",
};
const n0 = (n: number) => Math.round(n).toLocaleString('en-US');

/** The tab a focus key belongs to: a recipe's tab, or `tab-3`. */
function tabOfFocus(p: ProductionResult, focus: string | null): number | null {
  if (!focus) return null;
  const t = /^tab-(\d)$/.exec(focus);
  if (t) return Number(t[1]);
  for (const tab of p.tabs) if (tab.recipes.some((r) => r.rawName === focus)) return tab.tab;
  return null;
}

export function AnvilRecipes({
  s,
  p,
  focus,
  openWalkthrough,
}: {
  s: Session;
  p: ProductionResult;
  focus: string | null;
  openWalkthrough: () => void;
}) {
  const owned = p.tabs.filter((t) => t.status === 'owned');
  const focusTab = tabOfFocus(p, focus);
  const [tab, setTab] = useState<number>(() => focusTab ?? owned[owned.length - 1]?.tab ?? 1);
  const [filter, setFilter] = useState<Filter>(() => (focus && !/^tab-/.test(focus) ? 'all' : 'wanted'));
  const [seenFocus, setSeenFocus] = useState(focus);
  if (focus !== seenFocus) {
    setSeenFocus(focus);
    if (focusTab) setTab(focusTab);
    if (focus && !/^tab-/.test(focus)) setFilter('all');
  }
  const t = p.tabs.find((x) => x.tab === tab) ?? p.tabs[0];
  const shown = useMemo(() => {
    const rs = t?.recipes ?? [];
    if (filter === 'all') return rs;
    if (filter === 'craftable') return rs.filter((r) => r.craftable);
    return rs.filter((r) => (r.wantedBy?.length ?? 0) > 0 || (r.craftNext?.length ?? 0) > 0);
  }, [t, filter]);
  if (!t) return null;
  const name = (raw: string) => p.names[raw] ?? raw.replace(/_/g, ' ');
  return (
    <div className="sf-split ar">
      <div className="sf-col">
        <div className="ar-bar">
          <fieldset className="ar-tabs">
            <legend className="sr-only">Anvil tabs</legend>
            {p.tabs.map((x) => (
              <button
                key={x.tab}
                type="button"
                className={`ar-tab${x.tab === tab ? ' is-on' : ''}${x.status !== 'owned' ? ' is-off' : ''}`}
                aria-pressed={x.tab === tab}
                disabled={x.status === 'later'}
                onClick={() => setTab(x.tab)}
                data-focus-key={`tab-${x.tab}`}
              >
                <span className="ar-ic">
                  <GameIcon
                    art={itemArt(`EquipmentSmithingTabs${Math.max(2, x.tab)}`)}
                    size={24}
                    decorative
                  />
                </span>
                <span className="ar-tab__name">Tab {x.tab}</span>
                <span className="ar-tab__sub">
                  {x.status === 'owned' ? `${x.crafted} crafted` : x.status === 'later' ? 'later' : 'locked'}
                </span>
              </button>
            ))}
          </fieldset>
          <fieldset className="a-seg ar-filter">
            <legend className="sr-only">Show</legend>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`a-seg__option sf-seg-opt${f.id === filter ? ' a-seg__option--on' : ''}`}
                aria-pressed={f.id === filter}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </fieldset>
        </div>
        <p className="ar-head">
          <span className="a-h2">Tab {t.tab}</span>{' '}
          <span className="sf-hint">
            {t.status === 'owned'
              ? `${t.crafted} crafted · ${t.open} open · ${t.locked} locked`
              : `locked: ${t.recipes.length} recipes`}
            {filter === 'wanted' ? ` · showing the ${shown.length} your characters want` : ''}
          </span>
        </p>
        {shown.length === 0 ? (
          <p className="sf-note">
            {filter === 'wanted'
              ? 'No character wants a recipe on this tab right now. Show all to browse it.'
              : 'Nothing here can be crafted right now.'}
          </p>
        ) : (
          <ul className="ar-grid">
            {shown.map((r) => (
              <RecipeCard key={r.rawName} s={s} r={r} tab={t.tab} name={name} held={p.held} />
            ))}
          </ul>
        )}
        <p className="sf-note">
          "Wanted" is a Gear Plan target or a craft-next piece of any character. Materials count storage, bags
          and the Forge's output. Smithing levels are the wiki's: the game data has no level per recipe.
        </p>
      </div>
      <aside className="sf-col">
        {p.nextTab ? <NextTabCard t={p.nextTab} open={openWalkthrough} /> : null}
      </aside>
    </div>
  );
}

function RecipeCard({
  s,
  r,
  tab,
  name,
  held,
}: {
  s: Session;
  r: RecipeView;
  tab: number;
  name: (raw: string) => string;
  held: Record<string, number>;
}) {
  const who = [...new Set([...(r.craftNext ?? []), ...(r.wantedBy ?? [])])];
  const rows = s.view.roster;
  // M18 FR-15: a piece the recipe uses that a wanting character wears counts as held.
  const worn = new Set(
    (s.result.gear?.characters ?? [])
      .filter((g) => who.includes(g.index))
      .flatMap((g) => g.slots.map((x) => x.equipped?.rawName ?? '')),
  );
  const label = (i: number) => {
    const c = rows.find((x) => x.index === i);
    return c ? `${c.classLabel} Lv ${c.level}` : `Character ${i + 1}`;
  };
  const chip =
    (r.craftNext?.length ?? 0) > 0 && r.craftable
      ? { text: 'craft now', tone: 'gold' }
      : {
          text: STATE_WORD[r.state],
          tone: r.state === 'crafted' ? 'ok' : r.state === 'locked' ? 'mut' : 'plain',
        };
  return (
    <li className="a-tile ar-card" data-focus-key={r.rawName}>
      <span className="ar-ic ar-ic--big">
        <GameIcon art={itemArt(r.rawName)} size={32} decorative wiki={name(r.rawName)} />
      </span>
      <div className="ar-card__body">
        <div className="ar-card__top">
          <span className="ar-card__name">{name(r.rawName)}</span>
          <span className={`ar-chip ar-chip--${chip.tone}`}>{chip.text}</span>
        </div>
        <span className="sf-hint">
          #{r.n} on tab {tab}
          {r.lv !== null ? ` · Smithing ${r.lv} (wiki)` : ''}
          {r.state === 'locked' ? ` · ${r.from}` : ''}
        </span>
        <ul className="ar-mats" aria-label="Materials">
          {r.materials.map(([m, need]) => {
            const h = held[m] ?? 0;
            const isWorn = h < need && worn.has(m);
            const ok = h >= need || isWorn;
            return (
              <li key={m} className={`ar-mat${ok ? ' is-held' : ''}`}>
                <GameIcon art={itemArt(m)} size={16} decorative />
                <span>
                  {isWorn ? `${name(m)}: worn` : `${n0(Math.min(h, need))} of ${n0(need)} ${name(m)}`}
                </span>
              </li>
            );
          })}
        </ul>
        {who.length ? (
          <span className="ar-who">
            {who.slice(0, 3).map((i) => (
              <WhoGlyph
                key={i}
                family={s.view.families?.[i] ?? 'beginner'}
                classLabel={label(i)}
                scale={1}
                decorative
              />
            ))}
            <span className="sf-hint">
              {who.length === 1 ? label(who[0] as number) : `${who.length} characters`}
            </span>
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function NextTabCard({ t, open }: { t: NextTabView; open: () => void }) {
  return (
    <section className="a-tile sf-tile ar-next" aria-labelledby="ar-next-h" data-focus-key={`tab-${t.tab}`}>
      <div className="ar-next__head">
        <span className="ar-ic ar-ic--big">
          <GameIcon art={itemArt(t.rawName)} size={32} decorative wiki={`Anvil Tab ${t.tab}`} />
        </span>
        <span className="sf-row__main">
          <span id="ar-next-h" className="a-h2">
            Tab {t.tab} is locked
          </span>
          <span className="sf-hint">Craft Anvil Tab {t.tab} once and every anvil gets it</span>
        </span>
      </div>
      <dl className="sf-hair ar-next__mats">
        {t.materials.map((m) => (
          <div key={m.rawName} className="sf-hair__row">
            <dt className="ar-mat">
              <GameIcon art={itemArt(m.rawName)} size={24} decorative wiki={m.name} />
              <span>{m.name}</span>
            </dt>
            <dd className={`sf-strong num${m.held >= m.need ? ' sf-t--mint' : ''}`}>
              {n0(Math.min(m.held, m.need))} of {n0(m.need)}
            </dd>
          </div>
        ))}
      </dl>
      {t.smithing.lv !== null ? <p className="sf-strong">Smithing {t.smithing.lv} (wiki)</p> : null}
      {t.smithing.best !== null ? (
        <p className="sf-hint">
          Best Smithing on the account: {t.smithing.best}. The game data has no Smithing level per recipe, so
          the wiki's is shown.
        </p>
      ) : null}
      <button type="button" className="a-btn a-btn--primary ar-next__go" onClick={open}>
        Open the Walkthrough ›
      </button>
    </section>
  );
}
