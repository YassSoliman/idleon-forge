// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Write-call and network tripwire over the un-minified vendored sources (M12 TR-14).
//
// The parsers are third-party code that runs in players' browsers next to their live Firebase session.
// This flags Firebase write APIs, firebase/* imports, network and storage primitives, and computed
// property access on self/globalThis/window, then compares every match with tripwire-allowlist.json
// (reviewed matches, keyed by file and normalized line, each with the reason it is safe).
//
// It is a tripwire for review, not a proof, and it is easy to evade. The enforcing barrier is the
// parser Worker's sandbox (its own CSP with connect-src 'none', and the deleted network globals).
//
//   node scripts/tripwire.mjs           exit 1 and list every new match
//   node scripts/tripwire.mjs --update  rewrite the allowlist (new entries get reason "TODO: review")
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const allowFile = join(root, 'scripts/tripwire-allowlist.json');
const targets = ['vendor/parsers', 'vendor/utility', 'vendor/polyfills.js'];

export const RULES = [
  ['firebase-write', /\b(setDoc|updateDoc|addDoc|deleteDoc|writeBatch|runTransaction)\s*\(/],
  ['rtdb-write', /\b(?:set|update|push|remove)\s*\(\s*(?:ref|child)\s*\(/],
  ['rtdb-write', /\bref\s*\([^)]*\)\s*\.\s*(?:set|update|push|remove)\s*\(/],
  ['firebase-import', /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"](?:@?firebase)(?:\/[^'"]*)?['"]/],
  ['network', /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\b/],
  ['storage', /\b(indexedDB|localStorage|sessionStorage|caches)\b/],
  ['computed-global', /\b(?:self|globalThis|window)\s*\[/],
];

const walk = (p) => {
  const abs = join(root, p);
  try {
    return readdirSync(abs, { withFileTypes: true }).flatMap((e) => walk(join(p, e.name)));
  } catch {
    return [p];
  }
};

const normalize = (line) => line.replace(/\s+/g, ' ').trim();

export function scan() {
  const matches = [];
  for (const file of targets
    .flatMap(walk)
    .filter((f) => /\.(m?js|ts)$/.test(f))
    .sort()) {
    const lines = readFileSync(join(root, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const [rule, re] of RULES) {
        if (re.test(line)) {
          matches.push({
            rule,
            file: file.split(sep).join('/'),
            line: i + 1,
            key: `${file.split(sep).join('/')}|${normalize(line)}`,
          });
          break;
        }
      }
    });
  }
  return matches;
}

const allow = JSON.parse(readFileSync(allowFile, 'utf8'));
const matches = scan();
if (process.argv.includes('--update')) {
  const next = {};
  for (const m of matches) next[m.key] = allow[m.key] ?? 'TODO: review';
  writeFileSync(allowFile, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`tripwire: wrote ${Object.keys(next).length} allowlist entries`);
  process.exit(0);
}
const fresh = matches.filter((m) => !(m.key in allow));
const todo = Object.entries(allow).filter(([, why]) => /^TODO/.test(why));
console.log(
  `tripwire: ${matches.length} matches, ${matches.length - fresh.length} allowlisted, ${fresh.length} new`,
);
for (const m of fresh) {
  const text = m.key.slice(m.key.indexOf('|') + 1);
  console.log(
    `::error file=packages/toolbox-parsers/${m.file},line=${m.line},title=Tripwire ${m.rule}::${text.slice(0, 200)}`,
  );
}
for (const [key] of todo)
  console.log(`::error title=Tripwire::allowlist entry without a reviewed reason: ${key.slice(0, 200)}`);
process.exit(fresh.length || todo.length ? 1 : 0);
