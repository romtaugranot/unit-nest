import {
  MethodKeys,
  MethodReturn,
  MethodReturnAsync,
  Provider,
} from '../types';

export interface ReturnExpectation<
  S extends Provider,
  K extends MethodKeys<S>,
> {
  expected: MethodReturn<S, K>;
  isAsync: false;
}

export interface AsyncReturnExpectation<
  S extends Provider,
  K extends MethodKeys<S>,
> {
  expected: MethodReturnAsync<S, K>;
  isAsync: true;
}

export interface ThrowExpectation {
  error: unknown;
}

export type Expectation<S extends Provider, K extends MethodKeys<S>> =
  | ReturnExpectation<S, K>
  | AsyncReturnExpectation<S, K>
  | ThrowExpectation;
