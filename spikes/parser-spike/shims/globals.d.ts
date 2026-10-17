// IdleOn Forge parser spike. Copyright (C) 2026 IdleOn Forge contributors. GPL-3.0-only.
// Mirrors the one ambient declaration from Toolbox's root custom.ts that parsers/index.ts relies on.
interface Window {
  gtag?: (...args: unknown[]) => void;
}
