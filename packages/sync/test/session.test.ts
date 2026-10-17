// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// signInWithGoogleDevice: a sign-in cancelled after Google answered is not completed (FR-2, RT-23).
import { describe, expect, it, vi } from 'vitest';

const signInWithCredential = vi.fn(async () => ({ user: { uid: 'u1', email: 'player@example.com' } }));
vi.mock('firebase/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/auth')>()),
  signInWithCredential,
}));

const { signInWithGoogleDevice } = await import('../src/session');
type Session = Parameters<typeof signInWithGoogleDevice>[0];

const session = {
  config: { google: { clientId: 'test-client', clientSecret: 'test-secret' } },
  auth: {},
} as unknown as Session;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const DEVICE = {
  device_code: 'd',
  user_code: 'ABCD',
  verification_url: 'https://www.google.com/device',
  expires_in: 1800,
  interval: 5,
};

describe('signInWithGoogleDevice', () => {
  it('exchanges the id_token for a Firebase session', async () => {
    signInWithCredential.mockClear();
    const responses = [json(200, DEVICE), json(200, { id_token: 'tok' })];
    const user = await signInWithGoogleDevice(session, {
      fetch: (async () => responses.shift()) as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 0,
      onDeviceCode: () => {},
    });
    expect(user).toEqual({ uid: 'u1', email: 'player@example.com' });
    expect(signInWithCredential).toHaveBeenCalledTimes(1);
  });

  it('does not sign in when cancelled after the token arrived', async () => {
    signInWithCredential.mockClear();
    const controller = new AbortController();
    const responses = [json(200, DEVICE), json(200, { id_token: 'tok' })];
    const fetch = (async () => {
      const next = responses.shift();
      // Cancel exactly as Google hands back the token.
      if (responses.length === 0) controller.abort();
      return next;
    }) as unknown as typeof globalThis.fetch;
    await expect(
      signInWithGoogleDevice(session, {
        fetch,
        sleep: async () => {},
        now: () => 0,
        onDeviceCode: () => {},
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ code: 'aborted' });
    expect(signInWithCredential).not.toHaveBeenCalled();
  });
});
