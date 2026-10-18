// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Cards view (M8 "Cards view", owner request 2026-10-18), functional version: per character, every
// card preset as a row of slots, the best preset from owned cards as a list of swaps, and the cards to
// grind next; and the account overview, one row per character plus the merged grind list. The engine
// (packages/engine/src/collections/cards-view.ts) builds and words everything; this file only renders
// it in order (M10 red-team #5). Text is React text and styles are classes, never inline (CSP).
// It renders standalone today, as a section of Focus and of the Account section; it moves into the
// per-character tab registry (now/character-tabs.ts) when that lands.

import { sourceView } from '@idleon-forge/engine/now';
import type { CardChip, CardsView, CharacterCards, GrindItem, SourceRef } from '@idleon-forge/engine/result';
import { useNowActions } from '../context';
import { SourceLabel } from '../parts';
import './cards.css';

/** The `expanded` ids that keep a Cards section open (shared with the Now-list links). */
export const cardsOpenId = (index: number | 'account') =>
  `cards-open:${index === 'account' ? 'account' : `c${index}`}`;
export const cardsSectionId = (index: number | 'account') =>
  index === 'account' ? 'cards-overview' : `cards-c${index}`;

/** Opens a Cards section and scrolls to it (the Now list's "Cards view" link). */
export function useOpenCards() {
  const actions = useNowActions();
  return (index: number | 'account') => {
    if (!actions.expanded.has(cardsOpenId(index))) actions.toggle(cardsOpenId(index));
    // After React renders it open.
    requestAnimationFrame(() => {
      const el = document.getElementById(cardsSectionId(index));
      el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      el?.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true });
    });
  };
}

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

/** #74: the wiki Cards page first, with the Toolbox credit, through the Now screen's own Source label. */
function Sources({ sources }: { sources: readonly SourceRef[] }) {
  return (
    <div className="cv-sources">
      <SourceLabel source={sourceView(sources, false, 'cards.fact.drops')} />
    </div>
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
            {g.effect} · improves {account && g.helps.length ? `${g.helps.join(', ')}` : g.improves}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** One character's Cards view. */
export function CharacterCardsPanel({ view, cards }: { view: CharacterCards; cards: CardsView }) {
  if (view.unknown) return <p className="small muted">{view.unknown}</p>;
  return (
    <div className="cv">
      <h4 className="cv-h">
        Card presets{' '}
        <span className="small muted">
          {view.slotCount} slots{view.presetsLocked ? ` · ${view.presetsLocked}` : ''}
        </span>
      </h4>
      <ul className="cv-presets">
        {view.presets.map((p) => (
          <li key={p.n} className={`cv-preset${p.active ? ' cv-active' : ''}`}>
            <p className="cv-preset-head">
              <b>{view.presets.length > 1 ? `Preset ${p.n}` : 'Equipped'}</b>
              {p.active && view.presets.length > 1 ? (
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

      {view.recommendations.length ? (
        <>
          <h4 className="cv-h">Best preset from cards you own</h4>
          <ul className="cv-recs">
            {view.recommendations.map((r) => (
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

      <h4 className="cv-h">Cards to grind next</h4>
      {view.grind.length ? (
        <GrindList items={view.grind} />
      ) : (
        <p className="small muted">No card on its list drops on a map it can reach yet.</p>
      )}
      {view.grindNote ? <p className="small muted">{view.grindNote}</p> : null}
      {cards.caveats.map((c) => (
        <p key={c} className="small muted">
          {c}
        </p>
      ))}
      <Sources sources={cards.sources} />
    </div>
  );
}

/** Focus: the character's Cards view as a collapsible section. */
export function CardsSection({ index, cards }: { index: number; cards: CardsView | null | undefined }) {
  const actions = useNowActions();
  const view = cards?.characters.find((c) => c.index === index);
  if (!cards || !view) return null;
  const id = cardsOpenId(index);
  return (
    <details
      className="cards-view"
      id={cardsSectionId(index)}
      open={actions.expanded.has(id)}
      onToggle={(e) => {
        const open = (e.currentTarget as HTMLDetailsElement).open;
        if (open !== actions.expanded.has(id)) actions.toggle(id);
      }}
    >
      <summary>
        <span className="tag">Cards</span> <span className="small">{view.overview}</span>
      </summary>
      <CharacterCardsPanel view={view} cards={cards} />
    </details>
  );
}

/** Account: one row per character and the merged grind list. */
export function CardsOverview({
  cards,
  names,
}: {
  cards: CardsView | null | undefined;
  /** Display names by character index (UI only, never leaves the device). */
  names: ReadonlyMap<number, string>;
}) {
  const actions = useNowActions();
  const openCards = useOpenCards();
  if (!cards || cards.characters.length === 0) return null;
  const id = cardsOpenId('account');
  return (
    <details
      className="cards-view card"
      id={cardsSectionId('account')}
      open={actions.expanded.has(id)}
      onToggle={(e) => {
        const open = (e.currentTarget as HTMLDetailsElement).open;
        if (open !== actions.expanded.has(id)) actions.toggle(id);
      }}
    >
      <summary>
        <span className="tag">Cards</span> card presets and cards to grind, every character
      </summary>
      <ul className="cv-overview">
        {cards.characters.map((c) => (
          <li key={c.index}>
            <a
              href={`?c=${c.index}`}
              onClick={(e) => {
                e.preventDefault();
                actions.open(c.index);
                openCards(c.index);
              }}
            >
              {names.get(c.index) ?? c.who}
            </a>{' '}
            <span className="small muted">{c.who}</span>
            <p className="small">{c.overview}</p>
          </li>
        ))}
      </ul>
      {cards.account.grind.length ? (
        <>
          <h4 className="cv-h">Cards to grind, whole account</h4>
          <GrindList items={cards.account.grind} account />
        </>
      ) : null}
      {cards.caveats.map((c) => (
        <p key={c} className="small muted">
          {c}
        </p>
      ))}
      <Sources sources={cards.sources} />
    </details>
  );
}
