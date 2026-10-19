// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Cards overview on Characters (M8 "Cards view", M21 FR-C8 "By map"): one line per character, then
// the account's cards to grind grouped by the map that drops them. The character page's Cards tab is
// CardsTab.tsx (M24). The engine builds and words everything; this file only renders it (CSP: text and
// classes, never inline styles).
import type { CardsNowView, NowView } from '@idleon-forge/engine/now';
import type { GrindItem } from '@idleon-forge/engine/result';
import { PixelArt } from '../../design/art/PixelArt';
import { GLYPH, SourceLabel } from '../../design/atoms';
import { SeeOnMap } from '../../map/SeeOnMap';
import { useNowActions } from '../context';
import { CARDS_OPEN } from '../open-keys';
import './cards.css';

// M24: the character page's Cards tab body lives in CardsTab.tsx (board `Cards`); the registry
// (character-tabs.ts) still loads it from here.
export { CardsTab } from './CardsTab';

/** How the Cards view counts, and its Sources (#74: the wiki Cards page first, then the Toolbox credit). */
function Footer({ cards }: { cards: CardsNowView }) {
  return (
    <>
      {cards.caveats.map((c) => (
        <p key={c} className="cv-muted">
          {c}
        </p>
      ))}
      {cards.source ? (
        <div className="cv-sources">
          <SourceLabel source={cards.source} />
        </div>
      ) : null}
    </>
  );
}

function GrindItemView({ g, account }: { g: GrindItem; account: boolean }) {
  return (
    <li className="cv-grind-item" data-quick={g.quick ? 'yes' : 'no'}>
      <p className="cv-grind-head">
        <b>{g.name} card</b>
        <span className="cv-step num">
          {g.level > 0 ? `Lv ${g.level} → Lv ${g.level + 1}` : g.next.label}
        </span>
        {g.quick ? <span className="cv-tag cv-tag--quick">quick</span> : null}
        {g.farmingNow.length ? <span className="cv-tag">farming now: {g.farmingNow.join(', ')}</span> : null}
      </p>
      <p className="cv-line">
        {g.skill ? `${g.monster} (${g.skill.toLowerCase()})` : g.monster} · {g.chanceText}
      </p>
      <p className="cv-line">
        {g.owned > 0
          ? `${g.owned.toLocaleString('en-US')} of ${g.next.copies.toLocaleString('en-US')} copies · `
          : ''}
        {g.etaText}
        {account && g.fastest ? ` on ${g.fastest}` : ''}
      </p>
      <p className="cv-muted">
        {g.effect} · improves {account && g.helps.length ? g.helps.join(', ') : g.improves}
      </p>
    </li>
  );
}

/** "By map": the grind targets grouped under the map that drops them, in the engine's order. */
function GrindByMap({ items, account = false }: { items: readonly GrindItem[]; account?: boolean }) {
  const maps: { map: string; world: number; mapIndex: number; list: GrindItem[] }[] = [];
  for (const g of items) {
    const m = maps.find((x) => x.map === g.map && x.world === g.world);
    if (m) m.list.push(g);
    else maps.push({ map: g.map, world: g.world, mapIndex: g.mapIndex, list: [g] });
  }
  return (
    <div className="cv-maps">
      {maps.map((m) => (
        <section key={`${m.world}-${m.map}`} className="cv-map" aria-label={`${m.map}, World ${m.world}`}>
          <h4 className="cv-map-h">
            <PixelArt name={GLYPH.where} decorative />
            {m.map} <span className="cv-muted">World {m.world}</span>
          </h4>
          <SeeOnMap mapIndex={m.mapIndex} label={m.map} />
          <ol className="cv-grind">
            {m.list.map((g) => (
              <GrindItemView key={g.rawName} g={g} account={account} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** The Cards overview's collapsed line: "2 presets to fix". */
export function cardsSummary(cards: CardsNowView): string {
  const n = cards.characters.filter((c) => c.presetFits === false).length;
  if (n > 0) return `${n} ${n === 1 ? 'preset' : 'presets'} to fix`;
  return 'every preset fits';
}

/** The Cards overview on Characters: every character's card line, then the account's grind list. */
export function CardsOverview({ view }: { view: NowView }) {
  const actions = useNowActions();
  const cards = view.cards;
  if (!cards || cards.characters.length === 0) return null;
  return (
    <section aria-labelledby="cards-h" id="cards" className="cv-overview">
      <details
        className="cv-fold"
        open={actions.expanded.has(CARDS_OPEN)}
        onToggle={(e) => {
          const open = (e.currentTarget as HTMLDetailsElement).open;
          if (open !== actions.expanded.has(CARDS_OPEN)) actions.toggle(CARDS_OPEN);
        }}
      >
        <summary className="cv-fold-sum">
          <h3 id="cards-h" className="cv-overview-h">
            Cards
          </h3>
          <span className="cv-muted">{cardsSummary(cards)}</span>
        </summary>
        <ul className="cv-rows">
          {cards.characters.map((c) => (
            <li key={c.index}>
              <a
                href={c.href}
                className="cv-row"
                onClick={(e) => {
                  e.preventDefault();
                  actions.openTab(c.index, 'cards');
                }}
              >
                <span className="cv-row-name">{c.name}</span>
                <span className="cv-muted num">
                  {c.classLabel} {c.level}
                </span>
                <span className="cv-row-line">{c.overview}</span>
              </a>
            </li>
          ))}
        </ul>
        {cards.account.grind.length ? (
          <section className="cv-account" aria-labelledby="cards-account-h">
            <h4 id="cards-account-h" className="cv-h">
              Cards to grind, whole account ({cards.account.grind.length})
            </h4>
            <GrindByMap items={cards.account.grind} account />
            <Footer cards={cards} />
          </section>
        ) : null}
      </details>
    </section>
  );
}
