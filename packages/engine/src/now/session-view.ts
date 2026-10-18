// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-11, FR-N6, FR-N7: the pause point (Log in · Rounds · Log off), the Log in list and the Away
// card. Owned by area N. Phase F declares the signature so the shell's view slot exists; it returns
// null (no pause-point UI) until area N builds it. Pure: no clock beyond `result.asOf`.
import type { EngineResult } from '../result';
import type { NowView, SessionUi, SessionView } from './view';

export function buildSessionView(_view: NowView, _result: EngineResult, _ui: SessionUi): SessionView | null {
  return null;
}
