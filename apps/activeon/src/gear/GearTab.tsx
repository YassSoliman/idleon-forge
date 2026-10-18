// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 F5 the character page's Gear tab (docs/specs/M18-gear-tools.md FR-24): the paper doll (Design Lab
// pick "Coloured silhouette": our own mannequin, 8 equipment and 6 tool squares, each with a glyph and a
// word, one square lit), the one step under it with its why, a sheet per square, and the tool ladders.
// A lazy chunk (lazy-part.tsx). The engine words everything; this file only renders (CSP: no inline
// styles, text only). The trap set and the skull show M20's Parallel Slot pips.
import type { CharacterGear, GearSlotView } from '@idleon-forge/engine/result';
import { useState } from 'react';
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

/** The state's glyph: never colour alone (the word sits next to it). */
export function StateGlyph({ state }: { state: string }) {
  if (state === 'ok')
    return (
      <svg className="gg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M2 6.5 5 9.5 10 3" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  if (state === 'behind')
    return (
      <svg className="gg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M6 10 1.5 3h9z" fill="currentColor" />
      </svg>
    );
  if (state === 'held-upgrade')
    return (
      <svg className="gg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M6 1.5 10.5 7H8v3.5H4V7H1.5z" fill="currentColor" />
      </svg>
    );
  if (state === 'empty')
    return (
      <svg className="gg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <rect
          x="1.5"
          y="1.5"
          width="9"
          height="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 1.5"
        />
      </svg>
    );
  return (
    <svg className="gg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <text x="6" y="10" textAnchor="middle" fontSize="10" fill="currentColor">
        ?
      </text>
    </svg>
  );
}

/** Our own mannequin (ADR 0009: pixel boxes, never game art). */
function Mannequin() {
  return (
    <svg className="gd-fig" viewBox="0 0 16 32" width="48" height="96" aria-hidden="true" focusable="false">
      <rect x="5" y="1" width="6" height="6" fill="currentColor" />
      <rect x="4" y="8" width="8" height="10" fill="currentColor" />
      <rect x="1" y="9" width="3" height="8" fill="currentColor" />
      <rect x="12" y="9" width="3" height="8" fill="currentColor" />
      <rect x="4" y="18" width="3" height="11" fill="currentColor" />
      <rect x="9" y="18" width="3" height="11" fill="currentColor" />
      <rect x="3" y="29" width="4" height="2" fill="currentColor" />
      <rect x="9" y="29" width="4" height="2" fill="currentColor" />
    </svg>
  );
}

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
      <span className="gs-t">{LABEL[q.slot]}</span>
      <span className="gs-w">
        <StateGlyph state={q.state} />
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
            <button type="button" className="ghost tiny" onClick={() => setAll(!all)}>
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
      <p className="small muted gd-kicker">Gear Plan · numbers are levels behind</p>
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
        <div className="gd-step">
          <p>
            <b>Next:</b> {g.step}
          </p>
          {g.why ? (
            <details>
              <summary className="small">why</summary>
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
