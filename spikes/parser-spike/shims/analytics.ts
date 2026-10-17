// IdleOn Forge parser spike. Copyright (C) 2026 IdleOn Forge contributors. GPL-3.0-only.
// Stub for @utility/analytics (gtag wrapper). No telemetry in the Forge.
export const trackEvent = (_name: string, _params?: Record<string, unknown>): void => {};
export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
