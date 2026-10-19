// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the account pages' breadcrumb: "← Now / Spend Plan" (canvas boards SpendPlan and Goals).
import { PixelArt } from '../design/art/PixelArt';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';

export function Crumb({ s, here, back }: { s: Session; here: string; back: string }) {
  return (
    <nav aria-label="Breadcrumb" className="ac-crumb">
      <a
        href={formatRoute({ place: 'now' })}
        className="ac-crumb__back"
        onClick={(e) => {
          e.preventDefault();
          s.navigate({ place: 'now' }, 'push');
        }}
      >
        <PixelArt name="ui-arrow-left" decorative />
        <span>{back}</span>
      </a>
      <span className="ac-crumb__sep" aria-hidden="true">
        /
      </span>
      <span className="ac-crumb__here" aria-current="page">
        {here}
      </span>
    </nav>
  );
}
