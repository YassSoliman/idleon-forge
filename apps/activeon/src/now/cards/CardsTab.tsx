// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The character page's Cards tab, M24 board `Cards` (I-character-b; M8's Cards view). The answer first:
// the swaps from cards already owned, as card tiles before → after with what each one gives. Then the
// presets as slot rows, the cards to farm next as a table with who farms them (three, the rest on
// demand), and the card sets closest to their next tier. Stars are the game's word for a card's level
// (level = stars + 1); this tab says stars only. The engine words everything; this file only renders.
import type { CardsNowView, CharacterCardsView } from '@idleon-forge/engine/now';
import type { CardChip, CardSetProgress, GrindItem, PresetRecommendation } from '@idleon-forge/engine/result';
import { useState } from 'react';
import { Sprite } from '../../art/sprites/Sprite';
import { Answer, TabSource } from '../../characters/tabs/kit';
import { Meter, Sheet } from '../../design/atoms';
import { SeeOnMap } from '../../map/SeeOnMap';
import type { CharacterTabProps } from '../character-tabs';
import './cards-tab.css';

const starWord = (n: number) => `${n} ${n === 1 ? 'star' : 'stars'}`;
/** "3 stars", or "not owned" (the game's word for a card's level is its stars). */
const starsOf = (c: Pick<CardChip, 'level' | 'stars'>) => (c.level > 0 ? starWord(c.stars) : 'not owned');

/** "+28 Base AGI" -> ["+28", "Base AGI"]; a text without a leading number stays whole. */
function splitGain(effect: string): [string, string] {
  const m = /^([+-]?[\d.,]+%?)\s+(.*)$/.exec(effect);
  return m ? [m[1] as string, m[2] as string] : [effect, ''];
}

/** The answer's recommendation: the AFK Target's first, then a Role's. */
const recOf = (c: CharacterCardsView): PresetRecommendation | null =>
  c.recommendations.find((r) => r.reason === 'afk-target') ?? c.recommendations[0] ?? null;

function CardTile({ card, out }: { card: CardChip | null; out?: boolean }) {
  return (
    <span className="ct-card" data-out={out ? 'yes' : 'no'}>
      <span className="ct-card__art">
        <Sprite name="item-card-frame" size={48} decorative />
      </span>
      <span className="ct-card__name">{card ? card.name : 'Empty slot'}</span>
      {card ? <span className="tb-xs">{out ? `gives ${card.effect}` : starsOf(card)}</span> : null}
    </span>
  );
}

function SwapAnswer({ c, r }: { c: CharacterCardsView; r: PresetRecommendation }) {
  const preset = r.preset ? c.presets.find((p) => p.n === r.preset) : undefined;
  const cap = [
    r.preset ? `Card preset ${r.preset}` : 'Equipped cards',
    preset?.active ? 'in use' : null,
    `for ${r.activity}`,
  ]
    .filter(Boolean)
    .join(' · ');
  if (r.done)
    return (
      <Answer
        tone="ok"
        icon="status-check"
        cap={cap}
        title={`Nothing to swap: these are the best cards you own for ${r.activity}`}
        sub={r.setNote ?? (r.set ? `Card set: ${r.set.name}, tier ${r.set.tier}` : null)}
      />
    );
  const n = r.swaps.length;
  return (
    <Answer
      tone="gold"
      cap={cap}
      title={`Swap ${n} ${n === 1 ? 'card' : 'cards'} for ${r.activity}`}
      sub={`${r.where} · from cards you already own`}
    >
      <ul className="tb-list ct-swaps" aria-label="Swaps">
        {r.swaps.map((s) => {
          const [gain, what] = splitGain(s.to.effect);
          return (
            <li key={s.text} className="ct-swap" aria-label={`${s.text}: ${s.to.effect}`}>
              <CardTile card={s.from} out />
              <span className="ct-arrow" aria-hidden="true">
                <Sprite name="status-arrow" size={24} decorative />
              </span>
              <CardTile card={s.to} />
              <span className="ct-gain">
                <span className="ct-gain__n">{gain}</span>
                <span className="tb-xs">{what}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {r.setNote ? (
        <p className="ct-set-note">
          <span className="tb-pip" data-tone="gold" />
          <span>Then: {r.setNote}</span>
        </p>
      ) : null}
    </Answer>
  );
}

function Presets({
  c,
  r,
  onOpen,
}: {
  c: CharacterCardsView;
  r: PresetRecommendation | null;
  onOpen(card: CardChip): void;
}) {
  const out = new Set(
    r && !r.done ? r.swaps.flatMap((s) => (s.from ? [s.from.rawName] : [])) : ([] as string[]),
  );
  return (
    <section className="tb-sec" aria-labelledby={`ct-${c.index}-presets`}>
      <div className="tb-sec-head">
        <h2 id={`ct-${c.index}-presets`} className="tb-h2">
          Card presets
        </h2>
        <span className="tb-note">
          {c.slotCount} slots{c.presetsLocked ? ` · ${c.presetsLocked}` : ''}
        </span>
      </div>
      <ul className="tb-list ct-presets">
        {c.presets.map((p) => {
          const empty = p.slots.filter((x) => x === null).length;
          const swapHere = r?.preset === p.n;
          return (
            <li key={p.n} className="ct-preset">
              <span className="ct-preset__name">
                <b>{c.presets.length > 1 ? `Preset ${p.n}` : 'Equipped'}</b>
                <span className={p.active ? 'tb-xs tb-ok' : 'tb-xs'}>
                  {[p.active ? 'in use' : null, p.label].filter(Boolean).join(' · ')}
                </span>
              </span>
              <ul className="tb-list ct-slots" aria-label={`Preset ${p.n} slots`}>
                {p.slots.map((s, i) =>
                  s ? (
                    // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional.
                    <li key={i}>
                      <button
                        type="button"
                        className="ct-chip"
                        data-swap={swapHere && out.has(s.rawName) ? 'yes' : 'no'}
                        onClick={() => onOpen(s)}
                      >
                        <Sprite name="item-card-frame" size={32} decorative />
                        <span className="ct-chip__words">
                          <span className="ct-chip__name">{s.name}</span>
                          <span className="tb-xs">
                            {starsOf(s)}
                            {swapHere && out.has(s.rawName) ? ' · swap' : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  ) : (
                    // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional.
                    <li key={i} className="ct-chip ct-chip--empty">
                      <span className="sr-only">empty slot</span>
                    </li>
                  ),
                )}
              </ul>
              <span className="tb-xs ct-preset__set">
                {p.set
                  ? `${p.set.name} set · tier ${p.set.tier} · ${p.set.bonus}`
                  : empty === p.slots.length
                    ? `${empty} empty ${empty === 1 ? 'slot' : 'slots'}`
                    : p.active
                      ? 'No card set equipped'
                      : empty
                        ? `${empty} empty ${empty === 1 ? 'slot' : 'slots'}`
                        : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const SHOWN = 3;

/** "about 14h at the base drop chance (likely sooner)" -> "about 14h"; the header says the rest once. */
const timeOf = (g: GrindItem) =>
  g.hours !== null
    ? g.etaText.split(' at the base')[0]
    : g.skill
      ? `${g.skill.toLowerCase()} card`
      : 'no kill rate yet';

function GrindRow({ g }: { g: GrindItem }) {
  const next = g.stars + 1;
  const who = g.farmingNow[0] ?? null;
  return (
    <tr>
      <th scope="row">
        <span className="ct-g-card">
          <span className="tb-ic" data-tone={who ? 'gold' : 'plain'}>
            <Sprite name="item-card-frame" size={32} decorative />
          </span>
          <span className="ct-g-words">
            <b>{g.name}</b>
            <span className="tb-xs">
              {g.level > 0 ? `${starWord(g.stars)} → ${starWord(next)}` : g.next.label} ·{' '}
              {g.effect.replace(/ per level$/, ' a star')}
            </span>
          </span>
        </span>
      </th>
      <td>
        <span className="ct-g-words">
          <span>{g.map}</span>
          <span className="tb-xs">
            World {g.world} · {g.chanceText}
            {g.skill ? '' : ' kills'}
          </span>
          <SeeOnMap mapIndex={g.mapIndex} label={g.map} />
        </span>
      </td>
      <td>
        <span className="ct-g-words">
          <b>{who ?? 'Nobody yet'}</b>
          <span className="tb-xs">
            {who
              ? `farming it now${g.farmingNow.length > 1 ? ` with ${g.farmingNow.length - 1} more` : ''}`
              : 'no one fights there now'}
          </span>
        </span>
      </td>
      <td>
        <span className="ct-g-words">
          <Meter
            value={g.owned}
            max={g.next.copies}
            label={`${g.name}: ${g.owned.toLocaleString('en-US')} of ${g.next.copies.toLocaleString('en-US')} copies`}
            tone={who ? 'accent' : 'muted'}
          />
          <span className="tb-xs">
            {g.owned.toLocaleString('en-US')} of {g.next.copies.toLocaleString('en-US')} copies
          </span>
        </span>
      </td>
      <td className={g.hours !== null && who ? 'ct-g-time tb-gold' : 'ct-g-time'}>{timeOf(g)}</td>
    </tr>
  );
}

function Grind({ c, note }: { c: CharacterCardsView; note: string | null }) {
  const [all, setAll] = useState(false);
  const rows = all ? c.grind : c.grind.slice(0, SHOWN);
  const more = c.grind.length - SHOWN;
  return (
    <section className="tb-sec" aria-labelledby={`ct-${c.index}-grind`}>
      <div className="tb-sec-head">
        <h2 id={`ct-${c.index}-grind`} className="tb-h2">
          Cards to farm next
        </h2>
        {note ? <span className="tb-note">{note}</span> : null}
      </div>
      {c.grind.length ? (
        <div className="ct-table-wrap">
          <table className="ct-table">
            <thead>
              <tr>
                <th scope="col">Card</th>
                <th scope="col">Where</th>
                <th scope="col">Who farms it</th>
                <th scope="col">Copies to the next star</th>
                <th scope="col">Time there</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <GrindRow key={g.rawName} g={g} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="tb-note">{c.grindEmpty}</p>
      )}
      {more > 0 || c.grindNote ? (
        <p className="tb-xs ct-more">
          {more > 0 ? (
            <button type="button" className="ct-more__btn" aria-expanded={all} onClick={() => setAll(!all)}>
              {all ? 'Show the first 3' : `${more} more on this list`}
            </button>
          ) : null}
          {c.grindNote ? <span>{c.grindNote}</span> : null}
        </p>
      ) : null}
    </section>
  );
}

function Sets({ sets, index }: { sets: readonly CardSetProgress[]; index: number }) {
  if (!sets.length) return null;
  return (
    <section className="tb-sec" aria-labelledby={`ct-${index}-sets`}>
      <div className="tb-sec-head">
        <h2 id={`ct-${index}-sets`} className="tb-h2">
          Card sets close to their next tier
        </h2>
        <span className="tb-note">Every new card or new star in a set counts 1 · one set per preset</span>
      </div>
      <ul className="tb-list ct-sets">
        {sets.map((t) => (
          <li key={t.rawName} className="tb-tile">
            <span className="ct-set-head">
              <b>{t.name}</b>
              <span className={t.tier > 0 ? 'tb-xs tb-ok' : 'tb-xs'}>
                {t.tier > 0 ? `tier ${t.tier}` : 'no tier yet'}
              </span>
            </span>
            <span className="tb-note">
              {t.bonus ?? 'Nothing yet'} · {t.points} of {t.nextAt}
            </span>
            <Meter
              value={t.points}
              max={t.nextAt}
              label={`${t.name}: ${t.points} of ${t.nextAt} card levels`}
              tone="accent"
            />
            <span className="ct-set-away">
              <b className="tb-gold">
                {t.away} card {t.away === 1 ? 'level' : 'levels'}
              </b>{' '}
              <span className="tb-note">
                to tier {t.tier + 1}: {t.nextBonus}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One character's Cards tab body. */
export function CharacterCardsTab({ c, cards }: { c: CharacterCardsView; cards: CardsNowView }) {
  const [open, setOpen] = useState<CardChip | null>(null);
  if (c.unknown) return <p className="tb tb-note">{c.unknown}</p>;
  const r = recOf(c);
  return (
    <div className="tb ct">
      {r ? (
        <SwapAnswer c={c} r={r} />
      ) : (
        <Answer tone="plain" icon="item-card-frame" cap="Cards" title={c.overview} />
      )}
      <Presets c={c} r={r} onOpen={setOpen} />
      <Grind c={c} note={cards.caveats[0] ?? null} />
      <Sets sets={cards.account.sets ?? []} index={c.index} />
      <TabSource source={cards.source} note={cards.caveats[1] ?? null} />
      <Sheet open={open !== null} title={open ? `${open.name} card` : ''} onClose={() => setOpen(null)}>
        {open ? (
          <div className="ct-sheet">
            <p className="num">{starsOf(open)}</p>
            <p>{open.effect}</p>
            {open.passive ? <p className="tb-note">Passive: it works without being equipped.</p> : null}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

/** The character page's Cards tab (character-tabs.ts). */
export function CardsTab({ view, index }: CharacterTabProps) {
  const c = view.cards?.characters.find((x) => x.index === index);
  if (!view.cards || !c) return <p className="tb tb-note">No card data for this character yet.</p>;
  return <CharacterCardsTab c={c} cards={view.cards} />;
}
