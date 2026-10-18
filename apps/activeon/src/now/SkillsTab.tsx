// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F3 the character page's Skills tab (docs/specs/M20-skills-parallel-slots.md FR-33 to FR-38) and FR-31
// the Skill Grid on the Characters place (`#skills`), drawn as the Design Lab picks (M21 FR-C8):
// - the Skills tab: "Bar list with gate ticks", one bar per W1–W3 skill against its next gate, the
//   skill the character trains lit, then the Parallel Slot pips;
// - the Skill Grid: "Role matrix", the account's skills per character with specialists starred, and
//   one line naming the skills no one is built for.
// The engine words everything; this file only renders.
import { compact, type SkillGridView, type SkillRowView } from '@idleon-forge/engine/now';
import type { SlotPip } from '@idleon-forge/engine/result';
import { useEffect, useRef } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { Meter } from '../design/atoms';
import type { CharacterTabProps } from './character-tabs';
import { useNowActions } from './context';
import './skills-tab.css';

const SLOT_WORDS: Record<SlotPip['kind'], string> = {
  cog: 'Cog Board',
  worship: 'Worship',
  trap: 'Traps',
  cauldron: 'Cauldron',
  printer: '3D Printer',
};
const STATE_WORDS: Record<SlotPip['state'], string> = {
  filled: 'filled',
  fillable: 'free',
  unfillable: 'needs something first',
  capped: 'full',
  locked: 'locked',
  unknown: "can't tell",
  'not-covered': 'not covered yet',
};

function Pips({ pips }: { pips: SlotPip[] }) {
  const actions = useNowActions();
  return (
    <ul className="sk-pips" aria-label="Parallel Slots">
      {pips.map((p) => {
        const goal = p.linkKey
          ? actions.result?.account.goals.find((g) => g.nextAction.key === p.linkKey)
          : undefined;
        return (
          <li key={p.kind} className="sk-pip" data-state={p.state}>
            <span className="sk-pip-top">
              <b>{SLOT_WORDS[p.kind]}</b>
              <span className="sk-pip-state">{STATE_WORDS[p.state]}</span>
            </span>
            <span className="sk-muted">{p.text}</span>
            {goal && actions.navigate ? (
              <a
                className="sk-fill"
                href={`#system-${goal.system}`}
                onClick={(e) => {
                  e.preventDefault();
                  actions.navigate?.(
                    { place: 'system', id: goal.system },
                    { highlight: goal.nextAction.key },
                  );
                }}
              >
                Fill it: {goal.nextAction.text}
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** One skill as a bar against its next gate, with the gate as a tick at the bar's end. */
function SkillBar({ r, lit }: { r: SkillRowView; lit: boolean }) {
  const level = r.level ?? 0;
  const gate = r.nextGate?.atLevel ?? null;
  return (
    <li className="sk-bar" data-lit={lit ? 'yes' : 'no'} data-locked={r.locked ? 'yes' : 'no'}>
      <span className="sk-bar-top">
        <span className="sk-bar-name">
          {r.name}
          {r.specialty ? <PixelArt name="v2-character-star" decorative /> : null}
        </span>
        <span className="num">{r.level === null ? 'level not known' : `Lv ${level}`}</span>
        {r.roleText ? <span className="sk-tag">{r.roleText}</span> : null}
        {r.specialty ? <span className="sk-tag">specialty</span> : null}
        {lit ? <span className="sk-nowtag">training</span> : null}
      </span>
      {r.locked ? (
        <span className="sk-muted">{r.locked.text}</span>
      ) : gate !== null ? (
        <>
          <span className="sk-track">
            <Meter
              value={level}
              max={gate}
              label={`${r.name}: level ${level} of ${gate}`}
              tone={lit ? 'accent' : 'ok'}
            />
            <span className="sk-tick" aria-hidden="true" />
          </span>
          <span className="sk-muted">{r.gateText}</span>
        </>
      ) : null}
      <span className="sk-meta">
        {r.progress !== null && !r.locked ? <span>{Math.floor(r.progress * 100)}% to next level</span> : null}
        {r.efficiency !== null ? (
          <span>
            efficiency <span className="num">{compact(r.efficiency)}</span>
          </span>
        ) : null}
        {r.bestText ? <span>{r.bestText}</span> : null}
      </span>
    </li>
  );
}

export function SkillsTab({ view, index }: CharacterTabProps) {
  const t = view.skills.find((s) => s.index === index);
  if (!t) return <p className="sk-muted">No skill data for this character yet.</p>;
  return (
    <div className="sk">
      {t.train ? <p className="sk-train">{t.train.text}</p> : null}
      <ol className="sk-bars" aria-label="Skills">
        {t.rows.map((r) => (
          <SkillBar key={r.skill} r={r} lit={t.train?.skill === r.skill} />
        ))}
      </ol>
      <h3 className="sk-h">Parallel Slots</h3>
      <Pips pips={t.slots} />
    </div>
  );
}

/** FR-31: the Skill Grid as the role matrix; the one cell M20's top slot Goal fills is outlined. */
export function SkillGrid({ grid }: { grid: SkillGridView | null }) {
  const actions = useNowActions();
  const wrap = useRef<HTMLDivElement>(null);
  const highlight = grid?.highlight ?? null;
  // The outlined cell scrolls into the frame (its first column stays put), never off to the right.
  useEffect(() => {
    const box = wrap.current;
    const cell = highlight ? box?.querySelector<HTMLElement>('td.hl') : null;
    const first = box?.querySelector<HTMLElement>('tbody th');
    if (!box || !cell) return;
    const left = cell.offsetLeft - (first?.offsetWidth ?? 0) - 8;
    if (left > box.scrollLeft && cell.offsetLeft + cell.offsetWidth > box.scrollLeft + box.clientWidth)
      box.scrollLeft = left;
  }, [highlight]);
  if (!grid) return null;
  const noOne = grid.skills.filter((s) => !grid.rows.some((r) => r.cells[s].specialty));
  return (
    <section id="skills" className="sk-grid-sec" aria-labelledby="skills-h" tabIndex={-1}>
      <h3 id="skills-h" className="sk-h">
        Skills
      </h3>
      {noOne.length ? (
        <p className="sk-muted">No one is built for {noOne.map((s) => grid.names[s]).join(', ')}.</p>
      ) : null}
      <div className="sk-grid-wrap" ref={wrap}>
        <table className="sk-grid">
          <thead>
            <tr>
              <th scope="col">Character</th>
              {grid.skills.map((s) => (
                <th key={s} scope="col">
                  {grid.names[s]}
                </th>
              ))}
              <th scope="col">Slots</th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((r) => {
              const w = grid.who.find((x) => x.index === r.index);
              return (
                <tr key={r.id}>
                  <th scope="row">
                    <a
                      href={`#skills-${r.index}`}
                      onClick={(e) => {
                        e.preventDefault();
                        actions.openTab(r.index, 'skills');
                      }}
                    >
                      {w?.name}
                    </a>
                    <span className="sk-muted"> {w ? `${w.classLabel} ${w.level}` : ''}</span>
                  </th>
                  {grid.skills.map((s) => {
                    const cell = r.cells[s];
                    const id = `cell-${r.index}-${s}`;
                    const marks = [
                      cell.best ? 'best' : '',
                      cell.role ? 'Role' : '',
                      cell.specialty ? 'specialist' : '',
                      r.afkSkill === s ? 'AFK' : '',
                    ]
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <td
                        key={s}
                        className={
                          [
                            grid.highlight === id ? 'hl' : '',
                            cell.best ? 'best' : '',
                            cell.specialty ? 'spec' : '',
                          ]
                            .filter(Boolean)
                            .join(' ') || undefined
                        }
                      >
                        {cell.specialty ? <PixelArt name="v2-character-star" decorative /> : null}
                        <span className="num">{cell.level ?? '?'}</span>
                        {marks ? <span className="sk-mark"> {marks}</span> : null}
                      </td>
                    );
                  })}
                  <td>
                    {r.slots.map((p) => (
                      <span
                        key={p.kind}
                        className="sk-pip-mini"
                        data-state={p.state}
                        title={`${SLOT_WORDS[p.kind]}: ${p.text}`}
                      />
                    ))}
                    <span className="sr-only">
                      {r.slots.map((p) => `${SLOT_WORDS[p.kind]} ${STATE_WORDS[p.state]}`).join(', ')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
