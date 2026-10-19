// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the Vials section's two lists (canvas board AlchemyVials): "You can try these", every locked vial
// whose item the account holds in storage or a bag, easiest roll first, with how many it holds and
// where; then "Missing the item", the locked vials still waiting for their item. Self-contained, so the
// Alchemy System page's Vials section can place it wherever its layout puts it. It only lays out
// `AlchemyResult.vialTries` (built in the worker); it adds no advice. M25: each vial wears the game's
// locked jar and its item's own sprite (ADR 0009 as amended 2026-10-19); the item's monogram is the
// fallback, and the item's sprite opens its IdleOn Wiki page.
import type { AlchemyResult, VialHolding, VialTry } from '@idleon-forge/engine/result';
import { vialItemArt, vialJarArt } from '../art/game/alchemy-art';
import { GameIcon } from '../art/game/GameIcon';
import './vial-tries.css';

export const VIAL_TRY_WORDS = {
  tryTitle: 'You can try these',
  tryCount: (n: number, locked: number) => `${n} of ${locked} locked vials · items in storage and bags`,
  roll: (n: number) => `roll ${n}+ to unlock`,
  held: 'held',
  storage: 'Storage',
  has: (who: string, n: string) => `${who} has ${n}`,
  refinery: (n: string) => `${n} more sit in the Refinery`,
  forge: (n: string) => `${n} more sit in the Forge`,
  missingTitle: 'Missing the item',
  missingCount: (n: number) => `${n} ${n === 1 ? 'vial' : 'vials'} · get one of each to try them`,
  needs: (item: string) => `needs ${item}`,
  none: 'No locked vials: every vial is open.',
  noneHeld: 'You hold none of the items the locked vials need yet.',
} as const;

const W = VIAL_TRY_WORDS;
const n = (x: number) => Math.round(x).toLocaleString('en-US');

/** Two letters for the item's tile: the first letters of its first two words ("Floof Ploof" → FP). */
export const monogram = (item: string) => {
  const words = item.split(/\s+/).filter(Boolean);
  const a = words[0] ?? '';
  const b = words[1] ?? '';
  return (b ? `${a.charAt(0)}${b.charAt(0)}` : a.slice(0, 2)).toUpperCase();
};

export interface VialTriesProps {
  a: AlchemyResult;
  /** Class and level per `CharacterState.index` ("Shaman 76"); never a name. */
  who(index: number): string;
}

/** "Storage 6,552 · Shaman 76 has 9", then the Refinery and Forge amounts a try can't use. */
export function whereLine(v: VialTry, who: (i: number) => string): string {
  const part = (h: VialHolding) =>
    h.place === 'storage'
      ? v.places.length === 1
        ? W.storage
        : `${W.storage} ${n(h.amount)}`
      : v.places.length === 1
        ? who(h.index)
        : W.has(who(h.index), n(h.amount));
  const out = v.places.map(part);
  if (v.elsewhere.refinery > 0) out.push(W.refinery(n(v.elsewhere.refinery)));
  if (v.elsewhere.forge > 0) out.push(W.forge(n(v.elsewhere.forge)));
  return out.join(' · ');
}

export function VialTries({ a, who }: VialTriesProps) {
  const t = a.vialTries;
  if (!t) return null;
  const locked = t.tryable.length + t.missing.length;
  if (locked === 0) return <p className="vt-none small">{W.none}</p>;
  return (
    <div className="vt">
      <section className="vt-part" aria-labelledby="vt-try-h">
        <div className="vt-head">
          <h4 id="vt-try-h" className="vt-h">
            {W.tryTitle}
          </h4>
          <span className="vt-sub">{W.tryCount(t.tryable.length, locked)}</span>
        </div>
        {t.tryable.length ? (
          <ol className="vt-list">
            {t.tryable.map((v) => (
              <li key={v.index} className="vt-row">
                <span className="vt-vial">
                  <GameIcon art={vialJarArt(0)} fallback="item-vial" size={32} decorative />
                </span>
                <span className="vt-name">
                  <b>{v.name}</b>
                  <span className="vt-sub">{W.roll(v.rollNeeded)}</span>
                </span>
                <span className="vt-item">
                  <span className="vt-ic">
                    <GameIcon
                      art={vialItemArt(v.index)}
                      fallback={
                        <span className="vt-mono" aria-hidden="true">
                          {monogram(v.item)}
                        </span>
                      }
                      size={32}
                      decorative
                      wiki={v.item}
                    />
                  </span>
                  <span className="vt-item__t">
                    <span className="vt-item__name">{v.item}</span>
                    <span className="vt-sub">{whereLine(v, who)}</span>
                  </span>
                </span>
                <span className="vt-held">
                  <b className="num">{n(v.held)}</b>
                  <span className="vt-sub">{W.held}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="small muted">{W.noneHeld}</p>
        )}
      </section>
      {t.missing.length ? (
        <section className="vt-part" aria-labelledby="vt-miss-h">
          <div className="vt-head">
            <h4 id="vt-miss-h" className="vt-h">
              {W.missingTitle}
            </h4>
            <span className="vt-sub">{W.missingCount(t.missing.length)}</span>
          </div>
          <ul className="vt-grid">
            {t.missing.map((m) => (
              <li key={m.index} className="vt-tile">
                <span className="vt-ic">
                  <GameIcon
                    art={vialItemArt(m.index)}
                    fallback={
                      <span className="vt-mono" aria-hidden="true">
                        {monogram(m.item)}
                      </span>
                    }
                    size={32}
                    decorative
                    wiki={m.item}
                  />
                </span>
                <span className="vt-tile__t">
                  <span className="vt-tile__name">{m.name}</span>
                  <span className="vt-sub">{W.needs(m.item)}</span>
                </span>
                <span className="vt-sub num">{m.rollNeeded}+</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
