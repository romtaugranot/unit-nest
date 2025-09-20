import {
  Expectation,
  MethodKeys,
  MethodParams,
  MethodReturn,
  MethodReturnAsync,
  MockConfiguration,
  Provider,
  SpyConfiguration,
  TestCase,
  TestCaseStore,
} from '../../private';
import { SuiteBuilder } from './suite.builder';

export class CaseBuilder<S extends Provider, K extends MethodKeys<S>> {
  private testArgs!: MethodParams<S, K>;
  private testMocks: MockConfiguration<S>[];
  private testExpectation!: Expectation<S, K>;
  private testSpies: SpyConfiguration[];

  constructor(
    private readonly suiteBuilder: SuiteBuilder<S, K>,
    private readonly caseStore: TestCaseStore<S, K>,
  ) {
    this.testMocks = [];
    this.testSpies = [];
  }

  /**
   * Mock a provider method to return a specific value
   */
  mockReturnValue<T extends Provider, M extends MethodKeys<T>>(
    provider: T,
    method: M,
    returnValue: MethodReturn<T, M>,
  ): this {
    this.testMocks.push({
      provider,
      method,
      returnType: 'value',
      value: returnValue,
    });

    return this;
  }

  /**
   * Mock a provider method to return a specific value
   */
  mockReturnAsyncValue<T extends Provider, M extends MethodKeys<T>>(
    provider: T,
    method: M,
    returnValue: MethodReturnAsync<T, M>,
  ): this {
    this.testMocks.push({
      provider,
      method,
      returnType: 'asyncValue',
      value: returnValue,
    });

    return this;
  }

  /**
   * Mock a provider method to throw an error
   */
  mockThrow<T extends Provider, M extends MethodKeys<T>>(
    provider: T,
    method: M,
    error: unknown,
  ): this {
    this.testMocks.push({
      provider,
      method,
      returnType: 'error',
      error,
    });

    return this;
  }

  /**
   * Mock a provider method with a custom implementation
   */
  mockImplementation<T extends Provider, M extends MethodKeys<T>>(
    provider: T,
    method: M,
    implementation: InstanceType<T>[M],
  ): this {
    this.testMocks.push({
      provider,
      method,
      returnType: 'implementation',
      implementation,
    });

    return this;
  }

  /**
   * Spy on the service's own method
   */
  spyOnSelf(): this {
    // TODO

    return this;
  }

  /**
   * Set the arguments for the test case
   */
  args(...args: MethodParams<S, K>): this {
    this.testArgs = args;

    return this;
  }

  /**
   * Set up expectations for the test case
   */
  expect(expectedReturn: MethodReturn<S, K>): this {
    this.testExpectation = {
      expected: expectedReturn,
      isAsync: false,
    };

    return this;
  }

  /**
   * Syntactic sugar for .expect() with async return value
   */
  expectAsync(expectedReturn: MethodReturnAsync<S, K>): this {
    this.testExpectation = {
      expected: expectedReturn,
      isAsync: true,
    };

    return this;
  }

  /**
   * Complete the current test case and return to the suite builder
   */
  doneCase(): SuiteBuilder<S, K> {
    this.caseStore.addTestCase(this.case);

    return this.suiteBuilder;
  }

  private get case(): TestCase<S, K> {
    return {
      args: this.testArgs,
      mocks: this.testMocks,
      expectation: this.testExpectation,
      spies: this.testSpies,
    };
  }
}
