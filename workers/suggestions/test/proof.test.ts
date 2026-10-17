// SPDX-License-Identifier: GPL-3.0-only
// Proof of sign-in (M13 TR-4): every check in order, the key store's cache and refetch throttle, and
// the real Google x509 certificates as a parser fixture.

import { describe, expect, it } from 'vitest';
import { GoogleKeys, verifyProof } from '../src/proof';
import { importCertificateKey, spkiFromCertificate } from '../src/x509';
import googleCerts from './fixtures/google-x509.json';
import { fakeCertificate, google, KID, NOW, pem, rsaKeyPair, signJwt } from './helpers';

const verify = async (token: string | undefined, g: Awaited<ReturnType<typeof google>>, now = NOW) =>
  verifyProof(token, { keys: g.keys, now });

describe('verifyProof', () => {
  it('accepts a Google proof that expired 20 minutes ago and returns only sub', async () => {
    const g = await google();
    expect(await verify(await g.proof('uid-1'), g)).toEqual({ ok: true, sub: 'uid-1' });
  });

  it('accepts the Steam path (custom token sign-in)', async () => {
    const g = await google();
    expect(await verify(await g.proof('uid-1', { provider: 'custom' }), g)).toEqual({
      ok: true,
      sub: 'uid-1',
    });
  });

  it.each([
    ['password', 'provider_not_allowed'],
    ['anonymous', 'provider_not_allowed'],
    ['apple.com', 'provider_not_allowed'],
  ])('rejects provider %s', async (provider, code) => {
    const g = await google();
    expect(await verify(await g.proof('u', { provider }), g)).toEqual({ ok: false, code });
  });

  it('rejects a live token and one that expired under 60 s ago as live_token', async () => {
    const g = await google();
    expect(await verify(await g.proof('u', { expiredFor: -1800 }), g)).toEqual({
      ok: false,
      code: 'live_token',
    });
    expect(await verify(await g.proof('u', { expiredFor: 30 }), g)).toEqual({
      ok: false,
      code: 'live_token',
    });
    expect((await verify(await g.proof('u', { expiredFor: 61 }), g)).ok).toBe(true);
  });

  it('rejects a proof older than 7 days as proof_too_old', async () => {
    const g = await google();
    const week = 7 * 24 * 3600;
    expect((await verify(await g.proof('u', { expiredFor: week - 10 }), g)).ok).toBe(true);
    expect(await verify(await g.proof('u', { expiredFor: week + 10 }), g)).toEqual({
      ok: false,
      code: 'proof_too_old',
    });
  });

  it.each([
    ['aud', { aud: 'other-project' }],
    ['iss', { iss: 'https://securetoken.google.com/other' }],
    ['empty sub', { sub: '' }],
    ['long sub', { sub: 'x'.repeat(129) }],
    ['auth_time after iat', { auth_time: Math.floor(NOW / 1000) }],
    ['iat in the future', { iat: Math.floor(NOW / 1000) + 600, exp: Math.floor(NOW / 1000) + 600 }],
    ['missing exp', { exp: 'soon' }],
  ])('rejects bad claim: %s', async (_name, claims) => {
    const g = await google();
    expect(await verify(await g.proof('u', { claims }), g)).toEqual({ ok: false, code: 'proof_invalid' });
  });

  it('answers proof_missing for no token and proof_invalid for malformed ones', async () => {
    const g = await google();
    expect(await verify(undefined, g)).toEqual({ ok: false, code: 'proof_missing' });
    expect(await verify('', g)).toEqual({ ok: false, code: 'proof_missing' });
    for (const t of ['abc', 'a.b', 'a.b.c.d', '!!.??.**', 'e30.e30.AAAA']) {
      expect(await verify(t, g)).toEqual({ ok: false, code: 'proof_invalid' });
    }
  });

  it('rejects alg other than RS256 (including none)', async () => {
    const g = await google();
    const token = await g.proof('u');
    const [, p, s] = token.split('.');
    for (const alg of ['none', 'HS256', 'RS512']) {
      const h = btoa(JSON.stringify({ alg, kid: KID })).replace(/=+$/, '');
      expect(await verify(`${h}.${p}.${s}`, g)).toEqual({ ok: false, code: 'proof_invalid' });
    }
  });

  it('rejects a token signed by another key, or with a tampered payload', async () => {
    const g = await google();
    const other = await rsaKeyPair();
    const forged = await signJwt(other.privateKey, { alg: 'RS256', kid: KID }, { sub: 'u' });
    expect(await verify(forged, g)).toEqual({ ok: false, code: 'proof_invalid' });
    const [h, , s] = (await g.proof('victim')).split('.');
    const p = btoa(JSON.stringify({ sub: 'attacker' })).replace(/=+$/, '');
    expect(await verify(`${h}.${p}.${s}`, g)).toEqual({ ok: false, code: 'proof_invalid' });
  });

  it('answers proof_unknown_key for a kid Google does not list', async () => {
    const g = await google();
    const t = await signJwt(g.privateKey, { alg: 'RS256', kid: 'nope' }, {});
    expect(await verify(t, g)).toEqual({ ok: false, code: 'proof_unknown_key' });
  });
});

describe('GoogleKeys', () => {
  async function endpoint() {
    const pair = await rsaKeyPair();
    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
    const certs = { [KID]: pem('CERTIFICATE', fakeCertificate(spki)) };
    let fetches = 0;
    const fetchFn = async () => {
      fetches++;
      return new Response(JSON.stringify(certs), { headers: { 'Cache-Control': 'public, max-age=20000' } });
    };
    return { pair, fetchFn, count: () => fetches };
  }

  it('verifies a proof against keys loaded from the x509 endpoint', async () => {
    const { pair, fetchFn } = await endpoint();
    const keys = new GoogleKeys(fetchFn, () => NOW);
    const g = await google();
    const token = await signJwt(
      pair.privateKey,
      { alg: 'RS256', kid: KID },
      {
        ...JSON.parse(atob((await g.proof('u')).split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? '')),
      },
    );
    expect(await verifyProof(token, { keys, now: NOW })).toEqual({ ok: true, sub: 'u' });
  });

  it('caches for max-age and refetches an unknown kid at most once per 5 minutes', async () => {
    const { fetchFn, count } = await endpoint();
    let now = NOW;
    const keys = new GoogleKeys(fetchFn, () => now);
    expect(await keys.get(KID)).toBeDefined();
    expect(await keys.get(KID)).toBeDefined();
    expect(count()).toBe(1);
    for (let i = 0; i < 20; i++) expect(await keys.get(`random-${i}`)).toBeUndefined();
    expect(count()).toBe(1);
    now += 5 * 60 * 1000;
    await keys.get('random-x');
    expect(count()).toBe(2);
    now += 20000 * 1000;
    await keys.get(KID);
    expect(count()).toBe(3);
  });
});

describe('x509', () => {
  it('imports every real Google securetoken certificate (fixture fetched 2026-10-17)', async () => {
    const certs: Record<string, string> = googleCerts;
    expect(Object.keys(certs).length).toBeGreaterThanOrEqual(2);
    for (const p of Object.values(certs)) {
      const key = await importCertificateKey(p);
      expect(key.algorithm.name).toBe('RSASSA-PKCS1-v1_5');
      expect(key.usages).toEqual(['verify']);
    }
  });

  it('reads the SPKI with or without the version field and rejects junk', async () => {
    const pair = await rsaKeyPair();
    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
    expect(spkiFromCertificate(fakeCertificate(spki, true))).toEqual(spki);
    expect(spkiFromCertificate(fakeCertificate(spki, false))).toEqual(spki);
    expect(() => spkiFromCertificate(new Uint8Array([0x30, 0x82, 0xff]))).toThrow();
    expect(() => spkiFromCertificate(new Uint8Array([0x02, 0x01, 0x00]))).toThrow();
  });
});
