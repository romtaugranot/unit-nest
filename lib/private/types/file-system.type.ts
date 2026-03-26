// Flag: `import *` is unavoidable — needed for `typeof fs` namespace type extraction (Rule 2)
import * as fs from 'fs';
// Flag: `import *` is unavoidable — needed for `typeof fsPromises` namespace type extraction (Rule 2)
import * as fsPromises from 'fs/promises';

export type FileSystemFunctions = {
  [K in keyof typeof fs]: (typeof fs)[K] extends Function ? K : never;
}[keyof typeof fs];

export type FileSystemSyncFunctions = Extract<
  FileSystemFunctions,
  `${string}Sync` | `${string}sync`
>;

export type FileSystemAsyncFunctions = {
  [K in keyof typeof fsPromises]: (typeof fsPromises)[K] extends Function
    ? K
    : never;
}[keyof typeof fsPromises];

// Flag: `any[]` is unavoidable — TypeScript conditional type inference
// requires `any[]` in parameter position to match all function signatures (Rule 9)
export type FileSystemReturn<M extends FileSystemSyncFunctions> =
  (typeof fs)[M] extends (...args: any[]) => infer R ? R : never;

// Flag: `any[]` is unavoidable — same reason as FileSystemReturn (Rule 9)
export type FileSystemReturnAsync<M extends FileSystemAsyncFunctions> =
  (typeof fsPromises)[M] extends (...args: any[]) => Promise<infer R>
    ? R
    : never;
