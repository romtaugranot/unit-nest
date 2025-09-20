import { MethodKeys, Provider } from '../types';

export interface MockReturnValueConfiguration<T extends Provider> {
  provider: Provider;
  method: MethodKeys<T>;
  returnType: 'value';
  value: unknown;
}

export interface MockReturnAsyncValueConfiguration<T extends Provider> {
  provider: Provider;
  method: MethodKeys<T>;
  returnType: 'asyncValue';
  value: unknown;
}

export interface MockThrowConfiguration<T extends Provider> {
  provider: Provider;
  method: MethodKeys<T>;
  returnType: 'error';
  error: unknown;
}

export interface MockImplementationConfiguration<T extends Provider> {
  provider: Provider;
  method: MethodKeys<T>;
  returnType: 'implementation';
  implementation: InstanceType<T>[MethodKeys<T>];
}

export type MockConfiguration<T extends Provider> =
  | MockReturnValueConfiguration<T>
  | MockReturnAsyncValueConfiguration<T>
  | MockThrowConfiguration<T>
  | MockImplementationConfiguration<T>;
