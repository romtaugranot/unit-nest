import { CaseBuilder } from './case.builder';
import {
  MethodKeys,
  Provider,
  TestCaseStore,
  TestSuite,
  TestSuiteStore,
} from '../../private';
import { TestsBuilder } from './tests.builder';

export class SuiteBuilder<S extends Provider, K extends MethodKeys<S>> {
  private readonly caseStore: TestCaseStore<S, K>;

  constructor(
    private readonly method: K,
    private readonly testsBuilder: TestsBuilder<S>,
    private readonly suiteStore: TestSuiteStore<S, K>,
  ) {
    this.caseStore = new TestCaseStore<S, K>();
  }

  /**
   * Add a test case for this method
   */
  addCase(): CaseBuilder<S, K> {
    return new CaseBuilder<S, K>(this, this.caseStore);
  }

  /**
   * Complete the current test suite and return to the tests builder
   */
  doneSuite(): TestsBuilder<S> {
    this.suiteStore.addTestSuite(this.suite);

    return this.testsBuilder;
  }

  private get suite(): TestSuite<S, K> {
    return {
      method: this.method,
      cases: this.caseStore.cases,
    };
  }
}
