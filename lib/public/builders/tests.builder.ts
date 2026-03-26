import {
  ALL_LIFECYCLE_HOOKS,
  LifecycleHookConfiguration,
  LifecycleHookName,
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
  private readonly allProviders: NestProvider[];
  private readonly cut: S;
  private readonly suppressedHooks: Set<LifecycleHookName>;

  constructor(cut: S, ...providers: NestProvider[]) {
    const classProviders = providers.filter(
      provider => typeof provider === 'function',
    );

    const autoMocks = AutoMockResolver.createAutoMocks(classProviders);

    this.cut = cut;
    this.allProviders = [...providers, ...autoMocks];
    this.suiteStore = new TestSuiteStore<S, MethodKeys<S>>();
    this.suppressedHooks = new Set<LifecycleHookName>();
  }

  /**
   * Add a test suite for a specific method
   */
  addSuite<K extends MethodKeys<S>>(method: K): SuiteBuilder<S, K> {
    return new SuiteBuilder<S, K>(method, this, this.suiteStore);
  }

  /**
   * Add a test suite for a lifecycle hook method.
   * Automatically suppresses the hook's auto-execution during module compile/close
   * for this suite only. Regular suites are unaffected.
   */
  addHookSuite<K extends MethodKeys<S> & LifecycleHookName>(
    hookName: K,
  ): SuiteBuilder<S, K> {
    return new SuiteBuilder<S, K>(hookName, this, this.suiteStore, true);
  }

  /**
   * Suppress lifecycle hooks globally for all suites without testing them.
   * If no arguments, suppresses all 5 hooks.
   */
  suppressLifecycleHooks(...hookNames: LifecycleHookName[]): this {
    const hooksToSuppress =
      hookNames.length > 0 ? hookNames : ALL_LIFECYCLE_HOOKS;

    for (const hook of hooksToSuppress) {
      this.suppressedHooks.add(hook);
    }

    return this;
  }

  /**
   * Run all test suites
   */
  async run(): Promise<void> {
    const configuration: LifecycleHookConfiguration = {
      suppressedHooks: new Set(this.suppressedHooks),
    };

    const testsExecuter = new TestsExecuter<S>(
      this.cut,
      this.allProviders,
      configuration,
    );

    await testsExecuter.execute(this.suiteStore.suites);
  }
}
