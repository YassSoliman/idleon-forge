// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// A Firebase session on the game's project, persisted in IndexedDB on our origin. Popup and redirect
// sign-in need our domain on the project's authorised list, which it is not, so every sign-in ends
// in signInWithCredential (no domain check). See docs/research/2026-10-16-auth-sync.md (research/auth-sync).
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  type Auth,
  browserLocalPersistence,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithCredential,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { type Database, getDatabase } from 'firebase/database';
import { type Firestore, getFirestore } from 'firebase/firestore';
import type { SyncConfig } from './config';
import { type DeviceCode, type FlowDeps, pollForIdToken, requestDeviceCode } from './google-device';

const APP_NAME = 'activeon';

export interface Session {
  readonly config: SyncConfig;
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly firestore: Firestore;
  readonly database: Database;
}

export interface SignedInUser {
  uid: string;
  email: string | null;
}

const toUser = (u: User): SignedInUser => ({ uid: u.uid, email: u.email });

/** Creates (or reuses) the Firebase app. The session survives reloads until sign-out. */
export function createSession(config: SyncConfig): Session {
  const existing = getApps().find((a) => a.name === APP_NAME);
  const app = existing ?? initializeApp(config.firebase, APP_NAME);
  // initializeAuth may only run once per app (a dev-server hot reload re-enters here).
  const auth = existing
    ? getAuth(app)
    : initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  return {
    config,
    app,
    auth,
    firestore: getFirestore(app),
    database: getDatabase(app, config.firebase.databaseURL),
  };
}

/** Fires once with the restored session (or null), then on every sign-in and sign-out. */
export function onUserChanged(session: Session, callback: (user: SignedInUser | null) => void): Unsubscribe {
  return onAuthStateChanged(session.auth, (u) => callback(u ? toUser(u) : null));
}

export interface GoogleSignInOptions extends FlowDeps {
  /** Called as soon as Google issues the code, so the UI can show it. */
  onDeviceCode: (code: DeviceCode) => void;
  signal?: AbortSignal;
}

/** The whole Google device-code sign-in: code, poll, then exchange the id_token for a Firebase session. */
export async function signInWithGoogleDevice(
  session: Session,
  options: GoogleSignInOptions,
): Promise<SignedInUser> {
  const { onDeviceCode, signal, ...deps } = options;
  const code = await requestDeviceCode(session.config.google, deps);
  onDeviceCode(code);
  const idToken = await pollForIdToken(session.config.google, code, {
    ...deps,
    ...(signal ? { signal } : {}),
  });
  const result = await signInWithCredential(session.auth, GoogleAuthProvider.credential(idToken));
  return toUser(result.user);
}

export function signOut(session: Session): Promise<void> {
  return firebaseSignOut(session.auth);
}
