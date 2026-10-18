// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Now place (M10): the Roster, or a Character page (Focus with its tabs), with the Account section,
// "If you have time" and "Not covered yet" under it, built from one `NowView` (TR-3). The session state
// it used to own (the follow state, the frozen Visit Order, `expanded`, the live region) lives in the
// shell now (M17 FR-10, `shell/session.ts`), so it survives place moves. It never orders or filters
// advice itself: `buildNowView` does.
import { PLACE_WORDS } from '@idleon-forge/engine/now';
import type { Session } from '../shell/session';
import { AccountSection, IfYouHaveTime, NotCoveredYet } from './Account';
import { Focus } from './Focus';
import { Roster } from './Roster';
import { buildInfo } from './release';
import { suggestUrl } from './report';

export type { NowSave, ShellProps as NowScreenProps } from '../shell/session';

/** A Character page is the same object from every place (M17 FR-15): Focus plus Now's sections. */
export function NowPlace({ s }: { s: Session }) {
  const { view, result, focusChar, suggestions, refs } = s;
  return (
    <>
      <div ref={refs.cardRef}>
        {view.focus ? (
          <Focus
            ref={refs.headingRef}
            card={view.focus}
            pendingFollow={null}
            showCloudSaveTip={
              s.live &&
              s.fresh &&
              s.follow.playing?.index === view.focus.index &&
              s.follow.playing.status !== 'confirmed'
            }
            onBack={s.back}
            onNext={s.onNext}
            tab={s.pageTab}
            onTab={(id) =>
              view.focus &&
              s.navigate({ place: 'character', index: view.focus.index, tab: id }, 'replace', {
                origin: s.origin,
              })
            }
            view={view}
            openConfusing={
              suggestions
                ? () =>
                    suggestions.open({
                      kind: 'suggest',
                      type: 'confusing',
                      screen: 'character',
                      characterIndex: focusChar?.index ?? null,
                    })
                : null
            }
            onConfusing={() =>
              suggestUrl('confusing', {
                screen: 'character',
                character: focusChar ? { classLabel: focusChar.classLabel, level: focusChar.level } : null,
                stage: result.stage.id,
                knowledge: result.versions.knowledge,
                gameBuild: result.versions.gameBuild,
                build: buildInfo,
              })
            }
          />
        ) : (
          <>
            <h2 className="sr-only" data-place-heading tabIndex={-1}>
              {PLACE_WORDS.now}
            </h2>
            <Roster
              view={view}
              onOpen={(i) => s.open(i)}
              onSpend={s.toSpend}
              rowRef={(i, el) => {
                if (el) refs.rows.current.set(i, el);
                else refs.rows.current.delete(i);
              }}
            />
          </>
        )}
      </div>
      <AccountSection ref={refs.accountRef} view={view} />
      <IfYouHaveTime view={view} />
      <NotCoveredYet view={view} />
    </>
  );
}
