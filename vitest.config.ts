// SPDX-License-Identifier: GPL-3.0-only
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*', 'workers/*'],
  },
});
