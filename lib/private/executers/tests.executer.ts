import { MethodKeys, Provider } from '../types';
import { TestSuite } from '../interfaces';
import { TestSuiteExecuter } from './test-suite.executer';

export class TestsExecuter<S extends Provider> {
  private readonly testSuiteExecutor: TestSuiteExecuter<S, MethodKeys<S>>;

  constructor(cut: S, providers: Provider[]) {
    this.testSuiteExecutor = new TestSuiteExecuter<S, MethodKeys<S>>(
      cut,
      providers,
    );
  }

  async execute(suites: TestSuite<S, MethodKeys<S>>[]): Promise<void> {
    await Promise.all(
      suites.map(suite => this.testSuiteExecutor.executeSuite(suite)),
    );
  }
}
