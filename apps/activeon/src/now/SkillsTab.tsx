// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F3 the character page's Skills tab (docs/specs/M20-skills-parallel-slots.md FR-33 to FR-38) and FR-31
// the Skill Grid on the Characters place (`#skills`). One "Train" line, one row per W1–W3 skill with its
// level, progress, efficiency, the account's best, the Role badge or specialty mark and the next gate,
// then the character's Parallel Slot pips. The engine words everything; this file only renders.
import { compact, type SkillGridView } from '@idleon-forge/engine/now';
import type { SlotPip } from '@idleon-forge/engine/result';
import { useEffect, useRef } from 'react';
import type { CharacterTabProps } from './character-tabs';
import { useNowActions } from './context';
import './checklist.css';

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
    <ul className="pips" aria-label="Parallel Slots">
      {pips.map((p) => {
        const goal = p.linkKey
          ? actions.result?.account.goals.find((g) => g.nextAction.key === p.linkKey)
          : undefined;
        return (
          <li key={p.kind} className={`pip ${p.state}`}>
            <b>{SLOT_WORDS[p.kind]}</b>
            <span>
              {STATE_WORDS[p.state]}: {p.text}
            </span>
            {goal && actions.navigate ? (
              <a
                className="small"
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

export function SkillsTab({ view, index }: CharacterTabProps) {
  const t = view.skills.find((s) => s.index === index);
  if (!t) return <p className="small muted">No skill data for this character yet.</p>;
  return (
    <div className="sk">
      {t.train ? <p className="sk-train">{t.train.text}</p> : null}
      {/* A frame of its own: a long row scrolls here, never the page (R7 QA, 390 px). */}
      <div className="sk-table-wrap">
        <table className="sk-table">
          <thead>
            <tr>
              <th scope="col">Skill</th>
              <th scope="col">Level</th>
              <th scope="col">Next</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r) => (
              <tr key={r.skill} className={r.locked ? 'locked' : undefined}>
                <th scope="row">
                  {r.name}
                  {r.roleText ? (
                    <span className={`sk-badge${r.role?.active ? '' : ' dormant'}`}>{r.roleText}</span>
                  ) : null}
                  {r.specialty ? <span className="sk-badge spec">specialty</span> : null}
                </th>
                <td>
                  <span className="num">{r.level ?? '?'}</span>
                  {r.progress !== null && !r.locked ? (
                    <span className="small muted"> · {Math.floor(r.progress * 100)}% to next</span>
                  ) : null}
                  {r.efficiency !== null ? (
                    <span className="small muted">
                      {' '}
                      · efficiency <span className="num">{compact(r.efficiency)}</span>
                    </span>
                  ) : null}
                  {r.bestText ? <span className="small muted"> · {r.bestText}</span> : null}
                </td>
                <td className="small">{r.locked ? r.locked.text : (r.gateText ?? '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="sub-h">Parallel Slots</h3>
      <Pips pips={t.slots} />
    </div>
  );
}

/** FR-31: the Skill Grid, one row per character; the one cell M20's top slot Goal fills is outlined. */
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
  return (
    <section id="skills" className="card sk-grid-sec" aria-labelledby="skills-h" tabIndex={-1}>
      <h3 id="skills-h" className="sub-h">
        Skills
      </h3>
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
                    <span className="small muted"> {w ? `${w.classLabel} ${w.level}` : ''}</span>
                  </th>
                  {grid.skills.map((s) => {
                    const cell = r.cells[s];
                    const id = `cell-${r.index}-${s}`;
                    const marks = [
                      cell.best ? 'best' : '',
                      cell.role ? 'Role' : '',
                      cell.specialty ? 'spec' : '',
                      r.afkSkill === s ? 'AFK' : '',
                    ]
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <td
                        key={s}
                        className={
                          [grid.highlight === id ? 'hl' : '', cell.best ? 'best' : '']
                            .filter(Boolean)
                            .join(' ') || undefined
                        }
                      >
                        <span className="num">{cell.level ?? '?'}</span>
                        {marks ? <span className="small muted"> {marks}</span> : null}
                      </td>
                    );
                  })}
                  <td>
                    {r.slots.map((p) => (
                      <span
                        key={p.kind}
                        className={`pip-mini ${p.state}`}
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
