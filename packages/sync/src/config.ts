// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Login and sync talk to the game's own Firebase project and Google OAuth client. Those values are
// public (every community tool ships them), but they are not ours, so they are never committed:
// they come from VITE_* variables at build time. See docs/setup/live-sign-in.md.

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket?: string;
}

export interface GoogleOAuthConfig {
  clientId: string;
  /** Google requires the secret on the device-flow token call, even for "public" clients. */
  clientSecret: string;
}

export interface SyncConfig {
  firebase: FirebaseConfig;
  google: GoogleOAuthConfig;
}

export const ENV = {
  firebaseApiKey: 'VITE_FIREBASE_API_KEY',
  firebaseAuthDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  firebaseDatabaseUrl: 'VITE_FIREBASE_DATABASE_URL',
  firebaseProjectId: 'VITE_FIREBASE_PROJECT_ID',
  firebaseStorageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  googleClientId: 'VITE_GOOGLE_OAUTH_CLIENT_ID',
  googleClientSecret: 'VITE_GOOGLE_OAUTH_CLIENT_SECRET',
} as const;

const REQUIRED = [
  ENV.firebaseApiKey,
  ENV.firebaseAuthDomain,
  ENV.firebaseDatabaseUrl,
  ENV.firebaseProjectId,
  ENV.googleClientId,
  ENV.googleClientSecret,
] as const;

export type ConfigResult = { ok: true; config: SyncConfig } | { ok: false; missing: string[] };

/** Reads the sync config from build-time env (Vite's `import.meta.env`). Blank values count as missing. */
export function readSyncConfig(env: Record<string, unknown>): ConfigResult {
  const get = (key: string): string => (typeof env[key] === 'string' ? (env[key] as string).trim() : '');
  const missing = REQUIRED.filter((key) => get(key) === '');
  if (missing.length > 0) return { ok: false, missing };

  const databaseURL = get(ENV.firebaseDatabaseUrl);
  const firebase: FirebaseConfig = {
    apiKey: get(ENV.firebaseApiKey),
    authDomain: get(ENV.firebaseAuthDomain),
    databaseURL: /^https?:\/\//.test(databaseURL) ? databaseURL : `https://${databaseURL}`,
    projectId: get(ENV.firebaseProjectId),
  };
  const bucket = get(ENV.firebaseStorageBucket);
  if (bucket) firebase.storageBucket = bucket;
  return {
    ok: true,
    config: {
      firebase,
      google: { clientId: get(ENV.googleClientId), clientSecret: get(ENV.googleClientSecret) },
    },
  };
}
