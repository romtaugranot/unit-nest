import { MethodKeys, Provider } from '../types';
import { TestSuite } from '../interfaces';
import { Test, TestingModule } from '@nestjs/testing';
import { TestCaseExecuter } from './test-case.executer';

export class TestSuiteExecuter<S extends Provider, K extends MethodKeys<S>> {
  private readonly testCaseExecutor: TestCaseExecuter<S, K>;

  constructor(
    private readonly cut: S,
    private readonly providers: Provider[],
  ) {
    this.providers = providers;
    this.cut = cut;

    this.testCaseExecutor = new TestCaseExecuter<S, K>();
  }

  async executeSuite({ method, cases }: TestSuite<S, K>): Promise<void> {
    describe(method.toString(), () => {
      let testingModule: TestingModule;
      let cutInstance: InstanceType<S>;

      beforeAll(async () => {
        testingModule = await this.compileTestingModule();
        cutInstance = this.getCutInstance(testingModule);
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

  /**
   * Compile the NestJS TestingModule
   */
  async compileTestingModule(): Promise<TestingModule> {
    const moduleBuilder = Test.createTestingModule({
      providers: [this.cut, ...this.providers],
    });

    return await moduleBuilder.compile();
  }

  /**
   * Get the compiled CUT instance
   */
  getCutInstance(testingModule: TestingModule): InstanceType<S> {
    return testingModule.get<InstanceType<S>>(this.cut);
  }
}
