// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The character page's Skills tab, M24 board `Skills` (I-character-b; M20 F3 FR-33 to FR-38), and FR-31
// the Skill Grid on the Characters place (`#skills`, M21 "Role matrix"):
// - the Skills tab: the Role (or specialty) answer first. When the Role's Parallel Slot can't be filled
//   yet (Trapping before Lord of the Hunt's quest), the answer is that prerequisite as step 1 and the
//   training as step 2, never "train it" on its own (red team #5). Then the skills as a 3x3 of tiles
//   (level, a bar through the level, the account's best, what the next level opens) and the Parallel
//   Slots as tiles, each in one state;
// - the Skill Grid: the account's skills per character with specialists starred.
// The engine words everything; this file only renders.
import type { SkillGridView, SkillRowView } from '@idleon-forge/engine/now';
import type { SlotPip } from '@idleon-forge/engine/result';
import { useEffect, useRef, useState } from 'react';
import { Sprite } from '../art/sprites/Sprite';
import { Answer, GoalLink, pipTone, StepNo, type Tone, upper, useGoal } from '../characters/tabs/kit';
import { PixelArt } from '../design/art/PixelArt';
import { Meter, Pip } from '../design/atoms';
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

const SLOT_SPRITE: Record<SlotPip['kind'], string> = {
  cog: 'skill-construction',
  worship: 'skill-worship',
  trap: 'skill-trapping',
  cauldron: 'sys-alchemy',
  printer: 'sys-printer',
};
/** The Parallel Slot a skill trains in (M20 FR-35), for "step 1 above opens it". */
const SLOT_OF_SKILL: Partial<Record<string, SlotPip['kind']>> = {
  construction: 'cog',
  worship: 'worship',
  alchemy: 'cauldron',
  trapping: 'trap',
};

/** One Parallel Slot tile: one state (a fix waiting makes it gold, never mint and gold at once). */
function SlotTile({ p, opensAbove }: { p: SlotPip; opensAbove: boolean }) {
  const goal = useGoal(p.linkKey);
  const noSkull = p.kind === 'worship' ? /^no skull \(max (\d+)\)$/.exec(p.text) : null;
  const shut = p.state === 'unfillable' || p.state === 'locked' || p.state === 'not-covered';
  const tone: Tone =
    goal || p.state === 'fillable' ? 'gold' : p.state === 'filled' || p.state === 'capped' ? 'ok' : 'plain';
  const state = noSkull
    ? `No skull: charge stops at ${noSkull[1]}`
    : opensAbove
      ? 'Not yet · step 1 above opens it'
      : shut
        ? `Not yet · ${p.text}`
        : p.state === 'capped'
          ? `Full · ${p.text}`
          : upper(p.text);
  return (
    <li className="a-tile sk-slot" data-tone={tone}>
      <span className="sk-slot__top">
        <Sprite name={SLOT_SPRITE[p.kind]} size={24} decorative />
        <b>{SLOT_WORDS[p.kind]}</b>
        <Pip tone={pipTone(tone)} />
        <span className="sr-only">{STATE_WORDS[p.state]}</span>
      </span>
      <span className="tb-xs">{state}</span>
      {goal ? <GoalLink actionKey={goal.nextAction.key} text={goal.nextAction.text} /> : null}
    </li>
  );
}

/** One skill tile: level, the bar through this level, the account's best, and what the next level opens. */
function SkillTile({
  r,
  index,
  lit,
  tag,
}: {
  r: SkillRowView;
  index: number;
  lit: boolean;
  tag: string | null;
}) {
  const best = r.accountBest;
  return (
    <li className="a-tile sk-tile" data-tone={lit ? 'gold' : 'plain'}>
      <span className="sk-tile__top">
        <span className="tb-ic" data-tone={lit ? 'gold' : 'plain'}>
          <Sprite name={`skill-${r.skill}`} size={32} decorative />
        </span>
        <span className="sk-tile__name">
          <b>{r.name}</b>
          {tag ? <span className={lit ? 'tb-xs tb-gold' : 'tb-xs'}>{tag}</span> : null}
        </span>
        <span className="sk-tile__lv">
          <span className="sk-big">{r.level ?? '?'}</span>
          {best ? (
            <span className="tb-xs">
              {best.index === index ? 'account best' : `account best ${best.level}`}
            </span>
          ) : null}
        </span>
      </span>
      {r.locked ? (
        <span className="tb-xs">{r.locked.text}</span>
      ) : (
        <>
          <Meter
            value={Math.round((r.progress ?? 0) * 100)}
            max={100}
            label={`${r.name}: ${Math.floor((r.progress ?? 0) * 100)}% through level ${r.level ?? '?'}`}
            tone={lit ? 'accent' : 'muted'}
          />
          <span className="tb-xs">{r.gateText ? `Next: ${r.gateText}` : 'Nothing new opens soon'}</span>
        </>
      )}
    </li>
  );
}

export function SkillsTab({ view, index }: CharacterTabProps) {
  const t = view.skills.find((s) => s.index === index);
  if (!t) return <p className="tb tb-note">No skill data for this character yet.</p>;
  const train = t.train;
  const blocked = train?.blocked ?? null;
  const trainRow = train ? t.rows.find((r) => r.skill === train.skill) : undefined;
  const skillName = trainRow?.name ?? '';
  const capOf = () =>
    train?.via === 'specialty' || (train && trainRow?.specialty && !trainRow.role)
      ? `This character's specialty · ${skillName}`
      : `This character's Role · ${skillName}`;
  const opensSlot = blocked && train ? SLOT_OF_SKILL[train.skill] : undefined;
  const filled = t.slots.filter((p) => p.state === 'filled' || p.state === 'capped').length;
  const tagOf = (r: SkillRowView): string | null => {
    if (blocked && r.skill === train?.skill) return `${r.roleText ?? 'Role'} · locked until step 1`;
    if (r.roleText) return r.roleText;
    if (r.specialty) return `${t.classLabel} specialty`;
    return null;
  };
  return (
    <div className="tb sk">
      {train && blocked ? (
        <Answer
          tone="gold"
          icon={`skill-${train.skill}`}
          cap={capOf()}
          title={blocked.step ?? `Unlock ${skillName} first: it ${blocked.text}`}
          sub={`${t.classLabel} ${t.level} can't train ${skillName} until then`}
        >
          <ol className="tb-list tb-steps">
            <li>
              <StepNo n={1} now={true} />
              <span>{blocked.why ?? upper(blocked.text)}</span>
            </li>
            <li>
              <StepNo n={2} now={false} />
              <span>
                <b>Then train {skillName}</b>
                <span className="tb-note">
                  {' · '}
                  {train.text.split(' · ').slice(1).join(' · ')}
                  {trainRow?.gateText ? ` · ${trainRow.gateText}` : ''}
                </span>
              </span>
            </li>
          </ol>
        </Answer>
      ) : train ? (
        <Answer
          tone="gold"
          icon={`skill-${train.skill}`}
          cap={capOf()}
          title={train.text}
          sub={trainRow?.gateText ? `Next: ${trainRow.gateText}` : null}
          action={<GoalLink actionKey={train.linkKey} />}
        />
      ) : (
        <Answer
          tone="plain"
          icon="sys-skills"
          cap="Skills"
          title={upper(t.status || 'No skill to train on this character right now')}
        />
      )}

      <section className="tb-sec" aria-labelledby={`sk-${index}-skills`}>
        <div className="tb-sec-head">
          <h2 id={`sk-${index}-skills`} className="a-h2">
            Skills
          </h2>
          <span className="tb-note">Bar: progress through this level</span>
        </div>
        <ol className="tb-list sk-tiles" aria-label="Skills">
          {t.rows.map((r) => (
            <SkillTile key={r.skill} r={r} index={index} lit={train?.skill === r.skill} tag={tagOf(r)} />
          ))}
        </ol>
      </section>

      <section className="tb-sec" aria-labelledby={`sk-${index}-slots`}>
        <div className="tb-sec-head">
          <h2 id={`sk-${index}-slots`} className="a-h2">
            Parallel slots
          </h2>
          <span className="tb-note">
            {filled} of {t.slots.length} filled · they earn beside the AFK job
          </span>
        </div>
        <ul className="tb-list sk-slots" aria-label="Parallel Slots">
          {t.slots.map((p) => (
            <SlotTile key={p.kind} p={p} opensAbove={opensSlot === p.kind} />
          ))}
        </ul>
      </section>
    </div>
  );
}

/** FR-31: the Skill Grid as the role matrix; the one cell M20's top slot Goal fills is outlined. */
export function SkillGrid({ grid }: { grid: SkillGridView | null }) {
  const actions = useNowActions();
  const wrap = useRef<HTMLDivElement>(null);
  const highlight = grid?.highlight ?? null;
  // R12 QA: when the table is wider than its frame, say so: a fade on the side with more columns and
  // a "scroll" hint, both gone once the last column is in view.
  const [more, setMore] = useState(false);
  const [scrolls, setScrolls] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the grid (the table's columns) changes.
  useEffect(() => {
    const box = wrap.current;
    if (!box) return;
    const read = () => {
      const over = box.scrollWidth > box.clientWidth + 1;
      setScrolls(over);
      setMore(over && box.scrollLeft + box.clientWidth < box.scrollWidth - 1);
    };
    read();
    box.addEventListener('scroll', read, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
    ro?.observe(box);
    if (box.firstElementChild) ro?.observe(box.firstElementChild);
    return () => {
      box.removeEventListener('scroll', read);
      ro?.disconnect();
    };
  }, [grid]);
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
      <h3 id="skills-h" className="sk-grid-h">
        Skills
      </h3>
      {noOne.length ? (
        <p className="sk-muted">No one is built for {noOne.map((s) => grid.names[s]).join(', ')}.</p>
      ) : null}
      {scrolls ? (
        <p className="sk-grid-hint" aria-hidden="true">
          scroll →
        </p>
      ) : null}
      <div className="sk-grid-frame" data-more={more ? 'yes' : 'no'}>
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
      </div>
    </section>
  );
}
