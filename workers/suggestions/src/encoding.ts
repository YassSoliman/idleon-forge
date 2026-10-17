// SPDX-License-Identifier: GPL-3.0-only
// Byte encodings the Worker needs (base64url for JWTs, PEM bodies, RFC 4648 base32 for markers).

const utf8 = new TextEncoder();

export function utf8Bytes(s: string): Uint8Array<ArrayBuffer> {
  return utf8.encode(s);
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] as number);
  return btoa(bin);
}

const B64URL = /^[A-Za-z0-9_-]*$/;

/** Decodes unpadded base64url; returns null on any non-alphabet character. */
export function base64UrlToBytes(s: string): Uint8Array<ArrayBuffer> | null {
  if (!B64URL.test(s) || s.length % 4 === 1) return null;
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  try {
    return base64ToBytes(b64);
  } catch {
    return null;
  }
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function stringToBase64Url(s: string): string {
  return bytesToBase64Url(utf8Bytes(s));
}

const B32 = 'abcdefghijklmnopqrstuvwxyz234567';

/** RFC 4648 base32, lower case, unpadded. */
export function bytesToBase32(bytes: Uint8Array): string {
  let out = '';
  let bits = 0;
  let value = 0;
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

/** Body bytes of the first PEM block with the given label, or null. */
export function pemToDer(pem: string, label: string): Uint8Array<ArrayBuffer> | null {
  const re = new RegExp(`-----BEGIN ${label}-----([\\s\\S]+?)-----END ${label}-----`);
  const m = re.exec(pem);
  if (!m?.[1]) return null;
  try {
    return base64ToBytes(m[1].replace(/\s+/g, ''));
  } catch {
    return null;
  }
}
