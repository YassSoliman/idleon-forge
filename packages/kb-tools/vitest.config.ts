// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: '@idleon-forge/kb-tools',
    // Fixture parses take 0.3–1.1 s each, and the scrub tests parse twice.
    testTimeout: 180_000,
    hookTimeout: 180_000,
    env: { TZ: 'UTC' },
  },
});
