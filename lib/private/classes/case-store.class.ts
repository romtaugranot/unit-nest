import { TestCase } from '../interfaces';
import { MethodKeys, Provider } from '../types';

export class TestCaseStore<S extends Provider, K extends MethodKeys<S>> {
  private readonly testCases: TestCase<S, K>[];

  constructor() {
    this.testCases = [];
  }

  addTestCase(testCase: TestCase<S, K>): void {
    this.testCases.push(testCase);
  }

  get cases(): TestCase<S, K>[] {
    return this.testCases;
  }
}
