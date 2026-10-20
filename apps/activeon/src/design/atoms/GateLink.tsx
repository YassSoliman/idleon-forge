// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C1 (board m26/GateLink.dc.html): a gate is a link, not a riddle. One chip: the gate's game
// sprite (the tab item, or the recipe's item), its label and a chevron, as a real <a> to the System page
// tab that explains it. A met gate is a place (a quiet chip: "this recipe is on tab 3"); an unmet gate is
// a task (a gold chip with "0 of 4 ready" that opens its Walkthrough). On a phone the chip drops under
// its sentence and pads to the 44 px tap target (gate-link.css).
//
// `GateText` draws a sentence the engine still words with its gate inside ("Craft Anvil Tab 3 at the
// anvil", "Craft Golden Net now (anvil tab 2)"): each anvil gate becomes a chip, so no registered gate is
// left as bare words (GC1). The spans come from `EngineResult.production.tabGates`.
import type { GateSpan } from '@idleon-forge/engine/production';
import type { JSX } from 'react';
import { GameIcon } from '../../art/game/GameIcon';
import { itemArt } from '../../art/game/game-art';
import './gate-link.css';

export interface GateLinkProps {
  gate: GateSpan;
  /** In-app navigation (the shell's push); a plain link otherwise. */
  onNavigate?: (gate: GateSpan) => void;
}

/** "Anvil tab 3: open The Ice Breaker's recipe" (FR-C1's accessible name). */
export const gateName = (g: GateSpan) =>
  `${g.label}${g.met === false && g.of ? ` (${g.ready ?? 0} of ${g.of} ready)` : ''}: ${g.what}`;

export function GateLink({ gate, onNavigate }: GateLinkProps): JSX.Element {
  const task = gate.met === false;
  return (
    <a
      className={`gl-chip${task ? ' gl-chip--task' : ''}`}
      href={gate.href}
      aria-label={gateName(gate)}
      data-gate={gate.gate}
      onClick={
        onNavigate
          ? (e) => {
              e.preventDefault();
              onNavigate(gate);
            }
          : undefined
      }
    >
      <span className="gl-ic">
        <GameIcon art={itemArt(gate.icon)} fallback="item-ore" size={16} decorative />
      </span>
      <span className="gl-label">{gate.label}</span>
      {task && gate.of ? (
        <span className="gl-ready">{`· ${gate.ready ?? 0} of ${gate.of} ready`}</span>
      ) : null}
      <span className="gl-chev" aria-hidden="true">
        ›
      </span>
    </a>
  );
}

const TAB_WORDS = /(\(?)\b(craft )?anvil tab (\d)\b(\)?)/gi;

/** The tab's gate, or a recipe's: a met tab focuses the recipe on the Recipes tab. */
export function gateOf(
  tabGates: readonly GateSpan[] | null | undefined,
  tab: number,
  recipe?: { rawName: string; name: string } | null,
): GateSpan | null {
  const g = tabGates?.[tab - 1];
  if (!g) return null;
  if (!recipe || g.met === false) return g;
  return {
    ...g,
    gate: 'recipe',
    focus: recipe.rawName,
    href: `#system-anvil?tab=recipes&focus=${encodeURIComponent(recipe.rawName)}`,
    icon: recipe.rawName,
    what: `open ${recipe.name}'s recipe`,
  };
}

export interface GateTextProps {
  text: string;
  tabGates: readonly GateSpan[] | null | undefined;
  /** The piece the sentence crafts: a met tab gate opens its recipe. */
  recipe?: { rawName: string; name: string } | null;
  onNavigate?: (gate: GateSpan) => void;
  /** The gate focus of the view the sentence sits in: that gate stays words, never a link to itself. */
  self?: string;
}

/**
 * A sentence with its anvil gates as chips. "(anvil tab 3)" is replaced by the chip; "Craft Anvil Tab 4"
 * keeps its words and gains the chip. Without the spans (an old result), the words stay as they are.
 */
export function GateText({ text, tabGates, recipe, onNavigate, self }: GateTextProps): JSX.Element {
  const parts: Array<[string, string] | JSX.Element> = [];
  let last = 0;
  const done = new Set<number>();
  for (const m of text.matchAll(TAB_WORDS)) {
    const tab = Number(m[3]);
    // One chip per tab in a sentence ("Use Anvil Tab 3 to open anvil tab 3 ..." links once).
    if (done.has(tab)) continue;
    const g = gateOf(tabGates, tab, m[2] ? null : recipe);
    if (!g || (self !== undefined && g.focus === self)) continue;
    done.add(tab);
    const at = m.index ?? 0;
    const bracketed = m[1] === '(' && m[4] === ')';
    const before = text.slice(last, at);
    parts.push([`t${last}`, bracketed ? before.replace(/\s+$/, '') : before + m[0]]);
    parts.push(<GateLink key={`g${at}`} gate={g} onNavigate={onNavigate} />);
    last = at + m[0].length;
  }
  if (parts.length === 0) return <>{text}</>;
  parts.push([`t${last}`, text.slice(last)]);
  return (
    <span className="gl-text">
      {parts.map((p) => (Array.isArray(p) ? <span key={p[0]}>{p[1]}</span> : p))}
    </span>
  );
}

/**
 * The first anvil gate of a sentence, for a place that can't hold a link inside its text (a tile that is
 * itself a button): the sentence without "(anvil tab 3)", and the gate to draw beside it.
 */
export function extractGate(
  text: string,
  tabGates: readonly GateSpan[] | null | undefined,
  recipe?: { rawName: string; name: string } | null,
): { text: string; gate: GateSpan | null } {
  for (const m of text.matchAll(TAB_WORDS)) {
    const g = gateOf(tabGates, Number(m[3]), m[2] ? null : recipe);
    if (!g) continue;
    const bracketed = m[1] === '(' && m[4] === ')';
    const at = m.index ?? 0;
    const clean = bracketed
      ? `${text.slice(0, at).replace(/\s+$/, '')}${text.slice(at + m[0].length)}`
      : text;
    return { text: clean, gate: g };
  }
  return { text, gate: null };
}
