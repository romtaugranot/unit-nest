import {
  MethodKeys,
  Provider,
  NestProvider,
  TestsExecuter,
  TestSuiteStore,
  AutoMockResolver,
} from '../../private';
import { SuiteBuilder } from './suite.builder';

export class TestsBuilder<S extends Provider> {
  private readonly suiteStore: TestSuiteStore<S, MethodKeys<S>>;
  private readonly testsExecuter: TestsExecuter<S>;
  private readonly allProviders: NestProvider[];

  constructor(cut: S, ...providers: NestProvider[]) {
    // Always enable shallow mocking - automatically mock missing dependencies
    const classProviders = providers.filter(p => typeof p === 'function');

    // Recursively find and auto-mock dependencies of dependencies
    const autoMocks = AutoMockResolver.createAutoMocks(classProviders, cut);

    this.allProviders = [...providers, ...autoMocks];

    this.testsExecuter = new TestsExecuter<S>(cut, this.allProviders);
    this.suiteStore = new TestSuiteStore<S, MethodKeys<S>>();
  }

  /**
   * Add a test suite for a specific method
   */
  addSuite<K extends MethodKeys<S>>(method: K): SuiteBuilder<S, K> {
    return new SuiteBuilder<S, K>(method, this, this.suiteStore);
  }

  /**
   * Run all test suites
   */
  async run(): Promise<void> {
    await this.testsExecuter.execute(this.suiteStore.suites);
  }
}
