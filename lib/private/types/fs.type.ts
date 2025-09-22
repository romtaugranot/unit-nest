import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

export type FsFunctions = {
  [K in keyof typeof fs]: (typeof fs)[K] extends Function ? K : never;
}[keyof typeof fs];

export type FsSyncFunctions = Extract<
  FsFunctions,
  `${string}Sync` | `${string}sync`
>;

export type FsAsyncFunctions = {
  [K in keyof typeof fsPromises]: (typeof fsPromises)[K] extends Function
    ? K
    : never;
}[keyof typeof fsPromises];

export type FsReturn<M extends FsSyncFunctions> = (typeof fs)[M] extends (
  ...args: any[]
) => infer R
  ? R
  : never;

export type FsReturnAsync<M extends FsAsyncFunctions> =
  (typeof fsPromises)[M] extends (...args: any[]) => Promise<infer R>
    ? R
    : never;
