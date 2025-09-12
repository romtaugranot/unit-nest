import {
  MethodKeys,
  MethodParams,
  MethodReturn,
  MethodReturnAsync,
  Provider,
} from '../../private';
import { SuiteBuilder } from './suite.builder';

export class CaseBuilder<S, K extends MethodKeys<S>> {
  constructor(
    private readonly _method: K,
    private readonly _providers: Provider[],
    private readonly _suiteBuilder: SuiteBuilder<S, K>,
  ) {
    void this._method;
    void this._providers;
  }

  /**
   * Mock a provider method to return a specific value
   */
  mockReturnValue<T, M extends MethodKeys<T> = MethodKeys<T>>(
    _returnValue: MethodReturn<T, M>,
  ): this {
    return this;
  }

  /**
   * Mock a provider method to return a specific value
   */
  mockReturnAsyncValue<T, M extends MethodKeys<T> = MethodKeys<T>>(
    _returnValue: MethodReturn<T, M>,
  ): this {
    return this;
  }

  /**
   * Mock a provider method to throw an error
   */
  mockThrow<T extends Provider, M extends MethodKeys<T>>(
    _provider: T,
    _method: M,
    _error: unknown,
  ): this {
    return this;
  }

  /**
   * Mock a provider method with a custom implementation
   */
  mockImplementation<T extends Provider, M extends MethodKeys<T>>(
    _provider: T,
    _method: M,
    _implementation: T[M],
  ): this {
    return this;
  }

  /**
   * Spy on the service's own method
   */
  spyOnSelf(): this {
    return this;
  }

  /**
   * Set the arguments for the test case
   */
  args(..._args: MethodParams<S, K>): this {
    return this;
  }

  /**
   * Set up expectations for the test case
   */
  expect(_expectedReturn: MethodReturn<S, K>): this {
    return this;
  }

  /**
   * Syntactic sugar for .expect() with async return value
   */
  expectAsync(_expectedReturn: MethodReturnAsync<S, K>): this {
    return this;
  }

  /**
   * Complete the current test case and return to the suite builder
   */
  doneCase(): SuiteBuilder<S, K> {
    return this._suiteBuilder;
  }
}
