import {
  MethodKeys,
  Provider,
  TestsExecuter,
  TestSuiteStore,
} from '../../private';
import { SuiteBuilder } from './suite.builder';

export class TestsBuilder<S extends Provider> {
  private readonly suiteStore: TestSuiteStore<S, MethodKeys<S>>;
  private readonly testsExecuter: TestsExecuter<S>;

  constructor(cut: S, ...providers: Provider[]) {
    this.testsExecuter = new TestsExecuter<S>(cut, providers);

    this.suiteStore = new TestSuiteStore<S, MethodKeys<S>>();
  }

  /**
   * Add a test suite for a specific method
   */
  addSuite(method: MethodKeys<S>): SuiteBuilder<S, MethodKeys<S>> {
    return new SuiteBuilder<S, MethodKeys<S>>(method, this, this.suiteStore);
  }

  /**
   * Run all test suites
   */
  async run(): Promise<void> {
    await this.testsExecuter.execute(this.suiteStore.suites);
  }
}
