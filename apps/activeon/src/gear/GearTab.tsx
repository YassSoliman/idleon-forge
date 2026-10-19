// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The character page's Gear tab, M24 board `Gear` (I-character-b; M18 FR-24's data). The answer first:
// the one next fix, framed. Then the paper doll: armour on the left, weapon and jewellery on the right,
// the character in the middle; every slot names the piece to get and where it comes from ("Get Pharaoh
// Bow · unlock Spiked Menace at the W2 Task Board"), never "levels behind" alone. A slot opens its
// whole path (the Gear Plan steps) under the doll. Then the tools and the two skill slots (trap set,
// worship skull) with M20's words. A lazy chunk (lazy-part.tsx); the engine words everything.
import type { CharacterGear, GearSlotView, SlotPip } from '@idleon-forge/engine/result';
import { useState } from 'react';
import { Sprite } from '../art/sprites/Sprite';
import { Answer, GoalLink, type Tone, upper, useGoal } from '../characters/tabs/kit';
import { Blob, Pip } from '../design/atoms';
import type { CharacterTabProps } from '../now/character-tabs';
import { useNowActions } from '../now/context';
import './gear.css';

type SlotId = GearSlotView['slot'];

const LABEL: Readonly<Record<SlotId, string>> = {
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
  rod: 'Fishing rod',
  net: 'Bug net',
  trap: 'Trap set',
  skull: 'Worship skull',
};
/** The kit's sprite for each slot (gear-pickaxe draws the Mining pickaxe, gear-trap the trap). */
const SPRITE: Readonly<Record<SlotId, string>> = {
  helmet: 'gear-helmet',
  weapon: 'gear-weapon',
  shirt: 'gear-shirt',
  pendant: 'gear-pendant',
  pants: 'gear-pants',
  ring1: 'gear-ring',
  shoes: 'gear-shoes',
  ring2: 'gear-ring',
  pickaxe: 'gear-pickaxe',
  hatchet: 'gear-hatchet',
  rod: 'gear-rod',
  net: 'gear-net',
  trap: 'gear-trap',
  skull: 'gear-skull',
};
const LEFT: readonly SlotId[] = ['helmet', 'shirt', 'pants', 'shoes'];
const RIGHT: readonly SlotId[] = ['weapon', 'pendant', 'ring1', 'ring2'];
const TOOLS: readonly SlotId[] = ['pickaxe', 'hatchet', 'rod', 'net'];
/** A tool's skill (the ladder's key) and the verb for "Only while mining". */
const TOOL_SKILL: Partial<Record<SlotId, { skill: string; verb: string }>> = {
  pickaxe: { skill: 'mining', verb: 'mining' },
  hatchet: { skill: 'chopping', verb: 'chopping' },
  rod: { skill: 'fishing', verb: 'fishing' },
  net: { skill: 'catching', verb: 'catching' },
};

/** One slot as the doll draws it: a tone, the icon's tone, and three lines of words. */
interface Look {
  tone: Tone;
  icon: Tone;
  status: string;
  where: string | null;
  /** "Lv 50" with "to wear" under it, for a piece to get. */
  lv: number | null;
}

const KIND_ORDER = ['empty', 'replace', 'ok'] as const;
type Kind = (typeof KIND_ORDER)[number] | 'unknown';

function kindOf(v: GearSlotView): Kind {
  if (v.state === 'empty') return 'empty';
  if (v.state === 'behind' || v.state === 'held-upgrade') return 'replace';
  if (v.state === 'ok') return 'ok';
  return 'unknown';
}

/** The words of one armour, weapon or jewellery slot. */
function lookOf(v: GearSlotView, lit: boolean, step: string | null, goalText: string | null): Look {
  const t = v.target;
  if (lit && step)
    return {
      tone: 'gold',
      icon: v.state === 'empty' ? 'plain' : 'gold',
      status: step,
      where: t && v.state === 'empty' ? `Gear Plan piece after it: ${t.name}, Lv ${t.lvReq}` : null,
      lv: null,
    };
  if (v.state === 'held-upgrade')
    return { tone: 'gold', icon: 'gold', status: v.held[0] ?? upper(v.word), where: null, lv: null };
  if (v.state === 'empty')
    return goalText
      ? {
          tone: 'gold',
          icon: 'plain',
          status: goalText,
          where: t ? `Later: ${t.name}, Lv ${t.lvReq}` : null,
          lv: null,
        }
      : t
        ? { tone: 'gold', icon: 'plain', status: `Get ${t.name}`, where: t.how, lv: t.lvReq }
        : { tone: 'gold', icon: 'plain', status: 'Empty: fill it', where: null, lv: null };
  if (v.state === 'behind')
    return t
      ? { tone: 'gold', icon: 'gold', status: `Get ${t.name}`, where: t.how, lv: t.lvReq }
      : { tone: 'gold', icon: 'gold', status: upper(v.word), where: null, lv: null };
  if (v.state === 'ok')
    return {
      tone: 'ok',
      icon: 'ok',
      status: 'OK for now',
      where:
        [v.equipped?.name, t ? `later: ${t.name}, Lv ${t.lvReq}` : null].filter(Boolean).join(' · ') || null,
      lv: null,
    };
  return { tone: 'plain', icon: 'plain', status: "Can't tell", where: v.note, lv: null };
}

function SlotTile({
  v,
  look,
  lit,
  open,
  onOpen,
}: {
  v: GearSlotView;
  look: Look;
  lit: boolean;
  open: boolean;
  onOpen: () => void;
}) {
  const wearing = v.equipped && v.state !== 'ok' ? ` · wearing ${v.equipped.name}` : '';
  return (
    <button
      type="button"
      className="gd-slot"
      data-tone={look.tone}
      data-lit={lit ? 'yes' : 'no'}
      aria-expanded={open}
      aria-controls="gear-path"
      onClick={onOpen}
    >
      <span className="tb-ic" data-tone={look.icon}>
        <Sprite name={SPRITE[v.slot]} size={32} decorative />
      </span>
      <span className="gd-slot__words">
        <span className="tb-xs">
          {LABEL[v.slot]}
          {wearing}
        </span>
        <span className="gd-slot__status">{look.status}</span>
        {look.where ? <span className="gd-slot__where">{look.where}</span> : null}
      </span>
      {lit ? (
        <span className="gd-slot__next">Next</span>
      ) : look.lv !== null ? (
        <span className="gd-slot__lv">
          <b>Lv {look.lv}</b>
          <span className="tb-xs">to wear</span>
        </span>
      ) : null}
    </button>
  );
}

/** The open slot's whole path: what it wears, the Gear Plan target and every step to it. */
function Path({ v }: { v: GearSlotView }) {
  const [all, setAll] = useState(false);
  const steps = v.target?.steps ?? [];
  const e = v.equipped;
  const isTool = v.slot === 'weapon' || ['pickaxe', 'hatchet', 'rod', 'net'].includes(v.slot);
  return (
    <section id="gear-path" className="gd-path" aria-label={`${LABEL[v.slot]}: the whole path`}>
      <h3 className="a-h2">{LABEL[v.slot]}</h3>
      <dl className="gd-facts">
        <div>
          <dt>Wearing</dt>
          <dd>
            {e
              ? `${e.name} · Lv ${e.lvReq} · ${isTool ? 'Weapon Power' : 'Defence'} ${e.primary} · main stat ${e.main}${e.pct.length ? ` · ${e.pct.join(', ')}` : ''} · upgrade slots ${e.slotsLeft} of ${e.slotsMax} free`
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
          <ol className="gd-steps">
            {(all ? steps : steps.slice(0, 3)).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          {steps.length > 3 ? (
            <button type="button" className="gd-more" onClick={() => setAll(!all)}>
              {all ? 'Show fewer' : `Show all ${steps.length} steps`}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

/** A tool tile: only while this character AFKs that skill. */
function ToolTile({ v, g }: { v: GearSlotView; g: CharacterGear }) {
  const tool = TOOL_SKILL[v.slot];
  const ladder = tool ? g.ladders.find((l) => l.skill === tool.skill) : undefined;
  const worn = v.equipped?.name ?? null;
  const tone: Tone = ladder ? (v.state === 'empty' || v.state === 'behind' ? 'gold' : 'ok') : 'plain';
  const status = worn ?? (ladder ? 'Empty: fill it' : 'Empty');
  const where = ladder
    ? (ladder.next ?? `${upper(tool?.verb ?? '')} level ${ladder.skillLevel}`)
    : `Only while ${tool?.verb ?? 'skilling'}`;
  return (
    <li className="a-tile gd-tool" data-tone={tone}>
      <span className="tb-ic" data-tone={tone}>
        <Sprite name={SPRITE[v.slot]} size={32} decorative />
      </span>
      <span className="tb-xs">{LABEL[v.slot]}</span>
      <span className="gd-tool__status">{status}</span>
      <span className="tb-xs">{where}</span>
    </li>
  );
}

/** The trap set and the worship skull, in M20's words (the Parallel Slot pips). */
function SkillSlotTile({ slot, pip }: { slot: 'trap' | 'skull'; pip: SlotPip | undefined }) {
  const goal = useGoal(pip?.linkKey ?? null);
  let tone: Tone = 'plain';
  let status = "Can't tell";
  let where: string | null = null;
  if (pip) {
    const noSkull = slot === 'skull' ? /^no skull \(max (\d+)\)$/.exec(pip.text) : null;
    if (noSkull) {
      status = 'None yet';
      where = `Without one, worship charge stops at ${noSkull[1]}`;
      tone = goal ? 'gold' : 'plain';
    } else if (pip.state === 'unfillable' || pip.state === 'locked') {
      status = 'Not open yet';
      where = upper(pip.text);
    } else if (pip.state === 'fillable') {
      status = upper(pip.text);
      tone = 'gold';
    } else if (pip.state === 'filled' || pip.state === 'capped') {
      status = upper(pip.text);
      tone = goal ? 'gold' : 'ok';
    } else where = upper(pip.text);
  }
  return (
    <li className="a-tile gd-tool" data-tone={tone}>
      <span className="tb-ic" data-tone={tone}>
        <Sprite name={SPRITE[slot]} size={32} decorative />
      </span>
      <span className="tb-xs">{LABEL[slot]}</span>
      <span className="gd-tool__status">{status}</span>
      {where ? <span className="tb-xs">{where}</span> : null}
      {goal ? <GoalLink actionKey={goal.nextAction.key} text={goal.nextAction.text} /> : null}
    </li>
  );
}

/** The character page's Gear tab (character-tabs.ts), `#gear-<index>`. */
export function GearTab({ view, index }: CharacterTabProps) {
  const g = view.gear?.characters.find((c) => c.index === index);
  // The open path belongs to one character: another character's tab starts closed.
  const [opened, setOpen] = useState<{ index: number; slot: SlotId } | null>(null);
  const goals = useGoalTexts();
  if (!g || g.slots.length === 0) return <p className="tb-note tb">No gear data for this character yet.</p>;
  const who = view.skills.find((s) => s.index === index);
  const label = who ? `${who.classLabel} ${who.level}` : '';
  const pips = who?.slots ?? [];
  const openSlot = opened?.index === index ? opened.slot : null;
  const byId = (slot: SlotId) => g.slots.find((x) => x.slot === slot) ?? null;
  const armour = [...LEFT, ...RIGHT].map(byId).filter((x): x is GearSlotView => x !== null);
  const looks = new Map(
    armour.map((v) => {
      const look = lookOf(v, g.lit === v.slot, g.step, v.actionKey ? (goals.get(v.actionKey) ?? null) : null);
      // "Lv 30 to wear" only while the character is below it (M24 QA P3).
      return [
        v.slot,
        who && look.lv !== null && who.level >= look.lv ? { ...look, lv: null } : look,
      ] as const;
    }),
  );
  const count = (k: Kind) => armour.filter((v) => kindOf(v) === k).length;
  const litView = g.lit ? byId(g.lit) : null;
  const tile = (slot: SlotId) => {
    const v = byId(slot);
    const look = looks.get(slot);
    if (!v || !look) return null;
    return (
      <li key={slot}>
        <SlotTile
          v={v}
          look={look}
          lit={g.lit === slot}
          open={openSlot === slot}
          onOpen={() => setOpen(openSlot === slot ? null : { index, slot })}
        />
      </li>
    );
  };
  const open = openSlot ? byId(openSlot) : null;
  return (
    <div className="tb gd">
      {g.step ? (
        <Answer
          tone="gold"
          icon={g.lit ? SPRITE[g.lit] : null}
          cap="Next fix"
          title={g.step}
          sub={g.why}
          action={<GoalLink actionKey={litView?.actionKey ?? null} />}
        />
      ) : (
        <Answer tone="ok" icon="status-check" cap="Gear" title={upper(g.status)} sub={g.note} />
      )}

      <ul className="tb-list tb-legend" aria-label="Slots by state">
        {count('empty') ? (
          <li>
            <Pip tone="gold" />
            {count('empty')} empty: fill now
          </li>
        ) : null}
        {count('replace') ? (
          <li>
            <Pip tone="gold" />
            {count('replace')} to replace: each names the piece and where it comes from
          </li>
        ) : null}
        {count('ok') ? (
          <li>
            <Pip tone="mint" />
            {count('ok')} OK for now
          </li>
        ) : null}
      </ul>

      <section className="gd-doll" aria-label="Paper doll">
        <ul className="tb-list gd-col" aria-label="Armour">
          {LEFT.map(tile)}
        </ul>
        <figure className="gd-fig">
          <Blob family={view.families?.[index] ?? 'beginner'} size={160} />
          <figcaption className="tb-xs">{label}</figcaption>
        </figure>
        <ul className="tb-list gd-col" aria-label="Weapon and jewellery">
          {RIGHT.map(tile)}
        </ul>
      </section>

      {open ? <Path key={open.slot} v={open} /> : null}

      <section className="tb-sec" aria-labelledby={`gd-${index}-tools`}>
        <div className="tb-sec-head">
          <h2 id={`gd-${index}-tools`} className="a-h2">
            Tools and skill slots
          </h2>
          <span className="tb-note">A tool only matters while this character AFKs that skill</span>
        </div>
        <ul className="tb-list gd-tools">
          {TOOLS.map((slot) => {
            const v = byId(slot);
            return v ? <ToolTile key={slot} v={v} g={g} /> : null;
          })}
          <SkillSlotTile slot="trap" pip={pips.find((p) => p.kind === 'trap')} />
          <SkillSlotTile slot="skull" pip={pips.find((p) => p.kind === 'worship')} />
        </ul>
      </section>
      {g.step && g.note ? <p className="tb-note">{g.note}</p> : null}
    </div>
  );
}

/** Every shown Next Action's text by key, for the slots a Goal answers ("Craft Copper Platelegs …"). */
function useGoalTexts(): Map<string, string> {
  const actions = useNowActions();
  return new Map((actions.result?.account.goals ?? []).map((x) => [x.nextAction.key, x.nextAction.text]));
}
