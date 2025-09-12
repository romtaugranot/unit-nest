export type MethodKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export type MethodParams<T, K extends MethodKeys<T>> = T[K] extends (
  ...args: infer A
) => unknown
  ? A
  : never;

export type MethodReturn<T, K extends MethodKeys<T>> = T[K] extends (
  ...args: any[]
) => infer R
  ? R
  : any;

export type MethodReturnAsync<T, K extends MethodKeys<T>> = T[K] extends (
  ...args: any[]
) => Promise<infer R>
  ? R
  : any;
