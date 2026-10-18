// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Cards view (M8 "Cards view", owner request 2026-10-18), functional version: the character page's
// Cards tab shows every card preset as a row of slots, the best preset from owned cards as a list of
// swaps, and the cards to grind next. The Cards overview on the Roster has one line per character plus
// the merged grind list. The engine (packages/engine/src/collections/cards-view.ts and now/cards-view.ts)
// builds and words everything; this file only renders it in order (M10 red-team #5). Text is React text
// and styles are classes, never inline (CSP).
import type { CardsNowView, CharacterCardsView, NowView } from '@idleon-forge/engine/now';
import type { CardChip, GrindItem } from '@idleon-forge/engine/result';
import { SourceLabel } from '../../design/atoms/SourceLabel';
import type { CharacterTabProps } from '../character-tabs';
import { useNowActions } from '../context';
import { CARDS_OPEN } from '../open-keys';
import './cards.css';

const stars = (c: CardChip) =>
  c.level > 0 ? `Lv ${c.level}${c.stars > 0 ? ` · ${'★'.repeat(c.stars)}` : ''}` : 'not owned';

function Slot({ card }: { card: CardChip | null }) {
  if (!card)
    return (
      <li className="cv-slot cv-empty">
        <span className="cv-slot-name">empty slot</span>
      </li>
    );
  return (
    <li className={`cv-slot${card.passive ? ' cv-passive' : ''}`}>
      <span className="cv-slot-name">{card.name}</span>
      <span className="cv-slot-lv">{stars(card)}</span>
      <span className="cv-slot-fx">{card.effect}</span>
      {card.passive ? <span className="cv-slot-note">passive: works unequipped</span> : null}
    </li>
  );
}

/** How the Cards view counts, and its Sources (#74: the wiki Cards page first, then the Toolbox credit). */
function Footer({ cards }: { cards: CardsNowView }) {
  return (
    <>
      {cards.caveats.map((c) => (
        <p key={c} className="small muted">
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

function GrindList({ items, account = false }: { items: readonly GrindItem[]; account?: boolean }) {
  return (
    <ol className="cv-grind">
      {items.map((g) => (
        <li key={g.rawName} className={`cv-grind-item${g.quick ? ' cv-quick' : ''}`}>
          <p className="cv-grind-head">
            <b>{g.name} card</b>{' '}
            <span className="cv-step">
              {g.level > 0 ? `Lv ${g.level} → Lv ${g.level + 1}` : g.next.label}
            </span>
            {g.quick ? <span className="cv-badge cv-badge-quick">quick</span> : null}
            {g.farmingNow.length ? (
              <span className="cv-badge cv-badge-farm">farming now: {g.farmingNow.join(', ')}</span>
            ) : null}
          </p>
          <p className="small">
            {g.skill ? `${g.monster} (${g.skill.toLowerCase()})` : g.monster} · {g.map} (W{g.world}) ·{' '}
            {g.chanceText}
          </p>
          <p className="small">
            {g.owned > 0
              ? `${g.owned.toLocaleString('en-US')} of ${g.next.copies.toLocaleString('en-US')} copies · `
              : ''}
            {g.etaText}
            {account && g.fastest ? ` on ${g.fastest}` : ''}
          </p>
          <p className="small muted">
            {g.effect} · improves {account && g.helps.length ? g.helps.join(', ') : g.improves}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** One character's Cards view. */
export function CharacterCardsPanel({ c, cards }: { c: CharacterCardsView; cards: CardsNowView }) {
  if (c.unknown) return <p className="small muted">{c.unknown}</p>;
  return (
    <div className="cv">
      <p className="small cv-summary">{c.overview}</p>
      <h3 className="cv-h">
        Card presets{' '}
        <span className="small muted">
          {c.slotCount} slots{c.presetsLocked ? ` · ${c.presetsLocked}` : ''}
        </span>
      </h3>
      <ul className="cv-presets">
        {c.presets.map((p) => (
          <li key={p.n} className={`cv-preset${p.active ? ' cv-active' : ''}`}>
            <p className="cv-preset-head">
              <b>{c.presets.length > 1 ? `Preset ${p.n}` : 'Equipped'}</b>
              {p.active && c.presets.length > 1 ? (
                <span className="cv-badge cv-badge-use">in use</span>
              ) : null}
              <span className={`cv-badge${p.fitsTarget ? ' cv-badge-fit' : ''}`}>
                {p.label}
                {p.fitsTarget ? ' ✓' : ''}
              </span>
            </p>
            <ul className="cv-slots" aria-label={`Preset ${p.n} slots`}>
              {p.slots.map((s, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional.
                <Slot key={i} card={s} />
              ))}
            </ul>
            {p.set ? (
              <p className="small">
                Card set: <b>{p.set.name}</b> tier {p.set.tier} ({p.set.bonus})
              </p>
            ) : p.active ? (
              <p className="small muted">No card set equipped</p>
            ) : null}
          </li>
        ))}
      </ul>

      {c.recommendations.length ? (
        <>
          <h3 className="cv-h">Best preset from cards you own</h3>
          <ul className="cv-recs">
            {c.recommendations.map((r) => (
              <li key={r.activity} className="cv-rec">
                <p className="cv-rec-head">
                  <b>For {r.activity}</b>{' '}
                  <span className="small muted">
                    {r.reason === 'afk-target' ? '(its AFK Target)' : '(another of its Roles)'}
                  </span>
                </p>
                <p className="small">{r.where}</p>
                {r.done ? (
                  <p className="small cv-done">Already the best you own ✓</p>
                ) : (
                  <ul className="cv-swaps">
                    {r.swaps.map((s) => (
                      <li key={s.text}>
                        {s.from ? (
                          <>
                            <span className="cv-from">{s.from.name}</span> <span aria-hidden="true">→</span>
                            <span className="sr-only">swap for</span>{' '}
                          </>
                        ) : (
                          <span className="cv-add muted">empty slot → </span>
                        )}
                        <span className="cv-to">{s.to.name}</span>{' '}
                        <span className="small muted">
                          {stars(s.to)} · {s.to.effect}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {r.setNote ? (
                  <p className="small">{r.setNote}</p>
                ) : r.set ? (
                  <p className="small muted">Card set: {r.set.name} ✓</p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3 className="cv-h">Cards to grind next</h3>
      {c.grind.length ? <GrindList items={c.grind} /> : <p className="small muted">{c.grindEmpty}</p>}
      {c.grindNote ? <p className="small muted">{c.grindNote}</p> : null}
      <Footer cards={cards} />
    </div>
  );
}

/** The character page's Cards tab (character-tabs.ts). */
export function CardsTab({ view, index }: CharacterTabProps) {
  const c = view.cards?.characters.find((x) => x.index === index);
  if (!view.cards || !c) return <p className="small muted">No card data for this character yet.</p>;
  return <CharacterCardsPanel c={c} cards={view.cards} />;
}

/** The Cards overview on the Roster: every character's card line, then the account's grind list. */
/** The Cards overview's collapsed line: "2 presets to fix". */
export function cardsSummary(cards: CardsNowView): string {
  const n = cards.characters.filter((c) => c.presetFits === false).length;
  if (n > 0) return `${n} ${n === 1 ? 'preset' : 'presets'} to fix`;
  return 'every preset fits';
}

export function CardsOverview({ view }: { view: NowView }) {
  const actions = useNowActions();
  const cards = view.cards;
  if (!cards || cards.characters.length === 0) return null;
  return (
    <section aria-labelledby="cards-h" id="cards" className="builds-overview cards-overview">
      <details
        className="bo-fold"
        open={actions.expanded.has(CARDS_OPEN)}
        onToggle={(e) => {
          const open = (e.currentTarget as HTMLDetailsElement).open;
          if (open !== actions.expanded.has(CARDS_OPEN)) actions.toggle(CARDS_OPEN);
        }}
      >
        <summary className="bo-summary">
          <h2 id="cards-h" className="section-h">
            Cards
          </h2>
          <span className="bo-count small">{cardsSummary(cards)}</span>
          <span className="bo-chev" aria-hidden="true">
            ›
          </span>
        </summary>
        <ul className="bo-list">
          {cards.characters.map((c) => (
            <li key={c.index}>
              <a
                href={c.href}
                className="bo-row"
                onClick={(e) => {
                  e.preventDefault();
                  actions.openTab(c.index, 'cards');
                }}
              >
                <span className="bo-top">
                  <span className="r-name">{c.name}</span>
                  <span className="r-class">
                    {c.classLabel} · lv {c.level}
                  </span>
                </span>
                <span className="bo-status small">{c.overview}</span>
              </a>
            </li>
          ))}
        </ul>
        {cards.account.grind.length ? (
          <details className="cv-account">
            <summary>Cards to grind, whole account ({cards.account.grind.length})</summary>
            <GrindList items={cards.account.grind} account />
            <Footer cards={cards} />
          </details>
        ) : null}
      </details>
    </section>
  );
}
