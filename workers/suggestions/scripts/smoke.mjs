// SPDX-License-Identifier: GPL-3.0-only
// Dry-run smoke test against a deployed Suggestions Worker. Writes nothing to GitHub: every create and
// details request carries the dry-run header or a Preview origin, and the rest are refused before any
// GitHub call. Run: node workers/suggestions/scripts/smoke.mjs [workerUrl]
// Optional, for the full happy path: SMOKE_PROOF (an expired idlemmo ID token, Google or Steam sign-in)
// and SMOKE_TURNSTILE (a fresh token from the ActiveOn widget, action "suggest"). Neither is printed.

const BASE = process.argv[2] ?? 'https://activeon-suggestions.idleon.workers.dev';
const PROD = 'https://activeon.idleon.workers.dev';
const PREVIEW = 'https://pr-1-activeon.idleon.workers.dev';
const X509 = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

const b64url = (s) => Buffer.from(s).toString('base64url');

function body(proof, turnstileToken = 'not-a-real-token') {
  return {
    clientId: crypto.randomUUID(),
    type: 'idea',
    text: {
      whenIm: 'running the smoke test',
      iWant: 'to check the Worker end to end',
      soThat: '',
      example: '',
    },
    context: {
      schema: 1,
      build: {
        app: 'smoke',
        commit: 'smoke',
        channel: 'local',
        knowledge: 'smoke',
        parsers: { toolboxCommit: 'smoke', toolboxVersion: 'smoke', gameVersion: 'smoke' },
      },
      gameBuild: null,
      stage: null,
      screen: 'other',
      saveAgeSeconds: null,
      browser: 'other',
    },
    turnstileToken,
    proof,
  };
}

async function call(path, payload, { origin = PROD, headers = {}, method = 'POST' } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: origin, ...headers },
    body: method === 'POST' ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, headers: res.headers };
}

const results = [];
function check(name, ok, detail) {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

// A token naming one of Google's real key ids, with a bogus signature: proves the deployed Worker
// fetched and parsed Google's x509 keys (an unknown kid would answer proof_unknown_key instead).
const kids = Object.keys(await (await fetch(X509)).json());
const now = Math.floor(Date.now() / 1000);
const forged = [
  b64url(JSON.stringify({ alg: 'RS256', kid: kids[0], typ: 'JWT' })),
  b64url(
    JSON.stringify({
      iss: 'https://securetoken.google.com/idlemmo',
      aud: 'idlemmo',
      sub: 'smoke',
      auth_time: now - 7200,
      iat: now - 5400,
      exp: now - 1800,
      firebase: { sign_in_provider: 'google.com' },
    }),
  ),
  b64url('x'.repeat(256)),
].join('.');
const unknownKid = `${b64url(JSON.stringify({ alg: 'RS256', kid: 'smoke-unknown' }))}.${forged.split('.')[1]}.${forged.split('.')[2]}`;
const dry = { 'X-Suggestions-Dry-Run': '1' };

let r = await call('/v1/suggestions', null, { method: 'OPTIONS' });
check(
  'preflight from the app origin',
  r.status === 204 && r.headers.get('access-control-allow-origin') === PROD,
);
r = await call('/v1/suggestions', null, { method: 'OPTIONS', origin: 'https://evil.example' });
check(
  'preflight from another origin is refused',
  r.status === 403 && !r.headers.get('access-control-allow-origin'),
);
r = await call('/v1/suggestions', body(forged), { origin: 'https://evil.example' });
check('POST from another origin', r.json?.error === 'origin_not_allowed', r.status);
r = await call('/v1/suggestions', 'x'.repeat(17 * 1024));
check('body over 16 KiB', r.status === 400 && r.json?.field === 'body', r.status);
r = await call('/v2/nothing', {});
check('unknown route', r.status === 404);
const tooLong = body(forged);
tooLong.text.iWant = 'x'.repeat(601);
r = await call('/v1/suggestions', tooLong, { headers: dry });
check(
  'over-long I want… is rejected, not trimmed',
  r.json?.error === 'invalid' && r.json?.field === 'text.iWant',
);
r = await call('/v1/suggestions', body(forged));
check(
  'real filing is refused while SUGGESTIONS_ENABLED is off',
  r.status === 503 && r.json?.error === 'paused',
);
r = await call('/v1/suggestions', body(''), { headers: dry });
check('dry run: missing proof', r.json?.error === 'proof_missing', r.status);
r = await call('/v1/suggestions', body('a.b.c'), { headers: dry });
check('dry run: malformed proof', r.json?.error === 'proof_invalid', r.status);
r = await call('/v1/suggestions', body(forged), { origin: PREVIEW });
check('Preview dry run: forged signature on a real Google kid', r.json?.error === 'proof_invalid', r.status);
r = await call('/v1/suggestions', body(unknownKid), { origin: PREVIEW });
check('Preview dry run: unknown kid', r.json?.error === 'proof_unknown_key', r.status);
r = await call('/v1/suggestions/mine', { proof: forged });
check('mine: forged proof', r.json?.error === 'proof_invalid', r.status);
r = await call('/v1/suggestions/1/details', {
  clientId: crypto.randomUUID(),
  text: 'x',
  turnstileToken: 't',
  proof: forged,
});
check('details: real filing refused while off', r.json?.error === 'paused', r.status);

if (process.env.SMOKE_PROOF) {
  const proofBody = body(process.env.SMOKE_PROOF, process.env.SMOKE_TURNSTILE ?? 'not-a-real-token');
  r = await call('/v1/suggestions', proofBody, { headers: dry });
  if (process.env.SMOKE_TURNSTILE) {
    check(
      'dry run with a real proof and Turnstile token',
      r.status === 200 && r.json?.dryRun === true,
      JSON.stringify(r.json),
    );
  } else {
    check(
      'real proof accepted, then the fake Turnstile token refused',
      r.json?.error === 'turnstile',
      JSON.stringify(r.json),
    );
  }
}

const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} passed against ${BASE}`);
process.exit(failed ? 1 : 0);
