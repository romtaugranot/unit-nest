import { MethodKeys, Provider } from '../types';

export interface SelfSpyReturnValueConfiguration<S extends Provider> {
  method: MethodKeys<S>;
  returnType: 'value';
  value: unknown;
}

export interface SelfSpyReturnAsyncValueConfiguration<S extends Provider> {
  method: MethodKeys<S>;
  returnType: 'asyncValue';
  value: unknown | Promise<unknown>;
}

export interface SelfSpyThrowConfiguration<S extends Provider> {
  method: MethodKeys<S>;
  returnType: 'error';
  error: unknown;
}

export interface SelfSpyImplementationConfiguration<S extends Provider> {
  method: MethodKeys<S>;
  returnType: 'implementation';
  implementation: InstanceType<S>[MethodKeys<S>];
}

export type SelfSpyConfiguration<S extends Provider> =
  | SelfSpyReturnValueConfiguration<S>
  | SelfSpyReturnAsyncValueConfiguration<S>
  | SelfSpyThrowConfiguration<S>
  | SelfSpyImplementationConfiguration<S>;
