// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `import.meta.glob` (expanded by Vite and Vitest) for this package's own typecheck. Kept out of
// detectors/index.ts so a Vite app, whose vite/client types declare it too, doesn't see it twice.
interface ImportMeta {
  glob<T>(pattern: string | string[], options: { eager: true }): Record<string, T>;
}
