// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The device-code flow against a scripted fake of Google's endpoints. No real request is made.
import { describe, expect, it, vi } from 'vitest';
import { type DeviceCode, DeviceFlowError, pollForIdToken, requestDeviceCode } from '../src/google-device';

const google = { clientId: 'test-client.apps.googleusercontent.com', clientSecret: 'test-secret' };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A fetch that answers each call with the next scripted response and records the requests. */
function scripted(...responses: Array<Response | Error>) {
  const calls: Array<{ url: string; body: URLSearchParams }> = [];
  const fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: new URLSearchParams(String(init?.body ?? '')) });
    const next = responses.shift();
    if (!next) throw new Error('unexpected extra request');
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof globalThis.fetch;
  return { fetch, calls };
}

describe('requestDeviceCode', () => {
  it('asks Google for a code with the client ID and "email profile" scope', async () => {
    const { fetch, calls } = scripted(
      json(200, {
        device_code: 'dev-123',
        user_code: 'ABCD-EFGH',
        verification_url: 'https://www.google.com/device',
        expires_in: 1800,
        interval: 5,
      }),
    );
    const code = await requestDeviceCode(google, { fetch, now: () => 1_000 });
    expect(code).toEqual({
      userCode: 'ABCD-EFGH',
      verificationUrl: 'https://www.google.com/device',
      deviceCode: 'dev-123',
      expiresAt: 1_000 + 1_800_000,
      intervalMs: 5_000,
    });
    expect(calls[0]?.url).toBe('https://oauth2.googleapis.com/device/code');
    expect(Object.fromEntries(calls[0]?.body ?? [])).toEqual({
      client_id: google.clientId,
      scope: 'email profile',
    });
  });

  it('fails clearly when Google rejects the client', async () => {
    const { fetch } = scripted(json(401, { error: 'invalid_client' }));
    await expect(requestDeviceCode(google, { fetch })).rejects.toThrow(/invalid_client/);
  });
});

describe('pollForIdToken', () => {
  const device: DeviceCode = {
    userCode: 'ABCD-EFGH',
    verificationUrl: 'https://www.google.com/device',
    deviceCode: 'dev-123',
    expiresAt: 10_000_000,
    intervalMs: 5_000,
  };
  const sleeps: number[] = [];
  const sleep = async (ms: number) => {
    sleeps.push(ms);
  };

  it('keeps polling through pending and slow_down, then returns the id_token', async () => {
    sleeps.length = 0;
    const { fetch, calls } = scripted(
      json(428, { error: 'authorization_pending' }),
      new TypeError('network down'),
      json(403, { error: 'slow_down' }),
      json(200, { id_token: 'google-id-token', access_token: 'x' }),
    );
    await expect(pollForIdToken(google, device, { fetch, sleep, now: () => 0 })).resolves.toBe(
      'google-id-token',
    );
    expect(sleeps).toEqual([5_000, 5_000, 5_000, 10_000]);
    expect(calls).toHaveLength(4);
    expect(calls[0]?.url).toBe('https://oauth2.googleapis.com/token');
    expect(Object.fromEntries(calls[0]?.body ?? [])).toEqual({
      client_id: google.clientId,
      client_secret: google.clientSecret,
      device_code: 'dev-123',
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    });
  });

  it.each([
    ['access_denied', 'access_denied'],
    ['expired_token', 'expired_token'],
    ['invalid_grant', 'invalid_grant'],
  ])('stops on %s', async (error, code) => {
    const { fetch } = scripted(json(400, { error }));
    const failure = pollForIdToken(google, device, { fetch, sleep, now: () => 0 });
    await expect(failure).rejects.toBeInstanceOf(DeviceFlowError);
    await expect(failure).rejects.toMatchObject({ code });
  });

  it('stops when the code expires locally, without calling Google', async () => {
    const { fetch, calls } = scripted();
    await expect(
      pollForIdToken(google, device, { fetch, sleep, now: () => device.expiresAt }),
    ).rejects.toMatchObject({ code: 'expired_token' });
    expect(calls).toHaveLength(0);
  });

  it('can be cancelled', async () => {
    const controller = new AbortController();
    const { fetch } = scripted();
    const failure = pollForIdToken(
      google,
      { ...device, intervalMs: 60_000 },
      { fetch, signal: controller.signal },
    );
    controller.abort();
    await expect(failure).rejects.toMatchObject({ code: 'aborted' });
  });
});
