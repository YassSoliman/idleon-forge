// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Mirrors the one ambient declaration from Toolbox's root custom.ts that parsers/index.ts relies on.
interface Window {
  gtag?: (...args: unknown[]) => void;
}
