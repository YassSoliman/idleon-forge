// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Toolbox's parsers call `new Date()` / `Date.now()` for timers and time away. To make a parse a pure
// function of (save, now), the global `Date` is swapped for a frozen one while `fn` runs. Parsing is
// synchronous, so nothing else observes the swap. Explicit dates (`new Date(x)`) behave normally.

export function withFrozenClock<T>(now: number, fn: () => T): T {
  const RealDate = globalThis.Date;
  const Frozen = new Proxy(RealDate, {
    construct(target, args) {
      return args.length === 0 ? new target(now) : new target(...(args as [number]));
    },
    apply() {
      // `Date()` called as a function returns a string for the current time.
      return new RealDate(now).toString();
    },
    get(target, prop, receiver) {
      if (prop === 'now') return () => now;
      return Reflect.get(target, prop, receiver);
    },
  });
  globalThis.Date = Frozen;
  try {
    return fn();
  } finally {
    globalThis.Date = RealDate;
  }
}
