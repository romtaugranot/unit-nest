import { TestSuite } from '../interfaces';
import { MethodKeys, Provider } from '../types';

export class TestSuiteStore<S extends Provider, K extends MethodKeys<S>> {
  private readonly testSuites: TestSuite<S, K>[];

  constructor() {
    this.testSuites = [];
  }

  addTestSuite(testSuite: TestSuite<S, K>): void {
    this.testSuites.push(testSuite);
  }

  get suites(): TestSuite<S, K>[] {
    return this.testSuites;
  }
}
