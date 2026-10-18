// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Account section's body, a lazy part (M21 TR-12 offset 1, FR-N10): the account safety doubt,
// Before you leave, the Daily & Weekly Checklist (area T's section), the Goals (ranked, one winner, at
// most 5), the Spend Plan, the Star Chart line, Done this session, If you have time and Not covered yet.
// - `cards.spend-plan` Best buy, then save up for (FR-N9): one "Best buy now", one "Save up for", then the
//   rest, at most 5 lines; each line splits payer and cost onto one line with "Bring first" under it
//   (`cards.spend-line` Split paragraph). From 1000 px the lines sit as the ledger (CSS only).
// - `cards.if-you-have-time` Extra seal, muted, at the very bottom; `cards.not-covered` One honest line.
import {
  CARD_WORDS,
  LINK_WORDS,
  type NowView,
  type SpendLineView,
  ACCOUNT_WORDS as W,
} from '@idleon-forge/engine/now';
import { useState } from 'react';
import { PixelArt } from '../../design/art/PixelArt';
import { SourceLabel } from '../../design/atoms';
import { Button, cx } from '../../design/atoms/Button';
import { formatRoute } from '../../shell/route';
import { ChecklistSection } from '../Checklist';
import { ModalSheet as Sheet } from '../chrome/ModalSheet';
import { useNowActions } from '../context';
import { ActionControls, NextActionItem, RankedGoals, ReportThis, SeeItLink } from '../parts';

const SPEND_SHOWN = 5;

/** D-9: one Star Chart line in the Account; the chart and every character's signs live on its System page. */
function StarChartLine({ view }: { view: NowView }) {
  const actions = useNowActions();
  const s = view.starSigns;
  if (!s) return null;
  const to = { place: 'system', id: 'star-signs' } as const;
  return (
    <p className="n-account__line" id="star-chart">
      <span>{W.starChartSummary(s.points, s.unlockedNodes)}</span>{' '}
      <a
        className="n-see"
        href={formatRoute(to)}
        onClick={(e) => {
          if (!actions.navigate) return;
          e.preventDefault();
          actions.navigate(to);
        }}
      >
        {W.starChartSee}
      </a>
    </p>
  );
}

/**
 * R11 QA: "Bring first" as short steps, one per line (12 words or fewer each): the grouped names, then
 * each carry. Up to three show; the sheet behind the line has the full detail.
 */
export function bringSteps(detail: string): string[] {
  return detail
    .split(/ · |; /)
    .map((x) => x.trim())
    .filter(Boolean);
}
const BRING_SHOWN = 3;
function BringFirst({ detail }: { detail: string }) {
  const steps = bringSteps(detail);
  const more = steps.length - BRING_SHOWN;
  return (
    <div className="n-sline__bring spend-detail">
      <span className="n-sline__bring-k">{W.bringFirst}</span>
      <ul className="n-sline__bring-l">
        {steps.slice(0, BRING_SHOWN).map((x) => (
          <li key={x}>{x}</li>
        ))}
        {more > 0 ? <li className="n-muted">{W.bringMore(more)}</li> : null}
      </ul>
    </div>
  );
}

function SpendLine({ l, place }: { l: SpendLineView; place: 'best' | 'save' | 'rest' }) {
  const [open, setOpen] = useState(false);
  const actions = useNowActions();
  return (
    <li className={cx('spend-line n-sline', `is-${l.status}`, `is-${place}`, l.status)}>
      {place !== 'rest' ? (
        <p className="n-sline__k">
          {place === 'best' ? <PixelArt name="cards-best-stamp" decorative /> : null}
          {place === 'best' ? W.bestBuy : W.saveUp}
        </p>
      ) : null}
      <button type="button" className="n-sline__open" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span className="n-sline__t">{l.text}</span>
        <span className="n-sline__meta">
          {l.payer ? <span className="n-sline__who">{l.payer}</span> : null}
          {l.cost ? <span className="num n-sline__cost">{l.cost}</span> : null}
          {l.levels ? <span className="num n-muted">{l.levels}</span> : null}
          <span className={`n-sline__status s-${l.status}`}>{l.statusText}</span>
        </span>
      </button>
      {l.detail ? <BringFirst detail={l.detail} /> : null}
      {l.runningTotal ? <p className="n-muted n-small num">{l.runningTotal}</p> : null}
      {l.note ? <p className="n-muted n-small">{l.note}</p> : null}
      <button type="button" className="a-btn a-btn--quiet n-skip" onClick={() => actions.skip(l.key)}>
        <PixelArt name="cards-zz" scale={2} decorative />
        <span>{CARD_WORDS.skip}</span>
      </button>
      <Sheet open={open} title={W.spend} onClose={() => setOpen(false)}>
        <div className="n-why">
          <p className="n-why__act">{l.text}</p>
          {l.detail ? <p>{l.detail}</p> : null}
          {l.source ? (
            <div className="n-why__src na-meta">
              <SourceLabel source={l.source} more={false} />
            </div>
          ) : null}
          <ActionControls
            actionKey={l.key}
            controls={{ skip: true, notForMe: true, report: true }}
            text={l.text}
            report={{
              outputKind: 'spend-line',
              entryIds: [l.key.split('@')[0] ?? l.key],
              fields: [],
              text: l.text,
              stale: l.stale,
              contested: l.contested,
            }}
          />
        </div>
      </Sheet>
    </li>
  );
}

function SpendPlan({ view }: { view: NowView }) {
  const actions = useNowActions();
  const sp = view.account.spendPlan;
  if (!sp) return null;
  const best = sp.lines.find((l) => l.status === 'buy' || l.status === 'move-coins') ?? null;
  const save = sp.lines.find((l) => l.status === 'save-for') ?? null;
  const rest = sp.lines.filter((l) => l !== best && l !== save);
  const expanded = actions.expanded.has('spend');
  return (
    <section className="spend n-spend" id="spend-plan" aria-labelledby="spend-h" tabIndex={-1}>
      <h3 className="n-sub-h" id="spend-h">
        {W.spend}
        <span className="n-muted num"> · {sp.summary}</span>
      </h3>
      <ol className="spend-lines n-slines">
        {best ? <SpendLine l={best} place="best" /> : null}
        {save ? <SpendLine l={save} place="save" /> : null}
        {(expanded ? rest : rest.slice(0, Math.max(0, SPEND_SHOWN - (best ? 1 : 0) - (save ? 1 : 0)))).map(
          (l) => (
            <SpendLine key={l.id} l={l} place="rest" />
          ),
        )}
      </ol>
      {sp.hiddenCount > 0 || expanded ? (
        <button
          type="button"
          className="a-chip n-count-chip"
          aria-expanded={expanded}
          onClick={() => actions.toggle('spend')}
        >
          <span>{expanded ? CARD_WORDS.less : CARD_WORDS.more(sp.hiddenCount)}</span>
        </button>
      ) : null}
      {sp.skippedKeys.length ? (
        <p className="n-skipped">
          <PixelArt name="cards-zz" scale={2} decorative />
          <span>{CARD_WORDS.skippedLine(sp.skippedKeys.length)}</span>
          <button type="button" className="n-link-btn" onClick={() => actions.unskip(sp.skippedKeys)}>
            {CARD_WORDS.undo}
          </button>
        </p>
      ) : null}
      {sp.unavailable.map((u) => (
        <p key={u} className="n-muted n-small">
          {u}
        </p>
      ))}
    </section>
  );
}

function NotCoveredYet({ view }: { view: NowView }) {
  const actions = useNowActions();
  const [open, setOpen] = useState(false);
  const n = view.notCovered.length;
  if (n === 0) return null;
  return (
    <section className="not-covered n-omit" aria-label={W.notCovered}>
      <PixelArt name="now-magnifier" scale={2} decorative />
      <div>
        <p>
          <b>
            {W.notCovered} · <span className="num">{n}</span>
          </b>
        </p>
        <p className="n-muted n-small">{W.notCoveredLine}</p>
        <p className="n-omit__actions">
          <button type="button" className="n-link-btn" aria-haspopup="dialog" onClick={() => setOpen(true)}>
            {CARD_WORDS.show}
          </button>
          {actions.navigate ? (
            <a
              href={formatRoute({ place: 'systems' })}
              className="to-systems n-link-btn"
              onClick={(e) => {
                e.preventDefault();
                actions.navigate?.({ place: 'systems' });
              }}
            >
              {LINK_WORDS.toSystems}
            </a>
          ) : null}
        </p>
      </div>
      <Sheet open={open} title={`${W.notCovered} · ${n}`} onClose={() => setOpen(false)}>
        <p className="n-muted">{W.notCoveredLine}</p>
        <ul className="n-omit__list">
          {view.notCovered.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Sheet>
    </section>
  );
}

export function AccountBody({ view }: { view: NowView }) {
  const actions = useNowActions();
  const acc = view.account;
  return (
    <div className="n-account__inner">
      {acc.safetyUnknown ? (
        <div className="n-unknown verdict unknown">
          <PixelArt name="now-glyph-question" decorative />
          <p>{acc.safetyUnknown.text}</p>
          <div className="controls n-controls">
            {acc.safetyUnknown.skipped ? (
              <Button tone="plain" onClick={() => actions.unskip(['unknown@account'])}>
                skipped · undo
              </Button>
            ) : (
              <button
                type="button"
                className="a-btn a-btn--quiet n-skip"
                onClick={() => actions.skip('unknown@account')}
              >
                <PixelArt name="cards-zz" scale={2} decorative />
                <span>{CARD_WORDS.skip}</span>
              </button>
            )}
            <ReportThis
              input={{
                outputKind: 'verdict',
                entryIds: [],
                fields: [],
                text: acc.safetyUnknown.text,
                stale: false,
                contested: false,
              }}
            />
          </div>
        </div>
      ) : null}
      {acc.blockers.length > 0 ? (
        <div className="verdict fix n-account__fix" id="account-fix" tabIndex={-1}>
          <h3 className="n-sub-h">{W.fixFirst}</h3>
          <ul className="goals blockers">
            {acc.blockers.map((g) => (
              <li key={g.action.key}>
                <NextActionItem
                  action={g.action}
                  milestone={g.milestone}
                  details={g.details}
                  walkthrough={g.walkthrough}
                  seeIt={<SeeItLink goal={g} subject="account" />}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ChecklistSection view={view.checklist} />
      {acc.goals.length > 0 || acc.hiddenCount > 0 || acc.skippedKeys.length > 0 ? (
        <section className="n-goals" aria-label={W.goals}>
          <h3 className="n-sub-h">{W.goals}</h3>
          <RankedGoals
            goals={acc.goals}
            subject="account"
            hiddenCount={acc.hiddenCount}
            skipped={acc.skippedKeys}
            dismissed={acc.dismissed}
          />
        </section>
      ) : null}
      <SpendPlan view={view} />
      <StarChartLine view={view} />
      {acc.done.length > 0 ? (
        <details className="done n-done">
          <summary>{`Done this session (${acc.done.length})`}</summary>
          <ul>
            {acc.done.map((d) => (
              <li key={d.key}>
                <PixelArt name="now-glyph-check" decorative />
                <s>{d.text}</s> <span className="n-muted num">{d.time}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {view.activePlay.length > 0 ? (
        <section aria-labelledby="iyht-h" className="n-extra">
          <h3 id="iyht-h" className="n-sub-h">
            <PixelArt name="cards-seal-chest" decorative />
            {W.ifYouHaveTime}
            <span className="n-muted num"> {view.activePlay.length}</span>
          </h3>
          <ul>
            {view.activePlay.map((a) => (
              // Keyed like a Next Action, so the checklist's "If you have time ↓" lands and outlines it.
              <li
                key={a.key}
                data-na-key={a.key}
                className={cx('iyht', actions.highlight === a.key && 'lit')}
              >
                <span>
                  {a.text}
                  {a.who ? <span className="n-muted"> · {a.who}</span> : null}
                </span>
                <span className="n-muted num">{a.estimate}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <NotCoveredYet view={view} />
    </div>
  );
}
