import { MethodKeys, Provider, TestSuiteStore } from '../../private';
import { SuiteBuilder } from './suite.builder';

export class TestsBuilder<S extends Provider> {
  private readonly providers: Provider[];
  private readonly cut: S;
  private readonly suiteStore: TestSuiteStore<S, MethodKeys<S>>;

  constructor(cut: S, ...providers: Provider[]) {
    this.providers = providers;
    this.cut = cut;
    this.suiteStore = new TestSuiteStore<S, MethodKeys<S>>();
  }

  /**
   * Add a test suite for a specific method
   */
  addSuite(method: MethodKeys<S>): SuiteBuilder<S, MethodKeys<S>> {
    return new SuiteBuilder<S, MethodKeys<S>>(method, this, this.suiteStore);
  }

  run(): void {}
}
