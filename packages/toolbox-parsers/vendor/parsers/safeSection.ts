// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 340ef2ccfa460673b759369dabf8996eb11d8086.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
export const safeSection = <T>(name: string, fallback: T, fn: () => T): T => {
  try {
    const result = fn();
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    console.error(`[parsers] section "${name}" failed, using fallback:`, err);
    return fallback;
  }
};
