import { Type } from '@nestjs/common';
import { MethodKeys } from '../types';

export interface MockReturnValueConfiguration<T extends Type> {
  provider: Type;
  method: MethodKeys<T>;
  returnType: 'value';
  value: unknown;
}

export interface MockReturnAsyncValueConfiguration<T extends Type> {
  provider: Type;
  method: MethodKeys<T>;
  returnType: 'asyncValue';
  value: unknown;
}

export interface MockThrowConfiguration<T extends Type> {
  provider: Type;
  method: MethodKeys<T>;
  returnType: 'error';
  error: unknown;
}

export interface MockImplementationConfiguration<T extends Type> {
  provider: Type;
  method: MethodKeys<T>;
  returnType: 'implementation';
  implementation: InstanceType<T>[MethodKeys<T>];
}

export type MockConfiguration<T extends Type> =
  | MockReturnValueConfiguration<T>
  | MockReturnAsyncValueConfiguration<T>
  | MockThrowConfiguration<T>
  | MockImplementationConfiguration<T>;
