// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// While parseData runs, the names of sections that threw, so a page can say its data failed to read
// instead of rendering the fallback as if the save were empty.
let failedSections: Set<string> | null = null;

export const trackSectionFailures = (into: Set<string> | null) => {
  failedSections = into;
};

export const safeSection = <T>(name: string, fallback: T, fn: () => T): T => {
  try {
    const result = fn();
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    console.error(`[parsers] section "${name}" failed, using fallback:`, err);
    failedSections?.add(name);
    return fallback;
  }
};
