// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 340ef2ccfa460673b759369dabf8996eb11d8086.
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
