import { Provider } from './provider.type';

export type MethodKeys<T extends Provider> = {
  [K in keyof InstanceType<T>]: InstanceType<T>[K] extends Function ? K : never;
}[keyof InstanceType<T>];

export type MethodParams<
  T extends Provider,
  K extends MethodKeys<T>,
> = InstanceType<T>[K] extends (...args: infer A) => unknown ? A : never;

export type MethodReturn<
  T extends Provider,
  K extends MethodKeys<T>,
> = InstanceType<T>[K] extends (...args: any[]) => infer R ? R : any;

export type MethodReturnAsync<
  T extends Provider,
  K extends MethodKeys<T>,
> = InstanceType<T>[K] extends (...args: any[]) => Promise<infer R> ? R : any;
