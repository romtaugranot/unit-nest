import { Provider } from './provider.type';

export type MethodKeys<T extends Provider> = {
  [K in keyof InstanceType<T>]: InstanceType<T>[K] extends Function ? K : never;
}[keyof InstanceType<T>];

export type MethodParams<
  T extends Provider,
  K extends MethodKeys<T>,
> = InstanceType<T>[K] extends (...args: infer A) => unknown ? A : never;

// Flag: `any[]` is unavoidable here — TypeScript conditional type inference
// requires `any[]` in parameter position to match all function signatures (Rule 9)
export type MethodReturn<
  T extends Provider,
  K extends MethodKeys<T>,
> = InstanceType<T>[K] extends (...args: any[]) => infer R ? R : never;

// Flag: `any[]` is unavoidable here — same reason as MethodReturn (Rule 9)
export type MethodReturnAsync<
  T extends Provider,
  K extends MethodKeys<T>,
> = InstanceType<T>[K] extends (...args: any[]) => Promise<infer R> ? R : never;
