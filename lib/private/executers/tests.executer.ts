import { MethodKeys, Provider, NestProvider } from '../types';
import { LifecycleHookConfiguration, TestSuite } from '../interfaces';
import { TestSuiteExecuter } from './test-suite.executer';

export class TestsExecuter<S extends Provider> {
  private readonly testSuiteExecutor: TestSuiteExecuter<S, MethodKeys<S>>;

  constructor(
    cut: S,
    providers: NestProvider[],
    lifecycleHookConfiguration: LifecycleHookConfiguration,
  ) {
    this.testSuiteExecutor = new TestSuiteExecuter<S, MethodKeys<S>>(
      cut,
      providers,
      lifecycleHookConfiguration,
    );
  }

  async execute(suites: TestSuite<S, MethodKeys<S>>[]): Promise<void> {
    await Promise.all(
      suites.map(
        async suite => await this.testSuiteExecutor.executeSuite(suite),
      ),
    );
  }
}
