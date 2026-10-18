// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Cards view (M8 "Cards view"), drawn as the Design Lab picks (M21 FR-C8, `character.cards.*`):
// - "Card rack": each card preset as a rack of our own card frames with level pips, the worn preset
//   ringed and its set as a badge on the rack; a card's effect sits in its tap sheet (DS-20), never
//   small text in the frame;
// - "Before / after racks": the rack in use, an arrow, the best rack from cards you own, one sentence;
// - "By map": the cards to grind next grouped by the map that drops them;
// - the Cards overview on Characters: one line per character, then the account's grind list.
// The engine (collections/cards-view.ts, now/cards-view.ts) builds and words everything; this file only
// renders it. Text is React text and styles are classes, never inline (CSP).
import type { CardsNowView, CharacterCardsView, NowView } from '@idleon-forge/engine/now';
import type { CardChip, GrindItem, PresetRecommendation } from '@idleon-forge/engine/result';
import { useState } from 'react';
import { PixelArt } from '../../design/art/PixelArt';
import { GLYPH } from '../../design/atoms/glyphs';
import { Sheet } from '../../design/atoms/Sheet';
import { SourceLabel } from '../../design/atoms/SourceLabel';
import type { CharacterTabProps } from '../character-tabs';
import { useNowActions } from '../context';
import { CARDS_OPEN } from '../open-keys';
import './cards.css';

const levelWords = (c: CardChip) =>
  c.level > 0
    ? `Lv ${c.level}${c.stars > 0 ? ` · ${c.stars} ${c.stars === 1 ? 'star' : 'stars'}` : ''}`
    : 'not owned';

/** One card frame; a tap opens its sheet (name, level, what it gives). */
function Card({ card, onOpen }: { card: CardChip | null; onOpen(c: CardChip): void }) {
  if (!card)
    return (
      <li className="cv-card" data-empty="yes">
        <span className="cv-card-name">empty slot</span>
      </li>
    );
  return (
    <li className="cv-card" data-passive={card.passive ? 'yes' : 'no'}>
      <button type="button" className="cv-card-btn" onClick={() => onOpen(card)}>
        <PixelArt name="v2-character-card" decorative />
        <span className="cv-card-name">{card.name}</span>
        <span className="cv-pips num" aria-label={levelWords(card)}>
          {card.level > 0 ? `Lv ${card.level}` : 'none'}
        </span>
      </button>
    </li>
  );
}

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
  const maps: { map: string; world: number; list: GrindItem[] }[] = [];
  for (const g of items) {
    const m = maps.find((x) => x.map === g.map && x.world === g.world);
    if (m) m.list.push(g);
    else maps.push({ map: g.map, world: g.world, list: [g] });
  }
  return (
    <div className="cv-maps">
      {maps.map((m) => (
        <section key={`${m.world}-${m.map}`} className="cv-map" aria-label={`${m.map}, World ${m.world}`}>
          <h4 className="cv-map-h">
            <PixelArt name={GLYPH.where} decorative />
            {m.map} <span className="cv-muted">World {m.world}</span>
          </h4>
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

/** "Before / after racks": the cards that change, from the rack in use to the best you own. */
function BestSwap({ r }: { r: PresetRecommendation }) {
  return (
    <li className="cv-rec">
      <p className="cv-rec-head">
        <b>For {r.activity}</b>{' '}
        <span className="cv-muted">
          {r.reason === 'afk-target' ? '(its AFK Target)' : '(another of its Roles)'}
        </span>
      </p>
      <p className="cv-line">{r.where}</p>
      {r.done ? (
        <p className="cv-line cv-done">
          <PixelArt name={GLYPH.check} decorative /> Already the best you own
        </p>
      ) : (
        <ul className="cv-swaps">
          {r.swaps.map((s) => (
            <li key={s.text} className="cv-swap">
              <span className="cv-swap-from" data-empty={s.from ? 'no' : 'yes'}>
                {s.from ? s.from.name : 'empty slot'}
              </span>
              <PixelArt name={GLYPH.arrowRight} decorative />
              <span className="sr-only">swap for</span>
              <span className="cv-swap-to">
                {s.to.name} <span className="cv-muted num">{levelWords(s.to)}</span>
              </span>
              <span className="cv-muted cv-swap-fx">{s.to.effect}</span>
            </li>
          ))}
        </ul>
      )}
      {r.setNote ? (
        <p className="cv-line">{r.setNote}</p>
      ) : r.set ? (
        <p className="cv-muted">Card set: {r.set.name}</p>
      ) : null}
    </li>
  );
}

/** One character's Cards view. */
export function CharacterCardsPanel({ c, cards }: { c: CharacterCardsView; cards: CardsNowView }) {
  const [open, setOpen] = useState<CardChip | null>(null);
  if (c.unknown) return <p className="cv-muted">{c.unknown}</p>;
  return (
    <div className="cv">
      <p className="cv-summary">{c.overview}</p>
      <section aria-labelledby={`cv-${c.index}-racks`}>
        <h3 id={`cv-${c.index}-racks`} className="cv-h">
          Card presets{' '}
          <span className="cv-muted num">
            {c.slotCount} slots{c.presetsLocked ? ` · ${c.presetsLocked}` : ''}
          </span>
        </h3>
        <ul className="cv-racks">
          {c.presets.map((p) => (
            <li key={p.n} className="cv-rack" data-active={p.active ? 'yes' : 'no'}>
              <p className="cv-rack-head">
                <b>{c.presets.length > 1 ? `Preset ${p.n}` : 'Equipped'}</b>
                {p.active && c.presets.length > 1 ? <span className="cv-tag cv-tag--use">in use</span> : null}
                <span className="cv-tag" data-fit={p.fitsTarget ? 'yes' : 'no'}>
                  {p.fitsTarget ? <PixelArt name={GLYPH.check} decorative /> : null}
                  {p.label}
                </span>
                {p.set ? (
                  <span className="cv-tag cv-tag--set">
                    {p.set.name} set · tier {p.set.tier}
                  </span>
                ) : null}
              </p>
              <ul className="cv-cards" aria-label={`Preset ${p.n} slots`}>
                {p.slots.map((s, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional.
                  <Card key={i} card={s} onOpen={setOpen} />
                ))}
              </ul>
              {p.set ? (
                <p className="cv-muted">Set bonus: {p.set.bonus}</p>
              ) : p.active ? (
                <p className="cv-muted">No card set equipped</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {c.recommendations.length ? (
        <section aria-labelledby={`cv-${c.index}-best`}>
          <h3 id={`cv-${c.index}-best`} className="cv-h">
            Best preset from cards you own
          </h3>
          <ul className="cv-recs">
            {c.recommendations.map((r) => (
              <BestSwap key={r.activity} r={r} />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby={`cv-${c.index}-grind`}>
        <h3 id={`cv-${c.index}-grind`} className="cv-h">
          Cards to grind next
        </h3>
        {c.grind.length ? <GrindByMap items={c.grind} /> : <p className="cv-muted">{c.grindEmpty}</p>}
        {c.grindNote ? <p className="cv-muted">{c.grindNote}</p> : null}
      </section>
      <Footer cards={cards} />
      <Sheet open={open !== null} title={open ? `${open.name} card` : ''} onClose={() => setOpen(null)}>
        {open ? (
          <div className="cv-sheet">
            <p className="num">{levelWords(open)}</p>
            <p>{open.effect}</p>
            {open.passive ? <p className="cv-muted">Passive: it works without being equipped.</p> : null}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

/** The character page's Cards tab (character-tabs.ts). */
export function CardsTab({ view, index }: CharacterTabProps) {
  const c = view.cards?.characters.find((x) => x.index === index);
  if (!view.cards || !c) return <p className="cv-muted">No card data for this character yet.</p>;
  return <CharacterCardsPanel c={c} cards={view.cards} />;
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
