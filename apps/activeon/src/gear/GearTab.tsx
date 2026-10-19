// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 F5 the character page's Gear tab (docs/specs/M18-gear-tools.md FR-24): the paper doll (Design Lab
// pick "Coloured silhouette": our own mannequin, 8 equipment and 6 tool squares, each with a glyph and a
// word, one square lit), the one step under it with its why, a sheet per square, and the tool ladders.
// A lazy chunk (lazy-part.tsx). The engine words everything; this file only renders (CSP: no inline
// styles, text only). The trap set and the skull show M20's Parallel Slot pips.
import type { CharacterGear, GearSlotView } from '@idleon-forge/engine/result';
import { useState } from 'react';
import type { ArtName } from '../design/art/names';
import { PixelArt } from '../design/art/PixelArt';
import { StateGlyph } from '../design/atoms';
import type { CharacterTabProps } from '../now/character-tabs';
import './gear.css';

const LABEL: Readonly<Record<GearSlotView['slot'], string>> = {
  helmet: 'Helmet',
  weapon: 'Weapon',
  shirt: 'Shirt',
  pendant: 'Pendant',
  pants: 'Pants',
  ring1: 'Ring',
  shoes: 'Shoes',
  ring2: 'Ring',
  pickaxe: 'Pickaxe',
  hatchet: 'Hatchet',
  rod: 'Rod',
  net: 'Net',
  trap: 'Trap set',
  skull: 'Skull',
};
const LEFT: readonly GearSlotView['slot'][] = ['helmet', 'shirt', 'pants', 'shoes'];
const RIGHT: readonly GearSlotView['slot'][] = ['weapon', 'pendant', 'ring1', 'ring2'];
const TOOLS: readonly GearSlotView['slot'][] = ['pickaxe', 'hatchet', 'rod', 'net', 'trap', 'skull'];

export { StateGlyph };

/** Each square's state glyph from the art library (DS-8: glyph + word + colour). */
const STATE_ART: Record<string, ArtName> = {
  ok: 'ui-check',
  behind: 'v2-character-behind',
  empty: 'v2-character-empty',
  'held-upgrade': 'ui-arrow-right',
  unknown: 'now-glyph-question',
  m20: 'now-glyph-question',
};

/** Our own mannequin from the art library (M21 FR-F3; ADR 0009: our drawing, never game art). */
function Mannequin() {
  return (
    <span className="gd-fig">
      <PixelArt name="v2-character-mannequin" scale={3} decorative />
    </span>
  );
}

/** The slot glyphs our art library draws (DS-12: a signifier beside the word). */
const GLYPHS: Partial<Record<GearSlotView['slot'], ArtName>> = {
  helmet: 'v2-character-helmet',
  weapon: 'v2-character-weapon',
  shirt: 'v2-character-shirt',
  pendant: 'v2-character-pendant',
  pants: 'v2-character-pants',
  ring1: 'v2-character-ring',
  ring2: 'v2-character-ring',
  shoes: 'v2-character-shoes',
  net: 'v2-character-net',
};

interface Square {
  slot: GearSlotView['slot'];
  state: string;
  word: string;
  title: string;
  view: GearSlotView | null;
}

function SquareButton({
  q,
  lit,
  open,
  onOpen,
}: {
  q: Square;
  lit: boolean;
  open: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={`gs st-${q.state}${lit ? ' lit' : ''}${open ? ' open' : ''}`}
      aria-expanded={open}
      aria-controls="gear-sheet"
      aria-label={`${LABEL[q.slot]}: ${q.title}, ${q.word}${lit ? ', next' : ''}`}
      onClick={onOpen}
    >
      <span className="gs-t">
        {GLYPHS[q.slot] ? <PixelArt name={GLYPHS[q.slot] as ArtName} decorative /> : null}
        {LABEL[q.slot]}
      </span>
      <span className="gs-w">
        <PixelArt name={STATE_ART[q.state] ?? 'now-glyph-question'} decorative />
        {q.word}
      </span>
      {lit ? <span className="gs-next">Next</span> : null}
    </button>
  );
}

function Sheet({ q }: { q: Square }) {
  const v = q.view;
  const [all, setAll] = useState(false);
  if (!v) return <p className="small">{q.word}</p>;
  const steps = v.target?.steps ?? [];
  return (
    <div className="gd-sheet-body">
      <dl className="gd-facts">
        <div>
          <dt>Wearing</dt>
          <dd>
            {v.equipped
              ? `${v.equipped.name} · Lv ${v.equipped.lvReq} · ${v.slot === 'weapon' || ['pickaxe', 'hatchet', 'rod', 'net'].includes(v.slot) ? 'Weapon Power' : 'Defence'} ${v.equipped.primary} · main stat ${v.equipped.main}${v.equipped.pct.length ? ` · ${v.equipped.pct.join(', ')}` : ''} · upgrade slots ${v.equipped.slotsLeft} of ${v.equipped.slotsMax} free`
              : 'nothing'}
          </dd>
        </div>
        {v.target ? (
          <div>
            <dt>Gear Plan target</dt>
            <dd>
              {v.target.name} (Lv {v.target.lvReq}): {v.target.how}
            </dd>
          </div>
        ) : null}
        {v.held.length ? (
          <div>
            <dt>Held</dt>
            <dd>{v.held.join('; ')}</dd>
          </div>
        ) : null}
        {v.note ? (
          <div>
            <dt>Note</dt>
            <dd>{v.note}</dd>
          </div>
        ) : null}
      </dl>
      {steps.length ? (
        <>
          <ol className="gd-steps small">
            {(all ? steps : steps.slice(0, 3)).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          {steps.length > 3 ? (
            <button type="button" className="gd-more" onClick={() => setAll(!all)}>
              {all ? 'show fewer' : `show all ${steps.length}`}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Ladders({ g }: { g: CharacterGear }) {
  if (!g.ladders.length) return null;
  return (
    <section className="gd-ladders" aria-labelledby="gd-ladders-h">
      <h3 id="gd-ladders-h" className="sub-h">
        Tools
      </h3>
      {g.ladders.map((l) => (
        <div key={l.skill} className="gd-ladder">
          <p className="small">
            <b>{l.skill.charAt(0).toUpperCase() + l.skill.slice(1)}</b> · level{' '}
            <span className="num">{l.skillLevel}</span>
          </p>
          <ol className="gd-tiers" aria-label={`${l.skill} tools by level`}>
            {l.tiers.map((t) => (
              <li
                key={t.rawName}
                className={`gd-tier${t.equipped ? ' on' : ''}${t.atLevel <= l.skillLevel ? ' can' : ''}`}
              >
                <span className="num">{t.atLevel}</span> {t.name}
                {t.equipped ? <span className="sr-only"> (equipped)</span> : null}
              </li>
            ))}
          </ol>
          {l.next ? <p className="small">{l.next}</p> : null}
        </div>
      ))}
    </section>
  );
}

/** The character page's Gear tab (character-tabs.ts), `#gear-<index>`. */
export function GearTab({ view, index }: CharacterTabProps) {
  const g = view.gear?.characters.find((c) => c.index === index);
  // The open sheet belongs to one character: another character's tab starts closed.
  const [opened, setOpen] = useState<{ index: number; slot: GearSlotView['slot'] } | null>(null);
  const openSlot = opened?.index === index ? opened.slot : null;
  if (!g || g.slots.length === 0) return <p className="small muted">No gear data for this character yet.</p>;
  const pips = view.skills.find((s) => s.index === index)?.slots ?? [];
  const square = (slot: GearSlotView['slot']): Square => {
    const v = g.slots.find((x) => x.slot === slot) ?? null;
    if (slot === 'trap' || slot === 'skull') {
      const pip = pips.find((p) => p.kind === (slot === 'trap' ? 'trap' : 'worship'));
      const state = !pip
        ? 'unknown'
        : pip.state === 'filled'
          ? 'ok'
          : pip.state === 'fillable'
            ? 'empty'
            : 'unknown';
      return { slot, state, word: pip?.text ?? "can't tell", title: pip?.text ?? '', view: null };
    }
    return {
      slot,
      state: v?.state ?? 'unknown',
      word: v?.word ?? '',
      title: v?.equipped?.name ?? 'nothing',
      view: v,
    };
  };
  const btn = (slot: GearSlotView['slot']) => {
    const q = square(slot);
    return (
      <li key={slot}>
        <SquareButton
          q={q}
          lit={g.lit === slot}
          open={openSlot === slot}
          onOpen={() => setOpen(openSlot === slot ? null : { index, slot })}
        />
      </li>
    );
  };
  const open = openSlot ? square(openSlot) : null;
  return (
    <div className="gd">
      <p className="gd-kicker">Gear Plan: each square says what to fix, in levels behind</p>
      <div className="gd-doll">
        <ul className="gd-col" aria-label="Armour">
          {LEFT.map(btn)}
        </ul>
        <Mannequin />
        <ul className="gd-col" aria-label="Weapon and jewellery">
          {RIGHT.map(btn)}
        </ul>
      </div>
      <ul className="gd-tools" aria-label="Tools">
        {TOOLS.map(btn)}
      </ul>
      <div id="gear-sheet" className="gd-sheet" aria-live="polite">
        {open ? (
          <>
            <h3 className="sub-h">{LABEL[open.slot]}</h3>
            <Sheet q={open} />
          </>
        ) : null}
      </div>
      {g.step ? (
        <div className="gd-step a-frame">
          <p>
            <b>Next:</b> {g.step}
          </p>
          {g.why ? (
            <details>
              <summary className="gd-why">why</summary>
              <p className="small">{g.why}</p>
            </details>
          ) : null}
        </div>
      ) : (
        <p className="small gd-step">{g.status}</p>
      )}
      {g.note ? <p className="small muted">{g.note}</p> : null}
      <Ladders g={g} />
    </div>
  );
}
