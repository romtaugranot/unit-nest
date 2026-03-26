import {
  LifecycleHookName,
  InitLifecycleHookName,
  ShutdownLifecycleHookName,
  MethodKeys,
  Provider,
  NestProvider,
} from '../types';
import { LifecycleHookConfiguration, TestSuite } from '../interfaces';
import { INIT_LIFECYCLE_HOOKS, SHUTDOWN_LIFECYCLE_HOOKS } from '../data';
import { Test, TestingModule } from '@nestjs/testing';
import { TestCaseExecuter } from './test-case.executer';

export class TestSuiteExecuter<S extends Provider, K extends MethodKeys<S>> {
  private readonly testCaseExecutor: TestCaseExecuter<S, K>;

  constructor(
    private readonly cut: S,
    private readonly providers: NestProvider[],
    private readonly lifecycleHookConfiguration: LifecycleHookConfiguration,
  ) {
    this.testCaseExecutor = new TestCaseExecuter<S, K>();
  }

  async executeSuite(suite: TestSuite<S, K>): Promise<void> {
    const { method, cases } = suite;

    describe(method.toString(), () => {
      let testingModule: TestingModule;
      let cutInstance: InstanceType<S>;

      beforeAll(async () => {
        testingModule = await this.compileTestingModule(suite);
        cutInstance = this.getCutInstance(testingModule);
      });

      afterAll(async () => {
        if (testingModule) {
          await this.closeTestingModule(testingModule, suite);
        }
      });

      for (const testCase of cases) {
        it(testCase.description, async () => {
          await this.testCaseExecutor.executeCase(
            method,
            testCase,
            testingModule,
            cutInstance,
          );
        });
      }
    });
  }

  private async compileTestingModule(
    suite: TestSuite<S, K>,
  ): Promise<TestingModule> {
    const hooksToSuppress = this.getInitHooksToSuppress(suite);
    const restoreFunctions = this.suppressHooks(hooksToSuppress);

    try {
      const moduleBuilder = Test.createTestingModule({
        providers: [this.cut, ...this.providers],
      });

      return await moduleBuilder.compile();
    } finally {
      for (const restore of restoreFunctions) {
        restore();
      }
    }
  }

  private async closeTestingModule(
    testingModule: TestingModule,
    suite: TestSuite<S, K>,
  ): Promise<void> {
    const hooksToSuppress = this.getShutdownHooksToSuppress(suite);
    const restoreFunctions = this.suppressHooks(hooksToSuppress);

    try {
      await testingModule.close();
    } finally {
      for (const restore of restoreFunctions) {
        restore();
      }
    }
  }

  private suppressHooks(
    hookNames: readonly LifecycleHookName[],
  ): Array<() => void> {
    const restoreFunctions: Array<() => void> = [];

    for (const hookName of hookNames) {
      if (typeof this.cut.prototype[hookName] === 'function') {
        const original = this.cut.prototype[hookName];
        this.cut.prototype[hookName] = (): Promise<void> => Promise.resolve();
        restoreFunctions.push(() => {
          this.cut.prototype[hookName] = original;
        });
      }
    }

    return restoreFunctions;
  }

  private getInitHooksToSuppress(
    suite: TestSuite<S, K>,
  ): readonly LifecycleHookName[] {
    const { suppressedHooks } = this.lifecycleHookConfiguration;
    const globalInit = INIT_LIFECYCLE_HOOKS.filter(
      (hook: InitLifecycleHookName) => suppressedHooks.has(hook),
    );

    if (
      suite.hookName !== undefined &&
      INIT_LIFECYCLE_HOOKS.includes(suite.hookName as InitLifecycleHookName)
    ) {
      const combined = new Set([...globalInit, suite.hookName]);
      return [...combined];
    }

    return globalInit;
  }

  private getShutdownHooksToSuppress(
    suite: TestSuite<S, K>,
  ): readonly LifecycleHookName[] {
    const { suppressedHooks } = this.lifecycleHookConfiguration;
    const globalShutdown = SHUTDOWN_LIFECYCLE_HOOKS.filter(
      (hook: ShutdownLifecycleHookName) => suppressedHooks.has(hook),
    );

    if (
      suite.hookName !== undefined &&
      SHUTDOWN_LIFECYCLE_HOOKS.includes(
        suite.hookName as ShutdownLifecycleHookName,
      )
    ) {
      const combined = new Set([...globalShutdown, suite.hookName]);
      return [...combined];
    }

    return globalShutdown;
  }

  private getCutInstance(testingModule: TestingModule): InstanceType<S> {
    return testingModule.get<InstanceType<S>>(this.cut);
  }
}
