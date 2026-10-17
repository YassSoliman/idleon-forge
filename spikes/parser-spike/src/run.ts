// IdleOn Forge parser spike. Copyright (C) 2026 IdleOn Forge contributors. GPL-3.0-only.
// Usage: [SPIKE_NOW=<iso>] node dist/run.mjs <save.json> [--out parsed.json]
// Accepts either Toolbox's export envelope ({ data, charNames, companion, guildData, serverVars, ... })
// or a bare Firestore `_data/{uid}` document.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseData } from './index';

const [file, flag, outFile] = process.argv.slice(2);
if (!file) throw new Error('usage: run.mjs <save.json> [--out parsed.json]');
// SPIKE_NOW=<iso> freezes the clock (parsers read Date.now() for timers), for byte-level parity checks.
if (process.env.SPIKE_NOW) {
  const fixed = new Date(process.env.SPIKE_NOW).getTime();
  const RealDate = Date;
  class FrozenDate extends RealDate {
    constructor(...args: any[]) { super(...((args.length ? args : [fixed]) as [])); }
    static now() { return fixed; }
  }
  globalThis.Date = FrozenDate as DateConstructor;
}
const raw = JSON.parse(readFileSync(file, 'utf8'));
const env = raw.data ? raw : { data: raw };

// Toolbox wraps each parser section in safeSection(), which logs and falls back instead of throwing.
const failed: string[] = [];
const origError = console.error;
console.error = (msg: unknown, ...rest: unknown[]) => {
  const m = typeof msg === 'string' && msg.match(/section "([^"]+)" failed/);
  if (m) failed.push(m[1]);
  else origError(msg, ...rest);
};

const t0 = performance.now();
const parsed = parseData(env.data, env.charNames ?? [], env.companion ?? null, env.guildData ?? null,
  env.serverVars, env.accountCreateTime, env.tournament ?? null);
const ms = Math.round(performance.now() - t0);
console.error = origError;

const account = parsed.account as Record<string, any>;
const characters = parsed.characters as any[];
// parseData() catches any throw at the top level and returns { account: {}, characters: [] }, so an
// empty account is the only failure signal for a save the parsers cannot handle.
const ok = Object.keys(account).length > 0;
console.log(JSON.stringify({
  file,
  ok,
  ms,
  accountKeys: Object.keys(account).length,
  characters: characters.length,
  failedSections: failed,
  sample: characters.slice(0, 10).map((c) => ({ name: c.name, class: c.class, level: c.level, afkTarget: c.afkTarget })),
}, null, 2));
if (flag === '--out' && outFile) writeFileSync(outFile, JSON.stringify(parsed, (_k, v) => (typeof v === 'bigint' ? String(v) : v)));
if (!ok) process.exitCode = 1;
