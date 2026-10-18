// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The types of area N's session view (engine `now/session-view.ts`), read off `buildSessionView` so the
// engine barrel (Phase F's, frozen) needn't list them. Type-only: nothing here reaches the bundle.
import type { buildSessionView } from '@idleon-forge/engine/now';

export type NowSessionView = ReturnType<typeof buildSessionView>;
export type CounterView = NowSessionView['counter'];
export type FirstFix = NonNullable<CounterView['first']>;
export type WhoToken = NonNullable<FirstFix['who']>;
export type GroupedJobView = NowSessionView['groups'][number];
export type FindingView = NowSessionView['findings'][number];
export type AwayView = NonNullable<NowSessionView['away']>;
export type LoginRow = NonNullable<NowSessionView['login']>['rows'][number];
export type LogoffItem = NowSessionView['logoff']['items'][number];
