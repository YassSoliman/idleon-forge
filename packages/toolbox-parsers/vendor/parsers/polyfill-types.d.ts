// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
declare global {
  interface Array<T> {
    toSimpleObject(val?: boolean): Record<string | number, boolean>;
    toChunks(perChunk: number): T[][];
    toObjectByIndex(): Record<string, T>;
  }
  interface String {
    capitalize(): string;
    camelToTitleCase(): string;
    capitalizeAllWords(): string;
    capitalizeAll(): string;
    firstCharLowerCase(): string;
    toCamelCase(): string;
  }
  interface Date {
    stdTimezoneOffset(): number;
    isDstObserved(): boolean;
  }
}
export {};
