// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Usage: node packages/release/bin/generate.ts [--app activeon]
// Writes apps/<app>/public/version.json and whats-new.json and prints the BuildInfo.
// Channel and PR come from VITE_DEPLOY_CHANNEL and VITE_PR_NUMBER.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from '../src/node.ts';

const args = process.argv.slice(2);
const i = args.indexOf('--app');
const app = i >= 0 ? args[i + 1] : 'activeon';
if (!app || !/^[a-z0-9-]+$/.test(app)) {
  console.error('usage: generate.ts [--app <name>]');
  process.exit(2);
}
const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const { buildInfo } = generate({ appDir: join(root, 'apps', app) });
console.log(JSON.stringify(buildInfo, null, 2));
