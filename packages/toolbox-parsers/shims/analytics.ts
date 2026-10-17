// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Stub for Toolbox's @utility/analytics (a gtag wrapper). The Forge sends no telemetry.
export const trackEvent = (_name: string, _params?: Record<string, unknown>): void => {};
export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
