// SPDX-License-Identifier: GPL-3.0-only
// Suggester marker, per issue (M13 TR-6): m = base32(HMAC-SHA256(pepper, sub ‖ clientId))[0..16].
// The uid never leaves the Worker and no public value links two Suggestions by the same player: the
// Worker finds a player's issues by recomputing m from each listed issue's cid. `clientId` is a
// fixed-length UUID at the end of the message, so plain concatenation is unambiguous.

import { bytesToBase32, utf8Bytes } from './encoding';

const keyCache = new Map<string, Promise<CryptoKey>>();

function hmacKey(pepper: string): Promise<CryptoKey> {
  let key = keyCache.get(pepper);
  if (!key) {
    key = crypto.subtle.importKey('raw', utf8Bytes(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, [
      'sign',
    ]);
    keyCache.set(pepper, key);
  }
  return key;
}

export async function suggesterMarker(pepper: string, sub: string, clientId: string): Promise<string> {
  const mac = await crypto.subtle.sign('HMAC', await hmacKey(pepper), utf8Bytes(sub + clientId));
  return bytesToBase32(new Uint8Array(mac)).slice(0, 16);
}

/** True when the marker recomputes from this player's `sub`. Constant-time over the 16 characters. */
export async function isMine(
  pepper: string,
  sub: string,
  issue: { m: string; cid: string },
): Promise<boolean> {
  const m = await suggesterMarker(pepper, sub, issue.cid);
  if (m.length !== issue.m.length) return false;
  let diff = 0;
  for (let i = 0; i < m.length; i++) diff |= m.charCodeAt(i) ^ issue.m.charCodeAt(i);
  return diff === 0;
}
