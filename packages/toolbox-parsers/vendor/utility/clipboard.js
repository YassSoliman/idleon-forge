// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
export const CLIPBOARD_ERROR_MESSAGE = 'Couldn\'t copy: your browser or an extension blocked clipboard access';

const copyWithExecCommand = (text) => {
  if (typeof document === 'undefined' || !document.execCommand) return false;
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  try {
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);
    return document.execCommand('copy');
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
};

// Falls back to the legacy execCommand path when the async Clipboard API is
// missing (non-secure context) or rejects (NotAllowedError, permissions policy).
export const copyText = async (text) => {
  if (text == null) return false;
  const value = String(text);
  try {
    if (globalThis.navigator?.clipboard?.writeText) {
      await globalThis.navigator.clipboard.writeText(value);
      return true;
    }
  } catch (err) {
    console.error(err);
  }
  return copyWithExecCommand(value);
};

export const copyBlob = async (blob) => {
  if (!blob) return false;
  try {
    if (!globalThis.navigator?.clipboard?.write || typeof ClipboardItem === 'undefined') return false;
    await globalThis.navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};
