// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
export {
  type ConfigResult,
  ENV,
  type FirebaseConfig,
  type GoogleOAuthConfig,
  readSyncConfig,
  type SyncConfig,
} from './config';
export { assembleEnvelope, type SideReads } from './envelope';
export {
  type DeviceCode,
  DeviceFlowError,
  type DeviceFlowErrorCode,
  pollForIdToken,
  requestDeviceCode,
} from './google-device';
export { listenToSave, type SaveListener } from './listen';
export {
  createSession,
  type GoogleSignInOptions,
  onUserChanged,
  type Session,
  type SignedInUser,
  signInWithGoogleDevice,
  signOut,
} from './session';
