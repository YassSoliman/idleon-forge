// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Writes VERIFIED_BUILDS: the highest server build (GameVERSION) and save format (CSver) among the
// public fixtures that parse cleanly at this pin (an account, characters with data, no failed section,
// no top-level error). Shipped in the bundle so a fresh browser never mistakes an old build for a new
// one (M1 FR-29). Run by scripts/sync.sh after a build; `--check` only compares and exits 1 on drift.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = path.join(root, '../account-state/fixtures/public');
const out = path.join(root, 'VERIFIED_BUILDS');
const { normalizeEnvelope, parseSave } = await import(path.join(root, 'dist/index.js'));

const NOW = Date.UTC(2026, 9, 17, 12);
let serverBuild = 0;
let saveVersion = 0;
for (const file of readdirSync(fixtures).filter((f) => f.endsWith('.json'))) {
  const envelope = normalizeEnvelope(JSON.parse(readFileSync(path.join(fixtures, file), 'utf8')));
  const parsed = parseSave(envelope, { now: NOW });
  const clean =
    Object.keys(parsed.account).length > 0 &&
    parsed.characters.some((c) => typeof c.class === 'string') &&
    parsed.failedSections.length === 0 &&
    parsed.error === null;
  if (!clean) continue;
  const build = Number(envelope.serverVars?.GameVERSION);
  if (Number.isFinite(build)) serverBuild = Math.max(serverBuild, build);
  if (parsed.meta.saveVersion !== null) saveVersion = Math.max(saveVersion, parsed.meta.saveVersion);
}

const text = `${JSON.stringify({ serverBuild, saveVersion })}\n`;
if (process.argv.includes('--check')) {
  const current = readFileSync(out, 'utf8');
  if (current !== text) {
    console.error(`VERIFIED_BUILDS is stale: has ${current.trim()}, fixtures give ${text.trim()}`);
    process.exit(1);
  }
  console.log(`VERIFIED_BUILDS ok: ${text.trim()}`);
} else {
  writeFileSync(out, text);
  console.log(`wrote VERIFIED_BUILDS ${text.trim()}`);
}
