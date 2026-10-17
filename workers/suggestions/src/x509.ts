// SPDX-License-Identifier: GPL-3.0-only
// Just enough DER to pull the SubjectPublicKeyInfo out of an X.509 certificate, so WebCrypto can import
// Google's securetoken signing keys from the documented x509 endpoint (M13 TR-4). Nothing in the
// certificate is trusted except the key itself: the endpoint is fetched over TLS from googleapis.com.

import { pemToDer } from './encoding';

interface Tlv {
  tag: number;
  /** Offset of the tag byte. */
  start: number;
  /** Offset of the first content byte. */
  body: number;
  /** Offset one past the last content byte. */
  end: number;
}

function readTlv(der: Uint8Array, at: number, limit: number): Tlv {
  if (at + 2 > limit) throw new Error('DER: truncated');
  const tag = der[at] as number;
  let len = der[at + 1] as number;
  let body = at + 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n === 0 || n > 4 || body + n > limit) throw new Error('DER: bad length');
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + (der[body + i] as number);
    body += n;
  }
  const end = body + len;
  if (end > limit) throw new Error('DER: truncated');
  return { tag, start: at, body, end };
}

function children(der: Uint8Array, parent: Tlv): Tlv[] {
  const out: Tlv[] = [];
  let at = parent.body;
  while (at < parent.end) {
    const t = readTlv(der, at, parent.end);
    out.push(t);
    at = t.end;
  }
  return out;
}

const SEQUENCE = 0x30;
const CONTEXT_0 = 0xa0;

/** The DER bytes of the certificate's SubjectPublicKeyInfo. Throws on anything that is not a certificate. */
export function spkiFromCertificate(der: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const cert = readTlv(der, 0, der.length);
  if (cert.tag !== SEQUENCE) throw new Error('DER: not a certificate');
  const tbs = children(der, cert)[0];
  if (!tbs || tbs.tag !== SEQUENCE) throw new Error('DER: no tbsCertificate');
  const fields = children(der, tbs);
  // version [0] is optional; then serial, signature, issuer, validity, subject, subjectPublicKeyInfo.
  const offset = fields[0]?.tag === CONTEXT_0 ? 1 : 0;
  const spki = fields[offset + 5];
  if (!spki || spki.tag !== SEQUENCE) throw new Error('DER: no subjectPublicKeyInfo');
  return der.slice(spki.start, spki.end);
}

export async function importCertificateKey(pem: string): Promise<CryptoKey> {
  const der = pemToDer(pem, 'CERTIFICATE');
  if (!der) throw new Error('PEM: no certificate');
  const spki = spkiFromCertificate(der);
  return crypto.subtle.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, [
    'verify',
  ]);
}
