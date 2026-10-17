// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Google's OAuth 2.0 device-code flow, exactly as Toolbox does it (services/auth/google.js):
//   1. POST /device/code with the game's client ID and scope "email profile"
//   2. show user_code and the verification URL (google.com/device)
//   3. poll POST /token every `interval` s until Google returns an id_token
// https://developers.google.com/identity/protocols/oauth2/limited-input-device
import type { GoogleOAuthConfig } from './config';

export const DEVICE_CODE_URL = 'https://oauth2.googleapis.com/device/code';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';

export interface DeviceCode {
  /** What the player types at the verification URL, e.g. "ABCD-EFGH". */
  userCode: string;
  /** Where the player types it (https://www.google.com/device). */
  verificationUrl: string;
  /** Opaque code we poll with. Never shown. */
  deviceCode: string;
  /** Epoch ms after which the code is dead. */
  expiresAt: number;
  /** How often Google allows us to poll. */
  intervalMs: number;
}

export type DeviceFlowErrorCode = 'access_denied' | 'expired_token' | 'aborted' | 'invalid_response' | string;

export class DeviceFlowError extends Error {
  override name = 'DeviceFlowError';
  constructor(
    readonly code: DeviceFlowErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface FlowDeps {
  fetch?: typeof globalThis.fetch;
  now?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

const form = (fields: Record<string, string>) => new URLSearchParams(fields).toString();
const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' };

export const abortableSleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DeviceFlowError('aborted', 'Sign-in was cancelled.'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DeviceFlowError('aborted', 'Sign-in was cancelled.'));
      },
      { once: true },
    );
  });

export async function requestDeviceCode(google: GoogleOAuthConfig, deps: FlowDeps = {}): Promise<DeviceCode> {
  const { fetch = globalThis.fetch, now = Date.now } = deps;
  const res = await fetch(DEVICE_CODE_URL, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: form({ client_id: google.clientId, scope: 'email profile' }),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const { device_code, user_code, expires_in, interval } = body;
  const verification = body.verification_url ?? body.verification_uri;
  if (!res.ok || typeof device_code !== 'string' || typeof user_code !== 'string') {
    const reason = typeof body.error === 'string' ? body.error : `HTTP ${res.status}`;
    throw new DeviceFlowError('invalid_response', `Google did not issue a sign-in code (${reason}).`);
  }
  return {
    userCode: user_code,
    verificationUrl: typeof verification === 'string' ? verification : 'https://www.google.com/device',
    deviceCode: device_code,
    expiresAt: now() + (typeof expires_in === 'number' ? expires_in : 1800) * 1000,
    intervalMs: (typeof interval === 'number' ? interval : 5) * 1000,
  };
}

/** Polls until the player approves, then returns Google's id_token. Rejects with DeviceFlowError. */
export async function pollForIdToken(
  google: GoogleOAuthConfig,
  device: DeviceCode,
  deps: FlowDeps & { signal?: AbortSignal } = {},
): Promise<string> {
  const { fetch = globalThis.fetch, now = Date.now, sleep = abortableSleep, signal } = deps;
  let intervalMs = device.intervalMs;
  for (;;) {
    await sleep(intervalMs, signal);
    if (now() >= device.expiresAt) throw new DeviceFlowError('expired_token', 'The sign-in code expired.');

    let body: Record<string, unknown>;
    try {
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: FORM_HEADERS,
        body: form({
          client_id: google.clientId,
          client_secret: google.clientSecret,
          device_code: device.deviceCode,
          grant_type: DEVICE_GRANT,
        }),
        ...(signal ? { signal } : {}),
      });
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      if (signal?.aborted) throw new DeviceFlowError('aborted', 'Sign-in was cancelled.');
      // A dropped request is not a verdict from Google: keep polling until the code expires.
      continue;
    }

    if (typeof body.id_token === 'string') return body.id_token;
    switch (body.error) {
      case 'authorization_pending':
        continue;
      case 'slow_down':
        intervalMs += 5000;
        continue;
      case 'access_denied':
        throw new DeviceFlowError('access_denied', 'Sign-in was declined on the Google page.');
      case 'expired_token':
        throw new DeviceFlowError('expired_token', 'The sign-in code expired.');
      default:
        throw new DeviceFlowError(
          typeof body.error === 'string' ? body.error : 'invalid_response',
          `Google refused the sign-in (${String(body.error_description ?? body.error ?? 'no id_token')}).`,
        );
    }
  }
}
