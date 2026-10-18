// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F1 the Daily & Weekly Checklist (docs/specs/M20-skills-parallel-slots.md FR-12 to FR-15), redrawn by
// M21 FR-T2. Its full picture lives on the Timeline (`#daily`, `timeline/DailyWeekly.tsx`, with its rows
// in `timeline/ChecklistRow.tsx`); Now's Account keeps M20's one ring line, which links there
// (`ChecklistSection`, the export name Now's Account imports). The engine words everything.
import type { ChecklistView } from '@idleon-forge/engine/now';
import { PixelArt } from '../design/art/PixelArt';
import { formatRoute } from '../shell/route';
import { useNowActions } from './context';
import './checklist.css';

/** The two rings as one small picture: today outside, this week inside (the counts are the text). */
export function Rings({ v, size = 44 }: { v: ChecklistView; size?: 44 }) {
  const arc = (done: number, total: number, r: number) => {
    const c = 2 * Math.PI * r;
    const f = total > 0 ? done / total : 0;
    return { strokeDasharray: `${c * f} ${c}`, r };
  };
  const t = arc(v.rings.today.done, v.rings.today.total, 18);
  const w = arc(v.rings.week.done, v.rings.week.total, 11);
  return (
    <svg className="cl-rings" viewBox="0 0 44 44" width={size} height={size} aria-hidden="true">
      <circle className="cl-track" cx="22" cy="22" r={t.r} />
      <circle
        className="cl-today"
        cx="22"
        cy="22"
        r={t.r}
        strokeDasharray={t.strokeDasharray}
        transform="rotate(-90 22 22)"
      />
      <circle className="cl-track" cx="22" cy="22" r={w.r} />
      <circle
        className="cl-week"
        cx="22"
        cy="22"
        r={w.r}
        strokeDasharray={w.strokeDasharray}
        transform="rotate(-90 22 22)"
      />
    </svg>
  );
}

/**
 * Now's Account: M20's one ring line (M21 FR-T2), linking to the full Daily & Weekly picture on the
 * Timeline. The rings' text equivalent and the daily reset say it all in words.
 */
export function ChecklistSection({ view }: { view: ChecklistView | null }) {
  const actions = useNowActions();
  if (!view) return null;
  const route = { place: 'timeline', section: 'daily' } as const;
  return (
    <p className="checklist cl-line" id="checklist">
      <a
        className="cl-line-a"
        href={formatRoute(route)}
        onClick={(e) => {
          if (!actions.navigate) return;
          e.preventDefault();
          actions.navigate(route);
        }}
      >
        <Rings v={view} />
        <span className="cl-sum-text">
          <b>Daily &amp; Weekly</b> <span className="num">{view.ringText}</span>
          <span className="cl-daily"> · {view.dailyText}</span>
        </span>
        <PixelArt name="ui-arrow-right" decorative />
      </a>
    </p>
  );
}
