import { Test, TestingModule } from '@nestjs/testing';
import { MethodKeys, Provider, TestSuiteStore } from '../../private';
import { SuiteBuilder } from './suite.builder';

export class TestsBuilder<S extends Provider> {
  private readonly providers: Provider[];
  private readonly cut: S;
  private readonly suiteStore: TestSuiteStore<S, MethodKeys<S>>;

  private testingModule: TestingModule | null = null;
  private _cutInstance: InstanceType<S> | null = null;

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

  /**
   * Create and compile the NestJS TestingModule
   */
  private async createTestingModule(): Promise<void> {
    const moduleBuilder = Test.createTestingModule({
      providers: [this.cut, ...this.providers],
    });

    this.testingModule = await moduleBuilder.compile();

    this._cutInstance = this.testingModule.get<InstanceType<S>>(this.cut);
  }

  /**
   * Get the compiled CUT instance
   */
  get cutInstance(): InstanceType<S> {
    if (!this._cutInstance) {
      throw new Error('TestingModule not compiled. Call run() first.');
    }

    return this._cutInstance;
  }

  /**
   * Run all test suites
   */
  async run(): Promise<void> {
    await this.createTestingModule();

    // TODO: Implement test execution logic
  }
}
