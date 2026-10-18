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
export {
  compactState,
  ENGINE_HISTORY_MAX_ENTRIES,
  ENGINE_HISTORY_WINDOW_MS,
  type EngineHistoryOptions,
  engineHistoryOf,
  selectEngineHistory,
} from './engine-history';
export { assembleEnvelope, type SideReads } from './envelope';
export {
  DEFAULT_EXPECTED_RETURN_MS,
  HOUR_MS,
  type LearnedReturn,
  learnedExpectedReturn,
  localOffsetAt,
  type ReturnGap,
  returnGaps,
  TIME_OF_DAY_WINDOW_MS,
  type TimeZoneOffset,
} from './expected-return';
export {
  type DeviceCode,
  DeviceFlowError,
  type DeviceFlowErrorCode,
  pollForIdToken,
  requestDeviceCode,
} from './google-device';
export {
  AUTOSAVE_KEEP_EVERY_MS,
  cloudSaveTimeOf,
  HISTORY_DB,
  HISTORY_DB_VERSION,
  HISTORY_RETENTION_MS,
  type HistoryEntry,
  type HistoryMeta,
  LOW_QUOTA_BYTES,
  type OpenHistoryOptions,
  openSaveHistory,
  PLAY_SESSION_GAP_MS,
  type PlaySession,
  preferencePrefix,
  readRaw,
  type SaveHistory,
  type SaveIndexRow,
  type SaveRecord,
  STORAGE_PREFIX,
  toPlaySessions,
  uidHash,
  usualGap,
} from './history';
export {
  BACKOFF_MS,
  firebaseSaveSource,
  isAuthError,
  type ListenDeps,
  type ListenerStatus,
  listenToSave,
  type ReadResult,
  type SaveListener,
  type SaveSnapshot,
  type SaveSource,
  SERVER_VARS_MAX_AGE_MS,
  slotsInSave,
  watchSave,
} from './listen';
export {
  type BuildMark,
  buildOf,
  PATCH_BANNER,
  PATCH_FOOTER_NOTE,
  type PatchStatus,
  patchStatus,
  type SaveOutcome,
  saveOutcome,
} from './patch';
export {
  createProofRing,
  memoryProofStore,
  openProofStore,
  PROOF_MIN_EXPIRED_MS,
  PROOF_RING_SIZE,
  type ProofRing,
  type ProofRingOptions,
  type ProofStore,
  pickProof,
  readTokenTimes,
  type TokenEntry,
} from './proof';
export { classifySave, type SaveClass, type SaveKind, stampedSlot } from './save-kind';
export {
  createSession,
  type GoogleSignInOptions,
  onUserChanged,
  type Session,
  type SignedInUser,
  signInWithGoogleDevice,
  signOut,
  watchIdTokens,
} from './session';
