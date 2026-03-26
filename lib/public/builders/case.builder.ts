import {
  AxiosFunctions,
  Expectation,
  FileSystemAsyncFunctions,
  FileSystemReturn,
  FileSystemReturnAsync,
  FileSystemSyncFunctions,
  MethodKeys,
  MethodParams,
  MethodReturn,
  MethodReturnAsync,
  MockConfiguration,
  ModuleMockConfiguration,
  Provider,
  SelfSpyConfiguration,
  TestCase,
  TestCaseStore,
} from '../../private';
import { SuiteBuilder } from './suite.builder';

export class CaseBuilder<S extends Provider, K extends MethodKeys<S>> {
  private testArgs: MethodParams<S, K> | undefined = undefined;
  private readonly testMocks: MockConfiguration<S>[];
  private readonly testModuleMocks: ModuleMockConfiguration[];
  private testExpectation: Expectation<S, K> | undefined = undefined;
  private readonly testSpies: SelfSpyConfiguration<S>[];

  constructor(
    private readonly suiteBuilder: SuiteBuilder<S, K>,
    private readonly caseStore: TestCaseStore<S, K>,
    private readonly description: string = 'No description',
  ) {
    this.testMocks = [];
    this.testModuleMocks = [];
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
   * Mock a CommonJS/ES module method via jest.mock
   */
  mockModuleReturn(
    moduleName: string,
    method: string,
    returnValue: unknown,
  ): this {
    this.testModuleMocks.push({
      moduleName,
      method,
      returnType: 'value',
      value: returnValue,
    });

    return this;
  }

  mockModuleReturnAsync(
    moduleName: string,
    method: string,
    returnValue: unknown,
  ): this {
    this.testModuleMocks.push({
      moduleName,
      method,
      returnType: 'asyncValue',
      value: returnValue,
    });

    return this;
  }

  mockModuleThrow(moduleName: string, method: string, error: unknown): this {
    this.testModuleMocks.push({
      moduleName,
      method,
      returnType: 'error',
      error,
    });

    return this;
  }

  mockModuleImplementation(
    moduleName: string,
    method: string,
    // Flag: `any[]` is unavoidable — function parameter contravariance (Rule 9)
    implementation: (...args: any[]) => unknown,
  ): this {
    this.testModuleMocks.push({
      moduleName,
      method,
      returnType: 'implementation',
      implementation,
    });

    return this;
  }

  /**
   * Sugar helpers for common modules
   */
  mockAxios(method: AxiosFunctions, value: unknown): this {
    return this.mockModuleReturn('axios', method, value);
  }

  mockFileSystem<M extends FileSystemSyncFunctions>(
    method: M,
    value: FileSystemReturn<M>,
  ): this {
    return this.mockModuleReturn('fs', method, value);
  }

  mockFileSystemAsync<M extends FileSystemAsyncFunctions>(
    method: M,
    value: FileSystemReturnAsync<M>,
  ): this {
    return this.mockModuleReturnAsync('fs/promises', method, value);
  }

  /** @deprecated Use `mockFileSystem` instead */
  mockFS<M extends FileSystemSyncFunctions>(
    method: M,
    value: FileSystemReturn<M>,
  ): this {
    return this.mockFileSystem(method, value);
  }

  /** @deprecated Use `mockFileSystemAsync` instead */
  mockFSAsync<M extends FileSystemAsyncFunctions>(
    method: M,
    value: FileSystemReturnAsync<M>,
  ): this {
    return this.mockFileSystemAsync(method, value);
  }

  /**
   * Spy on the service's own method and mock its return value
   */
  spyOnSelf<M extends MethodKeys<S>>(
    method: M,
    returnValue: MethodReturn<S, M>,
  ): this {
    this.testSpies.push({
      method,
      returnType: 'value',
      value: returnValue,
    });

    return this;
  }

  /**
   * Spy on the service's own method and mock its async return value
   */
  spyOnSelfAsync<M extends MethodKeys<S>>(
    method: M,
    returnValue: MethodReturnAsync<S, M>,
  ): this {
    this.testSpies.push({
      method,
      returnType: 'asyncValue',
      value: returnValue,
    });

    return this;
  }

  /**
   * Spy on the service's own method and mock it to throw an error
   */
  spyOnSelfThrow<M extends MethodKeys<S>>(method: M, error: unknown): this {
    this.testSpies.push({
      method,
      returnType: 'error',
      error,
    });

    return this;
  }

  /**
   * Spy on the service's own method and mock its implementation
   */
  spyOnSelfImplementation<M extends MethodKeys<S>>(
    method: M,
    implementation: InstanceType<S>[M],
  ): this {
    this.testSpies.push({
      method,
      returnType: 'implementation',
      implementation,
    });

    return this;
  }

  /**
   * Set the arguments for the test case
   */
  args(...testArgs: MethodParams<S, K>): this {
    this.testArgs = testArgs;

    return this;
  }

  /**
   * Set up expectations for the test case
   */
  expectReturn(expectedReturn: MethodReturn<S, K>): this {
    this.testExpectation = {
      expected: expectedReturn,
      isAsync: false,
    };

    return this;
  }

  expectThrow(error: unknown): this {
    this.testExpectation = {
      error,
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
    this.caseStore.addTestCase(this.testCase);

    return this.suiteBuilder;
  }

  private get testCase(): TestCase<S, K> {
    if (this.testExpectation === undefined) {
      throw new Error('Test expectation must be set before calling doneCase()');
    }

    return {
      description: this.description,
      // Flag: assertion is unavoidable — TypeScript cannot verify that an empty
      // array satisfies an arbitrary parameter tuple type (Rule 10)
      args: this.testArgs ?? ([] as unknown as MethodParams<S, K>),
      mocks: this.testMocks,
      moduleMocks: this.testModuleMocks,
      expectation: this.testExpectation,
      spies: this.testSpies,
    };
  }
}
