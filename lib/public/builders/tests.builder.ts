import {
  MethodKeys,
  Provider,
  NestProvider,
  TestsExecuter,
  TestSuiteStore,
} from '../../private';
import { SuiteBuilder } from './suite.builder';

export class TestsBuilder<S extends Provider> {
  private readonly suiteStore: TestSuiteStore<S, MethodKeys<S>>;
  private readonly testsExecuter: TestsExecuter<S>;

  constructor(cut: S, ...providers: NestProvider[]) {
    this.testsExecuter = new TestsExecuter<S>(cut, providers);

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
