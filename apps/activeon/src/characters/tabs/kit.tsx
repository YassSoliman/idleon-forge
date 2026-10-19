// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (I-character-b): the parts the Gear, Cards, Signs and Skills tab bodies share. Each tab is its own
// lazy chunk (character-tabs.ts); this small module and tabs.css travel with whichever loads first.
// - <Answer>: the tab's one framed block (rule 1: the answer first; the screen's one `.a-frame`);
// - <GoalLink>: "See it: Anvil", to the System page that shows a Next Action, outlined;
// - <TabSource>: the tab's Sources, in the one-line footer (rule 4, shell/page-sources.tsx).
// Styles are classes, never inline, except a meter's fill (CSP).
import type { SourceView } from '@idleon-forge/engine/now';
import { LINK_WORDS } from '@idleon-forge/engine/now';
import type { ReactNode } from 'react';
import { GameIcon } from '../../art/game/GameIcon';
import type { GameArt } from '../../art/game/game-art';
import { Sprite } from '../../art/sprites/Sprite';
import { PixelArt } from '../../design/art/PixelArt';
import { Frame, GLYPH, SourceLabel } from '../../design/atoms';
import { useNowActions } from '../../now/context';
import { PageSources } from '../../shell/page-sources';
import { formatRoute } from '../../shell/route';
import './tabs.css';

export type Tone = 'gold' | 'ok' | 'plain';

/**
 * The tab's answer: what to do, in one framed block. `icon` is a sprite name drawn on its tone tile;
 * `art` draws the game's own sprite there instead, with `icon` as its fallback.
 */
export function Answer({
  tone,
  icon,
  art,
  cap,
  title,
  sub,
  action,
  children,
  label,
}: {
  tone: Tone;
  icon?: string | null;
  art?: GameArt | null;
  cap: string;
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  /** The section's accessible name; defaults to the cap. */
  label?: string;
}) {
  return (
    <Frame
      tone={tone === 'gold' ? 'gold' : 'ok'}
      className={tone === 'plain' ? 'tb-answer tb-answer--plain' : 'tb-answer'}
      data-tone={tone}
      aria-label={label ?? cap}
    >
      <div className="tb-answer__row">
        {art ? (
          <span className="tb-answer__icon">
            <GameIcon art={art} fallback={icon ?? undefined} size={32} decorative />
          </span>
        ) : icon ? (
          <span className="tb-answer__icon">
            <Sprite name={icon} size={32} decorative />
          </span>
        ) : null}
        <div className="tb-answer__body">
          <p className="a-cap tb-answer__cap">{cap}</p>
          <p className="tb-answer__title">{title}</p>
          {sub ? <p className="tb-answer__sub">{sub}</p> : null}
        </div>
        {action ? <div className="tb-answer__act">{action}</div> : null}
      </div>
      {children}
    </Frame>
  );
}

/** "See it: Anvil": the System page showing this Next Action, outlined there. Null when not shown. */
export function GoalLink({ actionKey, text }: { actionKey: string | null; text?: string }) {
  const actions = useNowActions();
  const goal = actionKey ? actions.result?.account.goals.find((g) => g.nextAction.key === actionKey) : null;
  if (!goal) return null;
  const system = actions.result?.systems?.find((s) => s.id === goal.system);
  const to = { place: 'system' as const, id: goal.system };
  return (
    <a
      className="tb-link"
      href={formatRoute(to)}
      onClick={(e) => {
        if (!actions.navigate) return;
        e.preventDefault();
        actions.navigate(to, { highlight: goal.nextAction.key });
      }}
    >
      <span>{text ?? LINK_WORDS.seeIt(system?.name ?? goal.system)}</span>
      <PixelArt name={GLYPH.arrowRight} decorative />
    </a>
  );
}

/** The goal a Next Action key belongs to, for its words. */
export function useGoal(actionKey: string | null) {
  const actions = useNowActions();
  return actionKey
    ? (actions.result?.account.goals.find((g) => g.nextAction.key === actionKey) ?? null)
    : null;
}

/** A tab's Sources: one quiet line in the page footer (M24 rule 4, <PageSources>). */
export function TabSource({ source, note }: { source: SourceView | null; note?: string | null }) {
  if (!source && !note) return null;
  return (
    <PageSources>
      {note ? <span>{note} · </span> : null}
      {source ? <SourceLabel source={source} more={false} /> : null}
    </PageSources>
  );
}

/** A numbered step: the first filled gold (do it now), the rest a gold number on a tonal square. */
export function StepNo({ n, now }: { n: number; now: boolean }) {
  return (
    <span className="tb-step-no" data-now={now ? 'yes' : 'no'} aria-hidden="true">
      {n}
    </span>
  );
}

/** First letter up: the engine's slot words start lower-case ("needs Lord of the Hunt's quest"). */
export const upper = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** A tab tone as a Pip's tone (grey is "later"). */
export const pipTone = (t: Tone): 'gold' | 'mint' | undefined =>
  t === 'gold' ? 'gold' : t === 'ok' ? 'mint' : undefined;
